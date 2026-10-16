const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function escapeHtml(s = "") {
    return String(s).replace(/[&<>'"]/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[c]));
}

function words(s = "") {
    return String(s).trim()
        ? String(s).trim().split(/\s+/).length
        : 0;
}

function setScore(el, value) {
    if (!el) return;

    const v = Math.max(
        0,
        Math.min(100, Math.round(value))
    );

    const deg = v * 3.6;

    el.style.background =
        `conic-gradient(var(--red) ${deg}deg, rgba(255,255,255,.07) ${deg}deg)`;

    const span = $("span", el);

    if (span) {
        span.textContent = v;
    }
}

function copyText(text, button) {
    if (!text) return;

    navigator.clipboard
        ?.writeText(text)
        .then(() => {
            if (!button) return;

            const old = button.textContent;

            button.textContent = "Copied!";

            setTimeout(() => {
                button.textContent = old;
            }, 1200);
        })
        .catch(() => {
            alert(
                "Copy failed. Please copy manually."
            );
        });
}

function setActive() {
    const file =
        location.pathname.split("/").pop() ||
        "index.html";

    $$(".nav-links a").forEach(a => {
        if (a.getAttribute("href") === file) {
            a.classList.add("active");
        }
    });
}

setActive();


/* =========================
   TITLE ANALYZER
========================= */

function analyzeTitle() {
    const input = $("#titleInput");

    if (!input) return;

    const title = input.value.trim();

    const length = title.length;

    const wordCount = words(title);

    const lower = title.toLowerCase();

    const powerWords = [
        "how",
        "best",
        "easy",
        "guide",
        "tips",
        "tutorial",
        "review",
        "2026",
        "secret",
        "mistakes",
        "ways",
        "ultimate",
        "free",
        "learn"
    ];

    const hasPower =
        powerWords.some(
            word => lower.includes(word)
        );

    const hasNumber =
        /\d/.test(title);

    const hasSeparator =
        /[!?|:–-]/.test(title);

    let score = 0;

    if (length >= 45 && length <= 65) {
        score += 35;
    } else if (
        length >= 35 &&
        length <= 70
    ) {
        score += 25;
    } else if (length) {
        score += 12;
    }

    if (
        wordCount >= 6 &&
        wordCount <= 12
    ) {
        score += 20;
    } else if (wordCount >= 4) {
        score += 12;
    }

    if (hasPower) score += 15;

    if (hasNumber) score += 10;

    if (hasSeparator) score += 10;

    if (/\b(you|your)\b/i.test(title)) {
        score += 5;
    }

    setScore($("#titleScore"), score);

    if ($("#titleChars")) {
        $("#titleChars").textContent = length;
    }

    if ($("#titleWords")) {
        $("#titleWords").textContent = wordCount;
    }

    if ($("#titlePower")) {
        $("#titlePower").textContent =
            hasPower ? "Yes" : "No";
    }

    if ($("#titleNumber")) {
        $("#titleNumber").textContent =
            hasNumber ? "Yes" : "No";
    }

    if ($("#titleChecks")) {
        const checks = [
            [
                length >= 45 && length <= 65,
                "Good title length: 45–65 characters is a practical target."
            ],
            [
                wordCount >= 6 &&
                    wordCount <= 12,
                "Clear word count: keep the topic specific and easy to scan."
            ],
            [
                hasPower,
                "Contains a useful action or benefit word."
            ],
            [
                hasNumber,
                "A number can make a promise more concrete when it fits naturally."
            ],
            [
                hasSeparator,
                "A separator or punctuation can help structure the title."
            ]
        ];

        $("#titleChecks").innerHTML =
            checks.map(([ok, text]) => `
                <div class="check ${ok ? "ok" : "bad"}">
                    <span class="mark">
                        ${ok ? "✓" : "•"}
                    </span>
                    <span>${text}</span>
                </div>
            `).join("");
    }
}

$("#titleAnalyze")
    ?.addEventListener(
        "click",
        analyzeTitle
    );

$("#titleInput")
    ?.addEventListener(
        "input",
        analyzeTitle
    );


/* =========================
   KEYWORDS
========================= */

function keywordIdeas() {
    const input = $("#keywordTopic");

    if (!input) return;

    const topic = input.value.trim();

    if (!topic) {
        $("#keywordResults").innerHTML =
            '<div class="empty">Enter a YouTube topic first.</div>';
        return;
    }

    const year =
        new Date().getFullYear();

    const ideas = [
        `how to ${topic}`,
        `${topic} tutorial`,
        `${topic} for beginners`,
        `best ${topic}`,
        `${topic} tips`,
        `${topic} guide`,
        `${topic} explained`,
        `${topic} step by step`,
        `easy ${topic}`,
        `${topic} mistakes to avoid`,
        `${topic} ideas`,
        `${topic} review`,
        `${topic} tools`,
        `${topic} ${year}`
    ];

    const unique = [
        ...new Set(
            ideas.map(x =>
                x.charAt(0).toUpperCase() +
                x.slice(1)
            )
        )
    ];

    $("#keywordResults").innerHTML =
        unique.map((item, index) => `
            <div
                class="chip"
                data-copy="${escapeHtml(item)}"
            >
                ${index + 1}. ${escapeHtml(item)}
            </div>
        `).join("");

    $("#keywordResults")
        .classList.add("chips");

    if ($("#keywordCount")) {
        $("#keywordCount").textContent =
            unique.length;
    }

    $$("#keywordResults .chip")
        .forEach(chip => {
            chip.onclick = () =>
                copyText(
                    chip.dataset.copy,
                    chip
                );
        });
}

$("#keywordGenerate")
    ?.addEventListener(
        "click",
        keywordIdeas
    );

$("#keywordTopic")
    ?.addEventListener(
        "keydown",
        e => {
            if (e.key === "Enter") {
                keywordIdeas();
            }
        }
    );

$("#keywordCopyAll")
    ?.addEventListener(
        "click",
        () => {
            const text =
                $$("#keywordResults .chip")
                    .map(x => x.dataset.copy)
                    .join("\n");

            copyText(
                text,
                $("#keywordCopyAll")
            );
        }
    );


/* =========================
   DESCRIPTION
========================= */

function checkDescription() {
    const input =
        $("#descriptionInput");

    if (!input) return;

    const text =
        input.value.trim();

    const wordCount =
        words(text);

    const charCount =
        text.length;

    const links =
        (
            text.match(
                /https?:\/\/\S+/gi
            ) || []
        ).length;

    const hashtags =
        (
            text.match(
                /#[\w-]+/g
            ) || []
        ).length;

    let score = 0;

    if (
        wordCount >= 100 &&
        wordCount <= 300
    ) {
        score += 35;
    } else if (wordCount >= 50) {
        score += 23;
    } else if (wordCount) {
        score += 10;
    }

    if (links) score += 15;

    if (
        hashtags >= 1 &&
        hashtags <= 8
    ) {
        score += 15;
    }

    const hasCta =
        /subscribe|comment|like|check out|learn more/i
            .test(text);

    if (hasCta) score += 15;

    if (/\n/.test(text)) {
        score += 10;
    }

    if (charCount >= 500) {
        score += 10;
    }

    setScore(
        $("#descScore"),
        score
    );

    if ($("#descWords")) {
        $("#descWords").textContent =
            wordCount;
    }

    if ($("#descChars")) {
        $("#descChars").textContent =
            charCount;
    }

    if ($("#descLinks")) {
        $("#descLinks").textContent =
            links;
    }

    if ($("#descHashtags")) {
        $("#descHashtags").textContent =
            hashtags;
    }

    if ($("#descChecks")) {
        const checks = [
            [
                wordCount >= 100,
                "Description has 100+ words."
            ],
            [
                links >= 1,
                "Includes at least one link or resource."
            ],
            [
                hashtags >= 1 &&
                    hashtags <= 8,
                "Uses a small focused hashtag set."
            ],
            [
                hasCta,
                "Includes a clear call to action."
            ],
            [
                /\n/.test(text),
                "Uses line breaks for easier scanning."
            ]
        ];

        $("#descChecks").innerHTML =
            checks.map(([ok, message]) => `
                <div class="check ${ok ? "ok" : "bad"}">
                    <span class="mark">
                        ${ok ? "✓" : "•"}
                    </span>
                    <span>${message}</span>
                </div>
            `).join("");
    }
}

$("#descCheck")
    ?.addEventListener(
        "click",
        checkDescription
    );

$("#descriptionInput")
    ?.addEventListener(
        "input",
        checkDescription
    );


/* =========================
   HASHTAGS
========================= */

function makeHashtags() {
    const input =
        $("#hashtagTopic");

    if (!input) return;

    const topic =
        input.value.trim();

    if (!topic) {
        $("#hashtagResults").innerHTML =
            '<div class="empty">Enter a topic first.</div>';
        return;
    }

    const parts =
        topic
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean);

    const joined =
        parts.join("");

    const tags = [
        ...parts.slice(0, 3)
            .map(x => "#" + x),

        "#YouTube",
        "#YouTuber",
        "#ContentCreator",
        "#CreatorTips",
        "#VideoTips",
        "#YouTubeTips",
        "#" + joined,
        "#" + joined + "Tips"
    ];

    const unique =
        [...new Set(tags)].slice(0, 15);

    $("#hashtagResults").innerHTML =
        unique.map(tag => `
            <div
                class="chip"
                data-copy="${escapeHtml(tag)}"
            >
                ${escapeHtml(tag)}
            </div>
        `).join("");

    $("#hashtagResults")
        .classList.add("chips");

    $("#hashtagCopyAll")
        .dataset.text =
        unique.join(" ");

    $$("#hashtagResults .chip")
        .forEach(chip => {
            chip.onclick = () =>
                copyText(
                    chip.dataset.copy,
                    chip
                );
        });
}

$("#hashtagGenerate")
    ?.addEventListener(
        "click",
        makeHashtags
    );

$("#hashtagTopic")
    ?.addEventListener(
        "keydown",
        e => {
            if (e.key === "Enter") {
                makeHashtags();
            }
        }
    );

$("#hashtagCopyAll")
    ?.addEventListener(
        "click",
        e => {
            copyText(
                e.currentTarget.dataset.text || "",
                e.currentTarget
            );
        }
    );


/* =========================
   THUMBNAIL
========================= */

$("#thumbInput")
    ?.addEventListener(
        "change",
        e => {
            const file =
                e.target.files?.[0];

            if (!file) return;

            const image =
                $("#thumbPreview");

            image.src =
                URL.createObjectURL(file);

            image.onload = () => {
                const width =
                    image.naturalWidth;

                const height =
                    image.naturalHeight;

                const ratio =
                    width / height;

                let score = 0;

                if (
                    width >= 1280 &&
                    height >= 720
                ) {
                    score += 45;
                } else if (
                    width >= 640 &&
                    height >= 360
                ) {
                    score += 30;
                }

                if (
                    Math.abs(
                        ratio - 16 / 9
                    ) < 0.03
                ) {
                    score += 30;
                }

                if (
                    file.size <=
                    2 * 1024 * 1024
                ) {
                    score += 15;
                } else {
                    score += 5;
                }

                setScore(
                    $("#thumbScore"),
                    score
                );

                if ($("#thumbW"))
                    $("#thumbW").textContent =
                        width;

                if ($("#thumbH"))
                    $("#thumbH").textContent =
                        height;

                if ($("#thumbRatio"))
                    $("#thumbRatio").textContent =
                        ratio.toFixed(2) + ":1";

                if ($("#thumbSize"))
                    $("#thumbSize").textContent =
                        (
                            file.size /
                            1048576
                        ).toFixed(2) +
                        " MB";

                if ($("#thumbType"))
                    $("#thumbType").textContent =
                        file.type || "Unknown";

                if ($("#thumbChecks")) {
                    const checks = [
                        [
                            width >= 1280 &&
                                height >= 720,
                            "At least 1280×720 pixels."
                        ],
                        [
                            Math.abs(
                                ratio - 16 / 9
                            ) < 0.03,
                            "16:9 aspect ratio."
                        ],
                        [
                            file.size <=
                                2 * 1024 * 1024,
                            "File is under 2 MB."
                        ],
                        [
                            /^image\/(jpeg|png|webp)$/i
                                .test(file.type),
                            "Common web image format."
                        ]
                    ];

                    $("#thumbChecks")
                        .innerHTML =
                        checks.map(
                            ([ok, message]) => `
                                <div class="check ${ok ? "ok" : "bad"}">
                                    <span class="mark">
                                        ${ok ? "✓" : "•"}
                                    </span>
                                    <span>${message}</span>
                                </div>
                            `
                        ).join("");
                }
            };
        }
    );


/* =========================
   SEO
========================= */

function seoScore() {
    const title =
        $("#seoTitle")?.value.trim() || "";

    const description =
        $("#seoDescription")
            ?.value.trim() || "";

    const tags =
        $("#seoTags")
            ?.value.trim() || "";

    if (!$("#seoScore")) return;

    const tagCount =
        tags
            .split(",")
            .map(x => x.trim())
            .filter(Boolean)
            .length;

    const titleGood =
        title.length >= 45 &&
        title.length <= 65;

    const descGood =
        words(description) >= 100;

    const tagsGood =
        tagCount >= 5;

    const cta =
        /subscribe|comment|like|learn more|watch/i
            .test(description);

    const titleKeyword =
        title &&
        description &&
        title
            .toLowerCase()
            .split(/\s+/)
            .some(
                word =>
                    word.length > 3 &&
                    description
                        .toLowerCase()
                        .includes(word)
            );

    let score = 0;

    score += titleGood
        ? 25
        : title.length >= 30
            ? 15
            : 0;

    score += titleKeyword ? 20 : 0;

    score += descGood
        ? 25
        : words(description) >= 50
            ? 15
            : 0;

    score += tagsGood
        ? 15
        : tagCount
            ? 8
            : 0;

    score += cta ? 15 : 0;

    setScore(
        $("#seoScore"),
        score
    );

    if ($("#seoTitleLen"))
        $("#seoTitleLen").textContent =
            title.length;

    if ($("#seoDescWords"))
        $("#seoDescWords").textContent =
            words(description);

    if ($("#seoTagCount"))
        $("#seoTagCount").textContent =
            tagCount;

    if ($("#seoChecks")) {
        const checks = [
            [
                titleGood,
                "Title is around 45–65 characters."
            ],
            [
                titleKeyword,
                "A meaningful title word also appears in the description."
            ],
            [
                descGood,
                "Description has 100+ words."
            ],
            [
                tagsGood,
                "Uses 5+ focused tags or phrases."
            ],
            [
                cta,
                "Description includes a viewer action."
            ]
        ];

        $("#seoChecks").innerHTML =
            checks.map(([ok, message]) => `
                <div class="check ${ok ? "ok" : "bad"}">
                    <span class="mark">
                        ${ok ? "✓" : "•"}
                    </span>
                    <span>${message}</span>
                </div>
            `).join("");
    }
}

$("#seoAnalyze")
    ?.addEventListener(
        "click",
        seoScore
    );

$$(
    "#seoTitle,#seoDescription,#seoTags"
).forEach(input =>
    input.addEventListener(
        "input",
        seoScore
    )
);


/* =========================
   SERVER API
========================= */

/*
    IMPORTANT:

    There is NO YouTube API key here.

    Browser -> /api/youtube
    Server -> YouTube API

    The API key stays inside .env.
*/

async function apiRequest(params) {
    const url =
        new URL(
            "/api/youtube",
            window.location.origin
        );

    Object.entries(params)
        .forEach(([key, value]) => {
            url.searchParams.set(
                key,
                value
            );
        });

    const response =
        await fetch(url.toString());

    const text =
        await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `Server returned an invalid response (HTTP ${response.status}).`
        );
    }

    if (!response.ok || !data.ok) {
        throw new Error(
            data.error ||
            `Server error (HTTP ${response.status}).`
        );
    }

    return data;
}


