'use strict';
/* 詩頁 v0.11：「有感」──自己的創作。作品、寫作模式、靈感筆記、修改紀錄、整理成冊、匯入草稿。
   作品就是 DB.poems 裡 mine: true 的詩（status: 'draft' | 'done'，wdate 寫作日期，versions 修改紀錄）；
   靈感筆記在 DB.notes；筆名是 DB.authors 裡 mine: true 的那位作者。 */
(function () {
  const dev = () => (serverMode ? '電腦' : /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : '手機');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const ymd = t => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fmtW = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${y}/${+m}/${+d}`; };
  const hm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const when = t => { const d = new Date(t), n = new Date(); return ymd(t) === ymd(n) ? '今天 ' + hm(t) : `${d.getMonth() + 1}/${d.getDate()} ${hm(t)}`; };
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  // ---------- 資料 ----------
  const pen = () => DB.authors.find(a => a.mine) || null;
  function ensurePen() {
    let a = pen(); if (a) return a;
    a = { id: uid(), name: '我', dynasty: '', bio: '', mine: true }; DB.authors.push(a); return a;
  }
  const works = () => live().filter(p => p.mine);
  const notes = () => (DB.notes || []).filter(n => !n.deleted);
  const lineCount = p => String(p.text || '').split('\n').filter(l => l.trim()).length;
  const isDraft = p => p.mine && p.status !== 'done';
  // 修改紀錄：十分鐘內連續的修改併成同一版，避免自動存檔產生太多版本
  function pushVersion(p, force) {
    const vs = p.versions || (p.versions = []);
    const last = vs[vs.length - 1];
    if (last && last.text === p.text && last.title === p.title) return;
    const v = { at: Date.now(), title: p.title, text: p.text, dev: dev() };
    if (last && !force && Date.now() - last.at < 10 * 60e3 && !last.keep) Object.assign(last, v);
    else vs.push(v);
    if (vs.length > 40) vs.splice(1, vs.length - 40);    // 留下第一版
  }
  function newWork(d) {
    const a = ensurePen();
    const p = newPoem({ title: d.title || '無題', authorId: a.id, text: d.text || '', type: d.type || ShiImport.guessType(d.text || '', ''), source: '', tags: [], created: d.created }, null);
    Object.assign(p, { mine: true, status: d.status || 'draft', wdate: d.wdate || today(), versions: [] });
    if (d.fromNote) p.fromNote = d.fromNote;
    pushVersion(p, true); if (p.versions[0]) { p.versions[0].keep = true; if (d.vnote) p.versions[0].note = d.vnote; }
    DB.poems.push(p);
    return p;
  }

  // ---------- 有感首頁 ----------
  function workCard(p) {
    const ex = String(p.text || '').split('\n').filter(l => l.trim()).slice(0, 3).join('\n');
    const n = notes().length ? (DB.notes || []).find(x => x.id === p.fromNote) : null;
    const vcount = (p.versions || []).length;
    return `<a class="yg-work" href="${isDraft(p) ? '#/write/' + p.id : '#/read/' + p.id}">
      <div class="meta"><span class="${isDraft(p) ? 'tagd' : 'tagf'}">${isDraft(p) ? '草稿' : '完成'}</span><span>${fmtW(p.wdate)}${vcount > 1 ? ` · 第 ${vcount} 版` : ''}</span></div>
      <h3>${esc(p.title || '無題')}</h3>
      <div class="ex">${esc(ex) || '<span class="muted">（還沒有內容）</span>'}</div>
      <div class="meta"><span>${lineCount(p)} 行${p.fav ? ' · ★' : ''}</span><span>${n ? `從靈感「${esc(n.text.slice(0, 10))}${n.text.length > 10 ? '…' : ''}」發展` : p.updated ? '改於 ' + when(p.updated) : ''}</span></div>
    </a>`;
  }
  function noteCard(n) {
    return `<button type="button" class="yg-note" data-act="yg-note-open" data-id="${n.id}">
      ${n.img ? `<img data-img="${esc(n.img)}" alt="">` : ''}${n.text ? `<span class="t">${esc(n.text)}</span>` : ''}
      <small>${when(n.at)} · ${esc(n.dev || '')}${n.usedBy && poemById(n.usedBy) ? ' · 已發展成詩' : ''}</small></button>`;
  }
  function ygView(tab) {
    tab = ['draft', 'done', 'notes'].includes(tab) ? tab : 'all';
    const a = pen(), ws = works().sort((x, y) => (y.wdate || '').localeCompare(x.wdate || '') || (y.updated || 0) - (x.updated || 0));
    const nd = ws.filter(isDraft).length, nf = ws.length - nd, ns = notes();
    const years = ws.map(p => (p.wdate || '').slice(0, 4)).filter(Boolean).sort();
    const list = tab === 'draft' ? ws.filter(isDraft) : tab === 'done' ? ws.filter(p => !isDraft(p)) : ws;
    const chip = (k, n) => `<a class="chip${tab === k ? ' on' : ''}" href="#/yg${k === 'all' ? '' : '?tab=' + k}">${n}</a>`;
    return topbar(navBtns('yg')) + `<main class="page yg" style="gap:24px">
      <section class="yg-hero">
        <div>
          <h1>有感</h1>
          <div class="sub">筆名　<button type="button" class="yg-pen" data-act="yg-pen">${esc(a ? a.name : '還沒設定')}　✎</button>　·　寫下的，都是自己的</div>
          <div class="yg-actions">
            <a class="yg-btn main" href="#/write/new">＋ 寫一首</a>
            <button type="button" class="yg-btn" data-act="yg-note-new">記下一個念頭</button>
            <label class="yg-btn" for="f-ygimp">匯入草稿</label>
            <input id="f-ygimp" class="sr" type="file" multiple accept=".txt,.md,.markdown,.docx,.zip,application/zip,text/plain" data-file="ygimp">
            <label class="yg-btn d-only" for="f-ygdir">匯入整個資料夾</label>
            <input id="f-ygdir" class="sr" type="file" webkitdirectory directory multiple data-file="ygdir">
            <button type="button" class="yg-btn" data-act="yg-book">整理成冊</button>
          </div>
        </div>
        <div class="yg-stat"><div><b>${nf}</b><span>完成</span></div><div><b>${nd}</b><span>草稿</span></div><div><b>${ns.length}</b><span>靈感</span></div>${years.length ? `<div><b>${years[0]}</b><span>開始寫的那年</span></div>` : ''}</div>
      </section>
      <div class="chips yg-tabs">${chip('all', `全部 ${ws.length}`)}${chip('draft', `草稿 ${nd}`)}${chip('done', `完成 ${nf}`)}${chip('notes', `靈感 ${ns.length}`)}</div>
      ${tab === 'all' || tab === 'notes' ? `<section class="sec-block">
        <div class="row" style="justify-content:space-between"><h2 class="sec">靈感筆記</h2><span class="muted">還沒成詩的句子、念頭、照片</span></div>
        ${ns.length ? `<div class="yg-notes${tab === 'notes' ? ' wrap' : ''}">${ns.sort((x, y) => y.at - x.at).map(noteCard).join('')}</div>` : '<div class="empty">想到一句話、看到一個畫面，就按「記下一個念頭」。</div>'}
      </section>` : ''}
      ${tab !== 'notes' ? `<section class="sec-block">
        <div class="row" style="justify-content:space-between"><h2 class="sec">我的作品</h2>
          <button type="button" class="toggle mini" data-act="yg-today" aria-pressed="${LS.get('shiye-yg-today', true)}"><span><span class="t1">完成的作品出現在今日一詩</span></span><span class="switch" aria-hidden="true"></span></button></div>
        ${list.length ? `<div class="yg-works">${list.map(workCard).join('')}</div>` : `<div class="empty">${tab === 'draft' ? '沒有草稿' : tab === 'done' ? '還沒有完成的作品' : '按「寫一首」開始，或把以前的草稿匯入進來。'}</div>`}
      </section>` : ''}
    </main>`;
  }
  // 電腦版上方的導覽按鈕
  function navBtns(cur) {
    return `<div class="row d-only topnav">${[['#/', '首頁', 'home'], ['#/yg', '有感', 'yg'], ['#/favs', '書房', 'favs']].map(([h, n, k]) => `<a class="btn${cur === k ? ' dark' : ''}" href="${h}">${n}</a>`).join('')}</div>`;
  }

  // ---------- 寫作模式 ----------
  let W = null;   // { id }
  function writeView(id) {
    const p = id && id !== 'new' ? poemById(id) : null;
    W = { id: p ? p.id : null, saved: p ? p.updated : 0, fromNote: W && W.pendingNote || null };
    const n = p && p.fromNote ? (DB.notes || []).find(x => x.id === p.fromNote) : W.fromNote ? (DB.notes || []).find(x => x.id === W.fromNote) : null;
    const text = p ? p.text : n ? n.text : '';
    return `<div class="write-wrap">
      <div class="write-top">
        <a href="#/yg" class="muted">← 有感</a>
        <span class="muted" id="w-state">${p ? `${isDraft(p) ? '草稿' : '完成'} · 已儲存 ${when(p.updated)}` : '新的草稿 · 開始寫就會自動儲存'}</span>
        <span class="row" style="gap:6px">${p ? `<a class="btn ghost sq" href="#/ver/${p.id}">修改紀錄</a><a class="btn ghost sq" href="#/read/${p.id}">閱讀</a>` : ''}<button type="button" class="btn ${p && !isDraft(p) ? 'ghost' : 'red'} sq" data-act="w-done">${p && !isDraft(p) ? '改回草稿' : '完成'}</button></span>
      </div>
      <div class="write-paper">
        <input id="w-title" class="w-title" data-in="w-title" placeholder="標題" value="${esc(p ? (p.title === '無題' && !p.text ? '' : p.title) : '')}" autocomplete="off">
        <textarea id="w-text" class="w-text" data-in="w-text" placeholder="寫下來。空一行代表分節，行首的空格會保留。" spellcheck="false">${esc(text)}</textarea>
      </div>
      <div class="w-tools">
        <button type="button" data-act="w-ins" data-v="　">全形空格</button><button type="button" data-act="w-indent">縮排 →</button><button type="button" data-act="w-outdent">← 取消縮排</button><button type="button" data-act="w-ins" data-v="\n\n">分節</button>
        <span style="flex:1"></span><span id="w-stats" class="muted"></span>
      </div>
      <div class="write-foot muted">${n ? `靈感：「${esc(n.text.slice(0, 24))}」　·　` : ''}寫作日期 <input type="date" id="w-date" data-in="w-date" value="${esc(p ? p.wdate || today() : today())}">　·　<span class="d-only">Esc 回到有感</span></div>
    </div>`;
  }
  function wStats() {
    const t = $('#w-text'), s = $('#w-stats'); if (!t || !s) return;
    const sts = stanzas(t.value); s.textContent = `${sts.length} 節 · ${sts.reduce((a, x) => a + x.lines.length, 0)} 行 · ${t.value.replace(/\s/g, '').length} 字`;
    t.style.height = 'auto'; t.style.height = Math.max(360, t.scrollHeight + 8) + 'px';
  }
  let wT = null;
  function wSave(force) {
    clearTimeout(wT); wT = null;
    const t = $('#w-text'), ti = $('#w-title'), dt = $('#w-date'); if (!t || !W) return;
    const title = ti.value.trim(), text = t.value.replace(/\s+$/, '');
    let p = W.id && poemById(W.id);
    if (!p) {
      if (!title && !text.trim()) return;
      p = newWork({ title: title || '無題', text, wdate: dt && dt.value, fromNote: W.fromNote });
      if (W.fromNote) { const n = DB.notes.find(x => x.id === W.fromNote); if (n) { n.usedBy = p.id; n.updated = Date.now(); } }
      W.id = p.id; history.replaceState(null, '', '#/write/' + p.id);
    } else {
      if (p.title === (title || '無題') && p.text === text && (!dt || p.wdate === dt.value) && !force) return;
      p.title = title || '無題'; p.text = text; if (dt && dt.value) p.wdate = dt.value;
      if (p.type !== 'classic') p.type = ShiImport.guessType(text, '') === 'shape' ? p.type : p.type;
      touch(p); pushVersion(p, force);
    }
    save();
    const st = $('#w-state'); if (st) st.textContent = `${isDraft(p) ? '草稿' : '完成'} · 已自動儲存 ${hm(Date.now())}`;
  }
  const wSoon = () => { clearTimeout(wT); wT = setTimeout(() => wSave(false), 1200); const st = $('#w-state'); if (st) st.textContent = '編輯中…'; };
  function wEdit(fn) {
    const ta = $('#w-text'); if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd, r = fn(ta.value, s, e);
    ta.value = r.v; ta.focus(); ta.setSelectionRange(r.s, r.e); wStats(); wSoon();
  }

  // ---------- 修改紀錄 ----------
  function lineDiff(a, b) {
    const A = a.split('\n'), B = b.split('\n'), n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { out.push(['=', A[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', A[i++]]); else out.push(['+', B[j++]]); }
    while (i < n) out.push(['-', A[i++]]); while (j < m) out.push(['+', B[j++]]);
    return out;
  }
  function verView(id, k) {
    const p = poemById(id); if (!p) return '';
    const vs = (p.versions || []).map((v, i) => Object.assign({ no: i + 1 }, v)).reverse();
    const sel = vs.find(v => String(v.no) === String(k)) || vs[0];
    const prev = sel && (p.versions || [])[sel.no - 2];
    const d = sel ? lineDiff(prev ? prev.text : '', sel.text) : [];
    const what = (v, i) => { const pv = (p.versions || [])[v.no - 2]; if (!pv) return v.note || '第一版'; const bits = []; if (pv.title !== v.title) bits.push(`標題「${pv.title}」→「${v.title}」`); const dd = lineDiff(pv.text, v.text); const add = dd.filter(x => x[0] === '+' && x[1].trim()).length, del = dd.filter(x => x[0] === '-' && x[1].trim()).length; if (add || del) bits.push(add && del ? `改了 ${Math.max(add, del)} 行` : add ? `加了 ${add} 行` : `刪了 ${del} 行`); return v.note || bits.join('，') || '（沒有改動）'; };
    return topbar(`<div class="row"><a class="btn" href="#/write/${p.id}">回到寫作</a></div>`) + `<main class="ver-wrap">
      <aside class="ver-side">
        <p class="label">〈${esc(p.title)}〉修改紀錄</p>
        ${vs.map(v => `<a class="ver${v === sel ? ' on' : ''}" href="#/ver/${p.id}?v=${v.no}"><b>第 ${v.no} 版</b><span class="muted">${when(v.at)} · ${esc(v.dev || '')}</span><span>${esc(what(v))}</span></a>`).join('') || '<p class="muted">還沒有紀錄。</p>'}
      </aside>
      <section class="ver-main">
        ${sel ? `<div class="row" style="justify-content:space-between;margin-bottom:16px"><span class="muted">${prev ? `第 ${sel.no - 1} 版 → 第 ${sel.no} 版：紅色是刪掉的，綠色是新加的` : '第一版'}</span>${sel.no !== (p.versions || []).length ? `<button type="button" class="btn sq" data-act="ver-restore" data-v="${sel.no}">恢復成這一版</button>` : '<span class="muted">目前的版本</span>'}</div>
        <h2 class="serif" style="margin:0 0 18px">${esc(sel.title)}</h2>
        <div class="ver-diff">${d.map(([t, l]) => t === '=' ? `<div>${esc(l) || '&nbsp;'}</div>` : `<div class="${t === '+' ? 'ins' : 'del'}">${esc(l) || '&nbsp;'}</div>`).join('')}</div>` : ''}
      </section>
    </main>`;
  }

  // ---------- 靈感筆記 ----------
  let NOTE = null;
  function noteModal(n) {
    NOTE = n ? { id: n.id, img: n.img || null } : { id: null, img: null };
    modal({ title: n ? '靈感' : '記下一個念頭', ok: '存起來', body: `
      <textarea id="nt-text" class="ta yg-note-ta" rows="4" placeholder="一句話、一個畫面、一個念頭">${esc(n ? n.text : '')}</textarea>
      <div id="nt-img">${NOTE.img ? `<img data-img="${esc(NOTE.img)}" alt="" class="nt-img">` : ''}</div>
      <div class="row" style="gap:8px"><label class="btn sq" for="f-note">${NOTE.img ? '換照片' : '加照片'}</label><input id="f-note" class="sr" type="file" accept="image/*" data-file="note">
        ${n ? `<button type="button" class="btn sq" data-act="yg-note-grow" data-id="${n.id}">發展成詩</button><button type="button" class="btn ghost sq danger" data-act="yg-note-del" data-id="${n.id}">刪除</button>` : ''}</div>
      ${n ? `<p class="note" style="margin:0">${when(n.at)} · ${esc(n.dev || '')}${n.usedBy && poemById(n.usedBy) ? `　·　已發展成〈${esc(poemById(n.usedBy).title)}〉` : ''}</p>` : '<p class="note" style="margin:0">之後在筆記上按「發展成詩」，就會帶著這句開一首新的草稿。</p>'}`,
      onOk: () => saveNote() });
    setTimeout(() => { const t = $('#nt-text'); if (t) t.focus(); }, 60);
  }
  function saveNote() {
    const t = ($('#nt-text') || {}).value || '';
    if (!t.trim() && !NOTE.img) { toast('什麼都還沒寫'); return false; }
    DB.notes = DB.notes || [];
    let n = NOTE.id && DB.notes.find(x => x.id === NOTE.id);
    const now = Date.now();
    if (n) Object.assign(n, { text: t.trim(), img: NOTE.img, updated: now });
    else { n = { id: uid(), text: t.trim(), img: NOTE.img, at: now, updated: now, dev: dev() }; DB.notes.push(n); }
    save(); if (route().view === 'yg') render(); toast('已記下');
  }
  async function noteImage(file) {
    try {
      const blob = file.size > 1.5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type) ? await shrinkImage(file, 2000, 'image/jpeg') : file;
      NOTE.img = await uploadImageBlob(blob, 'note.jpg');
      const box = $('#nt-img'); if (box) box.innerHTML = `<img data-img="${esc(NOTE.img)}" alt="" class="nt-img">`;
    } catch (e) { toast('照片儲存失敗'); }
  }

  // ---------- 整理成冊 ----------
  function bookModal() {
    const ws = works().filter(p => !isDraft(p)).sort((x, y) => (x.wdate || '').localeCompare(y.wdate || ''));
    const ds = works().filter(isDraft);
    if (!ws.length && !ds.length) { toast('還沒有作品'); return; }
    const a = pen();
    modal({ title: '整理成冊', ok: serverMode ? '導出 PDF' : '', wide: true, body: `
      <label class="field">書名<input id="bk-title" value="${esc((a ? a.name : '我') + '詩集')}"></label>
      <p class="label" style="margin:6px 0 0">收錄的作品（依寫作日期排列）</p>
      <div class="bk-list">${[...ws, ...ds].map(p => `<label class="check"><input type="checkbox" class="bk-c" value="${p.id}" ${isDraft(p) ? '' : 'checked'}> 〈${esc(p.title)}〉<span class="muted">　${fmtW(p.wdate)}${isDraft(p) ? '　草稿' : ''}</span></label>`).join('')}</div>
      ${serverMode ? '<p class="note" style="margin:0">會做成一本有封面、目錄和頁碼的 PDF，存在「下載」資料夾。</p>' : '<p class="note" style="margin:0">導出 PDF 要在電腦版詩頁做：勾好的作品同步到電腦後，在電腦的「有感」按「整理成冊」。</p>'}`,
      onOk: () => {
        const ids = [...document.querySelectorAll('.bk-c:checked')].map(x => x.value);
        if (!ids.length) { toast('至少勾一首'); return false; }
        const title = ($('#bk-title').value || '').trim() || '詩集';
        setTimeout(() => openExport({ ids, title }), 0);
      } });
  }

  // ---------- 匯入草稿 ----------
  const SEPX = /^[ \t　]*(?:-{3,}|\*{3,}|＊{3,}|＝{3,}|={3,}|※{1,3})[ \t　]*$/;
  const SECNO = /^[ \t　]*(?:\d{1,2}|[一二三四五六七八九十]{1,3}|[IVX]{1,4}|[Ⅰ-Ⅻ])[.、．:：)）]?[ \t　]*$/;
  function nameInfo(base) {
    base = base.replace(/\.[^.]+$/, '').trim();
    let m, date = '';
    const fix = (y, mo, d) => { y = +y; if (y < 200) y += 1911; mo = +mo; d = +d; return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && y > 1900 && y < 2100 ? `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` : ''; };
    if ((m = base.match(/^(\d{4})[.\-_/年\s](\d{1,2})[.\-_/月\s](\d{1,2})日?/)) || (m = base.match(/^(\d{4})(\d{2})(\d{2})(?!\d)/)) || (m = base.match(/^(\d{2,3})[.\-_/年](\d{1,2})[.\-_/月](\d{1,2})日?/))) {
      date = fix(m[1], m[2], m[3]); if (date) base = base.slice(m[0].length);
    }
    const title = base.replace(/^[\s_\-–—.、，,:：()（）\[\]【】]+|[\s_\-–—.、，,:：()（）]+$/g, '').trim();
    return { title: /^(新文字文件|新增文字文件|未命名|無標題|untitled|new text document|document)\s*\d*$/i.test(title) ? '' : title, date };
  }
  function cleanText(raw) {
    let lines = String(raw || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/[ \t　]+$/, ''));
    lines = ShiImport.trimBlank(lines);
    const c = ShiImport.collapseSpacing(lines); lines = c.lines;
    lines = ShiImport.capBlankRuns(lines, 2);
    lines = ShiImport.dedent(lines);
    return { text: lines.join('\n').replace(/\n{3,}/g, '\n\n'), collapsed: c.collapsed };
  }
  function draftRows(raw, rel, mtime) {
    const name = rel.split('/').pop();
    const info = nameInfo(name);
    const wdate = info.date || (mtime ? ymd(mtime) : today());
    const { text, collapsed } = cleanText(raw);
    // 分隔線：直接拆開
    const parts = text.split('\n').reduce((acc, l) => { if (SEPX.test(l)) acc.push([]); else acc[acc.length - 1].push(l); return acc; }, [[]]).map(ls => ls.join('\n').replace(/^\n+|\n+$/g, '')).filter(t => t.trim());
    return parts.map((t, i) => {
      let title = info.title;
      const ls = t.split('\n');
      // 檔名沒有標題、第一行看起來像標題（短、下一行空白）：用第一行
      if (parts.length > 1 && (!title || i > 0)) { if (ls[0].trim().length <= 16 && ls[1] !== undefined && !ls[1].trim() && !SECNO.test(ls[0])) { title = ls[0].trim(); t = ls.slice(2).join('\n'); } else title = title ? `${title}（${i + 1}）` : ''; }
      // 內文第一行和標題一樣：拿掉
      if (title && ShiImport.normKey(ls[0]) === ShiImport.normKey(title)) t = ls.slice(1).join('\n').replace(/^\n+/, '');
      const sec = t.split('\n').filter((l, j, arr) => SECNO.test(l) && (j === 0 || !arr[j - 1].trim())).length;
      const nonblank = t.split('\n').filter(l => l.trim()).length;
      return { id: uid(), rel, name, title, wdate, text: t, kind: nonblank <= 2 ? 'note' : 'work', status: 'draft', sections: sec >= 2 ? sec : 0, collapsed, multi: parts.length > 1, checked: true, dup: '' };
    });
  }
  let YI = null;
  async function startDraftImport(files) {
    toast('正在讀取檔案…', 60000);
    let list = [];
    for (const f of files) {
      if (/\.zip$/i.test(f.name) || f.type === 'application/zip') { try { (await unzipEntries(f)).forEach(x => list.push({ file: x.file, rel: x.path })); } catch (e) { toast(e.message, 6000); return; } }
      else list.push({ file: f, rel: f.webkitRelativePath || f.name });
    }
    list = list.filter(x => !/(^|\/)__MACOSX\//.test(x.rel) && !SKIP_NAME.test(x.rel.split('/').pop()));
    const rows = [], skipped = [];
    for (const { file, rel } of list) {
      if (!TEXT_EXT.test(file.name)) { skipped.push(rel); continue; }
      try { const { text } = await readFile(file); draftRows(text, rel, file.lastModified).forEach(r => rows.push(r)); } catch (e) { skipped.push(rel); }
    }
    // 重複：和「有感」裡的作品、靈感比對，也和這次的其他檔案比對
    const have = [...works().map(p => ['作品', p.title, ShiImport.normKey(p.text)]), ...notes().map(n => ['靈感', n.text.slice(0, 12), ShiImport.normKey(n.text)])];
    const seen = [];
    rows.forEach(r => {
      const k = ShiImport.normKey(r.text); if (!k) { r.checked = false; r.dup = '沒有內容'; return; }
      const h = have.find(x => x[2] === k || (k.length > 12 && ShiImport.similarity(k, x[2]) >= .9));
      if (h) { r.checked = false; r.dup = `「有感」裡已經有${h[0]}〈${h[1]}〉`; return; }
      const s = seen.find(x => x.k === k); if (s) { r.checked = false; r.dup = `和「${s.rel}」內容相同`; return; }
      seen.push({ k, rel: r.rel });
    });
    rows.sort((a, b) => a.wdate.localeCompare(b.wdate));
    YI = { rows, skipped };
    $('#toast').classList.remove('show');
    if (!rows.length) { toast('沒有找到可以匯入的文字檔', 5000); return; }
    go('#/ygimp');
  }
  function splitRow(r) {
    const ls = r.text.split('\n'), out = []; let cur = null;
    ls.forEach((l, j) => { if (SECNO.test(l) && (j === 0 || !ls[j - 1].trim())) { cur = { no: l.trim().replace(/[.、．:：)）]$/, ''), lines: [] }; out.push(cur); } else if (cur) cur.lines.push(l); else { cur = { no: '', lines: [l] }; out.push(cur); } });
    return out.map(x => Object.assign({}, r, { id: uid(), title: `${r.title || '無題'}（${x.no || '序'}）`, text: x.lines.join('\n').replace(/^\n+|\n+$/g, ''), sections: 0, kind: x.lines.filter(l => l.trim()).length <= 2 ? 'note' : 'work' })).filter(x => x.text.trim());
  }
  function ygImpView() {
    if (!YI) return '';
    const rows = YI.rows, nW = rows.filter(r => r.checked && r.kind === 'work').length, nN = rows.filter(r => r.checked && r.kind === 'note').length;
    const row = r => {
      const first = (r.text.split('\n').find(l => l.trim()) || '').trim();
      const pv = r.text.split('\n').slice(0, 16).join('\n') + (r.text.split('\n').length > 16 ? '\n……' : '');
      return `<details class="irow yi${r.checked ? ' on' : ''}" data-id="${r.id}">
        <summary>
          <label class="icheck" onclick="event.stopPropagation()"><input type="checkbox" data-in="yi-check" data-id="${r.id}" ${r.checked ? 'checked' : ''}></label>
          <select data-in="yi-kind" data-id="${r.id}" onclick="event.stopPropagation()"><option value="work"${r.kind === 'work' ? ' selected' : ''}>作品</option><option value="note"${r.kind === 'note' ? ' selected' : ''}>靈感</option></select>
          <input class="yi-title" data-in="yi-title" data-id="${r.id}" value="${esc(r.title)}" placeholder="無題（${esc(first.slice(0, 14))}）" onclick="event.stopPropagation()" ${r.kind === 'note' ? 'disabled' : ''}>
          <input type="date" data-in="yi-date" data-id="${r.id}" value="${esc(r.wdate)}" onclick="event.stopPropagation()">
          ${r.kind === 'work' ? `<button type="button" class="chip${r.status === 'done' ? ' on' : ''}" data-act="yi-status" data-id="${r.id}">${r.status === 'done' ? '完成' : '草稿'}</button>` : '<span></span>'}
          <span class="yi-flags">${r.dup ? `<span class="ibadge b-dup">重複</span>` : ''}${r.sections ? `<span class="ibadge b-illus">${r.sections} 段</span>` : ''}${r.multi ? '<span class="ibadge b-maybe">一檔多首</span>' : ''}</span>
          <span class="yi-more">預覽 ▾</span>
        </summary>
        <div class="idetail">
          <div class="muted">檔案：${esc(r.rel)}${r.collapsed ? '　·　每行之間的空行已合併' : ''}</div>
          ${r.dup ? `<div class="imsg">${esc(r.dup)}</div>` : ''}
          <div class="row" style="gap:8px">${!r.title && first ? `<button type="button" class="btn sq" data-act="yi-first" data-id="${r.id}">用第一行「${esc(first.slice(0, 14))}」當標題</button>` : ''}${r.sections ? `<button type="button" class="btn sq" data-act="yi-split" data-id="${r.id}">其實是 ${r.sections} 首，拆開</button>` : ''}</div>
          <pre class="ipre">${esc(pv)}</pre>
        </div>
      </details>`;
    };
    return topbar(`<a class="btn" href="#/yg" data-act="yi-cancel">取消</a>`) + `<main class="page" style="gap:20px">
      <div><h1 class="sec" style="font-size:30px">匯入草稿</h1>
      <p class="muted" style="margin:8px 0 0">${rows.length} 筆，依寫作日期排列。標題用檔名、檔名裡的日期當寫作日期；一兩行的短稿放進靈感筆記。每一筆都可以改。</p></div>
      ${YI.skipped.length ? `<p class="note" style="margin:0">略過 ${YI.skipped.length} 個不是文字稿的檔案。</p>` : ''}
      <div class="row" style="justify-content:space-between">
        <div class="row"><button type="button" class="btn sq ghost" data-act="yi-all">全部勾選</button><button type="button" class="btn sq ghost" data-act="yi-none">全部取消</button><button type="button" class="btn sq ghost" data-act="yi-alldone">勾選的都標成完成</button></div>
        <button type="button" class="btn red" data-act="yi-go" ${nW + nN ? '' : 'disabled'}>匯入 ${nW} 首作品${nN ? `、${nN} 則靈感` : ''}</button>
      </div>
      <div class="ilist">${rows.map(row).join('')}</div>
      <p class="note">作者會用你的筆名「${esc(pen() ? pen().name : '我')}」。原始檔案不會被修改；匯入前會先備份。</p>
    </main>`;
  }
  async function runDraftImport() {
    const rows = YI.rows.filter(r => r.checked); if (!rows.length) return;
    if (serverMode) { try { await fetch('api/backup?tag=ygimport', { method: 'POST' }); } catch (e) {} }
    else { try { localStorage.setItem('shiye-data-before-import', JSON.stringify(DB)); } catch (e) {} }
    let nw = 0, nn = 0;
    rows.forEach((r, i) => {
      const t = Date.parse(r.wdate + 'T12:00:00') || Date.now();
      if (r.kind === 'note') { DB.notes = DB.notes || []; DB.notes.push({ id: uid(), text: r.text.trim(), img: null, at: t + i, updated: Date.now(), dev: '匯入' }); nn++; }
      else { newWork({ title: r.title || '無題', text: r.text, wdate: r.wdate, status: r.status, created: t + i, vnote: '從「' + r.name + '」匯入' }); nw++; }
    });
    save(true); YI = null; go('#/yg');
    toast(`已匯入 ${nw} 首作品${nn ? `、${nn} 則靈感` : ''}`, 5000);
  }

  // ---------- 事件 ----------
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = b.dataset.id, r = route();
    switch (b.dataset.act) {
      case 'yg-pen': {
        const a = pen();
        modal({ title: '筆名', body: `<label class="field">你的作品作者會用這個名字<input id="pen-in" value="${esc(a ? a.name : '')}" placeholder="例如：拾光"></label><p class="note" style="margin:0">分享圖片、導出 PDF 也會用這個名字。之後改了，所有作品會一起換。</p>`, ok: '儲存',
          onOk: () => { const v = ($('#pen-in').value || '').trim(); if (!v) { toast('筆名不能空白'); return false; } const x = ensurePen(); x.name = v; save(); render(); toast('已設定筆名'); } });
        setTimeout(() => { const t = $('#pen-in'); if (t) t.focus(); }, 60); break;
      }
      case 'yg-note-new': noteModal(null); break;
      case 'yg-note-open': { const n = (DB.notes || []).find(x => x.id === id); if (n) noteModal(n); break; }
      case 'yg-note-del': { const n = (DB.notes || []).find(x => x.id === id); if (n) { n.deleted = Date.now(); n.updated = Date.now(); save(); closeModal(); render(); toast('已刪除靈感'); } break; }
      case 'yg-note-grow': { closeModal(); W = { pendingNote: id }; go('#/write/new'); break; }
      case 'yg-today': { const v = !LS.get('shiye-yg-today', true); LS.set('shiye-yg-today', v); b.setAttribute('aria-pressed', v); toast(v ? '完成的作品會出現在今日一詩' : '今日一詩不會挑你的作品'); break; }
      case 'yg-book': bookModal(); break;
      case 'w-done': {
        wSave(true); const p = W && W.id && poemById(W.id); if (!p) { toast('先寫點東西'); break; }
        p.status = isDraft(p) ? 'done' : 'draft'; touch(p); pushVersion(p, true); const lv = p.versions[p.versions.length - 1]; if (lv) lv.keep = true; save();
        if (p.status === 'done') { toast('完成了！'); go('#/read/' + p.id); } else { toast('改回草稿'); render(); }
        break;
      }
      case 'w-ins': { const v = b.dataset.v; wEdit((s, a, z) => ({ v: s.slice(0, a) + v + s.slice(z), s: a + v.length, e: a + v.length })); break; }
      case 'w-indent': case 'w-outdent': { const dir = b.dataset.act === 'w-indent' ? 1 : -1; wEdit((v, s, e) => { const a = v.lastIndexOf('\n', s - 1) + 1; let z = v.indexOf('\n', Math.max(e - (e > s && v[e - 1] === '\n' ? 1 : 0), s)); if (z < 0) z = v.length; const blk = v.slice(a, z).split('\n').map(l => dir > 0 ? (l.trim() ? '　　' + l : l) : l.replace(/^(　{1,2}| {1,4}|\t)/, '')).join('\n'); return { v: v.slice(0, a) + blk + v.slice(z), s: a, e: a + blk.length }; }); break; }
      case 'ver-restore': {
        const p = poemById(r.id), v = p && (p.versions || [])[+b.dataset.v - 1]; if (!v) break;
        if (!confirm(`把〈${p.title}〉恢復成第 ${b.dataset.v} 版？現在的版本也會留在紀錄裡。`)) break;
        p.title = v.title; p.text = v.text; touch(p); pushVersion(p, true); const lv = p.versions[p.versions.length - 1]; lv.note = `恢復成第 ${b.dataset.v} 版`; lv.keep = true; save(); go('#/ver/' + p.id); toast('已恢復'); break;
      }
      case 'yi-cancel': YI = null; break;
      case 'yi-status': { const x = YI && YI.rows.find(y => y.id === id); if (x) { x.status = x.status === 'done' ? 'draft' : 'done'; render(); } break; }
      case 'yi-first': { const x = YI && YI.rows.find(y => y.id === id); if (x) { const ls = x.text.split('\n'); const k = ls.findIndex(l => l.trim()); x.title = ls[k].trim(); x.text = ls.slice(k + 1).join('\n').replace(/^\n+/, ''); render(); } break; }
      case 'yi-split': { const i = YI ? YI.rows.findIndex(y => y.id === id) : -1; if (i >= 0) { YI.rows.splice(i, 1, ...splitRow(YI.rows[i])); render(); } break; }
      case 'yi-all': YI.rows.forEach(x => { x.checked = true; }); render(); break;
      case 'yi-none': YI.rows.forEach(x => { x.checked = false; }); render(); break;
      case 'yi-alldone': YI.rows.forEach(x => { if (x.checked && x.kind === 'work') x.status = 'done'; }); render(); break;
      case 'yi-go': b.disabled = true; b.textContent = '匯入中…'; runDraftImport(); break;
    }
  });
  document.addEventListener('input', e => {
    const t = e.target, k = t.dataset && t.dataset.in; if (!k) return;
    if (k === 'w-text' || k === 'w-title' || k === 'w-date') { if (k === 'w-text') wStats(); wSoon(); return; }
    const x = YI && YI.rows.find(y => y.id === t.dataset.id); if (!x) return;
    if (k === 'yi-check') { x.checked = t.checked; t.closest('.irow').classList.toggle('on', t.checked); const g = $('[data-act=yi-go]'); if (g) { const nW = YI.rows.filter(r => r.checked && r.kind === 'work').length, nN = YI.rows.filter(r => r.checked && r.kind === 'note').length; g.textContent = `匯入 ${nW} 首作品${nN ? `、${nN} 則靈感` : ''}`; g.disabled = !(nW + nN); } }
    else if (k === 'yi-kind') { x.kind = t.value; render(); }
    else if (k === 'yi-title') x.title = t.value;
    else if (k === 'yi-date') x.wdate = t.value;
  });
  document.addEventListener('change', e => {
    const t = e.target, k = t.dataset && t.dataset.file; if (!['ygimp', 'ygdir', 'note'].includes(k) || !t.files || !t.files.length) return;
    const files = [...t.files]; t.value = '';
    if (k === 'ygimp' || k === 'ygdir') startDraftImport(files);
    else if (k === 'note') noteImage(files[0]);
  });
  document.addEventListener('keydown', e => {
    const r = route();
    if (r.view === 'write') {
      if (e.key === 'Escape' && !$('#modal')) { e.preventDefault(); wSave(true); go('#/yg'); }
      else if (e.key === 'Tab' && e.target.id === 'w-text') { e.preventDefault(); const b0 = { dataset: { v: '　' } }; wEdit((s, a, z) => ({ v: s.slice(0, a) + '　' + s.slice(z), s: a + 1, e: a + 1 })); }
    }
  });
  // 離開寫作畫面時一定存好
  window.addEventListener('hashchange', e => { if (W && /#\/write\//.test(e.oldURL || '')) { const t = $('#w-text'); if (t) wSave(true); } });
  window.addEventListener('pagehide', () => { if (route().view === 'write') wSave(true); });

  window.ShiY = { ygView, writeView, verView, ygImpView, wStats, wSave, pushVersion, isDraft, pen, navBtns, draftRows, nameInfo, todayOK: () => LS.get('shiye-yg-today', true) };
})();
