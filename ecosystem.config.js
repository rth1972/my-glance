console.log("PM2 DEBUG:", {
  user: process.env.USER,
  node_env: process.env.NODE_ENV,
  statsUrl,
  resolvedIp: await require("dns").promises.lookup(statsUrl.replace("https://", "").replace("http://", "")).catch(e => e.message)
});

module.exports = {
  apps: [
    {
      name: "my-glance",
      script: "server.js",
      cwd: "/Users/robintehofstee/Documents/my-glance",

      // Wait 5 seconds before starting — gives macOS time to bring up the network
      wait_ready: false,
      kill_timeout: 5000,

      // Prevent rapid restart loops (crash backoff)
      restart_delay: 5000,   // wait 5s between restarts
      min_uptime: "10s",     // must stay up 10s to be considered stable
      max_restarts: 10,

      // Pass env var to disable TLS warnings cleanly
      env: {
        NODE_ENV: "production",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      },
    },
  ],
};
