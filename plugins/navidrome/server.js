const fetch  = require("node-fetch");
const https  = require("https");
const crypto = require("crypto");

module.exports = function register(app, config) {
  const localAgent = new https.Agent({ rejectUnauthorized: false });

  function subsonicAuth() {
    const salt  = Math.random().toString(36).substring(2, 10);
    const token = crypto.createHash("md5").update(config.navidrome.password + salt).digest("hex");
    return `u=${config.navidrome.user}&t=${token}&s=${salt}&v=1.16.1&c=my-glance&f=json`;
  }

  app.get("/api/navidrome", async (req, res) => {
    try {
      const { url, recentCount = 6 } = config.navidrome;
      const auth = subsonicAuth();

      const npData = await fetch(`${url}/rest/getNowPlaying?${auth}`).then(r => r.json());
      const npList = npData?.["subsonic-response"]?.nowPlaying?.entry || [];
      const nowPlaying = npList.map(e => ({
        title:    e.title,
        artist:   e.artist,
        album:    e.album,
        coverUrl: `${url}/rest/getCoverArt?id=${e.coverArt}&size=80&${auth}`,
        navUrl:   url,
      }));

      const recData = await fetch(`${url}/rest/getAlbumList2?type=recent&size=${recentCount}&${auth}`).then(r => r.json());
      const recList = recData?.["subsonic-response"]?.albumList2?.album || [];
      const recent  = recList.map(a => ({
        name:     a.name,
        artist:   a.artist,
        coverUrl: `${url}/rest/getCoverArt?id=${a.coverArt}&size=80&${auth}`,
        navUrl:   url,
      }));

      res.json({ nowPlaying, recent });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
