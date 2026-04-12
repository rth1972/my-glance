const _def = {
  render(data) {
    const track = document.getElementById("ticker-track");
    if (!track) return;
    if (!Array.isArray(data)) {
      track.innerHTML = `<span style="color:var(--red);font-size:11px">Markets unavailable</span>`;
      return;
    }
    const html = data.map(m => {
      const chg  = parseFloat(m.change) || 0;
      const dir  = chg >= 0 ? "up" : "down";
      const sign = chg >= 0 ? "+" : "";
      const raw  = typeof m.price === "string" ? parseFloat(m.price) : m.price;
      const price = raw != null
        ? raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "—";
      return `<div class="flex items-center gap-2 whitespace-nowrap shrink-0">
        <span class="ticker-name">${m.name}</span>
        <span class="ticker-price ${dir}">$${price}</span>
        <span class="ticker-change ${dir}">${sign}${chg.toFixed(2)}%</span>
      </div>`;
    }).join('<span style="color:var(--border);padding:0 4px;user-select:none">│</span>');
    MyGlance.patch(track, html);
  },
  async fetch() { return window.fetch("/api/markets").then(r => r.json()); },
};

MyGlance.registerMarkets(_def);

MyGlance.onWsEvent("markets", (data) => {
  _def.render(data);
});
