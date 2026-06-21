/**
 * capture-screenshots.ts
 *
 * Captures screenshots of all DevKitHub tools by connecting Puppeteer to
 * the Electron Forge renderer dev server (port 3000).
 *
 * Prerequisites:
 *   - npm run start must be running (Electron Forge dev server)
 *   - npm install -D puppeteer
 *
 * Run: npx tsx scripts/capture-screenshots.ts
 *
 * Output: ../frontend/public/screenshots/{slug}.png
 */

import * as fs from "fs";
import * as path from "path";

const DEV_SERVER_URL = "http://localhost:3000/main_window";
const OUTPUT_DIR = path.resolve(__dirname, "../../frontend/public/screenshots");
const VIEWPORT = { width: 1280, height: 800 };
const WAIT_MS = 2500;

interface ToolInfo {
  title: string;
  url: string;
  slug: string;
}

function extractTools(): ToolInfo[] {
  const TOOLS_DATA_PATH = path.resolve(__dirname, "../src/utils/tools-data.ts");
  const content = fs.readFileSync(TOOLS_DATA_PATH, "utf-8");

  const tools: ToolInfo[] = [];
  const toolRegex =
    /\{\s*id:\s*slugify\(["'](.+?)["']\),\s*title:\s*["'](.+?)["'],\s*description:\s*["'](.+?)["'],\s*url:\s*["'](.+?)["']/g;

  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const url = match[4];
    tools.push({
      title: match[2],
      url,
      slug: url.replace(/^\//, "") || "index",
    });
  }

  return tools;
}

async function main() {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.error(
      "Puppeteer not installed. Run:\n  npm install -D puppeteer\n\nThen retry.",
    );
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tools = extractTools();
  console.log(`Found ${tools.length} tools to screenshot`);
  console.log(`Renderer URL: ${DEV_SERVER_URL}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}\n`);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: VIEWPORT,
  });

  const page = await browser.newPage();

  // Navigate to the renderer entry point (hash router base)
  try {
    await page.goto(DEV_SERVER_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
  } catch (err) {
    console.error(
      `Cannot connect to renderer at ${DEV_SERVER_URL}.\n` +
        `Make sure 'npm run start' is running.\n`,
      err,
    );
    await browser.close();
    process.exit(1);
  }

  // Wait for React to mount
  await new Promise((r) => setTimeout(r, 3000));

  let success = 0;
  let failed = 0;

  // Capture the index/homepage first
  try {
    await page.screenshot({ path: path.join(OUTPUT_DIR, "devkithub-index.png"), type: "png", fullPage: false });
    console.log(`  [0/${tools.length}] ✓ devkithub-index.png (homepage)`);
    success++;
  } catch (err) {
    console.error(`  [0] ✗ index — ${err instanceof Error ? err.message : err}`);
    failed++;
  }

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const outPath = path.join(OUTPUT_DIR, `${tool.slug}.png`);
    const progress = `[${i + 1}/${tools.length}]`;

    try {
      await page.goto(`${DEV_SERVER_URL}#${tool.url}`, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      await new Promise((r) => setTimeout(r, WAIT_MS));

      // Click "Sample" button if it exists (check all buttons for text containing "sample")
      try {
        const buttons = await page.$$("button");
        for (const btn of buttons) {
          const text = await page.evaluate((el: Element) => (el.textContent || "").trim().toLowerCase(), btn);
          if (text.includes("sample") || text.includes("example") || text.includes("load sample")) {
            await btn.click();
            await new Promise((r) => setTimeout(r, 2500));
            break;
          }
        }
      } catch { /* no sample button, that's fine */ }

      // If tool has Settings tab/button, click it for a more complete view
      try {
        const tabButtons = await page.$$('[role="tab"], button');
        for (const tab of tabButtons) {
          const text = await page.evaluate((el: Element) => (el.textContent || "").trim().toLowerCase(), tab);
          if (text === "settings" || text === "options") {
            await tab.click();
            await new Promise((r) => setTimeout(r, 800));
            break;
          }
        }
      } catch {}

      await page.screenshot({ path: outPath, type: "png", fullPage: false });
      console.log(`  ${progress} ✓ ${tool.slug}.png`);
      success++;
    } catch (err) {
      console.error(
        `  ${progress} ✗ ${tool.slug} — ${err instanceof Error ? err.message : err}`,
      );
      failed++;
    }
  }

  // Capture settings page if it exists
  try {
    await page.goto(`${DEV_SERVER_URL}#/settings`, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });
    await new Promise((r) => setTimeout(r, WAIT_MS));
    await page.screenshot({ path: path.join(OUTPUT_DIR, "settings.png"), type: "png", fullPage: false });
    console.log(`  [extra] ✓ settings.png`);
    success++;

    // Try to capture each settings tab
    const settingsTabs = ['General', 'Appearance', 'Shortcuts', 'About'];
    for (const tabName of settingsTabs) {
      try {
        const tabs = await page.$$('[role="tab"], button');
        for (const tab of tabs) {
          const text = await page.evaluate((el: Element) => (el.textContent || "").trim(), tab);
          if (text === tabName) {
            await tab.click();
            await new Promise((r) => setTimeout(r, 800));
            await page.screenshot({
              path: path.join(OUTPUT_DIR, `settings-${tabName.toLowerCase()}.png`),
              type: "png",
              fullPage: false,
            });
            console.log(`  [extra] ✓ settings-${tabName.toLowerCase()}.png`);
            success++;
            break;
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error(`  [extra] ✗ settings — ${err instanceof Error ? err.message : err}`);
  }

  await browser.close();

  console.log(`\nDone: ${success} captured, ${failed} failed`);
  console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
}

main();
