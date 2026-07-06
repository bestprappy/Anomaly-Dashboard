"use client";

import { useState } from "react";
import { Duplicates } from "@/lib/api";
import { ChevronDown, AlertCircle, Copy } from "lucide-react";

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
      icon: AlertCircle,
      severity: "warning",
      items: duplicates.malformed_site_ids.slice(0, 10),
    },
    {
      id: "duplicates",
      label: "Duplicate Sites",
      count: duplicates.duplicate_count,
      icon: Copy,
      severity: "info",
      items: duplicates.duplicate_site_ids.slice(0, 10),
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="card-base overflow-hidden">
            <button
              onClick={() =>
                setExpanded(expanded === item.id ? null : item.id)
              }
              className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-left">
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                <div>
                  <h4 className="font-semibold text-foreground">{item.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.count} found
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  expanded === item.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {expanded === item.id && (
              <div className="border-t border-border divide-y divide-border">
                {item.id === "malformed" ? (
                  duplicates.malformed_site_ids.length > 0 ? (
                    duplicates.malformed_site_ids.map((siteId, idx) => (
                      <div key={idx} className="p-4 bg-surface/30">
                        <code className="text-sm font-mono text-primary">
                          {siteId}
                        </code>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No malformed site IDs
                    </div>
                  )
                ) : duplicates.duplicate_site_ids.length > 0 ? (
                  duplicates.duplicate_site_ids.map((dup, idx) => (
                    <div key={idx} className="p-4 bg-surface/30">
                      <div className="mb-3">
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {dup.Site_ID}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dup.occurrences} occurrences
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dup.providers.length > 0 && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                            {dup.providers.join(", ")}
                          </span>
                        )}
                        {dup.companies.length > 0 && (
                          <span className="inline-flex items-center rounded-md bg-info/10 px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                            {dup.companies.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No duplicate sites found
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
