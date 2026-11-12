/* Omni : mise en cache pour fonctionner hors ligne une fois installée. */
const CACHE = 'omni-v52';
const CORE = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* La page : réseau d'abord (pour recevoir les mises à jour), cache sinon.
   Polices et Tailwind : cache d'abord, ils ne changent pas. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(req.mode === 'navigate'){
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if(r.ok || r.type === 'opaque'){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
/* Toucher une alerte ramène à l'appli. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(l => l.length ? l[0].focus() : clients.openWindow('./')));
});
