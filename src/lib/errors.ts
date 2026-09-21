import type { ApiErrorPayload } from '../types'

export type ErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'business'
  | 'conflict'
  | 'precondition'
  | 'rate-limit'
  | 'server'
  | 'aborted'
  | 'unknown'

export interface AppErrorOptions {
  kind: ErrorKind
  status?: number | null
  code?: string | null
  title?: string | null
  detail?: string | null
  field?: string | null
  requestId?: string | null
  cause?: unknown
}

export class AppError extends Error {
  readonly kind: ErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly title: string | null
  readonly detail: string | null
  readonly field: string | null
  readonly requestId: string | null

  constructor(options: AppErrorOptions) {
    super(options.title ?? 'Erreur applicative')
    this.name = 'AppError'
    this.kind = options.kind
    this.status = options.status ?? null
    this.code = options.code ?? null
    this.title = options.title ?? null
    this.detail = options.detail ?? null
    this.field = options.field ?? null
    this.requestId = options.requestId ?? null
    if (options.cause !== undefined) this.cause = options.cause
  }
}

export class AbortedError extends Error {
  constructor() {
    super('Requête annulée')
    this.name = 'AbortedError'
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isAbortedError(error: unknown): boolean {
  if (error instanceof AbortedError) return true
  if (error instanceof Error && error.name === 'AbortError') return true
  if (typeof DOMException === 'undefined') return false
  return error instanceof DOMException && error.name === 'AbortError'
}

export function mapStatusKind(status: number): ErrorKind {
  if (status >= 200 && status < 300) return 'unknown'
  if (status === 400) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 412) return 'precondition'
  if (status === 422) return 'business'
  if (status === 429) return 'rate-limit'
  if (status >= 500) return 'server'
  return 'unknown'
}

export function toApiErrorBody(error: unknown): ApiErrorPayload | null {
  if (!error || typeof error !== 'object') return null
  const record = error as Record<string, unknown>
  if (typeof record.code !== 'string' && typeof record.title !== 'string') return null
  return {
    code: typeof record.code === 'string' ? record.code : 'UNKNOWN',
    title: typeof record.title === 'string' ? record.title : '',
    detail: typeof record.detail === 'string' ? record.detail : '',
    field: typeof record.field === 'string' ? record.field : null,
  }
}

export function toAppError(error: unknown, requestId?: string | null): AppError {
  if (error instanceof AppError) {
    if (requestId && error.requestId === null) {
      return new AppError({ ...error, requestId })
    }
    return error
  }
  if (isAbortedError(error)) {
    return new AppError({ kind: 'aborted', requestId })
  }
  if (error instanceof TypeError) {
    return new AppError({
      kind: 'network',
      requestId,
      title: 'Connexion impossible',
      detail: 'Impossible de joindre le serveur.',
      cause: error,
    })
  }
  return new AppError({
    kind: 'unknown',
    requestId,
    cause: error,
  })
}

export interface FieldErrorInfo {
  code: string
  field: string
  detail: string
}

export function getFieldError(error: unknown): FieldErrorInfo | null {
  if (!isAppError(error)) return null
  if (error.field === null || error.field === undefined) return null
  return {
    code: error.code ?? 'INVALID_FIELD',
    field: error.field,
    detail: error.detail ?? error.title ?? 'Champ invalide',
  }
}

const USER_MESSAGES: Record<ErrorKind, string> = {
  network: 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.',
  timeout: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  unauthorized: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: 'Vous n’avez pas accès à cette ressource.',
  'not-found': 'Cette ressource est introuvable.',
  validation: 'Certaines informations sont invalides. Vérifiez votre saisie.',
  business: 'L’opération n’a pas pu être validée.',
  conflict: 'Cette opération est déjà en cours ou déjà traitée.',
  precondition: 'L’opération n’est plus valide à ce stade.',
  'rate-limit': 'Trop de tentatives. Veuillez patienter puis réessayer.',
  server: 'Le service est momentanément indisponible. Réessayez plus tard.',
  aborted: 'Opération annulée.',
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
}

export function toUserMessage(error: unknown): string {
  if (!isAppError(error)) return USER_MESSAGES.unknown
  if (error.title && error.detail) return error.detail
  if (error.detail) return error.detail
  if (error.title) return error.title
  return USER_MESSAGES[error.kind]
}