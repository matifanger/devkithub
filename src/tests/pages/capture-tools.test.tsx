import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CaptureLibraryPage } from "../../pages/capture-library";
import { ScreenshotStudioPage } from "../../pages/screenshot-studio";
import { ScreenRecorderPage } from "../../pages/screen-recorder";
import { VideoEditorPage } from "../../pages/video-editor";
import type { CaptureApi, CaptureAsset } from "../../types/capture";
vi.mock("../../hooks/useToolState", () => ({
  useToolState: (_: string, initial: unknown) => {
    const [state, setState] = React.useState(initial);
    return [state, setState, () => setState(initial)];
  },
}));
const item: CaptureAsset = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Demo screenshot",
  kind: "image",
  extension: "png",
  mime: "image/png",
  createdAt: 1,
  size: 1024,
  url: "data:image/png;base64,",
};
const mount = (element: React.ReactNode) =>
  render(<MemoryRouter>{element}</MemoryRouter>);
beforeEach(() => {
  cleanup();
  window.captureStudio = {
    list: vi
      .fn()
      .mockResolvedValue([
        item,
        {
          ...item,
          id: "00000000-0000-4000-8000-000000000002",
          name: "Walkthrough",
          kind: "video",
        },
      ]),
    cloudSettings: vi.fn().mockResolvedValue({ url: "", configured: false }),
    sources: vi
      .fn()
      .mockResolvedValue([
        { id: "screen:1", name: "Display 1", kind: "screen", thumbnail: "" },
      ]),
    platform: vi.fn().mockResolvedValue("win32"),
    onShortcut: vi.fn(() => () => {}),
    onExportProgress: vi.fn(() => () => {}),
    remove: vi.fn().mockResolvedValue(undefined),
    share: vi.fn(),
  } as unknown as CaptureApi;
});
describe("Capture tools", () => {
  it("searches/filter captures and clears filters without deleting files", async () => {
    mount(<CaptureLibraryPage />);
    await screen.findByText("Demo screenshot");
    fireEvent.change(screen.getByLabelText("Search captures"), {
      target: { value: "walkthrough" },
    });
    expect(screen.queryByText("Demo screenshot")).not.toBeInTheDocument();
    expect(screen.getByText("Walkthrough")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear filters"));
    expect(screen.getByText("Demo screenshot")).toBeInTheDocument();
    expect(window.captureStudio.remove).not.toHaveBeenCalled();
  });
  it("requires a configured connection before uploading and never auto-uploads", async () => {
    mount(<CaptureLibraryPage />);
    await screen.findByText("Demo screenshot");
    fireEvent.click(screen.getByLabelText("Share Demo screenshot"));
    expect(screen.getByText("Upload & create link")).toBeDisabled();
    expect(window.captureStudio.share).not.toHaveBeenCalled();
  });
  it("only removes a capture after confirming its concrete name", async () => {
    mount(<CaptureLibraryPage />);
    await screen.findByText("Demo screenshot");
    fireEvent.click(screen.getByLabelText("Delete Demo screenshot"));
    expect(window.captureStudio.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Delete capture"));
    await waitFor(() =>
      expect(window.captureStudio.remove).toHaveBeenCalledWith(item.id),
    );
  });
  it("makes image output unavailable until an image is loaded", async () => {
    mount(<ScreenshotStudioPage />);
    await screen.findByText("Display 1");
    expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Ocean background"));
    expect(screen.getByLabelText("Background color")).toHaveValue("#0369a1");
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.getByLabelText("Background color")).toHaveValue("#6366f1");
  });
  it("requires an explicit recording source", async () => {
    mount(<ScreenRecorderPage />);
    expect(screen.getByRole("button", { name: "Record" })).toBeDisabled();
    fireEvent.click(await screen.findByText("Display 1"));
    expect(screen.getByRole("button", { name: "Record" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
  });
  it("never pretends to export without an imported video", () => {
    mount(<VideoEditorPage />);
    expect(screen.getByRole("button", { name: "Export video" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Import video" })).toBeEnabled();
  });
});
