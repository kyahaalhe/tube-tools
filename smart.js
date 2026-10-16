/* TubeTools smart.js — topic engine, hashtag generator, viral video analyzer */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const fmt = n => Number(n || 0).toLocaleString();
const short = n => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n));
const cap = s => s.split(" ").map(w => (/[A-Z]/.test(w) || !w ? w : w[0].toUpperCase() + w.slice(1))).join(" ");
function copy(t, b) {
    navigator.clipboard?.writeText(t).then(() => {
        if (!b) return;
        const o = b.textContent; b.textContent = "Copied!";
        setTimeout(() => (b.textContent = o), 1200);
    });
}
$$(".nav-links a").forEach(a => a.getAttribute("href") === (location.pathname.split("/").pop() || "index.html") && a.classList.add("active"));

/* ================= TOPIC ENGINE ================= */
const STOP = new Set("a an the and or but of for to in on at by with from is are was were be been this that these those it its you your we our my me how what why when who which do does did can will just very so as into about over than then them they their there here not no yes vs official video new full part episode".split(" "));

const CATS = {
    gaming: { k: "game gaming gameplay minecraft fortnite roblox gta valorant pubg freefire walkthrough speedrun clash cod ps5 xbox stream", tags: ["gaming", "gameplay", "gamer"], sfx: ["gameplay", "tips and tricks", "walkthrough"], aud: "gamers",
        t: ["{T} — Pro Tips Nobody Tells You", "I Played {T} For 24 Hours (Here's What Happened)", "{T}: Beginner To Pro In One Video", "Stop Making These {T} Mistakes", "{T} — Best Settings & Strategy"],
        b: ["the exact strategy and settings used", "the mistakes that lose you matches", "a beginner-friendly breakdown you can copy"],
        h: "Show the best moment or biggest fail in the first 5 seconds, then rewind and explain it. Gaming viewers leave if the payoff isn't visible early." },
    tech: { k: "iphone android phone laptop ai chatgpt pc software app tech review gadget samsung windows gpu unboxing", tags: ["tech", "techreview", "gadgets"], sfx: ["review", "explained", "is it worth it"], aud: "tech fans",
        t: ["{T} Review — Is It Actually Worth It?", "{T}: What They Don't Tell You", "I Used {T} For 30 Days — Honest Verdict", "{T} vs The Competition (Clear Winner)", "{T} — Everything You Need To Know"],
        b: ["real-world testing, not spec-sheet talk", "who should buy it and who should skip it", "the honest pros and cons"],
        h: "Give the verdict in the first 10 seconds ('worth it / not worth it') and spend the rest proving it. Reviews that hide the answer lose retention." },
    howto: { k: "tutorial learn beginners course coding programming python javascript excel photoshop editing premiere guide setup install fix diy", tags: ["tutorial", "howto", "learn"], sfx: ["tutorial", "for beginners", "step by step"], aud: "learners",
        t: ["How To {T} (Step By Step For Beginners)", "{T} — The Easiest Way, Explained Simply", "{T}: 5 Mistakes Beginners Make", "Learn {T} Fast — Full Tutorial", "{T} In 10 Minutes (No Experience Needed)"],
        b: ["a step-by-step walkthrough from zero", "the common mistakes and how to fix them", "tips to get the result faster"],
        h: "Show the finished result in the first 5 seconds, then say 'here's exactly how'. Tutorials win when people see the outcome before the effort." },
    money: { k: "money earn income business invest stock crypto bitcoin finance freelance marketing startup passive hustle dropshipping", tags: ["money", "business", "makemoneyonline"], sfx: ["for beginners", "strategy", "mistakes to avoid"], aud: "people building income",
        t: ["{T}: What Actually Works (Honest Breakdown)", "How I'd Start {T} From Zero Today", "{T} — Mistakes That Cost Me Money", "{T} Explained For Beginners", "The Truth About {T} Nobody Admits"],
        b: ["what actually works and what doesn't", "a realistic starting plan", "the risks and mistakes to avoid"],
        h: "Open with a concrete result or number, then promise to show how. Be specific and honest about risk — vague income claims hurt trust." },
    fitness: { k: "workout gym fitness diet weight muscle yoga health running protein exercise", tags: ["fitness", "workout", "health"], sfx: ["workout", "routine", "for beginners"], aud: "people training",
        t: ["{T} — The Routine That Actually Works", "{T}: Do This, Not That", "{T} For Beginners (Simple Plan)", "I Tried {T} For 30 Days", "{T} Mistakes Slowing Your Progress"],
        b: ["a simple routine you can follow", "common mistakes that slow progress", "how to stay consistent"],
        h: "Start mid-movement or with a before/after, then give the plan. Keep the first 15 seconds free of long intros." },
    food: { k: "recipe cooking food chicken cake eat restaurant baking kitchen biryani", tags: ["food", "recipe", "cooking"], sfx: ["recipe", "easy recipe", "step by step"], aud: "home cooks",
        t: ["{T} Recipe — Easier Than You Think", "{T}: The Secret To Perfect Results", "How To Make {T} At Home (Step By Step)", "{T} — Mistakes Everyone Makes", "Restaurant-Style {T} In Minutes"],
        b: ["the full recipe with measurements", "the trick that makes it taste right", "common mistakes to avoid"],
        h: "Open with the finished dish close-up and the first bite. Food videos are shared when the result looks irresistible." },
    edu: { k: "history science facts explained documentary ancient pyramids space universe mystery truth discovery planet war empire", tags: ["education", "documentary", "science"], sfx: ["explained", "documentary", "facts"], aud: "curious viewers",
        t: ["The Truth About {T} (Nobody Explains This)", "{T}: What Experts Actually Found", "How {T} Really Works — Explained Simply", "7 Facts About {T} That Will Surprise You", "{T} — The Full Story"],
        b: ["what is known and what is still debated", "the key evidence explained simply", "surprising details most people miss"],
        h: "Open with the most surprising claim, then promise the proof. Curiosity-gap topics go viral when the first 30 seconds raise a question the viewer must see answered." },
    travel: { k: "travel vlog trip tour visit hotel village city country flight mountain", tags: ["travel", "vlog", "travelvlog"], sfx: ["travel guide", "vlog", "budget"], aud: "travellers",
        t: ["{T} — Is It Worth Visiting?", "{T} Travel Guide (Budget & Tips)", "I Spent 48 Hours In {T}", "{T}: What Nobody Tells You Before You Go", "{T} — Hidden Spots Most Tourists Miss"],
        b: ["what it costs and how to get there", "the best places and hidden spots", "tips to avoid common mistakes"],
        h: "Open with the single most stunning shot, then the question the video answers (cost, safety, worth it?)." },
    fun: { k: "challenge reaction funny comedy prank music song react survive last hours", tags: ["entertainment", "challenge", "viral"], sfx: ["challenge", "reaction", "full video"], aud: "viewers",
        t: ["{T} — You Won't Believe The Ending", "I Tried {T} (It Went Wrong)", "{T} Challenge — Who Wins?", "{T}: The Moment Everything Changed", "{T} — Funniest Moments"],
        b: ["the full story from start to finish", "the funniest and most surprising moments", "the final result"],
        h: "Start with the climax or the biggest moment, then go back to how it began. Entertainment lives on a strong first 5 seconds and a clear stake." },
    general: { k: [], tags: ["video", "youtube", "trending"], sfx: ["explained", "guide", "tips"], aud: "viewers",
        t: ["{T} — Everything You Need To Know", "{T}: What Nobody Tells You", "The Truth About {T}", "{T} Explained Simply", "{T} — Tips, Mistakes & Best Practices"],
        b: ["the key points explained clearly", "common mistakes to avoid", "practical tips you can use today"],
        h: "Put the clearest promise of the video in the first 5 seconds and deliver the first payoff before 30 seconds." }
};
Object.values(CATS).forEach(c => { if (typeof c.k === "string") c.k = c.k.split(" "); });

