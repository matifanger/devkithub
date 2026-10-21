import axios from 'axios';
import { UpdateStatus } from '../../types/profile';
export function isNewerVersion(latest: string, current: string): boolean {
  const parse = (version: string) => version.replace(/^v/, '').split('-')[0].split('.').map(Number);
  const a = parse(latest), b = parse(current);
  if (a.length !== 3 || b.length !== 3 || [...a, ...b].some(n => !Number.isFinite(n))) return false;
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return !latest.includes('-') && current.includes('-');
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  try {
    const response = await axios.get('https://api.github.com/repos/matifanger/devkithub/releases/latest');
    const latestVersion = response.data.tag_name.replace(/^v/, "");
    const currentVersion = await window.electron.env.get('npm_package_version');

    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    return {
      hasUpdate,
      latestVersion,
      currentVersion,
      isLoading: false,
      error: null,
      releaseNotes: response.data.body,
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
  window.electron.openExternal('https://github.com/matifanger/devkithub/releases/latest');
}

export function viewChangelog() {
  window.electron.openExternal('https://github.com/matifanger/devkithub/releases');
}
