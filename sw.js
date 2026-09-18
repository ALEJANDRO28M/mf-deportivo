/* MF Deportivo · service worker: la app abre y funciona sin internet. */
const VERSION = 'mf-v2';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // La página: primero red (para recibir actualizaciones), si no hay internet, la copia guardada.
  if(url.origin === location.origin && (url.pathname.endsWith('/') || url.pathname.endsWith('index.html'))){
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Lo demás (fuentes, jsPDF, íconos): primero caché, si no está se pide y se guarda.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if(r.ok && (url.origin === location.origin || /fonts\.g|cdnjs/.test(url.host))){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => hit)));
});
