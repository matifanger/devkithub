import { describe, expect, it, vi } from "vitest";
import type { BrowserWindow } from "electron";
import { attachCloseBehavior, revealWindow } from "../../main/tray";

vi.mock("electron", () => ({}));

function createWindow() {
  return {
    isDestroyed: vi.fn(() => false),
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    hide: vi.fn(),
    on: vi.fn(),
    webContents: { send: vi.fn(), reload: vi.fn() },
  };
}

describe("resident tray window", () => {
  it("restores and focuses the existing minimized window synchronously", () => {
    const window = createWindow();
    window.isMinimized.mockReturnValue(true);
    expect(revealWindow(window as unknown as BrowserWindow)).toBe(true);
    expect(window.restore).toHaveBeenCalledOnce();
    expect(window.show).toHaveBeenCalledOnce();
    expect(window.focus).toHaveBeenCalledOnce();
    expect(window.restore.mock.invocationCallOrder[0]).toBeLessThan(
      window.show.mock.invocationCallOrder[0],
    );
    expect(window.webContents.reload).not.toHaveBeenCalled();
  });

  it("repeated tray clicks keep the same loaded window", () => {
    const window = createWindow();
    revealWindow(window as unknown as BrowserWindow);
    revealWindow(window as unknown as BrowserWindow);
    expect(window.show).toHaveBeenCalledTimes(2);
    expect(window.restore).not.toHaveBeenCalled();
    expect(window.webContents.reload).not.toHaveBeenCalled();
  });

  it("reports absent or destroyed windows for recreation", () => {
    expect(revealWindow(null)).toBe(false);
    const window = createWindow();
    window.isDestroyed.mockReturnValue(true);
    expect(revealWindow(window as unknown as BrowserWindow)).toBe(false);
    expect(window.show).not.toHaveBeenCalled();
  });

  it("hides on close without destroying the resident window, but allows quit", async () => {
    const window = createWindow();
    let quitting = false;
    attachCloseBehavior(
      window as unknown as BrowserWindow,
      () => "true",
      vi.fn(),
      () => quitting,
    );
    const onClose = window.on.mock.calls[0][1] as (event: {
      preventDefault: () => void;
    }) => Promise<void>;
    const event = { preventDefault: vi.fn() };
    await onClose(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(window.hide).toHaveBeenCalledOnce();
    quitting = true;
    event.preventDefault.mockClear();
    await onClose(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
