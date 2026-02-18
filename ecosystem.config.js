module.exports = {
  apps: [{
    name: 'sms-nepal',
    script: './dist/main.js',
    instances: 2,  // Use 2 instances for Nepal school traffic
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      TZ: 'Asia/Kathmandu'  // Critical for Nepal time
    },
    error_file: '/var/log/sms-nepal.err.log',
    out_file: '/var/log/sms-nepal.out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Nepal-specific health check
    health_check: {
      path: '/health',
      interval: 30000,
      timeout: 5000,
      window: 120000,
      consecutive_failures: 3
    }
  }]
};
