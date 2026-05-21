export function csvSafeValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  // Prevent Excel/CSV formula injection: prefix with single quote if starts with = + - @
  if (/^[=+\-@]/.test(v)) {
    return `'${v}`;
  }
  return v;
}

export function parseSimpleCsv(csv: string): string[][] {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  return lines.map((line) => {
    // Simple CSV split (no quoted fields support) — acceptable for controlled inputs
    return line.split(',').map((c) => c.trim());
  });
}

export function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  // Escape double quotes by doubling them, wrap in quotes if necessary
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function getSafeFilename(name: string): string {
  // Remove path separators and control chars, limit length
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return cleaned || 'export.csv';
}
