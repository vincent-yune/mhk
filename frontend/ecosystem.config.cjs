module.exports = {
  apps: [
    {
      name: 'myhouse-frontend',
      script: 'node',
      args: 'server.mjs',
      cwd: '/home/user/webapp/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
