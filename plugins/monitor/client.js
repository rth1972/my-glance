MyGlance.registerWidget("monitor", {
  refresh: 30_000,
  css: `
    .monitor-list{display:flex;flex-direction:column;gap:6px;}
    .monitor-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface2);border-radius:4px;}
    .monitor-left{display:flex;align-items:center;gap:8px;}
    .monitor-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
    .monitor-ms{font-family:var(--mono);font-size:10px;color:var(--muted);}
    .dot-ok{background:var(--green);box-shadow:0 0 6px var(--green);}
    .dot-fail{background:var(--red);box-shadow:0 0 6px var(--red);}
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Services");
    if (!data) return;
    MyGlance.patch(body, `<div class="monitor-list">${data.map(s =>
      `<div class="monitor-item">
        <div class="monitor-left">
          <div class="monitor-dot ${s.ok ? "dot-ok" : "dot-fail"}"></div>
          <a href="${s.url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${s.title}</a>
        </div>
        <span class="monitor-ms">${s.ok ? s.ms + "ms" : "offline"}</span>
      </div>`).join("")}</div>`);
  },
  async fetch() { return window.fetch("/api/monitor").then(r => r.json()); },
});
