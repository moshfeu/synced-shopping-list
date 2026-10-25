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
    return required('VITE_DATABASE_URL');
  },
  get storageBucket() {
    return required('VITE_STORAGE_BUCKET');
  },
  get serviceAccount() {
    try {
      return JSON.parse(required('FIREBASE_SERVICE_ACCOUNT'));
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be the full JSON key file contents');
    }
  },
};

export function getBaseUrl(event: HandlerEvent) {
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}
