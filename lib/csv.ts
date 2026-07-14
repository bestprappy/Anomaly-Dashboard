/** CSV building + browser-download helpers shared by datasheet export buttons. */

export function escapeCsvValue(value: string | number): string {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number>>
): string {
  const lines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headers.join(","), ...lines].join("\r\n");
}

/** Trigger a browser download of `blob` as `filename`. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Download `csv` as `filename`, BOM-prefixed so Excel reads UTF-8 (Thai text). */
export function downloadCsv(filename: string, csv: string): void {
  const utf8Bom = String.fromCharCode(0xfeff);
  downloadBlob(
    filename,
    new Blob([utf8Bom + csv], { type: "text/csv;charset=utf-8;" })
  );
}
