/* Build and exercise the real maintenance page, preload bridge and IPC in an
 * isolated, hidden Electron window. Never modify real cleanup/startup entries.
 * Run: node scripts/verify-maintenance.cjs
 */
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const ts = require("typescript");
const { spawn } = require("child_process");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "out", "maintenance-qa");
fs.mkdirSync(output, { recursive: true });
const source = ts.createSourceFile(
  "preload.ts",
  fs.readFileSync(path.join(root, "src/preload.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
let bridge;
function find(node) {
  if (
    ts.isPropertyAssignment(node) &&
    node.name.getText(source) === "maintenance"
  )
    bridge = node.initializer.getText(source);
  ts.forEachChild(node, find);
}
find(source);
if (!bridge) throw new Error("Production maintenance bridge not found");
fs.writeFileSync(
  path.join(output, "preload.ts"),
  `import { contextBridge, ipcRenderer } from "electron"; contextBridge.exposeInMainWorld("electron", { maintenance: ${bridge} });`,
);
fs.writeFileSync(
  path.join(output, "renderer.tsx"),
  `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import {PcMaintenancePage} from ${JSON.stringify(path.join(root, "src/pages/pc-maintenance"))};
import {predefinedThemes} from ${JSON.stringify(path.join(root, "src/utils/themes"))};
import ${JSON.stringify(path.join(root, "src/index.css"))};
window.qaTheme = (mode) => { document.documentElement.className = mode; Object.entries(predefinedThemes.find(t => t.id === 'blue-ocean').cssVariables[mode]).forEach(([key,value]) => document.documentElement.style.setProperty(key,value)); };
window.qaTheme('dark');
createRoot(document.getElementById('root')).render(<HashRouter><PcMaintenancePage /></HashRouter>);
`,
);
fs.writeFileSync(
  path.join(output, "index.html"),
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maintenance verification</title></head><body><div id="root"></div><script src="renderer.js"></script></body></html>',
);
fs.writeFileSync(
  path.join(output, "main.cjs"),
  `
const {app, BrowserWindow, dialog, session} = require('electron');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const {registerMaintenanceIpc} = require(${JSON.stringify(path.join(root, "src/main/maintenance/ipc.ts"))});
const output = ${JSON.stringify(output)};
const fixture = fs.mkdtempSync(path.join(output, 'fixture-'));
app.setPath('userData', path.join(fixture, 'profile'));
const scanRoot = path.join(fixture, 'scan');
fs.mkdirSync(path.join(scanRoot, 'Projects'), {recursive:true});
fs.mkdirSync(path.join(scanRoot, 'Downloads'), {recursive:true});
fs.writeFileSync(path.join(scanRoot, 'Projects', 'build.zip'), Buffer.alloc(1024 * 1024));
fs.writeFileSync(path.join(scanRoot, 'Downloads', 'sample.txt'), 'fixture');
dialog.showOpenDialog = async () => ({canceled:false,filePaths:[scanRoot]});
dialog.showMessageBox = async () => ({response:0});
let win;
const errors=[];
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const js = text => win.webContents.executeJavaScript(text);
async function until(text, timeout=30000) {
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline) { if(await js(text)) return; await sleep(100); }
  throw new Error('Timed out: '+text);
}
async function click(text) {
  await js('Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === '+JSON.stringify(text)+').click()');
}
app.whenReady().then(async()=>{
  session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']}, (_details,callback)=>callback({cancel:true}));
  win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{preload:path.join(output,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false,backgroundThrottling:false}});
  win.webContents.on('console-message',(_event,level,message)=>{if(level===3)errors.push(message)});
  registerMaintenanceIpc(()=>win,require('url').pathToFileURL(path.join(output,'index.html')).href);
  await win.loadFile(path.join(output,'index.html'));
  await until('document.body.innerText.includes("Your drives")');
  fs.writeFileSync(path.join(output,'overview-dark.png'),(await win.webContents.capturePage()).toPNG());
  await click('Disk space'); await click('Choose folder');
  await until('document.body.innerText.includes("Projects") && !document.body.innerText.includes("Analyzing folder")');
  assert(await js('document.body.innerText.includes("1 MB")'),'Real disk bytes not displayed');
  fs.writeFileSync(path.join(output,'disk-dark.png'),(await win.webContents.capturePage()).toPNG());
  await click('Largest files');
  await until('document.body.innerText.includes("build.zip")');
  await click('Temporary files');
  assert(await js('document.body.innerText.includes("Nothing is deleted during the scan")'));
  fs.writeFileSync(path.join(output,'cleanup-dark.png'),(await win.webContents.capturePage()).toPNG());
  await click('Startup apps'); await click('Load startup apps');
  await until('document.body.innerText.toLowerCase().includes("manageable") && !document.body.innerText.includes("Reading startup apps")');
  assert(await js('document.body.innerText.includes("Registered")'));
  await click('Overview');
  await js('window.qaTheme("light")');
  await until('document.querySelector("button[aria-current=page]").textContent.includes("Overview") && document.documentElement.className === "light"');
  await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  await sleep(200);
  fs.writeFileSync(path.join(output,'overview-light.png'),(await win.webContents.capturePage()).toPNG());
  win.setSize(650,760); await sleep(200);
  assert(await js('document.documentElement.scrollWidth <= window.innerWidth'),'Horizontal overflow at minimum window width');
  fs.writeFileSync(path.join(output,'overview-narrow.png'),(await win.webContents.capturePage()).toPNG());
  assert.deepEqual(errors,[]);
  assert(fs.existsSync(path.join(scanRoot,'Projects','build.zip')));
  console.log(JSON.stringify({ok:true,checks:['real preload/IPC','real directory scan','largest files','cleanup empty state','Windows startup inventory','dark/light/narrow layout','no renderer errors'],screenshots:output}));
  app.exit(0);
}).catch(error=>{console.error(error);app.exit(1)});
setTimeout(()=>{console.error('Verification timed out');app.exit(1)},90000).unref();
`,
);
function config(name, target, entry) {
  return {
    name,
    mode: "development",
    devtool: false,
    context: root,
    target,
    entry: path.join(output, entry),
    output: { path: output, filename: `${name}.js` },
    resolve: { extensions: [".tsx", ".ts", ".js", ".cjs"] },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: { module: "commonjs" },
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        { test: /\.(woff2?|ttf|otf)$/, type: "asset/resource" },
      ],
    },
  };
}
const compiler = webpack([
  config("renderer", "web", "renderer.tsx"),
  config("preload", "electron-preload", "preload.ts"),
  config("main", "electron-main", "main.cjs"),
]);
compiler.run((error, stats) => {
  compiler.close(() => {});
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({ all: false, errors: true }));
    process.exitCode = 1;
    return;
  }
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.NODE_OPTIONS;
  const child = spawn(require("electron"), [path.join(output, "main.js")], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
});
