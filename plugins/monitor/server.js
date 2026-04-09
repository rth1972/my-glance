const https = require("https");
const fetch = require("node-fetch");
const localAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = function register(app, config) {
  app.get("/api/monitor", async (req, res) => {
    const results = await Promise.all((config.monitor || []).map(async site => {
      const start = Date.now();
      try {
        const agent = site.url.startsWith("https") ? localAgent : undefined;
        const r = await fetch(site.url, { method: "GET", timeout: 5000, agent });
        return { title: site.title, url: site.url, ok: r.ok, status: r.status, ms: Date.now() - start };
      } catch {
        return { title: site.title, url: site.url, ok: false, status: 0, ms: Date.now() - start };
      }
    }));
    res.json(results);
  });
};
