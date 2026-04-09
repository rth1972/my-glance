// Widget: calendar — pure client-side, no API
MyGlance.registerWidget("calendar", {
  refresh: 0, // no auto-refresh needed
  css: `
    .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
    .cal-day-label{text-align:center;font-size:10px;color:var(--muted);padding:4px 0;font-family:var(--mono);}
    .cal-day{text-align:center;padding:5px 2px;font-family:var(--mono);font-size:12px;border-radius:3px;color:var(--muted);}
    .cal-day.this-month{color:var(--text);}
    .cal-day.today{background:var(--accent);color:#fff;font-weight:600;}
  `,
  render(container) {
    const now = new Date(), year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
    const monthStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const first = new Date(year, month, 1).getDay(), daysIn = new Date(year, month + 1, 0).getDate();
    let days = ["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => `<div class="cal-day-label">${d}</div>`).join("");
    for (let i = 0; i < first; i++) days += `<div class="cal-day"></div>`;
    for (let d = 1; d <= daysIn; d++) days += `<div class="cal-day ${d === today ? "today" : "this-month"}">${d}</div>`;
    container.innerHTML = `<div class="card">
      <div class="card-header">
        <span class="card-title">Calendar</span>
        <span style="font-family:var(--mono);font-size:11px;color:var(--muted)">${monthStr}</span>
      </div>
      <div class="card-body"><div class="cal-grid">${days}</div></div>
    </div>`;
  },
  async fetch() { return null; },
});
