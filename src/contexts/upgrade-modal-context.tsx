import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./auth-context";

interface UpgradeModalContextType {
  isOpen: boolean;
  isPro: boolean;
  setIsPro: (value: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(
  undefined,
);

export function UpgradeModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useAuth();
  const isPro = userData?.valid === true;

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  return (
    <UpgradeModalContext.Provider
      value={{ isOpen, isPro, setIsPro: () => {}, openModal, closeModal }}
    >
      {children}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return context;
}
