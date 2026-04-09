const express  = require("express");
const fetch    = require("node-fetch");
const Parser   = require("rss-parser");
const https    = require("https");
const crypto   = require("crypto");
const config   = require("./config");

const app        = express();
const parser     = new Parser({ timeout: 10000, headers: { "User-Agent": "my-glance/1.0" } });
const localAgent = new https.Agent({ rejectUnauthorized: false });

app.use(express.static("public"));

// ── Helpers ───────────────────────────────────────────────────────────────────
function subsonicAuth() {
  const salt  = Math.random().toString(36).substring(2, 10);
  const token = crypto.createHash("md5").update(config.navidrome.password + salt).digest("hex");
  return `u=${config.navidrome.user}&t=${token}&s=${salt}&v=1.16.1&c=my-glance&f=json`;
}

function agentFor(url) {
  return url.startsWith("https") ? localAgent : undefined;
}

// ── Pages layout ──────────────────────────────────────────────────────────────
app.get("/api/pages", (req, res) => {
  res.json(config.pages.map(p => ({
    name: p.name,
    columns: p.columns.map(col => ({
      size: col.size,
      widgets: col.widgets.map(w => w.type),
    })),
  })));
});

// ── Markets ───────────────────────────────────────────────────────────────────
app.get("/api/markets", async (req, res) => {
  try {
    const promises = config.markets.map(async m => {
      try {
        const r    = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${m.symbol}`, { headers: { "User-Agent": "Mozilla/5.0" } });
        const data = await r.json();
        const meta = data?.chart?.result?.[0]?.meta || {};
        const price     = meta.regularMarketPrice;
        const prevClose = meta.previousClose;
        const change    = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
        return { symbol: m.symbol, name: m.name, price: price || 0, change: change.toFixed(2) };
      } catch {
        return { symbol: m.symbol, name: m.name, price: 0, change: 0, error: true };
      }
    });
    res.json(await Promise.all(promises));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Weather ───────────────────────────────────────────────────────────────────
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon, units } = config.weather;
    const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
    const windUnit = units === "imperial" ? "mph" : "kmh";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&forecast_days=5&timezone=America%2FNew_York`;
    const data = await fetch(url).then(r => r.json());
    data.city  = config.weather.city;
    data.units = units;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Feeds (Home) ──────────────────────────────────────────────────────────────
app.get("/api/feeds", async (req, res) => {
  const results = [];
  for (const feed of config.feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 10))
        results.push({ title: item.title, link: item.link, date: item.isoDate || item.pubDate, source: feed.title || parsed.title });
    } catch (e) { console.warn(`Feed failed: ${feed.url} — ${e.message}`); }
  }
  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(results.slice(0, config.feedsLimit || 30));
});

// ── Tech Feeds (Studio) ───────────────────────────────────────────────────────
app.get("/api/techfeeds", async (req, res) => {
  const results = [];
  for (const feed of config.techFeeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 10))
        results.push({ title: item.title, link: item.link, date: item.isoDate || item.pubDate, source: feed.title || parsed.title });
    } catch (e) { console.warn(`Tech feed failed: ${feed.url} — ${e.message}`); }
  }
  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(results.slice(0, config.techFeedsLimit || 40));
});

// ── Monitor ───────────────────────────────────────────────────────────────────
app.get("/api/monitor", async (req, res) => {
  const results = await Promise.all(config.monitor.map(async site => {
    const start = Date.now();
    try {
      const r = await fetch(site.url, { method: "GET", timeout: 5000, agent: agentFor(site.url) });
      return { title: site.title, url: site.url, ok: r.ok, status: r.status, ms: Date.now() - start };
    } catch {
      return { title: site.title, url: site.url, ok: false, status: 0, ms: Date.now() - start };
    }
  }));
  res.json(results);
});

// ── Bookmarks & Notes ─────────────────────────────────────────────────────────
app.get("/api/bookmarks", (req, res) => res.json(config.bookmarks));
app.get("/api/notes",     (req, res) => res.json(config.notes));

