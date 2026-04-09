// Widget: time
// Refresh: every 10s (driven by main init)
MyGlance.registerWidget("time", {
  refresh: 10_000,
  render(container) {
    const data = this._data;
    if (!container.querySelector(".card")) {
      container.innerHTML = `<div class="card"><div class="card-body text-center py-4">
        <div class="font-mono text-7xl font-light text-text tracking-tight" data-time></div>
        <div class="font-mono text-xs text-muted mt-1 tracking-widest uppercase" data-date></div>
      </div></div>`;
    }
    if (data) {
      const tv = container.querySelector("[data-time]");
      const dv = container.querySelector("[data-date]");
      if (tv && tv.textContent !== data.time) tv.textContent = data.time;
      if (dv && dv.textContent !== data.date) dv.textContent = data.date;
    }
  },
  async fetch() {
    this._data = await window.fetch("/api/time").then(r => r.json());
    return this._data;
  },
});
