MyGlance.registerWidget("uptime-history", {
  refresh: 0,
  css: `
    .uh-list { display: flex; flex-direction: column; gap: 8px; }
    .uh-item { background: var(--surface2); border-radius: 4px; padding: 8px 10px; }
    .uh-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
    .uh-left { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .uh-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .uh-dot.up      { background: var(--green); box-shadow: 0 0 5px var(--green); }
    .uh-dot.down    { background: var(--red);   box-shadow: 0 0 5px var(--red); }
    .uh-dot.pending { background: var(--muted); }
    .uh-name { font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .uh-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .uh-pct { font-size: 10px; font-family: var(--mono); }
    .uh-pct.ok   { color: var(--green); }
    .uh-pct.warn { color: #f5a623; }
    .uh-pct.bad  { color: var(--red); }
    .uh-pct.none { color: var(--muted); }
    .uh-ms { font-size: 10px; font-family: var(--mono); color: var(--muted); }
    .uh-spark { display: flex; align-items: flex-end; gap: 1px; height: 18px; }
    .uh-spark-bar { width: 4px; border-radius: 1px; flex-shrink: 0; transition: height .3s; }
    .uh-waiting { color: var(--muted); font-size: 10px; font-family: var(--mono); }
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Uptime — 4h");
    if (!data) return;

    const rows = data.map(site => {
      const has     = site.samples > 0;
      const dotCls  = !has ? "pending" : site.pct === 100 ? "up" : site.pct < 80 ? "down" : "up";
      const pctCls  = site.pct === null ? "none" : site.pct === 100 ? "ok" : site.pct < 90 ? "bad" : "warn";
      const pctLbl  = site.pct === null ? "—" : `${site.pct}%`;
      const msLbl   = site.avgMs > 0 ? `${site.avgMs}ms` : "";

      const bars = site.spark.length
        ? site.spark.map(v =>
            `<div class="uh-spark-bar" style="height:${v ? 14 : 4}px;background:${v ? "var(--green)" : "var(--red)"};opacity:${v ? 0.75 : 0.55}"></div>`
          ).join("")
        : `<span class="uh-waiting">collecting…</span>`;

      return `
        <div class="uh-item">
          <div class="uh-top">
            <div class="uh-left">
              <div class="uh-dot ${dotCls}"></div>
              <a href="${site.url}" target="_blank" rel="noopener" class="uh-name" style="color:inherit;text-decoration:none">${site.title}</a>
            </div>
            <div class="uh-right">
              ${msLbl ? `<span class="uh-ms">${msLbl}</span>` : ""}
              <span class="uh-pct ${pctCls}">${pctLbl}</span>
            </div>
          </div>
          <div class="uh-spark">${bars}</div>
        </div>`;
    }).join("");

    MyGlance.patch(body, `<div class="uh-list">${rows}</div>`);
  },
  async fetch() { return window.fetch("/api/uptime-history").then(r => r.json()); },
});

MyGlance.onWsEvent("uptime-history", (data) => {
  const def = MyGlance._widgets["uptime-history"];
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="uptime-history"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