// ── Time ──────────────────────────────────────────────────────────────────────
app.get("/api/time", (req, res) => {
  const now = new Date();
  res.json({
    time: now.toLocaleTimeString("en-US", { timeZone: config.timezone || "America/New_York", hour: "2-digit", minute: "2-digit", hour12: true }),
    date: now.toLocaleDateString("en-US", { timeZone: config.timezone || "America/New_York", weekday: "long", month: "long", day: "numeric" }),
  });
});

// ── Navidrome — now playing + recently played ─────────────────────────────────
app.get("/api/navidrome", async (req, res) => {
  try {
    const { url, recentCount = 6 } = config.navidrome;
    const auth = subsonicAuth();

    const npRes  = await fetch(`${url}/rest/getNowPlaying?${auth}`);
    const npData = await npRes.json();
    const npList = npData?.["subsonic-response"]?.nowPlaying?.entry || [];
    const nowPlaying = npList.map(e => ({
      title:    e.title,
      artist:   e.artist,
      album:    e.album,
      coverUrl: `${url}/rest/getCoverArt?id=${e.coverArt}&size=80&${auth}`,
      navUrl:   url,
    }));

    const recRes  = await fetch(`${url}/rest/getAlbumList2?type=recent&size=${recentCount}&${auth}`);
    const recData = await recRes.json();
    const recList = recData?.["subsonic-response"]?.albumList2?.album || [];
    const recent  = recList.map(a => ({
      id:       a.id,
      name:     a.name,
      artist:   a.artist,
      year:     a.year,
      coverUrl: `${url}/rest/getCoverArt?id=${a.coverArt}&size=80&${auth}`,
      navUrl:   url,
    }));

    res.json({ nowPlaying, recent });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SHOUTcast — stats + song history ─────────────────────────────────────────
// Fetched server-side to avoid CORS issues.
// Endpoints used:
//   GET /statistics?json=1  → current listeners, now playing, server title
//   GET /played?json=1      → recent song history
app.get("/api/shoutcast", async (req, res) => {
  try {
    const { statsUrl, streamUrl, name, historyCount = 8 } = config.shoutcast;
    const agent = agentFor(statsUrl);

    // Fetch stats (now playing, listeners, bitrate)
    const statsRes  = await fetch(`${statsUrl}/statistics?json=1`, { timeout: 6000, agent });
    const statsData = await statsRes.json();

    // SHOUTcast returns either a direct object or a "streams" array
    // depending on version. Normalise both.
    const stream = statsData?.streams?.[0] ?? statsData;

    const nowPlaying = {
      title:           stream?.songtitle   || "Unknown",
      listeners:       stream?.currentlisteners ?? 0,
      peakListeners:   stream?.peaklisteners    ?? 0,
      maxListeners:    stream?.maxlisteners     ?? 0,
      bitrate:         stream?.bitrate          ?? 0,
      genre:           stream?.servergenre      || "",
      serverTitle:     stream?.servertitle      || name,
      online:          true,
    };

    // Fetch song history
    let history = [];
    try {
      const histRes  = await fetch(`${statsUrl}/played?json=1`, { timeout: 6000, agent });
      const histData = await histRes.json();
      // histData is an array of { playedat, title } objects
      history = (Array.isArray(histData) ? histData : [])
        .slice(0, historyCount)
        .map(t => ({
          title:    t.title    || t.songtitle || "Unknown",
          playedAt: t.playedat || null,
        }));
    } catch {
      // history is optional — don't fail the whole endpoint
    }

    res.json({ nowPlaying, history, streamUrl, name });
  } catch (e) {
    // Return an "offline" response rather than a 500
    res.json({
      nowPlaying: { online: false, title: "Station offline", listeners: 0, serverTitle: config.shoutcast?.name || "Radio" },
      history:    [],
      streamUrl:  config.shoutcast?.streamUrl || "",
      name:       config.shoutcast?.name      || "Radio",
    });
  }
});

// ── Bing Wallpaper of the day ─────────────────────────────────────────────────
app.get("/api/wallpaper", async (req, res) => {
  try {
    const r    = await fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US");
    const data = await r.json();
    const img  = data?.images?.[0];
    res.json({
      url:       `https://www.bing.com${img?.url}`,
      title:     img?.title,
      copyright: img?.copyright,
      date:      img?.startdate,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(config.port, () => console.log(`my-glance → http://localhost:${config.port}`));
