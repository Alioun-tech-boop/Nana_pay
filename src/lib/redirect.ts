export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//')) return fallback
  if (/[\s\\]/.test(value)) return fallback
  if (/^\/[^/]*:/.test(value)) return fallback
  return value
}