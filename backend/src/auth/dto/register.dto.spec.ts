// src/auth/dto/register.dto.spec.ts
import { RegisterDtoSchema } from './register.dto';

/**
 * Inscription simplifiee : seuls l'email/telephone et le mot de passe sont
 * exiges. Ces tests verrouillent le contrat (le frontend ne demande plus
 * prenom/nom/date de naissance).
 */
describe('RegisterDtoSchema', () => {
  it('accepte une inscription email + mot de passe, sans prenom ni nom', () => {
    const parsed = RegisterDtoSchema.parse({
      email: 'ada@example.com',
      password: 'motdepasse',
    });

    expect(parsed.email).toBe('ada@example.com');
    expect(parsed.phone).toBeUndefined();
    // Colonnes Prisma NOT NULL : on normalise vers une chaine vide, jamais undefined.
    expect(parsed.firstName).toBe('');
    expect(parsed.lastName).toBe('');
  });

  it('accepte une inscription telephone + mot de passe', () => {
    const parsed = RegisterDtoSchema.parse({
      contact: '+225 07 00 00 00 00',
      contactType: 'phone',
      password: 'motdepasse',
    });

    expect(parsed.phone).toBe('+225 07 00 00 00 00');
    expect(parsed.firstName).toBe('');
    expect(parsed.lastName).toBe('');
  });

  it('conserve un prenom/nom fournis (profil complete plus tard)', () => {
    const parsed = RegisterDtoSchema.parse({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Doumbia',
      password: 'motdepasse',
    });

    expect(parsed.firstName).toBe('Ada');
    expect(parsed.lastName).toBe('Doumbia');
  });

  it('refuse une inscription sans email ni telephone', () => {
    expect(() => RegisterDtoSchema.parse({ password: 'motdepasse' })).toThrow();
  });

  it('refuse un mot de passe trop court', () => {
    expect(() =>
      RegisterDtoSchema.parse({ email: 'ada@example.com', password: 'court' }),
    ).toThrow();
  });
});
