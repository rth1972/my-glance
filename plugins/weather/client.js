// Widget: weather
MyGlance.registerWidget("weather", {
  refresh: 600_000,
  css: `
    .weather-main{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:12px;}
    .weather-temp{font-size:48px;font-weight:300;line-height:1;font-family:var(--mono);}
    .weather-temp sup{font-size:18px;vertical-align:super;color:var(--muted);}
    .weather-desc{text-align:right;}.weather-city{font-size:11px;color:var(--muted);}
    .weather-condition{font-size:13px;margin-top:2px;}
    .weather-meta{display:flex;gap:16px;font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:14px;flex-wrap:wrap;}
    .weather-forecast{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}
    .forecast-day{background:var(--surface2);border-radius:4px;padding:8px 4px;text-align:center;}
    .forecast-label{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-family:var(--mono);}
    .forecast-icon{font-size:18px;margin:4px 0;}
    .forecast-hi{font-size:12px;font-family:var(--mono);}
    .forecast-lo{font-size:10px;color:var(--muted);font-family:var(--mono);}
  `,
  WMO: {0:"Clear",1:"Mostly Clear",2:"Partly Cloudy",3:"Overcast",45:"Foggy",48:"Icy Fog",51:"Light Drizzle",53:"Drizzle",55:"Heavy Drizzle",61:"Light Rain",63:"Rain",65:"Heavy Rain",71:"Light Snow",73:"Snow",75:"Heavy Snow",77:"Snow Grains",80:"Showers",81:"Rain Showers",82:"Violent Showers",85:"Snow Showers",86:"Heavy Snow Showers",95:"Thunderstorm",96:"Thunderstorm+Hail",99:"Severe Thunderstorm"},
  WMO_ICON: {0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",71:"❄️",73:"🌨️",75:"🌨️",77:"🌨️",80:"🌦️",81:"🌧️",82:"⛈️",85:"🌨️",86:"🌨️",95:"⛈️",96:"⛈️",99:"⛈️"},
  DAYS: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Weather");
    if (!data) return;
    const cur = data.current, code = cur.weather_code, unit = data.units === "imperial" ? "F" : "C";
    const forecast = data.daily.time.slice(0, 5).map((t, i) =>
      `<div class="forecast-day">
        <div class="forecast-label">${this.DAYS[new Date(t + "T12:00:00").getDay()]}</div>
        <div class="forecast-icon">${this.WMO_ICON[data.daily.weather_code[i]] ?? "🌡️"}</div>
        <div class="forecast-hi">${Math.round(data.daily.temperature_2m_max[i])}°</div>
        <div class="forecast-lo">${Math.round(data.daily.temperature_2m_min[i])}°</div>
      </div>`).join("");
    MyGlance.patch(body, `
      <div class="weather-main">
        <div class="weather-temp">${Math.round(cur.temperature_2m)}<sup>°${unit}</sup></div>
        <div class="weather-desc">
          <div style="font-size:28px">${this.WMO_ICON[code] ?? "🌡️"}</div>
          <div class="weather-condition">${this.WMO[code] ?? "Unknown"}</div>
          <div class="weather-city">${data.city}</div>
        </div>
      </div>
      <div class="weather-meta">
        <span>Feels ${Math.round(cur.apparent_temperature)}°</span>
        <span>Humidity ${cur.relative_humidity_2m}%</span>
        <span>Wind ${Math.round(cur.wind_speed_10m)} ${data.units === "imperial" ? "mph" : "km/h"}</span>
      </div>
      <div class="weather-forecast">${forecast}</div>`);
  },
  async fetch() { return window.fetch("/api/weather").then(r => r.json()); },
});
