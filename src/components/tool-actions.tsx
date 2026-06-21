import * as React from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Button, ButtonProps } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ToolCopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
}

export function ToolCopyButton({
  value,
  label = "Copy",
  className,
  variant = "outline",
  size = "sm",
  ...props
}: ToolCopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(
              "relative transition-all duration-200",
              hasCopied && "border-green-500 text-green-600 dark:text-green-400",
              className,
            )}
            onClick={() => {
              if (typeof window === "undefined" || !value) return;
              setHasCopied(true);
              void window.navigator.clipboard.writeText(value);
              if (window.electron?.showCopyToast) {
                void window.electron.showCopyToast(value);
              }
            }}
            {...props}
          >
            <span
              className={cn(
                "flex items-center gap-1.5 transition-all duration-200",
                hasCopied && "scale-105",
              )}
            >
              {hasCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{hasCopied ? "Copied!" : label}</span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hasCopied ? "Copied to clipboard!" : "Copy to clipboard"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ToolClearButtonProps extends Omit<ButtonProps, "onClick"> {
  onClear: () => void;
  label?: string;
}

export function ToolClearButton({
  onClear,
  label = "Clear",
  className,
  variant = "outline",
  size = "sm",
  ...props
}: ToolClearButtonProps) {
  const [hasCleared, setHasCleared] = React.useState(false);

  React.useEffect(() => {
    if (hasCleared) {
      const timeout = setTimeout(() => setHasCleared(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [hasCleared]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(
              "relative transition-all duration-200",
              hasCleared &&
                "border-orange-500 text-orange-600 dark:text-orange-400",
              className,
            )}
            onClick={() => {
              setHasCleared(true);
              onClear();
            }}
            {...props}
          >
            <span
              className={cn(
                "flex items-center gap-1.5 transition-all duration-200",
                hasCleared && "scale-105",
              )}
            >
              {hasCleared ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{hasCleared ? "Cleared!" : label}</span>
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {hasCleared ? "All cleared!" : "Clear all content"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
