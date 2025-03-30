import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/app-sidebar';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import { useAuth } from '../contexts/auth-context';

export function AppLayout() {
  const { isAuthenticated, needsValidation } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (needsValidation) {
    return <Navigate to="/validate-license" />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <main className="flex w-full overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
