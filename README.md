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
| `bookmarks`    | Grouped links with emoji icons (Home page)                 |
| `notes`        | Grouped quick links (Studio page)                          |
| `navidrome`    | URL, username, password, recent album count                |
| `shoutcast`    | Stats URL, stream URL, station name, history count         |

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
    server.js   ← registers GET /api/weather
    client.js   ← calls MyGlance.registerWidget("weather", { ... })
  mywidget/
    server.js   ← your new API route
    client.js   ← your new widget renderer
```

**To add a widget:** create a new folder under `plugins/` with `server.js` and `client.js`, restart the server.

**To remove a widget:** delete the folder (or rename `client.js` to `client.js.disabled`), restart.

### Available plugins

| Plugin       | Type    | Description                                      |
|--------------|---------|--------------------------------------------------|
| `markets`    | ticker  | Stock/crypto prices in the top bar               |
| `time`       | widget  | Live clock                                       |
| `calendar`   | widget  | Current month calendar                           |
| `weather`    | widget  | Current conditions + 5-day forecast (open-meteo) |
| `feeds`      | widget  | RSS/Atom news feeds                              |
| `techfeeds`  | widget  | Tech & self-hosted RSS feeds                     |
| `monitor`    | widget  | Service uptime monitor with response times       |
| `bookmarks`  | widget  | Grouped bookmark links                           |
| `notes`      | widget  | Quick links panel                                |
| `search`     | widget  | Google search bar                                |
| `navidrome`  | widget  | Now playing + recently played albums             |
| `shoutcast`  | widget  | Radio station — now playing, listeners, player   |
| `wallpaper`  | widget  | Bing photo of the day                            |

### Writing a plugin

**`server.js`** — receives `(app, config)` and registers Express routes:
```js
const fetch = require("node-fetch");
module.exports = function register(app, config) {
  app.get("/api/myplugin", async (req, res) => {
    const data = await fetch("https://example.com/api").then(r => r.json());
    res.json(data);
  });
};
```

**`client.js`** — calls `MyGlance.registerWidget(name, def)`:
```js
MyGlance.registerWidget("myplugin", {
  refresh: 60_000,   // ms between refreshes, 0 = never
  css: `
    .my-class { color: var(--accent); }
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "My Plugin");
    if (!data) return;
    MyGlance.patch(body, `<div class="my-class">${data.value}</div>`);
  },
  async fetch() {
    return window.fetch("/api/myplugin").then(r => r.json());
  },
});
```

**Available helpers inside plugins:**

| Helper | Description |
|--------|-------------|
| `MyGlance.ensureCard(container, title)` | Builds the card shell once, returns the body element |
| `MyGlance.patch(el, html)` | Updates innerHTML only if it changed (no blink) |
| `MyGlance.timeAgo(dateStr)` | Converts a date string to "5m ago" etc. |

The special **markets ticker** uses `MyGlance.registerMarkets({ refresh, fetch, render })` instead of `registerWidget` — its `render(data)` writes directly into `#ticker-track`.

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
├── server.js            ← Express server + plugin auto-loader
├── package.json
├── public/
│   ├── index.html       ← shell + MyGlance plugin host
│   └── bg.jpg           ← loader background image
└── plugins/
    ├── markets/         ← ticker bar
    │   ├── server.js
    │   └── client.js
    ├── weather/
    │   ├── server.js
    │   └── client.js
    ├── time/
    ├── calendar/
    ├── feeds/
    ├── techfeeds/
    ├── monitor/
    ├── bookmarks/
    ├── notes/
    ├── search/
    ├── navidrome/
    ├── shoutcast/
    └── wallpaper/
```
