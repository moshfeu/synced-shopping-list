import { connectLambda } from '@netlify/blobs';
import { Handler, HandlerEvent } from '@netlify/functions';
import { authenticate } from './lib/auth';
import { AddToListConflict, NotFoundError, Repository, Urgency, createRepository } from './lib/db';
import { jsonResponse, preflightResponse } from './lib/http';
import { deployContext, errorFields, flushLogs, log, maskEmail } from './lib/log';

/**
 * REST endpoint for bots that add items without reading the list first.
 * POST /api/items with one item, or an array of items (answered with 207 and a result per item).
 * Authenticated with the same access tokens as the MCP server.
 *
 *   201 added (code: new | suggestion)    404 category not found
 *   400 invalid input                     409 already_on_list | already_checked
 */

type AddInput = { name: string; quantity?: number; note?: string; urgency?: Urgency; category?: string };
type Outcome = { status: number; body: Record<string, unknown> };

const URGENCIES = ['1', '2', '3'];

/** Returns the reason the input is unusable, or undefined when it is fine. */
function validate(input: any): string | undefined {
  if (!input || typeof input !== 'object' || typeof input.name !== 'string' || !input.name.trim()) {
    return 'name is required';
  }
  if (input.quantity !== undefined && !(Number.isInteger(input.quantity) && input.quantity >= 1)) {
    return 'quantity must be a positive integer';
  }
  if (input.urgency !== undefined && !URGENCIES.includes(input.urgency)) {
    return 'urgency must be "1", "2" or "3"';
  }
  if (input.note !== undefined && typeof input.note !== 'string') {
    return 'note must be a string';
  }
  if (input.category !== undefined && typeof input.category !== 'string') {
    return 'category must be a string';
  }
  return undefined;
}

/** Maps what happened to one item onto an HTTP status. Unknown errors are rethrown. */
async function addOne(repo: Repository, input: AddInput): Promise<Outcome> {
  const invalid = validate(input);
  if (invalid) {
    return { status: 400, body: { code: 'invalid_input', error: invalid } };
  }
  try {
    const { source, ...item } = await repo.addToList(input);
    return { status: 201, body: { code: source, item } };
  } catch (error) {
    if (error instanceof AddToListConflict) {
      return { status: 409, body: { code: error.code, error: error.message, listItemId: error.listItemId } };
    }
    if (error instanceof NotFoundError) {
      return { status: 404, body: { code: 'not_found', error: error.message } };
    }
    throw error;
  }
}

const handle = async (event: HandlerEvent) => {
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse('POST, OPTIONS', 'Content-Type, Authorization');
  }

  const auth = await authenticate(event, 'items');
  if (!auth.ok) {
    return jsonResponse(auth.status, { error: auth.error }, auth.headers);
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
  }

  let payload: AddInput | AddInput[];
  try {
    payload = JSON.parse(event.body || '');
  } catch {
    return jsonResponse(400, { code: 'invalid_json', error: 'Body must be valid JSON' });
  }

  const repo = createRepository(auth.user);
  const user = maskEmail(auth.user.email);
  try {
    if (!Array.isArray(payload)) {
      const { status, body } = await addOne(repo, payload);
      log('info', 'items.add', { sid: auth.sid, user, status });
      return jsonResponse(status, body);
    }
    if (!payload.length) {
      return jsonResponse(400, { code: 'invalid_input', error: 'items must not be empty' });
    }
    // Sequential on purpose: a duplicate name later in the batch must see the earlier one
    const results: Outcome[] = [];
    for (const input of payload) {
      results.push(await addOne(repo, input));
    }
    log('info', 'items.add_batch', { sid: auth.sid, user, count: results.length, statuses: results.map((r) => r.status) });
    return jsonResponse(207, { results: results.map(({ status, body }) => ({ status, ...body })) });
  } catch (error) {
    log('error', 'items.failed', { sid: auth.sid, user, ...errorFields(error) });
    return jsonResponse(500, { error: 'internal_error' });
  }
};

export const handler: Handler = async (event: HandlerEvent) => {
  try {
    return await handle(event);
  } finally {
    await flushLogs('items', deployContext(event.headers));
  }
};
