// 詩頁離線快取：程式本身先用快取（沒網路也能開），背景再更新；GitHub 同步的請求不快取
const CACHE = 'shiye-v0.8.0';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'importer.js', 'sync.js', 'extras.js', 'extras2.js', 'recs.js', 'icon.svg', 'icon.png', 'apple-touch-icon.png', 'icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('shiye-v')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'api.github.com') return;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  const isOCR = url.hostname === 'cdn.jsdelivr.net' && /\/npm\/(tesseract\.js@|tesseract\.js-core@|@tesseract\.js-data\/)/.test(url.pathname);
  if (url.origin !== location.origin && !isFont && !isOCR) return;
  e.respondWith(caches.open(isFont ? 'shiye-fonts' : isOCR ? 'shiye-ocr' : CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: !isFont && !isOCR });
    if (hit && isOCR) return hit;
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
