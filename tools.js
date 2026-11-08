/* TubeTools tools.js — relies on smart.js globals ($, $$, esc, fmt, short, copy, cap, uniq, STOP, CATS, pack, rank, detect, topicOf) */

/* ---------- shared helpers ---------- */
function setScore(el, n) {
    const col = n >= 75 ? "#36d399" : n >= 50 ? "#f6c453" : "#ff3040";
    const span = $("span", el), t0 = performance.now();
    (function f(t) {
        const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3), v = n * e;
        el.style.background = `conic-gradient(${col} ${v * 3.6}deg, rgba(255,255,255,.07) 0deg)`;
        span.textContent = Math.round(v);
        if (k < 1) requestAnimationFrame(f);
    })(t0);
}
// rows: [weight, status("ok"|"warn"|"bad"), text]  -> score + html
function renderChecks(box, rows) {
    const total = rows.reduce((a, r) => a + r[0], 0);
    const got = rows.reduce((a, r) => a + (r[1] === "ok" ? r[0] : r[1] === "warn" ? r[0] * 0.5 : 0), 0);
    const mark = { ok: "✓", warn: "!", bad: "✕" };
    box.innerHTML = rows.map((r, i) => `<div class="check ${r[1]}" style="animation-delay:${i * 60}ms"><span class="mark">${mark[r[1]]}</span><span>${esc(r[2])}</span></div>`).join("");
    return Math.round(got / total * 100);
}
const chipHtml = t => `<span class="chip" data-copy="${esc(t)}">${esc(t)}</span>`;
function bindCopy(root) { root.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy, b.tagName === "BUTTON" ? b : null); }); }
const yr = new Date().getFullYear();
const daily = (key, limit) => {
    const k = `tt_${key}_${new Date().toISOString().slice(0, 10)}`;
    let n = 0; try { n = +localStorage.getItem(k) || 0; } catch {}
    return { n, limit, left: Math.max(0, limit - n), use() { try { localStorage.setItem(k, String(n + 1)); } catch {} } };
};

