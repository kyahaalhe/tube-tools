// Shared API handler: works on Vercel (serverless) and in server.js (Express)
const fail = (res, status, error) => res.status(status).json({ ok: false, error });

function extractVideoId(raw) {
    try {
        const u = new URL(raw);
        const host = u.hostname.replace(/^www\./, "");
        if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
        if (host === "youtube.com" || host.endsWith(".youtube.com")) {
            if (u.pathname === "/watch") return u.searchParams.get("v");
            const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
            if (m) return m[2];
        }
        return null;
    } catch {
        return null;
    }
}

// ---- API keys -------------------------------------------------------------
// YOUTUBE_API_KEY is the main key. Optional backups: YOUTUBE_API_KEY_2, YOUTUBE_API_KEY_3 or YOUTUBE_API_KEYS (comma separated).
// Backup keys must belong to the SAME Google Cloud project (they share one quota). We only switch keys when a key itself
// is broken (invalid, expired, blocked, network error). A "quota exceeded" error never triggers a switch: Google forbids
// using several projects to get around the quota.
function getKeys() {
    const raw = [process.env.YOUTUBE_API_KEY, process.env.YOUTUBE_API_KEY_2, process.env.YOUTUBE_API_KEY_3, ...(process.env.YOUTUBE_API_KEYS || "").split(",")];
    return [...new Set(raw.map(k => (k || "").trim()).filter(Boolean))];
}
const badUntil = new Map();
const isQuotaError = (data, msg) => /quota|dailyLimitExceeded|rateLimitExceeded/i.test(msg) || (data?.error?.errors || []).some(e => /quotaExceeded|dailyLimitExceeded|rateLimitExceeded/.test(e.reason || ""));
const isKeyProblem = (status, msg) => /api key|keyInvalid|keyExpired|referer|ip address|not been used|accessNotConfigured|suspended|disabled|not authorized/i.test(msg) || status === 401;

async function yt(endpoint, params) {
    const keys = getKeys();
    if (!keys.length) throw new Error("YOUTUBE_API_KEY is missing from the .env file.");
    const ready = keys.filter(k => (badUntil.get(k) || 0) < Date.now());
    let lastErr;
    for (const key of [...ready, ...keys.filter(k => !ready.includes(k))]) {
        const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
        Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
        let r, data;
        try {
            r = await fetch(url);
            data = await r.json().catch(() => null);
        } catch (e) {
            lastErr = Object.assign(new Error("Could not reach YouTube. Please try again."), { network: true });
            continue;
        }
        if (r.ok) return data;
        const msg = data?.error?.message || `YouTube API error. HTTP ${r.status}`;
        const err = new Error(msg);
        if (isQuotaError(data, msg)) { err.quota = true; throw err; }
        if (isKeyProblem(r.status, msg)) { badUntil.set(key, Date.now() + 3600e3); lastErr = err; continue; }
        throw err;
    }
    throw lastErr || new Error("YouTube API request failed.");
}

async function oembed(videoId) {
    try {
        const r = await fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + videoId));
        return r.ok ? await r.json() : null;
    } catch { return null; }
}

const toSeconds = iso => {
    const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "") || [];
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
};

// Views of the channel's recent uploads — used to tell if this video beat the channel's normal range
async function channelBaseline(uploadsId, excludeId) {
    if (!uploadsId) return null;
    const p = await yt("playlistItems", { part: "contentDetails", playlistId: uploadsId, maxResults: 15 });
    const ids = (p.items || []).map(i => i.contentDetails.videoId).filter(id => id !== excludeId).slice(0, 12);
    if (!ids.length) return null;
    const v = await yt("videos", { part: "snippet,statistics", id: ids.join(",") });
    const recent = (v.items || []).map(i => ({
        videoId: i.id,
        title: i.snippet?.title || "",
        views: parseInt(i.statistics?.viewCount || "0", 10),
        publishedAt: i.snippet?.publishedAt || ""
    }));
    if (!recent.length) return null;
    const sorted = recent.map(x => x.views).sort((a, b) => a - b);
    return {
        recent,
        median: sorted[Math.floor(sorted.length / 2)] || 0,
        avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
    };
}

