const express = require("express");
const fs      = require("fs");
const path    = require("path");
const config  = require("./config");

const app = express();
app.use(express.static("public"));

// ── Auto-load plugins ─────────────────────────────────────────────────────────
// Scans plugins/*/server.js + client.js and calls register(app, config) for each.
const PLUGINS_DIR = path.join(__dirname, "plugins");

const loadedPlugins = fs.readdirSync(PLUGINS_DIR)
  .sort()                              // consistent order
  .filter(name => {
    const dir = path.join(PLUGINS_DIR, name);
    return (
      fs.statSync(dir).isDirectory() &&
      fs.existsSync(path.join(dir, "server.js")) &&
      fs.existsSync(path.join(dir, "client.js"))
    );
  })
  .map(name => {
    try {
      require(path.join(PLUGINS_DIR, name, "server.js"))(app, config);
      console.log(`  ✓ ${name}`);
      return name;
    } catch (e) {
      console.warn(`  ✗ ${name} — ${e.message}`);
      return null;
    }
  })
  .filter(Boolean);

// ── /api/plugins — list of available plugin names ─────────────────────────────
app.get("/api/plugins", (req, res) => res.json(loadedPlugins));

// ── /plugins/:name/client.js — serve each plugin's browser code ───────────────
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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`\nmy-glance → http://localhost:${config.port}`);
  console.log(`Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(", ")}\n`);
});
