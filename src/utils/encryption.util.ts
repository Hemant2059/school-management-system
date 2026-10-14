import * as crypto from 'crypto';

/**
 * Field-level encryption for PII at rest (citizenship/NIN/birth-cert/bank).
 *
 * Deliberately DETERMINISTIC (fixed IV): national IDs carry DB UNIQUE
 * constraints, which only hold when equal plaintexts encrypt equally. The
 * cost is equality-pattern leakage (an attacker with DB access can tell two
 * rows share an ID, but learns nothing about the value). Names/phones stay
 * plaintext (searchable + operational); full-record secrecy is the TLS +
 * RLS + access-control story, not this helper.
 *
 * OPERATIONAL RULES
 * - Set ENCRYPTION_KEY (32+ chars) and ENCRYPTION_IV (16 chars) per
 *   environment from a secret manager. The compiled-in defaults are DEV
 *   ONLY: using them outside development logs a loud warning on boot.
 * - NEVER rotate the key without re-encrypting (see scripts/encrypt-pii.ts);
 *   decrypt() returns undecryptable input unchanged (legacy-plaintext
 *   fallback), which would silently mix generations after a rotation.
 */
const DEFAULT_KEY = 'default_secret_key_32_chars_long!!';
const DEFAULT_IV = 'default_iv_16_!!';
const usingDefaults =
  !process.env.ENCRYPTION_KEY || !process.env.ENCRYPTION_IV;
if (usingDefaults && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn(
    '[SECURITY] EncryptionUtil running with DEFAULT key/IV in production. ' +
      'Set ENCRYPTION_KEY and ENCRYPTION_IV immediately.',
  );
}

export class EncryptionUtil {
  private static readonly algorithm = 'aes-256-cbc';
  private static readonly key = Buffer.from(
    process.env.ENCRYPTION_KEY || DEFAULT_KEY,
    'utf8',
  ).slice(0, 32);
  private static readonly iv = Buffer.from(
    process.env.ENCRYPTION_IV || DEFAULT_IV,
    'utf8',
  ).slice(0, 16);

  static encrypt(text: string): string {
    if (!text) return text;
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        this.iv,
      );
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedText; // Fallback if decryption fails
    }
  }

  /** Heuristic: even-length hex of whole AES blocks (used by backfill). */
  static looksEncrypted(value: string | null | undefined): boolean {
    return (
      typeof value === 'string' &&
      value.length >= 32 &&
      value.length % 32 === 0 &&
      /^[0-9a-f]+$/i.test(value)
    );
  }
}
