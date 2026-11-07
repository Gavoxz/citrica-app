const V = 'cd-v3', SHELL = ['./', 'index.html', 'manifest.webmanifest', 'styles/app.css', 'app/main.js', 'components/ui.js', 'components/views.js', 'components/sheets.js', 'services/storage.js', 'lib/money.js', 'lib/pix.js', 'lib/domain.js', 'lib/seed.js', 'lib/messages.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(V).then((c) => c.put(e.request, copy)); } return r; }).catch(() => hit)));
});
