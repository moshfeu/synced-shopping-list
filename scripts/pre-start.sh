set -a
[ -f .env.local ] && . .env.local
set +a
echo "importScripts('https://www.gstatic.com/firebasejs/7.23.0/firebase-app.js');
firebase.initializeApp({
  projectId: '${REACT_APP_PROJECT_ID}',
  appId: '${REACT_APP_APP_ID}',
  databaseURL: '${REACT_APP_DATABASE_URL}',
  storageBucket: '${REACT_APP_STORAGE_BUCKET}',
  apiKey: '${REACT_APP_API_KEY}',
  authDomain: '${REACT_APP_AUTH_DOMAIN}',
  messagingSenderId: '${REACT_APP_MESSAGING_SENDER_ID}',
});" > public/firebase-config.js
echo "\033[0;32m\"public/firebase-config.js\" file generated 👍"