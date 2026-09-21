export interface RegisterIdentityState {
  firstName: string
  lastName: string
  birthDate: string
}

export interface RegisterContactState extends RegisterIdentityState {
  contact: string
  contactType: 'email' | 'phone'
}

export interface RegisterFlowState extends RegisterContactState {
  password: string
  confirmPassword: string
}
