// src/merchants/merchant.dto.spec.ts
import {
  ALLOWED_CONTENT_TYPES,
  MAX_IMAGE_SIZE,
  detectImageContentType,
  validateImageFile,
} from './dto/merchant.dto';

/** Construit un buffer dont les premiers octets forment la signature voulue. */
function bufferWithSignature(bytes: number[], totalLength = 64): Buffer {
  const buf = Buffer.alloc(totalLength, 0);
  bytes.forEach((b, i) => (buf[i] = b));
  return buf;
}

describe('detectImageContentType (magic numbers)', () => {
  it('détecte un JPEG (FF D8 FF)', () => {
    expect(detectImageContentType(bufferWithSignature([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });

  it('détecte un PNG (signature 8 octets)', () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    expect(detectImageContentType(bufferWithSignature(png))).toBe('image/png');
  });

  it('détecte un WebP (RIFF....WEBP)', () => {
    const webp = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
    expect(detectImageContentType(bufferWithSignature(webp))).toBe('image/webp');
  });

  it('rejette un fichier texte', () => {
    expect(detectImageContentType(Buffer.from('ceci nest pas une image'))).toBeNull();
  });

  it('rejette un SVG (vecteur actif, exclu du contrat)', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectImageContentType(svg)).toBeNull();
  });

  it('rejette un buffer trop court', () => {
    expect(detectImageContentType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
  });
});

describe('validateImageFile', () => {
  it('accepte un JPEG valide et retourne le type réel', () => {
    const result = validateImageFile(bufferWithSignature([0xff, 0xd8, 0xff, 0xe0]));
    expect(result).toEqual({ valid: true, contentType: 'image/jpeg' });
  });

  it('accepte un PNG valide', () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    expect(validateImageFile(bufferWithSignature(png))).toEqual({
      valid: true,
      contentType: 'image/png',
    });
  });

  it('rejette un fichier vide', () => {
    const result = validateImageFile(Buffer.alloc(0));
    expect(result.valid).toBe(false);
  });

  it('rejette un fichier dépassant 5 Mo', () => {
    const big = Buffer.alloc(MAX_IMAGE_SIZE + 1);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    const result = validateImageFile(big);
    expect(result.valid).toBe(false);
    if (result.valid === false) expect(result.reason).toContain('5 Mo');
  });

  it('accepte un fichier exactement à la limite de 5 Mo', () => {
    const exact = Buffer.alloc(MAX_IMAGE_SIZE);
    exact[0] = 0xff;
    exact[1] = 0xd8;
    exact[2] = 0xff;
    expect(validateImageFile(exact).valid).toBe(true);
  });

  it('rejette un fichier dont le contenu ne correspond à aucun format autorisé', () => {
    const result = validateImageFile(Buffer.from('<?php system($_GET["c"]); ?>'));
    expect(result.valid).toBe(false);
    if (result.valid === false) expect(result.reason).toContain('Format non autorisé');
  });

  it("n'accepte que les trois formats du contrat", () => {
    expect([...ALLOWED_CONTENT_TYPES]).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });
});
