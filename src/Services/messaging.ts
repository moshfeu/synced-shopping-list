import firebase from 'firebase';
import { db } from './firebase';

const messaging = firebase.messaging();

export async function register(user: firebase.User) {
  let currentToken: string = '';

  const prevToken = localStorage.getItem('messagingToken');
  await messaging.deleteToken();
  try {
    currentToken = await messaging.getToken({
      vapidKey: process.env.REACT_APP_NOTIFICATION_TOKEN!,
    });
    localStorage.setItem('messagingToken', currentToken);
  } catch (error) {
    console.log(`can't get messaging token`, error);
  }

  if (currentToken) {
    await db.db
      .ref('tokens')
      .orderByChild('token')
      .equalTo(prevToken)
      .ref.remove();

    await db.db.ref('tokens').push({
      url: window.location.href,
      user: user.email,
      token: currentToken,
    });
    console.log(`token ${currentToken} was added`);
  }

  messaging.onMessage(({ notification }) => {
    const { title, body, icon, badge } = notification;
    new Notification(`${title}!!`, {
      body,
      icon,
      badge,
    }).addEventListener('click', () => {
      window.focus();
    });
  });
}

// function warmServer() {
//   return fetch();
// }
