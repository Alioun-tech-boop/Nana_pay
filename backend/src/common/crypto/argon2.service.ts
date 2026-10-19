// src/common/crypto/argon2.service.ts
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Argon2Service {
  constructor(private readonly config: ConfigService) {}

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      memoryCost: this.config.get<number>('ARGON2_MEMORY', 65536),
      timeCost: this.config.get<number>('ARGON2_TIME', 3),
      parallelism: this.config.get<number>('ARGON2_PARALLELISM', 1),
      hashLength: 32,
    });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async needsRehash(hash: string): Promise<boolean> {
    return argon2.needsRehash(hash, {
      memoryCost: this.config.get<number>('ARGON2_MEMORY', 65536),
      timeCost: this.config.get<number>('ARGON2_TIME', 3),
      parallelism: this.config.get<number>('ARGON2_PARALLELISM', 1),
    });
  }
}
