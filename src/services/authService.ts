import { api } from '../api'
import type { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse, User, VerifyRequest, VerifyResponse } from '../types'

export interface LoginInput extends LoginRequest {}

export interface RegisterInput {
  firstName: string
  lastName: string
  birthDate: string
  contact: string
  contactType: 'email' | 'phone'
  email: string
  phone: string
  password: string
}

export const authService = {
  login(input: LoginInput): Promise<LoginResponse> {
    return api.request<LoginResponse>({
      method: 'POST',
      path: '/auth/login',
      body: input,
      auth: false,
    })
  },

  register(input: RegisterInput): Promise<RegisterResponse> {
    return api.request<RegisterResponse>({
      method: 'POST',
      path: '/auth/register',
      body: {
        ...input,
        fullName: `${input.firstName} ${input.lastName}`.trim(),
      } satisfies RegisterRequest,
      auth: false,
    })
  },

  verify(input: VerifyRequest): Promise<VerifyResponse> {
    return api.request<VerifyResponse>({
      method: 'POST',
      path: '/auth/verify',
      body: input,
      auth: false,
    })
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return api.request<RefreshResponse>({
      method: 'POST',
      path: '/auth/refresh',
      body: { refreshToken },
      auth: false,
    })
  },

  logout(refreshToken: string): Promise<void> {
    return api.request<void>({
      method: 'POST',
      path: '/auth/logout',
      body: { refreshToken },
    })
  },

  me(): Promise<User> {
    return api.request<User>({
      method: 'GET',
      path: '/auth/me',
    })
  },
}