function topicOf(title) {
    let t = (title || "").split(/\s[|–—-]\s|[|:(\[]/)[0].trim();
    const q = /^(this is how|how|why|what)\b/i.test(t);
    for (let i = 0; i < 3; i++) t = t.replace(/^(this is|here'?s|here is|how to|how|why|what|watch|i tried|i played|the)\s+/i, "");
    t = t.replace(/\b20\d\d\b/g, "").replace(/[!?]+$/, "").replace(/\s+/g, " ").trim();
    if (q) t = t.replace(/\s+(were|was|is|are|did|does|do)\s+\w+$/i, "");
    let prev;
    do { prev = t; t = t.replace(/\s+(for beginners|step by step|worth it|review|recipe|tutorial|guide|tips|tricks|explained|walkthrough|challenge)$/i, "").trim(); } while (t !== prev && t.split(" ").length > 1);
    return t || (title || "").trim();
}
function rank(title, tags = [], desc = "") {
    const f = {};
    const add = (s, w) => (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).forEach(x => { if (!STOP.has(x) && !/^\d+$/.test(x)) f[x] = (f[x] || 0) + w; });
    add(title, 5); tags.forEach(t => add(t, 2)); add(desc.slice(0, 600), 1);
    return Object.entries(f).sort((a, b) => b[1] - a[1]).map(e => e[0]);
}
function detect(title, desc = "", tags = []) {
    const f = {};
    const add = (s, m) => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).forEach(x => (f[x] = (f[x] || 0) + m));
    add(title, 3); tags.forEach(t => add(t, 2)); add(desc.slice(0, 400), 1);
    let best = "general", bs = 0;
    for (const [id, c] of Object.entries(CATS)) {
        const sc = c.k.reduce((a, k) => a + (f[k] || 0), 0);
        if (sc > bs) { bs = sc; best = id; }
    }
    return best;
}
const uniq = a => { const seen = new Set(); return a.filter(x => { const k = x.toLowerCase(); if (!x || seen.has(k)) return false; seen.add(k); return true; }); };
const hashOf = s => "#" + s.replace(/[^\p{L}\p{N}]+/gu, "");
const hashFit = s => { const w = s.split(/\s+/); while (w.length > 1 && hashOf(w.join(" ")).length > 24) w.pop(); return hashOf(cap(w.join(" "))); };

/* One call → everything that depends on the video's own topic */
function pack(title, desc = "", tags = []) {
    const T = topicOf(title), cat = detect(title, desc, tags), C = CATS[cat], yr = new Date().getFullYear();
    const kw = rank(title, tags, desc).slice(0, 8);
    const Ts = cap(T.split(" ").slice(0, 6).join(" "));
    const titles = C.t.map(x => x.replace(/\{T\}/g, Ts)).map(x => (x.length > 75 ? x.replace(/\s*\(.*?\)/, "") : x));
    const related = tags.filter(t => kw.some(k => t.toLowerCase().includes(k))).slice(0, 5);
    let tagList = uniq([T.toLowerCase(), ...C.sfx.map(s => `${T} ${s}`.toLowerCase()), `${T} ${yr}`.toLowerCase(), ...kw.slice(0, 5), ...related, ...C.tags]).slice(0, 15);
    while (tagList.join(",").length > 450) tagList.pop();
    const tagsHash = uniq([hashFit(T), ...kw.slice(0, 5).map(hashOf), ...C.tags.map(hashOf), hashOf(Ts.split(" ")[0] + yr)]).filter(h => h.length > 2).slice(0, 12);
    const top3 = tagsHash.slice(0, 3);
    const description =
`${Ts} — in this video you'll see ${C.b[0]}, ${C.b[1]} and ${C.b[2]}.

In this video:
• ${cap(C.b[0])}
• ${cap(C.b[1])}
• ${cap(C.b[2])}

About this video: a clear look at ${T.toLowerCase()} for ${C.aud}. Related topics: ${kw.slice(0, 5).join(", ")}.

If this helped, subscribe for more ${C.aud} videos and tell me in the comments what you want covered next.

${top3.join(" ")}`;
    return { T, Ts, cat, C, kw, titles, tags: tagList, hashtags: tagsHash, top3, description };
}

/* ================= HASHTAG PAGE ================= */
if ($("#hashtagGenerate")) {
    let current = [];
    const run = () => {
        const topic = $("#hashtagTopic").value.trim(), box = $("#hashtagResults");
        if (!topic) { box.innerHTML = '<div class="empty">Enter a topic or video title first.</div>'; return; }
        const p = pack(topic);
        current = p.hashtags;
        const chip = h => `<span class="chip" data-copy="${esc(h)}">${esc(h)}</span>`;
        box.innerHTML = `
            <div style="width:100%"><p class="small">Best 3 — YouTube shows these above your title (${esc(CATS[p.cat].aud)} · ${p.cat})</p>
            <div class="chips">${p.top3.map(chip).join("")}</div></div>
            <div style="width:100%;margin-top:14px"><p class="small">More relevant hashtags (keep the total under 15)</p>
            <div class="chips">${p.hashtags.slice(3).map(chip).join("")}</div></div>
            <div style="width:100%;margin-top:14px"><p class="small">Tags for the Studio tag box</p>
            <div class="chips">${p.tags.map(chip).join("")}</div>
            <button class="btn btn-secondary" style="margin-top:10px" data-copy="${esc(p.tags.join(", "))}">Copy all tags</button></div>`;
    };
    $("#hashtagGenerate").addEventListener("click", run);
    $("#hashtagTopic").addEventListener("keydown", e => e.key === "Enter" && run());
    $("#hashtagResults").addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy, b); });
    $("#hashtagCopyAll").addEventListener("click", e => copy(current.join(" "), e.currentTarget));
}

