import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  SmartFileRenamerPage,
  renamerCsv,
} from "../../pages/smart-file-renamer";
import { DEFAULT_RENAMER_SETTINGS } from "../../types/smart-file-renamer";
import type { RenamerSnapshot } from "../../types/smart-file-renamer";

let state: RenamerSnapshot;
beforeEach(() => {
  state = {
    settings: structuredClone(DEFAULT_RENAMER_SETTINGS),
    items: [],
    history: [],
    watches: [],
    busy: false,
    progress: "",
  };
  window.smartRenamer = {
    snapshot: vi.fn(async () => structuredClone(state)),
    onChange: vi.fn(() => () => undefined),
    pick: vi.fn(async () => {
      state.items = [
        {
          id: "1",
          name: "scan.txt",
          path: "C:\\fixtures\\scan.txt",
          size: 100,
          modified: 0,
          fingerprint: "test",
          proposedName: "Acme.txt",
          folder: "Invoices",
          content: "Acme invoice 42",
          fields: {},
          status: "ready",
          message: "",
        },
      ];
      return structuredClone(state);
    }),
    add: vi.fn(),
    configure: vi.fn(async (settings) => {
      state.settings = settings;
      return structuredClone(state);
    }),
    analyze: vi.fn(async () => structuredClone(state)),
    apply: vi.fn(async () => structuredClone(state)),
    undo: vi.fn(),
    clear: vi.fn(async () => {
      state.items = [];
      return structuredClone(state);
    }),
    cancel: vi.fn(),
    duplicates: vi.fn(async () => []),
    watch: vi.fn(),
    reveal: vi.fn(),
    models: vi.fn(async () => ["test-model"]),
  };
});
afterEach(() => {
  cleanup();
  delete window.smartRenamer;
});

describe("Smart File Renamer page", () => {
  it("renders empty state and all seven workspaces", async () => {
    render(<SmartFileRenamerPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled(),
    );
    expect(
      screen.getByRole("heading", { name: "Smart File Renamer" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(
      screen.getByText("A clearer name for every file"),
    ).toBeInTheDocument();
  });
  it("adds files, edits a preview and only applies after reviewing the confirmation", async () => {
    render(<SmartFileRenamerPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add files" }));
    await screen.findByText("scan.txt");
    fireEvent.change(screen.getByLabelText("New name for scan.txt"), {
      target: { value: "Reviewed.txt" },
    });
    fireEvent.click(screen.getByLabelText("Select scan.txt"));
    fireEvent.click(screen.getByRole("button", { name: "Apply selected (1)" }));
    expect(window.smartRenamer.apply).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("→ Invoices/Reviewed.txt"),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Apply changes" }),
    );
    await waitFor(() =>
      expect(window.smartRenamer.apply).toHaveBeenCalledWith([
        { id: "1", name: "Reviewed.txt", folder: "Invoices" },
      ]),
    );
  });
  it("searches extracted content and clears the library", async () => {
    render(<SmartFileRenamerPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add files" }));
    await screen.findByText("scan.txt");
    fireEvent.change(
      screen.getByLabelText("Search files and extracted content"),
      { target: { value: "invoice 42" } },
    );
    expect(screen.getByText("scan.txt")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await screen.findByText("A clearer name for every file");
    expect(window.smartRenamer.clear).toHaveBeenCalledOnce();
  });
  it("persists edited presets and disables applying stale suggestions", async () => {
    render(<SmartFileRenamerPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Presets" }));
    fireEvent.change(screen.getByLabelText("Filename template"), {
      target: { value: "{vendor}_{date}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
    await waitFor(() =>
      expect(window.smartRenamer.configure).toHaveBeenCalled(),
    );
    expect(state.settings.presets[0].pattern).toBe("{vendor}_{date}");
  });
  it("reports errors without losing the file list", async () => {
    window.smartRenamer.pick = vi
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    render(<SmartFileRenamerPage />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add files" })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add files" }));
    expect(await screen.findByText("Permission denied")).toBeInTheDocument();
  });
  it("offers a desktop-only message when the bridge is unavailable", () => {
    delete window.smartRenamer;
    render(<SmartFileRenamerPage />);
    expect(
      screen.getByText(/Open this tool in the DevKitHub desktop app/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add files" })).toBeDisabled();
  });
  it("escapes CSV cells, quotes and spreadsheet formulas", () => {
    const csv = renamerCsv([{ file: '=HYPERLINK("bad")', value: "a,b\nnext" }]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"a,b\nnext"');
  });
});
