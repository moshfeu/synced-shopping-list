import { getStore } from '@netlify/blobs';

/**
 * Denylist of revoked sessions. Every token carries the `sid` of the sign-in it
 * belongs to, so revoking a sid invalidates its access and refresh tokens at once.
 * Entries are only needed until the longest-lived token (refresh) expires.
 */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const store = () => getStore({ name: 'mcp-revoked-sessions', consistency: 'strong' });

export async function revokeSession(sid: string) {
  const s = store();
  await s.set(sid, String(Date.now() + SESSION_TTL_MS));

  // opportunistic cleanup of entries no token can match anymore
  const { blobs } = await s.list();
  await Promise.all(
    blobs.map(async ({ key }) => {
      const expiresAt = Number(await s.get(key));
      if (expiresAt && expiresAt < Date.now()) {
        await s.delete(key);
      }
    })
  );
}

/** Throws if the store can't be read, so callers fail closed. */
export async function isRevoked(sid: string | undefined) {
  if (!sid) {
    return true; // tokens without a session can't be revoked, so never accept them
  }
  return (await store().get(sid)) !== null;
}
