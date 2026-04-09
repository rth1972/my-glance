module.exports = function register(app, config) {
  app.get("/api/bookmarks", (req, res) => res.json(config.bookmarks || []));
};
