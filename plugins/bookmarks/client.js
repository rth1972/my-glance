MyGlance.registerWidget("bookmarks", {
  refresh: 0,
  css: `
    .bm-group{margin-bottom:14px;}.bm-group:last-child{margin-bottom:0;}
    .bm-group-title{font-size:9px;font-family:var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;}
    .bm-links{display:flex;flex-direction:column;gap:3px;}
    .bm-link{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;text-decoration:none;color:var(--text);font-size:13px;transition:background .15s;}
    .bm-link:hover{background:var(--surface2);color:var(--accent);}
    .bm-icon{font-size:14px;width:20px;text-align:center;}
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Bookmarks");
    if (!data) return;
    MyGlance.patch(body, data.map(g =>
      `<div class="bm-group">
        <div class="bm-group-title">${g.group}</div>
        <div class="bm-links">${g.links.map(l =>
          `<a class="bm-link" href="${l.url}" target="_blank" rel="noopener">
            <span class="bm-icon">${l.icon || "🔗"}</span>${l.title}
          </a>`).join("")}
        </div>
      </div>`).join(""));
  },
  async fetch() { return window.fetch("/api/bookmarks").then(r => r.json()); },
});
