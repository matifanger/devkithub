import * as fs from "fs/promises";
import * as path from "path";
import JSZip from "jszip";
import { XMLParser } from "./xml-text";

export interface FileContent {
  text: string;
  images: string[];
  warning: string;
}
const TEXT_EXTENSIONS = new Set(
  "txt md markdown csv tsv json jsonl xml html htm css js jsx ts tsx py rb go rs java c cpp h cs sql yaml yml toml ini log rst tex eml srt vtt svg rtf".split(
    " ",
  ),
);
const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "tif",
  "tiff",
]);
const TEXT_LIMIT = 24000;
const FILE_LIMIT = 40 * 1024 * 1024;

export async function extractContent(
  file: string,
  vision: boolean,
): Promise<FileContent> {
  const size = (await fs.stat(file)).size;
  if (size > FILE_LIMIT)
    throw new Error(
      "Content analysis supports files up to 40 MB. Use a metadata preset for larger files.",
    );
  const extension = path.extname(file).slice(1).toLowerCase();
  const buffer = await fs.readFile(file);
  if (TEXT_EXTENSIONS.has(extension)) {
    const text = buffer.toString("utf8");
    if (text.includes("\u0000"))
      throw new Error(
        "This text file is not UTF-8. Convert it to UTF-8 before analyzing its content.",
      );
    return {
      text: text.slice(0, TEXT_LIMIT),
      images: [],
      warning:
        text.length > TEXT_LIMIT
          ? "Only the first 24,000 characters were analyzed."
          : "",
    };
  }
  if (IMAGE_EXTENSIONS.has(extension)) {
    if (!vision)
      throw new Error(
        "Enable vision and select an image-capable local model to analyze this image.",
      );
    const { loadImage, createCanvas } = await import("@napi-rs/canvas");
    const image = await loadImage(buffer);
    const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = createCanvas(
      Math.max(1, Math.round(image.width * ratio)),
      Math.max(1, Math.round(image.height * ratio)),
    );
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      text: "",
      images: [canvas.toBuffer("image/png").toString("base64")],
      warning: "",
    };
  }
  if (["docx", "pptx", "odt", "ods", "odp", "epub"].includes(extension)) {
    const archive = await JSZip.loadAsync(buffer);
    const entries = Object.values(archive.files)
      .filter(
        (entry) =>
          !entry.dir &&
          /^(word\/document\.xml|ppt\/slides\/slide\d+\.xml|content\.xml)$|\.(xhtml|html)$/i.test(
            entry.name,
          ),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
    let text = "";
    for (const entry of entries.slice(0, 50)) {
      const expandedSize = (
        entry as typeof entry & { _data?: { uncompressedSize?: number } }
      )._data?.uncompressedSize;
      if (expandedSize === undefined || expandedSize > 5_000_000)
        throw new Error("Document section is too large to extract safely.");
      const xml = await entry.async("string");
      if (xml.length > 5_000_000)
        throw new Error("Document section is too large to extract safely.");
      text += `\n${XMLParser(xml)}`;
      if (text.length >= TEXT_LIMIT) break;
    }
    if (!text.trim())
      throw new Error("No readable text found in this document.");
    return {
      text: text.slice(0, TEXT_LIMIT),
      images: [],
      warning:
        text.length > TEXT_LIMIT || entries.length > 50
          ? "Document text was truncated for analysis."
          : "",
    };
  }
  if (["xlsx", "xls", "xlsb", "numbers"].includes(extension)) {
    const XLSX = await import("xlsx");
    const book = XLSX.read(buffer, { type: "buffer", sheetRows: 200 });
    const text = book.SheetNames.slice(0, 5)
      .map((name) => `${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name])}`)
      .join("\n");
    return {
      text: text.slice(0, TEXT_LIMIT),
      images: [],
      warning:
        "Spreadsheet preview is limited to 5 sheets and 200 rows per sheet.",
    };
  }
  if (extension === "pdf") return extractPdf(buffer, vision);
  throw new Error(
    `Content analysis does not support .${extension || "(no extension)"}. Use {original}, {modified} and {counter}, or edit the proposed name manually.`,
  );
}

async function extractPdf(
  buffer: Buffer,
  vision: boolean,
): Promise<FileContent> {
  // Native canvas is N-API based, so it also works in Electron without an ABI rebuild.
  const canvasApi = await import("@napi-rs/canvas");
  Object.assign(globalThis, {
    DOMMatrix: canvasApi.DOMMatrix,
    Path2D: canvasApi.Path2D,
    ImageData: canvasApi.ImageData,
  });
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  Object.assign(globalThis, { pdfjsWorker: worker });
  // PDF.js' default Node factory requires Node 20's getBuiltinModule. Electron 25
  // uses Node 18: supply the native factory explicitly, including intermediate
  // canvases used for embedded images, masks and transformations.
  class CanvasFactory {
    create(width: number, height: number) {
      if (width <= 0 || height <= 0 || width * height > 40_000_000)
        throw new Error("PDF image exceeds the rendering limit.");
      const canvas = canvasApi.createCanvas(
        Math.ceil(width),
        Math.ceil(height),
      );
      return { canvas, context: canvas.getContext("2d") };
    }
    reset(
      target: { canvas: import("@napi-rs/canvas").Canvas },
      width: number,
      height: number,
    ) {
      if (width <= 0 || height <= 0 || width * height > 40_000_000)
        throw new Error("PDF image exceeds the rendering limit.");
      target.canvas.width = Math.ceil(width);
      target.canvas.height = Math.ceil(height);
    }
    destroy(target: {
      canvas: import("@napi-rs/canvas").Canvas;
      context: unknown;
    }) {
      target.canvas.width = 1;
      target.canvas.height = 1;
      target.canvas = null;
      target.context = null;
    }
  }
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    CanvasFactory,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
    maxImageSize: 40_000_000,
  });
  try {
    const pdf = await task.promise;
    let text = "";
    const images: string[] = [];
    let scannedPages = 0;
    for (let number = 1; number <= Math.min(pdf.numPages, 10); number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      text += `\n${pageText}`;
      if (pageText.trim().length < 30) {
        scannedPages++;
        if (vision && images.length < 3) {
          const viewport = page.getViewport({ scale: 1 });
          const scaled = page.getViewport({
            scale: Math.min(
              2,
              1600 / Math.max(viewport.width, viewport.height),
            ),
          });
          const canvas = canvasApi.createCanvas(
            Math.ceil(scaled.width),
            Math.ceil(scaled.height),
          );
          await page.render({
            canvasContext: canvas.getContext(
              "2d",
            ) as unknown as CanvasRenderingContext2D,
            viewport: scaled,
          }).promise;
          images.push(canvas.toBuffer("image/png").toString("base64"));
        }
      }
      page.cleanup();
      if (text.length >= TEXT_LIMIT) break;
    }
    if (!text.trim() && !images.length)
      throw new Error(
        "This PDF needs OCR. Enable vision and use an image-capable local model.",
      );
    const warnings: string[] = [];
    if (pdf.numPages > 10 || text.length >= TEXT_LIMIT)
      warnings.push(
        "PDF analysis is limited to 10 pages and 24,000 characters.",
      );
    if (scannedPages > images.length)
      warnings.push(
        "Some scanned pages were not analyzed; vision handles up to 3 scanned pages.",
      );
    return {
      text: text.slice(0, TEXT_LIMIT),
      images,
      warning: warnings.join(" "),
    };
  } finally {
    await task.destroy();
  }
}
