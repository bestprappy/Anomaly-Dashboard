"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Check, AlertCircle, X } from "lucide-react";
import { api, UploadStatus } from "@/lib/api";

const FILE_FIELDS = [
  { key: "pea_bfkt", label: "PEA BFKT", required: false },
  { key: "pea_tuc", label: "PEA TUC", required: false },
  { key: "mea_bfkt", label: "MEA BFKT", required: false },
  { key: "mea_tuc", label: "MEA TUC", required: false },
  { key: "mea_tmv", label: "MEA TMV", required: false },
];

interface UploadWidgetProps {
  onUploadComplete: (status: UploadStatus) => void;
  onClear?: () => void;
  initialStatus: UploadStatus;
}

export function UploadWidget({
  onUploadComplete,
  onClear,
  initialStatus,
}: UploadWidgetProps) {
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = useCallback(
    (key: string, file: File | null) => {
      setFiles((prev) => ({ ...prev, [key]: file }));
      setError(null);
    },
    []
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, key: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(key, file);
  };

  const handleUpload = async () => {
    const selectedFiles = Object.fromEntries(
      Object.entries(files).filter(([, file]) => file !== null)
    );

    if (Object.keys(selectedFiles).length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const status = await api.uploadFiles(selectedFiles);
      setFiles({});
      onUploadComplete(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const loaded = initialStatus.loaded_files.length;
  const missing = initialStatus.missing_files.length;
  const total = loaded + missing;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Upload Billing Files</h3>
            {loaded > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {loaded}/{total} files loaded
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {loaded}/{total} files
              </span>
              {loaded > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              )}
            </div>
            {loaded > 0 && (
              <button
                onClick={() => {
                  setFiles({});
                  setError(null);
                  onClear?.();
                }}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50"
                title="Clear uploads and start over"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {initialStatus.message && (
          <p className="mb-4 text-sm text-muted-foreground">
            {initialStatus.message}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {FILE_FIELDS.map(({ key, label }) => {
            const isLoaded = initialStatus.loaded_files.includes(key);
            const isMissing = initialStatus.missing_files.includes(key);
            const isSelected = Boolean(files[key]);

            return (
              <div
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, key)}
                className={`rounded-lg border-2 border-dashed p-4 text-center transition ${
                  isLoaded
                    ? "border-success/50 bg-success/5"
                    : isSelected
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  ref={(el) => {
                    if (el) fileInputs.current[key] = el;
                  }}
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(key, e.target.files?.[0] || null)
                  }
                />
                <button
                  onClick={() => fileInputs.current[key]?.click()}
                  className="w-full"
                >
                  <div className="flex flex-col items-center gap-2">
                    {isLoaded ? (
                      <>
                        <Check className="h-5 w-5 text-success" />
                        <span className="text-xs font-medium text-success">
                          Loaded
                        </span>
                      </>
                    ) : isSelected ? (
                      <>
                        <Upload className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium">
                          {files[key]?.name.split(".")[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          CSV
                        </span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {Object.values(files).some((f) => f) && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Files"}
          </button>
        )}
      </div>

      {initialStatus.loaded_files.length > 0 && !initialStatus.ready && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning" />
          <div className="text-sm">
            <p className="font-medium text-warning">Partial data loaded</p>
            <p className="text-warning/70">
              Missing: {initialStatus.missing_files.join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
