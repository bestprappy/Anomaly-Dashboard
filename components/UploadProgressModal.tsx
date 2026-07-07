"use client";

import { X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadProgressModalProps {
  isOpen: boolean;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedBytes: number;
  currentChunk: number;
  totalChunks: number;
  status: "preparing" | "chunking" | "uploading" | "finalizing" | "complete" | "error";
  error?: string;
  onCancel?: () => void;
  currentFileIndex?: number;
  totalFiles?: number;
}

export function UploadProgressModal({
  isOpen,
  fileName,
  fileSizeBytes,
  uploadedBytes,
  currentChunk,
  totalChunks,
  status,
  error,
  onCancel,
  currentFileIndex = 1,
  totalFiles = 1,
}: UploadProgressModalProps) {
  const uploadSpeed = 0;
  const remainingTime = 0;

  if (!isOpen) return null;

  const progressPercent = Math.round((uploadedBytes / fileSizeBytes) * 100);
  const chunkProgress = totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0;
  const fileSizeMB = (fileSizeBytes / 1024 / 1024).toFixed(1);
  const uploadedMB = (uploadedBytes / 1024 / 1024).toFixed(1);

  const getStatusMessage = () => {
    switch (status) {
      case "preparing":
        return "Preparing file...";
      case "chunking":
        return `Splitting file into chunks (${currentChunk}/${totalChunks})`;
      case "uploading":
        return `Uploading chunk ${currentChunk + 1}/${totalChunks}`;
      case "finalizing":
        return "Finalizing upload & processing...";
      case "complete":
        return "Upload complete!";
      case "error":
        return "Upload failed";
      default:
        return "Uploading...";
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-border">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">Uploading Files</h3>
              {totalFiles > 1 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {currentFileIndex}/{totalFiles}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{fileName}</p>
          </div>
          {status !== "uploading" && status !== "finalizing" && (
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition ml-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {status === "complete" ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Complete
              </div>
            ) : status === "error" ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Error
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                In Progress
              </div>
            )}
          </div>
        </div>

        {/* Main Progress Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary transition-all duration-300"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {uploadedMB}/{fileSizeMB}MB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-foreground">{getStatusMessage()}</p>
          {status === "uploading" && totalChunks > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Chunk {currentChunk + 1} of {totalChunks}
            </p>
          )}
          {status === "finalizing" && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="text-xs text-muted-foreground">Processing on server...</p>
            </div>
          )}
        </div>

        {/* Chunk Progress Bar */}
        {status === "uploading" && totalChunks > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Chunk Progress</span>
              <span className="text-xs font-semibold text-foreground">{chunkProgress}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
                style={{ width: `${chunkProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Speed</p>
            <p className="text-sm font-semibold text-foreground mt-1">
              {uploadSpeed.toFixed(1)}MB/s
            </p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Time Left</p>
            <p className="text-sm font-semibold text-foreground mt-1">
              {status === "complete" ? "Done" : remainingTime > 0 ? formatTime(remainingTime) : "--"}
            </p>
          </div>
          <div className="bg-surface/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-semibold text-foreground mt-1 capitalize">
              {status === "uploading" ? "Active" : status === "finalizing" ? "Finish" : "Wait"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {status === "error" && error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {status === "complete" && (
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
          >
            Done
          </button>
        )}
        {status === "error" && (
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
