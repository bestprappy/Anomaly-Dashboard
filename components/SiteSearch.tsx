"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import {
  selectedSiteIdAtom,
  filterProviderAtom,
  siteSearchAtom,
} from "@/lib/atoms";
import { useSites } from "@/lib/useSites";
import { Search, X } from "lucide-react";

const MAX_SUGGESTIONS = 10;

export const SITE_SEARCH_INPUT_ID = "site-search-input";
const LISTBOX_ID = "site-search-listbox";
const optionId = (index: number) => `site-search-option-${index}`;

export function SiteSearch() {
  const [, setSelectedSiteId] = useAtom(selectedSiteIdAtom);
  const [filterProvider] = useAtom(filterProviderAtom);
  // Shared atom so external pickers (example chips, maintenance table) can
  // reflect their selection in this input without effect-based syncing.
  const [query, setQuery] = useAtom(siteSearchAtom);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const provider = filterProvider !== "all" ? filterProvider : undefined;
  const { data, isLoading, error } = useSites(provider);

  const totalCount = data?.site_ids.length ?? 0;

  const { suggestions, matchCount } = useMemo(() => {
    const ids = data?.site_ids ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return {
        suggestions: ids.slice(0, MAX_SUGGESTIONS),
        matchCount: ids.length,
      };
    }
    const matches = ids.filter((id) =>
      id.toLowerCase().includes(normalizedQuery)
    );
    return {
      suggestions: matches.slice(0, MAX_SUGGESTIONS),
      matchCount: matches.length,
    };
  }, [data?.site_ids, query]);

  // Clamp instead of resetting via an effect: if the list shrank under the
  // highlighted row, the highlight simply disappears.
  const safeActiveIndex =
    activeIndex >= 0 && activeIndex < suggestions.length ? activeIndex : -1;

  useEffect(() => {
    if (safeActiveIndex < 0) return;
    document
      .getElementById(optionId(safeActiveIndex))
      ?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex]);

  const handleSelect = (siteId: string) => {
    setSelectedSiteId(siteId);
    setQuery(siteId);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setSelectedSiteId(null);
    setQuery("");
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (suggestions.length > 0) {
        setActiveIndex((safeActiveIndex + 1) % suggestions.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (suggestions.length > 0) {
        setActiveIndex(
          safeActiveIndex <= 0 ? suggestions.length - 1 : safeActiveIndex - 1
        );
      }
    } else if (event.key === "Enter") {
      if (open && safeActiveIndex >= 0 && suggestions[safeActiveIndex]) {
        event.preventDefault();
        handleSelect(suggestions[safeActiveIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  return (
    <>
      <div className="relative flex-1">
        <div className="relative flex items-center rounded-md border border-border bg-surface/50 focus-within:ring-1 focus-within:ring-primary/30">
          <Search className="ml-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            id={SITE_SEARCH_INPUT_ID}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={LISTBOX_ID}
            aria-autocomplete="list"
            aria-activedescendant={
              safeActiveIndex >= 0 ? optionId(safeActiveIndex) : undefined
            }
            placeholder={
              totalCount > 0
                ? `Search ${totalCount.toLocaleString()} site IDs...`
                : "Search site ID..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
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

        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-md border border-border bg-card shadow-lifted">
            {isLoading ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Loading sites...
              </p>
            ) : error ? (
              <p role="alert" className="px-4 py-3 text-sm text-destructive">
                Could not load the site list.{" "}
                {error instanceof Error ? error.message : ""}
              </p>
            ) : suggestions.length > 0 ? (
              <>
                <p className="border-b border-border bg-surface/50 px-4 py-2 text-xs text-muted-foreground">
                  {query.trim()
                    ? `${matchCount.toLocaleString()} ${matchCount === 1 ? "match" : "matches"}`
                    : `${totalCount.toLocaleString()} sites · type to filter`}
                  {matchCount > MAX_SUGGESTIONS
                    ? ` · showing first ${MAX_SUGGESTIONS}`
                    : ""}
                </p>
                <div
                  role="listbox"
                  id={LISTBOX_ID}
                  aria-label="Site suggestions"
                  className="max-h-64 divide-y divide-border overflow-y-auto"
                >
                  {suggestions.map((siteId, index) => (
                    <button
                      key={siteId}
                      id={optionId(index)}
                      role="option"
                      aria-selected={index === safeActiveIndex}
                      onClick={() => handleSelect(siteId)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        index === safeActiveIndex
                          ? "bg-surface/70"
                          : "hover:bg-surface/50"
                      }`}
                    >
                      <span className="font-mono text-primary">{siteId}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                {totalCount === 0
                  ? "No sites available"
                  : `No sites match "${query.trim()}"`}
              </p>
            )}
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
