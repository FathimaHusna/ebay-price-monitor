module.exports = {
  apps: [
    {
      name: 'ebay-monitor-backend',
      script: 'app.js',
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

