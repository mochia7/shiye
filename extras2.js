'use strict';
/* 詩頁 v0.6：聽詩（朗讀）、劃線與筆記、查萌典、今日一詩、背誦模式。
   使用 app.js 的全域函式（DB、save、render、go、toast、modal、esc、live、poemById、stanzas …）。 */
(function () {
  const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const curPoem = () => { const r = route(); return (r.view === 'read' || r.view === 'memo') ? poemById(r.id) : null; };
  const lineTexts = p => stanzas(p.text).flatMap(s => s.lines.map(l => l.text));
  const hasCJK = s => /[㐀-鿿]/.test(s || '');

  // ---------- 聽詩 ----------
  const synth = window.speechSynthesis;
  const TTS = { on: false, paused: false, pid: null };
  const RATES = [['慢', .7], ['適中', .85], ['一般', 1]];
  function voices() { try { return synth ? synth.getVoices() : []; } catch (e) { return []; } }
  function pickVoice(cjk) {
    const vs = voices(), pref = LS.get('shiye-tts', {});
    const want = cjk ? pref.zh : pref.en;
    if (want) { const v = vs.find(x => x.voiceURI === want); if (v) return v; }
    const by = re => vs.filter(v => re.test(v.lang.replace('_', '-')));
    if (cjk) return by(/^zh-TW/i).sort((a, b) => (/Natural|Online/.test(b.name) ? 1 : 0) - (/Natural|Online/.test(a.name) ? 1 : 0))[0] || by(/^zh-HK/i)[0] || by(/^(zh|cmn)/i)[0] || null;
    return by(/^en-(US|GB)/i)[0] || by(/^en/i)[0] || null;
  }
  function rate() { const r = LS.get('shiye-tts', {}).rate; return typeof r === 'number' ? r : .85; }
  function mark(li) {
    document.querySelectorAll('.ln.speaking').forEach(x => x.classList.remove('speaking'));
    if (li == null || li < 0) return;
    const el = document.querySelector(`#stage .ln[data-li="${li}"]`); if (!el) return;
    el.classList.add('speaking');
    try { el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } catch (e) {}
  }
  function barHTML() {
    const cjk = TTS.cjk !== false;
    const vs = voices().filter(v => cjk ? /^(zh|cmn)/i.test(v.lang) : /^en/i.test(v.lang));
    const cur = pickVoice(cjk);
    return `<div class="ttsbar" id="ttsbar" role="region" aria-label="朗讀">
      <button type="button" class="tts-b" data-act="tts-pause" aria-label="${TTS.paused ? '繼續' : '暫停'}">${TTS.paused ? '▶' : '❚❚'}</button>
      <button type="button" class="tts-b" data-act="tts-stop" aria-label="停止">■</button>
      <span class="tts-t">${TTS.paused ? '已暫停' : '朗讀中…'}</span>
      <select data-in="tts-rate" aria-label="速度">${RATES.map(([n, v]) => `<option value="${v}"${Math.abs(rate() - v) < .01 ? ' selected' : ''}>${n}</option>`).join('')}</select>
      ${vs.length > 1 ? `<select data-in="tts-voice" aria-label="聲音" class="tts-voice">${vs.map(v => `<option value="${esc(v.voiceURI)}"${cur && cur.voiceURI === v.voiceURI ? ' selected' : ''}>${esc(v.name.replace(/^Microsoft\s+/, '').replace(/\s*\(.*\)$/, '').replace(/ Online$/, ''))}</option>`).join('')}</select>` : ''}
    </div>`;
  }
  function showBar() { let b = $('#ttsbar'); const h = barHTML(); if (b) b.outerHTML = h; else document.body.insertAdjacentHTML('beforeend', h); document.body.classList.add('tts-on'); }
  function hideBar() { const b = $('#ttsbar'); if (b) b.remove(); document.body.classList.remove('tts-on'); }
  function stop() { TTS.on = false; TTS.paused = false; try { synth && synth.cancel(); } catch (e) {} mark(null); hideBar(); }
  function speakItems(items, cjk) {
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { toast('這個瀏覽器不支援朗讀'); return; }
    try { synth.cancel(); } catch (e) {}
    TTS.on = true; TTS.paused = false; TTS.cjk = cjk;
    const v = pickVoice(cjk);
    if (!v && cjk) toast('找不到中文語音：iPhone 到「設定 → 輔助使用 → 朗讀內容 → 聲音」下載中文（台灣）語音；Windows 到「設定 → 時間與語言 → 語音」新增中文語音', 8000);
    items.forEach((it, i) => {
      const u = new SpeechSynthesisUtterance(it.text);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = cjk ? 'zh-TW' : 'en-US';
      u.rate = rate();
      u.onstart = () => { if (TTS.on) mark(it.li); };
      if (i === items.length - 1) { u.onend = () => { if (TTS.on) stop(); }; u.onerror = () => { if (TTS.on) stop(); }; }
      synth.speak(u);
    });
    showBar();
  }
  function speakPoem(p) {
    const sts = stanzas(p.text), au = authorOf(p);
    const cjk = hasCJK(p.text) || !/[A-Za-z]/.test(p.text);
    const items = [{ text: `${p.title || '無題'}${au ? (cjk ? '，' : ', by ') + (au.dynasty && cjk ? au.dynasty + '，' : '') + au.name : ''}${cjk ? '。' : '.'}`, li: -1 }];
    let li = 0;
    sts.forEach(s => s.lines.forEach((l, i) => {
      let t = l.text.trim();
      // 一節的最後一行多停一下
      if (i === s.lines.length - 1 && t && !/[。！？.!?…」』]$/.test(t)) t += cjk ? '。' : '.';
      if (t) items.push({ text: t, li });
      li++;
    }));
    TTS.pid = p.id;
    speakItems(items, cjk);
  }
  if (synth && 'onvoiceschanged' in synth) synth.onvoiceschanged = () => { if (document.getElementById('ttsbar')) showBar(); };
  window.addEventListener('hashchange', () => { if (TTS.on) stop(); hideSelbar(); });

  // ---------- 劃線、筆記、查字典：選取文字後出現的工具列 ----------
  let SELR = null;
  function selInfo() {
    const sel = window.getSelection && window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0), art = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer.closest('#stage .art') : r.commonAncestorContainer.parentElement && r.commonAncestorContainer.parentElement.closest('#stage .art');
    const text = String(sel).trim(); if (!text) return null;
    if (!art) return null;
    return { r, art, text };
  }
  function offsetIn(ln, node, off) { const x = document.createRange(); x.setStart(ln, 0); try { x.setEnd(node, off); } catch (e) { return 0; } return x.toString().length; }
  function selSegs(p, info) {
    const texts = lineTexts(p), r = info.r;
    const lns = [...info.art.querySelectorAll('.ln[data-li]')].filter(l => r.intersectsNode(l));
    const segs = [];
    lns.forEach(ln => {
      const li = +ln.dataset.li, t = texts[li] || '';
      let s = ln.contains(r.startContainer) ? offsetIn(ln, r.startContainer, r.startOffset) : 0;
      let e = ln.contains(r.endContainer) ? offsetIn(ln, r.endContainer, r.endOffset) : t.length;
      s = Math.max(0, Math.min(s, t.length)); e = Math.max(s, Math.min(e, t.length));
      // 不要把頭尾的空白算進去
      while (s < e && /[\s　]/.test(t[s])) s++; while (e > s && /[\s　]/.test(t[e - 1])) e--;
      if (e > s) segs.push({ li, s, e, t: t.slice(s, e) });
    });
    return segs;
  }
  function selbarHTML(info, multiLine) {
    const short = info.text.replace(/\s/g, '').length <= 8;
    return `<div class="txtbar" id="txtbar" role="toolbar" aria-label="選取的文字">
      <button type="button" data-act="mk-add">劃線</button>
      <button type="button" data-act="mk-note">寫筆記</button>
      ${short && !multiLine ? '<button type="button" data-act="dict">查萌典</button>' : ''}
      <button type="button" data-act="tts-sel">聽這句</button>
    </div>`;
  }
  function hideSelbar() { const b = $('#txtbar'); if (b) b.remove(); SELR = null; }
  let selT = null;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selT);
    selT = setTimeout(() => {
      if (route().view !== 'read') { hideSelbar(); return; }
      const info = selInfo(); if (!info) { if (!document.activeElement || !document.activeElement.closest('#txtbar')) hideSelbar(); return; }
      SELR = { range: info.r.cloneRange(), text: info.text, art: info.art };
      const rect = info.r.getBoundingClientRect();
      const multi = info.text.includes('\n');
      let b = $('#txtbar'); if (b) b.remove();
      document.body.insertAdjacentHTML('beforeend', selbarHTML(info, multi));
      b = $('#txtbar');
      const bw = b.offsetWidth, bh = b.offsetHeight;
      // iPhone 的「拷貝」選單在選取範圍上方，我們的工具列放下方
      let top = rect.bottom + 12; if (top + bh > innerHeight - 90) top = Math.max(8, rect.top - bh - 12);
      let left = rect.left + rect.width / 2 - bw / 2; left = Math.max(8, Math.min(left, innerWidth - bw - 8));
      b.style.top = top + 'px'; b.style.left = left + 'px';
    }, 180);
  });
  function addMark(withNote) {
    const p = curPoem(); if (!p || !SELR) return;
    const segs = selSegs(p, { r: SELR.range, art: SELR.art });
    if (!segs.length) { toast('請選取詩句裡的文字'); return; }
    const m = { id: uid(), segs, q: segs.map(g => g.t).join('\n'), note: '', at: Date.now() };
    p.marks = [...(p.marks || []), m]; touch(p); save();
    try { window.getSelection().removeAllRanges(); } catch (e) {}
    hideSelbar(); readerUpdate(p, false);
    if (withNote) openMark(p, m.id); else toast('已劃線。點一下劃線的地方可以寫筆記');
  }
  function openMark(p, id) {
    const m = (p.marks || []).find(x => x.id === id); if (!m) return;
    modal({ title: '劃線與筆記', ok: '儲存', body: `
      <blockquote class="mk-q serif">${esc(m.q)}</blockquote>
      <label class="field">筆記<textarea id="mk-note" class="ta" rows="4" placeholder="寫下這句話讓你想到什麼">${esc(m.note || '')}</textarea></label>
      <div class="row" style="justify-content:space-between"><button type="button" class="btn ghost sq danger" data-act="mk-del" data-id="${m.id}">刪除劃線</button>${m.at ? `<span class="muted" style="font-size:12px">${new Date(m.at).toLocaleDateString('zh-TW')}</span>` : ''}</div>`,
      onOk: () => { const t = $('#mk-note'); m.note = t ? t.value.trim() : m.note; touch(p); save(); readerUpdate(p, false); toast(m.note ? '已儲存筆記' : '已儲存'); } });
    setTimeout(() => { const t = $('#mk-note'); if (t) t.focus(); }, 50);
  }

  // ---------- 今日一詩 ----------
  function todayPoem() {
    const ps = live(); if (!ps.length) return null;
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
    const sorted = [...ps].sort(byCreated);
    return sorted[day % sorted.length];
  }
  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function todayAuto() { return LS.get('shiye-today-auto', false); }
  function maybeAutoToday(r) {
    if (r.view !== 'home' || !todayAuto() || LS.get('shiye-today-shown', '') === dayKey()) return false;
    const p = todayPoem(); if (!p) return false;
    LS.set('shiye-today-shown', dayKey());
    location.replace('#/read/' + p.id); return true;
  }

  // ---------- 背誦 ----------
  let MEMO = null;
  function memoState(p) { if (!MEMO || MEMO.id !== p.id) MEMO = { id: p.id, shown: 0, hint: {} }; return MEMO; }
  function memoView(p) {
    const M = memoState(p), sts = stanzas(p.text), au = authorOf(p);
    const total = sts.reduce((a, s) => a + s.lines.length, 0);
    const lenHint = LS.get('shiye-memo-len', true);
    let li = 0;
    const body = sts.map((s, si) => `<div class="mm-st"${si ? ' style="margin-top:1.1em"' : ''}>${s.lines.map(l => {
      const i = li++, t = l.text;
      const ind = l.ind ? `padding-left:${l.ind}em;` : '';
      if (i < M.shown) return `<div class="mm-ln done" style="${ind}">${esc(t) || '&nbsp;'}</div>`;
      const h = M.hint[i] || 0;
      const rest = [...t].slice(h).length;
      return `<div class="mm-ln${i === M.shown ? ' cur' : ''}" style="${ind}">${esc([...t].slice(0, h).join(''))}<span class="mm-blank" style="width:${lenHint ? Math.max(rest, 1) : 6}em"></span></div>`;
    }).join('')}</div>`).join('');
    const doneAll = M.shown >= total;
    const memo = p.memo || {};
    return `<header class="bar"><div class="bar-in">
      <div class="row"><a class="back" href="#/read/${p.id}" aria-label="回到閱讀">${IC.back}</a><div class="bar-title">背誦</div><span class="muted">${memo.n ? `背過 ${memo.n} 次・上次 ${new Date(memo.last).toLocaleDateString('zh-TW')}` : '還沒背過'}</span></div>
      <div class="row"><button type="button" class="btn sq" data-act="mm-all">全部顯示</button><button type="button" class="btn sq" data-act="mm-reset">重來</button></div>
    </div></header>
    <main class="page narrow memo" style="gap:18px">
      <div class="card memo-card serif" data-act="mm-next">
        <h1 class="mm-title">${esc(p.title || '無題')}</h1>
        ${au ? `<div class="muted" style="margin-bottom:22px">${esc(authorLabel(au))}</div>` : ''}
        <div class="mm-body">${body}</div>
      </div>
      <p class="muted" style="margin:0;text-align:center">${doneAll ? '整首都背出來了！' : `第 ${M.shown + 1} / ${total} 行・點詩或按空白鍵顯示下一句`}</p>
      <label class="check" style="justify-content:center"><input type="checkbox" data-in="mm-len" ${lenHint ? 'checked' : ''}> 空格顯示字數</label>
    </main>
    <div class="memo-bar">
      ${doneAll ? `<button type="button" class="btn red" data-act="mm-done">我背起來了 ✓</button>` : `<button type="button" class="btn sq" data-act="mm-hint">提示一個字</button><button type="button" class="btn red" data-act="mm-next">下一句</button>`}
    </div>`;
  }
  function memoRefresh(p) { const y = scrollY; $('#app').innerHTML = memoView(p); scrollTo(0, y); const c = document.querySelector('.mm-ln.cur'); if (c) c.scrollIntoView({ block: 'nearest' }); }
  function memoTotal(p) { return stanzas(p.text).reduce((a, s) => a + s.lines.length, 0); }

  // ---------- 我的書房：收藏、劃線、背過的詩 ----------
  function libTabs(cur) {
    return `<div class="seg libtabs" role="tablist">${[['favs', '收藏的詩'], ['marks', '劃線與筆記'], ['memo', '背過的詩']].map(([k, n]) => `<a role="tab" href="#/favs?tab=${k}" class="${cur === k ? 'on' : ''}" aria-selected="${cur === k}">${n}</a>`).join('')}</div>`;
  }
  function marksHTML() {
    const ps = live().filter(p => (p.marks || []).length).sort((a, b) => Math.max(...b.marks.map(m => m.at || 0)) - Math.max(...a.marks.map(m => m.at || 0)));
    if (!ps.length) return '<div class="empty">閱讀時選取一句詩，按「劃線」或「寫筆記」，就會收在這裡。</div>';
    return ps.map(p => `<section class="card mk-card"><a class="mk-head" href="#/read/${p.id}"><span class="serif" style="font-weight:700">〈${esc(p.title)}〉</span><span class="muted">${esc(authorLabel(authorOf(p)))}</span></a>
      ${p.marks.slice().sort((a, b) => (b.at || 0) - (a.at || 0)).map(m => `<div class="mk-item"><blockquote class="mk-q serif">${esc(m.q)}</blockquote>${m.note ? `<p class="mk-note">${esc(m.note)}</p>` : ''}</div>`).join('')}</section>`).join('');
  }
  function memoListHTML() {
    const ps = live().filter(p => p.memo && p.memo.n).sort((a, b) => b.memo.last - a.memo.last);
    if (!ps.length) return '<div class="empty">在閱讀頁按「背誦」，背完按「我背起來了」，就會記在這裡。</div>';
    return `<div class="card panel" style="gap:0">${ps.map(p => `<a class="hist-row" href="#/memo/${p.id}"><span class="serif" style="font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">〈${esc(p.title)}〉</span><span class="muted">${esc(authorLabel(authorOf(p)))}</span><span class="muted" style="margin-left:auto;white-space:nowrap">${p.memo.n} 次・${new Date(p.memo.last).toLocaleDateString('zh-TW')}</span></a>`).join('')}</div>`;
  }
  function libView(tab) {
    tab = ['marks', 'memo'].includes(tab) ? tab : 'favs';
    const ps = live().filter(p => p.fav).sort((a, b) => byCreated(b, a));
    const body = tab === 'marks' ? marksHTML() : tab === 'memo' ? memoListHTML()
      : `<div class="grid">${ps.length ? ps.map(cardHTML).join('') : '<div class="empty" style="grid-column:1/-1">閱讀時按標題旁的星號，就會收在這裡</div>'}</div>`;
    return topbar(isMobile() ? '' : '<a class="btn" href="#/">回首頁</a>') + `<main class="page" style="gap:18px"><h1 class="sec" style="font-size:30px">我的書房</h1>${libTabs(tab)}${body}</main>`;
  }

  // ---------- 事件 ----------
  document.addEventListener('click', e => {
    const hl = e.target.closest && e.target.closest('#stage mark.hl');
    if (hl && !String(window.getSelection() || '').trim()) { const p = curPoem(); if (p) { e.preventDefault(); openMark(p, hl.dataset.mid); } return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const p = curPoem();
    switch (b.dataset.act) {
      case 'tts-start': if (p) { if (TTS.on && TTS.pid === p.id) stop(); else speakPoem(p); } break;
      case 'tts-pause': if (!TTS.on) break; if (TTS.paused) { synth.resume(); TTS.paused = false; } else { synth.pause(); TTS.paused = true; } showBar(); break;
      case 'tts-stop': stop(); break;
      case 'tts-sel': if (SELR) { const t = SELR.text; hideSelbar(); speakItems([{ text: t, li: -1 }], hasCJK(t) || !/[A-Za-z]/.test(t)); } break;
      case 'mk-add': addMark(false); break;
      case 'mk-note': addMark(true); break;
      case 'mk-del': { if (!p) break; const id = b.dataset.id; p.marks = (p.marks || []).filter(m => m.id !== id); touch(p); save(); closeModal(); readerUpdate(p, false); toast('已刪除劃線'); break; }
      case 'dict': if (SELR) { const w = SELR.text.replace(/[\s，。、；：！？「」『』（）《》〈〉…—,.;:!?]/g, '').slice(0, 8); hideSelbar(); if (w) window.open('https://www.moedict.tw/' + encodeURIComponent(w), '_blank', 'noopener'); } break;
      case 'today-auto': { const v = !todayAuto(); LS.set('shiye-today-auto', v); if (v) LS.set('shiye-today-shown', dayKey()); render(); toast(v ? '每天第一次打開詩頁，會先顯示今日一詩' : '已關閉'); break; }
      case 'mm-next': if (p && route().view === 'memo') { const M = memoState(p); if (M.shown < memoTotal(p)) { M.shown++; memoRefresh(p); } } break;
      case 'mm-hint': if (p) { const M = memoState(p), t = lineTexts(p)[M.shown] || ''; M.hint[M.shown] = Math.min((M.hint[M.shown] || 0) + 1, [...t].length); if (M.hint[M.shown] >= [...t].length) M.shown++; memoRefresh(p); } break;
      case 'mm-all': if (p) { memoState(p).shown = memoTotal(p); memoRefresh(p); } break;
      case 'mm-reset': if (p) { MEMO = null; memoRefresh(p); } break;
      case 'mm-done': if (p) { p.memo = { n: ((p.memo && p.memo.n) || 0) + 1, last: Date.now() }; touch(p); save(); toast(`背起來了！這首已經背過 ${p.memo.n} 次`); MEMO = null; go('#/favs?tab=memo'); } break;
    }
  });
  document.addEventListener('input', e => {
    const t = e.target, k = t.dataset && t.dataset.in; if (!k) return;
    if (k === 'tts-rate') { const o = LS.get('shiye-tts', {}); o.rate = +t.value; LS.set('shiye-tts', o); toast('下一次朗讀會用新的速度'); }
    else if (k === 'tts-voice') { const o = LS.get('shiye-tts', {}); o[TTS.cjk === false ? 'en' : 'zh'] = t.value; LS.set('shiye-tts', o); toast('下一次朗讀會用新的聲音'); }
    else if (k === 'mm-len') { LS.set('shiye-memo-len', t.checked); const p = curPoem(); if (p) memoRefresh(p); }
  });
  document.addEventListener('keydown', e => {
    if (route().view !== 'memo' || $('#modal')) return;
    const p = curPoem(); if (!p) return;
    const M = memoState(p);
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (M.shown < memoTotal(p)) { M.shown++; memoRefresh(p); } else { const d = $('[data-act=mm-done]'); if (d && e.key === 'Enter') d.click(); } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (M.shown > 0) { M.shown--; memoRefresh(p); } }
    else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); const h = $('[data-act=mm-hint]'); if (h) h.click(); }
  });

  window.ShiR = { speakPoem, stopTTS: stop, todayPoem, maybeAutoToday, todayAuto, memoView, libView, hideSelbar };
})();
