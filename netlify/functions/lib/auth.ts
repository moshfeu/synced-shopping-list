import type { HandlerEvent } from '@netlify/functions';
import { getBaseUrl } from './config';
import { User } from './db';
import { errorFields, log, maskEmail } from './log';
import { isRevoked } from './revocation';
import { verify } from './tokens';

export type AuthResult =
  | { ok: true; user: User; sid?: string }
  | { ok: false; status: 401 | 503; error: string; headers: Record<string, string> };

/**
 * Checks the bearer access token issued by ./oauth.ts (shared by every authenticated endpoint).
 * `service` only prefixes the log events, e.g. `mcp.unauthorized`.
 */
export async function authenticate(event: HandlerEvent, service: string): Promise<AuthResult> {
  const bearer = (event.headers.authorization || '').match(/^Bearer (.+)$/i)?.[1];
  const claims = await verify<{ sub: string; name?: string; aud: string; sid?: string }>('access', bearer);
  const base = getBaseUrl(event);
  const audience = `${base}/api/mcp`;
  if (!claims || claims.aud !== audience) {
    log('warn', `${service}.unauthorized`, {
      reason: !bearer ? 'no_token' : !claims ? 'invalid_or_expired_token' : 'wrong_audience',
      audience: claims?.aud,
      expectedAudience: audience,
      httpMethod: event.httpMethod,
    });
    return {
      ok: false,
      status: 401,
      error: 'unauthorized',
      headers: { 'WWW-Authenticate': `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"` },
    };
  }

  try {
    if (await isRevoked(claims.sid)) {
      log('warn', `${service}.token_revoked`, { sid: claims.sid, user: maskEmail(claims.sub) });
      return {
        ok: false,
        status: 401,
        error: 'token_revoked',
        headers: {
          'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
        },
      };
    }
  } catch (error) {
    // Fail closed when the denylist can't be read
    log('error', `${service}.revocation_check_failed`, { sid: claims.sid, ...errorFields(error) });
    return { ok: false, status: 503, error: 'Temporarily unavailable', headers: {} };
  }

  return { ok: true, user: { email: claims.sub, name: claims.name }, sid: claims.sid };
}
