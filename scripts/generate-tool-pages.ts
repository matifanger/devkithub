/**
 * generate-tool-pages.ts
 *
 * Generates structured frontmatter-only landing pages for every tool.
 * The Vue template reads the structured data and renders designed components.
 * NO markdown body is used - everything is in frontmatter.
 *
 * Run: npx tsx scripts/generate-tool-pages.ts [--force]
 */

import * as fs from "fs";
import * as path from "path";

const TOOLS_DATA_PATH = path.resolve(__dirname, "../src/utils/tools-data.ts");
const TOOLS_META_PATH = path.resolve(__dirname, "../src/utils/tools-metadata.ts");
const OUTPUT_DIR = path.resolve(__dirname, "../../frontend/content/tools");
const force = process.argv.includes("--force");
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');

interface ToolInfo {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

interface ToolMeta {
  longDescription: string;
  features: string[];
  usage: string[];
}

const categoryLabels: Record<string, string> = {
  "encode-decode": "Encode & Decode",
  "data-conversion": "Data Conversion",
  "text-string": "Text & String",
  "code-formatting": "Code Formatting",
  development: "Development",
  security: "Security",
  media: "Media",
  utilities: "Utilities",
};

function extractTools(): ToolInfo[] {
  const content = fs.readFileSync(TOOLS_DATA_PATH, "utf-8");
  const tools: ToolInfo[] = [];
  const toolRegex =
    /\{\s*id:\s*slugify\(["'](.+?)["']\),\s*title:\s*["'](.+?)["'],\s*description:\s*["'](.+?)["'],\s*url:\s*["'](.+?)["'],\s*icon:\s*\w+,\s*color:\s*["'].+?["'],\s*category:\s*["'](.+?)["']/g;

  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const title = match[2];
    const id = title.toLowerCase().trim().replace(/[\s_-]+/g, "-").replace(/[^\w-]+/g, "");
    tools.push({ id, title, description: match[3], url: match[4], category: match[5] });
  }
  return tools;
}

function extractMetadata(): Record<string, ToolMeta> {
  const content = fs.readFileSync(TOOLS_META_PATH, "utf-8");
  const map: Record<string, ToolMeta> = {};
  const entryRegex =
    /"([^"]+)":\s*\{\s*longDescription:\s*"((?:[^"\\]|\\.)*)"\s*,\s*features:\s*\[([\s\S]*?)\]\s*,\s*usage:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;

  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    const id = match[1];
    const longDescription = match[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    const features = [...match[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
    const usage = [...match[4].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
    map[id] = { longDescription, features, usage };
  }
  return map;
}

function getSlug(url: string): string {
  return url.replace(/^\//, "") || "index";
}

function generatePage(tool: ToolInfo, meta: ToolMeta | undefined): string {
  const slug = getSlug(tool.url);
  const categoryLabel = categoryLabels[tool.category] || tool.category;
  const description = meta?.longDescription || tool.description;
  const features = meta?.features || [];
  const usage = meta?.usage || [];
  const isCaptureTool = ['screenshot-studio', 'screen-recorder', 'video-editor', 'capture-library'].includes(slug);

  const keywords = [
    tool.title.toLowerCase(),
    `${tool.title.toLowerCase()} online`,
    `${tool.title.toLowerCase()} free`,
    `best ${tool.title.toLowerCase()}`,
    `${tool.title.toLowerCase()} for developers`,
    `private ${tool.title.toLowerCase()}`,
    `offline ${tool.title.toLowerCase()}`,
    "devkithub",
    categoryLabel.toLowerCase(),
    "developer tools",
    "private developer tools",
    "offline tools for developers",
  ];

  const faq = [
    { q: `What is ${tool.title}?`, a: `${tool.title} is a professional developer tool included in DevKitHub. ${description} It runs entirely on your desktop with zero tracking and no internet required.` },
    { q: `Is ${tool.title} free?`, a: `Yes. ${tool.title} is included in DevKitHub — once installed, it works offline forever with all features unlocked. No subscription needed.` },
    { q: "Does it send my data anywhere?", a: "Never. DevKitHub processes everything locally. Your input never leaves your machine — no servers, no telemetry, no analytics. Perfect for sensitive data." },
    { q: `How is this different from online tools?`, a: `Unlike web tools, ${tool.title} in DevKitHub: works offline, never uploads data, has no ads, runs instantly, handles large inputs without timeouts, and integrates with your local workflow.` },
    { q: "What platforms are supported?", a: "Windows 10+, macOS 12+, and Linux (Ubuntu 20.04+, Fedora 36+). Built with Electron, optimized for each platform." },
    { q: "Can I use it in a team?", a: "Absolutely. Each team member installs locally, ensuring consistent tooling without sharing sensitive data through cloud services." },
    { q: "How do I get started?", a: `Download DevKitHub, install it, and open ${tool.title} from the sidebar. ${usage.length > 0 ? usage[0] + " — it's that simple." : "No setup required."}` },
    { q: "Are there keyboard shortcuts?", a: `Yes. Standard shortcuts (Ctrl+C/V) plus tool-specific ones. DevKitHub also supports global shortcuts to open any tool instantly.` },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — DevKitHub`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    url: `https://devkithub.com/tools/${slug}`,
    description,
    ...(!isCaptureTool ? { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
    featureList: features.length > 0 ? features : [description],
  };

  if (isCaptureTool) {
    faq.splice(0, faq.length,
      { q: `What is ${tool.title}?`, a: description },
      { q: 'Does this upload my captures automatically?', a: 'No. Capture and editing happen locally. Only choosing Upload in Capture Library sends the selected file to your configured Capture Cloud server.' },
      { q: 'What does cloud sharing require?', a: 'A deployed DevKitHub Capture Cloud server, private object storage and an upload token. Hosting and storage costs are separate. Cloud sharing requires internet access; local capture and editing do not.' },
      { q: 'Which recording formats are supported?', a: 'Screen Recorder creates WebM files. Video Editor exports MP4, WebM and animated GIF using bundled FFmpeg. System audio capture is available on Windows; microphone and webcam depend on device permissions.' },
      { q: 'How do I get started?', a: usage.join('. ') },
    );
  }
  let page = `---
title: "${tool.title} — ${isCaptureTool ? 'Capture Toolkit' : 'Free Private Developer Tool'} | DevKitHub"
description: "${description.replace(/"/g, '\\"')}${isCaptureTool ? '' : ' Zero tracking. 100% offline.'}"
toolName: "${tool.title}"
keywords:
${keywords.map((k) => `  - "${k}"`).join("\n")}
category: "${categoryLabel}"
canonical: "https://devkithub.com/tools/${slug}"
screenshot: "/screenshots/${slug}.png"
features:
${features.map((f) => `  - "${f.replace(/"/g, '\\"')}"`).join("\n")}
usage:
${usage.map((u) => `  - "${u.replace(/"/g, '\\"')}"`).join("\n")}
faq:
${faq.map((f) => `  - q: "${f.q.replace(/"/g, '\\"')}"\n    a: "${f.a.replace(/"/g, '\\"')}"`).join("\n")}
schema:
  - ${JSON.stringify(schema)}
---

${tool.title} — ${description}
`;

  return page;
}

function main() {
  const tools = extractTools();
  const metadata = extractMetadata();

  console.log(`Found ${tools.length} tools`);
  console.log(`Found ${Object.keys(metadata).length} metadata entries`);
  console.log(`Force mode: ${force ? "ON" : "OFF"}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;

  for (const tool of tools) {
    const slug = getSlug(tool.url);
    if (only && !only.includes(slug)) continue;
    const toolDir = path.join(OUTPUT_DIR, slug);
    const indexPath = path.join(toolDir, "index.md");

    if (fs.existsSync(indexPath) && !force) {
      skipped++;
      continue;
    }

    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }

    const meta = metadata[tool.id];
    const content = generatePage(tool, meta);

    fs.writeFileSync(indexPath, content, "utf-8");
    generated++;
    console.log(`  ✓ ${slug}/index.md`);
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped (use --force to overwrite)`);
}

main();
