import { createHmac } from 'node:crypto';
import { env } from '../../config/env';

export interface IceServerConfig {
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  expiresAt: string | null;
}

/**
 * Generates short-lived TURN credentials using the coturn REST API scheme
 * (HMAC-SHA1 over an expiry-qualified username). The permanent TURN_SECRET
 * never leaves the server and is never embedded in the app.
 */
export function buildIceConfig(userId: string): IceServerConfig {
  const iceServers: IceServerConfig['iceServers'] = [{ urls: env.stunUrls }];
  let expiresAt: string | null = null;

  if (env.TURN_ENABLED && env.TURN_SECRET && env.turnUrls.length > 0) {
    const ttl = env.TURN_TTL_SECONDS;
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    // username = "<expiry-unix>:<user-id>" — coturn validates the HMAC and expiry
    const username = `${expiry}:${userId}`;
    const credential = createHmac('sha1', env.TURN_SECRET).update(username).digest('base64');
    iceServers.push({ urls: env.turnUrls, username, credential });
    expiresAt = new Date(expiry * 1000).toISOString();
  }

  return { iceServers, expiresAt };
}
