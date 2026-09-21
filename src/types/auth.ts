export const USER_ROLES = ['CLIENT', 'MERCHANT', 'BANK', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

export type Permission = string

export interface User {
  id: string
  role: UserRole
  fullName: string
  email: string
  phone: string
  merchantId: string | null
  permissions: Permission[]
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  firstName?: string
  lastName?: string
  birthDate?: string
  email: string
  phone: string
  password: string
}

export interface RegisterResponse {
  id: string
  fullName: string
  email: string
  phone: string
  status: 'PENDING_VERIFICATION'
}

export interface VerifyRequest {
  identifier: string
  code: string
}

export interface VerifyResponse {
  verified: boolean
  id: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  user: User
}