import { useCallback, useEffect, useState } from "react";
import { ClipboardHistoryState } from "../types/clipboard-history";

export function useClipboardHistory() {
  const [state, setState] = useState<ClipboardHistoryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      const next = await window.electron.clipboardHistory.getState();
      setState(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not load clipboard history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.electron.clipboardHistory.onChanged(setState);
    return () => window.electron.clipboardHistory.removeChangedListeners();
  }, [refresh]);

  return { state, setState, loading, error, refresh };
}
