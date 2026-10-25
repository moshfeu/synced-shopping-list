type Level = 'info' | 'warn' | 'error';

/**
 * One JSON line per event on stdout/stderr, so Netlify's function logs (or a log drain
 * to Grafana/Loki) can filter on `event`, `level` and any field.
 * Never pass tokens, codes, secrets, signed URLs, request bodies or image data.
 */
export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...fields });
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

/** Error details safe to log; the stack only travels with real errors. */
export function errorFields(error: unknown) {
  if (error instanceof Error) {
    const { code } = error as Error & { code?: unknown };
    return { error: error.message, errorCode: code, stack: error.stack?.split('\n').slice(0, 6).join('\n') };
  }
  return { error: String(error) };
}

/** `j***@gmail.com`: enough to tell users apart in logs without storing the address. */
export function maskEmail(email: string) {
  const [local = '', domain = ''] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
}
