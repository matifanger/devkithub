import { useState, useEffect, useCallback, useRef } from "react";

export interface UseToolStateOptions {
  debounceMs?: number;
}

export function useToolState<T>(
  toolId: string,
  initialState: T,
  options: UseToolStateOptions = {},
): readonly [T, React.Dispatch<React.SetStateAction<T>>, () => Promise<void>] {
  const { debounceMs = 500 } = options;

  const [state, setState] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTestEnvironment = !window.electron?.store;

  useEffect(() => {
    const loadState = async () => {
      if (isTestEnvironment) {
        setIsLoaded(true);
        return;
      }

      try {
        const stored = await window.electron.store.get(`tool-${toolId}`);
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
    if (!isLoaded || isTestEnvironment) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await window.electron.store.set(
          `tool-${toolId}`,
          JSON.stringify(state),
        );
      } catch {
        // Ignore save errors in tests
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, isLoaded, debounceMs, toolId, isTestEnvironment]);

  const clearState = useCallback(async () => {
    if (!isTestEnvironment) {
      await window.electron.store.delete(`tool-${toolId}`);
    }
    setState(initialState);
  }, [toolId, initialState, isTestEnvironment]);

  return [state, setState, clearState] as const;
}
