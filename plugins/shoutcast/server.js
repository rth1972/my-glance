const { execFile } = require("child_process");

function curlFetch(url, timeout = 6) {
  return new Promise((resolve, reject) => {
    const args = [
      "--interface", "en1",
      "--insecure",
      "--silent",
      "--max-time", String(timeout),
      "--write-out", "\n%{http_code}",
      url
    ];
    execFile("curl", args, { timeout: (timeout + 1) * 1000 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      const parts = stdout.trim().rsplit ? stdout.trim().split("\n") : stdout.trim().split("\n");
      const status = parseInt(parts[parts.length - 1], 10);
      const body = parts.slice(0, -1).join("\n");
      if (status < 200 || status >= 400) return reject(new Error(`HTTP ${status}`));
      resolve({ status, text: () => Promise.resolve(body), json: () => Promise.resolve(JSON.parse(body)) });
    });
  });
}

function curlFetchWithAuth(url, auth, timeout = 6) {
  return new Promise((resolve, reject) => {
    const args = [
      "--interface", "en1",
      "--insecure",
      "--silent",
      "--max-time", String(timeout),
      "--write-out", "\n%{http_code}",
      "--user", auth,
      url
    ];
    execFile("curl", args, { timeout: (timeout + 1) * 1000 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      const parts = stdout.trim().rsplit ? stdout.trim().split("\n") : stdout.trim().split("\n");
      const status = parseInt(parts[parts.length - 1], 10);
      const body = parts.slice(0, -1).join("\n");
      if (status < 200 || status >= 400) return reject(new Error(`HTTP ${status}`));
      resolve({ status, text: () => Promise.resolve(body), json: () => Promise.resolve(JSON.parse(body)) });
    });
  });
}

module.exports = function register(app, config) {
  const broadcast = app.get("broadcast");

  async function fetchShoutcast() {
    const { statsUrl, streamUrl, name, historyCount = 8, adminUser, adminPass } = config.shoutcast;
    const hasAuth = adminUser && adminPass;

    try {
      const statsResponse = await curlFetch(`${statsUrl}/statistics?json=1`);
      const statsData = await statsResponse.json();
      const stream = statsData?.streams?.[0] ?? statsData;

      const nowPlaying = {
        title:        stream?.songtitle        || "Unknown",
        listeners:    stream?.currentlisteners ?? 0,
        peakListeners:stream?.peaklisteners    ?? 0,
        maxListeners: stream?.maxlisteners     ?? 0,
        bitrate:      stream?.bitrate          ?? 0,
        genre:        stream?.servergenre      || "",
        serverTitle:  stream?.servertitle      || name,
        online: true
      };

      let history = [];
      if (hasAuth) {
        try {
          const histResponse = await curlFetchWithAuth(`${statsUrl}/admin.cgi?mode=viewjson&page=4&sid=1`, `${adminUser}:${adminPass}`);
          const histData = await histResponse.json();
          history = (Array.isArray(histData) ? histData : [])
            .filter(t => t.title)
            .slice(0, historyCount)
            .map(t => ({
              title: t.title || "Unknown",
              artist: t.artist || "",
              playedAt: t.playedat ? new Date(t.playedat * 1000).toLocaleString() : ""
            }));
        } catch (err) {
          console.warn("[shoutcast] History fetch failed:", err.message);
        }
      }

      broadcast("shoutcast", { nowPlaying, history, streamUrl, name });

    } catch (err) {
      console.error("[shoutcast] Fetch failed:", err.message);
      broadcast("shoutcast", {
        nowPlaying: { online: false, title: "Station offline", listeners: 0, serverTitle: name || "Radio" },
        history: [],
        streamUrl,
        name
      });
    }
  }

  fetchShoutcast();
  setInterval(fetchShoutcast, 10_000);

  app.get("/api/shoutcast", async (req, res) => {
    const { statsUrl, streamUrl, name, historyCount = 8, adminUser, adminPass } = config.shoutcast;
    const hasAuth = adminUser && adminPass;

    try {
      const statsResponse = await curlFetch(`${statsUrl}/statistics?json=1`);
      const statsData = await statsResponse.json();
      const stream = statsData?.streams?.[0] ?? statsData;

      const nowPlaying = {
        title:        stream?.songtitle        || "Unknown",
        listeners:    stream?.currentlisteners ?? 0,
        peakListeners:stream?.peaklisteners    ?? 0,
        maxListeners: stream?.maxlisteners     ?? 0,
        bitrate:      stream?.bitrate          ?? 0,
        genre:        stream?.servergenre      || "",
        serverTitle:  stream?.servertitle      || name,
        online: true
      };

      let history = [];
      if (hasAuth) {
        try {
          const histResponse = await curlFetchWithAuth(`${statsUrl}/admin.cgi?mode=viewjson&page=4&sid=1`, `${adminUser}:${adminPass}`);
          const histData = await histResponse.json();
          history = (Array.isArray(histData) ? histData : [])
            .filter(t => t.title)
            .slice(0, historyCount)
            .map(t => ({
              title: t.title || "Unknown",
              artist: t.artist || "",
              playedAt: t.playedat ? new Date(t.playedat * 1000).toLocaleString() : ""
            }));
        } catch (err) {
          console.warn("[shoutcast] History fetch failed:", err.message);
        }
      }

      res.json({ nowPlaying, history, streamUrl, name });

    } catch (err) {
      console.error("[shoutcast] Fetch failed:", err.message);
      res.json({
        nowPlaying: { online: false, title: "Station offline", listeners: 0, serverTitle: name || "Radio" },
        history: [],
        streamUrl,
        name
      });
    }
  });
};
