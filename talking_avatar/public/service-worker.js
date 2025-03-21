const CACHE_NAME = 'talking-avatar-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/model.glb',
  '/model.glb.gz',
  '/idle.fbx',
  '/blendData.json',
  '/images/body.webp',
  '/images/eyes.webp',
  '/images/teeth_diffuse.webp',
  '/images/body_specular.webp',
  '/images/body_roughness.webp',
  '/images/body_normal.webp',
  '/images/teeth_normal.webp',
  '/images/h_color.webp',
  '/images/tshirt_diffuse.webp',
  '/images/tshirt_normal.webp',
  '/images/tshirt_roughness.webp',
  '/images/h_alpha.webp',
  '/images/h_normal.webp',
  '/images/h_roughness.webp',
  '/images/bg.webp',
  '/images/photo_studio_loft_hall_1k.hdr'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Error caching static assets:', err))
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => console.error('Error caching new resource:', err));

          return response;
        });
      })
  );
});

