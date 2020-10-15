import firebase from 'firebase';
import { Lsbase } from './lsbase';

const appSettings = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

export const app = firebase.initializeApp(appSettings);
export const db = new Lsbase(app.database());
const messaging = firebase.messaging();

messaging
  .getToken({
    vapidKey: process.env.REACT_APP_NOTIFICATION_TOKEN!,
  })
  .then(async (currentToken) => {
    if (currentToken) {
      const tokens = Object.values(
        (await db.db.ref('/tokens').once('value')).val()
      );
      if (!tokens.includes(currentToken)) {
        await db.db.ref('/tokens').push(currentToken);
        console.log(`token ${currentToken} was added`);
      } else {
        console.log(`token: ${currentToken} is already exists`);
      }
    }
  })
  .catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
  });
