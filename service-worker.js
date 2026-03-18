const CACHE_NAME = 'quickcopy-pro-v17';
const ASSETS = [
  '/',
  'index.html',
  'settings.html',
  'about.html',
  'features.html',
  'privacy.html',
  'changelog.html',
  '404.html',
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

// Fetching: Network-First for HTML/CSS/JS (Critical Core), Cache-First for other assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For critical app files, try network first
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
        .then(response => {
          // If we have a response, return it
          if (response && response.status !== 404) return response;
          
          // If it's a 404 or missing, and it's a navigation request, show 404.html
          if (event.request.mode === 'navigate') {
            return caches.match('404.html');
          }
          
          return response || caches.match(event.request);
        })
    );
  } else {
    // For other assets (fonts, icons, etc.), try cache first
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).catch(() => {
           return new Response('Not found', { status: 404 });
        });
      })
    );
  }
});
