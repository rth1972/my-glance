MyGlance.registerWidget("gitea-activity", {
  refresh: 0,
  _tab: "repos",
  css: `
    .git-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border); }
    .git-tab { font-size: 10px; font-family: var(--mono); color: var(--muted); padding: 4px 10px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; text-transform: uppercase; letter-spacing: .08em; transition: color .15s; }
    .git-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .git-tab:hover:not(.active) { color: var(--text); }
    .git-panel { display: none; }
    .git-panel.active { display: block; }
    .git-event-list { display: flex; flex-direction: column; gap: 5px; }
    .git-event { display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px; background: var(--surface2); border-radius: 4px; }
    .git-event-icon { font-size: 12px; flex-shrink: 0; margin-top: 1px; }
    .git-event-body { min-width: 0; flex: 1; }
    .git-event-desc { font-size: 11px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .git-event-time { font-size: 10px; font-family: var(--mono); color: var(--muted); margin-top: 1px; }
    .git-repo-list { display: flex; flex-direction: column; gap: 5px; }
    .git-repo { display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--surface2); border-radius: 4px; text-decoration: none; }
    .git-repo:hover { background: var(--border); }
    .git-repo-name { font-size: 12px; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .git-repo-lang { font-size: 9px; font-family: var(--mono); color: var(--muted); background: var(--border); padding: 1px 5px; border-radius: 3px; }
    .git-repo-stars { font-size: 10px; font-family: var(--mono); color: var(--muted); }
    .git-error { color: var(--red); font-size: 11px; }
  `,
  render(container, data) {
    const body = MyGlance.ensureCard(container, "Gitea");
    if (!data) return;
    if (data.error) { MyGlance.patch(body, `<div class="git-error">${data.error}</div>`); return; }

    const icons = { PushEvent:"⬆", CreateEvent:"✦", DeleteEvent:"✕", IssuesEvent:"◎", PullRequestEvent:"⇄", IssueCommentEvent:"◌" };

    const eventsHTML = data.events.length
      ? data.events.map(e => `
          <div class="git-event">
            <span class="git-event-icon">${icons[e.type] || "·"}</span>
            <div class="git-event-body">
              <div class="git-event-desc">${e.desc}</div>
              <div class="git-event-time">${MyGlance.timeAgo(e.created)}</div>
            </div>
          </div>`).join("")
      : `<span style="color:var(--muted);font-size:11px">No recent activity</span>`;

    const reposHTML = data.repos.length
      ? data.repos.map(r => `
          <a class="git-repo" href="${r.url}" target="_blank" rel="noopener">
            ${r.private ? '<span style="font-size:9px;color:var(--muted)">🔒</span>' : ""}
            <span class="git-repo-name">${r.full}</span>
            ${r.lang ? `<span class="git-repo-lang">${r.lang}</span>` : ""}
            ${r.stars ? `<span class="git-repo-stars">★ ${r.stars}</span>` : ""}
          </a>`).join("")
      : `<span style="color:var(--muted);font-size:11px">No repositories</span>`;

    const self = this;
    MyGlance.patch(body, `
      <div class="git-tabs">
        <div class="git-tab ${self._tab === "activity" ? "active" : ""}" data-tab="activity">Activity</div>
        <div class="git-tab ${self._tab === "repos" ? "active" : ""}" data-tab="repos">Repos</div>
      </div>
      <div class="git-panel ${self._tab === "activity" ? "active" : ""}" data-panel="activity">
        <div class="git-event-list">${eventsHTML}</div>
      </div>
      <div class="git-panel ${self._tab === "repos" ? "active" : ""}" data-panel="repos">
        <div class="git-repo-list">${reposHTML}</div>
      </div>
    `);

    body.querySelectorAll(".git-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        self._tab = tab.dataset.tab;
        body.querySelectorAll(".git-tab").forEach(t => t.classList.toggle("active", t === tab));
        body.querySelectorAll(".git-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === self._tab));
      });
    });
  },
  async fetch() { return window.fetch("/api/gitea").then(r => r.json()); },
});

MyGlance.onWsEvent("gitea-activity", (data) => {
  const def = MyGlance._widgets["gitea-activity"];
  if (!def) return;
  document.querySelectorAll(`[data-widget-type="gitea-activity"]`).forEach(el => {
    def.render.call(def, el, data);
  });
});
