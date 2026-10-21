import React, { useEffect, useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { captureRecorder } from "../../services/capture-recorder";
import { formatDuration } from "./shared";
import { Button } from "../ui/button";

export function CaptureSessionControls() {
  const state = useSyncExternalStore(
      captureRecorder.subscribe,
      captureRecorder.snapshot,
    ),
    location = useLocation();
  useEffect(
    () =>
      window.captureStudio?.onShortcut((action) => {
        if (action === "pause") captureRecorder.pause();
        if (action === "record" && captureRecorder.snapshot().phase !== "idle")
          captureRecorder.stop();
      }),
    [],
  );
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (captureRecorder.snapshot().phase !== "idle") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);
  if (state.phase === "idle" || location.pathname === "/screen-recorder")
    return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-xl"
      role="status"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      <Link to="/screen-recorder" className="text-sm font-medium">
        {state.phase} · {formatDuration(state.seconds)}
      </Link>
      <Button
        size="sm"
        variant="outline"
        disabled={!["recording", "paused"].includes(state.phase)}
        onClick={() => captureRecorder.pause()}
      >
        {state.phase === "paused" ? "Resume" : "Pause"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={state.phase === "saving"}
        onClick={() => captureRecorder.stop()}
      >
        Stop
      </Button>
    </div>
  );
}
