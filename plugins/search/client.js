MyGlance.registerWidget("search", {
  refresh: 0,
  css: `
    .search-wrap{display:flex;align-items:center;background:var(--surface2);border:1px solid var(--border);border-radius:6px;overflow:hidden;transition:border-color .15s;}
    .search-wrap:focus-within{border-color:var(--accent);}
    .search-icon{padding:0 12px;color:var(--muted);font-size:14px;flex-shrink:0;}
    .search-input{flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--sans);font-size:15px;padding:12px 12px 12px 0;}
    .search-input::placeholder{color:var(--muted);}
  `,
  render(container) {
    // Only build once — never needs refreshing
    if (container.querySelector(".search-wrap")) return;
    container.innerHTML = `<div class="card"><div class="card-body" style="padding:10px">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input class="search-input" placeholder="Search the web…" autocomplete="off"/>
      </div>
    </div></div>`;
    container.querySelector(".search-input").addEventListener("keydown", e => {
      if (e.key === "Enter" && e.target.value.trim()) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(e.target.value.trim())}`, "_blank");
        e.target.value = "";
      }
    });
  },
  async fetch() { return null; },
});
