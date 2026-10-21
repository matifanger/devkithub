/* Run with Electron. Uses a temporary profile and only captures its own test window. */
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.NODE_OPTIONS; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow, protocol, clipboard, dialog, globalShortcut, desktopCapturer } = require('electron');
// Keep both UI fixtures and screenshots free of the user's desktop content.
desktopCapturer.getSources = async () => [];
globalShortcut.register = () => true;
globalShortcut.unregister = () => {};
const path = require('path'), fs = require('fs'), os = require('os'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
process.chdir(root);
require('ts-node').register({ transpileOnly: true, project: path.join(root, 'tsconfig.json') });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'devkithub-capture-smoke-'));
app.setPath('userData', profile);
app.getAppPath = () => root;
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');
protocol.registerSchemesAsPrivileged([{ scheme: 'capture-media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let win;
const evaluate = code => win.webContents.executeJavaScript(code, true);
async function until(code, ms = 15000) { const deadline = Date.now() + ms; while (Date.now() < deadline) { if (await evaluate(code)) return; await sleep(100); } throw new Error(`Timed out: ${code}`); }
async function click(label) { await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`); await sleep(150); }
async function screenshot(name) { win.showInactive(); win.webContents.invalidate(); await sleep(500); fs.writeFileSync(path.join(root, 'test-results/capture', name), (await win.webContents.capturePage()).toPNG()); win.hide(); }
async function main() {
  await app.whenReady();
  const { registerCaptureStudio } = require('../src/main/capture/index.ts');
  await registerCaptureStudio(() => win);
  win = new BrowserWindow({ width: 1440, height: 1100, show: false, webPreferences: { preload: path.join(root, '.capture-smoke/preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false } });
  win.webContents.on('console-message', (_, level, message) => { if (level >= 3) console.error('Renderer:', message); });
  await win.loadFile(path.join(root, '.capture-smoke/index.html'));
  await until('!!window.captureTest && !!window.captureStudio');
  await click('Try a sample'); await until('document.querySelector("canvas")?.width > 0');
  const pixels = await evaluate(`(async()=>{const t=window.captureTest; const input=document.createElement('canvas');input.width=200;input.height=120;const ctx=input.getContext('2d');ctx.fillStyle='#ff0000';ctx.fillRect(0,0,200,120);const img=await t.loadImage(input.toDataURL());const out=document.createElement('canvas');t.renderShot(out,img,{...t.DEFAULT_SHOT_STYLE,padding:0,radius:0,shadow:0,background:'transparent'},[{kind:'redact',x:20,y:20,x2:80,y2:80,color:'#fff',size:4}],null);return {redacted:Array.from(out.getContext('2d').getImageData(30,30,1,1).data),outside:Array.from(out.getContext('2d').getImageData(100,30,1,1).data)}})()`);
  assert.deepEqual(pixels.redacted, [17,24,39,255]); assert.deepEqual(pixels.outside, [255,0,0,255]);
  await click('Save to library'); await until('document.body.textContent.includes("Saved to Capture Library")');
  const initial = await evaluate('window.captureStudio.list()'); assert.equal(initial.length, 1); assert.equal(initial[0].width, 1088);
  let copiedImage;
  const writeImage = clipboard.writeImage;
  clipboard.writeImage = image => { copiedImage = image; };
  try { await evaluate(`window.captureStudio.copyImage('${initial[0].id}')`); assert.ok(copiedImage && !copiedImage.isEmpty()); }
  finally { clipboard.writeImage = writeImage; }
  const imageLoaded = await evaluate(`new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i.naturalWidth);i.onerror=()=>resolve(0);i.src='${initial[0].url}'})`); assert.equal(imageLoaded, 1088);
  const reedited = await evaluate(`(async()=>{const t=window.captureTest;const image=await t.loadImage('${initial[0].url}');const c=document.createElement('canvas');t.renderShot(c,image,t.DEFAULT_SHOT_STYLE,[],null);return (await t.canvasBlob(c)).size;})()`); assert.ok(reedited > 1000, 'Library images remain exportable after editing');
  fs.mkdirSync(path.join(root, 'test-results/capture'), { recursive: true });
  await screenshot('screenshot-studio.png');
  const source = new BrowserWindow({ title: 'DevKitHub synthetic capture target', width: 640, height: 480, show: false, webPreferences: { backgroundThrottling: false } });
  await source.loadURL('data:text/html,<html><body style="background:%230f172a;color:white;font:40px sans-serif"><h1>Capture test</h1><p id="clock">Frame</p><script>setInterval(()=>document.getElementById("clock").textContent=Date.now(),50)</script></body></html>');
  desktopCapturer.getSources = async () => [{ id: source.getMediaSourceId(), name: 'Demo window', thumbnail: await source.webContents.capturePage() }];
  // Electron excludes its own windows from enumeration; its native media ID is
  // still a valid explicit source, so no user window or display is recorded.
  source.showInactive(); await sleep(400);
  const target = { id: source.getMediaSourceId() };
  await evaluate(`window.captureTest.captureRecorder.start({source:'${target.id}',fps:15,microphone:true,systemAudio:false,camera:true,delay:0,quality:3,crop:null})`);
  await until('window.captureTest.captureRecorder.snapshot().phase === "recording"');
  await sleep(1100); await evaluate('window.captureTest.captureRecorder.pause()');
  const paused = await evaluate('window.captureTest.captureRecorder.snapshot().seconds');
  await sleep(600); const pausedAgain = await evaluate('window.captureTest.captureRecorder.snapshot().seconds'); assert.equal(paused, pausedAgain);
  await evaluate('window.location.hash="/screen-recorder"'); await until('document.querySelector("h1")?.textContent === "Screen Recorder"'); await screenshot('screen-recorder.png');
  await evaluate('window.location.hash="/capture-library"'); await sleep(150); assert.equal(await evaluate('window.captureTest.captureRecorder.snapshot().phase'), 'paused');
  await evaluate('window.captureTest.captureRecorder.pause()'); await sleep(1100); await evaluate('window.captureTest.captureRecorder.stop()');
  await until('window.captureTest.captureRecorder.snapshot().phase === "idle"');
  const recorded = await evaluate('window.captureTest.captureRecorder.snapshot()'); assert.ok(recorded.asset, recorded.error); assert.ok(recorded.asset.size > 1000); assert.ok(recorded.asset.duration < 3, 'Pause time is excluded');
  source.destroy();
  desktopCapturer.getSources = async () => [];
  const options = { start: 0, end: Math.min(2, recorded.asset.duration), width: 640, height: 480, fps: 15, speed: 1, mute: false, volume: 0.8, padding: 16, background: '#123456', zoom: { start: 0.2, end: 1.5, scale: 1.7, x: 0.6, y: 0.4 } };
  for (const format of ['mp4', 'webm', 'gif']) {
    const asset = await evaluate(`window.captureStudio.exportVideo('${recorded.asset.id}', ${JSON.stringify({ ...options, format })})`);
    assert.ok(asset.size > 1000, `${format} produced encoded content`);
    const bytes = fs.readFileSync(path.join(profile, 'captures', `${asset.id}.${format}`));
    if (format === 'mp4') assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
    if (format === 'gif') assert.ok(bytes.toString('ascii', 0, 6).startsWith('GIF8'));
    console.log(`PASS real ${format} export: ${asset.size} bytes`);
  }
  const countBeforeCancel = (await evaluate('window.captureStudio.list()')).length;
  await evaluate(`window.cancelTestResult=null;window.captureStudio.exportVideo('${recorded.asset.id}', ${JSON.stringify({ ...options, format: 'webm', width: 3840, height: 2880, fps: 60 })}).then(()=>window.cancelTestResult='unexpected-success',e=>window.cancelTestResult=e.message);void 0`);
  await sleep(150); await evaluate('window.captureStudio.cancelExport()');
  await until('window.cancelTestResult !== null'); assert.match(await evaluate('window.cancelTestResult'), /canceled/);
  assert.equal((await evaluate('window.captureStudio.list()')).length, countBeforeCancel);
  console.log('PASS canceled export does not appear in the library');
  await evaluate(`window.location.hash='/video-editor?asset=${recorded.asset.id}'`); await until('document.querySelector("video")?.videoWidth > 0'); await sleep(400);
  assert.equal(await evaluate('document.querySelector("h1").textContent'), 'Video Editor');
  await screenshot('video-editor.png');
  await click('Extract frame'); await until('document.querySelector("h1")?.textContent === "Screenshot Studio" && document.querySelector("canvas")?.width > 0');
  const frame = (await evaluate('window.captureStudio.list()'))[0]; assert.equal(frame.kind, 'image'); await evaluate(`window.captureStudio.remove('${frame.id}')`);
  await evaluate("window.location.hash='/capture-library'"); await until('document.querySelector("h1")?.textContent === "Capture Library"'); await sleep(300); await screenshot('capture-library.png');
  const saved = path.join(profile, 'download.png'); dialog.showSaveDialog = async () => ({ canceled: false, filePath: saved });
  await evaluate(`window.captureStudio.download('${initial[0].id}')`); assert.ok(fs.statSync(saved).size > 1000);
  await evaluate(`window.captureStudio.remove('${initial[0].id}')`); assert.equal((await evaluate('window.captureStudio.list()')).length, 4);
  await win.reload(); await until('!!window.captureStudio'); assert.equal((await evaluate('window.captureStudio.list()')).length, 4);
  console.log('PASS capture rendering, opaque redaction, clipboard bridge, media protocol, re-editing, recording with webcam/mic, pause, route change, disk persistence, export formats, cancellation, frame extraction, download and deletion.');
  console.log(`Test profile: ${profile}`);
  app.exit(0);
}
main().catch(error => { console.error(error); app.exit(1); });
