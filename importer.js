'use strict';
/* 詩頁：把各種來源的詩稿（PTT 文章、報紙副刊、Word、純文字）整理成一首詩。
   瀏覽器與 Node 都能用（Node 用來跑測試）。 */
(function (root) {
  const DYN = ['先秦', '秦', '漢', '西漢', '東漢', '魏', '晉', '魏晉', '南北朝', '隋', '唐', '初唐', '盛唐', '中唐', '晚唐', '五代', '南唐', '宋', '北宋', '南宋', '遼', '金', '元', '明', '清', '近代', '現代', '當代'];
  const DYN_ALT = DYN.slice().sort((a, b) => b.length - a.length).join('|');
  const ANCIENT = new Set(DYN.filter(d => !['近代', '現代', '當代'].includes(d)));
  const PUB = /(聯合報|中國時報|中時|自由時報|蘋果日報|人間副刊|聯合副刊|自由副刊|副刊|幼獅文藝|聯合文學|印刻|創世紀|藍星|笠詩刊|台灣詩學|現代詩|文學獎|詩主義|新詩潮|乾坤|吹鼓吹|野薑花|人間福報|國語日報|文訊|皇冠|PTT)/;
  const WS = '[ \\t\\u3000\\u00a0]';
  const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const pad = n => String(n).padStart(2, '0');
  const ymd = (y, m, d) => (y && m && d && +m >= 1 && +m <= 12 && +d >= 1 && +d <= 31) ? `${y}-${pad(m)}-${pad(d)}` : '';
  const isBlank = l => new RegExp('^' + WS + '*$').test(l);
  const cjkName = s => /^[㐀-鿿豈-﫿]{2,4}$/.test(s);

  // ---------- 編碼 ----------
  function decodeBytes(buf) {
    const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(b.subarray(2));
    if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b.subarray(2));
    if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return new TextDecoder('utf-8').decode(b.subarray(3));
    // 沒有 BOM 的 UTF-16：很多 0x00
    let zeros = 0; for (let i = 1; i < Math.min(b.length, 400); i += 2) if (b[i] === 0) zeros++;
    if (b.length > 8 && zeros > Math.min(b.length, 400) / 4) return new TextDecoder('utf-16le').decode(b);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(b); }
    catch (e) { try { return new TextDecoder('big5').decode(b); } catch (e2) { return new TextDecoder('utf-8').decode(b); } }
  }

  // ---------- 日期 ----------
  function parseDate(s) {
    s = String(s || '');
    let m = s.match(/(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/); if (m) return ymd(m[1], m[2], m[3]);
    m = s.match(/(?:\w{3}\s+)?([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})(?:\s+\d{1,2}:\d{2}:\d{2})?,?\s+(\d{4})/);
    if (m && MONTHS[m[1].toLowerCase()]) return ymd(m[3], MONTHS[m[1].toLowerCase()], m[2]);
    return '';
  }
  const DATE_LINE = /^[ \t　]*(?:\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}(?:[ \t]+\d{1,2}:\d{2}(?::\d{2})?(?:[ \t]*[ap]\.?m\.?)?)?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?[ \t]+\d{1,2},?[ \t]+\d{4})[ \t　]*$/i;

  // ---------- 標題裡的作者 ----------
  function splitTitleAuthor(line, knownAuthor) {
    const t = line.replace(/^[ \t　]+|[ \t　]+$/g, '');
    let m = t.match(/^(.*?)[ \t　]*[◎○●]\s*([^\s◎○●]{1,16})$/);
    if (m && m[1]) return { title: m[1].trim(), author: m[2] };
    m = t.match(/^(.*?)[ \t　]*(?:文[／/]|作者[：:]|by\s+)\s*(\S{1,16})$/i);
    if (m && m[1]) return { title: m[1].trim(), author: m[2] };
    m = t.match(new RegExp('^(.+?)[ \\t\\u3000]+[〔［\\[（(]?(' + DYN_ALT + ')[〕］\\]）)]?[ \\t\\u3000]*[·・•‧．.]?[ \\t\\u3000]*([\\u3400-\\u9fff]{1,6})$'));
    if (m) return { title: m[1].trim(), author: m[3], dynasty: m[2] };
    m = t.match(/^(.+?)(?:[ \t]{2,}|　+[ \t]*)([^\s]{2,16})$/);
    if (m && (m[2] === knownAuthor || (cjkName(m[2]) && m[1].length <= 16 && !/[，。！？；、]/.test(m[1])))) return { title: m[1].trim(), author: m[2] };
    return null;
  }

  // ---------- 檔名 ----------
  function fromFilename(relPath) {
    const parts = String(relPath || '').split(/[\\/]/);
    let base = parts[parts.length - 1].replace(/\.[^.]+$/, '').trim();
    const out = { title: '', author: '', source: '', date: '' };
    let m = base.match(/^(\d{4})[.\-](\d{1,2})[.\-](\d{1,2})\s*/);
    if (m) { out.date = ymd(m[1], m[2], m[3]); base = base.slice(m[0].length).trim(); }
    m = base.match(/^《?([^》《]{1,30})》\s*(.+)$/);
    if (m) { out.source = m[1].replace(/[《》]/g, '').trim(); out.title = m[2].trim(); return out; }
    m = base.match(/^(\S{2,6})（([^）]+)）\s*(\d{4}-\d{1,2}-\d{1,2})?\s*(.*)$/);
    if (m) { out.author = m[1]; out.title = m[2]; if (m[3]) out.date = parseDate(m[3]); out.source = m[4].trim(); return out; }
    m = base.match(/^(.+?)\s+[-–—－]\s+(.+)$/);
    if (m) {
      if (PUB.test(m[1])) { out.source = m[1].trim(); out.title = m[2].trim(); }
      else { out.author = m[1].trim(); out.title = m[2].trim(); }
      return out;
    }
    const toks = base.split(/\s+/).filter(Boolean);
    if (toks.length >= 2) {
      const pub = toks.filter(t => PUB.test(t)), rest = toks.filter(t => !PUB.test(t));
      if (pub.length) {
        out.source = pub.join(' ');
        if (rest.length >= 2 && cjkName(rest[rest.length - 1])) { out.author = rest.pop(); out.title = rest.join(' '); }
        else if (rest.length === 1 && cjkName(rest[0])) out.author = rest[0];
        else out.title = rest.join(' ');
        return out;
      }
    }
    out.title = base;
    return out;
  }

  // ---------- 行的整理 ----------
  function indentOf(l) {
    const lead = l.match(/^[ \t　 ]*/)[0];
    let n = 0; for (const ch of lead) n += ch === '　' ? 1 : ch === '\t' ? 2 : .5;
    return n;
  }
  function dedent(lines) {
    const ind = lines.filter(l => !isBlank(l)).map(indentOf);
    const min = ind.length ? Math.min(...ind) : 0;
    return lines.map(l => {
      if (isBlank(l)) return '';
      const rest = l.replace(/^[ \t　 ]*/, '').replace(/[ \t　 ]+$/, '');
      const n = indentOf(l) - min;
      return '　'.repeat(Math.floor(n)) + (n % 1 ? ' ' : '') + rest;
    });
  }
  function trimBlank(lines) {
    let a = 0, b = lines.length;
    while (a < b && isBlank(lines[a])) a++;
    while (b > a && isBlank(lines[b - 1])) b--;
    return lines.slice(a, b);
  }
  // 每行之間都空一行的稿子：單一空行當換行，兩個以上空行才是分節
  function collapseSpacing(lines) {
    const gaps = []; let run = -1;
    for (const l of lines) { if (isBlank(l)) { if (run >= 0) run++; } else { if (run >= 0) gaps.push(run); run = 0; } }
    if (gaps.length < 3) return { lines, collapsed: false };
    const ones = gaps.filter(g => g === 1).length, bigs = gaps.filter(g => g >= 2).length, zeros = gaps.filter(g => g === 0).length;
    if (ones / gaps.length < .7 || zeros > gaps.length * .1) return { lines, collapsed: false };
    if (!bigs && lines.filter(l => !isBlank(l)).length < 6) return { lines, collapsed: false };
    const out = []; let blanks = 0;
    for (const l of lines) {
      if (isBlank(l)) { blanks++; continue; }
      if (out.length && blanks >= 2) out.push('');
      blanks = 0; out.push(l);
    }
    return { lines: out, collapsed: true };
  }
  function capBlankRuns(lines, max = 2) {
    const out = []; let n = 0;
    for (const l of lines) { if (isBlank(l)) { if (++n <= max) out.push(''); } else { n = 0; out.push(l); } }
    return out;
  }

  // ---------- 主程式 ----------
  function parsePoemFile(raw, relPath) {
    let text = String(raw || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/ /g, ' ');
    let L = text.split('\n').map(l => l.replace(/[ \t　]+$/, ''));
    const fn = fromFilename(relPath);
    const fnBase = String(relPath || '').split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
    const r = { title: '', authorName: '', authorNick: '', dynasty: '', source: '', date: '', tags: [], note: '', flags: [], sharer: '' };
    let titleSet = false, authorFrom = '';
    const setAuthor = (name, from, dyn) => { if (name && !r.authorName) { r.authorName = name.replace(/^◎/, '').trim(); authorFrom = from; if (dyn) r.dynasty = dyn; } };

    // 1. PTT 文章
    const head = L.slice(0, 8);
    const ai = head.findIndex(l => /^[ \t　]*作者[ \t:：]+\S/.test(l));
    if (ai >= 0 && ai <= 2) {
      const am = L[ai].match(/作者[ \t:：]+([A-Za-z0-9_.\-]+)(?:[ \t]*\(([^)]*)\))?(?:.*?(?:看板|站內)[ \t]+([A-Za-z0-9_\-]+))?/);
      let end = ai + 1, ptitle = null, ptime = '';
      for (let i = ai + 1; i < Math.min(L.length, ai + 6); i++) {
        const l = L[i];
        let m;
        if ((m = l.match(/^[ \t　]*標題[ \t:：]*(.*)$/))) { ptitle = m[1]; end = i + 1; }
        else if ((m = l.match(/^[ \t　]*時間[ \t:：]+(.+)$/))) { ptime = m[1]; end = i + 1; }
        else if (/^[ \t]*[─━—\-_=]{8,}[ \t]*$/.test(l)) { end = i + 1; break; }
        else if (!isBlank(l)) break;
      }
      if (am) {
        r.flags.push('ptt');
        const board = am[3] || '';
        r.source = board ? `PTT ${board}` : 'PTT';
        if (am[2] && am[2].trim()) r.authorNick = am[2].trim();
        if (ptime) r.date = parseDate(ptime);
        if (ptitle !== null) {
          const tm = ptitle.trim().match(/^(?:(?:Re|Fw|轉)[:：]\s*)?(?:\[([^\]]+)\]\s*)?(.*)$/i);
          if (tm[1]) r.tags.push(tm[1].trim());
          const ta = tm[2] ? splitTitleAuthor(tm[2]) : null;
          if (ta) { r.title = ta.title; titleSet = true; setAuthor(ta.author, 'title', ta.dynasty); r.sharer = am[1]; r.authorNick = ''; }
          else if (tm[2].trim()) { r.title = tm[2].trim(); titleSet = true; }
        }
        setAuthor(am[1], 'ptt');
        if (r.sharer && r.sharer !== r.authorName) r.source += `（${r.sharer} 分享）`; else r.sharer = '';
        L = L.slice(end);
        // 簽名檔、發信站、推文
        let cut = L.findIndex((l, i) => i > 0 && (l.trim() === '--' || /^[ \t]*※[ \t]*(發信站|文章網址|編輯|轉錄|引述)/.test(l) || /^(推|噓|→)[ \t]+[A-Za-z0-9_]+[ \t]*[:：]/.test(l) || /^[ \t]*◆[ \t]*From:/.test(l)));
        if (cut >= 0) L = L.slice(0, cut);
        L = trimBlank(L);
        while (L.length && /^[ \t　]*\d{1,2}\/\d{1,2}([ \t]+\d{1,2}:\d{2})?[ \t]*$/.test(L[L.length - 1])) L = trimBlank(L.slice(0, -1));
      }
    }

    // 2. 報紙副刊等的抬頭（只看最前面幾行）
    if (!r.flags.includes('ptt')) {
      let paper = '', column = '';
      let i = 0, seen = 0;
      while (i < L.length && seen < 7) {
        const l = L[i], t = l.trim();
        if (isBlank(l)) { i++; continue; }
        let m;
        if (!titleSet && (m = t.match(/^《?([^》《，。\s][^》《，。]{0,24})》\s*(.+)$/)) && m[2].length <= 30 && !/[，。]/.test(m[2])) {
          column = m[1].trim(); const ta = splitTitleAuthor(m[2]);
          if (ta) { r.title = ta.title; setAuthor(ta.author, 'head', ta.dynasty); } else r.title = m[2].trim();
          titleSet = true; L.splice(i, 1); seen++; continue;
        }
        if ((m = t.match(/^【[ \t　]*(?:([^╱/】]{1,12})[╱/])?[ \t　]*◎?[ \t　]*([^】╱/◎]{1,14}?)[ \t　]*】[ \t　]*(.*)$/)) && !/\d{4}-\d{2}-\d{2}/.test(m[2])) {
          if (m[1]) paper = m[1].trim();
          setAuthor(m[2], 'head');
          if (m[3] && !r.date) r.date = parseDate(m[3]);
          L.splice(i, 1); seen++; continue;
        }
        if (DATE_LINE.test(l)) { if (!r.date) r.date = parseDate(t); L.splice(i, 1); seen++; continue; }
        if (!titleSet && fn.title && t.replace(/[\s\u3000]/g, '') === fn.title.replace(/[\s\u3000]/g, '')) { r.title = fn.title; titleSet = true; L.splice(i, 1); seen++; continue; }
        break;
      }
      // 頁尾的出處　【2008-11-25/聯合報/E3版/聯合副刊】
      for (let j = L.length - 1; j >= Math.max(0, L.length - 6); j--) {
        const m = L[j].trim().match(/^【(\d{4}-\d{1,2}-\d{1,2})[/／]([^/／】]+)(?:[/／]([^/／】]*))?(?:[/／]([^】]*))?】$/);
        if (m) { if (!r.date) r.date = parseDate(m[1]); paper = paper || m[2]; if (m[4] && !column) column = m[4]; L.splice(j, 1); }
      }
      L = L.filter(l => !/^[ \t　]*(圖|攝影|繪圖|插畫)[／/]\S{1,12}[ \t　]*$/.test(l));
      const src = [paper, column].filter(Boolean);
      if (src.length === 2 && src[1].includes(src[0])) src.shift();
      if (src.length) r.source = src.join('・');
    }

    // 3. 第一行是「標題＋作者」或只有作者
    L = trimBlank(L);
    if (L.length) {
      const first = L[0], next = L[1];
      const followedByBlank = next === undefined || isBlank(next);
      if (!titleSet && followedByBlank) {
        const ta = splitTitleAuthor(first, fn.author);
        if (ta && (!r.authorName || ta.author === r.authorName)) {
          r.title = ta.title; titleSet = true; setAuthor(ta.author, 'firstline', ta.dynasty); L = trimBlank(L.slice(1));
        }
      }
      if (!r.authorName && L.length && cjkName(L[0].trim()) && (L[1] === undefined || isBlank(L[1])) && fn.title && L[0].trim() !== fn.title && L[0].trim() !== r.title) {
        setAuthor(L[0].trim(), 'firstline'); L = trimBlank(L.slice(1));
      }
    }
    // 開頭的日期行（例如 July 22, 2009）
    while (L.length && DATE_LINE.test(L[0])) { if (!r.date) r.date = parseDate(L[0]); L = trimBlank(L.slice(1)); }

    // 4. 檔名補上缺的資料
    if (!titleSet && fn.title && fn.title !== r.authorName) { r.title = fn.title; titleSet = true; }
    setAuthor(fn.author, 'filename');
    if (!r.source && fn.source) r.source = fn.source;
    else if (fn.source && !r.flags.includes('ptt') && !r.source.includes(fn.source) && !fn.source.includes(r.source)) r.source = fn.source.includes(r.source) ? fn.source : r.source;
    if (!r.date && fn.date) r.date = fn.date;

    // 5. 拿掉內文開頭重複的標題（【標題】、標題 ◎作者 …）
    const norm = s => s.replace(/[【】《》〈〉「」『』\s　]/g, '');
    for (let k = 0; k < 3 && L.length; k++) {
      const t = L[0].trim(); if (!t) { L.shift(); continue; }
      const ta = splitTitleAuthor(t, r.authorName);
      if (r.title && (norm(t) === norm(r.title) || (ta && norm(ta.title) === norm(r.title)))) { L = trimBlank(L.slice(1)); if (ta && !r.authorName) setAuthor(ta.author, 'body'); continue; }
      if (r.authorName && (norm(t) === norm(r.authorName) || norm(t) === '◎' + norm(r.authorName))) { L = trimBlank(L.slice(1)); continue; }
      if (norm(t) === norm(fnBase)) { L = trimBlank(L.slice(1)); continue; }
      break;
    }

    // 6. 後記、附註、作者簡介 → 附記
    const ni = L.findIndex((l, i) => i > 0 && /^[ \t　]*(後記|附記|附註|註|注|作者簡介|作者介紹|編按|按)[ \t　]*[：:]/.test(l));
    if (ni > 0) { r.note = dedent(trimBlank(L.slice(ni))).join('\n').trim(); L = trimBlank(L.slice(0, ni)); }

    // 7. 縮排、空行
    L = L.map(l => isBlank(l) ? '' : l);
    L = dedent(trimBlank(L));
    const cs = collapseSpacing(L); L = cs.lines; if (cs.collapsed) r.flags.push('collapsed');
    L = capBlankRuns(L, 2);
    const body = L.join('\n');

    if (!r.title) {
      const firstLine = (L.find(l => l.trim()) || '').trim();
      r.title = firstLine ? firstLine.replace(/[，。、！？；：,.!?;:]+$/, '').slice(0, 20) : '無題';
      r.flags.push('title-guessed');
    }
    const nonblank = L.filter(l => l.trim());
    if (nonblank.filter(l => l.trim().length > 70).length >= Math.max(3, nonblank.length * .3)) r.flags.push('prose');
    if (r.dynasty === '' && r.authorName) {
      const dm = r.authorName.match(new RegExp('^(' + DYN_ALT + ')[·・•‧．.\\s]+(.+)$'));
      if (dm) { r.dynasty = dm[1]; r.authorName = dm[2]; }
    }
    r.text = body;
    r.type = guessType(body, r.dynasty);
    r.authorFrom = authorFrom;
    return r;
  }

  function guessType(text, dynasty) {
    if (dynasty && ANCIENT.has(dynasty)) return 'classic';
    const ls = text.split('\n').filter(l => l.trim());
    if (!ls.length) return 'modern';
    if (ls.some(l => /^[ \t　]+\S/.test(l))) return 'modern';
    const lens = ls.map(l => l.replace(/[，。、！？；：,.!?;:「」『』《》\s　]/g, '').length);
    if (lens.every(n => n === lens[0]) && [4, 5, 7, 10, 14].includes(lens[0]) && ls.length <= 16) return 'classic';
    return 'modern';
  }

  // ---------- 重複比對 ----------
  function normKey(text) {
    return String(text || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  }
  function bigrams(s) { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; }
  function similarity(a, b) {
    if (!a || !b) return 0; if (a === b) return 1;
    if (Math.min(a.length, b.length) / Math.max(a.length, b.length) < .7) return 0;
    const A = bigrams(a), B = bigrams(b); let inter = 0;
    for (const [g, n] of A) inter += Math.min(n, B.get(g) || 0);
    return 2 * inter / (Math.max(a.length - 1, 1) + Math.max(b.length - 1, 1));
  }

  // ---------- 聰明貼上：從網頁、截圖辨識、AI 摘要這類雜亂文字裡挑出詩 ----------
  const UI_LINE = /^.?\s*(?:A[Il1] ?摘要|AI 概覽|詩作原文|原文|全文|詩文|作品背景(?:與|和)?解析|作品賞析|賞析|解析|注釋|註釋|問問 ?Gemini|新分頁|所有分頁|顯示(?:更多|全部)|收起|複製連結|分享|相關搜尋|更多結果|廣告|贊助|返回頂部|上一篇|下一篇|閱讀全文|回到首頁|首頁)[\s:：]*$/i;
  const CJK = /[㐀-鿿豈-﫿]/g;
  const cjkCount = s => (s.match(CJK) || []).length;
  const isProse = para => {
    const ls = para.filter(l => l.trim());
    const len = ls.reduce((a, l) => a + l.trim().length, 0);
    return ls.length && ls.length <= 4 && len > 30 && len / ls.length > 22 && /[。]/.test(ls.join(''));
  };
  function introInfo(s) {
    const o = {};
    const t = s.match(/[〈「『（(]([^〉」』)）》\n]{1,24})[〉」』)）》]/) || (!/詩集《/.test(s) && s.match(/《([^》\n]{1,24})》/));
    if (t) o.title = t[1].trim();
    const a = s.match(/(?:詩人|作家|作者|詩人兼\S{1,4})[\s　]*([一-鿿·．]{2,5}?)(?=於|在|的|所|創作|寫|發表|筆下|，|。|、|\s|（|\(|$)/);
    if (a) o.author = a[1];
    else { const b = s.match(/[〉」』)）》]\s*(?:是|為|乃)\s*(?:[^，。]{0,10}?(?:詩人|作家))?\s*([\u4e00-\u9fff]{2,4}?)\s*(?:的|所|於|在|早年|晚年|年輕時)/); if (b && !/^(台灣|臺灣|中國|香港|一首|現代|著名|知名)/.test(b[1])) o.author = b[1]; }
    const c = s.match(/收錄(?:在|於|進)?(?:其|他的|她的)?(?:詩集|作品集)?\s*《([^》\n]{1,30})》/);
    if (c) o.collection = c[1].trim();
    return o;
  }
  function smartParse(raw, opt = {}) {
    let text = String(raw || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/[​-‍⁠]/g, '').replace(/[ \t]*\u{1F517}/gu, '');
    let lines = text.split('\n').map(l => l.replace(/[ \t]+$/, ''));
    const nb = () => lines.map((l, i) => l.trim() ? i : -1).filter(i => i >= 0);
    // 1. 介面雜訊：狀態列、網址、按鈕文字
    lines = lines.map((l, i) => {
      const s = l.trim();
      if (!s) return l;
      if (UI_LINE.test(s)) return '';
      if (s.length <= 30 && /[a-z0-9-]+\.(?:com|tw|net|org|cc|io|hk|cn|me|app)\b/i.test(s) && cjkCount(s) <= 6) return '';
      if (s.length <= 30 && /(?:Gemini|新分頁|所有分頁|分頁|書籤|閱讀器)/.test(s) && /(?:Gemini|分頁)/.test(s)) return '';
      if (/^https?:\/\/\S+$/.test(s)) return '';
      return l;
    });
    if (opt.ocr) {
      // 只清最上面和最下面幾行：狀態列時間、電量、亂碼
      const junk = s => /^\d{1,2}[:：]\d{2}/.test(s) || (s.length <= 18 && (s.replace(/[\s　]/g, '').match(/[A-Za-z0-9@+#&()|=<>\\/_~^*%$]/g) || []).length >= 2 && cjkCount(s) <= s.length * .6) || (s.replace(/\s/g, '').length <= 2 && !cjkCount(s)) || (s.replace(/[\s\u3000]/g, '').length <= 6 && /[@#+=<>|\\~^*%$&]/.test(s)) || (s.length <= 14 && /[@©®]/.test(s));
      for (const edge of [0, 1]) {
        for (let k = 0; k < 4; k++) {
          const idx = nb(); if (!idx.length) break;
          const i = edge ? idx[idx.length - 1] : idx[0];
          if (junk(lines[i].trim())) lines[i] = ''; else break;
        }
      }
      // 網頁上的連結圖示常被辨識成「2」
      lines = lines.map(l => l.replace(/([\u3400-\u9fff，。！？])\s*2$/, '$1'));
    }
    // 2. 段落：開頭或結尾的介紹、說明文字（散文）移到附記
    const paras = []; let cur = [];
    lines.forEach(l => { if (l.trim()) cur.push(l); else if (cur.length) { paras.push(cur); cur = []; } });
    if (cur.length) paras.push(cur);
    const notes = []; let info = {};
    if (opt.page && paras.length > 2) {
      // 整個網頁：找出最長一段「短行」組成的區塊（詩），前後的文章、選單都丟掉
      const avg = p => p.reduce((a, l) => a + l.trim().length, 0) / p.length;
      const poemish = p => avg(p) <= 26 && !(p.length === 1 && p[0].trim().length <= 8 && /^(?:分享|留言|回覆|推薦|收藏|更多|標籤|分類|上一篇|下一篇)/.test(p[0].trim()));
      let hint = -1;
      if (opt.title) { const k = normKey(opt.title); hint = paras.findIndex(p => p.some(l => normKey(l) === k || (k.length >= 2 && normKey(l).startsWith(k) && l.trim().length <= k.length + 12))); }
      let best = null;
      for (let i = 0; i < paras.length; i++) {
        if (!poemish(paras[i])) continue;
        let j = i, lines = 0;
        while (j < paras.length && poemish(paras[j])) { lines += paras[j].length; j++; }
        const near = hint >= 0 && i >= hint && i <= hint + 2 ? 1000 : 0;
        const multi = paras.slice(i, j).filter(p => p.length >= 2).length;
        const sc = lines + multi * 3 + near;
        if (!best || sc > best.sc) best = { i, j, sc };
        i = j - 1;
      }
      if (best) {
        const intro = paras.slice(0, best.i).filter(isProse).map(p => p.map(l => l.trim()).join(''));
        intro.forEach(s => { info = Object.assign(introInfo(s), info); });
        // 標題行在區塊前一段
        if (hint >= 0 && hint < best.i) { const hl = paras[hint].find(l => normKey(l).startsWith(normKey(opt.title))); if (hl) info.title = info.title || opt.title; }
        paras.splice(0, paras.length, ...paras.slice(best.i, best.j));
        if (hint >= best.i && hint < best.j && paras[hint - best.i].length <= 2) {
          const hp = paras[hint - best.i];
          if (hp.length === 2 && cjkName2(hp[1])) info.author = info.author || hp[1].trim();
          paras.splice(hint - best.i, 1); info.title = info.title || opt.title;
        }
      }
    }
    const introLine = p => p.length === 1 && p[0].trim().length >= 8 && /[〈「『（(《][^〉」』)）》]{1,24}[〉」』)）》]\s*(?:是|為|乃|，)/.test(p[0]) && /[。]$/.test(p[0].trim());
    while (paras.length > 1 && (isProse(paras[0]) || introLine(paras[0]))) { const p = paras.shift().map(l => l.trim()).join(''); info = Object.assign(introInfo(p), info); notes.push(p); }
    while (paras.length > 1 && isProse(paras[paras.length - 1])) notes.push(paras.pop().map(l => l.trim()).join(''));
    // 只有一段時，第一行可能是介紹句
    if (paras.length && paras[0].length > 1) {
      const f = paras[0][0].trim();
      if (f.length > 30 && /[。]/.test(f) && /[〈「《]/.test(f)) { info = Object.assign(introInfo(f), info); notes.unshift(f); paras[0].shift(); }
    }
    // 詩前面單獨的「標題／作者」行
    let title = info.title || '', author = info.author || '';
    if (paras.length > 1 && paras[0].length <= 2 && paras[0].every(l => l.trim().length <= 24)) {
      const head = paras[0].map(l => l.trim());
      const m0 = head[0].match(/^(.{1,20}?)[\s　]*[／/|｜][\s　]*([一-鿿·]{2,5})$/);
      const am = head.map(h => h.match(/^(?:作者|文|詩)[\s　]*[:：／/][\s　]*(.{1,20})$/));
      if (m0) { title = title || m0[1]; author = author || m0[2]; paras.shift(); }
      else if (am[1] || (head.length === 2 && cjkName2(head[1]))) { title = title || head[0]; author = author || (am[1] ? am[1][1] : head[1]); paras.shift(); }
      else if (head.length === 1 && (!title || normKey(head[0]) === normKey(title))) { title = title || head[0]; paras.shift(); }
    }
    let body = paras.map(p => p.join('\n')).join('\n\n');
    body = dedent(body.split('\n')).join('\n');
    // 「作者：」行
    body = body.replace(/^[ \t　]*(?:作者|文)[ \t　]*[:：][ \t　]*(.{1,20})[ \t　]*$/m, (m, a) => { if (!author) author = a.trim(); return ''; }).replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
    return { title, authorName: author, text: body, note: notes.join('\n'), source: info.collection ? `《${info.collection}》` : '', found: !!(info.title || info.author) };
  }
  const cjkName2 = s => /^[一-鿿]{2,4}$/.test(s.trim());

  const api = { decodeBytes, parsePoemFile, fromFilename, splitTitleAuthor, normKey, similarity, guessType, parseDate, smartParse, DYNASTIES: DYN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ShiImport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
