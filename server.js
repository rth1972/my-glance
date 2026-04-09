const express = require("express");
const fetch   = require("node-fetch");
const fs      = require("fs");
const path    = require("path");
const config  = require("./config");

const app = express();
app.use(express.static("public"));

// ── Auto-load plugins ─────────────────────────────────────────────────────────
// Scans plugins/*/server.js and calls register(app, config) for each one found.
const PLUGINS_DIR = path.join(__dirname, "plugins");

const loadedPlugins = fs.readdirSync(PLUGINS_DIR)
  .filter(name => {
    const serverFile = path.join(PLUGINS_DIR, name, "server.js");
    const clientFile = path.join(PLUGINS_DIR, name, "client.js");
    return fs.existsSync(serverFile) && fs.existsSync(clientFile);
  })
  .map(name => {
    try {
      require(path.join(PLUGINS_DIR, name, "server.js"))(app, config);
      console.log(`  ✓ plugin loaded: ${name}`);
      return name;
    } catch (e) {
      console.warn(`  ✗ plugin failed: ${name} — ${e.message}`);
      return null;
    }
  })
  .filter(Boolean);

// ── /api/plugins — tells the frontend which plugins are available ──────────────
// Returns an ordered list based on which folders have both server.js + client.js.
app.get("/api/plugins", (req, res) => res.json(loadedPlugins));

// ── /plugins/:name/client.js — serves each plugin's client-side code ──────────
app.get("/plugins/:name/client.js", (req, res) => {
  const file = path.join(PLUGINS_DIR, req.params.name, "client.js");
  if (!fs.existsSync(file)) return res.status(404).send("Not found");
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(file);
});

// ── /api/pages — page layout from config ──────────────────────────────────────
app.get("/api/pages", (req, res) => {
  res.json(config.pages.map(p => ({
    name: p.name,
    columns: p.columns.map(col => ({
      size: col.size,
      widgets: col.widgets.map(w => w.type),
    })),
  })));
});

// ── /api/markets — stock/crypto ticker ────────────────────────────────────────
app.get("/api/markets", async (req, res) => {
  try {
    const results = await Promise.all((config.markets || []).map(async m => {
      try {
        const data = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${m.symbol}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        }).then(r => r.json());
        const meta  = data?.chart?.result?.[0]?.meta || {};
        const price = meta.regularMarketPrice || 0;
        const prev  = meta.previousClose      || price;
        return { symbol: m.symbol, name: m.name, price, change: prev ? (((price - prev) / prev) * 100).toFixed(2) : "0.00" };
      } catch { return { symbol: m.symbol, name: m.name, price: 0, change: "0.00", error: true }; }
    }));
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── /api/time ─────────────────────────────────────────────────────────────────
app.get("/api/time", (req, res) => {
  const now = new Date();
  const tz  = config.timezone || "America/New_York";
  res.json({
    time: now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }),
    date: now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\nmy-glance → http://localhost:${config.port}`);
  console.log(`Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(", ")}\n`);
});
