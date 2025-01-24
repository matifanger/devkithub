import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  src?: string
  className?: string
}

export function CopyButton({
  value,
  className,
  src,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [hasCopied])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "relative h-6 w-6 text-muted-foreground hover:bg-muted hover:text-foreground",
              className
            )}
            onClick={() => {
              if (typeof window === "undefined") return
              setHasCopied(true)
              void window.navigator.clipboard.writeText(value)
            }}
            {...props}
          >
            <span className="sr-only">Copy {src}</span>
            {hasCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{hasCopied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 