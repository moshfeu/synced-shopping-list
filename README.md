# Synced Shopping List

A shopping list <a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps" target="_blank">PWA</a> synced between clients.

## Stack

- React (CRA)
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
yarn start
```

### Run local functions under port 9999

```sh
netlify functions:serve
```

The *proxy* function aims to solve the CORS issue when trying to save an image from Google search result (Item Details > Image > Replace (Google)).

### Credits

- Illustrations by [undraw](https://undraw.co/) ❤️