async function handler(req, res) {
    try {
        if (!getKeys().length) return fail(res, 500, "YOUTUBE_API_KEY is missing from the .env file.");
        const mode = req.query.mode;

        if (mode === "status") return res.json({ ok: true, message: "YouTube API connection is working.", keys: getKeys().length });

        if (mode === "search") {
            const q = String(req.query.q || "").trim();
            if (!q) return fail(res, 400, "Please enter a search query.");
            let max = parseInt(req.query.maxResults || "10", 10);
            if (Number.isNaN(max)) max = 10;
            max = Math.max(1, Math.min(max, 50));
            const data = await yt("search", { part: "snippet", type: "video", maxResults: max, q });
            const items = (data.items || [])
                .filter(i => i.id?.videoId)
                .map(i => ({
                    videoId: i.id.videoId,
                    title: i.snippet?.title || "",
                    description: i.snippet?.description || "",
                    thumbnail: i.snippet?.thumbnails?.medium?.url || i.snippet?.thumbnails?.default?.url || "",
                    channelTitle: i.snippet?.channelTitle || "",
                    publishedAt: i.snippet?.publishedAt || ""
                }));
            res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=43200");
            return res.json({ ok: true, items });
        }

        if (mode === "analyze") {
            const raw = String(req.query.url || "").trim();
            if (!raw) return fail(res, 400, "Please enter a YouTube video URL.");
            const videoId = extractVideoId(raw);
            if (!videoId) return fail(res, 400, "Invalid YouTube video URL.");

            let vd;
            try {
                vd = await yt("videos", { part: "snippet,statistics,contentDetails", id: videoId });
            } catch (e) {
                if (!e.quota) throw e;
                const o = await oembed(videoId);
                if (!o) throw e;
                res.setHeader("Cache-Control", "s-maxage=60");
                return res.json({
                    ok: true, limited: true,
                    notice: "The daily YouTube API quota is used up, so this is limited mode: title, channel and thumbnail only. The viral analysis comes back after the quota resets (midnight Pacific time, about 12–1 PM in Pakistan).",
                    video: { videoId, url: `https://www.youtube.com/watch?v=${videoId}`, title: o.title || "", description: "", tags: [], thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, channelTitle: o.author_name || "", publishedAt: "", durationSec: 0 }
                });
            }
            const video = vd.items?.[0];
            if (!video) return fail(res, 404, "Video not found. Make sure the video is public.");

            const sn = video.snippet || {};
            const views = parseInt(video.statistics?.viewCount || "0", 10);
            const likes = parseInt(video.statistics?.likeCount || "0", 10);
            const comments = parseInt(video.statistics?.commentCount || "0", 10);

            let channel = null;
            if (sn.channelId) {
                try {
                    const cd = await yt("channels", { part: "statistics,contentDetails", id: sn.channelId });
                    const ch = cd.items?.[0];
                    if (ch) {
                        let baseline = null;
                        try {
                            baseline = await channelBaseline(ch.contentDetails?.relatedPlaylists?.uploads, videoId);
                        } catch (e) {
                            console.error("Baseline lookup failed:", e.message);
                        }
                        channel = {
                            subscribers: parseInt(ch.statistics?.subscriberCount || "0", 10),
                            videos: parseInt(ch.statistics?.videoCount || "0", 10),
                            baseline
                        };
                    }
                } catch (e) {
                    console.error("Channel lookup failed:", e.message);
                }
            }

            const days = Math.max(1, (Date.now() - new Date(sn.publishedAt).getTime()) / 86400000);

            res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
            return res.json({
                ok: true,
                video: {
                    videoId,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    title: sn.title || "",
                    description: sn.description || "",
                    tags: sn.tags || [],
                    thumbnail: sn.thumbnails?.maxres?.url || sn.thumbnails?.high?.url || sn.thumbnails?.medium?.url || "",
                    channelTitle: sn.channelTitle || "",
                    publishedAt: sn.publishedAt || "",
                    durationSec: toSeconds(video.contentDetails?.duration)
                },
                stats: {
                    views,
                    likes,
                    comments,
                    viewsPerDay: views / days,
                    likeRate: views > 0 ? (likes / views) * 100 : 0,
                    commentRate: views > 0 ? (comments / views) * 100 : 0,
                    subscriberRatio: channel && channel.subscribers > 0 ? views / channel.subscribers : null
                },
                channel
            });
        }

        const mapVideo = i => ({
            videoId: i.id,
            title: i.snippet?.title || "",
            tags: (i.snippet?.tags || []).slice(0, 25),
            channelTitle: i.snippet?.channelTitle || "",
            publishedAt: i.snippet?.publishedAt || "",
            views: parseInt(i.statistics?.viewCount || "0", 10)
        });

        // Trending chart: 1 quota unit
        if (mode === "trending") {
            const region = String(req.query.region || "US").toUpperCase();
            const category = String(req.query.category || "0");
            if (!/^[A-Z]{2}$/.test(region) || !/^\d{1,3}$/.test(category)) return fail(res, 400, "Invalid region or category.");
            const params = { part: "snippet,statistics", chart: "mostPopular", regionCode: region, maxResults: 50 };
            if (category !== "0") params.videoCategoryId = category;
            const data = await yt("videos", params);
            res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
            return res.json({ ok: true, items: (data.items || []).map(mapVideo) });
        }

        // Niche deep dive: recent relevant videos for a topic (the client keeps the most viewed) (about 101 quota units, cached 6 hours)
        if (mode === "niche") {
            const q = String(req.query.q || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
            if (!q) return fail(res, 400, "Please enter a topic.");
            const after = new Date(Date.now() - 30 * 86400000).toISOString();
            const found = await yt("search", { part: "snippet", type: "video", order: "relevance", maxResults: 50, q, publishedAfter: after });
            const ids = (found.items || []).map(i => i.id?.videoId).filter(Boolean);
            if (!ids.length) return res.json({ ok: true, items: [] });
            const data = await yt("videos", { part: "snippet,statistics", id: ids.join(",") });
            res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate=43200");
            return res.json({ ok: true, items: (data.items || []).map(mapVideo) });
        }

        return fail(res, 400, "Invalid mode. Use status, search, analyze, trending or niche.");
    } catch (error) {
        console.error("YouTube API error:", error);
        if (error.quota || /quota/i.test(error.message || "")) return fail(res, 429, "The daily YouTube API quota is used up. It resets at midnight Pacific time (around 12–1 PM in Pakistan). The Video Analyzer and Trending mode use very little quota, so try again later.");
        return fail(res, 500, error.message || "Unexpected server error.");
    }
}

module.exports = handler;
