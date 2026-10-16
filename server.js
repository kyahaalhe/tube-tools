require("dotenv").config();

const express = require("express");
const path = require("path");
const handler = require("./youtube-handler.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/youtube", handler);

// Every public file is listed explicitly so Vercel bundles it with the function
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/title-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "title-analyzer.html")));
app.get("/keyword-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "keyword-analyzer.html")));
app.get("/description-checker.html", (req, res) => res.sendFile(path.join(__dirname, "description-checker.html")));
app.get("/hashtag-generator.html", (req, res) => res.sendFile(path.join(__dirname, "hashtag-generator.html")));
app.get("/thumbnail-checker.html", (req, res) => res.sendFile(path.join(__dirname, "thumbnail-checker.html")));
app.get("/seo-score.html", (req, res) => res.sendFile(path.join(__dirname, "seo-score.html")));
app.get("/youtube-search.html", (req, res) => res.sendFile(path.join(__dirname, "youtube-search.html")));
app.get("/video-analyzer.html", (req, res) => res.sendFile(path.join(__dirname, "video-analyzer.html")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/analyzer.css", (req, res) => res.sendFile(path.join(__dirname, "analyzer.css")));
app.get("/script.js", (req, res) => res.sendFile(path.join(__dirname, "script.js")));
app.get("/smart.js", (req, res) => res.sendFile(path.join(__dirname, "smart.js")));

app.use((req, res) => res.status(404).send("Not found"));

if (require.main === module) {
    app.listen(PORT, () => console.log(`TubeTools running on http://localhost:${PORT}`));
}

module.exports = app;
