"use client";

import { useState } from "react";
import { Duplicates } from "@/lib/api";
import { ChevronDown } from "lucide-react";

interface DataQualityTableProps {
  duplicates: Duplicates;
}

export function DataQualityTable({ duplicates }: DataQualityTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = [
    {
      id: "malformed",
      label: "Malformed Site IDs",
      count: duplicates.malformed_count,
      items: duplicates.malformed_site_ids.slice(0, 10),
    },
    {
      id: "duplicates",
      label: "Duplicate Sites",
      count: duplicates.duplicate_count,
      items: duplicates.duplicate_site_ids.slice(0, 10),
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-card">
          <button
            onClick={() =>
              setExpanded(expanded === item.id ? null : item.id)
            }
            className="w-full flex items-center justify-between border-b border-border p-4 hover:bg-surface"
          >
            <div className="text-left">
              <h4 className="font-semibold">{item.label}</h4>
              <p className="text-sm text-muted-foreground">
                {item.count} found
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition ${
                expanded === item.id ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded === item.id && (
            <div className="divide-y divide-border">
              {item.id === "malformed" ? (
                duplicates.malformed_site_ids.map((siteId, idx) => (
                  <div key={idx} className="p-4">
                    <code className="text-sm text-muted-foreground">
                      {siteId}
                    </code>
                  </div>
                ))
              ) : (
                duplicates.duplicate_site_ids.map((dup, idx) => (
                  <div key={idx} className="p-4">
                    <div className="mb-2">
                      <p className="font-mono text-sm font-semibold">
                        {dup.Site_ID}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dup.occurrences} occurrences
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {dup.providers.length > 0 && (
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          {dup.providers.join(", ")}
                        </span>
                      )}
                      {dup.companies.length > 0 && (
                        <span className="rounded-full bg-info/10 px-2 py-1 text-xs text-info">
                          {dup.companies.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
