// SHOUTcast plugin — keeps a single Audio element alive across refreshes
(function () {
  let _audio    = null;
  let _playing  = false;

  function getAudio(streamUrl) {
    if (!_audio) {
      _audio = new Audio();
      _audio.volume = 0.8;
    }
    if (_audio.src !== streamUrl) {
      _audio.pause();
      _audio.src = streamUrl;
      _audio.load();
    }
    return _audio;
  }

  // Define this clearly so it's accessible to the render function
  const handlePlayPause = (streamUrl) => {
    const audio = getAudio(streamUrl);
    if (_playing) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = streamUrl; // The "Stop" trick
      _playing = false;
    } else {
      audio.play().catch((err) => console.error("Playback failed:", err));
      _playing = true;
    }
  };

  MyGlance.registerWidget("shoutcast", {
    refresh: 10_000,
    css: `
      .sc-now-playing{background:var(--surface2);border-radius:6px;padding:12px;margin-bottom:12px;}
      .sc-station-name{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:8px;display:flex;align-items:center;gap:6px;}
      .sc-live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);flex-shrink:0;animation:pulse 1.5s ease-in-out infinite;}
      .sc-live-dot.off{background:var(--muted);box-shadow:none;animation:none;}
      .sc-song-title{font-size:12px;font-weight:600;color:var(--text);line-height:1.3;margin-bottom:4px;word-break:break-word;}
      .sc-artist{font-size:11px;color:var(--muted);font-family:var(--mono);margin-bottom:8px;}
      .sc-meta-row{display:flex;gap:12px;font-size:10px;color:var(--muted);font-family:var(--mono);flex-wrap:wrap;margin-bottom:12px;}
      .sc-meta-val{color:var(--text);}
      .sc-player{display:flex;align-items:center;gap:10px;}
      .sc-play-btn{width:36px;height:36px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .1s;}
      .sc-play-btn:hover{background:#3a7de0;transform:scale(1.05);}
      .sc-play-btn svg{width:16px;height:16px;fill:#fff;}
      .sc-volume-wrap{flex:1;display:flex;align-items:center;gap:6px;}
      .sc-vol-icon{font-size:13px;color:var(--muted);flex-shrink:0;}
      .sc-volume{flex:1;-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;background:var(--border);outline:none;cursor:pointer;}
      .sc-volume::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent);cursor:pointer;}
      .sc-history-label{font-size:9px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:6px;margin-top:12px;}
      .sc-history-list{display:flex;flex-direction:column;}
      .sc-history-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);}
      .sc-history-item:last-child{border-bottom:none;}
      .sc-history-num{font-size:9px;color:var(--muted);font-family:var(--mono);width:14px;text-align:right;flex-shrink:0;}
      .sc-history-title{font-size:12px;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    `,
    render(container, data) {
      const body = MyGlance.ensureCard(container, "📻 Radio");
      if (!data) return;

      const np    = data.nowPlaying;
      const audio = getAudio(data.streamUrl);

      let songLine = np.title || "Unknown", artistLine = "";
      if (np.title && np.title.includes(" - ")) {
        const parts = np.title.split(" - ");
        artistLine  = parts[0].trim();
        songLine    = parts.slice(1).join(" - ").trim();
      }

      const playIcon = _playing
        ? `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;

      const historyHTML = data.history.length
        ? `<div class="sc-history-label">Recent Tracks</div>
           <div class="sc-history-list">${data.history.map((t, i) =>
             `<div class="sc-history-item">
               <span class="sc-history-num">${i + 1}</span>
               <span class="sc-history-title">${t.title}</span>
             </div>`).join("")}</div>`
        : "";

      MyGlance.patch(body, `
        <div class="sc-now-playing">
          <div class="sc-station-name">
            <div class="sc-live-dot ${np.online ? "" : "off"}"></div>
            ${np.serverTitle || data.name}
          </div>
          <div class="sc-song-title">${songLine}</div>
          ${artistLine ? `<div class="sc-artist">${artistLine}</div>` : ""}
          <div class="sc-meta-row">
            <span>👥 <span class="sc-meta-val">${np.listeners}</span> listeners</span>
            ${np.bitrate ? `<span>🎚 <span class="sc-meta-val">${np.bitrate}kbps</span></span>` : ""}
            ${np.genre   ? `<span>🎵 <span class="sc-meta-val">${np.genre}</span></span>`   : ""}
          </div>
          <div class="sc-player">
            <button class="sc-play-btn" data-sc-play>${playIcon}</button>
            <div class="sc-volume-wrap">
              <span class="sc-vol-icon">🔈</span>
              <input class="sc-volume" type="range" min="0" max="1" step="0.05" value="${audio.volume}" data-sc-vol/>
              <span class="sc-vol-icon">🔊</span>
            </div>
          </div>
        </div>
        ${historyHTML}`);

      // FIXED: Removed 'this.' and called handlePlayPause directly
      body.querySelector("[data-sc-play]").addEventListener("click", () => {
        handlePlayPause(data.streamUrl); 
        this.render(container, data); 
      });

      body.querySelector("[data-sc-vol]").addEventListener("input", e => {
        audio.volume = parseFloat(e.target.value);
      });
    },
    async fetch() { return window.fetch("/api/shoutcast").then(r => r.json()); },
  });
})();