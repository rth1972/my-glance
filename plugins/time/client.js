// Widget: time — no API needed, runs client-side every 10s
MyGlance.registerWidget("time", {
  refresh: 10_000,
  css: ``,
  render(container, data) {
    // Build shell once
    if (!container.querySelector(".card")) {
      container.innerHTML = `<div class="card">
        <div class="card-body text-center py-4">
          <div class="font-mono text-6xl font-light text-muted tracking-tight" data-time></div>
          <div class="font-mono text-xs text-muted mt-1 tracking-widest uppercase" data-date></div>
        </div>
      </div>`;
    }
    if (!data) return;
    // Patch only the two text nodes — no blink, no rebuild
    const tv = container.querySelector("[data-time]");
    const dv = container.querySelector("[data-date]");
    if (tv && tv.textContent !== data.time) tv.textContent = data.time;
    if (dv && dv.textContent !== data.date) dv.textContent = data.date;
  },
  // fetch() returns data that is passed directly into render()
  async fetch() {
    return window.fetch("/api/time").then(r => r.json());
  },
});
