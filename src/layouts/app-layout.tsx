import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { TopNavbar } from "../components/top-navbar";
import { ProfileModal } from "../components/profile-modal";
import { loadThemePreferences } from "../utils/profile/settings-utils";
import { getSelectedThemeObject } from "../utils/profile/theme-utils";
import { applyTheme } from "../utils/themes";
import { useTheme } from "next-themes";

interface ProfileModalContextType {
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
}

const ProfileModalContext = createContext<ProfileModalContextType>({
  isProfileOpen: false,
  setIsProfileOpen: () => {},
});

export function useProfileModal() {
  return useContext(ProfileModalContext);
}

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const {
          selectedTheme,
          customThemes,
          themeMode: savedMode,
        } = await loadThemePreferences();

        if (savedMode) {
          setTheme(savedMode);
        }

        let themeObj = getSelectedThemeObject(selectedTheme, customThemes);

        if (!themeObj) {
          themeObj = getSelectedThemeObject("purple-default", customThemes);
        }

        if (themeObj) {
          const mode = savedMode || "light";
          applyTheme(themeObj, mode);
        }
      } catch {
        setTheme("light");
        const defaultTheme = getSelectedThemeObject("purple-default", []);
        if (defaultTheme) {
          applyTheme(defaultTheme, "light");
        }
      }
    };
    loadTheme();
  }, [setTheme]);

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, needsValidation, userData } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (needsValidation) {
    return <Navigate to="/validate-license" />;
  }

  return (
    <ProfileModalContext.Provider value={{ isProfileOpen, setIsProfileOpen }}>
      <div className="flex flex-col h-screen">
        <TopNavbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ProfileModal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        userData={userData}
      />
    </ProfileModalContext.Provider>
  );
}

export function AppLayout() {
  return (
    <ThemeLoader>
      <AppContent />
    </ThemeLoader>
  );
}
