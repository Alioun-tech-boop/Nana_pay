// src/auth/auth.mapper.spec.ts
import { displayNameFor, toContractUser } from './auth.mapper';

/**
 * Depuis l'inscription simplifiee, `firstName`/`lastName` peuvent etre vides :
 * `fullName` ne doit jamais rester vide sous peine d'afficher une identite
 * absente dans l'interface.
 */
describe('displayNameFor', () => {
  it('utilise le prenom et le nom quand ils sont fournis', () => {
    expect(displayNameFor({ firstName: 'Ada', lastName: 'Doumbia' })).toBe('Ada Doumbia');
  });

  it('retombe sur la partie locale de l’email si les noms sont vides', () => {
    expect(displayNameFor({ firstName: '', lastName: '', email: 'ada.doumbia@example.com' })).toBe(
      'ada.doumbia',
    );
  });

  it('retombe sur le telephone si ni nom ni email', () => {
    expect(displayNameFor({ firstName: '', lastName: '', phone: '+2250700000000' })).toBe(
      '+2250700000000',
    );
  });
});

describe('toContractUser', () => {
  it('ne renvoie jamais un fullName vide', () => {
    const contract = toContractUser({
      id: 'user-1',
      firstName: '',
      lastName: '',
      email: 'ada@example.com',
      phone: null,
      roles: ['CLIENT'],
    });

    expect(contract.fullName).toBe('ada');
    expect(contract.role).toBe('CLIENT');
  });
});
