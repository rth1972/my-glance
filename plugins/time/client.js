MyGlance.registerWidget("time", {
  refresh: 0,
  css: ``,
  render(container, data) {
    if (!container.querySelector(".card")) {
      container.innerHTML = `<div class="card">
        <div class="card-body text-center py-4">
          <div class="font-mono text-6xl font-light text-muted tracking-tight" data-time></div>
          <div class="font-mono text-xs text-muted mt-1 tracking-widest uppercase" data-date></div>
        </div>
      </div>`;
    }
    if (!data) return;
    const tv = container.querySelector("[data-time]");
    const dv = container.querySelector("[data-date]");
    if (tv && tv.textContent !== data.time) tv.textContent = data.time;
    if (dv && dv.textContent !== data.date) dv.textContent = data.date;
  },
  async fetch() { return window.fetch("/api/time").then(r => r.json()); },
});

MyGlance.onWsEvent("time", (data) => {
  const def = MyGlance._widgets.time;
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="time"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
