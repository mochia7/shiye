'use strict';
/* 詩頁 v0.5：每日推薦、手機辨識圖片、聰明貼上、網址抓取、時光機。
   使用 app.js 的全域函式（DB、save、render、go、toast、modal、esc、live、authorOf …）。 */
(function () {
  const LSK = 'shiye-rec';
  const ls = { get() { try { return JSON.parse(localStorage.getItem(LSK)) || {}; } catch (e) { return {}; } }, set(v) { try { localStorage.setItem(LSK, JSON.stringify(v)); } catch (e) {} } };
  const nk = s => ShiImport.normKey(s);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const recKey = r => r.kind === 'poet' ? 'poet:' + r.a : nk(r.t) + '/' + nk(r.a);
  const rerenderEditor = () => { const keep = ED; $('#app').innerHTML = editorView(keep); ED = keep; edRefresh(); bindDrops(); };

  // ---------- 每日推薦 ----------
  const GROUP = { tw: '台灣現代詩', 'tw-new': '當代台灣詩人', cn: '中國現代詩', hk: '香港現代詩', pd: '民國新詩' };
  let POOL = null;
  function pools() {
    if (POOL) return POOL;
    const R = window.SHI_RECS || { modern: [], poets: [], classic: [] };
    POOL = {
      modern: [...R.modern.map(x => Object.assign({ kind: 'modern' }, x)), ...R.poets.map(x => Object.assign({ kind: 'poet' }, x))],
      classic: R.classic.map(x => Object.assign({ kind: 'classic' }, x)),
      world: [...(R.world || []).map(x => Object.assign({ kind: 'world' }, x)), ...(R.worldMeta || []).map(x => Object.assign({ kind: 'wmeta' }, x))]
    };
    return POOL;
  }
  function owned() {
    const s = new Set();
    live().forEach(p => { const a = authorOf(p); s.add(nk(p.title) + '/' + nk(a ? a.name : '')); });
    return s;
  }
  function weights(list, mode) {
    // 依收藏：收藏過的作者所屬的類別、朝代，推薦得多一點
    const favNames = new Set(live().filter(p => p.fav).map(p => { const a = authorOf(p); return a ? a.name : ''; }).filter(Boolean));
    const libNames = new Set(live().map(p => { const a = authorOf(p); return a ? a.name : ''; }).filter(Boolean));
    const gScore = {};
    list.forEach(x => { if (favNames.has(x.a)) gScore[x.g || x.d || x.c] = (gScore[x.g || x.d || x.c] || 0) + 2; else if (libNames.has(x.a)) gScore[x.g || x.d || x.c] = (gScore[x.g || x.d || x.c] || 0) + 1; });
    return list.map(x => 1 + Math.min(gScore[x.g || x.d || x.c] || 0, 6) * .5 + (favNames.has(x.a) ? 1.5 : libNames.has(x.a) ? .8 : 0));
  }
  function pick(mode) {
    const st = ls.get(); const hidden = new Set(st.hidden || []);
    const have = owned();
    const list = pools()[mode].filter(x => !hidden.has(recKey(x)) && (x.kind === 'poet' || !have.has(nk(x.t) + '/' + nk(x.a))));
    if (!list.length) return null;
    const w = weights(list, mode), sum = w.reduce((a, b) => a + b, 0);
    const skip = (st.skip && st.skip.day === todayKey() && st.skip[mode]) || 0;
    let r = (hash(todayKey() + mode + ':' + skip) % 100000) / 100000 * sum;
    for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  function recMode() { return ls.get().mode || 'modern'; }
  function searchURL(r) {
    const q = r.kind === 'poet' ? `${r.a} 詩` : r.kind === 'wmeta' ? `${r.ot} ${r.oa}` : `${r.t} ${r.a} 詩`;
    return 'https://www.google.com/search?q=' + encodeURIComponent(q);
  }
  function recCardHTML() {
    const mode = recMode(), r = pick(mode);
    const seg = `<div class="seg rec-seg" role="group" aria-label="推薦類型">${[['modern', '新詩'], ['classic', '古典'], ['world', '世界']].map(([k, n]) => `<button type="button" data-act="rec-mode" data-v="${k}" class="${mode === k ? 'on' : ''}" aria-pressed="${mode === k}">${n}</button>`).join('')}</div>`;
    let body;
    if (!r) body = `<p class="muted" style="margin:0">這一類的推薦你都讀過或存過了。</p>`;
    else if (r.kind === 'classic') {
      const lines = r.x.split('\n');
      body = `<div class="rec-kicker">${esc(r.s)} · ${esc(r.f)}</div>
        <h3 class="rec-title serif">${esc(r.t)}</h3><div class="rec-au">${esc(r.d)} · ${esc(r.a)}</div>
        <div class="rec-text serif">${lines.slice(0, 8).map(esc).join('<br>')}${lines.length > 8 ? '<br>…' : ''}</div>
        <div class="row rec-acts"><button type="button" class="btn red sq" data-act="rec-save">存進詩庫</button><button type="button" class="btn sq" data-act="rec-next">換一首</button><button type="button" class="btn ghost sq" data-act="rec-hide">不感興趣</button></div>`;
    } else if (r.kind === 'world') {
      const xs = r.x.split('\n').filter(l => l.trim()), ts = r.tr.split('\n').filter(l => l.trim());
      const n = Math.min(4, xs.length), more = xs.length > 4;
      const same = r.t === r.ot;
      body = `<div class="rec-kicker">世界經典 · ${esc(r.c)}${r.y ? ' · ' + r.y : ''}</div>
        <h3 class="rec-title serif">〈${esc(r.t)}〉</h3>${same ? '' : `<div class="rec-ot">${esc(r.ot)}</div>`}
        <div class="rec-au">${esc(r.a)}（${esc(r.oa)}）${r.src ? ' · ' + esc(r.src) : ''}</div>
        <div class="rec-bi"><div class="rec-text orig">${xs.slice(0, n).map(esc).join('<br>')}${more ? '<br>…' : ''}</div><div class="rec-text serif">${ts.slice(0, Math.max(n, r.c === '日本' ? ts.length : n)).map(esc).join('<br>')}${more ? '<br>…' : ''}</div></div>
        <p class="rec-note">${esc(r.n)}</p>
        <div class="row rec-acts"><button type="button" class="btn red sq" data-act="rec-save">存進詩庫</button><button type="button" class="btn sq" data-act="rec-next">換一首</button><button type="button" class="btn ghost sq" data-act="rec-hide">不感興趣</button></div>
        <p class="note" style="margin:0">原文已經沒有著作權；中文為詩頁譯。存進詩庫後原文和譯文會並排顯示。</p>`;
    } else if (r.kind === 'wmeta') {
      body = `<div class="rec-kicker">世界現代詩 · ${esc(r.c)}</div>
        <h3 class="rec-title serif">〈${esc(r.t)}〉</h3><div class="rec-ot">${esc(r.ot)}</div>
        <div class="rec-au">${esc(r.a)}（${esc(r.oa)}）${r.src ? ' · 收錄於' + esc(r.src) : ''}</div>
        <p class="rec-note">${esc(r.n)}</p>
        <div class="row rec-acts"><a class="btn red sq" href="${esc(searchURL(r))}" target="_blank" rel="noopener" data-act="rec-search">搜尋全文與翻譯</a><button type="button" class="btn sq" data-act="rec-save">存進詩庫</button><button type="button" class="btn sq" data-act="rec-next">換一首</button><button type="button" class="btn ghost sq" data-act="rec-hide">不感興趣</button></div>
        <p class="note" style="margin:0">這首還有著作權，這裡只放導讀。找到原文或譯文後，可以貼進「內文」和「對照譯文」。</p>`;
    } else if (r.kind === 'poet') {
      body = `<div class="rec-kicker">推薦詩人 · ${esc(GROUP[r.g] || '')}</div>
        <h3 class="rec-title serif">${esc(r.a)}</h3>${r.book ? `<div class="rec-au">可以從詩集${esc(r.book)}讀起</div>` : ''}
        <p class="rec-note">${esc(r.n)}</p>
        <div class="row rec-acts"><a class="btn red sq" href="${esc(searchURL(r))}" target="_blank" rel="noopener" data-act="rec-search">搜尋他的詩</a><button type="button" class="btn sq" data-act="rec-next">換一首</button><button type="button" class="btn ghost sq" data-act="rec-hide">不感興趣</button></div>`;
    } else {
      body = `<div class="rec-kicker">${esc(GROUP[r.g] || '新詩')}</div>
        <h3 class="rec-title serif">〈${esc(r.t)}〉</h3><div class="rec-au">${esc(r.a)}${r.src ? ` · 收錄於${esc(r.src)}` : ''}</div>
        <p class="rec-note">${esc(r.n)}</p>
        <div class="row rec-acts"><a class="btn red sq" href="${esc(searchURL(r))}" target="_blank" rel="noopener" data-act="rec-search">搜尋全文</a><button type="button" class="btn sq" data-act="rec-save">存進詩庫</button><button type="button" class="btn sq" data-act="rec-next">換一首</button><button type="button" class="btn ghost sq" data-act="rec-hide">不感興趣</button></div>
        <p class="note" style="margin:0">新詩大多還有著作權，這裡只放導讀。找到全文後選取 → 分享 →「存到詩頁」，或拷貝後按「存進詩庫」貼上。</p>`;
    }
    return `<section class="sec-block" id="rec-sec"><div class="row" style="justify-content:space-between"><h2 class="sec">今日推薦</h2>${seg}</div><div class="card rec-card">${body}</div></section>`;
  }
  function refreshRec() { const s = $('#rec-sec'); if (s) s.outerHTML = recCardHTML(); }
  function setPending(r) { const st = ls.get(); st.pending = { t: r.t || '', a: r.a, src: r.src || '', at: Date.now(), kind: r.kind }; ls.set(st); }
  function pendingRec() {
    const p = ls.get().pending;
    if (!p || p.kind === 'poet' || Date.now() - p.at > 3 * 3600e3) return null;
    return { title: p.t, author: p.a, src: p.src };
  }
  function clearRec() { const st = ls.get(); delete st.pending; ls.set(st); }
  function saveWorld(r) {
    const note = `${r.ot !== r.t ? '原題：' + r.ot + '\n' : ''}${r.oa}（${r.c}${r.y ? '，' + r.y : ''}）${r.src ? '　' + r.src : ''}\n中文：詩頁譯\n${r.n}`;
    const d = { title: r.t, authorName: r.a, dynasty: r.c, text: r.x, trans: r.tr, type: 'modern', source: '世界經典', note, tags: [] };
    const p = newPoem(d, null); DB.poems.push(p);
    const au = authorOf(p); if (au && !au.bio) au.bio = r.oa;
    save(); toast(`已把〈${r.t}〉存進詩庫`); go('#/read/' + p.id);
  }
  function saveClassic(r) {
    const d = { title: r.t, authorName: r.a, dynasty: r.d, text: r.x, type: 'classic', source: r.s, tags: [] };
    const p = newPoem(d, null); DB.poems.push(p); save();
    toast(`已把〈${r.t}〉存進詩庫`);
    go('#/read/' + p.id);
  }

  // ---------- 手機辨識圖片（Tesseract.js，第一次需要網路） ----------
  const TJS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/';
  const TCORE = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1';
  const TLANG = 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/chi_tra@1.0.0/4.0.0_best_int';
  let tWorker = null;
  function loadScript(src) {
    return new Promise((res, rej) => { if (window.Tesseract) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load')); document.head.appendChild(s); });
  }
  async function getWorker() {
    if (tWorker) return tWorker;
    let first = true; try { first = !localStorage.getItem('shiye-ocr-ready'); } catch (e) {}
    toast(first ? '第一次使用要下載辨識資料（約 5 MB），請稍候…' : '辨識中，請稍候…', 120000);
    await loadScript(TJS + 'tesseract.min.js');
    tWorker = await Tesseract.createWorker('chi_tra', 1, { workerPath: TJS + 'worker.min.js', corePath: TCORE, langPath: TLANG });
    try { localStorage.setItem('shiye-ocr-ready', '1'); } catch (e) {}
    return tWorker;
  }
  async function prepImage(blob) {
    const bmp = await createImageBitmap(blob);
    // 手機截圖（細長）縮到寬 600，照片最長邊 1600：Tesseract 對 20～30px 高的字最準
    const tall = bmp.height / bmp.width > 1.5;
    const k = tall ? Math.min(1, 600 / bmp.width) : Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext('2d'); g.drawImage(bmp, 0, 0, c.width, c.height);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    let sum = 0; for (let i = 0; i < d.length; i += 16) sum += .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2];
    const dark = sum / (d.length / 16) < 110;
    for (let i = 0; i < d.length; i += 4) { let y = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; if (dark) y = 255 - y; d[i] = d[i + 1] = d[i + 2] = y; }
    g.putImageData(im, 0, 0);
    return c;
  }
  async function phoneOCR(blob) {
    const w = await getWorker();
    toast('辨識中，請稍候…', 120000);
    const c = await prepImage(blob);
    const r = await w.recognize(c, {}, { blocks: true });
    const lines = [];
    for (const b of r.data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) {
      const ws = (l.words || []).map(x => ({ text: x.text, x: x.bbox.x0, y: x.bbox.y0, w: x.bbox.x1 - x.bbox.x0, h: x.bbox.y1 - x.bbox.y0 })).filter(x => x.text.trim());
      // 行尾離很遠的單一個字，通常是網頁上的連結圖示
      if (ws.length >= 4) { const a = ws[ws.length - 1], b2 = ws[ws.length - 2], cw = ws.slice(0, -1).reduce((s2, x) => s2 + x.w, 0) / (ws.length - 1); if (a.text.length === 1 && a.x - (b2.x + b2.w) > cw * 1.3) ws.pop(); }
      if (ws.length) lines.push({ words: ws });
    }
    const out = ocrToText(lines, 1.4, true);
    // 中文之間的半形標點換成全形
    out.text = out.text.replace(/([\u3400-\u9fff])\s*([,;:?!])\s*(?=[\u3400-\u9fff]|$)/gm, (m, a, p) => a + ({ ',': '，', ';': '；', ':': '：', '?': '？', '!': '！' })[p]);
    const t = $('#toast'); if (t) t.classList.remove('show');
    return out;
  }

  // ---------- 聰明貼上與網址抓取 ----------
  function applyDraft(d, how) {
    if (!ED) return;
    if (ED.text.trim() && !confirm('要用新的內容取代目前的內文嗎？')) return;
    const rec = ED.fromRec;
    // 自己打的標題、作者保留；之前自動帶入的可以換掉
    const keepT = ED.title.trim() && ED.title !== '無題' && !ED.autoT && !rec;
    const keepA = ED.authorName.trim() && !ED.autoA && !rec;
    const nt = rec ? rec.title : d.title && d.title !== '無題' ? d.title : (ED.autoT ? '' : ED.title);
    Object.assign(ED, {
      title: keepT ? ED.title : nt, authorName: keepA ? ED.authorName : (rec ? rec.author : d.authorName || (ED.autoA ? '' : ED.authorName)),
      text: d.text, type: rec ? 'modern' : (d.type || ED.type),
      source: ED.autoS || !ED.source ? (d.source || (rec && rec.src) || '') : ED.source, note: ED.autoN || !ED.note ? (d.note || '') : ED.note,
      imported: true, shared: true, autoT: !keepT, autoA: !keepA, autoS: true, autoN: true
    });
    (d.tags || []).forEach(t => { if (!ED.tags.includes(t)) ED.tags.push(t); });
    ED.fromRec = null; if (rec) clearRec();
    rerenderEditor();
    toast(how);
  }
  async function smartPaste() {
    let t = '';
    try { t = await navigator.clipboard.readText(); } catch (e) { toast('沒辦法讀取剪貼簿。請在內文框長按，選「貼上」，一樣會自動整理。', 6000); return; }
    if (!t.trim()) { toast('剪貼簿是空的，先在網頁上選取詩的文字並拷貝'); return; }
    if (/^\s*https?:\/\/\S+\s*$/.test(t) && serverMode) { const u = $('#ed-url'); if (u) u.value = t.trim(); fetchURL(t.trim()); return; }
    const rec = ED && ED.fromRec;
    applyDraft(parseShared(t, { rec: rec || null }), '已貼上，標題、作者與分段請再確認');
  }
  function htmlToText(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const host = (() => { try { return new URL(url).hostname; } catch (e) { return ''; } })();
    if (/(^|\.)ptt\.cc$/.test(host) || doc.querySelector('#main-content .article-metaline')) {
      const main = doc.querySelector('#main-content');
      if (main) {
        const meta = {}; main.querySelectorAll('.article-metaline, .article-metaline-right').forEach(m => { const k = m.querySelector('.article-meta-tag'), v = m.querySelector('.article-meta-value'); if (k && v) meta[k.textContent.trim()] = v.textContent.trim(); m.remove(); });
        main.querySelectorAll('.push').forEach(x => x.remove());
        const head = `作者  ${meta['作者'] || ''}  看板  ${meta['看板'] || ''}\n標題  ${meta['標題'] || ''}\n時間  ${meta['時間'] || ''}\n`;
        return { ptt: true, text: head + main.textContent, title: meta['標題'] || '' };
      }
    }
    const siteMeta = (doc.querySelector('meta[property="og:site_name"]') || {}).content || '';
    doc.querySelectorAll('script,style,noscript,iframe,svg,nav,header,footer,aside,form,button,select,[role=navigation],[aria-hidden=true]').forEach(x => x.remove());
    const root = doc.querySelector('article [itemprop=articleBody]') || doc.querySelector('[itemprop=articleBody]') || doc.querySelector('article') || doc.querySelector('main') || doc.querySelector('.post-content,.entry-content,.article-content,#content,.content') || doc.body;
    const BLOCK = /^(P|DIV|LI|H[1-6]|TR|BLOCKQUOTE|PRE|SECTION|ARTICLE|DD|DT|FIGCAPTION|TABLE|UL|OL)$/;
    let out = '';
    const walk = n => {
      if (n.nodeType === 3) { out += n.nodeValue.replace(/[ \t\r\n]+/g, ' '); return; }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'BR') { out += '\n'; return; }
      const blk = BLOCK.test(n.tagName);
      if (blk) out += '\n';
      if (n.tagName === 'PRE') out += n.textContent; else n.childNodes.forEach(walk);
      if (blk) out += n.tagName === 'P' || /^H/.test(n.tagName) ? '\n\n' : '\n';
    };
    walk(root);
    const text = out.split('\n').map(l => l.replace(/^[ ]+|[ ]+$/g, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const title = (doc.querySelector('h1') || {}).textContent || doc.title || '';
    const site = siteMeta;
    return { text, title: title.trim(), site: site.trim() };
  }
  async function fetchURL(u) {
    if (!u || !/^https?:\/\//i.test(u)) { toast('請貼上 http 或 https 開頭的網址'); return; }
    toast('抓取中…', 30000);
    try {
      const r = await fetch('api/fetch?url=' + encodeURIComponent(u), { headers: { 'X-ShiYe': '1' }, cache: 'no-store' });
      if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) {} throw new Error(j.error === 'NOTHTML' ? '這個網址不是網頁' : j.error === 'HTTP' ? `網站回應 ${j.status}，可能需要登入或已經刪除` : j.error === 'BADURL' ? '網址格式不對' : '連不到這個網站，請確認網路'); }
      const buf = await r.arrayBuffer();
      let cs = (r.headers.get('X-Charset') || '').toLowerCase();
      let html = new TextDecoder(cs && cs !== 'utf8' ? cs : 'utf-8', { fatal: false }).decode(buf);
      const m = !cs && html.slice(0, 3000).match(/<meta[^>]+charset=["']?([\w-]+)/i);
      if (m && !/utf-?8/i.test(m[1])) { try { html = new TextDecoder(m[1].toLowerCase()).decode(buf); } catch (e) {} }
      const final = r.headers.get('X-Final-Url') || u;
      const pg = htmlToText(html, final);
      const rec = ED && ED.fromRec;
      let d;
      if (pg.ptt) d = parseImported(pg.text, '', 'txt');
      else d = parseShared(pg.text, { page: true, title: rec ? rec.title : '', rec: rec || null });
      if (!d.text.trim()) throw new Error('這個網頁裡沒有找到詩');
      if (!d.source) { try { d.source = pg.site || new URL(final).hostname.replace(/^www\./, ''); } catch (e) {} }
      applyDraft(d, '已從網頁抓取，請確認是不是詩的全文');
    } catch (e) { toast(e.message || '抓取失敗', 6000); }
  }

  // ---------- 時光機 ----------
  const stable = v => Array.isArray(v) ? '[' + v.map(stable).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).filter(k => v[k] !== undefined && k !== 'updated').sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);
  const clone = o => JSON.parse(JSON.stringify(o));
  let HV = null; // { sha, data, date }
  const fmtDate = t => { const d = new Date(t); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function historyView(sha) {
    const i = ShiSync.info();
    const head = topbar(`<a class="btn" href="${sha ? '#/history' : '#/sync'}">${sha ? '所有版本' : '回到同步'}</a>`);
    if (!i.configured) return head + `<main class="page narrow"><h1 class="sec" style="font-size:32px">時光機</h1><div class="card panel"><p style="margin:0">時光機用的是 GitHub 上的同步紀錄，請先到「同步」連接。</p><a class="btn red sq" href="#/sync" style="align-self:flex-start">前往同步</a></div></main>`;
    return head + `<main class="page narrow" style="gap:20px">
      <h1 class="sec" style="font-size:32px">${sha ? '這個版本' : '時光機'}</h1>
      ${sha ? '' : '<p class="muted" style="margin:0">每次同步，GitHub 都會留下一個版本。點一個時間，可以看看那時候和現在差在哪裡，把改壞或刪掉的詩找回來。</p>'}
      <div id="hist" class="card panel"><span class="muted">讀取中…</span></div></main>`;
  }
  async function historyLoad(sha) {
    const box = $('#hist'); if (!box || !ShiSync.info().configured) return;
    try {
      if (!sha) {
        const vs = await ShiSync.listVersions(1);
        if (!$('#hist')) return;
        if (!vs.length) { box.innerHTML = '<span class="muted">還沒有任何版本。</span>'; return; }
        let day = '';
        box.innerHTML = vs.map((v, i) => {
          const d = new Date(v.date), dk = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
          const h = dk !== day ? `<div class="hist-day">${dk}</div>` : ''; day = dk;
          const dev = /iPhone|手機/.test(v.message) ? 'iPhone' : /電腦/.test(v.message) ? '電腦' : '';
          return h + `<a class="hist-row" href="#/history/${esc(v.sha)}"><span class="hist-time">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span><span class="muted">${dev ? `從${dev}同步` : esc(v.message.split('\n')[0])}</span>${i === 0 ? '<span class="tag">最新</span>' : ''}<span style="margin-left:auto">›</span></a>`;
        }).join('') + (vs.length >= 60 ? '<p class="note" style="margin:8px 0 0">只列出最近 60 個版本。</p>' : '');
        return;
      }
      const vs = await ShiSync.listVersions(1).catch(() => []);
      const meta = vs.find(v => v.sha === sha);
      const data = await ShiSync.getVersion(sha);
      HV = { sha, data, date: meta ? meta.date : 0 };
      if (!$('#hist')) return;
      box.outerHTML = diffHTML();
    } catch (e) { const b = $('#hist'); if (b) b.innerHTML = `<span class="muted">${esc(e.message || '讀取失敗，請確認網路')}</span>`; }
  }
  function diffRows() {
    const old = new Map((HV.data.poems || []).map(p => [p.id, p]));
    const cur = new Map(DB.poems.map(p => [p.id, p]));
    const rows = [];
    for (const [id, o] of old) {
      const c = cur.get(id);
      if (o.deleted) continue;
      if (!c || c.deleted) { rows.push({ kind: 'gone', o, c }); continue; }
      const what = [];
      if (c.text !== o.text) what.push('內文'); if (c.title !== o.title) what.push('標題');
      if (c.authorId !== o.authorId) what.push('作者'); if (stable(c.layout) !== stable(o.layout)) what.push('排版');
      if ((c.note || '') !== (o.note || '') || (c.source || '') !== (o.source || '') || stable(c.tags || []) !== stable(o.tags || []) || !!c.fav !== !!o.fav || (c.collectionId || null) !== (o.collectionId || null)) what.push('其他資料');
      if (what.length) rows.push({ kind: 'changed', o, c, what });
    }
    const added = DB.poems.filter(p => !p.deleted && !old.has(p.id));
    return { rows, added };
  }
  function diffHTML() {
    const { rows, added } = diffRows();
    const auName = (id, src) => { const a = (src.authors || []).find(x => x.id === id) || authorById(id); return a ? a.name : '佚名'; };
    const gone = rows.filter(r => r.kind === 'gone'), ch = rows.filter(r => r.kind === 'changed');
    const row = r => `<div class="hist-diff"><div style="min-width:0;flex:1"><div class="serif" style="font-weight:700">〈${esc(r.o.title)}〉<span class="muted" style="font-weight:400;font-size:13px"> ${esc(auName(r.o.authorId, HV.data))}</span></div><div class="muted" style="font-size:13px">${r.kind === 'gone' ? '那時候還在，現在已經刪除' : '那時候的' + r.what.join('、') + '和現在不同'}</div></div><button type="button" class="btn sq" data-act="hist-one" data-id="${esc(r.o.id)}">${r.kind === 'gone' ? '找回這首' : '改回那時候'}</button></div>`;
    return `<div class="card panel" id="hist">
      <p class="label">${HV.date ? fmtDate(HV.date) + ' 的版本' : '這個版本'}</p>
      <div class="sync-stats"><div><b>${(HV.data.poems || []).filter(p => !p.deleted).length}</b><span>那時候的詩</span></div><div><b>${ch.length}</b><span>之後改過</span></div><div><b>${gone.length}</b><span>之後刪掉</span></div></div>
      ${!rows.length && !added.length ? '<p style="margin:0">這個版本和現在一模一樣。</p>' : ''}
      ${gone.length ? `<p class="label" style="margin-top:8px">之後刪掉的詩</p>${gone.map(row).join('')}` : ''}
      ${ch.length ? `<p class="label" style="margin-top:8px">之後改過的詩</p>${ch.map(row).join('')}` : ''}
      ${added.length ? `<p class="note" style="margin:8px 0 0">另外有 ${added.length} 首是這個版本之後才新增的${added.length <= 5 ? `：${added.map(p => `〈${esc(p.title)}〉`).join('')}` : ''}。</p>` : ''}
      ${rows.length || added.length ? `<button type="button" class="btn ghost sq danger" data-act="hist-all" style="align-self:flex-start;margin-top:8px">整份回到這個版本</button><p class="note" style="margin:0">整份回到這個版本時，之後新增的詩會移到回收桶（30 天內都能還原），還原前也會先備份一份。</p>` : ''}
    </div>`;
  }
  function ensureRefs(p, src) {
    if (p.authorId && !authorById(p.authorId)) { const a = (src.authors || []).find(x => x.id === p.authorId); if (a) DB.authors.push(clone(a)); else p.authorId = null; }
    if (p.collectionId && !colById(p.collectionId)) { const c = (src.collections || []).find(x => x.id === p.collectionId); if (c) DB.collections.push(clone(c)); else p.collectionId = null; }
  }
  function restoreOne(id) {
    const o = (HV.data.poems || []).find(p => p.id === id); if (!o) return;
    const p = clone(o); delete p.deleted; p.updated = Date.now();
    p.layout = Object.assign(defLayout(p.type), p.layout || {});
    ensureRefs(p, HV.data);
    const i = DB.poems.findIndex(x => x.id === id);
    if (i >= 0) DB.poems[i] = p; else DB.poems.push(p);
    save(); toast(`已找回〈${p.title}〉`);
    const b = $('#hist'); if (b) b.outerHTML = diffHTML();
  }
  async function restoreAll() {
    const n = (HV.data.poems || []).filter(p => !p.deleted).length;
    if (!confirm(`整份回到 ${HV.date ? fmtDate(HV.date) : '這個版本'}（${n} 首詩）？之後新增的詩會移到回收桶。`)) return;
    if (serverMode) { try { await fetch('api/backup?tag=restore', { method: 'POST' }); } catch (e) {} }
    else { try { localStorage.setItem('shiye-before-restore', JSON.stringify(DB)); } catch (e) {} }
    const now = Date.now(), v = clone(HV.data);
    const vids = new Set((v.poems || []).map(p => p.id));
    const later = DB.poems.filter(p => !vids.has(p.id)).map(p => Object.assign(p, p.deleted ? {} : { deleted: now, updated: now }));
    const cur = new Map(DB.poems.map(p => [p.id, p]));
    const poems = (v.poems || []).map(p => { const c = cur.get(p.id); if (!c || stable(c) !== stable(p) || !!c.deleted !== !!p.deleted) p.updated = now; p.layout = Object.assign(defLayout(p.type), p.layout || {}); return p; });
    DB.poems = [...poems, ...later];
    const vAu = new Set((v.authors || []).map(a => a.id)), vCol = new Set((v.collections || []).map(c => c.id));
    DB.authors = [...(v.authors || []), ...DB.authors.filter(a => !vAu.has(a.id) && later.some(p => p.authorId === a.id))];
    DB.collections = [...(v.collections || []), ...DB.collections.filter(c => !vCol.has(c.id))];
    save(true); ShiSync.afterSave();
    toast('已經回到這個版本'); go('#/');
  }

  // ---------- 事件 ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    switch (a) {
      case 'rec-mode': { const st = ls.get(); st.mode = b.dataset.v; ls.set(st); refreshRec(); break; }
      case 'rec-next': { const st = ls.get(), m = recMode(); if (!st.skip || st.skip.day !== todayKey()) st.skip = { day: todayKey() }; st.skip[m] = (st.skip[m] || 0) + 1; ls.set(st); refreshRec(); break; }
      case 'rec-hide': { const r = pick(recMode()); if (!r) break; const st = ls.get(); st.hidden = [...(st.hidden || []), recKey(r)]; ls.set(st); refreshRec(); toast('之後不會再推薦這首'); break; }
      case 'rec-search': { const r = pick(recMode()); if (r) setPending(r); break; }
      case 'rec-save': {
        const r = pick(recMode()); if (!r) break;
        if (r.kind === 'classic') { saveClassic(r); break; }
        if (r.kind === 'world') { saveWorld(r); break; }
        setPending(r);
        PENDING = { title: r.t, authorName: r.a, dynasty: r.kind === 'wmeta' ? r.c : '', text: '', type: 'modern', source: r.src || '', note: r.kind === 'wmeta' ? `原題：${r.ot}\n${r.oa}（${r.c}）` : '', tags: [], fromRec: { title: r.t, author: r.a, src: r.src || '' } };
        go('#/new'); break;
      }
      case 'x-paste': smartPaste(); break;
      case 'x-fetch': { const u = $('#ed-url'); fetchURL(u ? u.value.trim() : ''); break; }
      case 'x-recapply': if (ED && ED.recAsk) { const r = ED.recAsk; ED.title = r.title; ED.authorName = ED.authorName || r.author; ED.source = ED.source || r.src || ''; ED.recAsk = null; clearRec(); rerenderEditor(); } break;
      case 'hist-one': if (HV) restoreOne(b.dataset.id); break;
      case 'hist-all': if (HV) restoreAll(); break;
    }
  });
  // 在空白的內文框直接貼上：自動整理
  document.addEventListener('paste', e => {
    const t = e.target; if (!t || t.id !== 'ed-text' || !ED || t.value.trim()) return;
    const s = (e.clipboardData || window.clipboardData).getData('text'); if (!s || s.split('\n').length < 2) return;
    e.preventDefault();
    applyDraft(parseShared(s, { rec: ED.fromRec || null }), '已貼上並整理，標題、作者與分段請再確認');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'ed-url') { e.preventDefault(); fetchURL(e.target.value.trim()); } });

  window.ShiX = { recCardHTML, pendingRec, clearRec, searchURL, phoneOCR, historyView, historyLoad, fetchURL, htmlToText, pick };
})();
