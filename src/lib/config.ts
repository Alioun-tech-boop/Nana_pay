export type ApiMode = 'mock' | 'real'

export interface NanoPayConfig {
  apiMode: ApiMode
  apiUrl: string
  mockDelayMs: number
  apiTimeoutMs: number
  locale: string
}

const DEFAULTS: NanoPayConfig = {
  apiMode: 'mock',
  apiUrl: '',
  mockDelayMs: 250,
  apiTimeoutMs: 15000,
  locale: 'fr',
}

function toApiMode(value: string | undefined): ApiMode {
  return value === 'real' ? 'real' : 'mock'
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getConfig(): Readonly<NanoPayConfig> {
  const env = import.meta.env
  return {
    apiMode: toApiMode(env.VITE_NP_API_MODE as string | undefined),
    apiUrl: ((env.VITE_NP_API_URL as string | undefined) ?? '').replace(/\/+$/, ''),
    mockDelayMs: toPositiveInt(env.VITE_NP_MOCK_DELAY_MS as string | undefined, DEFAULTS.mockDelayMs),
    apiTimeoutMs: toPositiveInt(env.VITE_NP_API_TIMEOUT_MS as string | undefined, DEFAULTS.apiTimeoutMs),
    locale: (env.VITE_NP_LOCALE as string | undefined) ?? DEFAULTS.locale,
  }
}

export function isMockMode(): boolean {
  return getConfig().apiMode === 'mock'
}

export function getApiUrl(): string {
  return getConfig().apiUrl
}