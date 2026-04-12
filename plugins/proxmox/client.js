MyGlance.registerWidget("proxmox", {
  refresh: 10_000,
  css: `
    .pve-section { margin-bottom: 14px; }
    .pve-label { font-size: 9px; font-family: var(--mono); color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
    .pve-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .pve-bar-name { font-size: 11px; color: var(--text); min-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pve-bar-track { flex: 1; height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
    .pve-bar-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
    .pve-bar-pct { font-size: 10px; font-family: var(--mono); color: var(--muted); min-width: 30px; text-align: right; }
    .pve-bar-fill.ok   { background: var(--green); }
    .pve-bar-fill.warn { background: #f5a623; }
    .pve-bar-fill.crit { background: var(--red); }
    .pve-vm-grid { display: flex; flex-direction: column; gap: 4px; }
    .pve-vm-row { display: flex; align-items: center; gap: 7px; padding: 5px 8px; background: var(--surface2); border-radius: 4px; }
    .pve-vm-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .pve-vm-dot.running { background: var(--green); box-shadow: 0 0 5px var(--green); }
    .pve-vm-dot.stopped { background: var(--red); }
    .pve-vm-name { font-size: 11px; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pve-vm-type { font-size: 9px; font-family: var(--mono); color: var(--muted); background: var(--border); padding: 1px 5px; border-radius: 3px; }
    .pve-vm-id { font-size: 9px; font-family: var(--mono); color: var(--muted); }
    .pve-uptime { font-size: 10px; font-family: var(--mono); color: var(--muted); margin-bottom: 10px; }
    .pve-error { color: var(--red); font-size: 11px; }
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Proxmox");
    if (!data) return;
    if (data.error) { MyGlance.patch(body, `<div class="pve-error">${data.error}</div>`); return; }

    function barColor(pct) { return pct >= 85 ? "crit" : pct >= 65 ? "warn" : "ok"; }
    function fmtBytes(b) {
      if (b >= 1e12) return (b / 1e12).toFixed(1) + " TB";
      if (b >= 1e9)  return (b / 1e9).toFixed(1)  + " GB";
      return (b / 1e6).toFixed(0) + " MB";
    }
    function fmtUptime(s) {
      const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
      if (d > 0) return `${d}d ${h}h uptime`;
      if (h > 0) return `${h}h ${m}m uptime`;
      return `${m}m uptime`;
    }

    const cpuBar  = `<div class="pve-bar-row"><span class="pve-bar-name">CPU</span><div class="pve-bar-track"><div class="pve-bar-fill ${barColor(data.cpuPct)}" style="width:${data.cpuPct}%"></div></div><span class="pve-bar-pct">${data.cpuPct}%</span></div>`;
    const memBar  = `<div class="pve-bar-row"><span class="pve-bar-name">RAM</span><div class="pve-bar-track"><div class="pve-bar-fill ${barColor(data.memPct)}" style="width:${data.memPct}%"></div></div><span class="pve-bar-pct">${data.memPct}%</span></div>`;
    const diskBars = data.disks.map(d =>
      `<div class="pve-bar-row"><span class="pve-bar-name" title="${d.name}">${d.name}</span><div class="pve-bar-track"><div class="pve-bar-fill ${barColor(d.pct)}" style="width:${d.pct}%"></div></div><span class="pve-bar-pct">${d.pct}%</span></div>`
    ).join("");

    const vmRows = data.vms.map(v =>
      `<div class="pve-vm-row">
        <div class="pve-vm-dot ${v.status === "running" ? "running" : "stopped"}"></div>
        <span class="pve-vm-name">${v.name || "—"}</span>
        <span class="pve-vm-id">${v.id}</span>
        <span class="pve-vm-type">${v.type}</span>
      </div>`
    ).join("");

    MyGlance.patch(body, `
      <div class="pve-uptime">${data.node} · ${fmtUptime(data.uptime)} · ${fmtBytes(data.memUsed)} / ${fmtBytes(data.memTotal)} RAM</div>
      <div class="pve-section">
        <div class="pve-label">Resources</div>
        ${cpuBar}${memBar}${diskBars}
      </div>
      <div class="pve-section">
        <div class="pve-label">VMs &amp; Containers</div>
        <div class="pve-vm-grid">${vmRows || "<span style='color:var(--muted);font-size:11px'>No VMs found</span>"}</div>
      </div>
    `);
  },
  async fetch() { return window.fetch("/api/proxmox").then(r => r.json()); },
});
