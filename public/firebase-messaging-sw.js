// need this file just to be served for firebase messaging

importScripts('https://www.gstatic.com/firebasejs/7.23.0/firebase-app.js');
importScripts(
  'https://www.gstatic.com/firebasejs/7.23.0/firebase-messaging.js'
);

self.addEventListener('message', (message) => {
  if (message.data.type === 'appSettings') {
    try {
      firebase.app();
    } catch (error) {
      firebase.initializeApp(message.data.appSettings);
    }

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(console.log);
  }
});
