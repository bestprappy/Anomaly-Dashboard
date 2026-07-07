export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://atonality123-test101.hf.space"
).replace(/\/$/, "");

export interface UploadStatus {
  loaded_files: string[];
  missing_files: string[];
  ready: boolean;
  rows_total: number;
  message: string;
}

export interface BillRange {
  min_month: number | null;
  max_month: number | null;
  n_months: number;
  per_provider: {
    PEA?: {
      min_month: number;
      max_month: number;
      n_months: number;
    };
    MEA?: {
      min_month: number;
      max_month: number;
      n_months: number;
    };
  };
}

export interface DuplicateItem {
  Site_ID: string;
  occurrences: number;
  providers: string[];
  companies: string[];
}

export interface Duplicates {
  malformed_site_ids: string[];
  malformed_count: number;
  duplicate_site_ids: DuplicateItem[];
  duplicate_count: number;
}

export interface CommonSites {
  within_pea?: Record<string, { count: number; site_ids: string[] }>;
  within_mea?: Record<string, { count: number; site_ids: string[] }>;
  pea_mea_cross_common?: { count: number; site_ids: string[] };
  mea_all_three_common?: { count: number; site_ids: string[] };
}

export interface SiteTypes {
  PEA?: Record<string, number>;
  MEA?: Record<string, number>;
}

export interface MaintenanceSite {
  site_id: string;
  provider: "PEA" | "MEA";
  company: "BFKT" | "TUC" | "TMV";
  site_type: string;
  bill_amount: number;
  last_maintenance_month: string;
}

export interface MaintenanceData {
  total_maintenance_rows: number;
  unique_amounts: number;
  value_counts: Array<{ amount: number; count: number }>;
  maintenance_sites_last_6_months: MaintenanceSite[];
  maintenance_site_count: number;
}

export interface LoadReport {
  provider: string;
  company: string;
  rows_raw: number;
  rows_after_clean: number;
  removed_rows: number;
  notes: string[];
}

export interface ErrorRates {
  total_rows: number;
  zero_bill_rate: number;
  bill_without_kwh_rate: number;
  kwh_without_bill_rate: number;
  missing_kwh_rate: number;
  negative_value_rows: number;
  load_reports: Record<string, LoadReport>;
}

export interface EDASummary {
  bill_range: BillRange;
  duplicates: Duplicates;
  common_sites: CommonSites;
  site_types: SiteTypes;
  last_month_missing?: Record<string, unknown>;
  maintenance_sites: MaintenanceData;
  error_rates: ErrorRates;
}

export interface SiteTrendPoint {
  month: number;
  value: number | null;
}

export interface SiteTrend {
  site_id: string;
  found: boolean;
  provider: string | null;
  company: string | null;
  site_type: string | null;
  metric: "kwh" | "bill_amount" | null;
  series: SiteTrendPoint[];
}

export interface SiteTrendBundle {
  kwh: SiteTrend;
  billAmount: SiteTrend;
}

export const UPLOAD_FILE_TYPES = [
  { key: "pea_bfkt", label: "PEA BFKT" },
  { key: "pea_tuc", label: "PEA TUC" },
  { key: "mea_bfkt", label: "MEA BFKT" },
  { key: "mea_tuc", label: "MEA TUC" },
  { key: "mea_tmv", label: "MEA TMV" },
] as const;

export type UploadFileKey = (typeof UPLOAD_FILE_TYPES)[number]["key"];

export type UploadPhase =
  | "queued"
  | "preparing"
  | "chunking"
  | "uploading"
  | "finalizing"
  | "complete"
  | "error"
  | "canceled";

export interface UploadFileSelection {
  id: string;
  fileKey: UploadFileKey;
  file: File;
}

export interface UploadProgress {
  id: string;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedBytes: number;
  currentChunk: number;
  totalChunks: number;
  status: UploadPhase;
  error?: string;
}

export interface UploadBatchProgress {
  files: UploadProgress[];
  overallUploadedBytes: number;
  overallBytes: number;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: UploadPhase;
}

