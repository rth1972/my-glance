MyGlance.registerWidget("feeds", {
  refresh: 0,
  css: `
    .feed-list{display:flex;flex-direction:column;}
    .feed-item{padding:9px 0;border-bottom:1px solid var(--border);}
    .feed-item:last-child{border-bottom:none;}
    .feed-item a{color:var(--text);text-decoration:none;font-size:13px;line-height:1.4;display:block;margin-bottom:3px;}
    .feed-item a:hover{color:var(--accent);}
    .feed-meta{display:flex;gap:8px;font-size:10px;color:var(--muted);font-family:var(--mono);}
    .feed-source{color:var(--accent);}
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "News &amp; Feeds");
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
  async fetch() { return window.fetch("/api/feeds").then(r => r.json()); },
});

MyGlance.onWsEvent("feeds", (data) => {
  const def = MyGlance._widgets.feeds;
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="feeds"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
