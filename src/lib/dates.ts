export function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function daysBetween(from: string, to: string): number {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const delta = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return Math.max(0, delta)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}