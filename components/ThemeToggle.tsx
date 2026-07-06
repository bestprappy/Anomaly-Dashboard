"use client";

import { useAtom } from "jotai";
import { themeAtom } from "@/lib/atoms";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="btn-base btn-ghost"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}
