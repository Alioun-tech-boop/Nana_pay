export const durations = {
  instant: '0ms',
  fast: '120ms',
  base: '180ms',
  normal: '180ms',
  slow: '280ms',
  slower: '420ms',
} as const

export const easings = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  snap: 'cubic-bezier(0.2, 0.9, 0.3, 1.22)',
} as const