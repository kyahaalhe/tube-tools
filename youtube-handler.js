// Shared API handler: works on Vercel (serverless) and in server.js (Express)
const fail = (res, status, error) => res.status(status).json({ ok: false, error });
const KEY_NAME = "YOUTUBE_API_KEY";

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

async function yt(endpoint, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
    Object.entries({ ...params, key: process.env[KEY_NAME] }).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url);
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error?.message || `YouTube API error. HTTP ${r.status}`);
    return data;
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
        if (!process.env[KEY_NAME]) return fail(res, 500, "YOUTUBE_API_KEY is missing from the .env file.");
        const mode = req.query.mode;

        if (mode === "status") return res.json({ ok: true, message: "YouTube API connection is working." });

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
            res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
            return res.json({ ok: true, items });
        }

        if (mode === "analyze") {
            const raw = String(req.query.url || "").trim();
            if (!raw) return fail(res, 400, "Please enter a YouTube video URL.");
            const videoId = extractVideoId(raw);
            if (!videoId) return fail(res, 400, "Invalid YouTube video URL.");

            const vd = await yt("videos", { part: "snippet,statistics,contentDetails", id: videoId });
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

            res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
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

        return fail(res, 400, "Invalid mode. Use status, search or analyze.");
    } catch (error) {
        console.error("YouTube API error:", error);
        return fail(res, 500, error.message || "Unexpected server error.");
    }
}

module.exports = handler;
