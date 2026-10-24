# Synced Shopping List

A shopping list <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps" target="_blank">PWA</a> synced between clients.

## Stack

- React (Vite)
- Typescript
- Material-UI
- Firebase
- Netlify (hosting + functions)

## Additional Capabilities

1. Support fully offline. By nature firebase realtime [doesn't support](https://github.com/firebase/firebase-js-sdk/issues/3905#issuecomment-705194518) offline mode. This app does.
2. When there is a new version, the app refreshes automatically (instead of `console.log` supplied by CRA template)

## Installation

### App

```sh
yarn
```

### Database (Firebase realtime database)

1. Follow the instruction - <a href="https://firebase.google.com/docs/database/web/start" target="_blank">https://firebase.google.com/docs/database/web/start</a>.
2. Rename `env.sample` to `.env.local` and update its content with the details received from firebase.
3. Set up authentication - <a href="https://firebase.google.com/docs/database/security/get-started#set_up" target="_blank">https://firebase.google.com/docs/database/security/get-started#set_up</a>. The UI doesn't have login so it only supports external providers (e.g. Google)
4. Limit the users who can access the db to avoid exceeding the free plan. You can do it by setting the <a href="https://firebase.google.com/docs/database/security/get-started#access_your_rules" target="_blank">rules</a> write / read to certain users, like this:

```json
{
  "rules": {
    ".read": "auth.token.email == 'my@email.com' ||
							auth.token.email == 'my.friend@gmail.com'",
    ".write": "auth.token.email == 'my@email.com' ||
							auth.token.email == 'my.friend@gmail.com'",
  }
}
```

### Storage (for item's image)

- Enable cors - follow https://firebase.google.com/docs/storage/web/download-files#cors_configuration

### Messaging (Push Notifications)

In order to let the server (the code will published soon) to send a push notification, the app should register itself to FCM ("Firebase Cloud Messaging"), get a token and submit it to server. In order to do this:

1. [Register the app](https://firebase.google.com/docs/cloud-messaging/js/client#configure_web_credentials_with_fcm) and get the Notification Token.
2. Add it as `REACT_APP_NOTIFICATION_TOKEN` to `env.local` / server env variable.

### Deploy

<a href="https://app.netlify.com/start/deploy?repository=https://github.com/moshfeu/synced-shopping-list" target="_blank"><img src="https://www.netlify.com/img/deploy/button.svg" alt="deploy with netlify"></a>

In the process you'll set the build variables the same as in the `.env` file.

Notes:

1. If you configure netlify manually (not via the "Deploy" button), don't forget to <a href="https://docs.netlify.com/configure-builds/environment-variables/#declare-variables" target="_blank">configure</a> the build variables.
2. `yarn push` triggers also `npm version` which bumps the app's version which reflected in the UI (main nav at the bottom)

## Run

```sh
yarn dev
```

or

```sh
yarn start
```

### Run local functions under port 9999

```sh
netlify functions:serve
```

The *proxy* function aims to solve the CORS issue when trying to save an image from Google search result (Item Details > Image > Replace (Google)).

## MCP server (AI agents)

The list can be read and edited by AI agents (Claude, ChatGPT, Cursor, ...) through an [MCP](https://modelcontextprotocol.io) server hosted as a Netlify function at `https://<your-site>/api/mcp`.

Agents sign in with Google, same as the app, and the database rules apply to them as well: only emails allowed by your Firebase rules can access the list.

Tools: `list_shopping_list`, `add_to_shopping_list`, `update_shopping_list_item` (including check / uncheck), `set_item_image`, `remove_item_image`, `remove_from_shopping_list`, `clear_checked_items`, `list_categories`, `create_category`, `update_category`, `delete_category`, `list_suggestions`, `delete_suggestion`.

### Setup

1. In the Google Cloud console (the project behind your Firebase project) create an OAuth client of type *Web application* and add `https://<your-site>/oauth/callback` as an authorized redirect URI.
2. Create a Firebase service account key (Project settings > Service accounts).
3. Set these Netlify environment variables (see `.env.sample`): `MCP_JWT_SECRET`, `MCP_GOOGLE_CLIENT_ID`, `MCP_GOOGLE_CLIENT_SECRET`, `FIREBASE_SERVICE_ACCOUNT`. `VITE_DATABASE_URL` is reused for the database.
4. Add `https://<your-site>/api/mcp` as a custom connector / remote MCP server in your AI client. The client discovers the OAuth endpoints automatically.

Gotchas:
- Netlify caps all environment variables visible to functions at 4 KB combined. Store `FIREBASE_SERVICE_ACCOUNT` as one line with only `project_id`, `client_email` and `private_key`, and remove unused variables (e.g. old `REACT_APP_*`).
- Variables can have a different value per deploy context. Deploy previews may point at a separate (dev) Firebase project, so give that context a service account key from the same project as its `VITE_DATABASE_URL`.
- The service account needs access to that project's Realtime Database (the default `firebase-adminsdk-…` account has it; a custom one needs a suitable role).
- `set_item_image` writes to Firebase Storage with the service account, so that account needs Storage access (the default `firebase-adminsdk-…` account has it). Images are stored as `items/<itemId>#…` like the app does, up to 4 MB, from a public https URL or base64.
- Realtime Database rule timestamps (`now < …`) are in milliseconds.

Notes: tokens are signed JWTs (access 1h, refresh 30d), each tied to a session id. POST a token to `/oauth/revoke` (RFC 7009) to revoke its whole session: the revoked session ids are kept in Netlify Blobs, checked on every MCP call and on refresh (a revocation can take up to about a minute to apply). Rotating `MCP_JWT_SECRET` signs everybody out. The service account is only used to impersonate the signed-in user's email so the rules are enforced.

### Credits

- Illustrations by [undraw](https://undraw.co/) ❤️