// PM2 ile kasa bilgisayarında sunucuyu sürekli çalıştırma.
// Kurulum:  npm install -g pm2
// Başlatma: pm2 start ecosystem.config.cjs   →   pm2 save
const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'toscana',
      cwd: path.join(__dirname, 'server'),
      script: path.join(__dirname, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      args: 'src/index.ts',
      interpreter: 'node',
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 100,
      time: true,
    },
  ],
};
