import firebase from 'firebase';
import { db } from './firebase';

const messaging = firebase.messaging();

export function register(user: firebase.User) {
  messaging
    .getToken({
      vapidKey: import.meta.env.VITE_NOTIFICATION_TOKEN!,
    })
    .then(async (currentToken) => {
      if (currentToken) {
        const isCurrentTokenExists = (
          await db.db
            .ref(`tokens`)
            .orderByChild('token')
            .equalTo(currentToken)
            .once('value')
        ).val();
        if (!isCurrentTokenExists) {
          await db.db.ref('tokens').push({
            url: window.location.href,
            user: user.email,
            token: currentToken,
          });
        }
      }
    })
    .catch((err) => {
      console.error('An error occurred while retrieving token. ', err);
    });
  messaging.onMessage(() => {
    // Message received
  });
}
