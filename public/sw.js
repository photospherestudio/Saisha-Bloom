const CACHE = 'saisha-bloom-public-v2';
const DEMO = '/child/demo/checklist';
const PUBLIC_SHELL = ['/', '/offline', DEMO];
const PRIVATE = /^(\/dashboard|\/child\/|\/account|\/api\/|\/onboarding|\/invite|\/consent|\/auth\/)/;

self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_SHELL))));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || (PRIVATE.test(url.pathname) && url.pathname !== DEMO) || url.search) return;
  if (url.pathname === '/' || url.pathname === '/offline' || url.pathname === DEMO || url.pathname.startsWith('/illustrations/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { const copy = response.clone(); void caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; }).catch(() => caches.match('/offline'))));
  }
});
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'Saisha Bloom', { body: data.body || 'A gentle Saisha Bloom check-in is ready.', icon: '/icon-192.svg', badge: '/icon-192.svg', data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/account/push' } }));
});
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => { const target = event.notification.data?.url || '/account/push'; const existing = clients.find((client) => 'focus' in client); return existing ? existing.focus() : self.clients.openWindow(target); })); });
