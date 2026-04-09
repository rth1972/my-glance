MyGlance.registerWidget("notes", {
  refresh: 0,
  css: ``,  // reuses .bm-* classes from bookmarks plugin
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Quick Links");
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
  async fetch() { return window.fetch("/api/notes").then(r => r.json()); },
});
