MyGlance.registerWidget("wallpaper", {
  refresh: 3_600_000, // once per hour
  css: `
    .wallpaper-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;display:block;}
    .wallpaper-caption{font-size:10px;color:var(--muted);font-family:var(--mono);margin-top:8px;line-height:1.4;}
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "🖼️ Bing Wallpaper");
    if (!data || data.error) {
      MyGlance.patch(body, `<span style="color:var(--red);font-size:11px">Wallpaper unavailable</span>`);
      return;
    }
    MyGlance.patch(body, `
      <a href="${data.url}" target="_blank" rel="noopener">
        <img class="wallpaper-img" src="${data.url}" alt="${data.title}" loading="lazy"/>
      </a>
      <div class="wallpaper-caption">
        <span style="color:var(--text);font-weight:500">${data.title}</span>
        ${data.copyright ? `<br/><span>${data.copyright}</span>` : ""}
      </div>`);
  },
  async fetch() { return window.fetch("/api/wallpaper").then(r => r.json()); },
});
