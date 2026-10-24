import { createHash, timingSafeEqual } from 'node:crypto';
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config, getBaseUrl } from './lib/config';
import { createRepository } from './lib/db';
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
type CodeToken = AuthzState & { email: string; name?: string };
type RefreshToken = { sub: string; name?: string; client_id: string };

const json = (statusCode: number, body: unknown, headers = {}): HandlerResponse => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    ...headers,
  },
  body: JSON.stringify(body),
});

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
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
}

async function register(event: HandlerEvent) {
  const { redirect_uris, client_name } = parseBodyJson(event);
  if (
    !Array.isArray(redirect_uris) ||
    !redirect_uris.length ||
    !redirect_uris.every(isValidRedirectUri)
  ) {
    return oauthError('invalid_redirect_uri', 'redirect_uris are missing or invalid');
  }
  const name = typeof client_name === 'string' ? client_name.slice(0, 100) : undefined;
  const clientId = await sign('client', { redirect_uris, client_name: name });
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
    return page(400, 'Unknown client or redirect URI.');
  }
  const fail = (error: string, description: string) =>
    redirect(withParams(q.redirect_uri!, { error, error_description: description, state: q.state }));

  if (q.response_type !== 'code') {
    return fail('unsupported_response_type', 'Only response_type=code is supported');
  }
  if (!q.code_challenge || q.code_challenge_method !== 'S256') {
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
    return page(400, 'Sign-in expired or invalid. Please start again from your AI agent.');
  }
  const fail = (error: string, description: string) =>
    redirect(withParams(authz.redirect_uri, { error, error_description: description, state: authz.state }));

  if (q.error || !q.code) {
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
      return fail('access_denied', 'Google account email is not verified');
    }
    email = String(payload.email).toLowerCase();
    name = payload.name as string | undefined;
  } catch {
    return fail('server_error', 'Could not verify the Google identity');
  }

  // Same authorization as the web app: the database rules decide who gets in
  try {
    await createRepository({ email, name }).getCategories();
  } catch {
    return fail('access_denied', `${email} is not allowed to access this shopping list`);
  }

  const code = await sign(
    'code',
    { ...authz, email, name } satisfies CodeToken,
    '2m'
  );
  return redirect(withParams(authz.redirect_uri, { code, state: authz.state }));
}

async function issueTokens(event: HandlerEvent, email: string, name: string | undefined, clientId: string) {
  const base = getBaseUrl(event);
  const [accessToken, refreshToken] = await Promise.all([
    sign('access', { sub: email, name, aud: `${base}/api/mcp` }, `${ACCESS_TOKEN_TTL_SECONDS}s`),
    sign('refresh', { sub: email, name, client_id: clientId }, '30d'),
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
    if (
      !code ||
      code.client_id !== body.client_id ||
      code.redirect_uri !== body.redirect_uri ||
      !body.code_verifier ||
      !pkceMatches(body.code_verifier, code.code_challenge)
    ) {
      return oauthError('invalid_grant', 'Invalid authorization code or PKCE verifier');
    }
    return issueTokens(event, code.email, code.name, code.client_id);
  }

  if (body.grant_type === 'refresh_token') {
    const refresh = await verify<RefreshToken>('refresh', body.refresh_token);
    if (!refresh || (body.client_id && refresh.client_id !== body.client_id)) {
      return oauthError('invalid_grant', 'Invalid refresh token');
    }
    return issueTokens(event, refresh.sub, refresh.name, refresh.client_id);
  }

  return oauthError('unsupported_grant_type', 'Unsupported grant_type');
}

export const handler: Handler = async (event) => {
  const path = event.path;
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
        },
      };
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
    return json(404, { error: 'not_found' });
  } catch (error) {
    console.error('oauth error', error);
    return oauthError('server_error', 'Unexpected error', 500);
  }
};
