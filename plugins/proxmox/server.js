const { execFile } = require("child_process");

function pveGet(url, tokenid, secret, path) {
  return new Promise((resolve, reject) => {
    const args = [
      "--interface", "en1",
      "--insecure", "--silent",
      "--max-time", "8",
      "--write-out", "\n%{http_code}",
      "--header", "Accept: application/json",
      "--header", `Authorization: PVEAPIToken=${tokenid}=${secret}`,
      `${url}/api2/json${path}`,
    ];
    execFile("curl", args, { timeout: 9000 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      const lines = stdout.trim().split("\n");
      const status = parseInt(lines[lines.length - 1], 10);
      const body = lines.slice(0, -1).join("\n");
      if (status < 200 || status >= 400) return reject(new Error(`HTTP ${status}`));
      try { resolve(JSON.parse(body).data); }
      catch (e) { reject(new Error("Invalid JSON")); }
    });
  });
}

module.exports = function register(app, config) {
  const broadcast = app.get("broadcast");

  async function fetchProxmox() {
    const { url, tokenid, secret, node = "pve" } = config.proxmox || {};
    if (!url || !tokenid || !secret) return;

    try {
      const [nodeStatus, storageList, vms, containers] = await Promise.all([
        pveGet(url, tokenid, secret, `/nodes/${node}/status`),
        pveGet(url, tokenid, secret, `/nodes/${node}/storage`),
        pveGet(url, tokenid, secret, `/nodes/${node}/qemu`),
        pveGet(url, tokenid, secret, `/nodes/${node}/lxc`),
      ]);

      const cpuPct   = Math.round((nodeStatus.cpu || 0) * 100);
      const memUsed  = nodeStatus.memory?.used  || 0;
      const memTotal = nodeStatus.memory?.total || 1;
      const memPct   = Math.round((memUsed / memTotal) * 100);
      const uptime   = nodeStatus.uptime || 0;

      const disks = (storageList || [])
        .filter(s => s.active && s.total > 0)
        .map(s => ({
          name:  s.storage,
          used:  s.used  || 0,
          total: s.total || 1,
          pct:   Math.round(((s.used || 0) / s.total) * 100),
        }));

      const allVMs = [
        ...(vms        || []).map(v => ({ ...v, type: "vm" })),
        ...(containers || []).map(c => ({ ...c, type: "ct" })),
      ].map(v => ({ id: v.vmid, name: v.name, status: v.status, type: v.type }))
       .sort((a, b) => a.id - b.id);

      broadcast("proxmox", { cpuPct, memPct, memUsed, memTotal, uptime, disks, vms: allVMs, node });
    } catch (e) {
      console.error("[proxmox]", e.message);
      broadcast("proxmox", { error: e.message });
    }
  }

  fetchProxmox();
  setInterval(fetchProxmox, 10_000);

  app.get("/api/proxmox", async (req, res) => {
    const { url, tokenid, secret, node = "pve" } = config.proxmox || {};
    if (!url || !tokenid || !secret)
      return res.status(500).json({ error: "Proxmox not configured. Add proxmox: { url, tokenid, secret } to config.js" });

    try {
      const [nodeStatus, storageList, vms, containers] = await Promise.all([
        pveGet(url, tokenid, secret, `/nodes/${node}/status`),
        pveGet(url, tokenid, secret, `/nodes/${node}/storage`),
        pveGet(url, tokenid, secret, `/nodes/${node}/qemu`),
        pveGet(url, tokenid, secret, `/nodes/${node}/lxc`),
      ]);

      const cpuPct   = Math.round((nodeStatus.cpu || 0) * 100);
      const memUsed  = nodeStatus.memory?.used  || 0;
      const memTotal = nodeStatus.memory?.total || 1;
      const memPct   = Math.round((memUsed / memTotal) * 100);
      const uptime   = nodeStatus.uptime || 0;

      const disks = (storageList || [])
        .filter(s => s.active && s.total > 0)
        .map(s => ({
          name:  s.storage,
          used:  s.used  || 0,
          total: s.total || 1,
          pct:   Math.round(((s.used || 0) / s.total) * 100),
        }));

      const allVMs = [
        ...(vms        || []).map(v => ({ ...v, type: "vm" })),
        ...(containers || []).map(c => ({ ...c, type: "ct" })),
      ].map(v => ({ id: v.vmid, name: v.name, status: v.status, type: v.type }))
       .sort((a, b) => a.id - b.id);

      res.json({ cpuPct, memPct, memUsed, memTotal, uptime, disks, vms: allVMs, node });
    } catch (e) {
      console.error("[proxmox]", e.message);
      res.status(500).json({ error: e.message });
    }
  });
};
