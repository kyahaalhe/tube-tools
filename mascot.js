/* Tubi — cute helper + feedback. No dependencies. */
(function () {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s);
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const page = location.pathname.split("/").pop() || "index.html";
    const TIPS = {
        "index.html": "Hi, I'm Tubi! Start with the Video Analyzer: paste any public video and I'll show why it did or did not go viral.",
        "video-analyzer.html": "Paste a public YouTube link. Past results are saved in your browser, so reopening them costs no API quota.",
        "viral-keywords.html": "Trending mode is cheap. Niche mode costs more quota, so I save your repeated topics for you.",
        "title-analyzer.html": "Tip: keep titles around 40–70 characters and put your main keyword near the start.",
        "keyword-analyzer.html": "Question keywords (how to, why, is it worth it) are great for video ideas.",
        "description-checker.html": "The first 150 characters matter most. Say what the video is about, with your keyword.",
        "hashtag-generator.html": "Use 3–5 hashtags. If you add more than 15, YouTube ignores all of them.",
        "thumbnail-checker.html": "Shrink your thumbnail to phone size: can you still read the text?",
        "seo-score.html": "Make sure your main keyword is in the title, the first line of the description, and a tag.",
        "youtube-search.html": "Searches use a lot of YouTube quota, so I remember repeated searches for you.",
        "privacy.html": "Your feedback goes only to the site owner. Nothing is sold or shared."
    };
    const FACE = `<svg viewBox="0 0 120 130" class="tb-svg" aria-hidden="true">
      <defs><linearGradient id="tbBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5965"/><stop offset="1" stop-color="#e0172b"/></linearGradient></defs>
      <ellipse class="tb-shadow" cx="60" cy="124" rx="30" ry="4.5" fill="rgba(0,0,0,.4)"/>
      <g class="tb-float">
        <line x1="60" y1="27" x2="60" y2="13" stroke="#9aa5b7" stroke-width="3" stroke-linecap="round"/><circle class="tb-ant" cx="60" cy="9" r="5" fill="#3fb6ff"/>
        <rect class="tb-arm-l" x="4" y="63" width="18" height="11" rx="5.5" fill="#c9132a"/><rect class="tb-arm-r" x="98" y="63" width="18" height="11" rx="5.5" fill="#c9132a"/>
        <rect x="38" y="98" width="17" height="11" rx="5.5" fill="#c9132a"/><rect x="65" y="98" width="17" height="11" rx="5.5" fill="#c9132a"/>
        <rect x="14" y="26" width="92" height="76" rx="26" fill="url(#tbBody)"/><rect x="14" y="26" width="92" height="76" rx="26" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2"/>
        <rect x="24" y="36" width="72" height="50" rx="18" fill="#0a0f1a"/><rect x="24" y="36" width="72" height="50" rx="18" fill="none" stroke="rgba(63,182,255,.5)" stroke-width="1.5"/>
        <g class="e-open"><ellipse cx="46" cy="57" rx="7.5" ry="9" fill="#fff"/><ellipse cx="74" cy="57" rx="7.5" ry="9" fill="#fff"/>
          <circle class="pupil" cx="46" cy="58" r="4.4" fill="#0a0f1a"/><circle class="pupil" cx="74" cy="58" r="4.4" fill="#0a0f1a"/></g>
        <g class="e-happy"><path d="M38 61q8-12 16 0M66 61q8-12 16 0" fill="none" stroke="#7ee7c0" stroke-width="3.6" stroke-linecap="round"/></g>
        <ellipse cx="34" cy="70" rx="5.5" ry="3.2" fill="#ff7a8a" opacity=".6"/><ellipse cx="86" cy="70" rx="5.5" ry="3.2" fill="#ff7a8a" opacity=".6"/>
        <path class="mo-smile" d="M51 72q9 8 18 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path class="mo-big" d="M50 71q10 14 20 0z" fill="#ff7a8a" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
        <path class="mo-sad" d="M52 78q8-8 16 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <ellipse class="mo-o" cx="60" cy="75" rx="4.5" ry="5.5" fill="#fff"/>
      </g></svg>`;

    const root = document.createElement("div"); root.id = "tubi";
    root.innerHTML = `<div class="tubi-bubble" role="status" hidden><span class="tb-text"></span><button class="tb-x" type="button" aria-label="Dismiss">×</button></div>
      <div class="tubi-panel" role="dialog" aria-label="Tubi, your TubeTools helper" hidden>
        <div class="tp-head"><div class="tp-av"><img src="logo.svg" alt=""></div><div><b>Tubi</b><small>Your TubeTools helper</small></div><button class="tp-x" type="button" aria-label="Close">×</button></div>
        <div class="tp-body"></div></div>
      <button class="tubi-btn" type="button" aria-label="Open Tubi, your helper" aria-expanded="false">${FACE}<span class="tubi-badge"></span></button>`;
    document.body.appendChild(root);
    const btn = $(".tubi-btn", root), bub = $(".tubi-bubble", root), panel = $(".tubi-panel", root), body = $(".tp-body", panel);
    let mood = "", moodT, bubT, typeT, rating = 0;

    const setMood = (m, ms = 6000) => { root.classList.remove("m-happy", "m-sad", "m-wow"); if (m) root.classList.add("m-" + m); clearTimeout(moodT); if (m) moodT = setTimeout(() => root.classList.remove("m-happy", "m-sad", "m-wow"), ms); };
    const act = cls => { root.classList.remove(cls); void root.offsetWidth; root.classList.add(cls); setTimeout(() => root.classList.remove(cls), 1400); };
    const wave = () => !reduce && act("waving");
    const jump = () => !reduce && act("jump");
    const hearts = (n = 8) => { if (reduce) return; for (let i = 0; i < n; i++) { const h = document.createElement("i"); h.className = "tb-heart"; h.textContent = "♥"; h.style.setProperty("--hx", (Math.random() * 120 - 70) + "px"); h.style.setProperty("--hr", (Math.random() * 60 - 30) + "deg"); h.style.animationDelay = i * 90 + "ms"; h.style.fontSize = 14 + Math.random() * 14 + "px"; root.appendChild(h); setTimeout(() => h.remove(), 1700 + i * 90); } };
    const say = (text, m, ms = 9000) => {
        if (!panel.hidden) return;
        $(".tb-text", bub).textContent = text; bub.hidden = false; bub.style.animation = "none"; void bub.offsetWidth; bub.style.animation = "";
        if (m) setMood(m); clearTimeout(bubT); bubT = setTimeout(() => (bub.hidden = true), ms);
    };
    const typeInto = (el, text) => { clearInterval(typeT); if (reduce) { el.textContent = text; return; } el.textContent = ""; let i = 0; typeT = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeT); }, 16); };

    // pupils follow the pointer
    let raf = 0;
    document.addEventListener("pointermove", e => {
        if (reduce || raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0; const r = btn.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(3.2, d / 60);
            root.querySelectorAll(".pupil").forEach(p => (p.style.transform = `translate(${dx / d * k}px, ${dy / d * k}px)`));
        });
    });

    /* ---------- panel views ---------- */
    function home(msg) {
        body.innerHTML = `<div class="tp-msg"></div>
          <div class="tp-chips">
            <a class="tp-chip" href="video-analyzer.html">🎬 Analyze a video</a><a class="tp-chip" href="viral-keywords.html">🔥 Viral keywords</a>
            <button class="tp-chip" type="button" data-a="status">🟢 Is the API working?</button><button class="tp-chip" type="button" data-a="keys">⌨️ Shortcuts</button>
            <button class="tp-chip hot" type="button" data-a="fb">💬 Give feedback</button></div>`;
        typeInto($(".tp-msg", body), msg || TIPS[page] || TIPS["index.html"]);
    }
    const FACES = [["😞", "Bad"], ["😐", "Okay"], ["🙂", "Good"], ["😍", "Love it"]];
    function feedback() {
        rating = 0; setMood("wow", 2500);
        body.innerHTML = `<p class="tp-q">How is TubeTools for you?</p>
          <div class="tp-faces">${FACES.map((f, i) => `<button type="button" class="tp-face" data-r="${i + 1}" aria-label="${f[1]}">${f[0]}<small>${f[1]}</small></button>`).join("")}</div>
          <textarea class="tp-ta" maxlength="800" placeholder="What should I improve? Bugs, ideas, anything…"></textarea>
          <input class="tp-in" maxlength="120" placeholder="Email or Instagram (optional)" autocomplete="off">
          <input class="tp-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p class="tp-err" hidden></p>
          <div class="tp-row"><button type="button" class="tp-back" data-a="home">‹ Back</button><button type="button" class="btn btn-primary" data-a="send">Send feedback</button></div>
          <p class="tp-note">Your message goes to the site owner only. Please do not include passwords.</p>`;
    }
    async function send() {
        const err = $(".tp-err", body), b = $("[data-a=send]", body), msg = $(".tp-ta", body).value.trim();
        if (!rating && !msg) { err.textContent = "Pick a face or write a short message first."; err.hidden = false; setMood("sad", 2500); return; }
        err.hidden = true; b.disabled = true; b.textContent = "Sending…";
        try {
            const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, message: msg, contact: $(".tp-in", body).value.trim(), page, hp: $(".tp-hp", body).value }) });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j.ok) throw new Error(j.error || "Could not send right now.");
            body.innerHTML = `<div class="tp-done"><span class="big">💖</span><b>Thank you!</b><p class="tp-note" style="margin-top:8px;font-size:13px">Your feedback helps me get better. I read every message.</p></div><div class="tp-row"><button type="button" class="btn btn-secondary" data-a="home">Back to tips</button></div>`;
            setMood("happy", 7000); jump(); hearts(10);
        } catch (e) { err.textContent = e.message; err.hidden = false; b.disabled = false; b.textContent = "Send feedback"; setMood("sad", 3000); }
    }
    async function status() {
        const m = $(".tp-msg", body); typeInto(m, "Checking…"); setMood("wow", 2000);
        try { const r = await fetch("/api/youtube?mode=status"), j = await r.json(); typeInto(m, r.ok && j.ok ? "Yes! The YouTube connection is working. 🎉" : "Hmm: " + (j.error || "the API is not answering right now.")); setMood(r.ok && j.ok ? "happy" : "sad"); }
        catch { typeInto(m, "I could not reach the server. Check your internet and try again."); setMood("sad"); }
    }

    body.addEventListener("click", e => {
        const f = e.target.closest(".tp-face");
        if (f) { rating = +f.dataset.r; body.querySelectorAll(".tp-face").forEach(x => x.classList.toggle("on", x === f)); setMood(rating >= 3 ? "happy" : rating === 1 ? "sad" : "", 3000); return; }
        const a = e.target.closest("[data-a]"); if (!a) return;
        ({ fb: feedback, home: () => home(), send, status, keys: () => typeInto($(".tp-msg", body), "Press Ctrl+K (or /) to jump to any tool. Esc closes dialogs. On the analyzer, the tabs jump between sections.") })[a.dataset.a]?.();
    });

    const open = () => { panel.hidden = false; bub.hidden = true; btn.setAttribute("aria-expanded", "true"); home(); wave(); setMood("happy", 2500); };
    const close = () => { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", () => (panel.hidden ? open() : close()));
    $(".tp-x", panel).addEventListener("click", () => { close(); btn.focus(); });
    $(".tb-x", bub).addEventListener("click", () => (bub.hidden = true));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { close(); btn.focus(); } });
    document.addEventListener("click", e => { if (!panel.hidden && e.target.isConnected && !root.contains(e.target)) close(); });

    /* ---------- Tubi reacts to what you do ---------- */
    document.addEventListener("tt:analyzed", e => {
        const d = e.detail || {};
        if (d.limited) return say("The YouTube quota is used up, so this is limited mode. The full analysis is back after the reset.", "sad");
        const s = d.score;
        if (s >= 75) { say(`Wow, ${s}/100! That video is a viral one!`, "happy"); jump(); hearts(6); }
        else if (s >= 55) say(`${s}/100, solid! Tick off the action plan to push it higher.`, "happy");
        else if (s >= 35) say(`${s}/100, average. The SEO pack can lift it.`, "wow");
        else say(`${s}/100 is low, but fixable. Start with the action plan.`, "sad");
        wave();
    });
    document.addEventListener("tt:error", e => say("Oops! " + String((e.detail || {}).message || "Something went wrong.").slice(0, 110), "sad", 10000));

    /* greet once per page per session, wave now and then */
    const key = "tt_tubi_" + page;
    let seen = false; try { seen = !!sessionStorage.getItem(key); sessionStorage.setItem(key, "1"); } catch {}
    if (!seen) setTimeout(() => { if (panel.hidden) { say(TIPS[page] || TIPS["index.html"], "happy", 10000); wave(); } }, page === "index.html" ? 4200 : 2200);
    if (!reduce) setInterval(() => panel.hidden && bub.hidden && wave(), 28000);
})();
