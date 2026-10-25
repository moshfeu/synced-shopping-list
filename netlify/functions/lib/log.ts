type Level = 'info' | 'warn' | 'error';

type Entry = { level: Level; line: string; ts: number };

let pending: Entry[] = [];

/**
 * One JSON line per event on stdout/stderr, so Netlify's function logs can filter on
 * `event`, `level` and any field. When GRAFANA_LOKI_* is set, the same lines are also
 * pushed to Grafana Loki by `flushLogs()` (call it before the handler returns).
 * Never pass tokens, codes, secrets, signed URLs, request bodies or image data.
 */
export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const ts = Date.now();
  const line = JSON.stringify({ level, event, ts: new Date(ts).toISOString(), ...fields });
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
  if (lokiConfig()) {
    pending.push({ level, line, ts });
  }
}

function lokiConfig() {
  const { GRAFANA_LOKI_URL: url, GRAFANA_LOKI_USER: user, GRAFANA_LOKI_TOKEN: token } = process.env;
  if (!url || !user || !token) {
    return undefined;
  }
  return {
    url: url.endsWith('/push') ? url : `${url.replace(/\/$/, '')}/loki/api/v1/push`,
    auth: Buffer.from(`${user}:${token}`).toString('base64'),
  };
}

/**
 * Pushes the lines logged during this invocation to Grafana Loki. The function is frozen
 * once the handler returns, so await this in a `finally`. It never throws and gives up
 * after 2 s: logging must not break or slow down a request.
 */
export async function flushLogs(service: string) {
  const config = lokiConfig();
  const entries = pending;
  pending = [];
  if (!config || !entries.length) {
    return;
  }
  // Labels stay low-cardinality; everything else is in the JSON line (`| json`)
  const labels = { app: 'synced-shopping-list', service, env: process.env.CONTEXT || 'unknown' };
  const streams = (['info', 'warn', 'error'] as const)
    .map((level) => ({
      stream: { ...labels, level },
      values: entries
        .filter((entry) => entry.level === level)
        .map(({ ts, line }) => [`${ts}000000`, line]),
    }))
    .filter(({ values }) => values.length);
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${config.auth}` },
      body: JSON.stringify({ streams }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      console.error(`Grafana Loki push failed with HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`Grafana Loki push failed: ${error instanceof Error ? error.message : error}`);
  }
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
