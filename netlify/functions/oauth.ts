import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { connectLambda } from '@netlify/blobs';
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config, getBaseUrl } from './lib/config';
import { createRepository } from './lib/db';
import { jsonResponse, preflightResponse } from './lib/http';
import { errorFields, flushLogs, log, maskEmail } from './lib/log';
import { isRevoked, revokeSession } from './lib/revocation';
import { ACCESS_TOKEN_TTL_SECONDS, sign, verify } from './lib/tokens';

/**
 * Minimal OAuth 2.1 authorization server for MCP clients (DCR + PKCE).
 * Users sign in with Google, like in the web app. Everything is stateless: client
 * registrations, auth codes and tokens are signed JWTs.
 */

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

type ClientToken = { redirect_uris: string[]; client_name?: string };
type AuthzState = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  state?: string;
};
type CodeToken = AuthzState & { email: string; name?: string; sid: string };
type RefreshToken = { sub: string; name?: string; client_id: string; sid: string };

const json = (statusCode: number, body: unknown, headers = {}) =>
  jsonResponse(statusCode, body, { 'Cache-Control': 'no-store', ...headers });

const oauthError = (error: string, description: string, statusCode = 400) =>
  json(statusCode, { error, error_description: description });

const redirect = (location: string): HandlerResponse => ({
  statusCode: 302,
  headers: { Location: location, 'Cache-Control': 'no-store' },
});

const page = (statusCode: number, message: string): HandlerResponse => ({
  statusCode,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!doctype html><meta charset="utf-8"><title>Synced Shopping List</title><p>${message.replace(
    /[<>&]/g,
    ''
  )}</p>`,
});

function isValidRedirectUri(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    const url = new URL(value);
    if (url.hash) {
      return false;
    }
    if (url.protocol === 'https:') {
      return true;
    }
    if (url.protocol === 'http:') {
      return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    }
    // custom schemes of native clients, but never anything that can run script
    return !['javascript:', 'data:', 'file:', 'vbscript:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function withParams(uri: string, params: Record<string, string | undefined>) {
  const url = new URL(uri);
  Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
  return url.toString();
}

function pkceMatches(verifier: string, challenge: string) {
  const computed = createHash('sha256').update(verifier).digest('base64url');
  const a = Buffer.from(computed);
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBody(event: HandlerEvent): Record<string, string> {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString()
    : event.body || '';
  if ((event.headers['content-type'] || '').includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

function metadata(event: HandlerEvent, path: string) {
  const base = getBaseUrl(event);
  if (path.includes('/.well-known/oauth-protected-resource')) {
    return json(200, {
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ['header'],
    });
  }
  return json(200, {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    revocation_endpoint: `${base}/oauth/revoke`,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
}

/** Host only: redirect URIs can carry state in their path or query. */
function hostOf(uri: string | undefined) {
  try {
    return new URL(uri || '').host;
  } catch {
    return undefined;
  }
}

async function register(event: HandlerEvent) {
  const { redirect_uris, client_name } = parseBodyJson(event);
  if (
    !Array.isArray(redirect_uris) ||
    !redirect_uris.length ||
    !redirect_uris.every(isValidRedirectUri)
  ) {
    log('warn', 'oauth.register_rejected', { reason: 'invalid_redirect_uris', client: String(client_name).slice(0, 100) });
    return oauthError('invalid_redirect_uri', 'redirect_uris are missing or invalid');
  }
  const name = typeof client_name === 'string' ? client_name.slice(0, 100) : undefined;
  const clientId = await sign('client', { redirect_uris, client_name: name });
  log('info', 'oauth.register', { client: name, redirectHosts: redirect_uris.map(hostOf) });
  return json(201, {
    client_id: clientId,
    client_name: name,
    redirect_uris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
}

function parseBodyJson(event: HandlerEvent): Record<string, any> {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return {};
  }
}

async function authorize(event: HandlerEvent) {
  const q = event.queryStringParameters || {};
  const client = await verify<ClientToken>('client', q.client_id);
  if (!client || !q.redirect_uri || !client.redirect_uris.includes(q.redirect_uri)) {
    // Never redirect to an unverified redirect_uri
    log('warn', 'oauth.authorize_rejected', {
      reason: !client ? 'invalid_client_id' : !q.redirect_uri ? 'missing_redirect_uri' : 'redirect_uri_not_registered',
      redirectHost: hostOf(q.redirect_uri),
    });
    return page(400, 'Unknown client or redirect URI.');
  }
  const fail = (error: string, description: string) =>
    redirect(withParams(q.redirect_uri!, { error, error_description: description, state: q.state }));

  if (q.response_type !== 'code') {
    log('warn', 'oauth.authorize_rejected', { reason: 'unsupported_response_type', responseType: q.response_type });
    return fail('unsupported_response_type', 'Only response_type=code is supported');
  }
  if (!q.code_challenge || q.code_challenge_method !== 'S256') {
    log('warn', 'oauth.authorize_rejected', { reason: 'pkce_s256_required', method: q.code_challenge_method });
    return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required');
  }

  const state = await sign(
    'authz',
    {
      client_id: q.client_id,
      redirect_uri: q.redirect_uri,
      code_challenge: q.code_challenge,
      state: q.state,
    },
    '10m'
  );
  log('info', 'oauth.authorize', { client: client.client_name, redirectHost: hostOf(q.redirect_uri) });
  return redirect(
    withParams('https://accounts.google.com/o/oauth2/v2/auth', {
      client_id: config.googleClientId,
      redirect_uri: `${getBaseUrl(event)}/oauth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    })
  );
}

