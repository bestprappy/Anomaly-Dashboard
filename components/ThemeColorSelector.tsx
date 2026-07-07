"use client";

import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
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

  return (
    <section className="border-t border-border/40 px-3 py-5" aria-labelledby="theme-color-title">
      <div className="mb-3 px-1">
        <h2 id="theme-color-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Theme Color
        </h2>
      </div>

      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Theme color presets">
        {ACCENT_THEMES.map((theme) => {
          const isSelected = accentTheme === theme;

          return (
            <Button
              key={theme}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${THEME_LABELS[theme]} theme`}
              aria-pressed={isSelected}
              title={THEME_LABELS[theme]}
              onClick={() => setAccentTheme(theme)}
              className={cn(
                "h-9 w-9 rounded-md border border-border/60 p-0",
                isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30"
              )}
            >
              <span
                className="h-4 w-4 rounded-full border border-foreground/15"
                style={{ backgroundColor: THEME_SWATCHES[theme] }}
                aria-hidden="true"
              />
            </Button>
          );
        })}
      </div>
    </section>
  );
}
