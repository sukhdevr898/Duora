import { randomBytes, randomInt, createHash } from 'node:crypto';

/** Opaque URL-safe token (used for QR invitations and refresh tokens). */
export function opaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Short human-typable pairing code, e.g. "DUO-482913". */
export function shortPairingCode(): string {
  const n = randomInt(0, 1_000_000);
  return `DUO-${n.toString(10).padStart(6, '0')}`;
}

/** Deterministic SHA-256 hash for refresh token storage. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
