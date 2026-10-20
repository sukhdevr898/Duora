function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(value: string | Date): string {
  return toDate(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(value: string | Date): string {
  const date = toDate(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLastSeen(iso: string | null | undefined, online: boolean): string {
  if (online) return 'Online';
  if (!iso) return 'Last seen unavailable';
  const date = toDate(iso);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'Last seen just now';
  if (diffMs < 3_600_000) return `Last seen ${Math.floor(diffMs / 60_000)}m ago`;
  if (isSameDay(date, new Date())) return `Last seen today at ${formatTime(date)}`;
  return `Last seen ${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatRelative(value: string | Date): string {
  const diffMs = Date.now() - toDate(value).getTime();
  if (diffMs < 60_000) return 'now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h`;
  return `${Math.floor(diffMs / 86_400_000)}d`;
}
