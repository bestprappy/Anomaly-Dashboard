"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Circle,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import {
  api,
  UploadBatchResult,
  UploadFileKey,
  UploadPhase,
  UploadProgress,
  UploadStatus,
  UPLOAD_FILE_TYPES,
} from "@/lib/api";

const UI_CHUNK_SIZE_BYTES = 5 * 1024 * 1024;

interface FileQueueItem {
  id: string;
  file: File;
  fileKey: UploadFileKey;
  status: UploadPhase;
  uploadedBytes: number;
  currentChunk: number;
  totalChunks: number;
  error?: string;
}

interface UploadQueueWidgetProps {
  onUploadComplete: (status: UploadStatus) => void;
  initialStatus: UploadStatus;
}

function createQueueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getFileTypeLabel(fileKey: UploadFileKey): string {
  return UPLOAD_FILE_TYPES.find((type) => type.key === fileKey)?.label ?? fileKey;
}

function inferFileKey(fileName: string, usedKeys: Set<UploadFileKey>): UploadFileKey {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const directMatch = UPLOAD_FILE_TYPES.find((type) =>
    normalized.includes(type.key.replace("_", ""))
  );

  if (directMatch) return directMatch.key;

  const providerMatch = UPLOAD_FILE_TYPES.find((type) => {
    const [provider, company] = type.key.split("_");
    return normalized.includes(provider) && normalized.includes(company);
  });

  if (providerMatch) return providerMatch.key;

  return UPLOAD_FILE_TYPES.find((type) => !usedKeys.has(type.key))?.key ?? "pea_bfkt";
}

function createQueueItem(file: File, fileKey: UploadFileKey): FileQueueItem {
  return {
    id: createQueueId(),
    file,
    fileKey,
    status: "queued",
    uploadedBytes: 0,
    currentChunk: 0,
    totalChunks: Math.max(1, Math.ceil(file.size / UI_CHUNK_SIZE_BYTES)),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getProgressPercent(item: FileQueueItem): number {
  if (item.file.size === 0) return 0;
  return Math.min(100, Math.round((item.uploadedBytes / item.file.size) * 100));
}

function mergeUploadProgress(
  items: FileQueueItem[],
  progressItems: UploadProgress[]
): FileQueueItem[] {
  const progressById = new Map(progressItems.map((progress) => [progress.id, progress]));

  return items.map((item) => {
    const progress = progressById.get(item.id);
    if (!progress) return item;

    return {
      ...item,
      status: progress.status,
      uploadedBytes: progress.uploadedBytes,
      currentChunk: progress.currentChunk,
      totalChunks: progress.totalChunks,
      error: progress.error,
    };
  });
}

function getStatusCopy(status: UploadPhase): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "preparing":
    case "chunking":
      return "Preparing";
    case "uploading":
      return "Uploading";
    case "finalizing":
      return "Finalizing";
    case "complete":
      return "Complete";
    case "canceled":
      return "Canceled";
    case "error":
      return "Failed";
    default:
      return "Queued";
  }
}

function getStatusClass(status: UploadPhase): string {
  switch (status) {
    case "complete":
      return "border-success/30 bg-success/10 text-success";
    case "error":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "canceled":
      return "border-warning/30 bg-warning/10 text-warning";
    case "uploading":
    case "finalizing":
    case "preparing":
    case "chunking":
      return "border-primary/30 bg-primary/10 text-primary";
    default:
      return "border-border bg-surface text-muted-foreground";
  }
}

function StatusIcon({ status }: { status: UploadPhase }) {
  if (status === "complete") return <CheckCircle className="h-3.5 w-3.5" />;
  if (status === "error") return <AlertCircle className="h-3.5 w-3.5" />;
  if (status === "canceled") return <Ban className="h-3.5 w-3.5" />;
  if (["uploading", "finalizing", "preparing", "chunking"].includes(status)) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  }

  return <Circle className="h-3.5 w-3.5" />;
}

