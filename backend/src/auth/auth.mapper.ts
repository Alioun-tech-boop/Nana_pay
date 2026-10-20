// src/auth/auth.mapper.ts
import type { Role } from '@prisma/client';

export type UserRole = 'CLIENT' | 'MERCHANT' | 'BANK' | 'ADMIN';

/**
 * Permissions renvoyees par le backend (API-CONTRACT.md §3.1).
 * Le front n'affiche que ce qui est autorise ; le backend reste l'autorite
 * (voir RolesGuard). Les listes decrivent les actions minimales par role.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  CLIENT: [
    'profile:read',
    'profile:update',
    'orders:read',
    'orders:create',
    'savings:read',
    'savings:start',
  ],
  MERCHANT: [
    'profile:read',
    'profile:update',
    'orders:read',
    'orders:update',
    'products:read',
    'products:create',
    'products:update',
    'withdrawals:read',
    'settlements:read',
  ],
  BANK: ['profile:read', 'users:read', 'credits:read', 'credits:decide'],
  ADMIN: [
    'profile:read',
    'users:read',
    'users:update',
    'merchants:read',
    'merchants:validate',
    'products:read',
    'orders:read',
    'credits:read',
    'audit:read',
  ],
};

/** Contrat utilisateur — aucun champ financier autorise ici. */
export interface ContractUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  merchantId: string | null;
  permissions: string[];
}

export function toContractUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roles: readonly Role[] | readonly string[];
  merchant?: { id: string } | null;
}): ContractUser {
  const raw = user.roles[0] ?? 'CLIENT';
  const role: UserRole = (raw in ROLE_PERMISSIONS ? raw : 'CLIENT') as UserRole;

  return {
    id: user.id,
    role,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email ?? '',
    phone: user.phone ?? '',
    merchantId: user.merchant?.id ?? null,
    permissions: [...ROLE_PERMISSIONS[role]],
  };
}
