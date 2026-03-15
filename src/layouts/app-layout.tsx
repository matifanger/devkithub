import { Home, PanelLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from '../components/app-sidebar';
import { Button } from '../components/ui/button';
import { SidebarInset, SidebarProvider, useSidebar } from '../components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useAuth } from '../contexts/auth-context';

function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!isCollapsed) return null;

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-50 h-10 w-10 rounded-md border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-accent"
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

export function AppLayout() {
  const { isAuthenticated, needsValidation } = useAuth();
  const isStandalone = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('standalone') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (needsValidation) {
    return <Navigate to="/validate-license" />;
  }

  return (
    <SidebarProvider defaultOpen={!isStandalone}>
      <SidebarToggle />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex w-full overflow-auto">
            <div className="relative w-full">
              <div className="absolute top-6 w-fit h-fit z-10 custom-right container">
                <style>{` 
                  .custom-right {
                    right: 30px; /* Default (right-10) */
                  }
                  @media (min-width: 1024px) {
                    .custom-right {
                      right: 30px; /* lg:right-14 */
                    }
                  }
                  @media (min-width: 1750px) {
                    .custom-right {
                      right: 30px;
                    }
                  }
                  @media (min-width: 1830px) {
                    .custom-right {
                      right: 55px;
                    }
                  }
                    @media (min-width: 1920px) {
                    .custom-right {
                      right: 85px;
                    }
                  }
                `}</style>
                {useLocation().pathname !== '/' && (
                  <TooltipProvider delayDuration={50}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link to="/" className="w-fit h-fit">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 p-0 rounded-full"
                          >
                            <Home className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="mb-2">
                        <p>Back to homepage</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