/* ---------- Title Analyzer ---------- */
if ($("#titleAnalyze")) {
    const run = () => {
        const t = $("#titleInput").value.trim(), box = $("#titleChecks");
        if (!t) { box.innerHTML = '<div class="empty">Type a title to see the checklist.</div>'; return; }
        const len = t.length, words = t.split(/\s+/).length, kw = rank(t)[0] || "";
        const power = /\b(best|secret|truth|proven|easy|fast|free|ultimate|insane|shocking|never|worst|mistakes?|exposed|finally|hidden|why|how|stop|new|complete|guide|beginners?|simple|real|actually)\b/i.test(t);
        const num = /\d/.test(t), caps = /[A-Z]{4,}/.test(t) && t === t.toUpperCase();
        const front = kw && t.toLowerCase().indexOf(kw) >= 0 && t.toLowerCase().indexOf(kw) <= 35;
        const rows = [
            [25, len >= 40 && len <= 70 ? "ok" : len >= 30 && len <= 80 ? "warn" : "bad", `Length is ${len} characters. Best range is 40–70, so the title is not cut off in search.`],
            [10, words >= 5 && words <= 12 ? "ok" : "warn", `${words} words. Around 5–12 words reads best.`],
            [15, power ? "ok" : "bad", power ? "Has a curiosity or benefit word." : "Add a curiosity or benefit word (how, why, secret, mistakes, easy, best)."],
            [10, num ? "ok" : "warn", num ? "Has a number or year, which makes the promise specific." : "A number or year (7 tips, 2026) makes the promise more specific."],
            [15, front ? "ok" : "warn", front ? `Main keyword "${kw}" appears near the start.` : `Put your main keyword${kw ? ` ("${kw}")` : ""} in the first ~35 characters.`],
            [10, caps ? "bad" : "ok", caps ? "Written in ALL CAPS. Use normal capitalization." : "Capitalization looks natural."],
            [5, /[!?]{2,}/.test(t) ? "bad" : "ok", /[!?]{2,}/.test(t) ? "Stacked punctuation (!!! or ??) looks spammy." : "No stacked punctuation."],
            [10, /[:|\-—–(\[]/.test(t) ? "ok" : "warn", /[:|\-—–(\[]/.test(t) ? "Uses a separator or bracket to add context." : "Optional: add context after a colon or in brackets, like (Full Guide)."]
        ];
        const score = renderChecks(box, rows);
        setScore($("#titleScore"), score);
        $("#titleChars").textContent = len; $("#titleWords").textContent = words;
        $("#titlePower").textContent = power ? "Yes" : "No"; $("#titleNumber").textContent = num ? "Yes" : "No";
        const P = pack(t);
        box.insertAdjacentHTML("beforeend", `<div class="sugg"><h4>Better titles for this topic (${esc(P.cat)})</h4>${P.titles.map(x => `<div class="suggestion-card"><div><p>${esc(x)}</p><small class="muted">${x.length} chars</small></div><button class="btn btn-secondary" data-copy="${esc(x)}">Copy</button></div>`).join("")}</div>`);
    };
    $("#titleAnalyze").addEventListener("click", run);
    $("#titleInput").addEventListener("keydown", e => e.key === "Enter" && run());
    bindCopy($("#titleChecks"));
}

/* ---------- Keyword Analyzer ---------- */
if ($("#keywordGenerate")) {
    let all = [];
    const run = () => {
        const raw = $("#keywordTopic").value.trim(), box = $("#keywordResults");
        if (!raw) { box.innerHTML = '<div class="empty">Enter a topic to generate ideas.</div>'; return; }
        const T = topicOf(raw).toLowerCase(), C = CATS[detect(raw)];
        const groups = {
            "Questions people ask": [`how to ${T}`, `how does ${T} work`, `what is ${T}`, `why ${T}`, `is ${T} worth it`, `can you ${T}`, `when to ${T}`],
            "Long-tail searches": [`${T} ${yr}`, `${T} step by step`, `${T} for beginners`, `best ${T}`, `${T} guide`, ...C.sfx.map(s => `${T} ${s}`)],
            "Problems and mistakes": [`${T} mistakes`, `${T} not working`, `${T} problems and fixes`, `common ${T} mistakes`, `${T} tips and tricks`],
            "Comparisons and decisions": [`${T} vs`, `${T} alternatives`, `${T} review`, `${T} pros and cons`, `best ${T} for beginners`],
            "Audience and language ideas": [`${T} for ${C.aud}`, `${T} in urdu`, `${T} in hindi`, `${T} explained simply`, `${T} full course`]
        };
        Object.keys(groups).forEach(k => (groups[k] = uniq(groups[k])));
        all = Object.values(groups).flat();
        $("#keywordCount").textContent = all.length;
        box.innerHTML = Object.entries(groups).map(([g, a]) => `<div class="group-title">${g}</div>${a.map(chipHtml).join("")}`).join("");
    };
    $("#keywordGenerate").addEventListener("click", run);
    $("#keywordTopic").addEventListener("keydown", e => e.key === "Enter" && run());
    $("#keywordCopyAll").addEventListener("click", e => copy(all.join("\n"), e.currentTarget));
    bindCopy($("#keywordResults"));
}

/* ---------- Description Checker ---------- */
if ($("#descCheck")) {
    const run = () => {
        const d = $("#descriptionInput").value, box = $("#descChecks");
        if (!d.trim()) { box.innerHTML = '<div class="empty">Paste a description to see checks.</div>'; return; }
        const words = d.trim().split(/\s+/).length, links = (d.match(/https?:\/\/\S+/g) || []).length, tags = d.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || [];
        const first = d.slice(0, 150), stamps = /(^|\n)\s*\d{1,2}:\d{2}/.test(d), cta = /\b(subscribe|comment|like|share|follow|download|join|watch next)\b/i.test(d);
        const freq = {}; rank(d, [], "").slice(0, 1); (d.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) || []).forEach(w => !STOP.has(w) && (freq[w] = (freq[w] || 0) + 1));
        const topRep = Math.max(0, ...Object.values(freq)), stuffing = topRep / words > 0.08 && words > 40;
        const caps = (d.match(/\b[A-Z]{4,}\b/g) || []).length;
        const rows = [
            [20, words >= 250 ? "ok" : words >= 120 ? "warn" : "bad", `${words} words. Aim for 250+ so search has context.`],
            [20, first.trim().length >= 100 && !/^https?:/i.test(first.trim()) ? "ok" : "bad", "The first 150 characters (shown before 'Show more') should state what the video is about, with your keyword and no link."],
            [10, tags.length >= 1 && tags.length <= 5 ? "ok" : tags.length > 15 ? "bad" : "warn", tags.length ? `${tags.length} hashtag(s). 3–5 is ideal. More than 15 and YouTube ignores all of them.` : "Add 3–5 relevant hashtags at the end."],
            [10, links >= 1 ? "ok" : "warn", links ? `${links} link(s) found.` : "Add a link to a related video, playlist or your channel."],
            [10, stamps ? "ok" : "warn", stamps ? "Timestamps found (chapters help viewers and search)." : "Add chapters like 0:00 Intro to create video chapters."],
            [10, cta ? "ok" : "warn", cta ? "Has a call to action." : "Add one clear call to action (subscribe, comment, watch next)."],
            [5, d.includes("\n") ? "ok" : "warn", d.includes("\n") ? "Uses line breaks, so it is easy to scan." : "Break the text into short paragraphs."],
            [10, stuffing ? "bad" : "ok", stuffing ? "A word repeats too often. This looks like keyword stuffing." : "No keyword stuffing detected."],
            [5, caps > 3 ? "warn" : "ok", caps > 3 ? "Too many ALL CAPS words." : "Capitalization looks natural."]
        ];
        setScore($("#descScore"), renderChecks(box, rows));
        $("#descWords").textContent = words; $("#descChars").textContent = d.length; $("#descLinks").textContent = links; $("#descHashtags").textContent = tags.length;
    };
    $("#descCheck").addEventListener("click", run);
}

/* ---------- SEO Score ---------- */
if ($("#seoAnalyze")) {
    const run = () => {
        const title = $("#seoTitle").value.trim(), desc = $("#seoDescription").value.trim(), box = $("#seoChecks");
        const tags = $("#seoTags").value.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
        if (!title && !desc && !tags.length) { box.innerHTML = '<div class="empty">Enter your metadata to see the checklist.</div>'; return; }
        const kw = rank(title)[0] || "", dw = desc ? desc.split(/\s+/).length : 0, low = tags.map(t => t.toLowerCase());
        const tagChars = tags.join(",").length, dup = low.length !== new Set(low).size, hash = (desc.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
        const rows = [
            [15, title.length >= 30 && title.length <= 70 ? "ok" : title ? "warn" : "bad", `Title is ${title.length} characters (best 30–70).`],
            [10, kw && title.toLowerCase().indexOf(kw) <= 35 ? "ok" : "warn", kw ? `Main keyword "${kw}" should be near the start of the title.` : "Add a title so the main keyword can be found."],
            [15, kw && desc.slice(0, 150).toLowerCase().includes(kw) ? "ok" : "bad", `Main keyword${kw ? ` "${kw}"` : ""} should appear in the first 150 characters of the description.`],
            [15, dw >= 150 ? "ok" : dw >= 60 ? "warn" : "bad", `Description has ${dw} words (aim for 150+).`],
            [10, tags.length >= 5 && tags.length <= 15 ? "ok" : tags.length ? "warn" : "bad", `${tags.length} tag phrases (5–15 is a good range).`],
            [10, kw && low.some(t => t.includes(kw)) ? "ok" : "warn", `At least one tag should contain your main keyword${kw ? ` ("${kw}")` : ""}.`],
            [5, tagChars <= 500 ? "ok" : "bad", `Tags use ${tagChars}/500 characters.`],
            [10, hash >= 1 && hash <= 5 ? "ok" : hash > 15 ? "bad" : "warn", `${hash} hashtag(s) in the description (3–5 is ideal).`],
            [5, /https?:\/\//.test(desc) ? "ok" : "warn", "Description should contain at least one useful link."],
            [5, dup ? "bad" : "ok", dup ? "Duplicate tags found. Remove repeats." : "No duplicate tags."]
        ];
        setScore($("#seoScore"), renderChecks(box, rows));
        $("#seoTitleLen").textContent = title.length; $("#seoDescWords").textContent = dw; $("#seoTagCount").textContent = tags.length;
    };
    $("#seoAnalyze").addEventListener("click", run);
}

/* ---------- Thumbnail Checker ---------- */
if ($("#thumbInput")) {
    $("#thumbInput").addEventListener("change", e => {
        const f = e.target.files[0]; if (!f) return;
        const url = URL.createObjectURL(f), img = new Image(), box = $("#thumbChecks");
        img.onload = () => {
            const w = img.naturalWidth, h = img.naturalHeight, ratio = w / h, mb = f.size / 1048576;
            $("#thumbPreview").src = url; $("#thumbW").textContent = w; $("#thumbH").textContent = h; $("#thumbRatio").textContent = ratio.toFixed(2);
            $("#thumbSize").textContent = mb.toFixed(2) + " MB"; $("#thumbType").textContent = (f.type.split("/")[1] || "?").toUpperCase();
            const c = document.createElement("canvas"); c.width = 96; c.height = 54; const x = c.getContext("2d"); x.drawImage(img, 0, 0, 96, 54);
            const px = x.getImageData(0, 0, 96, 54).data; let sum = 0, sq = 0, sat = 0, n = px.length / 4;
            for (let i = 0; i < px.length; i += 4) { const r = px[i], g = px[i + 1], b = px[i + 2], l = .299 * r + .587 * g + .114 * b; sum += l; sq += l * l; sat += (Math.max(r, g, b) - Math.min(r, g, b)) / 255; }
            const mean = sum / n, sd = Math.sqrt(Math.max(0, sq / n - mean * mean)), sa = sat / n;
            const rows = [
                [25, w >= 1280 && h >= 720 ? "ok" : w >= 640 ? "warn" : "bad", `${w}×${h}px. Recommended 1280×720 (minimum width 640).`],
                [20, Math.abs(ratio - 16 / 9) < 0.04 ? "ok" : "bad", `Aspect ratio ${ratio.toFixed(2)}. YouTube uses 16:9 (1.78).`],
                [15, mb <= 2 ? "ok" : "bad", `File size ${mb.toFixed(2)} MB. The limit is 2 MB.`],
                [10, /jpe?g|png|webp/.test(f.type) ? "ok" : "bad", `Format ${f.type || "unknown"}. Use JPG or PNG.`],
                [10, mean >= 60 && mean <= 200 ? "ok" : "warn", mean < 60 ? "The image is quite dark. It can disappear on dark mode feeds." : mean > 200 ? "The image is very bright. Add contrast so text stays readable." : "Brightness looks balanced."],
                [10, sd >= 40 ? "ok" : "warn", sd >= 40 ? "Good contrast between light and dark areas." : "Low contrast. A clear subject and bold text stand out more."],
                [10, sa >= 0.25 ? "ok" : "warn", sa >= 0.25 ? "Colors are vivid enough to catch attention." : "Colors are muted. A stronger color accent can help it stand out."]
            ];
            setScore($("#thumbScore"), renderChecks(box, rows));
            let mp = $(".mini-preview"); if (!mp) { mp = document.createElement("div"); mp.className = "mini-preview"; $(".preview").appendChild(mp); }
            mp.innerHTML = '<div><canvas width="168" height="94"></canvas><small>Mobile size (168×94)</small></div><div><canvas width="120" height="68"></canvas><small>Sidebar size</small></div>';
            $$("canvas", mp).forEach(cv => cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height));
            box.insertAdjacentHTML("beforeend", '<p class="small" style="margin-top:6px">Brightness, contrast and color checks are simple heuristics, not YouTube rules. Check the small previews: can you still read the text?</p>');
        };
        img.onerror = () => (box.innerHTML = '<div class="check bad"><span class="mark">✕</span><span>This file could not be read as an image.</span></div>');
        img.src = url;
    });
}

/* ---------- YouTube Search ---------- */
if ($("#ytSearch")) {
    const out = $("#ytResults"), btn = $("#ytSearch"), LIMIT = 15;
    const note = document.createElement("p"); note.className = "hint"; btn.after(note);
    const upd = () => (note.textContent = `Searches used today in this browser: ${daily("search", LIMIT).n}/${LIMIT}. Repeated searches are saved and cost nothing.`);
    upd();
    const card = i => `<div class="video"><img src="${esc(i.thumbnail)}" alt="" loading="lazy"><div><h3>${esc(i.title)}</h3><p class="meta">${esc(i.channelTitle)} · ${esc((i.publishedAt || "").slice(0, 10))}</p><p>${esc(i.description.slice(0, 140))}${i.description.length > 140 ? "…" : ""}</p>
        <p><a class="btn btn-primary" href="video-analyzer.html?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + i.videoId)}">Analyze</a> <a class="btn btn-secondary" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(i.videoId)}">Open</a></p></div></div>`;
    const run = async () => {
        const q = $("#ytQuery").value.trim().toLowerCase().replace(/\s+/g, " "), n = $("#ytMax").value;
        if (!q) { out.innerHTML = '<div class="empty">Enter a query and search.</div>'; return; }
        const key = `ytq:${q}|${n}`; let items = null;
        try { items = JSON.parse(sessionStorage.getItem(key) || "null"); } catch {}
        if (!items) {
            const d = daily("search", LIMIT);
            if (!d.left) { out.innerHTML = '<div class="notice">You reached today\'s search limit in this browser. This protects the free YouTube quota. Try again tomorrow, or use the Video Analyzer, which has no such limit.</div>'; return; }
            btn.disabled = true; btn.textContent = "Searching…"; out.innerHTML = '<div class="empty">Searching…</div>';
            try {
                const r = await fetch(`/api/youtube?mode=search&q=${encodeURIComponent(q)}&maxResults=${n}`), raw = await r.text();
                let j; try { j = JSON.parse(raw); } catch { throw new Error(`Backend /api/youtube answered with HTTP ${r.status} and not JSON.`); }
                if (!r.ok || !j.ok) throw new Error(j.error || "Search failed.");
                items = j.items; d.use(); upd(); try { sessionStorage.setItem(key, JSON.stringify(items)); } catch {}
            } catch (e) { out.innerHTML = `<div class="notice">${esc(e.message)}</div>`; return; }
            finally { btn.disabled = false; btn.textContent = "Search YouTube"; }
        }
        out.innerHTML = items.length ? items.map(card).join("") : '<div class="empty">No videos found.</div>';
    };
    btn.addEventListener("click", run);
    $("#ytQuery").addEventListener("keydown", e => e.key === "Enter" && run());
}

/* ---------- Viral Keywords ---------- */
const GENERIC = new Set("video videos official full new channel subscribe watch like share shorts short live episode part trailer".split(" "));
const GEO = new Set(("karachi lahore islamabad rawalpindi peshawar quetta multan faisalabad hyderabad sialkot gujranwala bahawalpur sargodha abbottabad murree swat gilgit hunza sindh punjab balochistan kashmir "
    + "delhi mumbai bangalore chennai kolkata pune ahmedabad jaipur lucknow dubai abudhabi sharjah london paris newyork tokyo seoul istanbul riyadh jeddah mecca makkah madinah medina doha cairo toronto sydney melbourne manchester birmingham berlin rome madrid moscow beijing shanghai bangkok singapore "
    + "pakistan pakistani india indian america american china chinese japan korea turkey saudi arabia emirates england britain canada australia bangladesh afghanistan iran iraq russia ukraine israel palestine gaza egypt qatar kuwait").split(" "));
const pfx = w => w.slice(0, 5);
// keep only videos that really talk about the searched topic (YouTube search can return loosely related, very popular videos)
function relevantItems(items, q) {
    const qt = [...new Set((q.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(x => x.length > 2 && !STOP.has(x)))];
    if (!qt.length) return { items, seed: [] };
    const score = it => { const hay = (it.title + " " + (it.tags || []).join(" ")).toLowerCase(); return qt.filter(t => hay.includes(pfx(t))).length; };
    const need = qt.length <= 2 ? qt.length : Math.ceil(qt.length / 2);
    let kept = items.filter(it => score(it) >= need);
    if (kept.length < 6) kept = items.filter(it => score(it) >= 1);
    return { items: kept, seed: qt };
}
function mineKeywords(items, seed = []) {
    const uni = new Map(), bi = new Map();
    const bump = (m, k, v) => { const o = m.get(k) || { n: 0, views: 0 }; o.n++; o.views += v; m.set(k, o); };
    const seedOk = x => !seed.some(t => x.startsWith(pfx(t)) && pfx(t).length >= 4);
    const ok = x => x.length > 2 && !STOP.has(x) && !GENERIC.has(x) && !GEO.has(x) && !/^\d+$/.test(x);
    items.forEach(it => {
        const toks = (it.title.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
        const u = new Set(toks.filter(ok));
        (it.tags || []).forEach(tg => (tg.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []).forEach(x => ok(x) && u.add(x)));
        u.forEach(k => bump(uni, k, it.views));
        const b = new Set();
        for (let i = 0; i < toks.length - 1; i++) if (ok(toks[i]) && ok(toks[i + 1])) b.add(toks[i] + " " + toks[i + 1]);
        (it.tags || []).forEach(tg => { const k = tg.toLowerCase().trim(), c = k.split(/\s+/).length; if (c >= 2 && c <= 4 && k.length < 40) b.add(k); });
        b.forEach(k => bump(bi, k, it.views));
    });
    const rk = (m, min) => [...m.entries()].map(([k, o]) => ({ k, n: o.n, avg: o.views / o.n, score: o.n * Math.log10(10 + o.views / o.n) })).filter(x => x.n >= min).sort((a, b) => b.score - a.score);
    let words = rk(uni, 2).filter(x => seedOk(x.k)), phrases = rk(bi, 2);
    if (words.length < 6) words = rk(uni, 1).filter(x => seedOk(x.k)); if (phrases.length < 4) phrases = rk(bi, 1);
    const noGeo = x => !x.k.split(" ").some(w => GEO.has(w)); phrases = phrases.filter(noGeo);
    const pct = f => Math.round(items.filter(f).length / Math.max(1, items.length) * 100);
    const first = {}; items.forEach(it => { const w = (it.title.toLowerCase().match(/[\p{L}\p{N}]+/u) || [""])[0]; if (w) first[w] = (first[w] || 0) + 1; });
    return {
        words: words.slice(0, 24), phrases: phrases.slice(0, 14),
        patterns: {
            avgLen: Math.round(items.reduce((a, i) => a + i.title.length, 0) / Math.max(1, items.length)),
            number: pct(i => /\d/.test(i.title)), question: pct(i => /\?/.test(i.title)), bracket: pct(i => /[\[(]/.test(i.title)), caps: pct(i => /\b[A-Z]{3,}\b/.test(i.title)),
            starts: Object.entries(first).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0])
        }
    };
}

if ($("#vkRun")) {
    const out = $("#vkResults"), btn = $("#vkRun"), mode = $("#vkMode"), topic = $("#vkTopic");
    const sync = () => { $("#vkTrendBox").hidden = mode.value !== "trending"; $("#vkNicheBox").hidden = mode.value !== "niche"; };
    mode.addEventListener("change", sync); sync();
    const q0 = new URLSearchParams(location.search);
    if (q0.get("mode") === "niche") { mode.value = "niche"; topic.value = q0.get("q") || ""; sync(); }

    const bars = (a, max) => a.map(x => `<button class="vk-row" data-copy="${esc(x.k)}" title="Click to copy"><span class="vk-k">${esc(x.k)}</span><span class="vk-bar"><i style="width:${Math.max(6, x.score / max * 100)}%"></i></span><span class="vk-n">${x.n}× · ${short(x.avg)} avg views</span></button>`).join("");
    const render = (items, meta, info = {}) => {
        const M = mineKeywords(items, info.seed || []), mw = Math.max(1, ...M.words.map(x => x.score)), mp = Math.max(1, ...M.phrases.map(x => x.score)), P = M.patterns;
        const top = items.slice().sort((a, b) => b.views - a.views).slice(0, 6);
        const kwAll = [...M.phrases.slice(0, 8).map(x => x.k), ...M.words.slice(0, 12).map(x => x.k)];
        out.innerHTML = `<div class="hud enter">
          <div class="hud-bar"><span>Viral keywords</span><b class="live">${esc(meta)}${info.found ? ` · ${items.length} relevant of ${info.found} videos` : ""}</b></div>
          <div class="hud-cols">
            <div class="hp"><h3>Top viral phrases</h3><div class="vk-list">${M.phrases.length ? bars(M.phrases, mp) : '<p class="muted">Not enough repeated phrases in this sample.</p>'}</div></div>
            <div class="hp"><h3>Top viral words</h3><div class="vk-list">${bars(M.words, mw)}</div></div>
          </div>
          <div class="hp"><h3>What winning titles look like</h3>
            <div class="hud-stats">
              <div class="hp hs"><span>Average title length</span><b>${P.avgLen}</b><small>characters</small></div>
              <div class="hp hs"><span>Contain a number</span><b>${P.number}%</b><small>of ${items.length} videos</small></div>
              <div class="hp hs"><span>Are questions</span><b>${P.question}%</b><small>contain “?”</small></div>
              <div class="hp hs"><span>Use brackets</span><b>${P.bracket}%</b><small>( ) or [ ]</small></div>
              <div class="hp hs"><span>Use ALL-CAPS word</span><b>${P.caps}%</b><small>at least one</small></div>
              <div class="hp hs"><span>Common first words</span><b style="font-size:19px">${esc(P.starts.join(", ") || "—")}</b><small>how titles begin</small></div>
            </div></div>
          <div class="hp"><h3>Most viewed videos in this sample</h3>${top.map(t => `<div class="suggestion-card"><div><strong>${fmt(t.views)} views</strong><p>${esc(t.title)}</p><small class="muted">${esc(t.channelTitle)}</small></div><a class="btn btn-secondary" href="video-analyzer.html?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + t.videoId)}">Analyze</a></div>`).join("")}</div>
          <div class="hp"><h3>Use these</h3><p style="margin:0 0 12px">Work the strongest phrases into your title, first description line and tags, but only when they truly match your video.</p>
            <button class="btn btn-primary" data-copy="${esc(kwAll.join(", "))}">Copy top keywords</button>
            <p class="small">These keywords come from videos that are trending or recently top-viewed. They show what is popular now, not search volume or competition.</p></div>
        </div>`;
        const h = $(".hud", out); [...h.children].forEach((c, i) => (c.style.animationDelay = i * 110 + "ms"));
        out.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const fetchJson = async url => {
        const r = await fetch(url), raw = await r.text(); let j;
        try { j = JSON.parse(raw); } catch { throw new Error(`Backend /api/youtube answered with HTTP ${r.status} and not JSON.`); }
        if (!r.ok || !j.ok) throw new Error(j.error || "Request failed.");
        return j;
    };
    btn.addEventListener("click", async () => {
        const msg = $("#vkMessage"); msg.innerHTML = "";
        let url, key, meta;
        if (mode.value === "trending") {
            const rg = $("#vkRegion").value, cat = $("#vkCategory").value;
            url = `/api/youtube?mode=trending&region=${rg}&category=${cat}`; key = `vk:t:${rg}:${cat}`;
            meta = `Trending now · ${$("#vkRegion").selectedOptions[0].text} · ${$("#vkCategory").selectedOptions[0].text}`;
        } else {
            const q = topic.value.trim().toLowerCase().replace(/\s+/g, " ");
            if (!q) { msg.innerHTML = '<div class="notice">Type a topic for the niche deep dive.</div>'; return; }
            url = `/api/youtube?mode=niche&q=${encodeURIComponent(q)}`; key = `vk:n:${q}`; meta = `Top videos of the last 30 days · “${q}”`;
        }
        let cached = null; try { cached = JSON.parse(sessionStorage.getItem(key) || "null"); } catch {}
        if (!cached && mode.value === "niche") {
            const d = daily("niche", 5);
            if (!d.left) { msg.innerHTML = '<div class="notice">You used today\'s 5 niche deep dives in this browser. They cost a lot of YouTube quota. Trending mode is still available.</div>'; return; }
        }
        btn.disabled = true; btn.textContent = "Analyzing…"; out.innerHTML = '<div class="hud-load"><span></span>Reading the top videos and mining keywords…</div>';
        try {
            const items = cached || (await fetchJson(url)).items;
            if (!cached) { try { sessionStorage.setItem(key, JSON.stringify(items)); } catch {} if (mode.value === "niche") daily("niche", 5).use(); }
            if (!items.length) throw new Error("No videos found for this choice. Try another region, category or topic.");
            if (mode.value === "niche") {
                const R = relevantItems(items, topic.value);
                if (R.items.length < 4) throw new Error(`Only ${R.items.length} videos from the last 30 days really match “${topic.value.trim()}”. That is too few for reliable keywords. Try a broader or more common topic.`);
                render(R.items.sort((a, b) => b.views - a.views), meta, { found: items.length, seed: R.seed });
            } else render(items, meta);
        } catch (e) { out.innerHTML = ""; msg.innerHTML = `<div class="notice">${esc(e.message)}</div>`; }
        finally { btn.disabled = false; btn.textContent = "Find viral keywords"; }
    });
    out.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy, b.classList.contains("btn") ? b : null); });
    topic.addEventListener("keydown", e => e.key === "Enter" && btn.click());
    if (q0.get("mode") === "niche" && topic.value) btn.click();
}
