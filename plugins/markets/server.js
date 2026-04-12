const fetch = require("node-fetch");

module.exports = function register(app, config) {
  app.get("/api/markets", async (req, res) => {
    try {
      const results = await Promise.all((config.markets || []).map(async m => {
        try {
          const data = await fetch(
            `https://query2.finance.yahoo.com/v8/finance/chart/${m.symbol}`,
            { headers: { "User-Agent": "Mozilla/5.0" } }
          ).then(r => r.json());
          const meta  = data?.chart?.result?.[0]?.meta || {};
          const price = meta.regularMarketPrice || 0;
          const prev  = meta.previousClose      || price;
          const change = prev ? (((price - prev) / prev) * 100).toFixed(2) : "0.00";
          return { symbol: m.symbol, name: m.name, price, change };
        } catch {
          return { symbol: m.symbol, name: m.name, price: 0, change: "0.00", error: true };
        }
      }));
      res.json(results);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
