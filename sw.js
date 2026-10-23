// Service worker de Bebènom: permet instal·lar el web i consultar sense connexió les pàgines ja visitades.
// Pàgines: primer la xarxa (sempre al dia) i, si no n'hi ha, la còpia desada.
// Fitxers (CSS, JS, imatges, fonts, índexs): la còpia desada i s'actualitza en segon pla.
const CACHE = 'bebenom-v1';
const INICI = ['/', '/joc-per-triar-el-nom/', '/preferits/', '/manifest.webmanifest', '/icona-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INICI)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then((res) => { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('/'))));
    return;
  }

  e.respondWith(caches.match(req).then((desat) => {
    const xarxa = fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => desat);
    return desat || xarxa;
  }));
});