export interface UploadBatchResult {
  status: UploadStatus;
  files: UploadProgress[];
  succeededFiles: UploadProgress[];
  failedFiles: UploadProgress[];
}

export interface UploadOptions {
  chunkSizeBytes?: number;
  fileConcurrency?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

const DEFAULT_CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_FILE_CONCURRENCY = 2;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 600;

type UploadHttpError = Error & { status?: number };

export type LegacyUploadProgress = Omit<UploadProgress, "id" | "status"> & {
  status: "preparing" | "chunking" | "uploading" | "finalizing" | "complete" | "error";
};

class BillingEDAClient {
  private baseUrl = API_BASE_URL;

  async checkHealth() {
    const res = await fetch(`${this.baseUrl}/api/health`);
    return res.json();
  }

  async getUploadStatus(): Promise<UploadStatus> {
    const res = await fetch(`${this.baseUrl}/api/upload/status`);
    if (!res.ok) throw new Error(`Upload status failed: ${res.statusText}`);
    return res.json();
  }

  async uploadFiles(
    files: Record<string, File | null>,
    onProgress?: (progress: LegacyUploadProgress) => void
  ): Promise<UploadStatus>;
  async uploadFiles(
    selections: UploadFileSelection[],
    onProgress?: (progress: UploadBatchProgress) => void,
    options?: UploadOptions
  ): Promise<UploadBatchResult>;
  async uploadFiles(
    selectionsOrFiles: UploadFileSelection[] | Record<string, File | null>,
    onProgress?: ((progress: UploadBatchProgress) => void) | ((progress: LegacyUploadProgress) => void),
    options: UploadOptions = {}
  ): Promise<UploadBatchResult | UploadStatus> {
    if (!Array.isArray(selectionsOrFiles)) {
      return this.uploadFilesLegacy(
        selectionsOrFiles,
        onProgress as ((progress: LegacyUploadProgress) => void) | undefined
      );
    }

    const selections = selectionsOrFiles;
    const onBatchProgress = onProgress as ((progress: UploadBatchProgress) => void) | undefined;
    const filesToUpload = selections.filter((selection) => selection.file.size > 0);

    if (filesToUpload.length === 0) {
      throw new Error("No non-empty files to upload");
    }

    const chunkSizeBytes = options.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE_BYTES;
    const fileConcurrency = Math.max(
      1,
      Math.min(options.fileConcurrency ?? DEFAULT_FILE_CONCURRENCY, filesToUpload.length)
    );
    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const progressById = new Map<string, UploadProgress>();

    filesToUpload.forEach((selection) => {
      progressById.set(selection.id, this.createInitialProgress(selection, chunkSizeBytes));
    });

    const emitBatchProgress = () => {
      const files = Array.from(progressById.values());
      const completedFiles = files.filter((file) => file.status === "complete").length;
      const failedFiles = files.filter(
        (file) => file.status === "error" || file.status === "canceled"
      ).length;
      const hasActive = files.some((file) =>
        ["preparing", "chunking", "uploading", "finalizing"].includes(file.status)
      );
      const overallBytes = files.reduce((total, file) => total + file.fileSizeBytes, 0);
      const overallUploadedBytes = files.reduce(
        (total, file) => total + Math.min(file.uploadedBytes, file.fileSizeBytes),
        0
      );

      onBatchProgress?.({
        files,
        overallUploadedBytes,
        overallBytes,
        totalFiles: files.length,
        completedFiles,
        failedFiles,
        status: hasActive
          ? "uploading"
          : failedFiles > 0
            ? "error"
            : completedFiles === files.length
              ? "complete"
              : "queued",
      });
    };

    const updateFileProgress = (progress: UploadProgress) => {
      progressById.set(progress.id, progress);
      emitBatchProgress();
    };

    emitBatchProgress();

    await this.uploadWithConcurrency(
      filesToUpload,
      fileConcurrency,
      async (selection) => {
        try {
          const progress = await this.uploadFileInChunks(selection, {
            chunkSizeBytes,
            maxRetries,
            signal: options.signal,
            onProgress: updateFileProgress,
          });
          updateFileProgress(progress);
        } catch (err) {
          const current =
            progressById.get(selection.id) ??
            this.createInitialProgress(selection, chunkSizeBytes);
          const isCanceled = this.isAbortError(err);
          updateFileProgress({
            ...current,
            status: isCanceled ? "canceled" : "error",
            error: isCanceled ? "Upload canceled" : this.getErrorMessage(err),
          });
        }
      },
      options.signal,
      (selection) => {
        const current =
          progressById.get(selection.id) ??
          this.createInitialProgress(selection, chunkSizeBytes);
        updateFileProgress({
          ...current,
          status: "canceled",
          error: "Upload canceled",
        });
      }
    );

    const status = await this.getUploadStatus();
    const files = Array.from(progressById.values());
    const failedFiles = files.filter(
      (file) => file.status === "error" || file.status === "canceled"
    );

    return {
      status,
      files,
      succeededFiles: files.filter((file) => file.status === "complete"),
      failedFiles,
    };
  }

