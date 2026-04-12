const { execFile } = require("child_process");

function checkSite(site) {
  return new Promise(resolve => {
    const start = Date.now();
    const args = [
      "--interface", "en1",
      "--insecure",
      "--silent",
      "--max-time", "5",
      "--write-out", "%{http_code}",
      "--output", "/dev/null",
      site.url
    ];
    execFile("curl", args, { timeout: 6000 }, (err, stdout) => {
      const ms = Date.now() - start;
      const status = parseInt(stdout, 10) || 0;
      const ok = !err && status >= 200 && status < 400;
      if (ok) {
        console.log(`[monitor] ✓ ${site.title} → ${status} (${ms}ms)`);
      } else {
        console.error(`[monitor] ✗ ${site.title} → ${err ? err.message : status} (${ms}ms)`);
      }
      resolve({ title: site.title, url: site.url, ok, status, ms });
    });
  });
}

module.exports = function register(app, config) {
  app.get("/api/monitor", async (req, res) => {
    const results = await Promise.all((config.monitor || []).map(site => checkSite(site)));
    res.json(results);
  });
};
