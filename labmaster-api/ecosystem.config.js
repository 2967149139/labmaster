module.exports = {
  apps: [{
    name: 'labmaster-api',
    script: 'server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 自动重启配置
    max_memory_restart: '500M',
    max_restarts: 10,
    restart_delay: 5000,
    // 日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true
  }]
};
