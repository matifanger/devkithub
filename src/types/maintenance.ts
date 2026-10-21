export type MaintenanceJob = "disk" | "cleanup" | "delete";
export interface MaintenanceProgress {
  job: MaintenanceJob;
  visited: number;
  bytes: number;
  current: string;
}
export interface DiskItem {
  path: string;
  name: string;
  bytes: number;
  files: number;
  kind: "file" | "folder";
}
export interface DiskScan {
  root: string;
  bytes: number;
  files: number;
  skipped: number;
  limited: boolean;
  cancelled: boolean;
  items: DiskItem[];
  largest: DiskItem[];
  scannedAt: string;
}
export interface CleanupGroup {
  id: string;
  label: string;
  root: string;
  bytes: number;
  files: number;
  skipped: number;
  samples: { path: string; bytes: number }[];
  unavailable?: string;
}
export interface CleanupScan {
  id: string;
  groups: CleanupGroup[];
  scannedAt: string;
  cancelled: boolean;
  limited: boolean;
}
export interface CleanupResult {
  deleted: number;
  bytes: number;
  skipped: number;
  cancelled: boolean;
  errors: string[];
}
export interface StartupEntry {
  id: string;
  name: string;
  command: string;
  source: string;
  enabled: boolean;
  manageable: boolean;
  reason?: string;
}
export interface SystemOverview {
  platform: string;
  hostname: string;
  release: string;
  totalMemory: number;
  freeMemory: number;
  drives: { name: string; total: number; free: number }[];
  driveError?: string;
}
export interface MaintenanceApi {
  overview(): Promise<SystemOverview>;
  analyzeDisk(): Promise<DiskScan | null>;
  scanCleanup(): Promise<CleanupScan>;
  clean(scanId: string, groupIds: string[]): Promise<CleanupResult | null>;
  cancel(): Promise<void>;
  reveal(path: string): Promise<void>;
  startupList(): Promise<StartupEntry[]>;
  startupToggle(id: string, enabled: boolean): Promise<StartupEntry[]>;
  openStartupSettings(): Promise<void>;
  onProgress(callback: (progress: MaintenanceProgress) => void): () => void;
}
