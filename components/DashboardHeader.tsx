"use client";

import { useAtom } from "jotai";
import { filterProviderAtom, filterCompanyAtom } from "@/lib/atoms";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Upload, Bell } from "lucide-react";

interface DashboardHeaderProps {
  onUploadClick?: () => void;
  isReady?: boolean;
}

export function DashboardHeader({ onUploadClick, isReady }: DashboardHeaderProps) {
  const [filterProvider, setFilterProvider] = useAtom(filterProviderAtom);
  const [filterCompany, setFilterCompany] = useAtom(filterCompanyAtom);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-border/40 bg-surface/30 pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={filterProvider}
            onChange={(e) =>
              setFilterProvider(e.target.value as "all" | "PEA" | "MEA")
            }
            className="rounded-lg border border-border/40 bg-surface/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
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
            className="rounded-lg border border-border/40 bg-surface/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Companies</option>
            <option value="BFKT">BFKT</option>
            <option value="TUC">TUC</option>
            <option value="TMV">TMV</option>
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 transition">
            <Bell className="h-5 w-5 text-slate-400" />
          </button>

          {isReady && onUploadClick && (
            <button
              onClick={onUploadClick}
              className="rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30 px-4 py-2 text-sm font-semibold text-purple-300 transition flex items-center gap-2 shadow-lg"
              title="Re-upload different files"
            >
              <Upload className="h-4 w-4" />
              Change Files
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
