import { Theme } from "../../utils/themes";
import { ActivateLicenseResponse } from "../types";

export interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: ActivateLicenseResponse | string | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export interface NotificationDialog {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
}

export interface ConfirmationDialog {
  open: boolean;
  themeId: string;
  themeName: string;
}

export interface UpdateStatus {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  isLoading: boolean;
  error: string | null;
  releaseNotes?: string;
}

export interface ThemeManagerState {
  open: boolean;
  editingTheme: Theme | null;
}
