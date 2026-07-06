"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Check, AlertCircle, X } from "lucide-react";
import { api, UploadStatus, UploadProgress } from "@/lib/api";
import { UploadProgressModal } from "./UploadProgressModal";

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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
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
    setUploadProgress(null);

    const fileCount = Object.keys(selectedFiles).length;
    setTotalFilesToUpload(fileCount);
    setCurrentFileIndex(1);

    try {
      // Log file information for debugging
      const fileInfo = Object.entries(selectedFiles).map(([key, file]) => ({
        key,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      console.log(`Uploading ${fileCount} file(s) sequentially:`, fileInfo);

      let fileIndex = 0;
      const status = await api.uploadFiles(
        selectedFiles,
        (progress) => {
          // Track which file we're uploading
          if (progress.status === "chunking" || progress.status === "uploading") {
            fileIndex = fileIndex || Object.keys(selectedFiles).indexOf(progress.fileKey) + 1;
            setCurrentFileIndex(fileIndex);
          }
          setUploadProgress(progress);
        }
      );
      console.log("✅ All files uploaded successfully:", status);
      setFiles({});
      onUploadComplete(status);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : JSON.stringify(err) || "Upload failed. Try again.";
      console.error("Upload error:", errorMsg);
      console.error("Error details:", {
        type: typeof err,
        isError: err instanceof Error,
        selectedFiles: Object.keys(selectedFiles),
        fullError: err,
      });
      setError(errorMsg);
      setUploadProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const loaded = initialStatus.loaded_files.length;
  const missing = initialStatus.missing_files.length;
  const total = loaded + missing;

  return (
    <div className="space-y-6">
      <div className="card-base p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Upload Billing Files</h3>
            {loaded > 0 && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 max-w-xs rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(loaded / total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {loaded}/{total} files
                </p>
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
              className="btn-base btn-ghost"
              title="Clear uploads and start over"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Clear</span>
            </button>
          )}
        </div>

        {initialStatus.message && (
          <p className="mb-4 text-sm text-muted-foreground">
            {initialStatus.message}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {FILE_FIELDS.map(({ key, label }) => {
            const isLoaded = initialStatus.loaded_files.includes(key);
            const isMissing = initialStatus.missing_files.includes(key);
            const isSelected = Boolean(files[key]);

            return (
              <div
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, key)}
                className={`rounded-md border-2 border-dashed p-4 text-center transition cursor-pointer ${
                  isLoaded
                    ? "border-success/40 bg-success/5"
                    : isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-surface/30"
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
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-xs font-medium text-success">
                          Loaded
                        </span>
                      </>
                    ) : isSelected ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground line-clamp-1">
                          {files[key]?.name.split(".")[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{label}</span>
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
          <div className="mt-4 flex items-center gap-3 rounded-md bg-destructive/10 p-3 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {Object.values(files).some((f) => f) && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-base btn-primary w-full mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-current animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              "Upload Files"
            )}
          </button>
        )}
      </div>

      {initialStatus.loaded_files.length > 0 && !initialStatus.ready && (
        <div className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-warning">Partial data loaded</p>
            <p className="text-warning/70 text-xs mt-1">
              Missing: {initialStatus.missing_files.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      <UploadProgressModal
        isOpen={uploadProgress !== null}
        fileKey={uploadProgress?.fileKey || ""}
        fileName={uploadProgress?.fileName || ""}
        fileSizeBytes={uploadProgress?.fileSizeBytes || 0}
        uploadedBytes={uploadProgress?.uploadedBytes || 0}
        currentChunk={uploadProgress?.currentChunk || 0}
        totalChunks={uploadProgress?.totalChunks || 0}
        status={uploadProgress?.status || "uploading"}
        error={uploadProgress?.error}
        currentFileIndex={currentFileIndex}
        totalFiles={totalFilesToUpload}
        onCancel={() => {
          if (uploadProgress?.status === "complete" || uploadProgress?.status === "error") {
            setUploadProgress(null);
            setTotalFilesToUpload(0);
            setCurrentFileIndex(0);
          }
        }}
      />
    </div>
  );
}
