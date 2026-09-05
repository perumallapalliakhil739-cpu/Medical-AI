/**
 * Clinical data and UI formatters.
 */

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function maskMRN(mrn: string | null | undefined): string {
  if (!mrn) return '—';
  if (mrn.length <= 4) return '***';
  return `***-${mrn.slice(-4)}`;
}
