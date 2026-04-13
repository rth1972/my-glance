const { execFile } = require("child_process");

function curlJSON(url, token, timeout = 8) {
  return new Promise((resolve, reject) => {
    const args = [
      "--insecure",
      "--silent",
      "--location",
      "--max-time", String(timeout),
      "--write-out", "\n%{http_code}",
      "--header", "Accept: application/json",
      ...(token ? ["--header", `Authorization: Bearer ${token}`] : []),
      url,
    ];

    execFile("curl", args, { timeout: (timeout + 1) * 1000 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));

      const lines = stdout.trim().split("\n");
      const status = parseInt(lines[lines.length - 1], 10);
      const body = lines.slice(0, -1).join("\n");

      if (status < 200 || status >= 400) {
        console.error(`Gitea API Error (${status}):`, body);
        return reject(new Error(`HTTP ${status}`));
      }

      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

module.exports = function register(app, config) {
  const broadcast = app.get("broadcast");

  function formatEvent(e, repoName) {
    const repo = e.repo?.name || repoName || "";
    if (e.type === "PushEvent") {
      const count = (e.payload?.commits || []).length;
      return count > 0 ? `Pushed ${count} commit(s) to ${repo}` : `Pushed to ${repo}`;
    }
    if (e.type === "CreateEvent") return `Created ${e.payload?.ref_type || "ref"} in ${repo}`;
    if (e.type === "DeleteEvent") return `Deleted ${e.payload?.ref_type || "ref"} in ${repo}`;
    if (e.type === "IssuesEvent") return `${e.payload?.action || "Updated"} issue in ${repo}`;
    if (e.type === "IssueCommentEvent") return `Commented on issue in ${repo}`;
    if (e.type === "PullRequestEvent") return `${e.payload?.action || "Updated"} PR in ${repo}`;
    if (e.type === "ForkEvent") return `Forked ${repo}`;
    if (e.type === "WatchEvent") return `Starred ${repo}`;
    return `${e.type?.replace("Event", "") || e.type} in ${repo}`;
  }

  async function fetchGitea() {
    const { url, token, user, limit = 50 } = config.gitea || {};
    if (!url || !user) return;

    try {
      const base = `${url}/api/v1`;

      const reposData = await curlJSON(`${base}/repos/search?limit=50&sort=updated`, token);
      const repos = (reposData.data || [])
        .filter(r => !r.fork)
        .slice(0, 20)
        .map(r => ({
          name:    r.name,
          full:    r.full_name,
          url:     r.html_url,
          stars:   r.stars_count,
          updated: r.updated,
          lang:    r.language || null,
          private: r.private,
        }));

      let events = [];
      try {
        const eventsData = await curlJSON(`${base}/users/${encodeURIComponent(user)}/events?limit=${limit}`, token);
        events = (eventsData || []).slice(0, limit).map(e => ({
          type: e.type,
          desc: formatEvent(e, e.repo?.name || ""),
          repo: e.repo?.name || "",
          created: e.created_at || e.created,
        }));
      } catch (err) {
        console.warn("[gitea] User events unavailable, skipping...");
      }

      broadcast("gitea-activity", { repos, events, user, giteaUrl: url });
    } catch (e) {
      console.error("[gitea]", e.message);
    }
  }

  fetchGitea();
  setInterval(fetchGitea, 60_000);

  app.get("/api/gitea", async (req, res) => {
    const { url, token, user, limit = 50 } = config.gitea || {};
    if (!url || !user)
      return res.status(500).json({ error: "Gitea not configured" });

    try {
      const base = `${url}/api/v1`;

      const reposData = await curlJSON(`${base}/repos/search?limit=50&sort=updated`, token);
      const repos = (reposData.data || [])
        .filter(r => !r.fork)
        .slice(0, 20)
        .map(r => ({
          name:    r.name,
          full:    r.full_name,
          url:     r.html_url,
          stars:   r.stars_count,
          updated: r.updated,
          lang:    r.language || null,
          private: r.private,
        }));

      let events = [];
      try {
        const eventsData = await curlJSON(`${base}/users/${encodeURIComponent(user)}/events?limit=${limit}`, token);
        events = (eventsData || []).slice(0, limit).map(e => ({
          type: e.type,
          desc: formatEvent(e, e.repo?.name || ""),
          repo: e.repo?.name || "",
          created: e.created_at || e.created,
        }));
      } catch (err) {
        // Events unavailable - will show repos only
      }

      res.json({ repos, events, user, giteaUrl: url });
    } catch (e) {
      console.error("[gitea]", e.message);
      res.status(500).json({ error: e.message });
    }
  });
};
