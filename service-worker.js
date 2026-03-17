const CACHE_NAME = 'quickcopy-pro-v7';
const ASSETS = [
  '/',
  'index.html',
  'settings.html',
  'about.html',
  'features.html',
  'privacy.html',
  'changelog.html',
  'style.css',
  'src/app.js',
  'src/firebase.js',
  'src/icons.js',
  'src/theme.js',
  'src/utils.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use try/catch or individually add to prevent one failure from breaking all
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.warn(`Cache failed for ${url}: ${err}`));
        })
      );
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

// Fetching: Network-First for HTML, Cache-First for other assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For HTML files, try network first, then fall back to cache
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
        .then(response => response || caches.match('/index.html'))
    );
  } else {
    // For other assets, try cache first
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).catch(() => {
           // If fetch fails and no cache, return empty/placeholder for non-critical assets
           return new Response('Not found', { status: 404 });
        });
      })
    );
  }
});
