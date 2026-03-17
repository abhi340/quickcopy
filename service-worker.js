const CACHE_NAME = 'quickcopy-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/settings.html',
  '/about.html',
  '/privacy.html',
  '/changelog.html',
  '/style.css',
  '/src/app.js',
  '/src/firebase.js',
  '/src/icons.js',
  '/src/theme.js',
  '/src/utils.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate & Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetching assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
