const { execFile } = require("child_process");

const INTERVAL_MS = 5 * 60 * 1000;  // poll every 5 minutes
const MAX_SAMPLES = 288;             // 24h of 5-min samples

const history = {};  // { [siteTitle]: [ { ts, ok, ms } ] }

function checkSite(site) {
  return new Promise(resolve => {
    const start = Date.now();
    const args = [
      "--interface", "en1",
      "--insecure", "--silent",
      "--max-time", "5",
      "--write-out", "%{http_code}",
      "--output", "/dev/null",
      site.url,
    ];
    execFile("curl", args, { timeout: 6000 }, (err, stdout) => {
      const ms     = Date.now() - start;
      const status = parseInt(stdout, 10) || 0;
      const ok     = !err && status >= 200 && status < 400;
      resolve({ ok, ms, status });
    });
  });
}

module.exports = function register(app, config) {
  const sites = config.monitor || [];

  async function poll() {
    for (const site of sites) {
      const result = await checkSite(site);
      if (!history[site.title]) history[site.title] = [];
      const buf = history[site.title];
      buf.push({ ts: Date.now(), ok: result.ok, ms: result.ms });
      if (buf.length > MAX_SAMPLES) buf.splice(0, buf.length - MAX_SAMPLES);
    }
  }

  poll();
  setInterval(poll, INTERVAL_MS);

  app.get("/api/uptime-history", (req, res) => {
    const payload = sites.map(site => {
      const buf   = history[site.title] || [];
      const total = buf.length;
      const upBuf = buf.filter(s => s.ok);
      const pct   = total ? Math.round((upBuf.length / total) * 100) : null;
      const avgMs = upBuf.length ? Math.round(upBuf.reduce((a, b) => a + b.ms, 0) / upBuf.length) : 0;
      const spark = buf.slice(-48).map(s => s.ok ? 1 : 0);
      return { title: site.title, url: site.url, pct, avgMs, spark, samples: total };
    });
    res.json(payload);
  });
};
