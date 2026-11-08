/* TubeTools site-wide effects (no dependencies) */
(function () {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

    // toast (used by copy buttons)
    let tt;
    window.toast = msg => {
        let t = $(".toast");
        if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
        t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 1400);
    };

    // scroll progress bar
    const bar = document.createElement("div"); bar.id = "scrollbar"; document.body.appendChild(bar);
    const onScroll = () => { const h = document.documentElement; bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + "%"; };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // mobile menu
    const inner = $(".nav-inner"), links = $(".nav-links");
    if (inner && links) {
        const b = document.createElement("button");
        b.className = "nav-toggle"; b.type = "button"; b.setAttribute("aria-label", "Menu"); b.textContent = "☰";
        b.onclick = () => { const o = links.classList.toggle("open"); b.textContent = o ? "✕" : "☰"; };
        inner.insertBefore(b, links);
    }

    // page transitions
    if (!reduce) document.addEventListener("click", e => {
        const a = e.target.closest("a[href]");
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target || a.origin !== location.origin) return;
        if (a.pathname === location.pathname && a.search === location.search) return;
        e.preventDefault(); document.body.classList.add("leaving");
        setTimeout(() => (location.href = a.href), 170);
    });
    addEventListener("pageshow", e => e.persisted && document.body.classList.remove("leaving"));

    // reveal on scroll
    const targets = $$(".card, .step, .section-title, .tool-head, .form-card, .result");
    if (reduce || !("IntersectionObserver" in window)) targets.forEach(t => t.setAttribute("data-reveal", "") || t.classList.add("in"));
    else {
        const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
        targets.forEach((t, i) => { t.setAttribute("data-reveal", ""); t.style.setProperty("--d", (i % 3) * 90 + "ms"); io.observe(t); });
    }

    // card spotlight
    document.addEventListener("pointermove", e => {
        const c = e.target.closest && e.target.closest(".card");
        if (c) { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); }
    });

    // hero particle network
    const hero = $(".hero");
    if (hero && !reduce) {
        const cv = document.createElement("canvas"); cv.id = "heroFx"; hero.prepend(cv);
        const ctx = cv.getContext("2d"); let w, h, pts = [], raf, mouse = { x: -999, y: -999 };
        const size = () => { const d = Math.min(devicePixelRatio || 1, 2); w = hero.clientWidth; h = hero.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
            const n = Math.min(60, Math.floor(w / 24)); pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6, red: Math.random() < .25 })); };
        size(); addEventListener("resize", size);
        hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
        hero.addEventListener("pointerleave", () => (mouse.x = mouse.y = -999));
        const frame = () => {
            ctx.clearRect(0, 0, w, h);
            pts.forEach(p => {
                p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy); if (d < 110) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
            });
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i];
                for (let j = i + 1; j < pts.length; j++) { const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 120) { ctx.strokeStyle = `rgba(63,182,255,${(1 - d / 120) * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
                ctx.fillStyle = a.red ? "rgba(255,48,64,.8)" : "rgba(143,208,255,.75)"; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 7); ctx.fill();
            }
            raf = requestAnimationFrame(frame);
        };
        frame();
        document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) frame(); });
    }

    // ---------- logo splash v2 (homepage, once per session) ----------
    const home = !!$(".hero");
    let splashed = false;
    if (home && !reduce) document.body.classList.add("intro");
    if (home && !reduce && !sessionStorage.getItem("tt_splash2")) {
        try { sessionStorage.setItem("tt_splash2", "1"); } catch {}
        splashed = true;
        const s = document.createElement("div"); s.className = "sp2";
        const word = "TubeTools".split("").map((c, i) => `<span style="--i:${i}"${i >= 4 ? ' class="r"' : ""}>${c}</span>`).join("");
        s.innerHTML = `<div class="sp2-half t"></div><div class="sp2-half b"></div><div class="sp2-glow"></div>
          <div class="sp2-c">
            <div class="sp2-lw"><div class="sp2-ripples"><i></i><i></i><i></i></div>
              <svg class="sp2-logo" viewBox="0 0 64 64"><defs><linearGradient id="spg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a75"/><stop offset="1" stop-color="#e0172b"/></linearGradient></defs>
                <rect class="tile" width="64" height="64" rx="16" fill="#080b12"/><rect x="1.5" y="1.5" width="61" height="61" rx="14.5" fill="none" stroke="#252d3d" stroke-width="1.5"/>
                <path class="br" pathLength="1" d="M14 25v-8a3 3 0 0 1 3-3h8M39 14h8a3 3 0 0 1 3 3v8M50 39v8a3 3 0 0 1-3 3h-8M25 50h-8a3 3 0 0 1-3-3v-8" fill="none" stroke="#3fb6ff" stroke-width="3.2" stroke-linecap="round"/>
                <path class="pl" d="M27 23.6v16.8a1.6 1.6 0 0 0 2.4 1.4l14-8.4a1.6 1.6 0 0 0 0-2.8l-14-8.4a1.6 1.6 0 0 0-2.4 1.4z" fill="url(#spg)"/></svg></div>
            <div class="sp2-word">${word}</div>
            <div class="sp2-tag">Make better YouTube content faster</div>
            <div class="sp2-bar"><i></i></div>
          </div><button class="sp2-skip" type="button">Skip ›</button>`;
        document.body.appendChild(s); document.body.style.overflow = "hidden";
        let ended = false;
        const end = () => { if (ended) return; ended = true; s.classList.add("open"); document.body.style.overflow = ""; document.body.classList.add("site-in"); setTimeout(() => s.remove(), 1100); };
        s.addEventListener("click", end); setTimeout(end, 3000);
    } else document.body.classList.add("site-in");

    // hero headline: word-by-word entrance
    const h1 = $(".hero h1");
    if (h1 && !reduce) {
        let wi = 0;
        [...h1.childNodes].forEach(c => {
            if (c.nodeType === 3) {
                const f = document.createDocumentFragment();
                c.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(" ")); else { const w = document.createElement("span"); w.className = "hw"; w.style.setProperty("--w", wi++); w.textContent = t; f.appendChild(w); } });
                c.replaceWith(f);
            } else if (c.nodeType === 1) { c.classList.add("hw", "acc"); c.style.setProperty("--w", wi++); }
        });
    }

    // ---------- tool list: related tools, command palette ----------
    const TOOLS = [
        ["Video Analyzer", "video-analyzer.html", "See why a video went viral or not"],
        ["Viral Keywords", "viral-keywords.html", "Keywords from trending and top videos"],
        ["Title Analyzer", "title-analyzer.html", "Score a title and get better ones"],
        ["Keyword Analyzer", "keyword-analyzer.html", "Keyword and search-intent ideas"],
        ["Description Checker", "description-checker.html", "Check a description before publishing"],
        ["Hashtag Generator", "hashtag-generator.html", "Hashtags and tags for your topic"],
        ["Thumbnail Checker", "thumbnail-checker.html", "Check size, ratio, contrast"],
        ["SEO Score", "seo-score.html", "Title, description and tags in one score"],
        ["YouTube Search", "youtube-search.html", "Search public YouTube videos"]
    ];
    const page = location.pathname.split("/").pop() || "index.html";
    const REL = { "title-analyzer.html": [5, 7, 0], "keyword-analyzer.html": [1, 2, 5], "viral-keywords.html": [3, 2, 0], "description-checker.html": [7, 5, 2], "hashtag-generator.html": [3, 7, 0], "thumbnail-checker.html": [2, 7, 0], "seo-score.html": [2, 4, 3], "youtube-search.html": [0, 1, 3], "video-analyzer.html": [1, 2, 7] };
    if (REL[page]) {
        const sec = document.createElement("section"); sec.className = "related";
        sec.innerHTML = `<div class="container"><h2>More tools</h2><div class="rel-grid">${REL[page].map(i => `<a class="card tool-card" href="${TOOLS[i][1]}"><h3>${TOOLS[i][0]}</h3><p>${TOOLS[i][2]}</p><span class="link">Open tool →</span></a>`).join("")}</div></div>`;
        const f = $("footer"); f && f.before(sec);
        if (!reduce && "IntersectionObserver" in window) { const io = new IntersectionObserver(es => es.forEach(en => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target)))); $$(".rel-grid .card", sec).forEach((c, i) => { c.setAttribute("data-reveal", ""); c.style.setProperty("--d", i * 90 + "ms"); io.observe(c); }); }
    }

    const pal = document.createElement("div"); pal.className = "pal"; pal.hidden = true;
    pal.innerHTML = '<div class="pal-box" role="dialog" aria-label="Jump to a tool"><input class="pal-in" placeholder="Jump to a tool…" aria-label="Search tools" autocomplete="off"><div class="pal-list"></div><div class="pal-hint">↑ ↓ move · Enter open · Esc close</div></div>';
    document.body.appendChild(pal);
    const pin = $(".pal-in", pal), plist = $(".pal-list", pal); let psel = 0, pitems = TOOLS;
    const prender = () => { plist.innerHTML = pitems.map((t, i) => `<a class="pal-row${i === psel ? " on" : ""}" href="${t[1]}" data-i="${i}"><b>${t[0]}</b><span>${t[2]}</span></a>`).join("") || '<div class="pal-none">No tool found</div>'; };
    const popen = () => { pal.hidden = false; pin.value = ""; pitems = TOOLS; psel = 0; prender(); setTimeout(() => pin.focus(), 20); };
    const pclose = () => (pal.hidden = true);
    pin.addEventListener("input", () => { const q = pin.value.toLowerCase().trim(); pitems = TOOLS.filter(t => (t[0] + " " + t[2]).toLowerCase().includes(q)); psel = 0; prender(); });
    pin.addEventListener("keydown", e => {
        if (e.key === "ArrowDown") { psel = Math.min(pitems.length - 1, psel + 1); prender(); e.preventDefault(); }
        else if (e.key === "ArrowUp") { psel = Math.max(0, psel - 1); prender(); e.preventDefault(); }
        else if (e.key === "Enter" && pitems[psel]) location.href = pitems[psel][1];
    });
    pal.addEventListener("click", e => { if (e.target === pal) pclose(); });
    document.addEventListener("keydown", e => {
        const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || "");
        if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); pal.hidden ? popen() : pclose(); }
        else if (e.key === "Escape" && !pal.hidden) pclose();
    });
    if (inner) { const sb = document.createElement("button"); sb.className = "nav-search"; sb.type = "button"; sb.setAttribute("aria-label", "Search tools (Ctrl+K)"); sb.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg>'; sb.onclick = popen; inner.appendChild(sb); }

    // back to top
    const top = document.createElement("button"); top.className = "totop"; top.type = "button"; top.setAttribute("aria-label", "Back to top"); top.textContent = "↑";
    top.onclick = () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); document.body.appendChild(top);
    addEventListener("scroll", () => top.classList.toggle("show", scrollY > 700), { passive: true });
})();
