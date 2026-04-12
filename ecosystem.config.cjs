module.exports = {
  apps: [
    {
      name: "my-glance",
      script: "server.js",
      cwd: "/Users/robintehofstee/Documents/my-glance",
      restart_delay: 5000,
      min_uptime: "10s",
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
      },
    },
  ],
};
