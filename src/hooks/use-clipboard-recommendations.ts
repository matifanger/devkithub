import { useCallback, useEffect, useState } from 'react';
import { ClipboardDetector } from '../services/clipboard/clipboard-detector';
import { ToolRecommender } from '../services/clipboard/tool-recommender';
import { ContentDetectionResult } from '../types/clipboard';
import { Tool } from '../utils/tools-data';
import { useClipboardSettings } from './use-clipboard-settings';

export interface ClipboardRecommendations {
  detectionResult: ContentDetectionResult | null;
  recommendedTools: Tool[];
  isLoading: boolean;
  lastChecked: Date | null;
}

export function useClipboardRecommendations() {
  const { isEnabled, isLoading } = useClipboardSettings();
  const [state, setState] = useState<ClipboardRecommendations>({
    detectionResult: null,
    recommendedTools: [],
    isLoading: false,
    lastChecked: null,
  });

  const detectClipboardContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Read clipboard content
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText || clipboardText.trim().length === 0) {
        setState({
          detectionResult: null,
          recommendedTools: [],
          isLoading: false,
          lastChecked: new Date(),
        });
        return;
      }

      // Detect content type
      const detectionResult = ClipboardDetector.detectContentType(clipboardText);

      // Get tool recommendations
      const recommendedTools = ToolRecommender.getRecommendedTools(
        detectionResult.type,
        detectionResult.confidence
      );

      setState({
        detectionResult,
        recommendedTools,
        isLoading: false,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.warn('Failed to access clipboard:', error);
      setState({
        detectionResult: null,
        recommendedTools: [],
        isLoading: false,
        lastChecked: new Date(),
      });
    }
  }, []);

  // Only run when settings are loaded
  useEffect(() => {
    // Exit early if still loading
    if (isLoading) {
      return;
    }

    if (!isEnabled) {
      // Clear state immediately when disabled
      setState({
        detectionResult: null,
        recommendedTools: [],
        isLoading: false,
        lastChecked: new Date(),
      });
      return;
    }

    // Only proceed if enabled
    const handleFocus = () => {
      detectClipboardContent();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        detectClipboardContent();
      }
    };

    // Initial detection
    detectClipboardContent();

    // Add listeners
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, isLoading, detectClipboardContent]);

  return {
    ...state,
    refresh: detectClipboardContent,
    isEnabled,
    isSettingsLoading: isLoading,
  };
}
