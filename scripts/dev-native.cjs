const { api } = require('@electron-forge/core');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const path = require('node:path');

process.chdir(path.resolve(__dirname, '..'));
// Forge owns the native app's renderer server, separate from Docker's web/API.
process.env.NODE_ENV = 'development';
// Host tooling can inject Node-only flags that Electron 25 rejects.
delete process.env.NODE_OPTIONS;
delete process.env.ELECTRON_RUN_AS_NODE;
let electron;
let timer;
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  control.close();
  if (electron) electron.kill();
  else process.exit(0);
};
const control = createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/stop' || request.headers.origin) {
    response.writeHead(404).end(); return;
  }
  response.end('Stopping DevKitHub');
  stop();
});
control.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'DevKitHub development is already running (port 47831).' : error);
  process.exit(1);
});

control.listen(47831, '127.0.0.1', async () => {
  try {
    const args = ['--dev-window'];
    if (process.env.DEVKIT_DEBUG_PORT) args.push(`--remote-debugging-port=${Number(process.env.DEVKIT_DEBUG_PORT)}`);
    const bind = child => {
      electron = child;
      child.on('restarted', bind);
      child.on('exit', code => {
        if (child.restarted) return;
        clearInterval(timer);
        control.close();
        process.exitCode = code || 0;
      });
    };
    bind(await api.start({ dir: process.cwd(), interactive: true, args }));
    console.log('[devkithub] Native Electron started. Renderer reload and main/preload restart enabled.');
    const bundles = ['.webpack/main/index.js', '.webpack/renderer/main_window/preload.js'];
    let previous;
    let candidate;
    let restarting = false;
    timer = setInterval(() => {
      if (stopping || restarting) return;
      try {
        const hash = createHash('sha256');
        for (const file of bundles) hash.update(readFileSync(file));
        const current = hash.digest('hex');
        if (!previous) previous = current;
        else if (current !== previous) {
          if (candidate !== current) { candidate = current; return; }
          previous = current;
          restarting = true;
          console.log('[devkithub] Main/preload rebuilt; restarting native Electron...');
          process.stdin.emit('data', Buffer.from('rs\n'));
          setTimeout(() => { restarting = false; }, 2000);
        }
      } catch { /* Initial compilation or a bundle is being rewritten. */ }
    }, 700);
  } catch (error) {
    console.error(error);
    control.close();
    process.exit(1);
  }
});
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
