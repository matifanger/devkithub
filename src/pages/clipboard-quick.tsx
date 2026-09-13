import React from "react";
import { ClipboardHistoryView } from "../components/clipboard/history-view";
import { ThemeLoader } from "../layouts/app-layout";

export function ClipboardQuickPage() {
  return (
    <ThemeLoader>
      <div className="h-screen max-h-screen overflow-hidden">
        <ClipboardHistoryView quickWindow />
      </div>
    </ThemeLoader>
  );
}
