const { execFile } = require("child_process");

function curlJSON(url, token, timeout = 8) {
  return new Promise((resolve, reject) => {
    const args = [
      // "--interface", "en1", <--- If you remove this, ensure no commas are left hanging
      "--insecure", 
      "--silent",
      "--location",
      "--max-time", String(timeout),
      "--write-out", "\n%{http_code}",
      "--header", "Accept: application/json",
      ...(token ? ["--header", `Authorization: token ${token}`] : []),
      url, // The URL must be the last argument
    ];

    // Ensure this line has all 3 arguments: command, args, and the callback
    execFile("curl", args, { timeout: (timeout + 1) * 1000 }, (err, stdout) => {
      if (err) return reject(new Error(err.message));
      
      const lines = stdout.trim().split("\n");
      const status = parseInt(lines[lines.length - 1], 10);
      const body = lines.slice(0, -1).join("\n");

      if (status < 200 || status >= 400) {
        // Log the body so we can see WHY Gitea is sending a 422
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
  app.get("/api/gitea", async (req, res) => {
    const { url, token, user, limit = 100 } = config.gitea || {};
    if (!url || !user)
      return res.status(500).json({ error: "Gitea not configured. Add gitea: { url, user, token } to config.js" });

    try {
      const base = `${url}/api/v1`;

      const [repos, events] = await Promise.all([
  // Fixed sort mode from 'newest' to 'updated'
  curlJSON(`${base}/repos/search?limit=50&sort=updated`, token),
  
  // Wrap this in a try/catch or check the user variable
  curlJSON(`${base}/users/${encodeURIComponent(user)}/events?limit=${limit}`, token).catch(e => {
    console.error("Events fetch failed, Gitea might not support this endpoint version:", e.message);
    return []; // Return empty array so the whole page doesn't crash
  }),
]);

      const repoList = (repos.data || [])
        .filter(r => !r.fork)
        .slice(0, 5)
        .map(r => ({
          name:    r.name,
          full:    r.full_name,
          url:     r.html_url,
          stars:   r.stars_count,
          updated: r.updated,
          lang:    r.language || null,
          private: r.private,
        }));

      const eventList = (events || []).slice(0, limit).map(e => {
        let desc = "";
        const repo = e.repo?.name || "";
        if      (e.type === "PushEvent")          desc = `Pushed ${(e.payload?.commits || []).length || ""} commit(s) to ${repo}`.replace("0 commit(s)", "to " + repo);
        else if (e.type === "CreateEvent")        desc = `Created ${e.payload?.ref_type || "ref"} in ${repo}`;
        else if (e.type === "IssuesEvent")        desc = `${e.payload?.action || "Updated"} issue in ${repo}`;
        else if (e.type === "PullRequestEvent")   desc = `${e.payload?.action || "Updated"} PR in ${repo}`;
        else if (e.type === "IssueCommentEvent")  desc = `Commented on issue in ${repo}`;
        else if (e.type === "DeleteEvent")        desc = `Deleted ${e.payload?.ref_type || "ref"} in ${repo}`;
        else                                       desc = `${e.type.replace("Event", "")} in ${repo}`;
        return { type: e.type, desc, repo, created: e.created };
      });

      res.json({ repos: repoList, events: eventList, user, giteaUrl: url });
    } catch (e) {
      console.error("[gitea]", e.message);
      res.status(500).json({ error: e.message });
    }
  });
};
