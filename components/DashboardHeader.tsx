"use client";

import { ThemeToggle } from "./ThemeToggle";
import { Upload } from "lucide-react";

interface DashboardHeaderProps {
  onUploadClick?: () => void;
  isReady?: boolean;
}

export function DashboardHeader({ onUploadClick, isReady }: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-64 right-0 z-40 border-b border-border bg-card backdrop-blur-sm smooth-transition">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Billing Analytics</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isReady && onUploadClick && (
            <button
              onClick={onUploadClick}
              className="btn-base btn-primary hidden sm:flex"
              title="Re-upload different files"
            >
              <Upload className="h-4 w-4" />
              <span>Change Files</span>
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