/* =========================
   YOUTUBE SEARCH
========================= */

async function youtubeSearch() {
    const query =
        $("#ytQuery")
            ?.value.trim();

    const results =
        $("#ytResults");

    const button =
        $("#ytSearch");

    if (!query) {
        if (results) {
            results.innerHTML =
                '<div class="empty">Enter a search query first.</div>';
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Searching...";
    }

    if (results) {
        results.innerHTML =
            '<div class="empty">Searching YouTube...</div>';
    }

    try {
        const maxResults =
            $("#ytMax")?.value || 10;

        const data =
            await apiRequest({
                mode: "search",
                q: query,
                maxResults
            });

        const items =
            data.items || [];

        if (!items.length) {
            results.innerHTML =
                '<div class="empty">No videos found.</div>';

            return;
        }

        results.innerHTML =
            items.map(video => {
                const videoUrl =
                    `https://www.youtube.com/watch?v=${video.videoId}`;

                return `
                    <article class="video">

                        <a
                            href="${escapeHtml(videoUrl)}"
                            target="_blank"
                            rel="noopener"
                        >
                            <img
                                src="${escapeHtml(video.thumbnail)}"
                                alt=""
                                loading="lazy"
                            >
                        </a>

                        <div>

                            <h3>
                                <a
                                    href="${escapeHtml(videoUrl)}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    ${escapeHtml(video.title)}
                                </a>
                            </h3>

                            <p>
                                ${escapeHtml(
                                    (video.description || "")
                                        .slice(0, 220)
                                )}
                                ${
                                    (video.description || "")
                                        .length > 220
                                        ? "..."
                                        : ""
                                }
                            </p>

                            <div class="meta">
                                ${escapeHtml(
                                    video.channelTitle
                                )}
                                ·
                                ${
                                    video.publishedAt
                                        ? new Date(
                                            video.publishedAt
                                        ).toLocaleDateString(
                                            "en-US"
                                        )
                                        : ""
                                }
                            </div>

                            <a
                                class="btn btn-primary"
                                href="video-analyzer.html?url=${encodeURIComponent(videoUrl)}"
                            >
                                Analyze Video
                            </a>

                        </div>

                    </article>
                `;
            }).join("");

    } catch (error) {

        results.innerHTML = `
            <div class="notice">
                ${escapeHtml(error.message)}
            </div>
        `;

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Search YouTube";
        }
    }
}

