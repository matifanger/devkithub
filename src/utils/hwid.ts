import { exec } from 'child_process';
import os from 'os';
import util from 'util';

const execPromise = util.promisify(exec);

// Platform detection
const platform = os.platform();

export async function getWindowsHwid() {
  try {
    const { stdout: cpu } = await execPromise('wmic cpu get ProcessorId');
    const { stdout: disk } = await execPromise('wmic diskdrive get SerialNumber');
    const { stdout: baseboard } = await execPromise('wmic baseboard get SerialNumber');

    return {
      cpu: cpu.split('\n')[1]?.trim(),
      disk: disk.split('\n')[1]?.trim(),
      baseboard: baseboard.split('\n')[1]?.trim(),
    };
  } catch (error) {
    console.error('Windows HWID error: ', error);
    return null;
  }
}

export async function getMacOSHwid() {
  try {
    const { stdout } = await execPromise('system_profiler SPHardwareDataType');
    const lines = stdout.split('\n');
    const serial = lines
      .find((line) => line.includes('Serial Number'))
      ?.split(':')[1]
      ?.trim();
    const uuid = lines
      .find((line) => line.includes('Hardware UUID'))
      ?.split(':')[1]
      ?.trim();

    return {
      cpu: uuid, // Using UUID as CPU identifier
      disk: serial,
      baseboard: serial,
    };
  } catch (error) {
    console.error('macOS HWID error:', error);
    return null;
  }
}

export async function getLinuxHwid() {
  try {
    const { stdout: cpu } = await execPromise('cat /proc/cpuinfo | grep "Serial" | head -n 1');
    const { stdout: disk } = await execPromise('lsblk -o SERIAL -n | head -n 1');
    const { stdout: baseboard } = await execPromise('sudo dmidecode -s baseboard-serial-number');

    return {
      cpu: cpu.split(':')[1]?.trim(),
      disk: disk.trim(),
      baseboard: baseboard.trim(),
    };
  } catch (error) {
    console.error('Linux HWID error:', error);
    return null;
  }
}

export async function getHardwareInfo() {
  switch (platform) {
    case 'win32':
      return await getWindowsHwid();
    case 'darwin':
      return await getMacOSHwid();
    case 'linux':
      return await getLinuxHwid();
    default:
      return null;
  }
}
