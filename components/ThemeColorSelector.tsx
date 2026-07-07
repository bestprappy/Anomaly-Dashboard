"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";
import { Check, Palette } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ACCENT_THEMES, AccentTheme, accentThemeAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";

const THEME_LABELS: Record<AccentTheme, string> = {
  purple: "Purple",
  blue: "Blue",
  emerald: "Emerald",
  rose: "Rose",
  amber: "Amber",
};

const THEME_SWATCHES: Record<AccentTheme, string> = {
  purple: "var(--theme-swatch-purple)",
  blue: "var(--theme-swatch-blue)",
  emerald: "var(--theme-swatch-emerald)",
  rose: "var(--theme-swatch-rose)",
  amber: "var(--theme-swatch-amber)",
};

export function ThemeColorSelector() {
  const [accentTheme, setAccentTheme] = useAtom(accentThemeAtom);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = ACCENT_THEMES.indexOf(accentTheme);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      optionRefs.current[selectedIndex]?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, selectedIndex]);

  const selectTheme = useCallback(
    (theme: AccentTheme) => {
      setAccentTheme(theme);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [setAccentTheme]
  );

  const moveFocus = (index: number) => {
    optionRefs.current[index]?.focus();
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    theme: AccentTheme
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus((index + 1) % ACCENT_THEMES.length);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus((index - 1 + ACCENT_THEMES.length) % ACCENT_THEMES.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveFocus(ACCENT_THEMES.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTheme(theme);
    }
  };

  return (
    <section className="border-t border-border/40 px-3 py-4">
      <Popover open={open} onOpenChange={setOpen} className="w-full">
        <PopoverTrigger
          ref={triggerRef}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 w-full justify-start border-border/60 bg-surface/35 px-3 text-sidebar-foreground hover:bg-surface/70"
          )}
        >
          <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Theme</span>
          <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {THEME_LABELS[accentTheme]}
            <span
              className="h-3 w-3 rounded-full border border-foreground/15"
              style={{ backgroundColor: THEME_SWATCHES[accentTheme] }}
              aria-hidden="true"
            />
          </span>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          className="w-full min-w-56"
          aria-label="Theme color presets"
        >
          <div role="radiogroup" aria-label="Theme color presets" className="space-y-1">
            {ACCENT_THEMES.map((theme, index) => {
              const isSelected = accentTheme === theme;

              return (
                <Button
                  key={theme}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  type="button"
                  variant="ghost"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => selectTheme(theme)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index, theme)}
                  className={cn(
                    "h-10 w-full justify-start px-2 text-sm",
                    isSelected && "bg-primary/10 text-primary"
                  )}
                >
                  <span
                    className="h-4 w-4 rounded-full border border-foreground/15"
                    style={{ backgroundColor: THEME_SWATCHES[theme] }}
                    aria-hidden="true"
                  />
                  <span>{THEME_LABELS[theme]}</span>
                  {isSelected ? (
                    <Check className="ml-auto h-4 w-4" aria-hidden="true" />
                  ) : null}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
}
