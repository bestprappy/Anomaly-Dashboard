"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { MaintenanceSite } from "@/lib/api";

const PAGE_SIZE = 10;

const CSV_HEADERS = [
  "Site ID",
  "Provider",
  "Company",
  "Type",
  "Amount",
  "Last Maintenance",
] as const;

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(records: MaintenanceSite[]): string {
  const rows = records.map((record) =>
    [
      record.site_id,
      record.provider,
      record.company,
      record.site_type,
      record.bill_amount,
      record.last_maintenance_month,
    ]
      .map(escapeCsvValue)
      .join(",")
  );
  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}

interface MaintenanceRecordsTableProps {
  records: MaintenanceSite[];
  onSiteSelect: (siteId: string) => void;
}

export function MaintenanceRecordsTable({
  records,
  onSiteSelect,
}: MaintenanceRecordsTableProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleRecords = records.slice(0, visibleCount);
  const remainingCount = records.length - visibleRecords.length;

  const handleDownload = () => {
    try {
      // UTF-8 BOM keeps Excel from mangling non-ASCII site names.
      const utf8Bom = String.fromCharCode(0xfeff);
      const blob = new Blob([utf8Bom + buildCsv(records)], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = "maintenance_records.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("[MaintenanceRecordsTable] CSV download failed", error);
    }
  };

  if (records.length === 0) {
    return (
      <div className="card-base p-12 text-center">
        <p className="text-muted-foreground">No maintenance records found</p>
      </div>
    );
  }

  return (
    <div className="card-base overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
        <p className="text-sm text-muted-foreground">
          Showing {visibleRecords.length} of {records.length} records
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className="btn-base btn-secondary"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                Site ID
              </th>
              <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                Provider
              </th>
              <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                Company
              </th>
              <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                Type
              </th>
              <th className="px-6 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">
                Amount
              </th>
              <th className="px-6 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">
                Last Maintenance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleRecords.map((site, idx) => (
              <tr key={idx} className="hover:bg-surface/50 transition-colors">
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => onSiteSelect(site.site_id)}
                    title={`View trend for ${site.site_id}`}
                    className="cursor-pointer rounded font-mono text-xs font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {site.site_id}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{site.provider}</td>
                <td className="px-6 py-4 text-sm font-medium">{site.company}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {site.site_type}
                </td>
                <td className="px-6 py-4 text-right font-bold text-primary">
                  {site.bill_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {site.last_maintenance_month}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remainingCount > 0 && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-primary outline-none transition-colors hover:bg-surface/50 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
            Show more ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
