import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface SaveStatusIndicatorProps {
  isSaving: boolean;
  lastSavedAt: number | null;
  visible?: boolean;
}

export function SaveStatusIndicator({
  isSaving,
  lastSavedAt,
  visible = true,
}: SaveStatusIndicatorProps) {
  const [show, setShow] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!visible) return;

    if (isSaving || lastSavedAt) {
      setShow(true);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (!isSaving && !isHovered) {
        timerRef.current = setTimeout(() => setShow(false), 3000);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSaving, lastSavedAt, visible, isHovered]);

  React.useEffect(() => {
    if (isHovered && timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!isHovered && !isSaving && show) {
      timerRef.current = setTimeout(() => setShow(false), 3000);
    }
  }, [isHovered, isSaving, show]);

  if (!visible || !show) return null;

  const timeStr = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString()
    : "";

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute top-2 right-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-300",
              isSaving
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-green-500/10 text-green-600 dark:text-green-400",
              show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                <span>Saved</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isSaving
            ? "Auto-saving your changes..."
            : lastSavedAt
              ? `Last saved at ${timeStr}. Auto-save is enabled and your work is persisted automatically.`
              : "Auto-save is enabled"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
