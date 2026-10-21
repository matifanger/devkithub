/* Build and exercise the real renamer, preload and UI in an isolated Electron profile.
 * Run: node scripts/verify-renamer.cjs
 * No real user folders, credentials, settings, shortcuts or AI services are used.
 */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const { pathToFileURL } = require("url");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "out", "renamer-verification");

if (!process.versions.electron) {
  require("ts-node").register({ transpileOnly: true });
  const webpack = require("webpack");
  const { getRules } = require("../webpack.rules.ts");
  const common = {
    mode: "development",
    devtool: false,
    resolve: { extensions: [".js", ".ts", ".tsx", ".json"] },
  };
  const configs = [
    {
      ...common,
      target: "electron-main",
      entry: path.join(root, "src/main/renamer/controller.ts"),
      module: { rules: getRules() },
      output: {
        path: output,
        filename: "controller.js",
        library: { type: "commonjs2" },
      },
    },
    {
      ...common,
      target: "electron-preload",
      entry: path.join(root, "src/preload.ts"),
      module: { rules: getRules() },
      output: { path: output, filename: "preload.js" },
    },
    {
      ...common,
      target: "web",
      node: { __dirname: true },
      entry: path.join(root, "scripts/renamer-verification/renderer.tsx"),
      module: {
        rules: getRules("esnext").filter(
          (rule) => !String(rule.test).includes("node_modules"),
        ),
      },
      output: { path: output, filename: "renderer.js" },
    },
  ];
  webpack(configs, (error, stats) => {
    if (error || stats.hasErrors()) {
      console.error(error || stats.toString({ all: false, errors: true }));
      process.exitCode = 1;
      return;
    }
    fs.writeFileSync(
      path.join(output, "index.html"),
      '<!doctype html><html><head><meta charset="UTF-8"><title>Renamer verification</title></head><body><div id="root"></div><script src="renderer.js"></script></body></html>',
    );
    console.log("Renamer main, preload and renderer bundles compiled.");
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    delete env.NODE_OPTIONS;
    const child = require("child_process").spawn(
      require("electron"),
      [__filename],
      { env, stdio: "inherit", windowsHide: true },
    );
    child.on("exit", (code) => {
      process.exitCode = code || 0;
    });
  });
} else {
  const { app, BrowserWindow, ipcMain } = require("electron");
  const fixture = fs.mkdtempSync(path.join(output, "fixture-"));
  app.setPath("userData", fixture);
  const settings = {};
  ipcMain.handle("get-store", (_event, key) => settings[key] || null);
  ipcMain.handle("set-store", (_event, key, value) => {
    settings[key] = value;
  });
  ipcMain.handle("delete-store", (_event, key) => {
    delete settings[key];
  });
  const errors = [];
  let service;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function until(probe) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await probe()) return;
      await delay(50);
    }
    throw new Error("Timed out waiting for the renamer UI.");
  }
  app.whenReady().then(async () => {
    try {
      const page = pathToFileURL(path.join(output, "index.html")).href;
      service = await require(
        path.join(output, "controller.js"),
      ).registerRenamer(page);
      const window = new BrowserWindow({
        show: false,
        width: 1400,
        height: 1000,
        webPreferences: {
          preload: path.join(output, "preload.js"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          offscreen: true,
          backgroundThrottling: false,
        },
      });
      window.webContents.on("console-message", (_event, level, message) => {
        if (level >= 3) {
          errors.push(message);
          console.error("Renderer:", message);
        }
      });
      window.webContents.on("preload-error", (_event, _file, error) =>
        console.error("Preload:", error),
      );
      await window.loadURL(page);
      const js = (code) => window.webContents.executeJavaScript(code);
      const click = (label) =>
        js(
          `Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(label)}).click()`,
        );
      await until(() =>
        js(
          "document.querySelector('h1')?.textContent === 'Smart File Renamer'",
        ),
      );
      // Exercise PDF extraction and native canvas through the bundled runtime.
      const canvas = require("@napi-rs/canvas").createCanvas(300, 200);
      const context = canvas.getContext("2d");
      context.fillStyle = "white";
      context.fillRect(0, 0, 300, 200);
      context.fillStyle = "black";
      context.font = "24px sans-serif";
      context.fillText("Invoice EUR 42.00", 20, 70);
      const scanImage = canvas.toBuffer("image/jpeg");
      const pdfStream = "q 300 0 0 200 0 0 cm /Scan Do Q";
      const pdf = Buffer.concat([
        Buffer.from(
          `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /XObject << /Scan 5 0 R >> >> /Contents 4 0 R >> endobj\n4 0 obj << /Length ${pdfStream.length} >> stream\n${pdfStream}\nendstream endobj\n5 0 obj << /Type /XObject /Subtype /Image /Width 300 /Height 200 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${scanImage.length} >> stream\n`,
        ),
        scanImage,
        Buffer.from("\nendstream endobj\ntrailer << /Root 1 0 R >>\n%%EOF"),
      ]);
      const scanned = path.join(fixture, "scan.pdf");
      fs.writeFileSync(scanned, pdf);
      // A fixture localhost model server verifies OCR rendering without downloading models.
      let receivedImages = false;
      const server = require("http").createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        receivedImages = body.messages.some(
          (message) => message.images?.length > 0,
        );
        response.setHeader("Content-Type", "application/json");
        response.end(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                fields: { title: "Scanned document" },
                confidence: 0.95,
              }),
            },
          }),
        );
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const initial = await js("window.smartRenamer.snapshot()");
      const config = {
        ...initial.settings,
        provider: "ollama",
        endpoint: `http://127.0.0.1:${server.address().port}`,
        model: "fixture-vision",
      };
      await js(`window.smartRenamer.configure(${JSON.stringify(config)})`);
      let state = await js(
        `window.smartRenamer.add(${JSON.stringify([scanned])})`,
      );
      state = await js(
        `window.smartRenamer.analyze(${JSON.stringify(state.items.map((item) => item.id))})`,
      );
      server.close();
      assert.equal(state.items[0].status, "ready", state.items[0].message);
      assert.equal(
        receivedImages,
        true,
        "Scanned PDF must be rendered and sent to the local vision endpoint",
      );
      await js("window.smartRenamer.clear()");
      // Use metadata mode for deterministic end-to-end UI renaming and undo.
      const local = { ...initial.settings, activePreset: "archive" };
      await js(`window.smartRenamer.configure(${JSON.stringify(local)})`);
      const files = [
        "Project Notes.txt",
        "Invoice.txt",
        "Invoice Copy.txt",
      ].map((name) => path.join(fixture, name));
      files.forEach((file, index) =>
        fs.writeFileSync(
          file,
          index === 0
            ? "Project release notes and client handoff."
            : "Acme invoice. Total EUR 42.00.",
        ),
      );
      await js(`window.smartRenamer.add(${JSON.stringify(files)})`);
      await new Promise((resolve) => {
        window.webContents.once("did-finish-load", resolve);
        window.reload();
      });
      await until(() =>
        js("document.querySelectorAll('article').length === 3"),
      );
      await click("Analyze files");
      await until(() =>
        js(
          "Array.from(document.querySelectorAll('article')).every(article => article.textContent.includes('ready'))",
        ),
      );
      await until(
        async () => !(await js("window.smartRenamer.snapshot()")).busy,
      );
      await delay(150);
      await js(
        "document.querySelector('input[aria-label=\"Select all visible files\"]').click()",
      );
      await delay(150);
      fs.writeFileSync(
        path.join(output, "preview.png"),
        (await window.webContents.capturePage()).toPNG(),
      );
      await click("Apply selected (3)");
      assert.equal(await js("!!document.querySelector('[role=dialog]')"), true);
      await click("Apply changes");
      await until(async () =>
        (await js("window.smartRenamer.snapshot()")).items.every(
          (item) => item.status === "done",
        ),
      );
      state = await js("window.smartRenamer.snapshot()");
      assert.equal(state.history.length, 3);
      assert.equal(
        files.some((file) => fs.existsSync(file)),
        false,
      );
      await click("History");
      await click("Undo");
      await until(async () =>
        (await js("window.smartRenamer.snapshot()")).history.some(
          (entry) => entry.status === "undone",
        ),
      );
      await click("Duplicates");
      await click("Compare files");
      await until(() =>
        js("document.body.textContent.includes('2 identical files')"),
      );
      await click("Library");
      await delay(150);
      fs.writeFileSync(
        path.join(output, "library.png"),
        (await window.webContents.capturePage()).toPNG(),
      );
      for (const tab of ["Presets", "Rules", "Watch folders", "Settings"]) {
        await click(tab);
        await delay(80);
        assert.equal(await js("!!document.querySelector('h1')"), true);
      }
      await click("Library");
      window.setSize(700, 900);
      await delay(150);
      assert.equal(
        await js("document.documentElement.scrollWidth <= window.innerWidth"),
        true,
        "Small-window layout must not overflow horizontally",
      );
      fs.writeFileSync(
        path.join(output, "narrow.png"),
        (await window.webContents.capturePage()).toPNG(),
      );
      assert.deepEqual(errors, []);
      console.log(
        "PASS: Electron IPC, PDF vision rendering, analyze, review, rename, undo, exact duplicates, seven tabs and narrow layout.",
      );
      console.log(
        `Screenshots: ${path.join(output, "library.png")} and narrow.png`,
      );
      service.dispose();
      window.destroy();
      app.exit(0);
    } catch (error) {
      console.error(error);
      service?.dispose();
      app.exit(1);
    }
  });
}
