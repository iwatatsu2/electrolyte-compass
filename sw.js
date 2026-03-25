const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `electrolyte-compass-${CACHE_VERSION}`;

// Service Worker インストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/electrolyte-compass/', '/electrolyte-compass/index.html', '/electrolyte-compass/manifest.json']);
    })
  );
  self.skipWaiting();
});

// Service Worker アクティベーション：古いキャッシュを全削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('electrolyte-compass-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ネットワークファースト：常に最新を取得し、オフライン時のみキャッシュを使用
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