  private createInitialProgress(
    selection: UploadFileSelection,
    chunkSizeBytes: number
  ): UploadProgress {
    return {
      id: selection.id,
      fileKey: selection.fileKey,
      fileName: selection.file.name,
      fileSizeBytes: selection.file.size,
      uploadedBytes: 0,
      currentChunk: 0,
      totalChunks: Math.max(1, Math.ceil(selection.file.size / chunkSizeBytes)),
      status: "queued",
    };
  }

  private async uploadFileInChunks(
    selection: UploadFileSelection,
    options: {
      chunkSizeBytes: number;
      maxRetries: number;
      signal?: AbortSignal;
      onProgress: (progress: UploadProgress) => void;
    }
  ): Promise<UploadProgress> {
    this.throwIfAborted(options.signal);

    const { file, fileKey, id } = selection;
    const totalChunks = Math.max(1, Math.ceil(file.size / options.chunkSizeBytes));
    const fileId = this.createFileId(fileKey);
    let latestProgress: UploadProgress = {
      id,
      fileKey,
      fileName: file.name,
      fileSizeBytes: file.size,
      uploadedBytes: 0,
      currentChunk: 0,
      totalChunks,
      status: "preparing",
    };

    const emit = (progress: UploadProgress) => {
      latestProgress = progress;
      options.onProgress(progress);
    };

    emit({ ...latestProgress, status: "chunking" });

    for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber += 1) {
      this.throwIfAborted(options.signal);

      const start = chunkNumber * options.chunkSizeBytes;
      const end = Math.min(start + options.chunkSizeBytes, file.size);
      const chunk = file.slice(start, end);

      emit({
        ...latestProgress,
        status: "uploading",
        currentChunk: chunkNumber + 1,
        uploadedBytes: start,
      });

      await this.uploadChunkWithRetry({
        fileId,
        chunkNumber,
        totalChunks,
        fileKey,
        fileName: file.name,
        fileSizeBytes: file.size,
        chunkSizeBytes: options.chunkSizeBytes,
        chunk,
        maxRetries: options.maxRetries,
        signal: options.signal,
        onProgress: (uploadedBytes) => {
          emit({
            ...latestProgress,
            status: "uploading",
            currentChunk: chunkNumber + 1,
            uploadedBytes: Math.min(uploadedBytes, file.size),
          });
        },
      });
    }

    emit({
      ...latestProgress,
      status: "finalizing",
      uploadedBytes: file.size,
      currentChunk: totalChunks,
    });

    await this.finalizeChunkedUploadRequest(fileId, options.signal);

    return {
      ...latestProgress,
      status: "complete",
      uploadedBytes: file.size,
      currentChunk: totalChunks,
    };
  }

