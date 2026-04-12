MyGlance.registerWidget("techfeeds", {
  refresh: 0,
  css: ``,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Tech &amp; Self-Hosted");
    if (!data) return;
    const html = data.length
      ? `<div class="feed-list">${data.map(it =>
          `<div class="feed-item">
            <a href="${it.link}" target="_blank" rel="noopener">${it.title}</a>
            <div class="feed-meta"><span class="feed-source">${it.source}</span><span>${MyGlance.timeAgo(it.date)}</span></div>
          </div>`).join("")}</div>`
      : `<span class="loading">No items</span>`;
    MyGlance.patch(body, html);
  },
  async fetch() { return window.fetch("/api/techfeeds").then(r => r.json()); },
});

MyGlance.onWsEvent("techfeeds", (data) => {
  const def = MyGlance._widgets.techfeeds;
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="techfeeds"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