/* ================= VIRAL ANALYSIS ================= */
const HOOK = /\b(how|why|secret|truth|never|worst|best|vs|insane|shocking|real|actually|nobody|stop|mistakes?|exposed|proof|finally|built|hidden|you)\b/i;
const wc = s => (s.trim() ? s.trim().split(/\s+/).length : 0);

function viral(d) {
    const { video: v, stats: s, channel: c } = d, base = c?.baseline, P = pack(v.title, v.description, v.tags);
    const ageD = Math.max(1, (Date.now() - new Date(v.publishedAt)) / 864e5);
    const sig = [], worked = [], failed = [], plan = [];
    const add = (label, pts, max, ok, bad) => { sig.push({ label, pts, max }); (pts / max >= 0.6 ? worked : failed).push(pts / max >= 0.6 ? ok : bad); };

    const vd = s.viewsPerDay;
    add("Velocity", vd >= 1e5 ? 30 : vd >= 1e4 ? 24 : vd >= 1e3 ? 16 : vd >= 100 ? 8 : 2, 30,
        `Averages ${fmt(Math.round(vd))} views per day, which is strong, sustained momentum.`,
        `Only ${fmt(Math.round(vd))} views per day: YouTube is not pushing it to new viewers yet.`);

    const ratio = base?.median ? s.views / base.median : null;
    if (ratio !== null) add("Vs channel", ratio >= 3 ? 25 : ratio >= 1.5 ? 19 : ratio >= 0.8 ? 12 : ratio >= 0.4 ? 6 : 2, 25,
        `${ratio.toFixed(1)}x the channel's recent median (${short(base.median)} views), so this topic and packaging beat the channel's normal range.`,
        `${ratio.toFixed(1)}x the channel's recent median (${short(base.median)} views): it stayed inside the channel's usual range instead of breaking out.`);

    const sr = s.subscriberRatio;
    if (sr !== null) add("Reach", sr >= 1 ? 15 : sr >= 0.3 ? 10 : sr >= 0.1 ? 6 : 2, 15,
        `Views are ${sr.toFixed(1)}x the subscriber count, so it reached people outside the subscriber base.`,
        `Views are only ${sr.toFixed(2)}x subscribers: mostly the existing audience watched it.`);

    add("Engagement", (s.likeRate >= 4 ? 10 : s.likeRate >= 2 ? 7 : s.likeRate >= 1 ? 4 : 1) + (s.commentRate >= 0.1 ? 5 : s.commentRate >= 0.03 ? 3 : 1), 15,
        `Like rate ${s.likeRate.toFixed(2)}% and comment rate ${s.commentRate.toFixed(2)}% show viewers reacted.`,
        `Like rate ${s.likeRate.toFixed(2)}% and comment rate ${s.commentRate.toFixed(2)}% are low: few viewers felt a reason to react.`);

    const tl = v.title.length;
    const pack1 = (tl >= 40 && tl <= 70 ? 4 : tl >= 30 && tl <= 80 ? 2 : 0) + (HOOK.test(v.title) ? 3 : 0) + (/\d|\?/.test(v.title) ? 3 : 0);
    add("Title", pack1, 10,
        `Title (${tl} chars) has a clear hook and a good length.`,
        `Title (${tl} chars) is weak on hook, length or specificity. Try one of the SEO titles below.`);

    const meta = (v.tags.length >= 8 ? 2 : 0) + (wc(v.description) >= 100 ? 3 : 0);
    add("Metadata", meta, 5,
        `Tags and description give search plenty of context.`,
        `Thin metadata (${v.tags.length} tags, ${wc(v.description)} description words) limits search and suggested reach.`);

    const score = Math.round(sig.reduce((a, x) => a + x.pts, 0) / sig.reduce((a, x) => a + x.max, 0) * 100);
    let verdict = score >= 75 ? "Viral" : score >= 55 ? "Performing well" : score >= 35 ? "Average" : "Underperforming";
    const tooNew = ageD < 2;
    if (tooNew) verdict += " (too new to judge)";

    const weak = l => sig.find(x => x.label === l && x.pts / x.max < 0.6);
    if (weak("Title")) plan.push("Rewrite the title with a specific promise (one of the SEO titles below), keep it 40–70 characters and put the main keyword first.");
    if (weak("Velocity") || weak("Vs channel")) plan.push("Test a new thumbnail in YouTube Studio (Test & compare): one clear subject, high contrast, three words or fewer.");
    if (weak("Velocity")) plan.push("Cut 2–3 Shorts from the strongest moments, link them back to this video, and post to the Community tab in the first 48 hours.");
    if (weak("Reach")) plan.push("Put the main keyword in the first line of the description and add the tags and hashtags from the SEO pack so search and suggested can place it.");
    if (weak("Engagement")) plan.push("Ask one specific question near the 80% mark and pin a comment with the same question. Add an end screen to your next video.");
    plan.push(P.C.h);
    plan.push("Check YouTube Studio: CTR below roughly 4% points to title/thumbnail; average view duration below roughly 40% points to the hook and pacing. This tool cannot see those numbers.");
    return { score, verdict, sig, worked, failed, plan, P, ratio, tooNew };
}

