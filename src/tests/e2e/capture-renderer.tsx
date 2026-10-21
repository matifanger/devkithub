import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ScreenshotStudioPage } from "../../pages/screenshot-studio";
import { ScreenRecorderPage } from "../../pages/screen-recorder";
import { VideoEditorPage } from "../../pages/video-editor";
import { CaptureLibraryPage } from "../../pages/capture-library";
import { CaptureSessionControls } from "../../components/capture/session-controls";
import { captureRecorder } from "../../services/capture-recorder";
import {
  canvasBlob,
  DEFAULT_SHOT_STYLE,
  loadImage,
  renderShot,
} from "../../utils/capture-image";
import "../../index.css";
import { applyTheme, predefinedThemes } from "../../utils/themes";
applyTheme(predefinedThemes.find((t) => t.id === "elegant-luxury")!, "dark");

Object.assign(window, {
  captureTest: {
    captureRecorder,
    renderShot,
    canvasBlob,
    loadImage,
    DEFAULT_SHOT_STYLE,
  },
});
createRoot(document.getElementById("app")!).render(
  <HashRouter>
    <CaptureSessionControls />
    <Routes>
      <Route path="/" element={<ScreenshotStudioPage />} />
      <Route path="/screenshot-studio" element={<ScreenshotStudioPage />} />
      <Route path="/screen-recorder" element={<ScreenRecorderPage />} />
      <Route path="/video-editor" element={<VideoEditorPage />} />
      <Route path="/capture-library" element={<CaptureLibraryPage />} />
    </Routes>
  </HashRouter>,
);
