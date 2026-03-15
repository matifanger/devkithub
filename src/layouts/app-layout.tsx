import { PanelLeft, User } from "lucide-react";
import React, { createContext, useContext, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AppSidebar } from "../components/app-sidebar";
import { Button } from "../components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "../components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useAuth } from "../contexts/auth-context";
import { USE_CUSTOM_NAVBAR } from "../constants/navbar-config";
import { TopNavbar } from "../components/top-navbar";

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

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!isCollapsed) return null;

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-14 left-4 z-50 h-10 w-10 rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-accent"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Expand sidebar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AppContent() {
  const { toggleSidebar } = useSidebar();
  const { isAuthenticated, needsValidation } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isStandalone =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("standalone") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (needsValidation) {
    return <Navigate to="/validate-license" />;
  }

  return (
    <ProfileModalContext.Provider value={{ isProfileOpen, setIsProfileOpen }}>
      <SidebarToggle />
      {USE_CUSTOM_NAVBAR && (
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <TopNavbar onToggleSidebar={toggleSidebar} />
        </div>
      )}
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 h-screen">
          {USE_CUSTOM_NAVBAR && (
            <div className="flex-shrink-0">
              <TopNavbar onToggleSidebar={toggleSidebar} />
            </div>
          )}
          <main className="flex-1 overflow-auto">
            <div className="relative w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ProfileModalContext.Provider>
  );
}

export function AppLayout() {
  const isStandalone =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("standalone") === "true";

  return (
    <SidebarProvider defaultOpen={!isStandalone}>
      <AppContent />
    </SidebarProvider>
  );
}
