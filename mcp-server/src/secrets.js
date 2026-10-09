import crypto from "node:crypto";

// Encrypts API keys recorded through the client key registry tools, at rest
// in the shared store. Mirrors admin/secrets.js so a key encrypted here can
// be decrypted by the admin dashboard (and vice versa) when both point at
// the same OPSKEEP_STORE_FILE and OPSKEEP_KEY_ENCRYPTION_SECRET — keep the
// two files in sync if either changes.

const SECRET = process.env.OPSKEEP_KEY_ENCRYPTION_SECRET || "";

export function keyVaultConfigured() {
  return SECRET.length >= 24;
}

function encryptionKey() {
  if (!keyVaultConfigured()) throw new Error("Set OPSKEEP_KEY_ENCRYPTION_SECRET to at least 24 characters before recording provider keys.");
  return crypto.createHash("sha256").update(SECRET).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return { version: 1, algorithm: "aes-256-gcm", iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), ciphertext: ciphertext.toString("base64url") };
}

export function decryptSecret(record) {
  if (!record || record.algorithm !== "aes-256-gcm") throw new Error("This key has no usable encrypted credential.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(record.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(record.tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
