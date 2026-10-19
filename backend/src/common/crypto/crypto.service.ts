// src/common/crypto/crypto.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  // AES-256-GCM encryption for sensitive fields (MFA secrets, etc.)
  encrypt(plaintext: string, key: Buffer): { ciphertext: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  decrypt(ciphertext: string, iv: string, tag: string, key: Buffer): string {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  // HMAC-SHA256 for webhooks (timing-safe)
  hmacSha256(secret: string, data: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  hmacVerify(secret: string, data: string, signature: string): boolean {
    const expected = this.hmacSha256(secret, data);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  // SHA-256 hash (for audit trail, request hashing)
  sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Secure random token (hex)
  randomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  // Constant-time comparison
  timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
