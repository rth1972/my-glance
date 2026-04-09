const fetch = require("node-fetch");
module.exports = function register(app, config) {
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
};
