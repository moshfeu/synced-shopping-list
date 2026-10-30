import { connectLambda } from '@netlify/blobs';
import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import pkg from '../../package.json';
import { authenticate } from './lib/auth';
import { Repository, User, createRepository } from './lib/db';
import { corsResponse, jsonResponse, preflightResponse } from './lib/http';
import { deployContext, errorFields, flushLogs, log, maskEmail } from './lib/log';
import { imageFromUrl } from './lib/image';

/**
 * Stateless MCP server (Streamable HTTP, JSON responses) exposing the shopping list.
 * Authenticated with the OAuth access tokens issued by ./oauth.ts.
 */

const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
};

type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly?: boolean;
  destructive?: boolean;
  run: (repo: Repository, args: any) => Promise<unknown>;
};

const str = (description: string) => ({ type: 'string', description });
const urgency = {
  type: 'string',
  enum: ['1', '2', '3'],
  description: 'Urgency: 1 = normal, 2 = high, 3 = urgent',
};
const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

const tools: Tool[] = [
  {
    name: 'list_shopping_list',
    description: 'List the items on the shopping list, optionally only checked or unchecked ones.',
    inputSchema: object({
      checked: { type: 'boolean', description: 'true = only checked (bought) items, false = only items still to buy' },
    }),
    readOnly: true,
    run: (repo, { checked }) => repo.getList({ checked }),
  },
  {
    name: 'add_to_shopping_list',
    description: 'Add an item to the shopping list. Reuses a known item with the same name, otherwise creates it.',
    inputSchema: object(
      {
        name: str('Item name'),
        quantity: { type: 'integer', minimum: 1, description: 'Quantity, defaults to 1' },
        note: str('Free text note'),
        urgency,
        category: str('Category name or id (see list_categories)'),
      },
      ['name']
    ),
    run: (repo, args) => repo.addToList(args),
  },
  {
    name: 'update_shopping_list_item',
    description: 'Update a list item: rename, change quantity / note / urgency / category, or check / uncheck it.',
    inputSchema: object(
      {
        id: str('List item id (from list_shopping_list)'),
        name: str('New item name'),
        quantity: { type: 'integer', minimum: 1 },
        note: str('Free text note'),
        urgency,
        checked: { type: 'boolean', description: 'true = bought' },
        category: { type: ['string', 'null'], description: 'Category name or id, null to clear' },
      },
      ['id']
    ),
    run: (repo, { id, ...changes }) => repo.updateListItem(id, changes),
  },
  {
    name: 'set_shopping_list_item_image',
    description:
      'Attach a photo to a list item (replaces the current one). imageUrl is a public https link to a jpeg/png/webp/gif, max 4 MB. For a photo from chat or a file (no URL) use create_shopping_list_item_image_upload instead.',
    inputSchema: object(
      {
        id: str('List item id (from list_shopping_list)'),
        imageUrl: str('Public https URL of the image'),
      },
      ['id', 'imageUrl']
    ),
    run: async (repo, { id, imageUrl }) => repo.setItemImage(id, await imageFromUrl(imageUrl)),
  },
  {
    name: 'create_shopping_list_item_image_upload',
    description:
      'Step 1 of 3 for attaching a photo the user sent in chat or has as a file (you cannot copy file bytes into a tool call). Returns a signed uploadUrl (valid 10 minutes, max 10 MB), the headers to send and a path. Step 2: HTTP PUT the raw file bytes to uploadUrl with exactly those headers, using whatever tool you have that can send a chat attachment or a local file (a shell: curl --upload-file). Step 3: call finalize_shopping_list_item_image with the path. If you have no way to PUT the bytes, tell the user.',
    inputSchema: object(
      {
        id: str('List item id (from list_shopping_list)'),
        contentType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] },
      },
      ['id', 'contentType']
    ),
    run: (repo, { id, contentType }) => repo.createImageUpload(id, contentType),
  },
  {
    name: 'finalize_shopping_list_item_image',
    description: 'Step 3 of create_shopping_list_item_image_upload: after the file was PUT to uploadUrl, attaches it (path from step 1) to the list item.',
    inputSchema: object({ id: str('List item id'), path: str('path returned by create_shopping_list_item_image_upload') }, ['id', 'path']),
    run: (repo, { id, path }) => repo.finalizeItemImage(id, path),
  },
  {
    name: 'remove_shopping_list_item_image',
    description: "Remove a list item's photo.",
    inputSchema: object({ id: str('List item id') }, ['id']),
    destructive: true,
    run: (repo, { id }) => repo.removeItemImage(id),
  },
  {
    name: 'remove_from_shopping_list',
    description: 'Remove items from the shopping list. The items stay known as suggestions.',
    inputSchema: object(
      { ids: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'List item ids' } },
      ['ids']
    ),
    destructive: true,
    run: (repo, { ids }) => repo.removeFromList(ids),
  },
  {
    name: 'clear_checked_items',
    description: 'Remove all checked (bought) items from the shopping list.',
    inputSchema: object({}),
    destructive: true,
    run: (repo) => repo.clearChecked(),
  },
  {
    name: 'list_categories',
    description: 'List the categories.',
    inputSchema: object({}),
    readOnly: true,
    run: (repo) => repo.getCategories(),
  },
  {
    name: 'create_category',
    description: 'Create a category.',
    inputSchema: object({ name: str('Category name'), color: str('Optional CSS color') }, ['name']),
    run: (repo, { name, color }) => repo.addCategory(name, color),
  },
  {
    name: 'update_category',
    description: 'Rename a category or change its color.',
    inputSchema: object({ id: str('Category id'), name: str('New name'), color: str('New CSS color') }, ['id']),
    run: (repo, { id, ...changes }) => repo.updateCategory(id, changes),
  },
  {
    name: 'delete_category',
    description: 'Delete a category. Items that used it become uncategorized.',
    inputSchema: object({ id: str('Category id') }, ['id']),
    destructive: true,
    run: (repo, { id }) => repo.deleteCategory(id),
  },
  {
    name: 'list_suggestions',
    description: 'List known items that are not currently on the shopping list.',
    inputSchema: object({}),
    readOnly: true,
    run: (repo) => repo.getCatalog(),
  },
  {
    name: 'delete_suggestion',
    description: 'Forget a known item that is not on the shopping list.',
    inputSchema: object({ id: str('Item id (from list_suggestions)') }, ['id']),
    destructive: true,
    run: (repo, { id }) => repo.deleteCatalogItem(id),
  },
];

