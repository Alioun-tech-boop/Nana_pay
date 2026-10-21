// src/auth/auth.mapper.ts
import type { Role } from '@prisma/client';

export type UserRole = 'CLIENT' | 'MERCHANT' | 'BANK' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Permissions renvoyees par le backend (API-CONTRACT.md §3.1).
 * Le front n'affiche que ce qui est autorise ; le backend reste l'autorite
 * (voir RolesGuard). Les listes decrivent les actions minimales par role.
 */
const ADMIN_PERMISSIONS = [
  'profile:read',
  'users:read',
  'users:update',
  'merchants:read',
  'merchants:validate',
  'products:read',
  'orders:read',
  'credits:read',
  'audit:read',
] as const;

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
  ADMIN: ADMIN_PERMISSIONS,
  // Break-glass (cf. schema.prisma). Identique a ADMIN pour l'instant : le MFA
  // renforce et la double approbation annonces dans le schema ne sont pas encore
  // implementes. Ne pas le laisser retomber en CLIENT silencieusement.
  SUPER_ADMIN: ADMIN_PERMISSIONS,
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
    fullName: displayNameFor(user),
    email: user.email ?? '',
    phone: user.phone ?? '',
    merchantId: user.merchant?.id ?? null,
    permissions: [...ROLE_PERMISSIONS[role]],
  };
}

/**
 * Nom affichable pour un utilisateur.
 *
 * Depuis l'inscription simplifiee (email/telephone + mot de passe), `firstName`
 * et `lastName` peuvent etre vides. On retombe alors sur la partie locale de
 * l'email, ou le numero de telephone — jamais sur une chaine vide, qui
 * laisserait le tableau de bord sans identite a afficher.
 */
export function displayNameFor(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  if (full) return full;
  const email = (user.email ?? '').trim();
  if (email.includes('@')) return email.split('@')[0] ?? email;
  if (email) return email;
  const phone = (user.phone ?? '').trim();
  return phone;
}
