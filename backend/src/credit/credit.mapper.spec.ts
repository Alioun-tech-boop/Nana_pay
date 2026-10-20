// src/credit/credit.mapper.spec.ts
import { bpsToPercent, toDbStatuses, toRequestStatus } from './credit.mapper';

/**
 * Traduction base <-> contrat des statuts de crédit.
 *
 * La base connaît tout le cycle de vie (`REQUESTED` … `DEFAULTED`) ; le contrat
 * n'expose pour une **demande** que quatre états. La correspondance est
 * centralisée ici pour qu'aucun consommateur n'ait à connaître deux
 * vocabulaires (`AGENTS.md` §17).
 */

describe('toRequestStatus', () => {
  it('regroupe les états pré-décision en « en analyse »', () => {
    expect(toRequestStatus('REQUESTED')).toBe('IN_REVIEW');
    expect(toRequestStatus('UNDER_REVIEW')).toBe('IN_REVIEW');
  });

  it('mappe l’accord et tout ce qui suit vers APPROVED', () => {
    expect(toRequestStatus('APPROVED')).toBe('APPROVED');
    expect(toRequestStatus('DISBURSED')).toBe('APPROVED');
    expect(toRequestStatus('REPAYING')).toBe('APPROVED');
    expect(toRequestStatus('COMPLETED')).toBe('APPROVED');
  });

  it('conserve refus et annulation', () => {
    expect(toRequestStatus('REFUSED')).toBe('REFUSED');
    expect(toRequestStatus('CANCELLED')).toBe('CANCELLED');
  });

  it('retombe sur IN_REVIEW pour un statut inconnu plutôt que d’exposer du brut', () => {
    expect(toRequestStatus('SOMETHING_ELSE')).toBe('IN_REVIEW');
  });
});

describe('toDbStatuses', () => {
  it('IN_REVIEW couvre les deux statuts pré-décision', () => {
    expect(toDbStatuses('IN_REVIEW')).toEqual(['REQUESTED', 'UNDER_REVIEW']);
  });

  it('APPROVED couvre tous les états post-accord', () => {
    expect(toDbStatuses('APPROVED')).toContain('DISBURSED');
    expect(toDbStatuses('APPROVED')).toContain('REPAYING');
  });

  it('chaque statut de contrat a au moins une correspondance base', () => {
    for (const status of ['IN_REVIEW', 'APPROVED', 'REFUSED', 'CANCELLED'] as const) {
      expect(toDbStatuses(status).length).toBeGreaterThan(0);
    }
  });
});

describe('bpsToPercent', () => {
  it('convertit les points de base en pourcentage', () => {
    expect(bpsToPercent(500)).toBe(5);
    expect(bpsToPercent(700)).toBe(7);
    expect(bpsToPercent(1150)).toBe(11.5);
  });
});
