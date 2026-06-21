import React, { createContext, useContext, useEffect, useState } from 'react';
import { CLIPBOARD_RECOMMENDATIONS_ENABLED_KEY } from '../constants/settings-keys';

interface ClipboardSettingsContextType {
  isEnabled: boolean;
  isLoading: boolean;
  toggleEnabled: (enabled: boolean) => Promise<void>;
}

const ClipboardSettingsContext = createContext<ClipboardSettingsContextType | undefined>(undefined);

export function ClipboardSettingsProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false); // Start with false to be conservative
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start in loading state

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedValue = await window.electron.settingsStore.get(
          CLIPBOARD_RECOMMENDATIONS_ENABLED_KEY
        );
        if (storedValue === null || storedValue === undefined) {
          setIsEnabled(true);
        } else if (typeof storedValue === 'boolean') {
          setIsEnabled(storedValue);
        } else if (storedValue === 'true' || storedValue === 'false') {
          setIsEnabled(storedValue === 'true');
        } else {
          try {
            setIsEnabled(JSON.parse(storedValue));
          } catch {
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.warn('Failed to load clipboard settings:', error);
        setIsEnabled(true);
      } finally {
        setIsLoading(false); // Settings loaded, stop loading
      }
    };

    loadSettings();
  }, []);

  const toggleEnabled = async (enabled: boolean) => {
    try {
      setIsEnabled(enabled); // Update state immediately
      await window.electron.settingsStore.set(
        CLIPBOARD_RECOMMENDATIONS_ENABLED_KEY,
        JSON.stringify(enabled)
      );
    } catch (error) {
      console.warn('Failed to save clipboard settings:', error);
      // Revert state if save failed
      setIsEnabled(!enabled);
    }
  };

  return (
    <ClipboardSettingsContext.Provider value={{ isEnabled, isLoading, toggleEnabled }}>
      {children}
    </ClipboardSettingsContext.Provider>
  );
}

export function useClipboardSettings() {
  const context = useContext(ClipboardSettingsContext);
  if (context === undefined) {
    throw new Error('useClipboardSettings must be used within a ClipboardSettingsProvider');
  }
  return context;
}
