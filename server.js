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
app.use(express.json());

// ── State files ──────────────────────────────────────────────────────────────
const STATE_DIR = path.join(__dirname, "state");
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR);

const PLUGIN_STATE_FILE = path.join(STATE_DIR, "plugins.json");
const PAGES_STATE_FILE = path.join(STATE_DIR, "pages.json");

function loadPluginState() {
  try {
    return JSON.parse(fs.readFileSync(PLUGIN_STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function savePluginState(state) {
  fs.writeFileSync(PLUGIN_STATE_FILE, JSON.stringify(state, null, 2));
}

function loadPagesConfig() {
  try {
    const saved = JSON.parse(fs.readFileSync(PAGES_STATE_FILE, "utf8"));
    if (saved && Array.isArray(saved)) return saved;
  } catch {}
  return null;
}

function savePagesConfig(pages) {
  fs.writeFileSync(PAGES_STATE_FILE, JSON.stringify(pages, null, 2));
}

function getPages() {
  return loadPagesConfig() || config.pages;
}

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

app.set("broadcast", broadcast);

// ── Discover all plugins ────────────────────────────────────────────────────
const PLUGINS_DIR = path.join(__dirname, "plugins");

function discoverPlugins() {
  return fs.readdirSync(PLUGINS_DIR)
    .filter(name => {
      const dir = path.join(PLUGINS_DIR, name);
      return (
        fs.statSync(dir).isDirectory() &&
        fs.existsSync(path.join(dir, "server.js")) &&
        fs.existsSync(path.join(dir, "client.js"))
      );
    })
    .sort();
}

function isPluginEnabled(pluginName) {
  const state = loadPluginState();
  if (state[pluginName] !== undefined) {
    return state[pluginName];
  }
  return true;
}

// ── Load enabled plugins ────────────────────────────────────────────────────
const loadedPlugins = [];

discoverPlugins().forEach(name => {
  if (!isPluginEnabled(name)) {
    console.log(`  ○ ${name} (disabled)`);
    return;
  }
  try {
    require(path.join(PLUGINS_DIR, name, "server.js"))(app, config);
    console.log(`  ✓ ${name}`);
    loadedPlugins.push(name);
  } catch (e) {
    console.warn(`  ✗ ${name} — ${e.message}`);
  }
});

// ── Plugin API Routes ────────────────────────────────────────────────────────

app.get("/api/plugins", (req, res) => {
  const state = loadPluginState();
  const allPlugins = discoverPlugins();
  const enabledPlugins = allPlugins.filter(name => state[name] !== false);
  res.json(enabledPlugins);
});

app.get("/api/plugins/all", (req, res) => {
  const all = discoverPlugins();
  const state = loadPluginState();
  const plugins = all.map(name => ({
    name,
    enabled: state[name] !== undefined ? state[name] : true,
  }));
  res.json(plugins);
});

app.get("/api/plugins/order", (req, res) => {
  try {
    res.json(JSON.parse(fs.readFileSync(path.join(STATE_DIR, "plugin-order.json"), "utf8")));
  } catch {
    res.json([]);
  }
});

app.post("/api/plugins/order", (req, res) => {
  const { order } = req.body;
  if (Array.isArray(order)) {
    fs.writeFileSync(path.join(STATE_DIR, "plugin-order.json"), JSON.stringify(order, null, 2));
  }
  res.json({ success: true });
});

app.post("/api/plugins/save", (req, res) => {
  const { plugins } = req.body;
  if (Array.isArray(plugins)) {
    const state = {};
    plugins.forEach(p => {
      if (typeof p.name === "string" && typeof p.enabled === "boolean") {
        if (!p.enabled) {
          state[p.name] = false;
        }
      }
    });
    savePluginState(state);
  }
  res.json({ success: true });
});

// ── Pages API Routes ────────────────────────────────────────────────────────

app.get("/api/pages", (req, res) => {
  const state = loadPluginState();
  const allPlugins = discoverPlugins();
  const enabledPlugins = new Set(allPlugins.filter(name => state[name] !== false));
  const pages = getPages();
  
  res.json(pages.map(p => ({
    name: p.name,
    layout: (p.layout || []).filter(w => enabledPlugins.has(w.type)),
  })));
});

app.get("/api/pages/full", (req, res) => {
  res.json(getPages());
});

app.post("/api/pages", (req, res) => {
  const { pages } = req.body;
  if (Array.isArray(pages)) {
    savePagesConfig(pages);
  }
  res.json({ success: true });
});

// ── Plugin files ────────────────────────────────────────────────────────────
app.get("/plugins/:name/client.js", (req, res) => {
  const name = req.params.name;
  if (!isPluginEnabled(name)) {
    return res.status(404).send("Not found");
  }
  const file = path.join(PLUGINS_DIR, name, "client.js");
  if (!fs.existsSync(file)) return res.status(404).send("Not found");
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(file);
});

// ── Admin page ──────────────────────────────────────────────────────────────
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`\nmy-glance → http://localhost:${config.port}`);
  console.log(`Admin     → http://localhost:${config.port}/admin`);
  console.log(`Loaded ${loadedPlugins.length} plugins: ${loadedPlugins.join(", ")}`);
  console.log(`WebSocket  → ws://localhost:${config.port}/ws\n`);
});
