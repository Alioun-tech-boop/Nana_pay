// src/merchants/dto/merchant.dto.ts
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

/** Formats acceptés (contrat : JPEG, PNG, WebP). */
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

/**
 * Détecte le type réel d'une image à partir de ses premiers octets
 * (« magic numbers »).
 *
 * On ne fait jamais confiance au `mimetype` déclaré par le client ni à
 * l'extension du fichier (`AGENTS.md` §30 — la validation frontend est une
 * protection d'UX, la validation backend est la sécurité).
 */
export function detectImageContentType(buffer: Buffer): AllowedContentType | null {
  if (buffer.length < 12) return null;

  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG : 89 50 4E 47 0D 0A 1A 0A
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG_SIGNATURE.every((byte, i) => buffer[i] === byte)) {
    return 'image/png';
  }

  // WebP : "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Valide une image avant stockage.
 *
 * Retourne le type MIME **réel** détecté (jamais celui déclaré par le client)
 * afin qu'il soit celui stocké en base et renvoyé par l'URL de service.
 */
export function validateImageFile(
  buffer: Buffer,
): { valid: true; contentType: AllowedContentType } | { valid: false; reason: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: 'Aucun fichier reçu.' };
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      reason: `L'image dépasse 5 Mo (${Math.round(buffer.length / 1024 / 1024)} Mo).`,
    };
  }

  const contentType = detectImageContentType(buffer);
  if (!contentType) {
    return { valid: false, reason: 'Format non autorisé : JPEG, PNG ou WebP uniquement.' };
  }

  return { valid: true, contentType };
}