$("#ytSearch")
    ?.addEventListener(
        "click",
        youtubeSearch
    );

$("#ytQuery")
    ?.addEventListener(
        "keydown",
        e => {
            if (e.key === "Enter") {
                youtubeSearch();
            }
        }
    );


/* =========================
   VIDEO ANALYZER
========================= */

async function videoAnalyze() {
    const input =
        $("#videoUrl");

    const results =
        $("#videoResults");

    const message =
        $("#videoMessage");

    const button =
        $("#videoAnalyze");

    const url =
        input?.value.trim();

    if (!url) {
        message.innerHTML =
            '<div class="notice">Paste a public YouTube video URL first.</div>';

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent =
            "Analyzing...";
    }

    message.innerHTML =
        '<div class="notice">Analyzing public YouTube data...</div>';

    results.innerHTML = "";

    try {
        const data =
            await apiRequest({
                mode: "analyze",
                url
            });

        message.innerHTML = "";

        renderVideoAnalysis(
            data,
            results
        );

    } catch (error) {

        message.innerHTML = `
            <div class="notice">
                ${escapeHtml(error.message)}
            </div>
        `;

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent =
                "Analyze Video";
        }
    }
}


function renderVideoAnalysis(data, container) {
    const video =
        data.video;

    const stats =
        data.stats;

    const analysis =
        data.analysis;

    const suggestions =
        data.suggestions;

    const channel =
        data.channel;

    const list = (
        array,
        className = ""
    ) => {
        if (!array?.length) {
            return `
                <div class="empty">
                    Nothing specific was detected from public data.
                </div>
            `;
        }

        return array.map(item => `
            <div class="check ${className}">
                <span class="mark">
                    ${
                        className === "ok"
                            ? "✓"
                            : className === "bad"
                                ? "!"
                                : "•"
                    }
                </span>

                <span>
                    ${escapeHtml(item)}
                </span>
            </div>
        `).join("");
    };

    container.innerHTML = `

        <section class="analysis-head">

            <img
                class="analysis-thumbnail"
                src="${escapeHtml(video.thumbnail)}"
                alt=""
            >

            <div>

                <div class="badge">
                    ${escapeHtml(
                        analysis.traction
                    )}
                </div>

                <h2>
                    ${escapeHtml(video.title)}
                </h2>

                <p class="muted">
                    ${escapeHtml(
                        video.channelTitle
                    )}
                    ·
                    ${
                        video.publishedAt
                            ? new Date(
                                video.publishedAt
                            ).toLocaleDateString(
                                "en-US"
                            )
                            : ""
                    }
                </p>

                <a
                    class="btn btn-primary"
                    target="_blank"
                    rel="noopener"
                    href="${escapeHtml(video.url)}"
                >
                    Open Video
                </a>

            </div>

        </section>


        <section>

            <h2>
                Public Performance
            </h2>

            <div class="stats-grid">

                <div class="stat-card">
                    <strong>
                        ${Number(
                            stats.views
                        ).toLocaleString()}
                    </strong>
                    <span>Views</span>
                </div>

                <div class="stat-card">
                    <strong>
                        ${Number(
                            stats.likes
                        ).toLocaleString()}
                    </strong>
                    <span>Likes</span>
                </div>

                <div class="stat-card">
                    <strong>
                        ${Number(
                            stats.comments
                        ).toLocaleString()}
                    </strong>
                    <span>Comments</span>
                </div>

                <div class="stat-card">
                    <strong>
                        ${Math.round(
                            stats.viewsPerDay
                        ).toLocaleString()}
                    </strong>
                    <span>Views / Day</span>
                </div>

                <div class="stat-card">
                    <strong>
                        ${stats.likeRate.toFixed(2)}%
                    </strong>
                    <span>Like Rate</span>
                </div>

                <div class="stat-card">
                    <strong>
                        ${stats.commentRate.toFixed(2)}%
                    </strong>
                    <span>Comment Rate</span>
                </div>

            </div>

        </section>


        ${
            channel
                ? `
                    <section>

                        <h2>
                            Channel Context
                        </h2>

                        <div class="stats-grid">

                            <div class="stat-card">
                                <strong>
                                    ${Number(
                                        channel.subscribers
                                    ).toLocaleString()}
                                </strong>
                                <span>
                                    Subscribers
                                </span>
                            </div>

                            <div class="stat-card">
                                <strong>
                                    ${Number(
                                        channel.videos
                                    ).toLocaleString()}
                                </strong>
                                <span>
                                    Channel Videos
                                </span>
                            </div>

                            <div class="stat-card">
                                <strong>
                                    ${
                                        stats.subscriberRatio === null
                                            ? "N/A"
                                            : stats.subscriberRatio.toFixed(2) + "x"
                                    }
                                </strong>
                                <span>
                                    Views / Subscribers
                                </span>
                            </div>

                        </div>

                    </section>
                `
                : ""
        }


        <section>

            <h2>
                Title Analysis
            </h2>

            <div class="analysis-box">

                <strong>
                    Current title
                </strong>

                <p>
                    ${escapeHtml(video.title)}
                </p>

                <p>
                    ${
                        video.title.length >= 45 &&
                        video.title.length <= 70
                            ? "The title length is in a practical range."
                            : "Consider testing a clearer, more focused title."
                    }
                </p>

            </div>

        </section>


        <section>

            <h2>
                Description Analysis
            </h2>

            <div class="analysis-box">

                <p>
                    <strong>
                        ${video.description.length.toLocaleString()}
                    </strong>
                    characters ·

                    <strong>
                        ${words(video.description)}
                    </strong>
                    words
                </p>

                <p>
                    ${
                        words(video.description) >= 100
                            ? "The description provides useful context."
                            : "Consider adding more useful context and a clear viewer action."
                    }
                </p>

            </div>

        </section>


        <section>

            <h2>
                Tags Analysis
            </h2>

            <div class="analysis-box">

                <p>
                    <strong>
                        ${video.tags.length}
                    </strong>
                    current public tags
                </p>

                <p>
                    ${
                        video.tags.length >= 5
                            ? "There is a broader public tag set."
                            : "There are relatively few public tags."
                    }
                </p>

            </div>

        </section>


        <section>

            <h2>
                Possible Growth Issues
            </h2>

            <p class="muted">
                These are possible explanations from public data,
                not a guaranteed diagnosis. Studio-only metrics
                such as CTR and retention are not available through
                the public API.
            </p>

            ${list(
                analysis.reasons,
                "bad"
            )}

        </section>


        <section>

            <h2>
                What Is Working
            </h2>

            ${list(
                analysis.strengths,
                "ok"
            )}

        </section>


        <section>

            <h2>
                What To Improve
            </h2>

            ${list(
                analysis.problems,
                "bad"
            )}

        </section>


        <section>

            <h2>
                Better Title Ideas
            </h2>

            ${suggestions.titles
                .map(
                    (title, index) => `
                        <div class="suggestion-card">

                            <div>

                                <strong>
                                    Option ${index + 1}
                                </strong>

                                <p>
                                    ${escapeHtml(title)}
                                </p>

                            </div>

                            <button
                                class="btn btn-secondary copy"
                                data-text="${escapeHtml(title)}"
                            >
                                Copy
                            </button>

                        </div>
                    `
                )
                .join("")}

        </section>


        <section>

            <h2>
                Recommended Description
            </h2>

            <textarea
                id="recommendedDescription"
                class="textarea"
                rows="12"
                readonly
            >${escapeHtml(
                suggestions.description
            )}</textarea>

            <button
                class="btn btn-primary copy"
                data-target="#recommendedDescription"
            >
                Copy Description
            </button>

        </section>


        <section>

            <h2>
                Recommended Tags
            </h2>

            <div class="chips">

                ${suggestions.tags
                    .map(
                        tag => `
                            <span class="chip">
                                ${escapeHtml(tag)}
                            </span>
                        `
                    )
                    .join("")}

            </div>

            <button
                class="btn btn-primary"
                id="copyGeneratedTags"
            >
                Copy All Tags
            </button>

        </section>
    `;


    $$(".copy", container)
        .forEach(button => {

            button.onclick = () => {

                if (button.dataset.target) {

                    const target =
                        $(button.dataset.target);

                    copyText(
                        target?.value || "",
                        button
                    );

                } else {

                    copyText(
                        button.dataset.text,
                        button
                    );
                }
            };
        });


    $("#copyGeneratedTags", container)
        ?.addEventListener(
            "click",
            e => {
                copyText(
                    suggestions.tags.join(", "),
                    e.currentTarget
                );
            }
        );
}

$("#videoAnalyze")
    ?.addEventListener(
        "click",
        videoAnalyze
    );

$("#videoUrl")
    ?.addEventListener(
        "keydown",
        e => {
            if (e.key === "Enter") {
                videoAnalyze();
            }
        }
    );


/* =========================
   OPEN ANALYZER URL
========================= */

const queryParams =
    new URLSearchParams(
        location.search
    );

if (
    $("#videoUrl") &&
    queryParams.get("url")
) {
    $("#videoUrl").value =
        queryParams.get("url");
}


/* =========================
   COPY BUTTONS
========================= */

$$("[data-copy-input]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    $(button.dataset.copyInput);

                copyText(
                    target?.value ||
                    target?.textContent ||
                    "",
                    button
                );
            }
        );
    });