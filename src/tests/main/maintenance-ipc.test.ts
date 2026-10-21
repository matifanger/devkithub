// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "events";
const mock = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  dialog: vi.fn(),
  clean: vi.fn(),
  scan: vi.fn(),
  list: vi.fn(),
  toggle: vi.fn(),
  reveal: vi.fn(),
}));
vi.mock("electron", () => ({
  app: { getPath: () => "C:/Fixture" },
  ipcMain: {
    handle: (name: string, fn: (...args: unknown[]) => unknown) =>
      mock.handlers.set(name, fn),
  },
  dialog: { showMessageBox: mock.dialog },
  shell: { showItemInFolder: mock.reveal },
}));
vi.mock("../../main/maintenance/files", () => ({
  scanTemporaryFiles: mock.scan,
  selectedCandidates: () => [{ size: 42 }],
  cleanSnapshot: mock.clean,
}));
vi.mock("../../main/maintenance/windows", () => ({
  listStartup: mock.list,
  toggleStartup: mock.toggle,
}));
import { registerMaintenanceIpc } from "../../main/maintenance/ipc";
let event: {
  sender: EventEmitter & {
    mainFrame: object;
    send: ReturnType<typeof vi.fn>;
    isDestroyed: () => boolean;
  };
  senderFrame: object;
};
function call(name: string, ...args: unknown[]) {
  return mock.handlers.get(`maintenance:${name}`)!(event, ...args);
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.handlers.clear();
  const mainFrame = { url: "file:///app/index.html" };
  const sender = Object.assign(new EventEmitter(), {
    mainFrame,
    send: vi.fn(),
    isDestroyed: () => false,
  });
  event = { sender, senderFrame: mainFrame };
  registerMaintenanceIpc(
    () => ({ webContents: sender }) as never,
    "file:///app/index.html",
  );
  mock.scan.mockResolvedValue({
    createdAt: Date.now(),
    candidates: [],
    result: { id: "snapshot" },
  });
  mock.dialog.mockResolvedValue({ response: 0 });
  mock.clean.mockResolvedValue({ deleted: 1 });
});

describe.runIf(process.platform === "win32")("maintenance IPC boundary", () => {
  it("rejects a main frame navigated to an external page", async () => {
    Object.assign(event.senderFrame, { url: "https://example.com/index.html" });
    await expect(call("scan-cleanup")).rejects.toThrow("external pages");
    expect(mock.scan).not.toHaveBeenCalled();
  });
  it("rejects subframes and other windows", async () => {
    event.senderFrame = {};
    await expect(call("scan-cleanup")).rejects.toThrow("main application");
    expect(mock.scan).not.toHaveBeenCalled();
    event.sender = Object.assign(new EventEmitter(), {
      mainFrame: {},
      send: vi.fn(),
      isDestroyed: () => false,
    });
    await expect(call("startup-list")).rejects.toThrow("main application");
  });
  it("requires a fresh server-side snapshot and honours native cancellation", async () => {
    await expect(call("clean", "made-up", ["temp"])).rejects.toThrow(
      "Scan temporary",
    );
    await call("scan-cleanup");
    expect(await call("clean", "snapshot", ["temp"])).toBeNull();
    expect(mock.clean).not.toHaveBeenCalled();
    expect(mock.dialog).toHaveBeenCalled();
  });
  it("consumes a snapshot after confirmed deletion", async () => {
    await call("scan-cleanup");
    mock.dialog.mockResolvedValue({ response: 1 });
    await call("clean", "snapshot", ["temp"]);
    expect(mock.clean).toHaveBeenCalledTimes(1);
    await expect(call("clean", "snapshot", ["temp"])).rejects.toThrow(
      "Scan temporary",
    );
  });
  it("rejects concurrent scans and supports cancellation", async () => {
    let complete: (value: unknown) => void;
    let signal: AbortSignal;
    mock.scan.mockImplementation((_roots, abort: AbortSignal) => {
      signal = abort;
      return new Promise((resolve) => {
        complete = resolve;
      });
    });
    const scanning = call("scan-cleanup");
    await expect(call("startup-list")).rejects.toThrow("Another maintenance");
    await call("cancel");
    expect(signal!.aborted).toBe(true);
    complete!({ result: { id: "snapshot" } });
    await scanning;
  });
  it("never accepts arbitrary Explorer paths from the renderer", () => {
    expect(() => call("reveal", "C:/private.txt")).toThrow(
      "Analyze the folder",
    );
    expect(mock.reveal).not.toHaveBeenCalled();
  });
  it("does not change startup entries when native confirmation is cancelled", async () => {
    mock.list.mockResolvedValue([
      { id: "entry", name: "Fixture", manageable: true },
    ]);
    await call("startup-list");
    await call("startup-toggle", "entry", false);
    expect(mock.toggle).not.toHaveBeenCalled();
    await expect(call("startup-toggle", "forged", true)).rejects.toThrow(
      "Refresh",
    );
  });
});
