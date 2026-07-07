"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { selectedSiteIdAtom, filterProviderAtom } from "@/lib/atoms";
import { api } from "@/lib/api";
import { Search, X } from "lucide-react";

export function SiteSearch() {
  const [, setSelectedSiteId] = useAtom(selectedSiteIdAtom);
  const [filterProvider] = useAtom(filterProviderAtom);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const provider = filterProvider !== "all" ? filterProvider : undefined;
  const { data } = useQuery({
    queryKey: ["sites", provider],
    queryFn: () => api.getSites(provider),
    enabled: query.length >= 2,
  });

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    const normalizedQuery = query.toLowerCase();
    return (data?.site_ids ?? [])
      .filter((id) => id.toLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [data?.site_ids, query]);

  const handleSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    setQuery(siteId);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedSiteId(null);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="relative flex-1">
        <div className="relative flex items-center rounded-md border border-border bg-surface/50 focus-within:ring-1 focus-within:ring-primary/30">
          <Search className="ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search site ID..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={handleClear}
              className="mr-2 rounded p-1.5 hover:bg-surface transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lifted">
            <div className="divide-y divide-border">
              {suggestions.map((siteId) => (
                <button
                  key={siteId}
                  onClick={() => handleSelect(siteId)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-surface/50 transition-colors"
                >
                  <span className="font-mono text-primary">{siteId}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close search when clicking outside */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
