# my-glance

A self-hosted personal dashboard — a lightweight alternative to [Glance](https://github.com/glanceapp/glance), built with Node.js and vanilla JS.

## Setup

```bash
cd ~/Documents/my-glance
npm install
npm start
```

Open → **http://localhost:3333**

---

## Admin Panel

Manage plugins at **http://localhost:3333/admin**

- Toggle plugins on/off with a simple switch
- Disabled plugins won't appear on any page
- Save changes, then refresh dashboard to apply

---

## Configuration

**`config.js` is the only file you need to edit.**

| Section        | What to configure                                          |
|----------------|------------------------------------------------------------|
| `port`         | Port to run on (default `3333`)                            |
| `timezone`     | e.g. `"America/New_York"`                                  |
| `markets`      | Stock/crypto symbols and display names                     |
| `pages`        | Page names, column sizes, and which widgets go where       |
| `weather`      | Latitude/longitude, city name, `"imperial"` or `"metric"` |
| `feeds`        | RSS/Atom feed URLs (Home page)                             |
| `techFeeds`    | RSS/Atom feed URLs (Studio page)                           |
| `monitor`      | Service URLs to ping for uptime monitoring                 |
| `bookmarks`    | Grouped links with emoji icons (Home page)                |
| `notes`        | Grouped quick links (Studio page)                          |
| `navidrome`    | URL, username, password, recent album count                |
| `shoutcast`    | Stats URL, stream URL, station name, history count         |
| `proxmox`      | URL, API token ID, API token secret, node name            |
| `gitea`        | URL, username, API token                                   |

### Pages & widgets

Pages are defined in `config.js` under `pages`. Each page has columns (`"small"` or `"full"`) and a list of widget types:

```js
pages: [
  {
    name: "Home",
    columns: [
      { size: "small", widgets: [{ type: "time" }, { type: "calendar" }, { type: "weather" }] },
      { size: "full",  widgets: [{ type: "monitor" }, { type: "feeds" }] },
      { size: "small", widgets: [{ type: "bookmarks" }] },
    ],
  },
]
```

---

## Plugin system

Every widget is a self-contained plugin in the `plugins/` folder. The server auto-discovers any folder that contains both `server.js` and `client.js` — no registration needed anywhere else.

```
plugins/
  weather/
    server.js   ← registers Express routes + WebSocket broadcasts
    client.js   ← calls MyGlance.registerWidget("weather", { ... })
  mywidget/
    server.js   ← your new API route
    client.js   ← your new widget renderer
```

**To add a widget:** create a new folder under `plugins/` with `server.js` and `client.js`, restart the server.

**To remove a widget:** delete the folder (or rename `client.js` to `client.js.disabled`), restart.

### Available plugins

| Plugin            | Type    | Description                                      |
|-------------------|---------|--------------------------------------------------|
| `markets`         | ticker  | Stock/crypto prices in the top bar              |
| `time`            | widget  | Live clock (real-time via WebSocket)             |
| `calendar`        | widget  | Current month calendar                           |
| `weather`         | widget  | Current conditions + 5-day forecast (open-meteo) |
| `feeds`           | widget  | RSS/Atom news feeds                              |
| `techfeeds`       | widget  | Tech & self-hosted RSS feeds                    |
| `monitor`         | widget  | Service uptime monitor with response times       |
| `uptime-history`  | widget  | Historical uptime tracking with sparklines       |
| `bookmarks`       | widget  | Grouped bookmark links                           |
| `notes`           | widget  | Quick links panel                                |
| `search`          | widget  | Google search bar                                |
| `navidrome`       | widget  | Now playing + recently played albums             |
| `shoutcast`       | widget  | Radio station — now playing, listeners, player   |
| `wallpaper`       | widget  | Bing photo of the day                           |
| `proxmox`         | widget  | Proxmox VE node status + VM/container list       |
| `gitea-activity`  | widget  | Gitea repositories + activity feed               |

---

## Real-time updates (WebSocket)

Plugins use WebSocket for real-time updates instead of client-side polling. When data changes on the server, it broadcasts to all connected clients instantly.

### Writing a plugin with WebSocket

**`server.js`** — use `broadcast(event, data)` to push updates:

```js
module.exports = function register(app, config) {
  const broadcast = app.get("broadcast");

  // Push updates every 10 seconds
  setInterval(() => {
    const data = { time: new Date().toISOString() };
    broadcast("myplugin", data);
  }, 10_000);

  // HTTP endpoint still works for initial page load
  app.get("/api/myplugin", (req, res) => {
    res.json({ time: new Date().toISOString() });
  });
};
```

**`client.js`** — subscribe to WebSocket events:

```js
MyGlance.registerWidget("myplugin", {
  refresh: 0,  // 0 = no client polling, use WebSocket instead
  css: `.my-class { color: var(--accent); }`,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "My Plugin");
    if (!data) return;
    MyGlance.patch(body, `<div class="my-class">${data.value}</div>`);
  },
  async fetch() {
    return window.fetch("/api/myplugin").then(r => r.json());
  },
});

// Subscribe to real-time updates
MyGlance.onWsEvent("myplugin", (data) => {
  const def = MyGlance._widgets.myplugin;
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="myplugin"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
```

### Available helpers

| Helper | Description |
|--------|-------------|
| `MyGlance.ensureCard(container, title)` | Builds the card shell once, returns the body element |
| `MyGlance.patch(el, html)` | Updates innerHTML only if it changed (no blink) |
| `MyGlance.timeAgo(dateStr)` | Converts a date string to "5m ago" etc. |
| `MyGlance.onWsEvent(event, handler)` | Subscribe to real-time WebSocket updates |
| `MyGlance._widgets[name]` | Access registered widget definitions |
| `app.get("broadcast")` (server) | Get the broadcast function for WebSocket推送 |

---

## Reverse proxy (Nginx Proxy Manager)

For Nginx Proxy Manager, add this location block to your proxy host:

```nginx
# WebSocket support
location /ws {
    proxy_pass http://127.0.0.1:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}

# Main app
location / {
    proxy_pass http://127.0.0.1:3333;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Running as a service (Ubuntu / Proxmox)

```bash
# Install pm2 globally
npm install -g pm2

# Start my-glance
cd ~/Documents/my-glance
pm2 start server.js --name my-glance

# Survive reboots
pm2 startup
pm2 save

# Useful commands
pm2 logs my-glance
pm2 restart my-glance
pm2 stop my-glance
```

---

## Project structure

```
my-glance/
├── config.js            ← only file you edit
├── server.js            ← Express server + WebSocket + plugin auto-loader
├── package.json
├── public/
│   ├── index.html       ← shell + MyGlance plugin host
│   └── bg.jpg           ← loader background image
└── plugins/
    ├── markets/         ← ticker bar
    │   ├── server.js
    │   └── client.js
    ├── weather/
    ├── time/
    ├── calendar/
    ├── feeds/
    ├── techfeeds/
    ├── monitor/
    ├── uptime-history/
    ├── bookmarks/
    ├── notes/
    ├── search/
    ├── navidrome/
    ├── shoutcast/
    ├── wallpaper/
    ├── proxmox/
    └── gitea-activity/
```
