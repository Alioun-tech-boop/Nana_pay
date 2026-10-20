export type ApiMode = 'mock' | 'real'

export interface NanaPayConfig {
  apiMode: ApiMode
  apiUrl: string
  mockDelayMs: number
  apiTimeoutMs: number
  locale: string
}

const DEFAULTS: NanaPayConfig = {
  apiMode: 'mock',
  apiUrl: '',
  mockDelayMs: 250,
  apiTimeoutMs: 15000,
  locale: 'fr',
}

/**
 * Surcharge réservée aux tests.
 *
 * Le mode du client est fixé par `import.meta.env` au chargement du module, avant
 * que le moindre test ne s'exécute. Impossible donc de tester le parcours «
 * backend réel » en réglant une variable d'environnement : on autorise
 * explicitement une surcharge en mémoire, utilisée uniquement par les tests.
 */
let override: Partial<NanaPayConfig> | null = null

export function setConfigForTests(partial: Partial<NanaPayConfig> | null): void {
  override = partial
}

function toApiMode(value: string | undefined): ApiMode {
  return value === 'real' ? 'real' : 'mock'
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getConfig(): Readonly<NanaPayConfig> {
  const env = import.meta.env
  const fromEnv: NanaPayConfig = {
    apiMode: toApiMode(env.VITE_NP_API_MODE as string | undefined),
    apiUrl: ((env.VITE_NP_API_URL as string | undefined) ?? '').replace(/\/+$/, ''),
    mockDelayMs: toPositiveInt(env.VITE_NP_MOCK_DELAY_MS as string | undefined, DEFAULTS.mockDelayMs),
    apiTimeoutMs: toPositiveInt(env.VITE_NP_API_TIMEOUT_MS as string | undefined, DEFAULTS.apiTimeoutMs),
    locale: (env.VITE_NP_LOCALE as string | undefined) ?? DEFAULTS.locale,
  }
  return override ? { ...fromEnv, ...override } : fromEnv
}

export function isMockMode(): boolean {
  return getConfig().apiMode === 'mock'
}

export function getApiUrl(): string {
  return getConfig().apiUrl
}
