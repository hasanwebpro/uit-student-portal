/* Offline shell. Never caches /api (private, per-student data). */
const SHELL = 'uit-shell-v1';
const ASSETS = 'uit-assets-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/favicon.svg']))); });

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, ASSETS].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/assets/')) {            // fingerprinted ⇒ safe to serve cache-first forever
    e.respondWith(caches.open(ASSETS).then(async (cache) => (await cache.match(request)) ?? fetch(request).then((res) => { cache.put(request, res.clone()); return res; })));
    return;
  }
  if (request.mode === 'navigate') {                    // app shell: network first, offline fallback
    e.respondWith(fetch(request).then((res) => { caches.open(SHELL).then((c) => c.put('/', res.clone())); return res; }).catch(() => caches.match('/')));
  }
});
