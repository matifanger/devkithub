import os from 'os';

export function getSimpleHwid() {
  try {
    const hostname = os.hostname();
    // console.log('Hostname:', hostname);

    const networkInterfaces = os.networkInterfaces();
    // console.log('Network Interfaces:', networkInterfaces);

    const mac =
      Object.values(networkInterfaces)
        .flat()
        .find((iface) => iface.mac && iface.mac !== '00:00:00:00:00:00')?.mac || 'unknown';
    // console.log('Selected MAC:', mac);

    const rawId = `${hostname}-${mac}`;
    // console.log('Raw HWID:', rawId);

    return rawId;
  } catch (error) {
    // console.error('Error generating simple HWID:', error);
    return `unknown-${Math.random().toString(36).substring(2, 10)}`;
  }
}
