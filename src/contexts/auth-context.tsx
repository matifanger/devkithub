import React from "react";

// Compatibility for existing settings components. Every installation has full
// access, including a fresh install with no credentials and no network.
const access = {
  isAuthenticated: true,
  isLoading: false,
  userData: null as import("../types/types").ActivateLicenseResponse | null,
  needsValidation: false,
  login: async (_key?: string) => ({ success: true }),
  logout: () => {},
  validateStoredLicense: async () => ({ success: true }),
  setDevAuthenticated: (_value: boolean) => {},
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return access;
}
