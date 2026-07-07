"use client";

import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { ACCENT_THEMES, AccentTheme, accentThemeAtom, themeAtom } from "@/lib/atoms";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useAtom(themeAtom);
  const [accentTheme, setAccentTheme] = useAtom(accentThemeAtom);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    applyAccentTheme(accentTheme);
    localStorage.setItem("accent-theme", accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    const stored = parseTheme(localStorage.getItem("theme"));
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");
    const initialAccent = parseAccentTheme(localStorage.getItem("accent-theme")) ?? "purple";

    setTheme(initial);
    applyTheme(initial);

    setAccentTheme(initialAccent);
    applyAccentTheme(initialAccent);

    isInitializedRef.current = true;
  }, [setAccentTheme, setTheme]);

  return <>{children}</>;
}

function parseTheme(value: string | null): "light" | "dark" | null {
  return value === "light" || value === "dark" ? value : null;
}

function parseAccentTheme(value: string | null): AccentTheme | null {
  return ACCENT_THEMES.includes(value as AccentTheme) ? (value as AccentTheme) : null;
}

function applyTheme(theme: "light" | "dark") {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

function applyAccentTheme(theme: AccentTheme) {
  document.documentElement.dataset.accentTheme = theme;
}
