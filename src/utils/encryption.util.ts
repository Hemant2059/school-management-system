import * as crypto from 'crypto';

export class EncryptionUtil {
  private static readonly algorithm = 'aes-256-cbc';
  private static readonly key = Buffer.from(
    process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!',
    'utf8',
  ).slice(0, 32);
  private static readonly iv = Buffer.from(
    process.env.ENCRYPTION_IV || 'default_iv_16_!!',
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
}
