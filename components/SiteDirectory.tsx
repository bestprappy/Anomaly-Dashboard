"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { Building2 } from "lucide-react";
import { filterProviderAtom, selectedSiteIdAtom } from "@/lib/atoms";
import { useSites } from "@/lib/useSites";

interface SiteDirectoryProps {
  onSelect: (siteId: string) => void;
}

const PAGE_SIZE = 48;

export function SiteDirectory({ onSelect }: SiteDirectoryProps) {
  const [filterProvider] = useAtom(filterProviderAtom);
  const [selectedSiteId] = useAtom(selectedSiteIdAtom);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const provider = filterProvider !== "all" ? filterProvider : undefined;
  const { data, isLoading, error } = useSites(provider);

  const siteIds = data?.site_ids ?? [];
  const visible = siteIds.slice(0, visibleCount);
  const remaining = siteIds.length - visible.length;

  return (
    <div className="card-base p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-lg font-semibold leading-tight text-foreground">
              All Sites
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Click a site to view its trend
            </p>
          </div>
        </div>
        {siteIds.length > 0 && (
          <span className="text-xs tabular-nums text-muted-foreground">
            {siteIds.length.toLocaleString()} sites
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading sites...
        </p>
      ) : error ? (
        <p role="alert" className="py-10 text-center text-sm text-destructive">
          Could not load the site list.{" "}
          {error instanceof Error ? error.message : ""}
        </p>
      ) : siteIds.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No sites available
        </p>
      ) : (
        <>
          <ul
            role="list"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {visible.map((siteId) => {
              const isSelected = siteId === selectedSiteId;
              return (
                <li key={siteId}>
                  <button
                    type="button"
                    onClick={() => onSelect(siteId)}
                    aria-current={isSelected ? "true" : undefined}
                    title={`View trend for ${siteId}`}
                    className={`w-full cursor-pointer truncate rounded-md border px-2.5 py-2 text-center font-mono text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      isSelected
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border bg-surface/50 text-foreground hover:border-primary/40 hover:bg-surface hover:text-primary"
                    }`}
                  >
                    {siteId}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-muted-foreground">
              Showing {visible.length.toLocaleString()} of{" "}
              {siteIds.length.toLocaleString()}
            </p>
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="btn-base btn-secondary"
              >
                Load {Math.min(PAGE_SIZE, remaining).toLocaleString()} more
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
