# MCP server (AI agents)

The list can be read and edited by AI agents (Claude, ChatGPT, Cursor, ...) through an [MCP](https://modelcontextprotocol.io) server hosted as a Netlify function at `https://<your-site>/api/mcp`.

Agents sign in with Google, same as the app, and the database rules apply to them as well: only emails allowed by your Firebase rules can access the list.

Tools: `list_shopping_list`, `add_to_shopping_list`, `update_shopping_list_item` (including check / uncheck), `set_item_image`, `create_item_image_upload` + `finalize_item_image`, `remove_item_image`, `remove_from_shopping_list`, `clear_checked_items`, `list_categories`, `create_category`, `update_category`, `delete_category`, `list_suggestions`, `delete_suggestion`.

## How it works

What each piece holds:

| Piece | Holds | Used for |
| --- | --- | --- |
| Google Cloud OAuth client | client id + client secret (`MCP_GOOGLE_CLIENT_ID`, `MCP_GOOGLE_CLIENT_SECRET`) | Signing the user in with Google and getting a verified email |
| `MCP_JWT_SECRET` | HMAC key | Signing the MCP's own tokens (client id, state, code, access, refresh) |
| Firebase service account | `project_id`, `client_email`, `private_key` (`FIREBASE_SERVICE_ACCOUNT`) | Admin SDK access to the Realtime Database and Storage |
| Realtime Database | `list`, `items`, `categories`, rules on `auth.token.email` | Source of truth; rules decide who may read and write |
| Storage bucket | `items/<itemId>#…` image files | Item photos |
| Netlify Blobs | revoked session ids | Revoking tokens |

### Install (connecting an agent)

The agent only needs the MCP URL. Everything else is discovered.

```mermaid
sequenceDiagram
    autonumber
    participant A as AI client
    participant U as User's browser
    participant N as Netlify functions<br/>(/api/mcp, /oauth/*)
    participant G as Google OAuth
    participant R as Realtime Database

    A->>N: POST /api/mcp (no token)
    N-->>A: 401 + WWW-Authenticate (resource_metadata URL)
    A->>N: GET /.well-known/oauth-protected-resource
    A->>N: GET /.well-known/oauth-authorization-server
    A->>N: POST /oauth/register (dynamic client registration)
    N-->>A: client_id (JWT signed with MCP_JWT_SECRET)
    A->>U: open /oauth/authorize (PKCE S256)
    U->>N: GET /oauth/authorize
    N-->>U: redirect to Google (OAuth client id, signed state)
    U->>G: sign in and consent
    G-->>U: redirect to /oauth/callback?code=…
    U->>N: GET /oauth/callback
    N->>G: exchange code (OAuth client id + secret)
    G-->>N: id_token (email, email_verified)
    N->>R: read categories as that email (service account, rules apply)
    R-->>N: allowed, or permission denied
    Note over N,R: Denied by the rules: redirect with error=access_denied
    N-->>U: redirect to the client with a 2-minute code (new session id)
    U->>A: code delivered to the client's redirect URI
    A->>N: POST /oauth/token (code + PKCE verifier)
    N-->>A: access token (1 h) + refresh token (30 d)
```

### User request (a tool call)

```mermaid
sequenceDiagram
    autonumber
    participant A as AI client
    participant N as /api/mcp
    participant B as Netlify Blobs
    participant R as Realtime Database
    participant S as Storage bucket

    A->>N: POST /api/mcp tools/call (Bearer access token)
    N->>N: verify JWT (signature, expiry, audience)
    N->>B: is the session id revoked?
    B-->>N: no (a store error fails closed with 503)
    N->>R: Admin SDK as the user's email<br/>(databaseAuthVariableOverride, service account)
    Note over N,R: The same rules as the web app apply:<br/>auth.token.email must be allowed
    R-->>N: data or permission denied
    N-->>A: tool result
    Note over A,N: When the access token expires, POST /oauth/token (refresh_token)<br/>returns a new pair and checks the session is not revoked
```

### Photo upload (full size, bytes never go through the agent)

```mermaid
sequenceDiagram
    autonumber
    participant A as AI client
    participant N as /api/mcp
    participant S as Storage bucket
    participant R as Realtime Database

    A->>N: create_item_image_upload (id, contentType)
    N->>N: sign a V4 PUT URL with the service account<br/>(10 min, content type + 10 MB limit)
    N-->>A: uploadUrl, headers, path
    A->>S: PUT raw bytes to uploadUrl
    S-->>A: 200
    A->>N: finalize_item_image (id, path)
    N->>S: check the file exists and has an image type
    N->>R: set items/<itemId>/image = path
    N->>S: delete the previous image
    N-->>A: image, bytes, contentType
```

`set_item_image` is the small-image shortcut: the function receives the image (public https URL or base64, up to 4 MB), writes it to Storage with the service account, and updates `items/<itemId>/image`.

## Setup

1. In the Google Cloud console (the project behind your Firebase project) create an OAuth client of type *Web application* and add `https://<your-site>/oauth/callback` as an authorized redirect URI.
2. Create a Firebase service account key (Project settings > Service accounts).
3. Set these Netlify environment variables (see `.env.sample`): `MCP_JWT_SECRET`, `MCP_GOOGLE_CLIENT_ID`, `MCP_GOOGLE_CLIENT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`. `VITE_DATABASE_URL` is reused for the database.
4. Add `https://<your-site>/api/mcp` as a custom connector / remote MCP server in your AI client. The client discovers the OAuth endpoints automatically.

Gotchas:
- Netlify caps all environment variables visible to functions at 4 KB combined. Store `FIREBASE_SERVICE_ACCOUNT` as one line with only `project_id`, `client_email` and `private_key`, and remove unused variables (e.g. old `REACT_APP_*`).
- Variables can have a different value per deploy context. Deploy previews may point at a separate (dev) Firebase project, so give that context a service account key from the same project as its `VITE_DATABASE_URL`.
- The service account needs access to that project's Realtime Database (the default `firebase-adminsdk-…` account has it; a custom one needs a suitable role).
- `set_item_image` writes to Firebase Storage with the service account, so that account needs Storage access (the default `firebase-adminsdk-…` account has it). Images are stored as `items/<itemId>#…` like the app does, up to 4 MB, from a public https URL or base64.
- Full-size photos: call `create_item_image_upload` (returns a 10-minute signed URL), `PUT` the raw bytes to it with the returned headers (e.g. `curl --upload-file photo.jpg -H 'Content-Type: image/jpeg' -H 'x-goog-content-length-range: 0,10485760' "<uploadUrl>"`), then call `finalize_item_image`. The bytes never pass through the agent's context, up to 10 MB. Set `FIREBASE_STORAGE_BUCKET` if the bucket differs from `VITE_STORAGE_BUCKET`.
- Realtime Database rule timestamps (`now < …`) are in milliseconds.

## Tokens and revocation

Tokens are signed JWTs (access 1h, refresh 30d), each tied to a session id. POST a token to `/oauth/revoke` (RFC 7009) to revoke its whole session: the revoked session ids are kept in Netlify Blobs, checked on every MCP call and on refresh (a revocation can take up to about a minute to apply). Rotating `MCP_JWT_SECRET` signs everybody out. The service account is only used to impersonate the signed-in user's email so the rules are enforced.
