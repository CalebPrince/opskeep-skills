import crypto from "node:crypto";

// Admin login password hashing (scrypt). A changed password is stored in the
// shared JSON store (data.adminAuth.passwordHash) and takes over from
// OPSKEEP_ADMIN_PASSWORD from then on; until a password is set here, login
// still falls back to the env var, unchanged from before this module existed.

const KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN);
  return { salt: salt.toString("base64url"), hash: hash.toString("base64url") };
}

export function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const salt = Buffer.from(record.salt, "base64url");
  const expected = Buffer.from(record.hash, "base64url");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
