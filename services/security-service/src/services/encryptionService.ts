import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);
const randomBytes = promisify(crypto.randomBytes);

export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly encoding = "hex";

  async hashPassword(password: string): Promise<string> {
    const salt = (await randomBytes(16)).toString(this.encoding);
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString(this.encoding)}`;
  }

  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const [salt, key] = hashedPassword.split(":");
      const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
      return derivedKey.toString(this.encoding) === key;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  encryptData(
    data: string,
    encryptionKey: string,
  ): { encryptedData: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(encryptionKey, this.encoding),
      iv,
    );

    let encryptedData = cipher.update(data, "utf8", this.encoding);
    encryptedData += cipher.final(this.encoding);
    const authTag = cipher.getAuthTag();

    return {
      encryptedData,
      iv: iv.toString(this.encoding),
      authTag: authTag.toString(this.encoding),
    };
  }

  decryptData(
    encryptedData: string,
    encryptionKey: string,
    iv: string,
    authTag: string,
  ): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(encryptionKey, this.encoding),
      Buffer.from(iv, this.encoding),
    );

    decipher.setAuthTag(Buffer.from(authTag, this.encoding));

    let decrypted = decipher.update(encryptedData, this.encoding, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString(this.encoding);
  }

  generateApiKey(): string {
    return crypto.randomBytes(32).toString("base64");
  }

  hashApiKey(apiKey: string): string {
    return crypto.createHash("sha256").update(apiKey).digest(this.encoding);
  }

  // Field-level encryption for sensitive data
  encryptSensitiveField(
    value: string,
    masterKey: string,
  ): { encrypted: string; iv: string; tag: string } {
    return this.encryptData(value, masterKey);
  }

  decryptSensitiveField(
    encrypted: string,
    masterKey: string,
    iv: string,
    tag: string,
  ): string {
    return this.decryptData(encrypted, masterKey, iv, tag);
  }

  // Tokenization for sensitive data (PII)
  tokenizePII(value: string): string {
    // Replace actual PII with token for display
    const hash = crypto
      .createHash("sha256")
      .update(value)
      .digest(this.encoding);
    return `token_${hash.substring(0, 16)}`;
  }

  // Generate secure random codes
  generateSecureCode(length: number = 32): string {
    return crypto.randomBytes(length).toString(this.encoding);
  }

  // HMAC for data integrity
  generateHMAC(data: string, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest(this.encoding);
  }

  verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}

export const encryptionService = new EncryptionService();

export default EncryptionService;
