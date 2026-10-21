// src/merchants/merchants.controller.spec.ts
import 'reflect-metadata';
import { MerchantsController } from './merchants.controller';

/**
 * Vérifie les métadonnées d'accès des routes d'image.
 *
 * Ces deux règles sont critiques : se tromper d'un côté casse l'affichage du
 * catalogue (image publique inaccessible) ou expose un upload non protégé.
 */
describe('MerchantsController — accès aux routes image', () => {
  it('sert l’image publiquement (le catalogue est visible par tout visiteur)', () => {
    const isPublic = Reflect.getMetadata('isPublic', MerchantsController.prototype.getImage);
    expect(isPublic).toBe(true);
  });

  it('n’ouvre JAMAIS l’upload aux visiteurs anonymes', () => {
    const isPublic = Reflect.getMetadata('isPublic', MerchantsController.prototype.uploadImage);
    expect(isPublic).toBeUndefined();
  });

  it('exige le rôle MERCHANT pour téléverser', () => {
    const roles = Reflect.getMetadata('roles', MerchantsController.prototype.uploadImage);
    expect(roles).toEqual(['MERCHANT']);
  });

  it('n’exige aucun rôle pour lire une image', () => {
    const roles = Reflect.getMetadata('roles', MerchantsController.prototype.getImage);
    expect(roles).toBeUndefined();
  });
});
