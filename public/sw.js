self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open('aether-v1').then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      });
    })
  );
});
