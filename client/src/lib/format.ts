export { formatTL } from '@toscana/shared';

const timeFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const longDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'long',
});

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(typeof date === 'string' ? new Date(date) : date);
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return longDateFormatter.format(new Date(year, month - 1, day));
}

/** Geçen süre, dakika olarak (en az 0). */
export function minutesSince(iso: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60_000));
}

/** "12 dk", "1 sa 05 dk" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa ${String(minutes % 60).padStart(2, '0')} dk`;
}

/** Bugünün yerel tarihi: "2026-10-25" */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
