import * as React from "react";
import { cn } from "../lib/utils";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

interface ToolPageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolPageContainer({
  children,
  className,
}: ToolPageContainerProps) {
  return (
    <ScrollArea className="h-[calc(100vh-2.5rem)]">
      <div
        className={cn(
          "container mx-auto p-6 space-y-6 min-h-[calc(100vh-4rem)]",
          className,
        )}
      >
        {children}
      </div>
    </ScrollArea>
  );
}

interface ToolPageHeaderProps {
  title: string;
  description: string;
}

export function ToolPageHeader({ title, description }: ToolPageHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

interface ToolEditorPanelProps {
  label: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  heightClass?: string;
}

export function ToolEditorPanel({
  label,
  actions,
  children,
  heightClass = "h-[calc(100vh-17rem)]",
}: ToolEditorPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
      <div className={heightClass}>{children}</div>
    </div>
  );
}

interface ToolEditorGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolEditorGrid({ children, className }: ToolEditorGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolToolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn("flex flex-wrap gap-4 items-center", className)}>
      {children}
    </div>
  );
}

interface ToolErrorBannerProps {
  error: string;
}

export function ToolErrorBanner({ error }: ToolErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
      {error}
    </div>
  );
}
