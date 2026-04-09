const fetch = require("node-fetch");

module.exports = function register(app, config) {
  app.get("/api/wallpaper", async (req, res) => {
    try {
      const data = await fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US").then(r => r.json());
      const img  = data?.images?.[0];
      res.json({
        url:       `https://www.bing.com${img?.url}`,
        title:     img?.title     || "",
        copyright: img?.copyright || "",
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