async function callback(event: HandlerEvent) {
  const q = event.queryStringParameters || {};
  const authz = await verify<AuthzState>('authz', q.state);
  if (!authz) {
    log('warn', 'oauth.callback_rejected', { reason: 'invalid_or_expired_state' });
    return page(400, 'Sign-in expired or invalid. Please start again from your AI agent.');
  }
  const fail = (error: string, description: string) =>
    redirect(withParams(authz.redirect_uri, { error, error_description: description, state: authz.state }));

  if (q.error || !q.code) {
    log('warn', 'oauth.callback_rejected', { reason: 'google_error_or_no_code', googleError: q.error });
    return fail('access_denied', q.error || 'Sign-in was cancelled');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: q.code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: `${getBaseUrl(event)}/oauth/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenResponse.ok) {
    // Google's error body names the cause (invalid_client, redirect_uri_mismatch, ...) and holds no secrets
    const detail = await tokenResponse.json().catch(() => ({}));
    log('error', 'oauth.google_token_exchange_failed', {
      status: tokenResponse.status,
      googleError: detail.error,
      googleErrorDescription: detail.error_description,
      redirectUri: `${getBaseUrl(event)}/oauth/callback`,
    });
    return fail('server_error', 'Google sign-in failed');
  }

  let email: string;
  let name: string | undefined;
  try {
    const { id_token } = await tokenResponse.json();
    const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: config.googleClientId,
    });
    if (!payload.email || payload.email_verified !== true) {
      log('warn', 'oauth.callback_rejected', { reason: 'email_not_verified' });
      return fail('access_denied', 'Google account email is not verified');
    }
    email = String(payload.email).toLowerCase();
    name = payload.name as string | undefined;
  } catch (error) {
    log('error', 'oauth.google_identity_failed', errorFields(error));
    return fail('server_error', 'Could not verify the Google identity');
  }

  // Same authorization as the web app: the database rules decide who gets in
  try {
    await createRepository({ email, name }).getCategories();
  } catch (error) {
    log('warn', 'oauth.access_denied', { user: maskEmail(email), ...errorFields(error) });
    return fail('access_denied', `${email} is not allowed to access this shopping list`);
  }

  const code = await sign(
    'code',
    { ...authz, email, name, sid: randomUUID() } satisfies CodeToken,
    '2m'
  );
  log('info', 'oauth.signed_in', { user: maskEmail(email), redirectHost: hostOf(authz.redirect_uri) });
  return redirect(withParams(authz.redirect_uri, { code, state: authz.state }));
}

async function issueTokens(
  event: HandlerEvent,
  email: string,
  name: string | undefined,
  clientId: string,
  sid: string
) {
  const base = getBaseUrl(event);
  const [accessToken, refreshToken] = await Promise.all([
    sign('access', { sub: email, name, sid, aud: `${base}/api/mcp` }, `${ACCESS_TOKEN_TTL_SECONDS}s`),
    sign('refresh', { sub: email, name, sid, client_id: clientId }, '30d'),
  ]);
  return json(200, {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
  });
}

async function token(event: HandlerEvent) {
  const body = parseBody(event);

  if (body.grant_type === 'authorization_code') {
    const code = await verify<CodeToken>('code', body.code);
    const rejection = !code
      ? 'invalid_or_expired_code'
      : code.client_id !== body.client_id
        ? 'client_id_mismatch'
        : code.redirect_uri !== body.redirect_uri
          ? 'redirect_uri_mismatch'
          : !body.code_verifier || !pkceMatches(body.code_verifier, code.code_challenge)
            ? 'pkce_mismatch'
            : undefined;
    if (!code || rejection) {
      log('warn', 'oauth.token_rejected', { grant: 'authorization_code', reason: rejection });
      return oauthError('invalid_grant', 'Invalid authorization code or PKCE verifier');
    }
    log('info', 'oauth.token', { grant: 'authorization_code', sid: code.sid, user: maskEmail(code.email) });
    return issueTokens(event, code.email, code.name, code.client_id, code.sid);
  }

  if (body.grant_type === 'refresh_token') {
    const refresh = await verify<RefreshToken>('refresh', body.refresh_token);
    if (!refresh || (body.client_id && refresh.client_id !== body.client_id)) {
      log('warn', 'oauth.token_rejected', {
        grant: 'refresh_token',
        reason: !refresh ? 'invalid_or_expired_refresh_token' : 'client_id_mismatch',
      });
      return oauthError('invalid_grant', 'Invalid refresh token');
    }
    if (await isRevoked(refresh.sid)) {
      log('warn', 'oauth.token_rejected', { grant: 'refresh_token', reason: 'session_revoked', sid: refresh.sid });
      return oauthError('invalid_grant', 'Session was revoked');
    }
    log('info', 'oauth.token', { grant: 'refresh_token', sid: refresh.sid, user: maskEmail(refresh.sub) });
    return issueTokens(event, refresh.sub, refresh.name, refresh.client_id, refresh.sid);
  }

  log('warn', 'oauth.token_rejected', { reason: 'unsupported_grant_type', grant: body.grant_type });
  return oauthError('unsupported_grant_type', 'Unsupported grant_type');
}

/** RFC 7009: revoking an access or refresh token ends its whole session. Always answers 200. */
async function revoke(event: HandlerEvent) {
  const { token: value } = parseBody(event);
  const claims =
    (await verify<{ sid?: string }>('refresh', value)) ||
    (await verify<{ sid?: string }>('access', value));
  if (claims?.sid) {
    await revokeSession(claims.sid);
    log('info', 'oauth.revoked', { sid: claims.sid });
  } else {
    log('info', 'oauth.revoke_ignored', { reason: 'unknown_or_invalid_token' });
  }
  return json(200, {});
}

const handle = async (event: HandlerEvent) => {
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
  const path = event.path;
  try {
    if (event.httpMethod === 'OPTIONS') {
      return preflightResponse(
        'GET, POST, OPTIONS',
        'Content-Type, Authorization, MCP-Protocol-Version'
      );
    }
    if (path.includes('/.well-known/')) {
      return metadata(event, path);
    }
    if (path.endsWith('/register') && event.httpMethod === 'POST') {
      return await register(event);
    }
    if (path.endsWith('/authorize') && event.httpMethod === 'GET') {
      return await authorize(event);
    }
    if (path.endsWith('/callback') && event.httpMethod === 'GET') {
      return await callback(event);
    }
    if (path.endsWith('/token') && event.httpMethod === 'POST') {
      return await token(event);
    }
    if (path.endsWith('/revoke') && event.httpMethod === 'POST') {
      return await revoke(event);
    }
    return json(404, { error: 'not_found' });
  } catch (error) {
    log('error', 'oauth.unhandled_error', { path, httpMethod: event.httpMethod, ...errorFields(error) });
    return oauthError('server_error', 'Unexpected error', 500);
  }
};

export const handler: Handler = async (event: HandlerEvent) => {
  try {
    return await handle(event);
  } finally {
    await flushLogs('oauth');
  }
};
