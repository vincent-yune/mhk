module.exports = {
  apps: [
    {
      name: 'myhouse-backend',
      script: 'java',
      args: '-jar /home/user/webapp/backend/target/myhouse-backend-1.0.0.jar',
      env: {
        JAVA_HOME: '/opt/java/openjdk',
        NODE_ENV: 'development'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '512M'
    }
  ]
}
