self.addEventListener('fetch', function (event) {
  if (event.request.url.includes('firebasestorage')) {
    console.log('fetching ->', event.request);
  }
  event.respondWith(
    caches
      .match(event.request.url)
      .then(function (response) {
        if (response) {
          console.log(event.request.url, 'found!');
        } else {
          if (event.request.url.includes('firebasestorage')) {
            console.log(event.request.url, 'not found');
          }
        }
        return response || fetch(event.request);
      })
      .catch((e) => console.log('=============', e))
  );
});
