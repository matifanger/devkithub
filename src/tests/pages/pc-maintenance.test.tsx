import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup as unmount,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PcMaintenancePage } from "../../pages/pc-maintenance";
import type { MaintenanceApi } from "../../types/maintenance";

const overview = {
  platform: "win32",
  hostname: "test-pc",
  release: "10",
  totalMemory: 8192,
  freeMemory: 4096,
  drives: [{ name: "C:", total: 10000, free: 4000 }],
};
let api: MaintenanceApi;
beforeEach(() => {
  unmount();
  api = {
    overview: vi.fn().mockResolvedValue(overview),
    analyzeDisk: vi.fn(),
    scanCleanup: vi.fn(),
    clean: vi.fn(),
    cancel: vi.fn().mockResolvedValue(undefined),
    reveal: vi.fn(),
    startupList: vi.fn(),
    startupToggle: vi.fn(),
    openStartupSettings: vi.fn(),
    onProgress: vi.fn().mockReturnValue(vi.fn()),
  };
  Object.defineProperty(window, "electron", {
    configurable: true,
    value: { maintenance: api },
  });
});
function open(tab = "overview") {
  return render(
    <MemoryRouter initialEntries={[`/pc-maintenance?tab=${tab}`]}>
      <PcMaintenancePage />
    </MemoryRouter>,
  );
}
const scanned = {
  id: "scan",
  scannedAt: new Date().toISOString(),
  cancelled: false,
  limited: false,
  groups: [
    {
      id: "temp",
      label: "User temporary files",
      root: "C:/Temp",
      bytes: 100,
      files: 1,
      skipped: 0,
      samples: [{ path: "C:/Temp/old.tmp", bytes: 100 }],
    },
  ],
};

describe("PC Maintenance", () => {
  it("shows actual drive values and does not invent unscanned totals", async () => {
    open();
    await screen.findByText("test-pc", { exact: false });
    expect(screen.getByText("Not scanned")).toBeInTheDocument();
    expect(screen.getByText("Not checked")).toBeInTheDocument();
    expect(screen.getByText("C:")).toBeInTheDocument();
  });
  it("requires explicit category selection, then shows the real cleanup outcome", async () => {
    vi.mocked(api.scanCleanup).mockResolvedValue(scanned);
    vi.mocked(api.clean).mockResolvedValue({
      deleted: 1,
      bytes: 100,
      skipped: 0,
      errors: [],
      cancelled: false,
    });
    open("cleanup");
    await waitFor(() =>
      expect(screen.getByText("Scan temporary files")).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Scan temporary files"));
    const checkbox = await screen.findByRole("checkbox");
    expect(screen.getByText("Delete selected temporary files")).toBeDisabled();
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText("Delete selected temporary files"));
    await screen.findByText("Cleanup finished");
    expect(api.clean).toHaveBeenCalledWith("scan", ["temp"]);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
  it("keeps the preview when the native confirmation is cancelled", async () => {
    vi.mocked(api.scanCleanup).mockResolvedValue(scanned);
    vi.mocked(api.clean).mockResolvedValue(null);
    open("cleanup");
    await waitFor(() =>
      expect(screen.getByText("Scan temporary files")).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Scan temporary files"));
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByText("Delete selected temporary files"));
    await waitFor(() =>
      expect(screen.getByText("Delete selected temporary files")).toBeEnabled(),
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.queryByText("Cleanup finished")).not.toBeInTheDocument();
  });
  it("disables cleaning after a cancelled scan", async () => {
    vi.mocked(api.scanCleanup).mockResolvedValue({
      ...scanned,
      cancelled: true,
    });
    open("cleanup");
    await waitFor(() =>
      expect(screen.getByText("Scan temporary files")).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Scan temporary files"));
    expect(await screen.findByRole("checkbox")).toBeDisabled();
    expect(screen.getByText("Delete selected temporary files")).toBeDisabled();
  });
  it("shows errors and allows retrying a failed scan", async () => {
    vi.mocked(api.scanCleanup).mockRejectedValue(
      new Error("Access unavailable"),
    );
    open("cleanup");
    await waitFor(() =>
      expect(screen.getByText("Scan temporary files")).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Scan temporary files"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Access unavailable",
    );
    expect(screen.getByText("Scan temporary files")).toBeEnabled();
  });
  it("keeps shared startup entries read-only and updates restored entries", async () => {
    const personal = {
      id: "one",
      name: "Editor",
      command: "editor.exe",
      source: "User",
      enabled: false,
      manageable: true,
    };
    const shared = {
      id: "two",
      name: "Shared",
      command: "shared.exe",
      source: "Machine",
      enabled: true,
      manageable: false,
    };
    vi.mocked(api.startupList).mockResolvedValue([personal, shared]);
    vi.mocked(api.startupToggle).mockResolvedValue([
      { ...personal, enabled: true },
      shared,
    ]);
    open("startup");
    await waitFor(() =>
      expect(screen.getByText("Load startup apps")).toBeEnabled(),
    );
    fireEvent.click(screen.getByText("Load startup apps"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Restore Editor" }),
    );
    await screen.findByRole("button", { name: "Disable Editor" });
    expect(api.startupToggle).toHaveBeenCalledWith("one", true);
    expect(screen.getByText("Read-only")).toBeDisabled();
  });
  it("disables Windows-only actions on other platforms", async () => {
    vi.mocked(api.overview).mockResolvedValue({
      ...overview,
      platform: "darwin",
    });
    open("cleanup");
    await screen.findByText(/currently require Windows/);
    expect(screen.getByText("Scan temporary files")).toBeDisabled();
  });
  it("cancels in-flight work and unsubscribes on unmount", async () => {
    const unsubscribe = vi.fn();
    vi.mocked(api.onProgress).mockReturnValue(unsubscribe);
    vi.mocked(api.analyzeDisk).mockImplementation(
      () => new Promise(() => undefined),
    );
    const view = open("disk");
    fireEvent.click(screen.getByText("Choose folder"));
    view.unmount();
    expect(api.cancel).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
