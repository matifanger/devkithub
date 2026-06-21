import React from "react";
import {
  AUTO_SAVE_ENABLED_KEY,
  SAVE_INDICATOR_VISIBLE_KEY,
} from "../constants/settings-keys";

interface AutosaveSettingsContextType {
  autoSaveEnabled: boolean;
  saveIndicatorVisible: boolean;
  isLoading: boolean;
  toggleAutoSave: (enabled: boolean) => Promise<void>;
  toggleSaveIndicator: (visible: boolean) => Promise<void>;
}

const AutosaveSettingsContext = React.createContext<
  AutosaveSettingsContextType | undefined
>(undefined);

export function AutosaveSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);
  const [saveIndicatorVisible, setSaveIndicatorVisible] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const saved = await window.electron.settingsStore.get(
          AUTO_SAVE_ENABLED_KEY,
        );
        if (saved !== null) setAutoSaveEnabled(saved === "true");

        const indicator = await window.electron.settingsStore.get(
          SAVE_INDICATOR_VISIBLE_KEY,
        );
        if (indicator !== null) setSaveIndicatorVisible(indicator === "true");
      } catch {
        // defaults
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const toggleAutoSave = async (enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    await window.electron.settingsStore.set(
      AUTO_SAVE_ENABLED_KEY,
      String(enabled),
    );
  };

  const toggleSaveIndicator = async (visible: boolean) => {
    setSaveIndicatorVisible(visible);
    await window.electron.settingsStore.set(
      SAVE_INDICATOR_VISIBLE_KEY,
      String(visible),
    );
  };

  const value = React.useMemo(
    () => ({
      autoSaveEnabled,
      saveIndicatorVisible,
      isLoading,
      toggleAutoSave,
      toggleSaveIndicator,
    }),
    [autoSaveEnabled, saveIndicatorVisible, isLoading],
  );

  return (
    <AutosaveSettingsContext.Provider value={value}>
      {children}
    </AutosaveSettingsContext.Provider>
  );
}

export function useAutosaveSettings() {
  const ctx = React.useContext(AutosaveSettingsContext);
  if (!ctx)
    throw new Error(
      "useAutosaveSettings must be used within AutosaveSettingsProvider",
    );
  return ctx;
}
