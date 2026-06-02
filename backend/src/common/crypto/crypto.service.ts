import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * AES-256-GCM encryption for secrets at rest (e.g. ESP API keys).
 * The 32-byte key is derived from the ENCRYPTION_KEY env via SHA-256.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('esp.encryptionKey') || '';
    this.key = createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypts plaintext and returns a single base64 string of iv:tag:ciphertext.
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypts a base64 string previously produced by encrypt().
   */
  decrypt(payload: string): string {
    try {
      const data = Buffer.from(payload, 'base64');
      const iv = data.subarray(0, IV_LENGTH);
      const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch {
      throw new InternalServerErrorException('Failed to decrypt stored secret');
    }
  }
}
