"use client";

import { useAtom } from "jotai";
import { useEffect } from "react";
import { themeAtom } from "@/lib/atoms";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useAtom(themeAtom);

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored || (prefersDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <>{children}</>;
}

function applyTheme(theme: "light" | "dark") {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}
