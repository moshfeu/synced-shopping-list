import type { HandlerResponse } from '@netlify/functions';

const CORS_ORIGIN = { 'Access-Control-Allow-Origin': '*' };

/** JSON response with CORS; `headers` adds or overrides (e.g. `Cache-Control`). */
export const jsonResponse = (
  statusCode: number,
  body?: unknown,
  headers: Record<string, string> = {}
): HandlerResponse => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS_ORIGIN, ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});

/** Empty response that only carries CORS (e.g. 202 for notifications). */
export const corsResponse = (statusCode: number): HandlerResponse => ({
  statusCode,
  headers: CORS_ORIGIN,
});

export const preflightResponse = (methods: string, allowedHeaders: string): HandlerResponse => ({
  statusCode: 204,
  headers: {
    ...CORS_ORIGIN,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowedHeaders,
  },
});
