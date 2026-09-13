import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClipboardHistoryView } from "../../components/clipboard/history-view";
import {
  ClipboardHistoryApi,
  ClipboardHistoryState,
} from "../../types/clipboard-history";

const state: ClipboardHistoryState = {
  version: 1,
  monitoring: true,
  settings: {
    enabled: true,
    shortcutEnabled: true,
    shortcut: "CommandOrControl+Shift+H",
    storeSecretContent: true,
    secretRetentionDays: 3,
    defaultRetentionDays: 0,
    maxItems: 500,
    maxItemSizeMb: 10,
    maxHistorySizeMb: 100,
    pollIntervalMs: 750,
  },
  rules: [],
  items: [
    {
      id: "clip-1",
      type: "text",
      text: "A useful clipboard value",
      formats: ["text/plain"],
      signature: "signature",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 86_400_000,
      pinned: false,
      tags: ["work"],
      collection: "Clipboard",
      byteSize: 24,
      secret: true,
    },
  ],
};

function createApi(): ClipboardHistoryApi {
  return {
    getState: vi.fn().mockResolvedValue(state),
    updateSettings: vi.fn().mockResolvedValue(state),
    upsertRule: vi.fn().mockResolvedValue(state),
    addTextItem: vi.fn().mockResolvedValue(state),
    deleteRule: vi.fn().mockResolvedValue(state),
    copyItem: vi.fn().mockResolvedValue(true),
    updateItem: vi.fn().mockResolvedValue(state),
    deleteItem: vi.fn().mockResolvedValue(state),
    clear: vi.fn().mockResolvedValue(state),
    openQuickWindow: vi.fn().mockResolvedValue(true),
    closeQuickWindow: vi.fn().mockResolvedValue(true),
    openFullHistory: vi.fn().mockResolvedValue(true),
    openWithTool: vi.fn().mockResolvedValue(true),
    beginShortcutCapture: vi.fn().mockResolvedValue(true),
    endShortcutCapture: vi.fn().mockResolvedValue(true),
    onChanged: vi.fn(),
    removeChangedListeners: vi.fn(),
  };
}

describe("ClipboardHistoryView", () => {
  let api: ClipboardHistoryApi;

  beforeEach(() => {
    api = createApi();
    Object.defineProperty(window, "electron", {
      configurable: true,
      value: { clipboardHistory: api },
    });
  });

  it("shows captured content, privacy metadata and expiry", async () => {
    render(<ClipboardHistoryView />);

    await waitFor(() => {
      expect(screen.getAllByText("A useful clipboard value")).toHaveLength(2);
    });
    expect(screen.getByText("Secret")).toBeInTheDocument();
    expect(screen.getByText(/Expires in 1 day/)).toBeInTheDocument();
    expect(
      document.querySelectorAll("[data-radix-scroll-area-viewport]"),
    ).toHaveLength(2);
    expect(
      screen
        .getByText(/Expires in 1 day/)
        .closest("[data-radix-scroll-area-viewport]"),
    ).toBeNull();
  });

  it("shows the complete manager and closes the quick window after copying with Enter", async () => {
    const { container } = render(<ClipboardHistoryView quickWindow />);
    await screen.findAllByText("A useful clipboard value");
    expect(
      document.querySelectorAll("[data-radix-scroll-area-viewport]"),
    ).toHaveLength(2);
    expect(container.firstChild).toHaveClass(
      "fixed",
      "inset-0",
      "overflow-hidden",
    );
    expect(
      screen
        .getByTitle("Double-click to edit")
        .closest("[data-radix-scroll-area-viewport]")?.parentElement,
    ).toHaveClass("h-32");
    expect(
      screen.getByRole("button", { name: /new item/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("All collections")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear unpinned/i }),
    ).toBeInTheDocument();
    const openFullView = screen.getByRole("button", {
      name: "Open full view",
    });
    fireEvent.click(openFullView);
    expect(api.openFullHistory).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => {
      expect(api.copyItem).toHaveBeenCalledWith("clip-1", true);
    });
  });

  it("copies an item directly from its list action", async () => {
    render(<ClipboardHistoryView />);
    await screen.findAllByText("A useful clipboard value");

    fireEvent.click(screen.getByRole("button", { name: "Copy item" }));

    await waitFor(() => {
      expect(api.copyItem).toHaveBeenCalledWith("clip-1", false);
    });
  });

  it("exposes configurable secret storage and content rules", async () => {
    render(<ClipboardHistoryView />);
    await screen.findAllByText("A useful clipboard value");
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));

    expect(
      screen.getByText("Store content marked as secret"),
    ).toBeInTheDocument();
    expect(screen.getByText("Content rules")).toBeInTheDocument();
    expect(
      screen
        .getByText("Content rules")
        .closest("[data-radix-scroll-area-viewport]"),
    ).not.toBeNull();
    expect(screen.getByPlaceholderText("e.g. xvideos.com")).toBeInTheDocument();
  });

  it("captures a keyboard combination for the quick-window shortcut", async () => {
    render(<ClipboardHistoryView />);
    await screen.findAllByText("A useful clipboard value");
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));

    const shortcutInput = screen.getByLabelText("Electron accelerator");
    fireEvent.focus(shortcutInput);
    fireEvent.keyDown(shortcutInput, {
      key: "k",
      ctrlKey: true,
      shiftKey: true,
    });

    expect(api.beginShortcutCapture).toHaveBeenCalled();
    expect(shortcutInput).toHaveValue("CommandOrControl+Shift+K");

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => {
      expect(api.updateSettings).toHaveBeenCalledWith({
        shortcut: "CommandOrControl+Shift+K",
      });
    });
  });
});
