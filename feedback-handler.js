// POST /api/feedback — receives feedback from the Tubi helper.
// Always written to the server log (Vercel > Logs). Optionally forwarded to a Discord/Slack-style webhook: set FEEDBACK_WEBHOOK_URL.
const hits = new Map();

module.exports = async function feedback(req, res) {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only." });
    const b = req.body && typeof req.body === "object" ? req.body : {};
    if (b.hp) return res.json({ ok: true }); // honeypot: bots fill hidden fields

    const rating = [1, 2, 3, 4].includes(Number(b.rating)) ? Number(b.rating) : 0;
    const message = String(b.message || "").trim().slice(0, 800);
    const contact = String(b.contact || "").trim().slice(0, 120);
    const page = String(b.page || "").replace(/[^\w./-]/g, "").slice(0, 60);
    if (!rating && !message) return res.status(400).json({ ok: false, error: "Please pick a face or write a short message." });

    const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    if (recent.length >= 5) return res.status(429).json({ ok: false, error: "Too many messages from this device. Please try again later." });
    recent.push(now); hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();

    const faces = ["", "😞 Bad", "😐 Okay", "🙂 Good", "😍 Love it"];
    const text = `TubeTools feedback: ${faces[rating] || "no rating"}\nPage: ${page || "-"}\nMessage: ${message || "-"}\nContact: ${contact || "-"}`;
    console.log("[FEEDBACK]", JSON.stringify({ rating, page, message, contact }));

    const url = process.env.FEEDBACK_WEBHOOK_URL;
    if (url) {
        try {
            const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text.slice(0, 1900), text: text.slice(0, 1900), allowed_mentions: { parse: [] } }) });
            if (!r.ok) console.error("Feedback webhook answered", r.status);
        } catch (e) { console.error("Feedback webhook failed:", e.message); }
    }
    return res.json({ ok: true });
};