const rpc = (id: JsonRpcRequest['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id: JsonRpcRequest['id'] | null, code: number, message: string) => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: { code, message },
});

async function handleRequest(req: JsonRpcRequest, user: User, sid?: string) {
  switch (req.method) {
    case 'initialize': {
      const requested = req.params?.protocolVersion;
      log('info', 'mcp.initialize', {
        sid,
        client: req.params?.clientInfo?.name,
        clientVersion: req.params?.clientInfo?.version,
        requestedProtocol: requested,
      });
      return rpc(req.id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'synced-shopping-list', version: pkg.version },
        instructions:
          'Read and edit the shared shopping list. Call list_shopping_list to get item ids. To add a photo from a chat attachment or file: add or find the item, call create_shopping_list_item_image_upload, PUT the file bytes to the returned uploadUrl with the returned headers, then call finalize_shopping_list_item_image. The signed URL expires after 10 minutes.',
      });
    }
    case 'ping':
      return rpc(req.id, {});
    case 'tools/list':
      return rpc(req.id, {
        tools: tools.map(({ name, description, inputSchema, readOnly, destructive }) => ({
          name,
          description,
          inputSchema,
          annotations: { readOnlyHint: !!readOnly, destructiveHint: !!destructive },
        })),
      });
    case 'tools/call': {
      const tool = tools.find((t) => t.name === req.params?.name);
      if (!tool) {
        log('warn', 'mcp.tool_unknown', { sid, tool: req.params?.name });
        return rpcError(req.id, -32602, `Unknown tool: ${req.params?.name}`);
      }
      const startedAt = Date.now();
      // Argument names only: values can hold notes, names or image data
      const argumentNames = Object.keys(req.params.arguments || {});
      try {
        const result = await tool.run(createRepository(user), req.params.arguments || {});
        log('info', 'mcp.tool', {
          sid,
          tool: tool.name,
          user: maskEmail(user.email),
          argumentNames,
          ms: Date.now() - startedAt,
          ok: true,
        });
        return rpc(req.id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (error) {
        // Tool failures are reported to the model, not as protocol errors
        log('warn', 'mcp.tool', {
          sid,
          tool: tool.name,
          user: maskEmail(user.email),
          argumentNames,
          ms: Date.now() - startedAt,
          ok: false,
          ...errorFields(error),
        });
        return rpc(req.id, {
          isError: true,
          content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
        });
      }
    }
    default:
      log('warn', 'mcp.method_unknown', { sid, method: req.method });
      return rpcError(req.id, -32601, `Method not found: ${req.method}`);
  }
}

const respond = jsonResponse;

const handle = async (event: HandlerEvent) => {
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);
  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse(
      'POST, OPTIONS',
      'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id'
    );
  }

  const auth = await authenticate(event, 'mcp');
  if (!auth.ok) {
    return respond(
      auth.status,
      auth.status === 503 ? rpcError(null, -32000, auth.error) : { error: auth.error },
      auth.headers
    );
  }
  const { user, sid } = auth;

  if (event.httpMethod !== 'POST') {
    // No server-initiated stream and no sessions
    log('warn', 'mcp.method_not_allowed', { httpMethod: event.httpMethod });
    return respond(405, rpcError(null, -32000, 'Method not allowed'), { Allow: 'POST' });
  }

  let payload: JsonRpcRequest | JsonRpcRequest[];
  try {
    payload = JSON.parse(event.body || '');
  } catch {
    log('warn', 'mcp.parse_error', { sid, bytes: event.body?.length ?? 0 });
    return respond(400, rpcError(null, -32700, 'Parse error'));
  }

  const messages = Array.isArray(payload) ? payload : [payload];
  // Notifications and responses carry no id and need no answer
  const responses = (
    await Promise.all(
      messages.map((m) => (m.id === undefined ? undefined : handleRequest(m, user, sid)))
    )
  ).filter(Boolean);

  if (!responses.length) {
    return corsResponse(202);
  }
  return respond(200, Array.isArray(payload) ? responses : responses[0]);
};

export const handler: Handler = async (event: HandlerEvent) => {
  try {
    return await handle(event);
  } finally {
    await flushLogs('mcp', deployContext(event.headers));
  }
};
