module.exports = function register(app, config) {
  app.get("/api/notes", (req, res) => res.json(config.notes || []));
};
