import React from "react";

// Compatibility for extensions written before all tools became free.
export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function useUpgradeModal() {
  return { isOpen: false, isPro: true, setIsPro: (_value: boolean) => {}, openModal: () => {}, closeModal: () => {} };
}
