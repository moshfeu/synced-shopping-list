self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches
      .match(event.request.url)
      .then(function (response) {
        return response || fetch(event.request);
      })
      .catch((e) => console.log('=============', e))
  );
});