function ageText(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 864e5);
    return d < 1 ? "today" : d < 30 ? d + " days ago" : d < 365 ? Math.floor(d / 30) + " months ago" : (d / 365).toFixed(1) + " years ago";
}
const durText = s => s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m` : `${Math.floor(s / 60)}m ${s % 60}s`;

function countUp(root) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    $$("[data-n]", root).forEach(el => {
        const n = +el.dataset.n, dec = +el.dataset.d || 0, suf = el.dataset.s || "";
        const set = v => (el.textContent = (dec ? v.toFixed(dec) : fmt(Math.round(v))) + suf);
        if (reduce) return set(n);
        const t0 = performance.now();
        (function f(t) { const p = Math.min(1, (t - t0) / 1100); set(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    });
}

function render(d, out) {
    const { video: v, stats: s, channel: c } = d, V = viral(d), P = V.P, base = c?.baseline;
    const col = V.score >= 55 ? "var(--green)" : V.score >= 35 ? "var(--yellow)" : "var(--red)";
    const stat = (l, n, dec, suf, sub) => `<div class="hp hs"><span>${l}</span><b data-n="${n}" data-d="${dec}" data-s="${suf}">0</b><small>${sub}</small></div>`;
    const rec = (base?.recent || []).slice().reverse();
    const mx = Math.max(...rec.map(r => r.views), s.views, 1);
    const bars = rec.map(r => `<i style="height:${Math.max(3, r.views / mx * 100)}%" title="${esc(r.title)} — ${fmt(r.views)} views"></i>`).join("") +
        `<i class="me" style="height:${Math.max(3, s.views / mx * 100)}%" title="This video — ${fmt(s.views)} views"></i>`;
    const copyBtn = (t, l = "Copy") => `<button class="btn btn-secondary" data-copy="${esc(t)}">${l}</button>`;
    const li = (a, cls) => a.map(x => `<li class="${cls}">${esc(x)}</li>`).join("");

    out.innerHTML = `<div class="hud">
    <div class="hud-bar"><span>Video analyzer</span><b class="live">Live data · analysis complete</b></div>

    <div class="hp hud-over">
        <img src="${esc(v.thumbnail)}" alt="">
        <div><h2>${esc(v.title)}</h2>
        <p>${esc(v.channelTitle)} · ${ageText(v.publishedAt)} · ${durText(v.durationSec)} · category: ${esc(P.cat)}</p>
        <a class="btn btn-secondary" href="${esc(v.url)}" target="_blank" rel="noopener">Open on YouTube</a></div>
    </div>

    <div class="hud-stats">
        ${stat("Views", s.views, 0, "", "total")}
        ${stat("Likes", s.likes, 0, "", "total")}
        ${stat("Comments", s.comments, 0, "", "total")}
        ${stat("Views per day", Math.round(s.viewsPerDay), 0, "", "since upload")}
        ${stat("Like rate", s.likeRate, 2, "%", "likes ÷ views")}
        ${stat("Comment rate", s.commentRate, 2, "%", "comments ÷ views")}
    </div>

    <div class="hud-row">
        <div class="hp hud-gauge">
            <svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="54" class="trk"/><circle cx="70" cy="70" r="54" class="val" style="stroke:${col};stroke-dasharray:339.3;stroke-dashoffset:${339.3 * (1 - V.score / 100)}"/></svg>
            <div class="g-num"><b data-n="${V.score}" data-d="0" data-s="">0</b><small>viral score</small></div>
            <h3 style="color:${col}">${esc(V.verdict)}</h3>
            ${V.sig.map(x => `<div class="sg"><span>${x.label}</span><div><i style="width:${x.pts / x.max * 100}%"></i></div></div>`).join("")}
        </div>
        <div class="hp hud-chan">
            <h3>Channel context</h3>
            ${c ? `<p>${fmt(c.subscribers)} subscribers · ${fmt(c.videos)} uploads${V.ratio !== null ? ` · this video = <b>${V.ratio.toFixed(1)}x</b> recent median` : ""}</p>` : `<p class="muted">Channel stats were not available.</p>`}
            ${rec.length ? `<div class="bars">${bars}</div><p class="small">Recent uploads (oldest → newest), then this video in red.</p>` : ""}
        </div>
    </div>

    <div class="hud-cols">
        <div class="hp"><h3>Why it worked</h3><ul>${V.worked.length ? li(V.worked, "ok") : '<li class="muted">No signal stood out as strong.</li>'}</ul></div>
        <div class="hp"><h3>${V.score >= 55 ? "What held it back" : "Why it did not go viral"}</h3><ul>${V.failed.length ? li(V.failed, "bad") : '<li class="muted">No major weak signal found.</li>'}</ul></div>
    </div>

    <div class="hp"><h3>How to push it toward viral</h3><ol class="plan">${V.plan.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
        <p class="small">${V.tooNew ? "This video is under 2 days old, so numbers can still change. " : ""}Scores come from public data and rule-of-thumb benchmarks, not official YouTube ranking.</p></div>

    <div class="hp"><h3>SEO titles for this topic</h3>
        ${P.titles.map((t, i) => `<div class="suggestion-card"><div><strong>Option ${i + 1} · ${t.length} chars</strong><p>${esc(t)}</p></div>${copyBtn(t)}</div>`).join("")}</div>

    <div class="hp"><h3>Description for this topic</h3>
        <textarea class="textarea" rows="13" readonly>${esc(P.description)}</textarea>
        <p style="margin-top:12px">${copyBtn(P.description, "Copy description")}</p></div>

    <div class="hud-cols">
        <div class="hp"><h3>Tags for this video</h3><div class="chips">${P.tags.map(t => `<span class="chip" data-copy="${esc(t)}">${esc(t)}</span>`).join("")}</div>
            <p style="margin-top:12px">${copyBtn(P.tags.join(", "), "Copy all tags")}</p></div>
        <div class="hp"><h3>Hashtags for this video</h3><div class="chips">${P.hashtags.map(t => `<span class="chip" data-copy="${esc(t)}">${esc(t)}</span>`).join("")}</div>
            <p style="margin-top:12px">${copyBtn(P.hashtags.join(" "), "Copy all hashtags")}</p></div>
    </div>
    </div>`;
    countUp(out);
}

async function analyze() {
    const url = $("#videoUrl").value.trim(), msg = $("#videoMessage"), out = $("#videoResults"), btn = $("#videoAnalyze");
    msg.innerHTML = "";
    if (!url) { msg.innerHTML = '<div class="notice">Paste a YouTube video link first.</div>'; return; }
    btn.disabled = true; btn.textContent = "Analyzing…";
    out.innerHTML = '<div class="hud-load"><span></span>Scanning the video, channel and recent uploads…</div>';
    try {
        const r = await fetch("/api/youtube?mode=analyze&url=" + encodeURIComponent(url));
        const raw = await r.text();
        let d;
        try { d = JSON.parse(raw); } catch { throw new Error(`Backend route /api/youtube answered with HTTP ${r.status} and not JSON. The API function is not deployed or not reachable.`); }
        if (!r.ok || !d.ok) throw new Error(d.error || `Request failed (HTTP ${r.status}).`);
        render(d, out);
    } catch (e) {
        out.innerHTML = "";
        const m = location.protocol === "file:" ? "This page was opened as a file. Open it through your website link or http://localhost:3000 instead." : e.message;
        msg.innerHTML = `<div class="notice">${esc(m)}</div>`;
    } finally { btn.disabled = false; btn.textContent = "Analyze Video"; }
}

if ($("#videoAnalyze")) {
    $("#videoAnalyze").addEventListener("click", analyze);
    $("#videoUrl").addEventListener("keydown", e => e.key === "Enter" && analyze());
    $("#videoResults").addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy, b); });
    const u = new URLSearchParams(location.search).get("url");
    if (u) { $("#videoUrl").value = u; analyze(); }
}
