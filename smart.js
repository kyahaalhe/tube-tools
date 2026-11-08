/* TubeTools smart.js — topic engine, hashtag generator, viral video analyzer */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const fmt = n => Number(n || 0).toLocaleString();
const short = n => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : String(Math.round(n));
const cap = s => s.split(" ").map(w => (/[A-Z]/.test(w) || !w ? w : w[0].toUpperCase() + w.slice(1))).join(" ");
function copy(t, b) {
    navigator.clipboard?.writeText(t).then(() => {
        window.toast && window.toast("Copied to clipboard");
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
    const add = (label, pts, max, ok, bad) => { sig.push({ label, pts, max, note: pts / max >= 0.6 ? ok : bad }); (pts / max >= 0.6 ? worked : failed).push(pts / max >= 0.6 ? ok : bad); };

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

const ICON = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    pct: '<svg viewBox="0 0 24 24"><path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/></svg>'
};
const trunc = s => (s.length > 60 ? s.slice(0, 58).trimEnd() + "…" : s);

const IC = {
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    pct: '<svg viewBox="0 0 24 24"><path d="M19 5 5 19"/><circle cx="7" cy="7.5" r="2"/><circle cx="17" cy="16.5" r="2"/></svg>',
    msg: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>'
};

function radar(sig) {
    const n = sig.length, cx = 110, cy = 110, R = 70;
    const pt = (i, f) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [(cx + Math.cos(a) * R * f).toFixed(1), (cy + Math.sin(a) * R * f).toFixed(1)]; };
    const ring = f => sig.map((_, i) => pt(i, f).join(",")).join(" ");
    return `<svg class="radar" viewBox="0 0 220 220" role="img" aria-label="Signal radar">
        ${[0.25, 0.5, 0.75, 1].map(f => `<polygon class="rg" points="${ring(f)}"/>`).join("")}
        ${sig.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; }).join("")}
        <polygon class="rp" points="${sig.map((x, i) => pt(i, Math.max(0.06, x.pts / x.max)).join(",")).join(" ")}"/>
        ${sig.map((x, i) => { const [px, py] = pt(i, 1.32); return `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle">${x.label}</text>`; }).join("")}</svg>`;
}

const copyBtn = (t, l = "Copy", cls = "btn-secondary") => `<button class="btn ${cls}" data-copy="${esc(t)}">${l}</button>`;
const serpTitle = t => (t.length > 60 ? t.slice(0, 58).trimEnd() + "…" : t);

function seoBlock(P, v) {
    const opts = [v.title, ...P.titles];
    return `<div class="hp"><h3>Search preview</h3>
        <div class="serp"><div class="serp-site"><img src="logo.svg" alt=""><span>youtube.com › watch</span></div>
            <div class="serp-title" id="serpTitle">${esc(serpTitle(opts[0]))}</div>
            <div class="serp-desc">${esc(P.description.replace(/\s+/g, " ").slice(0, 155))}…</div></div>
        <p class="small" style="margin:10px 0 12px">Pick a title to see how it looks in search. Titles longer than ~60 characters get cut off.</p>
        <div class="opts">${opts.map((t, i) => `<div class="opt${i ? "" : " on"}" data-title="${esc(t)}"><span class="opt-tag">${i ? "Option " + i : "Current"}</span><span class="opt-t">${esc(t)}</span><span class="opt-n">${t.length}</span>${copyBtn(t)}</div>`).join("")}</div></div>
    <div class="hp"><h3>Description for this topic</h3>
        <textarea class="textarea" rows="12" readonly>${esc(P.description)}</textarea>
        <p style="margin-top:12px">${copyBtn(P.description, "Copy description")} <span class="small">${P.description.length} characters</span></p></div>
    <div class="hud-cols">
        <div class="hp"><h3>Tags</h3><div class="chips">${P.tags.map(t => `<span class="chip" data-copy="${esc(t)}">${esc(t)}</span>`).join("")}</div>
            <p style="margin-top:12px">${copyBtn(P.tags.join(", "), "Copy all tags")}</p></div>
        <div class="hp"><h3>Hashtags</h3><div class="chips">${P.hashtags.map(t => `<span class="chip" data-copy="${esc(t)}">${esc(t)}</span>`).join("")}</div>
            <p style="margin-top:12px">${copyBtn(P.hashtags.join(" "), "Copy all hashtags")}</p></div>
    </div>`;
}

function heroBlock(v, P, col, verdict, extra = "") {
    return `<div class="hp rs-hero">
        <div class="ov-thumb"><a href="${esc(v.url)}" target="_blank" rel="noopener" aria-label="Open on YouTube">${v.thumbnail ? `<img src="${esc(v.thumbnail)}" alt="">` : ""}<span class="play"></span></a>${verdict ? `<span class="vbadge" style="border-color:${col};color:${col}">${esc(verdict)}</span>` : ""}</div>
        <div class="rs-info"><h2>${esc(v.title)}</h2>
            <div class="rs-meta"><span>${esc(v.channelTitle)}</span>${v.publishedAt ? `<span>${ageText(v.publishedAt)}</span>` : ""}${v.durationSec ? `<span>${durText(v.durationSec)}</span>` : ""}<span>${esc(P.cat)}</span></div>
            ${extra}</div></div>`;
}

function renderLimited(d, out) {
    const v = d.video, P = pack(v.title, "", []);
    out.innerHTML = `<div class="hud enter">
        <div class="hud-bar"><span><img class="hud-logo" src="logo.svg" alt="">Video analyzer</span><b class="live">Limited mode</b></div>
        ${heroBlock(v, P, "var(--yellow)", "", `<div class="ov-actions"><a class="btn btn-secondary" href="${esc(v.url)}" target="_blank" rel="noopener">Open on YouTube</a></div>`)}
        <div class="notice">${esc(d.notice || "Limited mode.")}</div>
        <div class="rs-body">${seoBlock(P, v)}</div></div>`;
    animateIn(out);
    document.dispatchEvent(new CustomEvent("tt:analyzed", { detail: { limited: true } }));
}

function render(d, out, opt = {}) {
    if (d.limited) return renderLimited(d, out);
    const { video: v, stats: s, channel: c } = d, V = viral(d), P = V.P, base = c?.baseline;
    const col = V.score >= 55 ? "var(--green)" : V.score >= 35 ? "var(--yellow)" : "var(--red)";
    const stat = (ic, l, n, dec, suf, sub, chip = "") => `<div class="hp hs"><i class="ic">${IC[ic]}</i><span>${l}</span><b data-n="${n}" data-d="${dec}" data-s="${suf}">0</b><small>${sub}</small>${chip}</div>`;
    const rec = (base?.recent || []).slice().reverse();
    const mx = Math.max(...rec.map(r => r.views), s.views, 1);
    const bars = rec.map(r => `<i style="height:${Math.max(3, r.views / mx * 100)}%" title="${esc(r.title)} — ${fmt(r.views)} views"></i>`).join("") + `<i class="me" style="height:${Math.max(3, s.views / mx * 100)}%" title="This video — ${fmt(s.views)} views"></i>`;
    const li = (a, cls) => a.map(x => `<li class="${cls}">${esc(x)}</li>`).join("");
    const low = x => x.toLowerCase(), desc = low(v.description), ttl = low(v.title);
    const cov = P.kw.slice(0, 8).map(k => ({ k, t: ttl.includes(k), g: v.tags.some(t => low(t).includes(k)), d: desc.includes(k) }));
    const inTitle = cov.filter(x => x.t).length, yn = b => `<span class="${b ? "yes" : "no"}">${b ? "✓" : "✕"}</span>`;
    const best = V.sig.slice().sort((a, b) => b.pts / b.max - a.pts / a.max)[0], worst = V.sig.slice().sort((a, b) => a.pts / a.max - b.pts / b.max)[0];
    const summary = `${V.verdict}. ${best.label} is the strongest signal${V.ratio !== null ? ` and it pulled ${V.ratio.toFixed(1)}x this channel's recent median` : ""}. The weakest signal is ${worst.label.toLowerCase()}.`;
    const report = [`TubeTools video report`, `Title: ${v.title}`, `Channel: ${v.channelTitle}`, `Viral score: ${V.score}/100 (${V.verdict})`,
        `Views: ${fmt(s.views)} · Likes: ${fmt(s.likes)} · Comments: ${fmt(s.comments)} · Views/day: ${fmt(Math.round(s.viewsPerDay))}`, ``, `Why it worked:`, ...V.worked.map(x => "- " + x), ``,
        `What held it back:`, ...V.failed.map(x => "- " + x), ``, `Action plan:`, ...V.plan.map((x, i) => `${i + 1}. ${x}`), ``, `SEO titles:`, ...P.titles.map(x => "- " + x), ``, `Tags: ${P.tags.join(", ")}`, `Hashtags: ${P.hashtags.join(" ")}`].join("\n");
    const share = `${location.origin}/video-analyzer.html?url=${encodeURIComponent(v.url)}`;
    let done = []; try { done = JSON.parse(localStorage.getItem("tt_plan_" + v.videoId) || "[]"); } catch {}
    const savedBanner = opt.saved ? `<div class="notice">Saved result from ${new Date(opt.saved).toLocaleString()}. Press “Analyze Video” for fresh numbers.</div>` : "";

    out.innerHTML = `<div class="hud enter">
    <div class="hud-bar"><span><img class="hud-logo" src="logo.svg" alt="">Video analyzer</span><b class="live">${opt.saved ? "Saved result" : "Live data · analysis complete"}</b></div>
    ${heroBlock(v, P, col, V.verdict, `<p class="rs-sum">${esc(summary)}</p><div class="ov-actions"><a class="btn btn-secondary" href="${esc(v.url)}" target="_blank" rel="noopener">Open on YouTube</a>${copyBtn(report, "Copy full report", "btn-primary")}${copyBtn(share, "Copy share link")}</div>`)}
    ${savedBanner}
    <div class="rs-body">
      <nav class="rs-tabs" aria-label="Report sections"><a href="#rs-score">Score</a><a href="#rs-numbers">Numbers</a><a href="#rs-insights">Insights</a><a href="#rs-seo">SEO pack</a><a href="#rs-keywords">Keywords</a></nav>

      <div id="rs-score" class="rs-sec hud-row">
        <div class="hp hud-gauge">
          <svg class="gauge" viewBox="0 0 140 140"><circle cx="70" cy="70" r="54" class="trk"/><circle cx="70" cy="70" r="54" class="val" data-off="${339.3 * (1 - V.score / 100)}" style="stroke:${col};stroke-dasharray:339.3;stroke-dashoffset:339.3"/></svg>
          <div class="g-num"><b data-n="${V.score}" data-d="0" data-s="">0</b><small>viral score</small></div>
          <h3 style="color:${col}">${esc(V.verdict)}</h3>
          <div class="sgns">${V.sig.map(x => `<div class="sgn"><span>${x.label}</span><div class="sgn-bar"><i data-w="${Math.round(x.pts / x.max * 100)}" style="width:0"></i></div><b>${x.pts}/${x.max}</b></div>`).join("")}</div>
        </div>
        <div class="hp hud-radar"><h3>Signal radar</h3>${radar(V.sig)}<p class="small" style="text-align:center">The bigger the shape, the stronger the video across all signals.</p></div>
      </div>

      <div id="rs-numbers" class="rs-sec">
        <div class="hud-stats">
          ${stat("eye", "Views", s.views, 0, "", "total", V.ratio !== null ? `<em class="chipd ${V.ratio >= 1 ? "up" : "down"}">${V.ratio.toFixed(1)}× channel median</em>` : "")}
          ${stat("heart", "Likes", s.likes, 0, "", "total")}
          ${stat("chat", "Comments", s.comments, 0, "", "total")}
          ${stat("bolt", "Views per day", Math.round(s.viewsPerDay), 0, "", "since upload")}
          ${stat("pct", "Like rate", s.likeRate, 2, "%", "likes ÷ views")}
          ${stat("msg", "Comment rate", s.commentRate, 2, "%", "comments ÷ views")}
        </div>
        <div class="hp hud-chan"><h3>Channel context</h3>
          ${c ? `<p>${fmt(c.subscribers)} subscribers · ${fmt(c.videos)} uploads${V.ratio !== null ? ` · this video = <b>${V.ratio.toFixed(1)}x</b> recent median` : ""}</p>` : `<p class="muted">Channel stats were not available.</p>`}
          ${rec.length ? `<div class="bars">${bars}</div><p class="small">Recent uploads (oldest → newest), then this video in red.</p>` : ""}</div>
      </div>

      <div id="rs-insights" class="rs-sec">
        <div class="hud-cols">
          <div class="hp"><h3>Why it worked</h3><ul>${V.worked.length ? li(V.worked, "ok") : '<li class="muted">No signal stood out as strong.</li>'}</ul></div>
          <div class="hp"><h3>${V.score >= 55 ? "What held it back" : "Why it did not go viral"}</h3><ul>${V.failed.length ? li(V.failed, "bad") : '<li class="muted">No major weak signal found.</li>'}</ul></div>
        </div>
        <div class="hp"><h3>Your action plan <span class="plan-count" id="planCount"></span></h3>
          <div class="plan-bar"><i id="planBar"></i></div>
          <div class="tasks" data-vid="${esc(v.videoId)}">${V.plan.map((x, i) => `<label class="task"><input type="checkbox" data-i="${i}"${done[i] ? " checked" : ""}><span>${esc(x)}</span></label>`).join("")}</div>
          <p class="small">${V.tooNew ? "This video is under 2 days old, so numbers can still change. " : ""}Scores come from public data and rule-of-thumb benchmarks, not official YouTube ranking.</p></div>
      </div>

      <div id="rs-seo" class="rs-sec">${seoBlock(P, v)}</div>

      <div id="rs-keywords" class="rs-sec"><div class="hp"><h3>Keyword coverage</h3>
        <p class="muted" style="margin:0 0 12px">${inTitle} of the video's top ${cov.length} keywords appear in its title. Keywords missing from title, tags or description are quick SEO wins.</p>
        <div class="cov"><div class="cov-h"><span>Keyword</span><span>Title</span><span>Tags</span><span>Description</span></div>
        ${cov.map(x => `<div class="cov-r"><span>${esc(x.k)}</span>${yn(x.t)}${yn(x.g)}${yn(x.d)}</div>`).join("")}</div>
        <p style="margin-top:14px"><a class="btn btn-primary" href="viral-keywords.html?mode=niche&q=${encodeURIComponent(P.Ts.toLowerCase())}">Find viral keywords for “${esc(P.Ts.toLowerCase())}”</a></p></div></div>
    </div></div>`;
    animateIn(out);
    document.dispatchEvent(new CustomEvent("tt:analyzed", { detail: { score: V.score, verdict: V.verdict } }));
}

/* ================= CINEMATIC INTRO v3: constellation ================= */
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function ytId(u) {
    try {
        const x = new URL(u), h = x.hostname.replace(/^www\./, "");
        if (h === "youtu.be") return x.pathname.slice(1).split("/")[0];
        if (/(^|\.)youtube\.com$/.test(h)) {
            if (x.pathname === "/watch") return x.searchParams.get("v");
            const m = x.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
            if (m) return m[2];
        }
    } catch {}
    return null;
}
const STAGES = [
    [0, "Locking on to the video"],
    [14, "Reading title, tags and description"],
    [32, "Pulling channel and subscriber data"],
    [52, "Comparing with recent uploads"],
    [72, "Scoring viral signals"],
    [88, "Building your SEO pack"]
];

function startCine(url) {
    const id = (ytId(url) || "").replace(/[^\w-]/g, ""), MIN = 4600;
    const el = document.createElement("div");
    el.className = "cine v3"; el.setAttribute("role", "status");
    el.innerHTML = `<canvas class="cine-cv"></canvas>
        <img class="cine-logo" src="logo.svg" alt="">
        <button type="button" class="cine-skip">Skip ›</button>
        <div class="cine-core">
            <svg class="cine-ringsvg" viewBox="0 0 200 200"><circle class="r0" cx="100" cy="100" r="92"/><circle class="r1" cx="100" cy="100" r="92"/></svg>
            <div class="cine-orb"><img class="o-logo" src="logo.svg" alt="">${id ? `<img class="o-thumb" alt="" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" onerror="this.remove()">` : ""}</div>
        </div>
        <div class="cine-cap"><div class="cine-pct"><b>0</b>%</div><div class="cine-title">Analyzing video</div><div class="cine-stage-text">${STAGES[0][1]}</div></div>
        <div class="cine-flash"></div><div class="cine-wave"></div>`;
    document.body.appendChild(el); document.body.style.overflow = "hidden";

    const pct = $(".cine-pct b", el), title = $(".cine-title", el), st = $(".cine-stage-text", el), cv = $(".cine-cv", el), g = cv.getContext("2d");
    let W = 0, H = 0;
    const rs = () => { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0); };
    rs(); addEventListener("resize", rs);
    const dust = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + .3, v: Math.random() * .0012 + .0003, a: Math.random() * .6 + .2 }));
    const NODES = [["Views", 8], ["Likes", 22], ["Comments", 36], ["Channel", 50], ["Recent uploads", 64], ["Viral score", 78], ["SEO pack", 90]].map(([label, at], i, a) => ({ label, at, ang: -Math.PI / 2 + i * 2 * Math.PI / a.length, on: 0 }));
    const ease = x => 1 - Math.pow(1 - x, 3), back = x => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

    const t0 = performance.now();
    let p = 0, stage = -1, finishing = false, skipped = false, closed = false, raf, timer = null, goFn = null, collStart = 0;
    const setP = v => { p = v; pct.textContent = Math.floor(v); el.style.setProperty("--p", (v / 100).toFixed(3)); };
    const say = i => { st.textContent = STAGES[i][1]; st.classList.remove("swap"); void st.offsetWidth; st.classList.add("swap"); };

    function draw(now) {
        const t = (now - t0) / 1000, small = W < 640;
        g.clearRect(0, 0, W, H);
        const cx = W / 2, cy = H / 2 - 24, RX = small ? Math.min(W * .4, 150) : Math.min(W * .3, 330), RY = small ? Math.min(H * .25, 190) : Math.min(H * .27, 230);
        const spread = collStart ? 1 - ease(Math.min(1, (now - collStart) / 700)) : 1;
        dust.forEach(d => { d.y -= d.v; if (d.y < 0) d.y = 1; g.fillStyle = `rgba(143,208,255,${d.a * .45})`; g.beginPath(); g.arc(d.x * W, d.y * H, d.r, 0, 7); g.fill(); });
        const sr = small ? 110 : 180;
        [.55, 1, 1.55].forEach(k => { g.strokeStyle = "rgba(63,182,255,.10)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, sr * k * (.4 + .6 * spread), 0, 7); g.stroke(); });
        if (g.createConicGradient && spread > .2) {
            const gr = g.createConicGradient(t * 1.5, cx, cy);
            gr.addColorStop(0, "rgba(63,182,255,0)"); gr.addColorStop(.88, "rgba(63,182,255,0)"); gr.addColorStop(1, "rgba(63,182,255,.26)");
            g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, sr * 1.55, 0, 7); g.fill();
        }
        NODES.forEach((n, i) => {
            if (!n.on && p >= n.at) n.on = now;
            const a = n.ang + t * .18 + Math.sin(t * .7 + i) * .04, rr = spread * (1 + Math.sin(t * 1.1 + i) * .03);
            const x = cx + Math.cos(a) * RX * rr, y = cy + Math.sin(a) * RY * rr, act = n.on ? Math.min(1, (now - n.on) / 500) : 0;
            g.lineWidth = 1.2; g.strokeStyle = `rgba(63,182,255,${(act ? .38 : .1) * spread})`; g.setLineDash(act ? [] : [4, 6]);
            g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
            if (act) { const q = (t * .55 + i * .31) % 1; g.fillStyle = `rgba(143,208,255,${.9 * spread})`; g.beginPath(); g.arc(x + (cx - x) * q, y + (cy - y) * q, 2.4, 0, 7); g.fill(); }
            const rad = 5 + (act ? 3 * back(act) : 0), halo = g.createRadialGradient(x, y, 0, x, y, 26);
            halo.addColorStop(0, act ? "rgba(63,182,255,.55)" : "rgba(63,182,255,.12)"); halo.addColorStop(1, "rgba(63,182,255,0)");
            g.fillStyle = halo; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill();
            g.fillStyle = act ? "#8fd0ff" : "rgba(156,207,255,.35)"; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
            if (act) { g.strokeStyle = `rgba(54,211,153,${.9 * (1 - act * .6)})`; g.lineWidth = 2; g.beginPath(); g.arc(x, y, rad + 4 + (1 - act) * 12, 0, 7); g.stroke(); }
            g.font = "700 12px Inter,system-ui,sans-serif"; g.textAlign = "center"; g.fillStyle = act ? `rgba(207,233,255,${spread})` : `rgba(156,207,255,${.4 * spread})`;
            g.fillText((act > .99 ? "✓ " : "") + n.label, x, y + (y < cy ? -18 : 26));
        });
    }
    const close = () => {
        if (closed) return;
        closed = true; cancelAnimationFrame(raf); clearTimeout(timer);
        document.removeEventListener("keydown", onKey); removeEventListener("resize", rs);
        document.body.style.overflow = ""; el.remove();
    };
    const skip = () => { skipped = true; if (timer) { clearTimeout(timer); timer = null; goFn && goFn(); } };
    const onKey = e => e.key === "Escape" && skip();
    document.addEventListener("keydown", onKey);
    $(".cine-skip", el).addEventListener("click", skip);

    (function tick(now) {
        if (closed) return;
        if (!finishing) setP(Math.min(96, 96 * (1 - Math.exp(-(now - t0) / 1500))));
        while (stage + 1 < STAGES.length && p >= STAGES[stage + 1][0]) say(++stage);
        draw(now);
        raf = requestAnimationFrame(tick);
    })(t0);

    return {
        abort: close,
        finish: () => new Promise(res => {
            goFn = () => {
                goFn = null; finishing = true;
                const k = skipped ? 0.4 : 1, from = p, s0 = performance.now();
                (function f(n) {
                    const q = Math.min(1, (n - s0) / (450 * k));
                    setP(from + (100 - from) * q);
                    if (q < 1) return requestAnimationFrame(f);
                    st.textContent = "Building your report"; collStart = performance.now();
                    setTimeout(() => {
                        title.textContent = "Analysis complete"; el.classList.add("done");
                        setTimeout(() => { el.classList.add("out"); setTimeout(() => { close(); res(); }, 600 * k); }, 750 * k);
                    }, 700 * k);
                })(s0);
            };
            if (skipped) goFn(); else timer = setTimeout(() => { timer = null; goFn && goFn(); }, Math.max(0, MIN - (performance.now() - t0)));
        })
    };
}

function animateIn(out) {
    const hud = $(".hud", out);
    if (!hud) return;
    [...hud.children].forEach((c, i) => (c.style.animationDelay = i * 110 + "ms"));
    requestAnimationFrame(() => requestAnimationFrame(() => {
        $$(".val", out).forEach(c => (c.style.strokeDashoffset = c.dataset.off));
        $$(".sgn-bar i", out).forEach(b => (b.style.width = b.dataset.w + "%"));
        $(".radar", out)?.classList.add("go");
    }));
    setTimeout(() => countUp(out), 350);
    // sticky tabs: smooth scroll + highlight current section
    const tabs = $$(".rs-tabs a", out);
    tabs.forEach(a => a.addEventListener("click", e => { e.preventDefault(); $(a.getAttribute("href"), out)?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); }));
    if (tabs.length) {
        const secs = $$(".rs-sec", out);
        const upd = () => { let cur = secs[0]; secs.forEach(x => { if (x.getBoundingClientRect().top <= innerHeight * 0.45) cur = x; }); if (innerHeight + scrollY >= document.documentElement.scrollHeight - 6) cur = secs[secs.length - 1]; tabs.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur.id)); };
        if (out._tabUpd) removeEventListener("scroll", out._tabUpd);
        out._tabUpd = upd; addEventListener("scroll", upd, { passive: true }); upd();
    }
    // action plan checklist (remembered per video)
    const box = $(".tasks", out);
    if (box) {
        const upd = () => { const all = $$("input", box), n = all.filter(i => i.checked).length; $("#planCount", out).textContent = `${n}/${all.length} done`; $("#planBar", out).style.width = (n / Math.max(1, all.length) * 100) + "%"; };
        box.addEventListener("change", () => { upd(); try { localStorage.setItem("tt_plan_" + box.dataset.vid, JSON.stringify($$("input", box).map(i => i.checked))); } catch {} });
        upd();
    }
    // search preview: pick a title option
    out.addEventListener("click", e => {
        const o = e.target.closest(".opt"); if (!o || e.target.closest("button")) return;
        $$(".opt", out).forEach(x => x.classList.toggle("on", x === o)); const t = $("#serpTitle", out); if (t) t.textContent = serpTitle(o.dataset.title);
    });
}

async function loadAnalysis(url) {
    const r = await fetch("/api/youtube?mode=analyze&url=" + encodeURIComponent(url));
    const raw = await r.text();
    let d;
    try { d = JSON.parse(raw); } catch { throw new Error(`Backend route /api/youtube answered with HTTP ${r.status} and not JSON. The API function is not deployed or not reachable.`); }
    if (!r.ok || !d.ok) throw new Error(d.error || `Request failed (HTTP ${r.status}).`);
    return d;
}

/* ---- history: last analyses are kept in this browser, so reopening them costs no API quota ---- */
const HKEY = "tt_history";
const histGet = () => { try { return JSON.parse(localStorage.getItem(HKEY) || "[]"); } catch { return []; } };
function histSave(d) {
    try {
        const v = d.video, copy = JSON.parse(JSON.stringify(d)); copy.video.description = (v.description || "").slice(0, 1500);
        const entry = { id: v.videoId, title: v.title, score: viral(d).score, ts: Date.now(), data: copy };
        localStorage.setItem(HKEY, JSON.stringify([entry, ...histGet().filter(x => x.id !== v.videoId)].slice(0, 8)));
    } catch {}
}
function histRender() {
    const box = $("#videoHistory"); if (!box) return;
    const h = histGet();
    box.innerHTML = h.length ? `<div class="vh-head"><span>Recent analyses (open instantly, no quota used)</span><button type="button" class="vh-clear">Clear</button></div><div class="vh-list">${h.map(x => `<button type="button" class="vh-chip" data-id="${esc(x.id)}"><b>${x.score}</b><span>${esc(x.title.slice(0, 44))}${x.title.length > 44 ? "…" : ""}</span></button>`).join("")}</div>` : "";
}

async function analyze() {
    const url = $("#videoUrl").value.trim(), msg = $("#videoMessage"), out = $("#videoResults"), btn = $("#videoAnalyze");
    msg.innerHTML = "";
    if (!url) { msg.innerHTML = '<div class="notice">Paste a YouTube video link first.</div>'; return; }
    btn.disabled = true; btn.textContent = "Analyzing…";
    const cine = reduceMotion() ? null : startCine(url);
    out.innerHTML = cine ? "" : '<div class="hud-load"><span></span>Scanning the video, channel and recent uploads…</div>';
    try {
        const d = await loadAnalysis(url);
        if (cine) await cine.finish();
        render(d, out);
        if (!d.limited) { histSave(d); histRender(); }
        out.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    } catch (e) {
        cine && cine.abort();
        out.innerHTML = "";
        const m = location.protocol === "file:" ? "This page was opened as a file. Open it through your website link or http://localhost:3000 instead." : e.message;
        msg.innerHTML = `<div class="notice">${esc(m)}</div>`;
        document.dispatchEvent(new CustomEvent("tt:error", { detail: { message: m } }));
    } finally { btn.disabled = false; btn.textContent = "Analyze Video"; }
}

if ($("#videoAnalyze")) {
    $("#videoAnalyze").addEventListener("click", analyze);
    $("#videoUrl").addEventListener("keydown", e => e.key === "Enter" && analyze());
    $("#videoResults").addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy, b); });
    const hb = document.createElement("div"); hb.id = "videoHistory"; hb.className = "vh"; $("#videoMessage").after(hb); histRender();
    hb.addEventListener("click", e => {
        if (e.target.closest(".vh-clear")) { try { localStorage.removeItem(HKEY); } catch {} return histRender(); }
        const c = e.target.closest(".vh-chip"); if (!c) return;
        const x = histGet().find(i => i.id === c.dataset.id); if (!x) return;
        $("#videoUrl").value = x.data.video.url; render(x.data, $("#videoResults"), { saved: x.ts });
        $("#videoResults").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    });
    const u = new URLSearchParams(location.search).get("url");
    if (u) { $("#videoUrl").value = u; analyze(); }
}
