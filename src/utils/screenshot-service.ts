import { allTools } from "./tools-data";
import { allToolsMetadata, ToolMetadata } from "./tools-metadata";

export interface ToolScreenshotResult {
  slug: string;
  screenshotPath: string | null;
  metadata: ToolMetadata;
  error?: string;
}

export interface ToolAuditReport {
  generatedAt: string;
  totalTools: number;
  successfulCaptures: number;
  failedCaptures: number;
  results: ToolScreenshotResult[];
}

function getSlug(url: string): string {
  return url.replace(/^\//, "") || "index";
}

export async function captureToolScreenshot(
  route: string,
  slug: string,
): Promise<string | null> {
  if (!window.electron?.screenshot?.captureToolScreenshot) {
    console.warn("Screenshot API not available");
    return null;
  }
  return window.electron.screenshot.captureToolScreenshot(route, slug);
}

export async function captureAllToolScreenshots(
  onProgress?: (current: number, total: number, slug: string) => void,
): Promise<ToolAuditReport> {
  const results: ToolScreenshotResult[] = [];

  for (let i = 0; i < allTools.length; i++) {
    const tool = allTools[i];
    const slug = getSlug(tool.url);
    const metadata = allToolsMetadata.find((m) => m.toolId === tool.id);

    if (onProgress) onProgress(i + 1, allTools.length, slug);

    try {
      const screenshotPath = await captureToolScreenshot(tool.url, slug);
      results.push({
        slug,
        screenshotPath,
        metadata: metadata!,
      });
    } catch (err) {
      results.push({
        slug,
        screenshotPath: null,
        metadata: metadata!,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalTools: allTools.length,
    successfulCaptures: results.filter((r) => r.screenshotPath).length,
    failedCaptures: results.filter((r) => !r.screenshotPath).length,
    results,
  };
}

export async function getScreenshotsDir(): Promise<string> {
  if (!window.electron?.screenshot?.getScreenshotsDir) {
    throw new Error("Screenshot API not available");
  }
  return window.electron.screenshot.getScreenshotsDir();
}
