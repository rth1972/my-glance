const fetch = require("node-fetch");
const https = require("https");
const localAgent = new https.Agent({ rejectUnauthorized: false });

module.exports = function register(app, config) {
  app.get("/api/shoutcast", async (req, res) => {
    try {
      const { statsUrl, streamUrl, name, historyCount = 8 } = config.shoutcast;
      const agent = statsUrl.startsWith("https") ? localAgent : undefined;

      const statsData = await fetch(`${statsUrl}/statistics?json=1`, { timeout: 6000, agent }).then(r => r.json());
      const stream    = statsData?.streams?.[0] ?? statsData;

      const nowPlaying = {
        title:       stream?.songtitle        || "Unknown",
        listeners:   stream?.currentlisteners ?? 0,
        peakListeners: stream?.peaklisteners  ?? 0,
        maxListeners:  stream?.maxlisteners   ?? 0,
        bitrate:     stream?.bitrate          ?? 0,
        genre:       stream?.servergenre      || "",
        serverTitle: stream?.servertitle      || name,
        online:      true,
      };

      let history = [];
      try {
        const histData = await fetch(`${statsUrl}/played?json=1`, { timeout: 6000, agent }).then(r => r.json());
        history = (Array.isArray(histData) ? histData : [])
          .slice(0, historyCount)
          .map(t => ({ title: t.title || t.songtitle || "Unknown" }));
      } catch { /* history is optional */ }

      res.json({ nowPlaying, history, streamUrl, name });
    } catch {
      res.json({
        nowPlaying: { online: false, title: "Station offline", listeners: 0, serverTitle: config.shoutcast?.name || "Radio" },
        history:    [],
        streamUrl:  config.shoutcast?.streamUrl || "",
        name:       config.shoutcast?.name      || "Radio",
      });
    }
  });
};
