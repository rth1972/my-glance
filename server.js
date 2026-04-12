const express = require("express");
const http    = require("http");
const WebSocket = require("ws");
const fs      = require("fs");
const path    = require("path");
const config  = require("./config");

const app    = express();
const server  = http.createServer(app);
const wss    = new WebSocket.Server({ server });

app.use(express.static("public"));

// ── WebSocket broadcasting ───────────────────────────────────────────────────
const wsClients = new Set();

wss.on("connection", (ws) => {
  wsClients.add(ws);
  ws.on("close", () => wsClients.delete(ws));
  ws.on("error", () => wsClients.delete(ws));
});

function broadcast(event, data) {
  const msg = JSON.stringify({ event, data, ts: Date.now() });
  wsClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// Make broadcast available to plugins
app.set("broadcast", broadcast);

// ── Auto-load plugins ─────────────────────────────────────────────────────────
const PLUGINS_DIR = path.join(__dirname, "plugins");

const loadedPlugins = fs.readdirSync(PLUGINS_DIR)
  .sort()
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
server.listen(config.port, () => {
  console.log(`\nmy-glance → http://localhost:${config.port}`);
  console.log(`Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(", ")}`);
  console.log(`WebSocket  → ws://localhost:${config.port}/ws\n`);
});
