const fetch  = require("node-fetch");
const Parser = require("rss-parser");
const parser = new Parser({ timeout: 10000, headers: { "User-Agent": "my-glance/1.0" } });

module.exports = function register(app, config) {
  const broadcast = app.get("broadcast");

  async function fetchTechFeeds() {
    const results = [];
    for (const feed of config.techFeeds || []) {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of (parsed.items || []).slice(0, 10))
          results.push({ title: item.title, link: item.link, date: item.isoDate || item.pubDate, source: feed.title || parsed.title });
      } catch (e) { console.warn(`Tech feed failed: ${feed.url} — ${e.message}`); }
    }
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    broadcast("techfeeds", results.slice(0, config.techFeedsLimit || 40));
  }

  fetchTechFeeds();
  setInterval(fetchTechFeeds, 300_000);

  app.get("/api/techfeeds", async (req, res) => {
    const results = [];
    for (const feed of config.techFeeds || []) {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of (parsed.items || []).slice(0, 10))
          results.push({ title: item.title, link: item.link, date: item.isoDate || item.pubDate, source: feed.title || parsed.title });
      } catch (e) { console.warn(`Tech feed failed: ${feed.url} — ${e.message}`); }
    }
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(results.slice(0, config.techFeedsLimit || 40));
  });
};
