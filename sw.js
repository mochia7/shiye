// 詩頁離線快取：程式本身先用快取（沒網路也能開），背景再更新；GitHub 同步的請求不快取
const CACHE = 'shiye-v0.4.0';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'importer.js', 'sync.js', 'icon.svg', 'icon.png', 'apple-touch-icon.png', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('shiye-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'api.github.com') return;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  e.respondWith(caches.open(isFont ? 'shiye-fonts' : CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: !isFont });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
