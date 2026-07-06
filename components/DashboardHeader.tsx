"use client";

import { useAtom } from "jotai";
import { filterProviderAtom, filterCompanyAtom } from "@/lib/atoms";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Upload, Bell, BarChart3 } from "lucide-react";

interface DashboardHeaderProps {
  onUploadClick?: () => void;
  isReady?: boolean;
}

export function DashboardHeader({ onUploadClick, isReady }: DashboardHeaderProps) {
  const [filterProvider, setFilterProvider] = useAtom(filterProviderAtom);
  const [filterCompany, setFilterCompany] = useAtom(filterCompanyAtom);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-card backdrop-blur-sm smooth-transition">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Billing Analytics</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl mx-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="input-base w-full pl-10 pr-4"
            />
          </div>

          <select
            value={filterProvider}
            onChange={(e) =>
              setFilterProvider(e.target.value as "all" | "PEA" | "MEA")
            }
            className="input-base px-3"
          >
            <option value="all">All Providers</option>
            <option value="PEA">PEA</option>
            <option value="MEA">MEA</option>
          </select>

          <select
            value={filterCompany}
            onChange={(e) =>
              setFilterCompany(
                e.target.value as "all" | "BFKT" | "TUC" | "TMV"
              )
            }
            className="input-base px-3"
          >
            <option value="all">All Companies</option>
            <option value="BFKT">BFKT</option>
            <option value="TUC">TUC</option>
            <option value="TMV">TMV</option>
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="btn-base btn-ghost" title="Notifications">
            <Bell className="h-5 w-5" />
          </button>

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
