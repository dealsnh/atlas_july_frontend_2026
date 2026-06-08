/** Parse filename from `Content-Disposition` (e.g. attachment; filename="atlas-leads.csv"). */
export function parseFilenameFromContentDisposition(
  header: string | undefined,
  fallback: string,
): string {
  if (!header?.trim()) return fallback;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  const plainMatch = header.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/^"|"$/g, "");

  return fallback;
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
