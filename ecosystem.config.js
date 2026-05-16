module.exports = {
  apps: [
    {
      name: "prestige-assets",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/root/prestige-assets",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
