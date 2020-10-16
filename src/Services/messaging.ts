import firebase from 'firebase';
import { appSettings, db } from './firebase';

const messaging = firebase.messaging();

export function register(user: firebase.User) {
  navigator.serviceWorker
    .register('firebase-messaging-sw.js')
    .then((registration) => {
      registration.active?.postMessage({
        type: 'appSettings',
        appSettings,
      });
    })
    .catch((err) => {
      console.log(err);
    });
  messaging
    .getToken({
      vapidKey: process.env.REACT_APP_NOTIFICATION_TOKEN!,
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
          console.log(`token ${currentToken} was added`);
        } else {
          console.log(`token: ${currentToken} is already exists`);
        }
      }
    })
    .catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
    });
  messaging.onMessage((a) => {
    console.log(111111);
    console.log(a);
  });
}
