export type QueryValue = string | number | boolean | undefined

export function buildQueryString(
  query: Record<string, QueryValue | QueryValue[]> | undefined,
): string {
  if (!query) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item === undefined) continue
      search.append(key, String(item))
    }
  }
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}