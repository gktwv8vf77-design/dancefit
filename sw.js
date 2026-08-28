const CACHE = 'dancefit-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// La page et les programmes : réseau d'abord, cache en secours hors connexion.
// Sans ça, une nouvelle version de l'app n'apparaissait qu'à la DEUXIÈME
// ouverture, et un programme ajouté côté serveur restait invisible.
// Le reste (icônes, manifest) : cache d'abord, c'est immuable.
self.addEventListener('fetch', e => {
  const req = e.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  const isProgram = req.url.includes('/programmes/') || req.url.includes('program-default.json');

  if (isDoc || isProgram) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (isDoc && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
