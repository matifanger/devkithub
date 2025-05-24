import { useEffect, useState } from 'react';
import { UpdateStatus } from '../../types/profile';
import { loadUpdatePreference, saveUpdatePreference } from '../../utils/profile/settings-utils';
import { checkForUpdates, downloadUpdate, viewChangelog } from '../../utils/profile/update-utils';

export function useUpdateManagement(modalOpen: boolean) {
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    hasUpdate: false,
    latestVersion: '',
    currentVersion: '',
    isLoading: true,
    error: null,
  });

  // Load update preference on mount
  useEffect(() => {
    async function loadPreference() {
      const enabled = await loadUpdatePreference();
      setUpdatesEnabled(enabled);
    }
    loadPreference();
  }, []);

  // Check for updates when modal opens
  useEffect(() => {
    async function performUpdateCheck() {
      if (!modalOpen) return;

      setUpdateStatus((prev) => ({ ...prev, isLoading: true, error: null }));
      const status = await checkForUpdates();
      setUpdateStatus(status);
    }

    performUpdateCheck();
  }, [modalOpen]);

  const handleUpdatePreferenceChange = async (checked: boolean) => {
    setUpdatesEnabled(checked);
    await saveUpdatePreference(checked);
    console.log('Update preference changed to:', checked);
  };

  const handleDownloadUpdate = () => {
    downloadUpdate();
  };

  const handleViewChangelog = () => {
    viewChangelog();
  };

  return {
    updatesEnabled,
    updateStatus,
    handleUpdatePreferenceChange,
    handleDownloadUpdate,
    handleViewChangelog,
  };
}
