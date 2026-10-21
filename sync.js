'use strict';
/* 詩頁同步：把詩、作者、詩集存到使用者自己的 GitHub 私人儲存庫（例如 mochia7/shiye-data）。
   電腦版和 iPhone 版用同一份程式。採三方合併：和上次同步的版本比，誰改了就用誰的；兩邊都改了同一首，用比較新的。 */
(function () {
  const IS_PC = () => serverMode;
  const DEVICE = () => (IS_PC() ? '電腦' : /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : '手機');
  const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  // ---------- 本機設定（電腦存在詩頁資料夾，手機存在 Safari） ----------
  async function kvGet(key) {
    if (IS_PC()) { try { const r = await fetch('api/kv/' + key, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
    return LS.get('shiye-' + key);
  }
  async function kvSet(key, v) {
    if (IS_PC()) { await fetch('api/kv/' + key, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) }); return; }
    LS.set('shiye-' + key, v);
  }

  // ---------- 手機的圖片（IndexedDB） ----------
  let idbP = null;
  function idb() {
    if (!idbP) idbP = new Promise((res, rej) => {
      const q = indexedDB.open('shiye', 1);
      q.onupgradeneeded = () => q.result.createObjectStore('images');
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
    });
    return idbP;
  }
  async function idbGet(name) { const db = await idb(); return new Promise(res => { const t = db.transaction('images').objectStore('images').get(name); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); }); }
  async function idbPut(name, blob) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('images', 'readwrite'); t.objectStore('images').put(blob, name); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
  async function idbKeys() { const db = await idb(); return new Promise(res => { const t = db.transaction('images').objectStore('images').getAllKeys(); t.onsuccess = () => res(t.result || []); t.onerror = () => res([]); }); }

  const randName = ext => { const a = new Uint8Array(8); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join('') + '.' + ext; };
  const extFromType = t => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[t] || 'jpg';
  // 手機上存圖片：回傳和電腦版一樣的 img/xxxx.jpg
  async function storeImage(blob) {
    const name = randName(extFromType(blob.type));
    await idbPut(name, blob);
    urlCache.set(name, URL.createObjectURL(blob));
    return 'img/' + name;
  }

  // ---------- 顯示圖片：電腦直接用本機網址；手機從 IndexedDB 或 GitHub 拿 ----------
  const urlCache = new Map(), pending = new Map();
  async function resolveImg(ref) {
    if (!ref) return '';
    if (!/^img\//.test(ref) || IS_PC()) return ref;
    const name = ref.slice(4);
    if (urlCache.has(name)) return urlCache.get(name);
    if (!pending.has(name)) pending.set(name, (async () => {
      let blob = await idbGet(name);
      if (!blob && CFG && CFG.token) { try { blob = await ghGetBlob('images/' + name); if (blob) await idbPut(name, blob); } catch (e) {} }
      if (!blob) return '';
      const u = URL.createObjectURL(blob); urlCache.set(name, u); return u;
    })());
    return pending.get(name);
  }
  function hydrate(root = document) {
    root.querySelectorAll('img[data-img]').forEach(async el => {
      const ref = el.getAttribute('data-img'); if (el.dataset.done === ref) return; el.dataset.done = ref;
      const u = await resolveImg(ref); if (u && el.getAttribute('data-img') === ref) el.src = u;
    });
  }
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches('img[data-img]')) hydrate(n.parentNode || document); else if (n.querySelector && n.querySelector('img[data-img]')) hydrate(n); } })
    .observe(document.documentElement, { childList: true, subtree: true });

  // ---------- GitHub API ----------
  let CFG = null;   // { owner, repo, token, api }
  let STATE = null; // { base, sha, etag, last, lastError, device }
  const api = () => (CFG.api || 'https://api.github.com').replace(/\/$/, '');
  const enc = s => s.split('/').map(encodeURIComponent).join('/');
  function gh(path, opt = {}) {
    return fetch(`${api()}/repos/${encodeURIComponent(CFG.owner)}/${encodeURIComponent(CFG.repo)}/contents/${enc(path)}`, Object.assign({ cache: 'no-store' }, opt, {
      headers: Object.assign({ Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, opt.headers || {})
    }));
  }
  function b64FromBytes(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function bytesFromB64(b64) { const s = atob(b64.replace(/\s/g, '')); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  class SyncError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  function failFor(r) {
    if (r.status === 401) return new SyncError('AUTH', '密鑰無效或已過期，請到 GitHub 重新產生一組');
    if (r.status === 403) return new SyncError('FORBIDDEN', '這組密鑰沒有權限寫入，請確認 Contents 設成 Read and write');
    if (r.status === 404) return new SyncError('NOTFOUND', `找不到儲存庫 ${CFG.owner}/${CFG.repo}，或密鑰沒有開放這個儲存庫`);
    return new SyncError('HTTP', 'GitHub 回應 ' + r.status);
  }
  async function ghGetData() {
    const h = {}; if (STATE.etag && STATE.sha) h['If-None-Match'] = STATE.etag;
    const r = await gh('data.json', { headers: h });
    if (r.status === 304) return { unchanged: true };
    if (r.status === 404) {
      const rr = await fetch(`${api()}/repos/${encodeURIComponent(CFG.owner)}/${encodeURIComponent(CFG.repo)}`, { headers: { Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (!rr.ok) throw failFor(rr);
      return { data: null, sha: null };
    }
    if (!r.ok) throw failFor(r);
    const j = await r.json();
    let text;
    if (j.encoding === 'base64' && j.content) text = new TextDecoder().decode(bytesFromB64(j.content));
    else { const raw = await gh('data.json', { headers: { Accept: 'application/vnd.github.raw+json' } }); if (!raw.ok) throw failFor(raw); text = await raw.text(); }
    return { data: JSON.parse(text), sha: j.sha, etag: r.headers.get('ETag') };
  }
  async function ghPutData(obj, sha) {
    const body = { message: `詩頁同步（${DEVICE()}）`, content: b64FromBytes(new TextEncoder().encode(JSON.stringify(obj))) };
    if (sha) body.sha = sha;
    const r = await gh('data.json', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.status === 409 || r.status === 422) return { conflict: true };
    if (!r.ok) throw failFor(r);
    const j = await r.json();
    return { sha: j.content && j.content.sha };
  }
  async function ghListImages() {
    const r = await gh('images');
    if (r.status === 404) return new Set();
    if (!r.ok) throw failFor(r);
    const j = await r.json();
    return new Set((Array.isArray(j) ? j : []).map(x => x.name));
  }
  async function ghPutBlob(path, blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const r = await gh(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `詩頁圖片（${DEVICE()}）`, content: b64FromBytes(bytes) }) });
    if (!r.ok && r.status !== 422) throw failFor(r);
  }
  async function ghGetBlob(path) {
    const r = await gh(path, { headers: { Accept: 'application/vnd.github.raw+json' } });
    if (!r.ok) return null;
    return await r.blob();
  }

  // ---------- 合併 ----------
  const stable = v => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']'
    : v && typeof v === 'object' ? '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}'
    : JSON.stringify(v === undefined ? null : v);
  const LISTS = ['poems', 'authors', 'collections', 'notes'];
  // 一定要複製：上次同步的版本不能和正在用的資料共用同一份物件，不然本機改動會「看不見」
  const mergedJSON = o => JSON.stringify(o);
  function payload(db) { const o = { version: db.version }; LISTS.forEach(k => { o[k] = (db[k] || []).map(x => x); }); return o; }
  function mergeList(B, L, R, stats) {
    const map = a => { const m = new Map(); (a || []).forEach(x => x && x.id && m.set(x.id, x)); return m; };
    const mb = map(B), ml = map(L), mr = map(R);
    const ids = [...new Set([...mr.keys(), ...ml.keys()])];
    const out = [];
    for (const id of ids) {
      const b = mb.get(id), l = ml.get(id), r = mr.get(id);
      const sb = b ? stable(b) : null, sl = l ? stable(l) : null, sr = r ? stable(r) : null;
      if (sl === sr) { if (l) out.push(r); continue; }
      if (sl === sb) { if (r) out.push(r); stats.pulled++; continue; }
      if (sr === sb) { if (l) out.push(l); stats.pushed++; continue; }
      stats.conflicts++;
      if (!l) { out.push(r); continue; }
      if (!r) { out.push(l); continue; }
      out.push((l.updated || 0) >= (r.updated || 0) ? l : r);
    }
    return out;
  }
  function merge(base, local, remote) {
    const stats = { pulled: 0, pushed: 0, conflicts: 0 };
    const out = { version: Math.max(local.version || 0, remote.version || 0) };
    // 舊版詩頁不認得的清單（例如「有感」的靈感筆記）：舊版上傳時會少掉，當作沒有變動，不要刪掉
    LISTS.forEach(k => { const r = remote[k] === undefined ? (base && base[k]) : remote[k]; out[k] = mergeList(base && base[k], local[k], r, stats); });
    return { merged: out, stats };
  }

  // ---------- 圖片同步 ----------
  function imageRefs(db) {
    const s = new Set();
    (db.poems || []).forEach(p => { [p.illustration, p.sourceImg].forEach(x => { if (x && /^img\//.test(x)) s.add(x.slice(4)); }); });
    (db.collections || []).forEach(c => { const x = c.cover && c.cover.img; if (x && /^img\//.test(x)) s.add(x.slice(4)); });
    return s;
  }
  async function localImageBlob(name) {
    if (IS_PC()) { try { const r = await fetch('img/' + encodeURIComponent(name)); return r.ok ? await r.blob() : null; } catch (e) { return null; } }
    return await idbGet(name);
  }
  async function haveLocalImage(name) {
    if (IS_PC()) { try { const r = await fetch('img/' + encodeURIComponent(name), { method: 'HEAD' }); return r.ok; } catch (e) { return false; } }
    return !!(await idbGet(name));
  }
  async function syncImages(db) {
    const refs = imageRefs(db); if (!refs.size) return;
    const remote = await ghListImages();
    for (const name of refs) {
      if (!remote.has(name)) { const b = await localImageBlob(name); if (b) await ghPutBlob('images/' + name, b); }
      else if (IS_PC() && !(await haveLocalImage(name))) {
        const b = await ghGetBlob('images/' + name);
        if (b) await fetch('api/image-put?name=' + encodeURIComponent(name), { method: 'POST', body: b });
      }
    }
  }

  // ---------- 主流程 ----------
  let running = null, again = false, timer = null, lastLocal = '';
  const status = { state: 'off', msg: '', last: 0 };
  function setStatus(state, msg) { status.state = state; status.msg = msg || ''; document.dispatchEvent(new CustomEvent('shiye-sync')); }
  async function syncNow(reason) {
    if (!CFG || !CFG.token || PRINT) return;
    if (running) { again = true; return running; }
    running = (async () => {
      if (!navigator.onLine) { setStatus('offline', '沒有網路，連上後會自動同步'); return; }
      setStatus('syncing', '同步中…');
      try {
        flushSave();
        for (let attempt = 0; attempt < 4; attempt++) {
          const got = await ghGetData();
          const localP = payload(DB);
          const localStr = stable(localP);
          if (got.unchanged && STATE.base && localStr === stable(STATE.base)) break; // 兩邊都沒變
          let remote = got.unchanged ? STATE.base : got.data;
          const sha = got.unchanged ? STATE.sha : got.sha;
          if (!remote) remote = { version: DB.version, poems: [], authors: [], collections: [] };
          const mr = merge(STATE.base, localP, remote), stats = mr.stats;
          const merged = JSON.parse(JSON.stringify(mr.merged));
          // 兩台裝置各自新增了同一位作者：合併成一位
          const nd = typeof dedupeAuthors === 'function' ? dedupeAuthors(merged) : 0;
          if (nd) stats.authorsMerged = nd;
          const mergedStr = stable(merged);
          let newSha = sha;
          if (mergedStr !== stable(remote)) {
            const put = await ghPutData(merged, sha);
            if (put.conflict) { STATE.etag = null; continue; }   // 別人剛好也同步了：重新來一次
            newSha = put.sha; STATE.etag = null;
          } else if (!got.unchanged) STATE.etag = got.etag;
          if (mergedStr !== localStr) applyMerged(merged);
          STATE.base = JSON.parse(mergedJSON(merged)); STATE.sha = newSha; STATE.last = Date.now(); STATE.lastError = '';
          await kvSet('sync-state', STATE);
          if (stats.authorsMerged) setTimeout(() => toast(`已自動合併 ${stats.authorsMerged} 位重複的作者`, 5000), 300);
          if (stats.pulled || stats.conflicts) document.dispatchEvent(new CustomEvent('shiye-synced', { detail: stats }));
          break;
        }
        await syncImages(DB);
        status.last = STATE.last;
        setStatus('ok', '已同步');
        if (IS_PC()) processPendingOCR();
      } catch (e) {
        const msg = e instanceof SyncError ? e.message : (navigator.onLine ? '同步失敗，稍後會再試' : '沒有網路，連上後會自動同步');
        STATE.lastError = msg; kvSet('sync-state', STATE).catch(() => {});
        setStatus(e instanceof SyncError ? 'error' : 'offline', msg);
      }
    })();
    try { await running; } finally { running = null; if (again) { again = false; setTimeout(() => syncNow('again'), 300); } }
  }
  function applyMerged(merged) {
    const keep = { prefs: DB.prefs };
    const copy = JSON.parse(mergedJSON(merged));
    LISTS.forEach(k => { DB[k] = copy[k]; });
    DB.version = Math.max(DB.version || 0, merged.version || 0);
    DB.prefs = keep.prefs;
    DB.poems.forEach(p => { p.layout = Object.assign(defLayout(p.type), p.layout || {}); });
    save(true);
    // 正在編輯時不要打斷；其他畫面重新整理
    const v = route().view;
    if (v !== 'edit' && v !== 'new' && v !== 'import' && v !== 'write' && v !== 'ygimp' && !$('#modal')) render();
  }
  // 存檔後幾秒內同步一次（避免每打一個字就同步）
  function afterSave() {
    if (!CFG || !CFG.token || PRINT) return;
    clearTimeout(timer); timer = setTimeout(() => syncNow('save'), 4000);
  }

  // ---------- 手機拍照，電腦幫忙辨識 ----------
  let ocrBusy = false;
  async function processPendingOCR() {
    if (ocrBusy) return; ocrBusy = true;
    try {
      const todo = DB.poems.filter(p => !p.deleted && (p.tags || []).includes('待辨識') && p.sourceImg);
      for (const p of todo) {
        const blob = await localImageBlob(p.sourceImg.slice(4)); if (!blob) continue;
        const fd = new FormData(); fd.append('file', blob, 'scan.png');
        const r = await fetch('api/ocr', { method: 'POST', body: fd });
        if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) {} if (j.error === 'NOTWINDOWS' || j.error === 'NOENGINE') break; continue; }
        const j = await r.json(); const res = ocrToText(j.lines);
        if (!res.text.trim()) continue;
        const d = parseShared(res.text);
        p.text = d.text;
        if (!p.title || p.title === '待辨識的照片') p.title = d.title;
        if (!p.authorId && d.authorName) p.authorId = resolveAuthor(d.authorName, d.dynasty);
        p.type = d.type; p.layout = defLayout(d.type);
        p.tags = p.tags.filter(t => t !== '待辨識'); if (!p.tags.includes('待校對')) p.tags.push('待校對');
        if (findDup(p.text, p.id) && !p.tags.includes('可能重複')) p.tags.push('可能重複');
        p.updated = Date.now();
      }
      if (todo.length) { save(true); render(); }
    } finally { ocrBusy = false; }
  }

  // ---------- 設定 ----------
  async function init() {
    CFG = await kvGet('sync-config');
    STATE = (await kvGet('sync-state')) || {};
    if (CFG && CFG.token) {
      setStatus('idle', '');
      syncNow('start');
      setInterval(() => { if (document.visibilityState === 'visible') syncNow('timer'); }, 60000);
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow('visible'); });
    window.addEventListener('online', () => syncNow('online'));
  }
  async function configure(owner, repo, token) {
    CFG = { owner: owner.trim(), repo: repo.trim(), token: token.trim(), api: (CFG && CFG.api) || undefined };
    STATE = {};   // 新的連線：重新做第一次合併
    await kvSet('sync-config', CFG); await kvSet('sync-state', STATE);
    if (IS_PC()) { try { await fetch('api/backup?tag=sync', { method: 'POST' }); } catch (e) {} }
    await syncNow('configure');
    if (status.state !== 'ok') return status.msg;
    setInterval(() => { if (document.visibilityState === 'visible') syncNow('timer'); }, 60000);
    return '';
  }
  async function disconnect() {
    CFG = null; STATE = {};
    if (IS_PC()) { await fetch('api/kv/sync-config', { method: 'DELETE' }); await fetch('api/kv/sync-state', { method: 'DELETE' }); }
    else { try { localStorage.removeItem('shiye-sync-config'); localStorage.removeItem('shiye-sync-state'); } catch (e) {} }
    setStatus('off', '');
  }
  // ---------- 時光機：GitHub 上每次同步都是一個版本 ----------
  async function listVersions(page = 1) {
    if (!CFG || !CFG.token) throw new SyncError('OFF', '還沒有連接同步');
    const r = await fetch(`${api()}/repos/${encodeURIComponent(CFG.owner)}/${encodeURIComponent(CFG.repo)}/commits?path=data.json&per_page=60&page=${page}`, { headers: { Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' });
    if (!r.ok) throw failFor(r);
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map(c => ({ sha: c.sha, date: Date.parse((c.commit && (c.commit.committer || c.commit.author) || {}).date) || 0, message: (c.commit && c.commit.message) || '' }));
  }
  async function getVersion(sha) {
    if (!CFG || !CFG.token) throw new SyncError('OFF', '還沒有連接同步');
    const r = await fetch(`${api()}/repos/${encodeURIComponent(CFG.owner)}/${encodeURIComponent(CFG.repo)}/contents/data.json?ref=${encodeURIComponent(sha)}`, { headers: { Authorization: 'Bearer ' + CFG.token, Accept: 'application/vnd.github.raw+json', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' });
    if (!r.ok) throw failFor(r);
    const t = await r.text();
    let j = JSON.parse(t);
    if (j && j.encoding === 'base64' && j.content) j = JSON.parse(new TextDecoder().decode(bytesFromB64(j.content)));
    return j;
  }
  const info = () => ({ configured: !!(CFG && CFG.token), owner: CFG && CFG.owner, repo: CFG && CFG.repo, status, last: (STATE && STATE.last) || 0, device: DEVICE() });
  // 測試用：可以改成模擬的 GitHub 網址
  async function setApiForTest(url) { CFG = Object.assign(CFG || {}, { api: url }); }

  window.ShiSync = { init, syncNow, afterSave, configure, disconnect, info, storeImage, resolveImg, hydrate, merge, setApiForTest, listVersions, getVersion };
})();