export function UploadQueueWidget({
  onUploadComplete,
  initialStatus,
}: UploadQueueWidgetProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadBatchResult, Error, FileQueueItem[]>({
    mutationFn: async (items) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      return api.uploadFiles(
        items.map((item) => ({
          id: item.id,
          fileKey: item.fileKey,
          file: item.file,
        })),
        (progress) => {
          setSelectedFiles((current) => mergeUploadProgress(current, progress.files));
        },
        { signal: controller.signal }
      );
    },
    onSuccess: (result) => {
      onUploadComplete(result.status);
      queryClient.invalidateQueries({ queryKey: ["uploadStatus"] });

      if (result.failedFiles.length > 0) {
        setError(`${result.failedFiles.length} file(s) failed. Review the file list and retry.`);
        return;
      }

      setError(null);
    },
    onError: (err) => {
      setSelectedFiles((current) =>
        current.map((item) =>
          ["queued", "preparing", "chunking", "uploading", "finalizing"].includes(item.status)
            ? { ...item, status: "error", error: err.message }
            : item
        )
      );
      setError(err.message || "Upload failed. Try again.");
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  const loading = uploadMutation.isPending;
  const uploadableFiles = selectedFiles.filter((item) =>
    ["queued", "error", "canceled"].includes(item.status)
  );
  const hasQueuedFiles = uploadableFiles.length > 0;

  const overallProgress = useMemo(() => {
    const totalBytes = selectedFiles.reduce((total, item) => total + item.file.size, 0);
    const uploadedBytes = selectedFiles.reduce(
      (total, item) => total + Math.min(item.uploadedBytes, item.file.size),
      0
    );

    return {
      totalBytes,
      uploadedBytes,
      percent: totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0,
    };
  }, [selectedFiles]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;

    setSelectedFiles((current) => {
      const usedKeys = new Set(current.map((item) => item.fileKey));
      const nextItems = files.map((file) => {
        const fileKey = inferFileKey(file.name, usedKeys);
        usedKeys.add(fileKey);
        return createQueueItem(file, fileKey);
      });

      return [...current, ...nextItems];
    });
    setError(null);
    event.currentTarget.value = "";
  }, []);

  const updateFileKey = (id: string, fileKey: UploadFileKey) => {
    setSelectedFiles((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              fileKey,
              status: item.status === "complete" ? item.status : "queued",
              error: undefined,
            }
          : item
      )
    );
  };

  const removeFile = (id: string) => {
    setSelectedFiles((current) => current.filter((item) => item.id !== id));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      setError("Please add at least one file.");
      return;
    }

    if (!hasQueuedFiles) {
      setError("Add more files or retry a failed file before uploading.");
      return;
    }

    const uploadIds = new Set(uploadableFiles.map((item) => item.id));
    setSelectedFiles((current) =>
      current.map((item) =>
        uploadIds.has(item.id)
          ? {
              ...item,
              status: "queued",
              uploadedBytes: 0,
              currentChunk: 0,
              error: undefined,
            }
          : item
      )
    );
    setError(null);
    uploadMutation.mutate(uploadableFiles);
  };

  const cancelUpload = () => {
    abortControllerRef.current?.abort();
    setSelectedFiles((current) =>
      current.map((item) =>
        ["queued", "preparing", "chunking", "uploading", "finalizing"].includes(item.status)
          ? { ...item, status: "canceled", error: "Upload canceled" }
          : item
      )
    );
    setError("Upload canceled.");
  };

  const loaded = initialStatus.loaded_files.length;
  const missing = initialStatus.missing_files.length;
  const total = loaded + missing;

  return (
    <div className="space-y-6">
      {loaded > 0 && total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((loaded / total) * 100)}%` }}
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {loaded}/{total} billing files loaded
          </p>
        </div>
      )}

      {initialStatus.message && (
        <p className="text-sm text-muted-foreground">{initialStatus.message}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        multiple
        disabled={loading}
        aria-label="Select billing files"
      />

      {selectedFiles.length === 0 ? (
        <div className="flex justify-center py-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="btn-base btn-primary"
          >
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </button>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface/40">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">File queue</p>
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn-base btn-secondary h-9 w-9 justify-center p-0"
              title="Add more files"
              aria-label="Add more files"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {selectedFiles.map((item) => {
              const percent = getProgressPercent(item);
              const isActive = ["preparing", "chunking", "uploading", "finalizing"].includes(
                item.status
              );

              return (
                <div key={item.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.file.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatBytes(item.file.size)}</span>
                          <span>{item.totalChunks} chunk{item.totalChunks === 1 ? "" : "s"}</span>
                          <span>{getFileTypeLabel(item.fileKey)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <select
                        value={item.fileKey}
                        onChange={(event) =>
                          updateFileKey(item.id, event.target.value as UploadFileKey)
                        }
                        disabled={loading || item.status === "complete"}
                        className="input-base h-9 min-w-32 text-xs"
                        aria-label={`Billing type for ${item.file.name}`}
                      >
                        {UPLOAD_FILE_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>
                            {type.label}
                          </option>
                        ))}
                      </select>

                      <span
                        className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold ${getStatusClass(
                          item.status
                        )}`}
                      >
                        <StatusIcon status={item.status} />
                        {getStatusCopy(item.status)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        disabled={loading || isActive}
                        className="btn-base btn-ghost h-9 w-9 justify-center p-0 text-muted-foreground"
                        title="Remove file"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {item.status === "finalizing"
                          ? "Processing on server"
                          : item.status === "uploading"
                            ? `Chunk ${item.currentChunk} of ${item.totalChunks}`
                            : getStatusCopy(item.status)}
                      </span>
                      <span className="font-semibold text-foreground">{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.status === "error"
                            ? "bg-destructive"
                            : item.status === "complete"
                              ? "bg-success"
                              : "bg-primary"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {item.error && (
                      <p className="mt-2 text-xs font-medium text-destructive">{item.error}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-3 rounded-md border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-foreground">Overall progress</span>
            <span className="text-muted-foreground">
              {formatBytes(overallProgress.uploadedBytes)} / {formatBytes(overallProgress.totalBytes)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${overallProgress.percent}%` }}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {overallProgress.percent}% complete across the current queue
            </p>
            <div className="flex gap-2">
              {loading && (
                <button type="button" onClick={cancelUpload} className="btn-base btn-secondary">
                  <Ban className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !hasQueuedFiles}
                className="btn-base btn-primary"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : uploadableFiles.some((item) => item.status === "error") ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{loading ? "Uploading" : "Upload"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-md bg-destructive/10 p-3 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <span className="text-sm font-medium text-destructive">{error}</span>
        </div>
      )}

      {initialStatus.loaded_files.length > 0 && !initialStatus.ready && (
        <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-warning">Partial data loaded</p>
            <p className="text-warning/80 text-xs mt-1">
              Missing: {initialStatus.missing_files.join(", ")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
