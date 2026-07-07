"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type PopoverSide = "top" | "bottom";
type PopoverAlign = "start" | "center" | "end";

interface PopoverContextValue {
  contentId: string;
  open: boolean;
  rootRef: React.RefObject<HTMLDivElement | null>;
  setOpen: (nextOpen: boolean | ((currentOpen: boolean) => boolean)) => void;
  triggerId: string;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext(componentName: string) {
  const context = React.useContext(PopoverContext);

  if (!context) {
    throw new Error(`${componentName} must be used inside Popover.`);
  }

  return context;
}

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function Popover({
  children,
  className,
  defaultOpen = false,
  onOpenChange,
  open: controlledOpen,
  ...props
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const reactId = React.useId();
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean | ((currentOpen: boolean) => boolean)) => {
      const resolvedOpen =
        typeof nextOpen === "function" ? nextOpen(open) : nextOpen;

      if (!isControlled) {
        setUncontrolledOpen(resolvedOpen);
      }

      onOpenChange?.(resolvedOpen);
    },
    [isControlled, onOpenChange, open]
  );

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  const value = React.useMemo<PopoverContextValue>(
    () => ({
      contentId: `${reactId}-content`,
      open,
      rootRef,
      setOpen,
      triggerId: `${reactId}-trigger`,
    }),
    [open, reactId, setOpen]
  );

  return (
    <PopoverContext.Provider value={value}>
      <div ref={rootRef} className={cn("relative", className)} {...props}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export type PopoverTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps
>(function PopoverTrigger(
  { children, className, onClick, type = "button", ...props },
  ref
) {
  const { contentId, open, setOpen, triggerId } =
    usePopoverContext("PopoverTrigger");

  return (
    <button
      ref={ref}
      id={triggerId}
      type={type}
      aria-controls={contentId}
      aria-expanded={open}
      aria-haspopup="dialog"
      className={className}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          setOpen((currentOpen) => !currentOpen);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});

export interface PopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: PopoverAlign;
  side?: PopoverSide;
}

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(function PopoverContent(
  { align = "center", children, className, side = "bottom", ...props },
  ref
) {
  const { contentId, open, triggerId } = usePopoverContext("PopoverContent");

  if (!open) return null;

  return (
    <div
      ref={ref}
      id={contentId}
      role="dialog"
      aria-labelledby={triggerId}
      className={cn(
        "absolute z-50 w-max rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-floating outline-none",
        side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
