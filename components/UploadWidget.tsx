"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Check, AlertCircle, X, Plus } from "lucide-react";
import { api, UploadStatus, UploadProgress } from "@/lib/api";
import { UploadProgressModal } from "./UploadProgressModal";

const FILE_TYPES = [
  { key: "pea_bfkt", label: "PEA BFKT" },
  { key: "pea_tuc", label: "PEA TUC" },
  { key: "mea_bfkt", label: "MEA BFKT" },
  { key: "mea_tuc", label: "MEA TUC" },
  { key: "mea_tmv", label: "MEA TMV" },
];

interface FileItem {
  key: string;
  file: File;
  type: string;
}

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
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("pea_bfkt");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles((prev) => [
        ...prev,
        {
          key: selectedType,
          file,
          type: FILE_TYPES.find((t) => t.key === selectedType)?.label || selectedType,
        },
      ]);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [selectedType]);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please add at least one file");
      return;
    }

    // Convert file items to upload format
    const filesToUpload: Record<string, File> = {};
    selectedFiles.forEach((item) => {
      filesToUpload[item.key] = item.file;
    });

    setLoading(true);
    setError(null);
    setUploadProgress(null);
    setTotalFilesToUpload(selectedFiles.length);
    setCurrentFileIndex(1);

    try {
      console.log(`Uploading ${selectedFiles.length} file(s) sequentially`);

      let fileIndex = 0;
      const status = await api.uploadFiles(
        filesToUpload,
        (progress) => {
          if (progress.status === "chunking" || progress.status === "uploading") {
            const currentIndex = selectedFiles.findIndex((f) => f.key === progress.fileKey) + 1;
            if (currentIndex > 0) {
              setCurrentFileIndex(currentIndex);
              fileIndex = currentIndex;
            }
          }
          setUploadProgress(progress);
        }
      );

      console.log("✅ All files uploaded successfully");
      setSelectedFiles([]);
      onUploadComplete(status);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : JSON.stringify(err) || "Upload failed. Try again.";
      console.error("Upload error:", errorMsg);
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
      <div className="card-base p-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Upload Billing Files</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Add files to upload and analyze your billing data
          </p>
        </div>

        {loaded > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 max-w-xs rounded-full bg-surface overflow-hidden">
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

        {initialStatus.message && (
          <p className="text-sm text-muted-foreground">{initialStatus.message}</p>
        )}

        {/* Add Files Section */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground"
              disabled={loading}
            >
              {FILE_TYPES.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn-base btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add File</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              disabled={loading}
            />
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <div className="space-y-2">
                {selectedFiles.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.type} • {(item.file.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={loading}
                      className="ml-3 p-1 text-muted-foreground hover:text-destructive transition"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-md bg-destructive/10 p-3 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="btn-base btn-primary w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-current animate-spin" />
                <span>Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""}...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload Files</span>
              </>
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
