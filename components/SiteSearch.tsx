"use client";

import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { selectedSiteIdAtom, filterProviderAtom } from "@/lib/atoms";
import { api } from "@/lib/api";
import { Search, X } from "lucide-react";

export function SiteSearch() {
  const [selectedSiteId, setSelectedSiteId] = useAtom(selectedSiteIdAtom);
  const [filterProvider] = useAtom(filterProviderAtom);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const provider =
          filterProvider !== "all" ? filterProvider : undefined;
        const result = await api.getSites(provider);
        const filtered = result.site_ids.filter((id) =>
          id.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch sites:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query, filterProvider]);

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
    <div className="relative">
      <div className="relative flex items-center rounded-lg border border-border bg-card">
        <Search className="ml-3 h-5 w-5 text-muted-foreground" />
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
          className="flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="mr-2 rounded p-1 hover:bg-surface"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="divide-y divide-border">
              {suggestions.map((siteId) => (
                <button
                  key={siteId}
                  onClick={() => handleSelect(siteId)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface"
                >
                  {siteId}
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No sites found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
