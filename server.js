require("dotenv").config();

const express = require("express");
const path = require("path");
const handler = require("./youtube-handler.js");
const feedback = require("./feedback-handler.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/youtube", handler);
app.post("/api/feedback", express.json({ limit: "10kb" }), feedback);

// Every public file is listed explicitly so Vercel bundles it with the function
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/analyzer.css", (req, res) => res.sendFile(path.join(__dirname, "analyzer.css")));
app.get("/apple-touch-icon.png", (req, res) => res.sendFile(path.join(__dirname, "apple-touch-icon.png")));
app.get("/description-checker.html", (req, res) => res.sendFile(path.join(__dirname, "description-checker.html")));
app.get("/favicon-96.png", (req, res) => res.sendFile(path.join(__dirname, "favicon-96.png")));
app.get("/favicon.svg", (req, res) => res.sendFile(path.join(__dirname, "favicon.svg")));
app.get("/fx.css", (req, res) => res.sendFile(path.join(__dirname, "fx.css")));
app.get("/fx.js", (req, res) => res.sendFile(path.join(__dirname, "fx.js")));
app.get("/hashtag-generator.html", (req, res) => res.sendFile(path.join(__dirname, "hashtag-generator.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/keyword-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "keyword-analyzer.html")));
app.get("/logo.svg", (req, res) => res.sendFile(path.join(__dirname, "logo.svg")));
app.get("/mascot.css", (req, res) => res.sendFile(path.join(__dirname, "mascot.css")));
app.get("/mascot.js", (req, res) => res.sendFile(path.join(__dirname, "mascot.js")));
app.get("/og.png", (req, res) => res.sendFile(path.join(__dirname, "og.png")));
app.get("/privacy.html", (req, res) => res.sendFile(path.join(__dirname, "privacy.html")));
app.get("/robots.txt", (req, res) => res.sendFile(path.join(__dirname, "robots.txt")));
app.get("/seo-score.html", (req, res) => res.sendFile(path.join(__dirname, "seo-score.html")));
app.get("/sitemap.xml", (req, res) => res.sendFile(path.join(__dirname, "sitemap.xml")));
app.get("/smart.js", (req, res) => res.sendFile(path.join(__dirname, "smart.js")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/thumbnail-checker.html", (req, res) => res.sendFile(path.join(__dirname, "thumbnail-checker.html")));
app.get("/title-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "title-analyzer.html")));
app.get("/tools.js", (req, res) => res.sendFile(path.join(__dirname, "tools.js")));
app.get("/video-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "video-analyzer.html")));
app.get("/viral-keywords.html", (req, res) => res.sendFile(path.join(__dirname, "viral-keywords.html")));
app.get("/youtube-search.html", (req, res) => res.sendFile(path.join(__dirname, "youtube-search.html")));
app.get("/favicon.ico", (req, res) => res.sendFile(path.join(__dirname, "favicon.ico")));

app.use((req, res) => res.status(404).send("Not found"));

if (require.main === module) {
    app.listen(PORT, () => console.log(`TubeTools running on http://localhost:${PORT}`));
}

module.exports = app;
