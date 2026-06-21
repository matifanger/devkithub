import { useState, useEffect, useCallback, useRef } from "react";

export interface UseToolStateOptions {
  debounceMs?: number;
  autoSave?: boolean;
}

export interface ToolStateMeta {
  isSaving: boolean;
  lastSavedAt: number | null;
  autoSaveEnabled: boolean;
  setLocalAutoSave: (enabled: boolean) => void;
}

export function useToolState<T>(
  toolId: string,
  initialState: T,
  options: UseToolStateOptions = {},
): readonly [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  () => Promise<void>,
  ToolStateMeta,
] {
  const { debounceMs = 500, autoSave = true } = options;

  const [state, setState] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localAutoSave, setLocalAutoSave] = useState(autoSave);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTestEnvironment =
    typeof window === "undefined" || !window.electron?.settingsStore;

  useEffect(() => {
    const loadState = async () => {
      if (isTestEnvironment) {
        setIsLoaded(true);
        return;
      }

      try {
        const stored = await window.electron.settingsStore.get(
          `tool-${toolId}`,
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          const merged = { ...initialState, ...parsed };
          setState(merged);
        }
      } catch {
        // Ignore parse errors, use initial state
      }
      setIsLoaded(true);
    };

    loadState();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toolId, isTestEnvironment]);

  useEffect(() => {
    if (!isLoaded || isTestEnvironment || !localAutoSave) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        await window.electron.settingsStore.set(
          `tool-${toolId}`,
          JSON.stringify(state),
        );
        setLastSavedAt(Date.now());
      } catch {
        // Ignore save errors
      }
      setIsSaving(false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, isLoaded, debounceMs, toolId, isTestEnvironment, localAutoSave]);

  const clearState = useCallback(async () => {
    if (!isTestEnvironment) {
      await window.electron.settingsStore.delete(`tool-${toolId}`);
    }
    setState(initialState);
    setLastSavedAt(null);
  }, [toolId, initialState, isTestEnvironment]);

  const meta: ToolStateMeta = {
    isSaving,
    lastSavedAt,
    autoSaveEnabled: localAutoSave,
    setLocalAutoSave,
  };

  return [state, setState, clearState, meta] as const;
}
