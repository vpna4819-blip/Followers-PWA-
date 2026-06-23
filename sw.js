// കാഷെ നെയിം വേർഷൻ മാറ്റി നൽകുക (അപ്ഡേറ്റ് വരുമ്പോൾ ഇതും മാറ്റാവുന്നതാണ്)
const CACHE_NAME = 'followers-pwa-v1.0.3';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://i.ibb.co/7JMxxY8B/slazzer-preview-4dw83.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // പുതിയ വർക്കർ ഇൻസ്റ്റാൾ ആകുമ്പോൾ തന്നെ വെയ്റ്റ് ചെയ്യാതെ ആക്ടീവ് ആക്കുക
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => {
          return fetch(new Request(url, { cache: 'reload' })) // Cache ഒഴിവാക്കി ഫ്രഷ് ആയി ഡൗൺലോഡ് ചെയ്യാൻ
            .then(response => {
              if (response.ok) return cache.put(url, response);
            })
            .catch(err => console.log('Failed to cache asset:', url, err));
        })
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName); // പഴയ കാഷെ ഡിലീറ്റ് ചെയ്യുക
            }
          })
        );
      });
    })
  );
});

// HTML വഴി Skip Waiting വിളിക്കുമ്പോൾ ആക്ടീവ് ആവാനുള്ള മെസ്സേജ് ലിസണർ
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Network-First Strategy (എല്ലായിപ്പോഴും നെറ്റ്വർക്കിൽ നിന്ന് പുതിയ ഫയൽ എടുക്കാൻ ശ്രമിക്കും)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }) // ക്യാഷെ നോക്കാതെ എപ്പോഴും ലൈവ് സർവറിൽ നിന്ന് എടുക്കാൻ
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // നെറ്റ്വർക്ക് ഇല്ലെങ്കിൽ മാത്രം കാഷെയിൽ നിന്ന് കൊടുക്കുക
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