  private async uploadChunkWithRetry(args: {
    fileId: string;
    chunkNumber: number;
    totalChunks: number;
    fileKey: UploadFileKey;
    fileName: string;
    fileSizeBytes: number;
    chunkSizeBytes: number;
    chunk: Blob;
    maxRetries: number;
    signal?: AbortSignal;
    onProgress: (uploadedBytes: number) => void;
  }): Promise<void> {
    for (let attempt = 0; attempt <= args.maxRetries; attempt += 1) {
      try {
        await this.uploadChunkRequest(args);
        return;
      } catch (err) {
        if (
          this.isAbortError(err) ||
          attempt >= args.maxRetries ||
          !this.isRetryableUploadError(err)
        ) {
          throw err;
        }

        await this.delay(RETRY_BASE_DELAY_MS * 2 ** attempt, args.signal);
      }
    }
  }

  private async uploadChunkRequest(args: {
    fileId: string;
    chunkNumber: number;
    totalChunks: number;
    fileKey: UploadFileKey;
    fileName: string;
    fileSizeBytes: number;
    chunkSizeBytes: number;
    chunk: Blob;
    signal?: AbortSignal;
    onProgress: (uploadedBytes: number) => void;
  }): Promise<void> {
    this.throwIfAborted(args.signal);

    const form = new FormData();
    form.append("chunk", args.chunk, `${args.fileKey}.${args.chunkNumber}.part`);

    const params = new URLSearchParams({
      file_id: args.fileId,
      chunk_number: args.chunkNumber.toString(),
      total_chunks: args.totalChunks.toString(),
      file_key: args.fileKey,
      file_name: args.fileName,
      file_size: args.fileSizeBytes.toString(),
      chunk_size: args.chunkSizeBytes.toString(),
    });

    const url = `${this.baseUrl}/api/upload/chunk?${params}`;
    const chunkOffset = args.chunkNumber * args.chunkSizeBytes;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let settled = false;

      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        args.signal?.removeEventListener("abort", abortHandler);
        callback();
      };

