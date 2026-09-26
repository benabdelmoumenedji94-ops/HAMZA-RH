// Hamza RH — تخزين مؤقت للصور والصفحة، يقلّص استهلاك الأنترنت والاستضافة
const CACHE = 'hamzarh-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './img/hero.webp', './img/hero.jpg',
  './img/team.webp', './img/team.jpg',
  './img/portrait.webp', './img/portrait.jpg',
  './img/logo.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k =>
    Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // لا نخزّن نداءات Firestore إطلاقًا
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;
  if (url.origin !== location.origin) return;

  // الصور: من الذاكرة أولًا
  if (url.pathname.includes('/img/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    })));
    return;
  }

  // الصفحة: من الشبكة أولًا حتى تصل التحديثات، ومن الذاكرة عند انقطاع الأنترنت
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request)));
});
