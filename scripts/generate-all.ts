/**
 * generate-all.ts
 *
 * Master automation script that runs the full tool documentation pipeline:
 * 1. Captures screenshots of all tools (requires running dev server + puppeteer)
 * 2. Generates SEO content markdown files for the Nuxt frontend
 *
 * Run: npx tsx scripts/generate-all.ts [--skip-screenshots] [--force]
 *
 * Flags:
 *   --skip-screenshots  Skip the screenshot capture step
 *   --force             Overwrite existing content files
 */

import { execSync } from "child_process";
import * as path from "path";

const args = process.argv.slice(2);
const skipScreenshots = args.includes("--skip-screenshots");
const force = args.includes("--force");

function run(script: string, label: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(60)}\n`);

  try {
    execSync(`npx tsx ${path.resolve(__dirname, script)}${force ? " --force" : ""}`, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });
  } catch (err) {
    console.error(`\n✗ ${label} failed`);
    if (err instanceof Error && "status" in err) {
      process.exit((err as { status: number }).status || 1);
    }
    process.exit(1);
  }
}

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║         DevKitHub — Tool Documentation Generator        ║");
console.log("╚══════════════════════════════════════════════════════════╝");

if (!skipScreenshots) {
  run("capture-screenshots.ts", "Step 1: Capturing Screenshots");
} else {
  console.log("\n⏭  Skipping screenshots (--skip-screenshots flag)");
}

run("generate-tool-pages.ts", `Step 2: Generating SEO Content${force ? " (force overwrite)" : ""}`);

console.log("\n╔══════════════════════════════════════════════════════════╗");
console.log("║                    ✓ All Done!                          ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");
