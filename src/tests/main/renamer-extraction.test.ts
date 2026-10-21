// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { createServer, Server } from "http";
import JSZip from "jszip";
import { createCanvas } from "@napi-rs/canvas";
import { extractContent } from "../../main/renamer/extract";
import { inferFields, listModels } from "../../main/renamer/ai";
import { DEFAULT_RENAMER_SETTINGS } from "../../types/smart-file-renamer";

let root: string;
let server: Server | undefined;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "devkithub-extract-test-"));
});
afterEach(async () => {
  if (server)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  server = undefined;
  await fs.rm(root, { recursive: true, force: true });
});

// Minimal real PDF, not a mocked extractor response.
function makePdf(text: string): Buffer {
  const stream = text
    ? `BT /F1 18 Tf 30 160 Td (${text}) Tj ET`
    : "0.2 0.5 0.7 rg 20 20 100 100 re f";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

describe("Document extraction", () => {
  it("extracts real PDF text", async () => {
    const file = path.join(root, "invoice.pdf");
    await fs.writeFile(
      file,
      makePdf("Acme Invoice September 2026 Total EUR 42.00"),
    );
    const content = await extractContent(file, false);
    expect(content.text).toContain("Acme Invoice");
    expect(content.images).toEqual([]);
  });
  it("renders a scanned PDF to an image for a local vision model", async () => {
    const file = path.join(root, "scan.pdf");
    await fs.writeFile(file, makePdf(""));
    const content = await extractContent(file, true);
    expect(content.images).toHaveLength(1);
    expect(
      Buffer.from(content.images[0], "base64").subarray(1, 4).toString(),
    ).toBe("PNG");
    await expect(extractContent(file, false)).rejects.toThrow("needs OCR");
  });
  it("extracts DOCX paragraphs and escaped XML text", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      "<w:document><w:p><w:t>Acme &amp; Sons</w:t></w:p><w:p><w:t>Invoice 42</w:t></w:p></w:document>",
    );
    const file = path.join(root, "invoice.docx");
    await fs.writeFile(file, await zip.generateAsync({ type: "nodebuffer" }));
    const content = await extractContent(file, false);
    expect(content.text).toContain("Acme & Sons");
    expect(content.text).toContain("Invoice 42");
  });
  it("resizes an actual image and refuses it when vision is disabled", async () => {
    const canvas = createCanvas(2000, 1000);
    canvas.getContext("2d").fillRect(0, 0, 2000, 1000);
    const file = path.join(root, "image.png");
    await fs.writeFile(file, canvas.toBuffer("image/png"));
    expect((await extractContent(file, true)).images).toHaveLength(1);
    await expect(extractContent(file, false)).rejects.toThrow("Enable vision");
  });
  it("reports truncation instead of silently presenting partial text as complete", async () => {
    const file = path.join(root, "long.txt");
    await fs.writeFile(file, "a".repeat(25000));
    const result = await extractContent(file, false);
    expect(result.text).toHaveLength(24000);
    expect(result.warning).toContain("24,000");
  });
  it("rejects unsupported binary content", async () => {
    const file = path.join(root, "binary.exe");
    await fs.writeFile(file, "binary");
    await expect(extractContent(file, true)).rejects.toThrow(
      "does not support",
    );
  });
});

describe("Local model transport", () => {
  async function fixture(
    handler: (url: string, body: Record<string, unknown>) => unknown,
  ) {
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString())
        : {};
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(handler(req.url, body)));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const port = (server.address() as { port: number }).port;
    return `http://127.0.0.1:${port}`;
  }
  it("lists models and sends text/images to Ollama with validated structured output", async () => {
    let posted: Record<string, unknown>;
    const endpoint = await fixture((url, body) => {
      if (url === "/api/tags") return { models: [{ name: "test-vision" }] };
      posted = body;
      return {
        message: {
          content: JSON.stringify({
            fields: { title: "Invoice Acme", vendor: "Acme", amount: 42 },
            confidence: 0.98,
          }),
        },
      };
    });
    const settings = {
      ...DEFAULT_RENAMER_SETTINGS,
      provider: "ollama" as const,
      endpoint,
      model: "test-vision",
    };
    expect(await listModels(settings)).toEqual(["test-vision"]);
    const result = await inferFields(
      settings,
      settings.presets[0],
      "scan.png",
      { text: "Receipt", images: ["base64-image"], warning: "" },
      new AbortController().signal,
    );
    expect(result.fields.title).toBe("Invoice Acme");
    expect(result.fields.amount).toBe("42");
    expect(result.confidence).toBe(0.98);
    expect(posted.stream).toBe(false);
    expect(JSON.stringify(posted.messages)).toContain("base64-image");
  });
  it("supports the LM Studio chat completions response", async () => {
    const endpoint = await fixture((url) => {
      expect(url).toBe("/v1/chat/completions");
      return {
        choices: [
          {
            message: {
              content:
                '```json\n{"fields":{"title":"Client Report"},"confidence":0.93}\n```',
            },
          },
        ],
      };
    });
    const settings = {
      ...DEFAULT_RENAMER_SETTINGS,
      provider: "compatible" as const,
      endpoint: `${endpoint}/v1`,
      model: "local-model",
    };
    const result = await inferFields(
      settings,
      settings.presets[0],
      "report.txt",
      { text: "Client report", images: [], warning: "" },
      new AbortController().signal,
    );
    expect(result.fields.title).toBe("Client Report");
  });
  it("rejects malformed model responses", async () => {
    const endpoint = await fixture(() => ({
      message: { content: "not JSON" },
    }));
    const settings = {
      ...DEFAULT_RENAMER_SETTINGS,
      provider: "ollama" as const,
      endpoint,
      model: "bad-model",
    };
    await expect(
      inferFields(
        settings,
        settings.presets[0],
        "file.txt",
        { text: "test", images: [], warning: "" },
        new AbortController().signal,
      ),
    ).rejects.toThrow("invalid JSON");
  });
});
