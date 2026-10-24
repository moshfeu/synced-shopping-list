import type { HandlerEvent } from '@netlify/functions';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const config = {
  get jwtSecret() {
    return new TextEncoder().encode(required('MCP_JWT_SECRET'));
  },
  get googleClientId() {
    return required('MCP_GOOGLE_CLIENT_ID');
  },
  get googleClientSecret() {
    return required('MCP_GOOGLE_CLIENT_SECRET');
  },
  get databaseURL() {
    return process.env.FIREBASE_DATABASE_URL || required('VITE_DATABASE_URL');
  },
  get serviceAccount() {
    return JSON.parse(required('FIREBASE_SERVICE_ACCOUNT'));
  },
};

export function getBaseUrl(event: HandlerEvent) {
  if (process.env.MCP_BASE_URL) {
    return process.env.MCP_BASE_URL.replace(/\/$/, '');
  }
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}
