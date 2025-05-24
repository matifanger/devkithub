import axios from 'axios';
import { UpdateStatus } from '../../types/profile';
import { getBaseApiUrl } from '../environment';

export async function checkForUpdates(): Promise<UpdateStatus> {
  try {
    const baseApiUrl = await getBaseApiUrl();
    const response = await axios.get(baseApiUrl + '/api/version');
    const latestVersion = response.data.version;
    const currentVersion = await window.electron.env.get('npm_package_version');

    const hasUpdate = latestVersion !== currentVersion;

    return {
      hasUpdate,
      latestVersion,
      currentVersion,
      isLoading: false,
      error: null,
      releaseNotes: response.data.releaseNotes,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return {
      hasUpdate: false,
      latestVersion: '',
      currentVersion: '',
      isLoading: false,
      error: 'Failed to check for updates',
    };
  }
}

export function downloadUpdate() {
  window.electron.openExternal('https://devkithub.com/downloads');
}

export function viewChangelog() {
  window.electron.openExternal('https://devkithub.com/changelog');
}
