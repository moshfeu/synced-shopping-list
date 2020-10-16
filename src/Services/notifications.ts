const to = process.env.REACT_APP_TEST_TO;

export const sendNotification = () => {
  const notification = {
    title: 'Portugal vs. Denmark',
    body: '5 to 1',
    // icon: 'firebase-logo.png',
    // click_action: 'http://localhost:8081',
  };

  fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: 'key=' + process.env.REACT_APP_SERVER_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      notification: notification,
      to,
    }),
  })
    .then(async function (response) {
      const result = await response.json();
      console.log(result);
    })
    .catch(function (error) {
      console.error(error);
    });
};
