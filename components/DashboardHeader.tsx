"use client";

import { useAtom } from "jotai";
import { filterProviderAtom, filterCompanyAtom } from "@/lib/atoms";
import { ThemeToggle } from "./ThemeToggle";
import { BarChart3 } from "lucide-react";

export function DashboardHeader() {
  const [filterProvider, setFilterProvider] = useAtom(filterProviderAtom);
  const [filterCompany, setFilterCompany] = useAtom(filterCompanyAtom);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Billing EDA Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              value={filterProvider}
              onChange={(e) =>
                setFilterProvider(e.target.value as "all" | "PEA" | "MEA")
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
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
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Companies</option>
              <option value="BFKT">BFKT</option>
              <option value="TUC">TUC</option>
              <option value="TMV">TMV</option>
            </select>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