      const abortHandler = () => {
        xhr.abort();
        settle(() => reject(this.createAbortError()));
      };

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          args.onProgress(chunkOffset + event.loaded);
        }
      };

      xhr.onload = () => {
        settle(() => {
          if (xhr.status >= 200 && xhr.status < 300) {
            args.onProgress(chunkOffset + args.chunk.size);
            resolve();
            return;
          }

          reject(this.createHttpError(xhr.status, xhr.statusText, xhr.responseText));
        });
      };

      xhr.onerror = () => {
        settle(() => reject(this.createHttpError(0, "Network error", xhr.responseText)));
      };

      xhr.ontimeout = () => {
        settle(() => reject(this.createHttpError(408, "Upload timed out", xhr.responseText)));
      };

      xhr.onabort = () => {
        settle(() => reject(this.createAbortError()));
      };

      args.signal?.addEventListener("abort", abortHandler, { once: true });
      xhr.open("POST", url);
      xhr.timeout = 120000;
      xhr.send(form);
    });
  }

  private async finalizeChunkedUploadRequest(
    fileId: string,
    externalSignal?: AbortSignal
  ): Promise<UploadStatus> {
    this.throwIfAborted(externalSignal);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const abortHandler = () => controller.abort();
    externalSignal?.addEventListener("abort", abortHandler, { once: true });

    try {
      const res = await fetch(
        `${this.baseUrl}/api/upload/finalize?file_id=${encodeURIComponent(fileId)}`,
        {
          method: "POST",
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        throw await this.createFetchError(res, "Finalize failed");
      }

      return res.json();
    } catch (err) {
      if (this.isAbortError(err)) {
        if (externalSignal?.aborted) {
          throw this.createAbortError();
        }
        throw new Error("Finalize request timed out after 120 seconds.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", abortHandler);
    }
  }

  private async uploadWithConcurrency(
    selections: UploadFileSelection[],
    concurrency: number,
    runUpload: (selection: UploadFileSelection) => Promise<void>,
    signal: AbortSignal | undefined,
    onCanceledBeforeStart: (selection: UploadFileSelection) => void
  ): Promise<void> {
    const pending = selections.map((selection) => ({ selection }));
    const activeKeys = new Set<UploadFileKey>();

    await new Promise<void>((resolve) => {
      let activeCount = 0;

      const launchNext = () => {
        if (signal?.aborted) {
          pending.splice(0).forEach(({ selection }) => onCanceledBeforeStart(selection));
        }

        if (pending.length === 0 && activeCount === 0) {
          resolve();
          return;
        }

        while (activeCount < concurrency && pending.length > 0 && !signal?.aborted) {
          const nextIndex = pending.findIndex(
            ({ selection }) => !activeKeys.has(selection.fileKey)
          );

          if (nextIndex === -1) {
            return;
          }

          const [{ selection }] = pending.splice(nextIndex, 1);
          activeKeys.add(selection.fileKey);
          activeCount += 1;

          runUpload(selection).finally(() => {
            activeKeys.delete(selection.fileKey);
            activeCount -= 1;
            launchNext();
          });
        }
      };

      launchNext();
    });
  }

  private createFileId(fileKey: UploadFileKey): string {
    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    return `${fileKey}-${Date.now()}-${token}`;
  }

  private createHttpError(status: number, statusText: string, responseText: string): UploadHttpError {
    const fallback = status > 0 ? `Upload failed: ${status} ${statusText}` : statusText;
    let message = fallback;

    if (responseText) {
      try {
        const parsed = JSON.parse(responseText) as { detail?: string; error?: string };
        message = parsed.detail || parsed.error || fallback;
      } catch {
        message = responseText;
      }
    }

    const error = new Error(message) as UploadHttpError;
    error.status = status;
    return error;
  }

  private async createFetchError(res: Response, fallback: string): Promise<UploadHttpError> {
    let message = `${fallback}: ${res.status} ${res.statusText}`;

    try {
      const parsed = (await res.json()) as { detail?: string; error?: string };
      message = parsed.detail || parsed.error || message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // Keep the HTTP fallback.
      }
    }

    const error = new Error(message) as UploadHttpError;
    error.status = res.status;
    return error;
  }

  private isRetryableUploadError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const status = (err as UploadHttpError).status;
    return status === 0 || status === 408 || status === 429 || (typeof status === "number" && status >= 500);
  }

  private isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === "AbortError";
  }

  private createAbortError(): Error {
    const error = new Error("Upload canceled");
    error.name = "AbortError";
    return error;
  }

  private throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw this.createAbortError();
    }
  }

  private getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : "Upload failed";
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    this.throwIfAborted(signal);

    return new Promise((resolve, reject) => {
      const finish = () => {
        signal?.removeEventListener("abort", abortHandler);
        resolve();
      };
      const timeout = setTimeout(finish, ms);
      const abortHandler = () => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abortHandler);
        reject(this.createAbortError());
      };

      signal?.addEventListener("abort", abortHandler, { once: true });
    });
  }

  private async uploadFilesLegacy(
    files: Record<string, File | null>,
    onProgress?: (progress: LegacyUploadProgress) => void
  ): Promise<UploadStatus> {
    const filesToUpload = Object.entries(files).filter(([, file]) => file);

    if (filesToUpload.length === 0) {
      throw new Error("No files to upload");
    }

    // Upload each file sequentially (one at a time, wait for completion)
    for (const [fileKey, file] of filesToUpload) {
      if (!file) continue;

      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const fileSize = file.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

      try {
        console.log(`Starting upload for ${fileKey}: ${file.name} (${(fileSize / 1_000_000).toFixed(1)}MB)`);

        onProgress?.({
          fileKey,
          fileName: file.name,
          fileSizeBytes: fileSize,
          uploadedBytes: 0,
          currentChunk: 0,
          totalChunks,
          status: "chunking",
        });

        if (totalChunks === 1) {
          // File is small enough, upload as single chunk
          await this.uploadSingleChunk(
            fileKey,
            file,
            0,
            1,
            (uploadedBytes) => {
              onProgress?.({
                fileKey,
                fileName: file.name,
                fileSizeBytes: fileSize,
                uploadedBytes,
                currentChunk: 1,
                totalChunks: 1,
                status: "uploading",
              });
            }
          );

          onProgress?.({
            fileKey,
            fileName: file.name,
            fileSizeBytes: fileSize,
            uploadedBytes: fileSize,
            currentChunk: 1,
            totalChunks: 1,
            status: "complete",
          });
        } else {
          // Large file: split into chunks
          const fileId = `${fileKey}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

          for (let chunkNum = 0; chunkNum < totalChunks; chunkNum++) {
            const start = chunkNum * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, fileSize);
            const chunk = file.slice(start, end);

            await this.uploadChunk(
              fileId,
              chunkNum,
              totalChunks,
              fileKey,
              chunk,
              (uploadedBytes) => {
                onProgress?.({
                  fileKey,
                  fileName: file.name,
                  fileSizeBytes: fileSize,
                  uploadedBytes,
                  currentChunk: chunkNum + 1,
                  totalChunks,
                  status: "uploading",
                });
              }
            );
          }

          // Finalize the upload
          console.log(`Finalizing ${fileKey}...`);
          onProgress?.({
            fileKey,
            fileName: file.name,
            fileSizeBytes: fileSize,
            uploadedBytes: fileSize,
            currentChunk: totalChunks,
            totalChunks,
            status: "finalizing",
          });

          await this.finalizeChunkedUpload(fileId);

          onProgress?.({
            fileKey,
            fileName: file.name,
            fileSizeBytes: fileSize,
            uploadedBytes: fileSize,
            currentChunk: totalChunks,
            totalChunks,
            status: "complete",
          });

          console.log(`✅ Completed ${fileKey}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        console.error(`❌ Failed to upload ${fileKey}:`, errorMsg);

        onProgress?.({
          fileKey,
          fileName: file.name,
          fileSizeBytes: fileSize,
          uploadedBytes: 0,
          currentChunk: 0,
          totalChunks,
          status: "error",
          error: errorMsg,
        });
        throw err;
      }
    }

    console.log("All files uploaded successfully");
    // Return final status
    return this.getUploadStatus();
  }

  private async uploadSingleChunk(
    fileKey: string,
    file: File,
    chunkNum: number,
    totalChunks: number,
    onProgress?: (uploadedBytes: number) => void
  ): Promise<void> {
    const form = new FormData();
    form.append(fileKey, file);

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      let errorMessage = `Upload failed: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use statusText
      }
      throw new Error(errorMessage);
    }

    onProgress?.(file.size);
  }

  private async uploadChunk(
    fileId: string,
    chunkNum: number,
    totalChunks: number,
    fileKey: string,
    chunk: Blob,
    onProgress?: (uploadedBytes: number) => void
  ): Promise<void> {
    const form = new FormData();
    form.append("chunk", chunk);

    const params = new URLSearchParams({
      file_id: fileId,
      chunk_number: chunkNum.toString(),
      total_chunks: totalChunks.toString(),
      file_key: fileKey,
    });

    const url = `${this.baseUrl}/api/upload/chunk?${params}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let errorMessage = `Chunk upload failed: ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await res.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      const CHUNK_SIZE = 5 * 1024 * 1024;
      // Exact cumulative bytes: full chunks so far plus this chunk's actual size
      const uploadedBytes = chunkNum * CHUNK_SIZE + chunk.size;
      onProgress?.(uploadedBytes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to upload chunk ${chunkNum}/${totalChunks}:`, msg);
      throw err;
    }
  }

  private async finalizeChunkedUpload(fileId: string): Promise<UploadStatus> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120 second timeout

    try {
      const res = await fetch(
        `${this.baseUrl}/api/upload/finalize?file_id=${encodeURIComponent(fileId)}`,
        {
          method: "POST",
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        let errorMessage = `Finalize failed: ${res.status} ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorData.error || errorMessage;
        } catch {
          try {
            const text = await res.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage);
      }

      return res.json();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Finalize request timed out (120s). Backend may be processing large file. Please check backend status.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getEDASummary(): Promise<EDASummary> {
    const res = await fetch(`${this.baseUrl}/api/eda/summary`);
    if (res.status === 409)
      throw new Error("Data not ready. Please upload files first.");
    if (!res.ok) throw new Error(`EDA summary failed: ${res.statusText}`);
    return res.json();
  }

  async getBillRange(): Promise<BillRange> {
    const res = await fetch(`${this.baseUrl}/api/eda/bill-range`);
    if (!res.ok) throw new Error(`Bill range failed: ${res.statusText}`);
    return res.json();
  }

  async getDuplicates(): Promise<Duplicates> {
    const res = await fetch(`${this.baseUrl}/api/eda/duplicates`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Duplicates failed: ${res.statusText}`);
    return res.json();
  }

  async getCommonSites(): Promise<CommonSites> {
    const res = await fetch(`${this.baseUrl}/api/eda/common-sites`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Common sites failed: ${res.statusText}`);
    return res.json();
  }

  async getSiteTypes(): Promise<SiteTypes> {
    const res = await fetch(`${this.baseUrl}/api/eda/site-types`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Site types failed: ${res.statusText}`);
    return res.json();
  }

  async getMaintenanceSites(): Promise<MaintenanceData> {
    const res = await fetch(`${this.baseUrl}/api/eda/maintenance-sites`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Maintenance sites failed: ${res.statusText}`);
    return res.json();
  }

  async getErrorRates(): Promise<ErrorRates> {
    const res = await fetch(`${this.baseUrl}/api/eda/error-rates`);
    if (res.status === 409) throw new Error("Data not ready");
    if (!res.ok) throw new Error(`Error rates failed: ${res.statusText}`);
    return res.json();
  }

  async getSites(provider?: string): Promise<{ site_ids: string[] }> {
    const query = provider ? `?provider=${provider}` : "";
    const res = await fetch(`${this.baseUrl}/api/sites${query}`);
    if (!res.ok) throw new Error(`Sites failed: ${res.statusText}`);
    return res.json();
  }

  async getSiteTrend(
    siteId: string,
    metric: "kwh" | "bill_amount" = "kwh",
    startMonth?: number,
    endMonth?: number
  ): Promise<SiteTrend> {
    const params = new URLSearchParams({ metric });
    if (startMonth) params.append("start_month", startMonth.toString());
    if (endMonth) params.append("end_month", endMonth.toString());

    const res = await fetch(
      `${this.baseUrl}/api/site/${encodeURIComponent(siteId)}/trend?${params}`
    );
    if (!res.ok) throw new Error(`Site trend failed: ${res.statusText}`);
    return res.json();
  }

  async getSiteTrendBundle(
    siteId: string,
    startMonth?: number,
    endMonth?: number
  ): Promise<SiteTrendBundle> {
    const [kwhResult, billingResult] = await Promise.allSettled([
      this.getSiteTrend(siteId, "kwh", startMonth, endMonth),
      this.getSiteTrend(siteId, "bill_amount", startMonth, endMonth),
    ]);

    if (kwhResult.status === "rejected" && billingResult.status === "rejected") {
      throw new Error("Site trend failed for both KWH and billing metrics");
    }

    if (kwhResult.status === "rejected") {
      console.error("[api] KWH site trend failed", kwhResult.reason);
    }

    if (billingResult.status === "rejected") {
      console.error("[api] Billing site trend failed", billingResult.reason);
    }

    return {
      kwh:
        kwhResult.status === "fulfilled"
          ? kwhResult.value
          : this.createEmptySiteTrend(siteId, "kwh"),
      billAmount:
        billingResult.status === "fulfilled"
          ? billingResult.value
          : this.createEmptySiteTrend(siteId, "bill_amount"),
    };
  }

  private createEmptySiteTrend(
    siteId: string,
    metric: "kwh" | "bill_amount"
  ): SiteTrend {
    return {
      site_id: siteId,
      found: false,
      provider: null,
      company: null,
      site_type: null,
      metric,
      series: [],
    };
  }
}

export const api = new BillingEDAClient();
