const to = 'cmH9MF_ikoUGm_0dK4U2h_:APA91bH-XIqAMGA2OEBdHZp_976BqA1f-v22FhSQ0-2hl5jM16hjhSBgTrW9zArReXoMObrYyV2vugnCbBKAl9DlT1Ehhm2vAgrbhyIpGJVfq-G35FCM0Rm6r7brwdwpXx_FwS_e4IxL';
// const to = 'fnaMc6ostbDa5VGOKJAchk:APA91bEJsKF7RuZ3T0MdVQs5I81ZkGUPP8YC1zGaiSh972OBev2lklFb13OLj4tXexksYnNQMwqlNJiNrkq0EsaW04Ik3rRzP4A1i7m72WYN66dr8N_IiUC3WmXv6JTAAsdq1LdpzJpQ';

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
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.error(error);
    });
};
