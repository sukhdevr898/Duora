import { randomBytes, randomUUID } from 'node:crypto';

/** Short, URL-safe, sortable-ish id. */
export function id(prefix = ''): string {
  const uuid = randomUUID().replace(/-/g, '');
  return prefix ? `${prefix}_${uuid.slice(0, 20)}` : uuid.slice(0, 24);
}

/** 6-character human pairing code without ambiguous glyphs (0/O, 1/I). */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function pairingCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Opaque token embedded in the pairing QR payload. */
export function pairingToken(): string {
  return randomBytes(24).toString('base64url');
}

export const nowIso = (): string => new Date().toISOString();
