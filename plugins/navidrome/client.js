MyGlance.registerWidget("navidrome", {
  refresh: 0,
  css: `
    .nd-now-playing{display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:6px;margin-bottom:12px;}
    .nd-cover{width:48px;height:48px;border-radius:4px;object-fit:cover;flex-shrink:0;background:var(--border);}
    .nd-info{min-width:0;}
    .nd-title{font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nd-artist{font-size:11px;color:var(--muted);font-family:var(--mono);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nd-playing-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);flex-shrink:0;animation:pulse 1.5s ease-in-out infinite;}
    .nd-recent-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
    .nd-album{display:flex;flex-direction:column;gap:4px;text-decoration:none;}
    .nd-album-cover{width:100%;aspect-ratio:1;border-radius:4px;object-fit:cover;background:var(--border);}
    .nd-album-name{font-size:10px;color:var(--text);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .nd-album-artist{font-size:9px;color:var(--muted);font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "🎵 Navidrome");
    if (!data || data.error) {
      MyGlance.patch(body, `<span style="color:var(--red);font-size:11px">Navidrome unavailable</span>`);
      return;
    }

    const npHTML = data.nowPlaying.length
      ? data.nowPlaying.map(t => `
          <div class="nd-now-playing">
            <div class="nd-playing-dot"></div>
            <img class="nd-cover" src="${t.coverUrl}" alt="${t.album}" onerror="this.style.visibility='hidden'"/>
            <div class="nd-info">
              <div class="nd-title">${t.title}</div>
              <div class="nd-artist">${t.artist} · ${t.album}</div>
            </div>
          </div>`).join("")
      : `<div class="nd-now-playing" style="opacity:.5">
           <div style="font-size:20px">🎵</div>
           <div class="nd-info">
             <div class="nd-title">Nothing playing</div>
             <div class="nd-artist">Open Navidrome to start listening</div>
           </div>
         </div>`;

    const recHTML = data.recent.length
      ? `<div style="font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Recently Played</div>
         <div class="nd-recent-grid">${data.recent.map(a => `
           <a class="nd-album" href="${a.navUrl}" target="_blank" rel="noopener" title="${a.name} — ${a.artist}">
             <img class="nd-album-cover" src="${a.coverUrl}" alt="${a.name}" onerror="this.style.visibility='hidden'"/>
             <div class="nd-album-name">${a.name}</div>
             <div class="nd-album-artist">${a.artist}</div>
           </a>`).join("")}
         </div>`
      : "";

    MyGlance.patch(body, npHTML + recHTML);
  },
  async fetch() { return window.fetch("/api/navidrome").then(r => r.json()); },
});

MyGlance.onWsEvent("navidrome", (data) => {
  const def = MyGlance._widgets.navidrome;
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="navidrome"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
