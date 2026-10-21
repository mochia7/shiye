'use strict';
/* 詩頁 v0.8 — 詩篇閱讀與排版 */

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function toast(msg, ms = 2600, action) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  if (action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = action.label; b.className = 'toast-act';
    b.onclick = () => { t.classList.remove('show'); action.fn(); }; t.appendChild(b); ms = Math.max(ms, 6000);
  }
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms);
}
const SEAL = '<svg aria-hidden="true" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="7" fill="#A8322A"/><rect x="7" y="7" width="50" height="50" rx="3" fill="none" stroke="#FBF3EC" stroke-width="2.2"/><path fill="#FBF3EC" d="M29.853556485355647 35.1255230125523 29.552301255230123 35.35146443514644C31.09623430962343 37.00836820083682 32.45188284518828 39.60669456066945 32.67782426778243 42.01673640167364C37.23430962343096 45.40585774058577 41.45188284518828 36.36820083682008 29.853556485355647 35.1255230125523ZM16.711297071129707 14.30125523012552 16.447698744769873 14.489539748953973C17.615062761506273 15.845188284518827 18.782426778242677 17.99163179916318 19.046025104602506 20.02510460251046C23.715481171548113 23.263598326359833 28.0836820083682 14.451882845188283 16.711297071129707 14.30125523012552ZM25.297071129707113 18.669456066945607 23.22594142259414 21.380753138075313H13.999999999999998L14.301255230125522 22.435146443514643H28.00836820083682C28.535564853556483 22.435146443514643 28.912133891213387 22.246861924686193 28.987447698744766 21.832635983263597C27.631799163179913 20.552301255230123 25.297071129707113 18.669456066945607 25.297071129707113 18.669456066945607ZM24.694560669456067 28.535564853556483 22.698744769874473 31.13389121338912H15.393305439330542L15.694560669456065 32.18828451882845H27.2928870292887C27.820083682008367 32.18828451882845 28.19665271966527 32.0 28.271966527196653 31.585774058577407C26.9163179916318 30.305439330543933 24.694560669456067 28.535564853556483 24.694560669456067 28.535564853556483ZM24.694560669456067 23.602510460251047 22.698744769874473 26.20083682008368H15.393305439330542L15.694560669456065 27.255230125523013H27.2928870292887C27.820083682008367 27.255230125523013 28.19665271966527 27.06694560669456 28.271966527196653 26.652719665271967C26.9163179916318 25.372384937238493 24.694560669456067 23.602510460251047 24.694560669456067 23.602510460251047ZM46.19665271966527 29.740585774058577 44.05020920502092 32.97907949790795H43.86192468619247V30.757322175732217C44.72803347280335 30.644351464435147 45.06694560669456 30.305439330543933 45.14225941422594 29.778242677824267L38.62761506276151 29.21338912133891V32.97907949790795H27.782426778242677L28.0836820083682 34.03347280334728H38.62761506276151V44.27615062761506C38.62761506276151 44.72803347280335 38.43933054393305 44.9163179916318 37.87447698744769 44.9163179916318C36.97071129707113 44.9163179916318 32.18828451882845 44.61506276150627 32.18828451882845 44.61506276150627V45.06694560669456C34.44769874476987 45.44351464435147 35.31380753138075 45.97071129707113 36.029288702928866 46.64853556485355C36.78242677824268 47.32635983263598 36.97071129707113 48.38075313807531 37.12133891213389 49.88702928870293C42.99581589958159 49.43514644351465 43.86192468619247 47.70292887029289 43.86192468619247 44.35146443514644V34.03347280334728H48.98326359832636C49.51046025104603 34.03347280334728 49.92468619246862 33.84518828451883 50.0 33.43096234309623C48.64435146443515 31.962343096234306 46.19665271966527 29.740585774058577 46.19665271966527 29.740585774058577ZM44.5020920502092 16.899581589958157 41.97907949790795 20.2510460251046H40.54811715481171V15.619246861924687C41.45188284518828 15.468619246861923 41.71548117154812 15.12970711297071 41.75313807531381 14.640167364016737L35.163179916317986 14.112970711297073V20.2510460251046H29.02510460251046L29.326359832635983 21.305439330543933H35.163179916317986V27.443514644351463H29.439330543933053L29.740585774058577 28.497907949790793H47.51464435146443C48.0418410041841 28.497907949790793 48.45606694560669 28.309623430962343 48.56903765690377 27.895397489539747C46.91213389121339 26.389121338912133 44.1255230125523 24.242677824267783 44.1255230125523 24.242677824267783L41.67782426778243 27.443514644351463H40.54811715481171V21.305439330543933H48.079497907949786C48.60669456066945 21.305439330543933 49.020920502092046 21.11715481171548 49.13389121338912 20.702928870292887C47.40167364016736 19.15899581589958 44.5020920502092 16.899581589958157 44.5020920502092 16.899581589958157ZM22.623430962343093 44.42677824267783H19.686192468619247V37.12133891213389H22.623430962343093ZM19.686192468619247 48.0418410041841V45.48117154811715H22.623430962343093V47.96652719665272H23.451882845188283C25.03347280334728 47.96652719665272 27.2928870292887 46.98744769874477 27.330543933054393 46.64853556485355V37.76150627615063C28.00836820083682 37.61087866108787 28.460251046025103 37.34728033472803 28.648535564853553 37.0836820083682L24.355648535564853 33.84518828451883L22.28451882845188 36.06694560669456H19.836820083682007L15.054393305439328 34.18410041841004V49.51046025104603H15.732217573221755C17.690376569037653 49.51046025104603 19.686192468619247 48.49372384937239 19.686192468619247 48.0418410041841Z"/></svg>';
const IC = {
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  star: on => `<svg width="20" height="20" viewBox="0 0 24 24" fill="${on ? '#C08A1E' : 'none'}" stroke="${on ? '#C08A1E' : 'currentColor'}" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`,
  scroll: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 4h12M6 9h12M6 14h8M12 18l3 3 3-3"/></svg>',
  file: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9E2A22" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3"/></svg>',
  img: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9E2A22" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>'
};

// ---------- constants ----------
const TYPES = { classic: '古典', modern: '新詩', shape: '圖像詩' };
const STYLES = {
  classic:    { name: '經典書頁', bg: '#FBFAF7', fg: '#1C1B19', font: 'serif', ls: .12, align: 'center' },
  vertical:   { name: '古籍書頁', bg: '#EDE6D6', fg: '#2A241C', font: 'serif', ls: .3,  align: 'center' },
  night:      { name: '極簡夜讀', bg: '#16181D', fg: '#E8E4DA', font: 'serif', ls: .06, align: 'left' },
  manuscript: { name: '手稿稿紙', bg: '#F3EBDC', fg: '#3A2E22', font: 'kai',   ls: .12, align: 'center' },
  magazine:   { name: '詩刊雜誌', bg: '#FFFFFF', fg: '#1C1B19', font: 'serif', ls: .06, align: 'left' },
  recite:     { name: '朗讀模式', bg: '#121317', fg: '#ECE8DE', font: 'serif', ls: .08, align: 'left' },
  shape:      { name: '圖像詩',   bg: '#F4F1EA', fg: '#1C1B19', font: 'serif', ls: 0,   align: 'center' }
};
const FONTS = { serif: ['宋體', 'var(--serif)'], kai: ['楷體', 'var(--kai)'], sans: ['黑體', 'var(--sans)'] };
const LH = { tight: ['緊密', 1.7], mid: ['適中', 2.2], loose: ['寬鬆', 2.9] };
const GAP = { small: ['小', .5], mid: ['中', 1], large: ['大', 2] };
const COLORS = ['#2F4A6B', '#22324A', '#B5644A', '#3D5A40', '#6B4E71', '#1C1B19', '#E8E4DA', '#C9A96E'];
const DYNASTIES = ['先秦', '秦', '漢', '魏晉', '南北朝', '隋', '唐', '五代', '宋', '元', '明', '清', '近代', '現代', '當代'];
const DYN_RE = new RegExp('^[〔［\\[（(]?(' + [...DYNASTIES, '魏', '晉', '遼', '金', '南唐', '北宋', '南宋', '東漢', '西漢', '晚唐', '盛唐', '中唐', '初唐'].sort((a, b) => b.length - a.length).join('|') + ')[〕］\\]）)]?[\\s·・‧•．.　,，、:：-]+(.+)$');
const SCOPES = { author: '同作者', source: '同來源', collection: '同詩集', all: '全部詩篇' };
// 來源分類：「PTT poem（chinatown 分享）」和「PTT poem」算同一類
// 報紙的各個專欄、副刊、文學獎都算同一份報紙（詩下方的出處仍保留完整名稱）
const PAPERS = [['聯合報', /^(聯合報|聯合副刊|聯副)/], ['中國時報', /^(中國時報|中時|人間副刊)/], ['自由時報', /^(自由時報|自由副刊)/], ['蘋果日報', /^蘋果日報/], ['人間福報', /^人間福報/], ['國語日報', /^國語日報/]];
const srcKey = s => {
  const k = String(s || '').replace(/[（(][^）)]*[）)]/g, '').split(/[・·]/)[0].trim();
  const hit = PAPERS.find(([, re]) => re.test(k));
  return hit ? hit[0] : k;
};
function sourceGroups() {
  const m = new Map();
  live().forEach(p => { const k = srcKey(p.source); if (k) m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'));
}
const VERSION = '0.8.0';
const PRINT = /^#\/print/.test(location.hash);
const fontKey = (L, st) => L.font || (DB && DB.prefs && DB.prefs.defaultFont) || st.font;
const live = () => DB.poems.filter(p => !p.deleted);
const touch = (...ps) => { const t = Date.now(); ps.forEach(p => { if (p) p.updated = t; }); };
const defStyle = t => t === 'classic' ? 'classic' : t === 'shape' ? 'shape' : 'magazine';
const defLayout = t => ({ style: defStyle(t), font: null, size: t === 'classic' ? 24 : 21, lh: 'mid', gap: 'mid', align: null, keep: true, hang: true });

// ---------- data ----------
let DB = null, serverMode = true;
function seed() {
  const A = (id, name, dynasty) => ({ id, name, dynasty, bio: '' });
  const c1 = { id: 'c1', name: '唐詩選讀', author: '', cover: { img: null, color: '#2F4A6B', zoom: 100, x: 50, y: 50, pos: 'top', ink: 'light' } };
  const c2 = { id: 'c2', name: '雨後的月台', author: '[你的名字]', cover: { img: null, color: '#B5644A', zoom: 100, x: 50, y: 50, pos: 'bottom', ink: 'light' } };
  let t = Date.now() - 1e6;
  const P = (id, title, authorId, type, col, text, style) => {
    const layout = defLayout(type); if (style) layout.style = style;
    t += 1000;
    return { id, title, authorId, type, collectionId: col, tags: [], text, layout, fav: false, created: t, updated: t };
  };
  return {
    version: 2,
    authors: [A('a1', '李白', '唐'), A('a2', '王維', '唐'), A('a3', '王之渙', '唐'), A('a4', '[你的名字]', ''), A('a5', 'Emily Dickinson', '')],
    collections: [c1, c2],
    prefs: { scope: 'author', last: null },
    poems: [
      P('p1', '靜夜思', 'a1', 'classic', 'c1', '床前明月光\n疑是地上霜\n舉頭望明月\n低頭思故鄉'),
      P('p7', '早發白帝城', 'a1', 'classic', 'c1', '朝辭白帝彩雲間\n千里江陵一日還\n兩岸猿聲啼不住\n輕舟已過萬重山', 'vertical'),
      P('p2', '鹿柴', 'a2', 'classic', 'c1', '空山不見人\n但聞人語響\n返景入深林\n復照青苔上', 'vertical'),
      P('p3', '登鸛雀樓', 'a3', 'classic', 'c1', '白日依山盡\n黃河入海流\n欲窮千里目\n更上一層樓', 'manuscript'),
      P('p4', '雨後的月台', 'a4', 'modern', 'c2',
        '最後一班車走了\n　　留下\n　　　　一整排\n　　　　　　還沒說完的燈\n\n我把傘收起來\n像收起一個\n不必再解釋的\n　　　　　　　　下午\n\n而遠方\n　　有人正在把我讀成一行過長的、沒有標點也不肯停下來的句子，一路讀到月台的盡頭\n然後\n　　　　　　　　　　　　停'),
      P('p5', '秋的斜線', 'a4', 'shape', 'c2', '葉\n　葉\n　　落\n　　　下\n　　　　來\n　　　　　，\n　　　　　　慢\n　　　　　　　慢\n地面地面地面地面地面'),
      P('p6', '"Hope" is the thing with feathers', 'a5', 'modern', null,
        'Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all,\n\nAnd sweetest in the gale is heard;\nAnd sore must be the storm\nThat could abash the little bird\nThat kept so many warm.\n\nI\'ve heard it in the chillest land,\nAnd on the strangest sea;\nYet, never, in extremity,\nIt asked a crumb of me.', 'night')
    ]
  };
}
function splitAuthor(s) {
  s = String(s || '').trim();
  if (!s) return null;
  const m = s.match(DYN_RE);
  return m && m[2].trim() ? { dynasty: m[1], name: m[2].trim() } : { dynasty: '', name: s };
}
async function migrate() {
  DB.collections = DB.collections || [];
  DB.authors = DB.authors || [];
  DB.prefs = Object.assign({ scope: 'author', last: null, defaultFont: 'kai' }, DB.prefs || {});
  if ((DB.version || 1) < 2) {
    if (serverMode) { try { await fetch('api/backup?tag=v0.1', { method: 'POST' }); } catch (e) {} }
    else { try { localStorage.setItem('shiye-data-before-v0.2', JSON.stringify(DB)); } catch (e) {} }
    let t = Date.now() - DB.poems.length * 1000;
    // v0.1 kept newest first; keep reading order oldest → newest
    [...DB.poems].reverse().forEach(p => { if (!p.created) p.created = t; t += 1000; });
    DB.poems.forEach(p => {
      if (p.authorId === undefined) {
        const sp = splitAuthor(p.author);
        p.authorId = sp ? resolveAuthor(sp.name, sp.dynasty) : null;
      }
      delete p.author;
      p.fav = !!p.fav;
    });
    DB.version = 2;
    save(true);
    toast('已升級到新版資料格式，舊資料另外備份了一份');
  }
  if (DB.version < 3) {
    if (!PRINT) { if (serverMode) { try { await fetch('api/backup?tag=v0.2', { method: 'POST' }); } catch (e) {} } else { try { localStorage.setItem('shiye-data-before-v0.3', JSON.stringify(DB)); } catch (e) {} } }
    DB.prefs.defaultFont = 'kai';
    let fixed = 0;
    DB.poems.forEach(p => {
      // 標題裡的「◎作者」拆出來
      const m = String(p.title || '').match(/^(.*?)[ \t\u3000]*[◎○]\s*([^\s◎○]{1,16})\s*$/);
      if (m && m[1].trim()) {
        p.title = m[1].trim(); fixed++;
        const a = authorOf(p);
        if (!a) p.authorId = resolveAuthor(m[2], '');
        const lines = String(p.text || '').split('\n');
        const i = lines.findIndex(l => l.trim());
        if (i >= 0 && lines[i].replace(/[\s\u3000◎○]/g, '').replace(m[2], '') === p.title.replace(/[\s\u3000]/g, '')) { lines.splice(i, 1); p.text = lines.join('\n').replace(/^\n+/, ''); }
      }
    });
    DB.version = 3;
    if (!PRINT) { save(true); if (fixed) setTimeout(() => toast(`已修正 ${fixed} 首標題裡的「◎作者」，並把所有詩預設改成楷體`, 5000), 600); }
  }
  // 回收桶裡超過 30 天的詩自動清掉
  const cutoff = Date.now() - 30 * 864e5;
  const before = DB.poems.length;
  DB.poems = DB.poems.filter(p => !p.deleted || p.deleted > cutoff);
  if (DB.poems.length !== before && !PRINT) save();
  DB.poems.forEach(p => { p.layout = Object.assign(defLayout(p.type), p.layout || {}); });
  const nd = dedupeAuthors(DB);
  if (nd && !PRINT) { save(); setTimeout(() => toast(`已自動合併 ${nd} 位重複的作者`, 5000), 800); }
}
async function load() {
  try {
    const r = await fetch('api/data', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    DB = await r.json();
  } catch (e) {
    serverMode = false;
    try { DB = JSON.parse(localStorage.getItem('shiye-data')); } catch (e2) { DB = null; }
  }
  if (!DB || !Array.isArray(DB.poems)) { DB = serverMode ? seed() : { version: 3, authors: [], collections: [], poems: [], prefs: { scope: 'author', last: null, defaultFont: 'kai' } }; save(true); }
  await migrate();
}
let saveT = null, savePending = null;
function save(now) {
  if (PRINT) return;
  clearTimeout(saveT);
  const run = () => {
    savePending = null;
    const body = JSON.stringify(DB);
    if (serverMode) {
      fetch('api/data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
        .then(r => { if (!r.ok) throw new Error(); })
        .catch(() => toast('儲存失敗，請確認詩頁程式仍在執行'));
    } else {
      try { localStorage.setItem('shiye-data', body); } catch (e) { toast('瀏覽器儲存空間已滿'); }
    }
  };
  if (now) run(); else { saveT = setTimeout(run, 350); savePending = run; }
  if (window.ShiSync) ShiSync.afterSave();
}
function flushSave() { if (savePending) { clearTimeout(saveT); savePending(); } }
const poemById = id => DB.poems.find(p => p.id === id && !p.deleted);
const anyPoemById = id => DB.poems.find(p => p.id === id);
const colById = id => DB.collections.find(c => c.id === id);
const authorById = id => DB.authors.find(a => a.id === id);
const authorOf = p => p && authorById(p.authorId);
const authorLabel = a => a ? (a.dynasty ? `${a.dynasty} · ${a.name}` : a.name) : '佚名';
const byCreated = (a, b) => (a.created || 0) - (b.created || 0) || (a.id < b.id ? -1 : 1);
// 作者名字比對：忽略前後空白、全形半形、看不見的字元
const normName = s => String(s || '').normalize('NFKC').replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const cleanName = s => String(s || '').replace(/[\u200b-\u200d\u2060\ufeff]/g, '').replace(/[\s\u3000]+/g, ' ').trim();
// 同名同朝代的作者合併成一位（同步時兩台裝置用同一套規則：保留 id 最小的那筆）
function dedupeAuthors(db) {
  const groups = new Map();
  (db.authors || []).forEach(a => { const k = normName(a.name); if (!k) return; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(a); });
  const remap = new Map();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const dyns = [...new Set(list.map(a => normName(a.dynasty)).filter(Boolean))];
    // 只有一種朝代（或都沒填）：全部同一位；有好幾種朝代：同朝代的才合併
    const sets = dyns.length <= 1 ? [list] : dyns.map(d => list.filter(a => normName(a.dynasty) === d));
    for (const set of sets) {
      if (set.length < 2) continue;
      const keep = set.reduce((m, a) => (a.id < m.id ? a : m));
      set.forEach(a => {
        if (a === keep) return;
        if (!keep.dynasty && a.dynasty) keep.dynasty = a.dynasty;
        if ((a.bio || '').trim() && !(keep.bio || '').includes(a.bio.trim())) keep.bio = [keep.bio, a.bio].filter(x => (x || '').trim()).join('\n');
        remap.set(a.id, keep.id);
      });
    }
  }
  if (!remap.size) return 0;
  (db.poems || []).forEach(p => { if (remap.has(p.authorId)) p.authorId = remap.get(p.authorId); });
  db.authors = db.authors.filter(a => !remap.has(a.id));
  return remap.size;
}
function resolveAuthor(name, dynasty) {
  name = cleanName(name); dynasty = String(dynasty || '').trim();
  if (!name || name === '佚名') return null;
  const same = DB.authors.filter(a => normName(a.name) === normName(name));
  let a = same.find(x => x.dynasty === dynasty) || (same.length === 1 && (!dynasty || !same[0].dynasty) ? same[0] : null);
  if (a) { if (!a.dynasty && dynasty) a.dynasty = dynasty; return a.id; }
  a = { id: uid(), name, dynasty, bio: '' }; DB.authors.push(a); return a.id;
}
const poemsOfAuthor = id => live().filter(p => (p.authorId || null) === (id || null));

// ---------- poem text parsing ----------
function parseLine(line) {
  const lead = line.match(/^[ \t　]*/)[0];
  let ind = 0;
  for (const ch of lead) ind += ch === '　' ? 1 : ch === '\t' ? 2 : .5;
  return { ind, text: line.slice(lead.length).replace(/[ \t　]+$/, '') };
}
function stanzas(text) {
  const out = []; let cur = [], blanks = 0;
  for (const raw of String(text || '').replace(/\r/g, '').split('\n')) {
    if (/^[\s　]*$/.test(raw)) { if (cur.length) { out.push({ lines: cur }); cur = []; blanks = 1; } else if (out.length) blanks++; continue; }
    if (!cur.length && out.length && blanks > 1) out[out.length - 1].nextMul = blanks;
    blanks = 0; cur.push(parseLine(raw));
  }
  if (cur.length) out.push({ lines: cur });
  out.forEach((s, i) => { s.gapMul = i > 0 ? (out[i - 1].nextMul || 1) : 0; });
  return out;
}
function linesHTML(sts, L, lhpx, opts = {}) {
  const hang = L.hang ? (opts.v ? 1 : 2) : 0;
  let g = GAP[L.gap][1]; if (opts.ruled) g = Math.max(1, Math.round(g));
  let h = '', li = opts.li0 || 0;
  sts.forEach(s => s.lines.forEach((ln, i) => {
    const ind = L.keep ? ln.ind : 0;
    const mt = i === 0 && s.gapMul ? `margin-block-start:${(lhpx * g * Math.min(s.gapMul, 3)).toFixed(1)}px;` : '';
    h += `<div class="ln" data-li="${li}" style="padding-inline-start:${ind + hang}em;text-indent:-${hang}em;${mt}white-space:${L.keep ? 'pre-wrap' : 'normal'}">${lineInner(ln.text, li, opts) || '&nbsp;'}</div>`;
    li++;
  }));
  return h || '<div class="ln" style="opacity:.5">（尚無內容）</div>';
}
function layoutOf(p) {
  const L = Object.assign(defLayout(p.type), p.layout || {});
  // 閱讀方向和風格分開：舊資料用「直排古籍」的詩預設直排
  if (L.dir !== 'v' && L.dir !== 'h') L.dir = L.style === 'vertical' ? 'v' : 'h';
  if (p.type === 'shape' || L.style === 'shape') L.dir = 'h';
  if (L.seal == null) L.seal = L.style === 'vertical';
  if (L.bi !== 'off') L.bi = 'on';
  return L;
}
const isVert = (p, L) => L.dir === 'v' && !(p.trans && p.trans.trim() && L.bi === 'on');
// 直排時：一兩位數的數字橫著擠成一格，三位數以上每個字直立
const vDigits = h => h.replace(/\d+/g, m => m.length <= 2 ? `<span class="tcy">${m}</span>` : `<span class="upr">${m}</span>`);
// 一行的內容：加上劃線
function lineInner(text, li, opts) {
  const v = !!opts.v, marks = (opts.marks || []);
  const fmt = t => v ? vDigits(esc(t)) : esc(t);
  const segs = [];
  marks.forEach(m => (m.segs || []).forEach(g => {
    if (g.li !== li) return;
    let a = g.s, b = g.e;
    if (text.slice(a, b) !== g.t) { const k = text.indexOf(g.t); if (k < 0 || !g.t) return; a = k; b = k + g.t.length; }
    segs.push({ a, b, id: m.id, note: !!(m.note && m.note.trim()) });
  }));
  if (!segs.length) return fmt(text);
  segs.sort((x, y) => x.a - y.a);
  let out = '', pos = 0;
  segs.forEach(g => {
    if (g.a < pos) return;
    out += fmt(text.slice(pos, g.a)) + `<mark class="hl${g.note ? ' has-note' : ''}" data-mid="${g.id}">${fmt(text.slice(g.a, g.b))}</mark>`;
    pos = g.b;
  });
  return out + fmt(text.slice(pos));
}

// ---------- poem article ----------
let RS = 0; // recite stanza index
function articleHTML(p, L, opts = {}) {
  const st = STYLES[L.style] || STYLES.classic;
  const font = FONTS[fontKey(L, st)][1];
  const align = L.align || st.align;
  const size = L.size, lh = LH[L.lh][1], lhpx = size * lh;
  const sts = stanzas(p.text);
  const col = p.collectionId && colById(p.collectionId);
  const au = authorOf(p);
  const base = `background:${st.bg};color:${st.fg};`;
  const bodyCss = `font-size:${size}px;line-height:${lhpx}px;letter-spacing:${st.ls}em;`;
  const titleCss = `font-size:${size + 12}px;letter-spacing:${Math.max(st.ls, .06)}em;font-family:${font}`;
  const author = au ? `<div class="pa">${esc(authorLabel(au))}</div>` : '';
  const idAttr = opts.anchor ? ` id="f-${p.id}" data-pid="${p.id}"` : '';
  const vd = isVert(p, L) && L.style !== 'shape';
  const lo = { v: vd, marks: opts.noMarks ? [] : (p.marks || []) };
  const bi = p.trans && p.trans.trim() && L.bi === 'on' && L.style !== 'shape' && L.style !== 'recite';

  if (L.style === 'magazine' && !vd) {
    return `<article class="art magazine"${idAttr} style="${base}">
      <div class="mag-head"><span>詩頁${col ? '　·　' + esc(col.name) : ''}</span><span>${TYPES[p.type]}</span></div>
      <h1 class="mag-title">${esc(p.title || '無題')}</h1>
      ${au ? `<div style="margin-top:12px;font-size:15px;color:#55524B">${au.dynasty ? esc(au.dynasty) + '　' : '文　'}${esc(au.name)}</div>` : ''}
      <div class="mag-rule"></div>
      <div style="${bodyCss}font-family:${font};${bi ? '' : 'max-width:34em;'}text-align:${align}">${bi ? biHTML(p, sts, L, lhpx, lo) : linesHTML(sts, L, lhpx, lo)}</div>
      ${L.seal ? `<div class="seal">${SEAL}</div>` : ''}
    </article>`;
  }
  if (L.style === 'recite') {
    const n = Math.max(sts.length, 1); RS = clamp(RS, 0, n - 1);
    const one = sts.length ? [{ lines: sts[RS].lines, gapMul: 0 }] : [];
    const li0 = sts.slice(0, RS).reduce((a, x) => a + x.lines.length, 0);
    const big = Math.round(size * 1.7), bl = big * lh;
    return `<article class="art recite"${idAttr} style="${base}">
      <div style="font-size:13px;letter-spacing:.25em;color:#9A968C">${esc(p.title || '無題')}${au ? '　·　' + esc(au.name) : ''}　·　第 ${RS + 1} / ${n} 節</div>
      <div class="${vd ? 'rc-v' : ''}" style="font-family:${font};font-size:${big}px;line-height:${bl}px;letter-spacing:${st.ls}em;text-align:${align};margin:40px 0">${linesHTML(one, L, bl, Object.assign({}, lo, { li0 }))}</div>
      <div class="rc-nav no-print">
        <button type="button" data-act="rc-prev" aria-label="上一節">${IC.back}</button>
        <div class="rc-bar"><div style="width:${Math.round((RS + 1) / n * 100)}%"></div></div>
        <button type="button" class="next" data-act="rc-next" aria-label="下一節">${IC.next}</button>
      </div>
    </article>`;
  }
  if (L.style === 'shape') {
    return `<article class="art shape"${idAttr} style="${base}">
      <div style="align-self:stretch;display:flex;justify-content:space-between;font-size:12px;color:#6B675E"><span>圖像詩　·　固定版面</span><span>不重新斷行</span></div>
      <h1 style="${titleCss}">${esc(p.title || '無題')}</h1>
      <pre class="shape-pre" style="font-family:${font};font-size:${Math.round(size * 1.3)}px">${esc(p.text) || '（尚無內容）'}</pre>
      ${author}
    </article>`;
  }
  const ruled = L.style === 'manuscript';
  const ruleCss = !ruled ? '' : vd ? `background-image:linear-gradient(to left,transparent ${lhpx - 1}px,#D9C9AE ${lhpx - 1}px);background-size:${lhpx}px 100%;background-position:right top;` : `background-image:linear-gradient(to bottom,transparent ${lhpx - 1}px,#D9C9AE ${lhpx - 1}px);background-size:100% ${lhpx}px;`;
  const items = align === 'center' ? 'align-items:center;' : 'align-items:flex-start;align-self:stretch;';
  const tCss = L.style === 'magazine' ? 'font-family:var(--sans);font-weight:900;' : '';
  if (vd) return `<article class="art ${L.style} vdir"${idAttr} style="${base}">
    <div class="pb" style="text-align:${align};font-family:${font}">
      <div class="ph"><h1 style="${titleCss};${tCss}">${esc(p.title || '無題')}</h1>${author}</div>
      <div class="vbody" style="${bodyCss}${ruleCss}">${linesHTML(sts, L, lhpx, Object.assign({ ruled }, lo))}</div>
      ${L.seal ? `<div class="seal-v">${SEAL}</div>` : ''}
    </div>
  </article>`;
  return `<article class="art ${L.style}${bi ? ' bi-on' : ''}"${idAttr} style="${base}">
    <div class="pb" style="${bi ? 'align-items:stretch;align-self:stretch;width:100%;' : items}text-align:${align};font-family:${font}">
      <div class="ph"><h1 style="${titleCss}">${esc(p.title || '無題')}</h1>${author}</div>
      <div style="${bodyCss}${ruleCss}">${bi ? biHTML(p, sts, L, lhpx, lo) : linesHTML(sts, L, lhpx, Object.assign({ ruled }, lo))}</div>
    </div>
    ${L.seal ? `<div class="seal">${SEAL}</div>` : ''}
  </article>`;
}

// 對照譯文：原文和譯文一行對一行
function biHTML(p, sts, L, lhpx, lo) {
  const tr = stanzas(p.trans);
  const flat = ss => ss.flatMap((s, si) => s.lines.map((ln, i) => ({ ln, gap: i === 0 && si > 0 ? Math.min(s.gapMul || 1, 3) : 0 })));
  const A = flat(sts), B = flat(tr);
  // 節數一樣時一節對一節；不一樣就一行對一行
  const rows = [];
  if (sts.length === tr.length) {
    sts.forEach((s, si) => { const n = Math.max(s.lines.length, tr[si].lines.length); for (let i = 0; i < n; i++) rows.push({ a: s.lines[i], b: tr[si].lines[i], gap: i === 0 && si > 0 ? Math.min(s.gapMul || 1, 3) : 0 }); });
  } else { const n = Math.max(A.length, B.length); for (let i = 0; i < n; i++) rows.push({ a: A[i] && A[i].ln, b: B[i] && B[i].ln, gap: (A[i] || B[i]).gap }); }
  const g = GAP[L.gap][1], hang = L.hang ? 2 : 0, ws = L.keep ? 'pre-wrap' : 'normal';
  let li = 0;
  const cell = (ln, cls, isA) => {
    if (!ln) return `<div class="ln ${cls}">&nbsp;</div>`;
    const ind = L.keep ? ln.ind : 0;
    const inner = isA ? lineInner(ln.text, li++, lo) : esc(ln.text);
    return `<div class="ln ${cls}"${isA ? ` data-li="${li - 1}"` : ''} style="padding-inline-start:${ind + hang}em;text-indent:-${hang}em;white-space:${ws}">${inner || '&nbsp;'}</div>`;
  };
  return `<div class="bi">${rows.map(r => `<div class="bi-row" style="${r.gap ? `margin-top:${(lhpx * g * r.gap).toFixed(1)}px` : ''}">${cell(r.a, 'bi-a', true)}${cell(r.b, 'bi-b', false)}</div>`).join('')}</div>`;
}

// ---------- covers ----------
function darker(hex, k = .7) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.round(v * k).toString(16).padStart(2, '0');
  return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
}
function coverHTML(c, size, opts = {}) {
  const cv = c.cover;
  const ink = cv.ink === 'dark' ? '#1C1B19' : '#F6F1E6';
  const just = { top: 'flex-start', middle: 'center', bottom: 'flex-end', none: 'flex-start' }[cv.pos] || 'flex-start';
  const img = cv.img ? `<img data-img="${esc(cv.img)}" alt="" style="object-position:${cv.x}% ${cv.y}%;transform:scale(${cv.zoom / 100})">` : '';
  const text = cv.pos === 'none' ? '' : `<div class="ct1">${esc(c.name)}</div>${c.author ? `<div class="ct2">${esc(c.author)}</div>` : ''}`;
  return `<div class="cover ${size}${opts.drag && cv.img ? ' drag' : ''}" ${opts.drag ? 'id="bigcover"' : ''} style="background:${cv.color}">${img}<div class="ctext" style="justify-content:${just};color:${ink}">${text}</div></div>`;
}

// ---------- import: text files ----------
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tif', 'tiff', 'heic'];
async function decodeText(buf) { return ShiImport.decodeBytes(new Uint8Array(buf)); }
const extOf = f => (f.name.split('.').pop() || '').toLowerCase();
const isImage = f => IMG_EXT.includes(extOf(f)) || /^image\//.test(f.type);
async function readFile(file) {
  const ext = extOf(file);
  if (ext === 'docx') {
    if (!serverMode) throw new Error('需要開啟詩頁程式才能匯入 .docx');
    const fd = new FormData(); fd.append('file', file);
    const r = await fetch('api/docx', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('無法讀取這個 Word 檔');
    return { text: (await r.json()).text, ext };
  }
  if (['txt', 'md', 'markdown', 'text'].includes(ext) || file.type.startsWith('text/')) {
    return { text: await decodeText(await file.arrayBuffer()), ext };
  }
  if (ext === 'doc') throw new Error('舊版 .doc 請先另存為 .docx');
  if (ext === 'pdf') throw new Error('這一版還不支援 PDF，請先轉成 .txt、.docx，或截圖用圖片辨識');
  throw new Error('不支援的檔案格式：.' + ext);
}
const guessType = (text, dyn) => ShiImport.guessType(text, dyn);
const CAMERA_NAME = /^(IMG|DSC|DCIM|PXL|MVIMG|Screenshot|Screen Shot|螢幕擷取|截圖|擷取|photo|image|scan)[\s_\-]?/i;
function parseImported(text, filename, ext) {
  text = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (ext === 'md' || ext === 'markdown') {
    text = text.replace(/^[ \t]*#{1,6}[ \t]+(.+)$/m, '$1\n').replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/^>\s?/gm, '');
  }
  const r = ShiImport.parsePoemFile(text, filename);
  const base = String(filename || '').split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
  if (r.flags.includes('title-guessed') === false && CAMERA_NAME.test(r.title) && r.title === base) r.title = '無題';
  // 內文開頭的「作者：某某」
  if (!r.authorName) { const m = r.text.match(/^[ \t　]*(?:作者|文)[ \t　]*[:：][ \t　]*([^\n]{1,20}?)[ \t　]*(?:\n|$)/); if (m) { r.authorName = m[1].trim(); r.text = r.text.slice(m[0].length).replace(/^\s*\n/, ''); } }
  return { title: r.title, authorName: r.authorName, dynasty: r.dynasty, authorNick: r.authorNick, text: r.text, type: r.type, source: r.source, date: r.date, tags: r.tags, note: r.note, flags: r.flags };
}
// 從別的 App 分享過來的文字：短的第一行當標題，「作者：」行當作者
function parseShared(text, opt = {}) {
  const sm = ShiImport.smartParse(text, opt);
  let p;
  if (sm.title) p = { title: sm.title, authorName: sm.authorName, dynasty: '', text: sm.text, type: ShiImport.guessType(sm.text, ''), source: sm.source, date: '', tags: [], note: sm.note, flags: [] };
  else {
    const t = sm.text;
    const ls0 = t.split('\n'), first = (ls0[0] || '').trim(), second = (ls0[1] || '').trim();
    // 第一行後面空一行（或下一行是作者）才當標題，不然整段都是詩
    const short = first && first.length <= 20 && ls0.length > 1 && (!second || /^(?:作者|文)[:：]/.test(second) || (/^[\u4e00-\u9fff]{2,4}$/.test(second) && !(ls0[2] || '').trim()));
    p = parseImported(t, short ? first + '.txt' : '', 'txt');
    if (!short) { p.title = '無題'; p.text = t; }
    if (sm.authorName && !p.authorName) p.authorName = sm.authorName;
    p.note = [sm.note, p.note].filter(Boolean).join('\n'); p.source = p.source || sm.source;
  }
  // 從「每日推薦」來的：標題、作者用推薦的
  const rec = opt.rec;
  if (rec) {
    const k = ShiImport.normKey(rec.title);
    if (!p.title || p.title === '無題' || ShiImport.normKey(p.title) !== k) {
      if (p.title && p.title !== '無題' && ShiImport.normKey(p.title) !== k && !ShiImport.normKey(p.text).startsWith(ShiImport.normKey(p.title))) p.text = p.title + '\n' + p.text;
      p.title = rec.title;
    }
    if (!p.authorName) p.authorName = rec.author;
    if (!p.source && rec.src) p.source = rec.src;
    p.type = 'modern';
  }
  p.shared = true;
  return p;
}
const SEP = /^[ \t　]*(?:-{3,}|\*{3,}|＊{3,}|＝{3,}|={3,}|※{1,3})[ \t　]*$/gm;
const splitMulti = text => text.replace(/\r\n?/g, '\n').split(SEP).filter(s => s.trim());

// ---------- import: images (文字辨識) ----------
async function shrinkImage(file, max = 3000, type = 'image/png') {
  let bmp;
  try { bmp = await createImageBitmap(file); } catch (e) { throw new Error('讀不出這張圖片，請改用 JPG 或 PNG'); }
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise(res => c.toBlob(res, type, .88));
}
const OCR_ERR = {
  NOTWINDOWS: '圖片辨識使用 Windows 內建的文字辨識，只能在 Windows 版詩頁中使用',
  NOENGINE: '這台電腦還沒有繁體中文的文字辨識功能。請到 Windows「設定 → 時間與語言 → 語言與地區」，在「中文（繁體，台灣）」的語言選項裡安裝語言功能後再試一次',
  TIMEOUT: '辨識超過時間，請換一張比較小或比較清楚的圖片',
  FAILED: '辨識失敗，請換一張比較清楚的圖片再試'
};
async function uploadImageBlob(blob, name) {
  if (!serverMode) return ShiSync.storeImage(blob);
  const fd = new FormData(); fd.append('file', blob, name || 'image.png');
  const r = await fetch('api/image', { method: 'POST', body: fd });
  if (!r.ok) throw new Error('圖片儲存失敗');
  return (await r.json()).url;
}
const isWordy = ch => /[A-Za-z0-9'’]/.test(ch || '');
function joinWords(words) {
  let s = '';
  words.forEach(w => { const t = w.text || ''; if (s && isWordy(s.slice(-1)) && isWordy(t[0])) s += ' '; s += t; });
  return s;
}
const median = a => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
// 把辨識結果的每一行，依位置推回縮排與分節
function ocrToText(lines, gapK = 1.65, robust = false) {
  lines = (lines || []).filter(l => (l.words || []).length || l.text);
  if (!lines.length) return { text: '', vertical: false };
  lines.forEach(l => {
    const ws = l.words && l.words.length ? l.words : [{ text: l.text, x: l.x, y: l.y, w: l.w, h: l.h }];
    l.words = ws; l.x = Math.min(...ws.map(w => w.x)); l.y = robust ? median(ws.map(w => w.y)) : Math.min(...ws.map(w => w.y));
    l.h = Math.max(...ws.map(w => w.y + w.h)) - l.y; l.str = joinWords(ws);
  });
  lines.sort((a, b) => a.y - b.y);
  const cjkW = lines.flatMap(l => l.words.filter(w => /^[　-鿿豈-﫿]$/.test(w.text)).map(w => w.w));
  const charW = median(cjkW) || median(lines.map(l => l.h)) || 1;
  const minX = Math.min(...lines.map(l => l.x));
  const dys = lines.slice(1).map((l, i) => l.y - lines[i].y).filter(d => d > 0);
  const step = (robust ? [...dys].sort((a, b) => a - b)[Math.floor(dys.length * .3)] : median(dys)) || charW * 2;
  const out = [];
  lines.forEach((l, i) => {
    if (i > 0 && l.y - lines[i - 1].y > step * gapK) out.push('');
    const ind = Math.round((l.x - minX) / charW);
    out.push((ind > 0 ? '　'.repeat(Math.min(ind, 24)) : '') + l.str.trim());
  });
  const short = lines.filter(l => l.str.trim().length <= 2).length;
  return { text: out.join('\n'), vertical: lines.length >= 4 && short / lines.length > .6 };
}
async function ocrFile(file) {
  if (!serverMode) {
    const blob = await shrinkImage(file, 2400, 'image/jpeg');
    const sourceImg = await ShiSync.storeImage(blob);
    // 先在手機上辨識；失敗（例如第一次使用又沒網路）就留給電腦版
    const got = await ShiX.phoneOCR(blob).catch(() => null);
    if (got && got.text.trim()) {
      const d = parseShared(got.text, { ocr: true });
      return Object.assign(d, { sourceImg, ocr: true, phoneOcr: true, vertical: got.vertical, tags: [...(d.tags || [])], shared: false });
    }
    return { title: '待辨識的照片', authorName: '', dynasty: '', text: '', type: 'modern', source: '', date: '', tags: ['待辨識'], note: '', flags: [], sourceImg, ocr: true, pendingOCR: true };
  }
  toast('辨識中，請稍候…', 60000);
  const blob = await shrinkImage(file);
  const fd = new FormData(); fd.append('file', blob, 'scan.png');
  const r = await fetch('api/ocr', { method: 'POST', body: fd });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(OCR_ERR[j.error] || OCR_ERR.FAILED);
  const res = ocrToText(j.lines);
  if (!res.text.trim()) throw new Error('這張圖片裡沒有辨識出文字');
  const sourceImg = await uploadImageBlob(blob, 'source.png');
  const d = parseImported(res.text, file.name, 'txt');
  return Object.assign(d, { sourceImg, ocr: true, vertical: res.vertical, ocrLang: j.lang || '' });
}

// ---------- import: entry point ----------
function newPoem(d, colId) {
  const type = d.type || 'modern';
  const authorId = d.authorId !== undefined ? d.authorId : resolveAuthor(d.authorName, d.dynasty);
  if (d.authorNick && authorId) { const a = authorById(authorId); if (a && !a.bio) a.bio = `PTT 暱稱：${d.authorNick}`; }
  const now = Date.now();
  return { id: uid(), title: d.title || '無題', authorId, type, collectionId: colId || null, tags: [...(d.tags || [])], text: d.text || '', layout: defLayout(type), fav: false,
    source: d.source || '', date: d.date || '', note: d.note || '', illustration: d.illustration || null, sourceImg: d.sourceImg || null, trans: d.trans || '', created: d.created || now, updated: now };
}
let PENDING = null; // draft passed to editor
async function importFiles(files, colId) {
  files = [...files]; if (!files.length) return;
  const drafts = [];
  for (const f of files) {
    try {
      if (isImage(f)) { drafts.push(await ocrFile(f)); continue; }
      const { text, ext } = await readFile(f);
      const parts = splitMulti(text);
      if (parts.length > 1 && confirm(`「${f.name}」裡偵測到 ${parts.length} 首詩，要分開匯入嗎？`)) {
        parts.forEach((t, i) => drafts.push(parseImported(t, f.name.replace(/\.[^.]+$/, '') + '-' + (i + 1), ext)));
      } else drafts.push(parseImported(text, f.name, ext));
    } catch (e) { toast(e.message || '匯入失敗', 6000); }
  }
  if (!drafts.length) return;
  if (drafts.length === 1) { PENDING = Object.assign(drafts[0], { collectionId: colId || null }); go('#/new'); $('#toast').classList.remove('show'); return; }
  drafts.forEach(d => {
    const p = newPoem(d, colId);
    if (d.ocr) p.tags = d.pendingOCR ? ['待辨識'] : ['待校對'];
    if (d.text && findDup(d.text)) p.tags.push('可能重複');
    DB.poems.push(p);
  });
  save(); render();
  const nOcr = drafts.filter(d => d.ocr).length, nPend = drafts.filter(d => d.pendingOCR).length;
  toast(nPend ? `已存下 ${nPend} 張照片，電腦版詩頁開著時會自動辨識成文字` : `已匯入 ${drafts.length} 首${nOcr ? `，其中 ${nOcr} 首來自圖片辨識，已加上「待校對」標籤` : ''}`, 5000);
}

// ---------- routing ----------
const go = h => { if (location.hash === h) render(); else location.hash = h; };
window.addEventListener('hashchange', () => { RS = 0; SEL.on = false; SEL.ids.clear(); render(); if (route().view !== 'flow') window.scrollTo(0, 0); });
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const [view, id] = path.split('/');
  return { view: view || 'home', id: id ? decodeURIComponent(id) : id, q: new URLSearchParams(qs || '') };
}
let flowObs = null;
function render() {
  const r = route();
  const app = $('#app');
  if (flowObs) { flowObs.disconnect(); flowObs = null; }
  if (r.view === 'read' && poemById(r.id)) { const p = poemById(r.id); setLast(p); app.innerHTML = readerView(p); }
  else if (r.view === 'flow' && poemById(r.id)) { app.innerHTML = flowView(poemById(r.id)); bindFlow(r.id); }
  else if (r.view === 'edit' && poemById(r.id)) { app.innerHTML = editorView(startEdit(poemById(r.id))); edRefresh(); }
  else if (r.view === 'new') {
    // 「存到詩頁」捷徑：#/new?text=…
    if (r.q.get('text') && !PENDING) {
      const rec = ShiX.pendingRec(), txt = r.q.get('text');
      const hit = rec && ShiImport.normKey(txt).includes(ShiImport.normKey(rec.title));
      PENDING = parseShared(txt, { page: r.q.get('page') === '1', title: rec && rec.title, rec: hit ? rec : null });
      if (hit) { PENDING.fromRec = rec; ShiX.clearRec(); } else if (rec) PENDING.recAsk = rec; if (r.q.get('title')) PENDING.title = r.q.get('title'); if (r.q.get('source') && !PENDING.source) PENDING.source = r.q.get('source'); history.replaceState(null, '', '#/new'); }
    app.innerHTML = editorView(startNew(r.q.get('col'), r.q.get('author'))); edRefresh();
  }
  else if (r.view === 'col' && colById(r.id)) { app.innerHTML = colView(colById(r.id)); bindCoverDrag(colById(r.id)); }
  else if (r.view === 'author' && (authorById(r.id) || r.id === 'none')) { app.innerHTML = authorView(r.id === 'none' ? null : authorById(r.id)); }
  else if (r.view === 'authors') { app.innerHTML = authorsView(); }
  else if (r.view === 'trash') { app.innerHTML = trashView(); }
  else if (r.view === 'sync') { app.innerHTML = syncView(); }
  else if (r.view === 'history') { app.innerHTML = ShiX.historyView(r.id); ShiX.historyLoad(r.id); }
  else if (r.view === 'cols') { app.innerHTML = colsView(); }
  else if (r.view === 'search') { app.innerHTML = searchView(); const q = $('#q'); if (q && !HF.q) setTimeout(() => q.focus(), 50); }
  else if (r.view === 'favs') { app.innerHTML = ShiR.libView(r.q.get('tab')); }
  else if (r.view === 'memo' && poemById(r.id)) { app.innerHTML = ShiR.memoView(poemById(r.id)); }
  else if (r.view === 'today') { const tp = ShiR.todayPoem(); location.replace(tp ? '#/read/' + tp.id : '#/'); return; }
  else if (r.view === 'import' && IMP) { app.innerHTML = importView(); }
  else if (r.view === 'print') { renderPrint(r); return; }
  else {
    if (ShiR.maybeAutoToday(r)) return;
    if (r.q.get('src') !== null) { HF.src = r.q.get('src') || 'all'; HF.type = 'all'; HF.col = 'all'; HF.author = 'all'; HF.dyn = 'all'; HF.q = ''; }
    app.innerHTML = homeView();
    if (r.q.get('src') !== null) requestAnimationFrame(() => { const g = $('#grid'); if (g) g.closest('section').scrollIntoView({ block: 'start' }); });
  }
  bindDrops();
  selBar();
  mobileChrome(r);
}
function setLast(p) { if (DB.prefs.last !== p.id) { DB.prefs.last = p.id; save(); } }

// ---------- shared bits ----------
function topbar(extra = '') {
  return `<header class="bar"><div class="bar-in">
    <div class="row" style="gap:12px"><a class="brand" href="#/"><span class="brand-mark">${SEAL}</span><span class="brand-name">詩頁</span></a><span class="syncpill-slot">${syncPillHTML()}</span></div>
    ${extra}
  </div></header>`;
}
function cardHTML(p) {
  const L = layoutOf(p), st = STYLES[L.style];
  if (SEL.on) return cardInner(p, L, st, true);
  return cardInner(p, L, st, false);
}
function cardInner(p, L, st, sel) {
  const sts = stanzas(p.text);
  const ex = (sts[0] ? sts[0].lines.slice(0, 3) : []).map(l => (L.keep ? '　'.repeat(Math.round(l.ind)) : '') + l.text).join('\n');
  const vert = L.dir === 'v';
  const review = (p.tags || []).includes('待校對');
  const on = sel && SEL.ids.has(p.id);
  const open = sel ? `<button type="button" class="pcard sel${on ? ' on' : ''}" data-act="sel-toggle" data-id="${p.id}" aria-pressed="${on}"><span class="selbox" aria-hidden="true">${on ? '✓' : ''}</span>` : `<a class="pcard" href="#/read/${p.id}" data-id="${p.id}">`;
  return `${open}
    <div class="pcard-art" style="background:${st.bg};color:${st.fg};font-family:${FONTS[fontKey(L, st)][1]};${vert ? 'writing-mode:vertical-rl;letter-spacing:.2em' : ''}">${esc(ex)}</div>
    <div class="pcard-meta">
      <div class="pcard-title">${p.fav ? '<span class="favdot" aria-label="已收藏">★</span>' : ''}${esc(p.title)}</div>
      <div class="muted">${esc(authorLabel(authorOf(p)))} · ${TYPES[p.type]} · ${st.name}</div>
      ${p.source ? `<div class="muted psrc-mini">${esc(p.source)}</div>` : ''}
      ${review ? '<div><span class="tag warn">待校對</span></div>' : ''}
    </div>
  ${sel ? '</button>' : '</a>'}`;
}

// ---------- home ----------
const HF = { type: 'all', col: 'all', author: 'all', dyn: 'all', src: 'all', q: '' };
function filtered() {
  const q = HF.q.trim().toLowerCase();
  return live().filter(p => {
    const a = authorOf(p);
    return (HF.type === 'all' || (HF.type === 'fav' ? p.fav : p.type === HF.type))
      && (HF.col === 'all' || (HF.col === 'none' ? !p.collectionId : p.collectionId === HF.col))
      && (HF.author === 'all' || (HF.author === 'none' ? !a : p.authorId === HF.author))
      && (HF.dyn === 'all' || (HF.dyn === 'none' ? !(a && a.dynasty) : a && a.dynasty === HF.dyn))
      && (HF.src === 'all' || (HF.src === 'none' ? !srcKey(p.source) : srcKey(p.source) === HF.src))
      && (!q || (p.title + ' ' + authorLabel(a) + ' ' + p.text + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q));
  }).sort((x, y) => byCreated(y, x));
}
function authHitsHTML() {
  const q = HF.q.trim().toLowerCase(); if (!q) return '';
  const hits = DB.authors.filter(a => (a.name + ' ' + a.dynasty).toLowerCase().includes(q));
  if (!hits.length) return '';
  return `<div class="row"><span class="muted">符合的作者：</span>${hits.map(a => `<a class="chip link" href="#/author/${a.id}">${esc(authorLabel(a))}　${poemsOfAuthor(a.id).length} 首</a>`).join('')}</div>`;
}
function gridHTML() {
  const ps = filtered();
  return ps.length ? ps.map(cardHTML).join('') : `<div class="empty" style="grid-column:1/-1">${live().length ? '沒有符合的詩篇' : '還沒有詩，從上方放入第一首吧'}</div>`;
}
function refreshGrid() { $('#grid').innerHTML = gridHTML(); $('#authhits').innerHTML = authHitsHTML(); }
function cnDate(d) {
  const cn = n => '〇一二三四五六七八九十'[n];
  const num = n => n <= 10 ? cn(n) : n < 20 ? '十' + cn(n - 10) : n % 10 === 0 ? cn(n / 10) + '十' : cn(Math.floor(n / 10)) + '十' + cn(n % 10);
  return `${num(d.getMonth() + 1)}月${num(d.getDate())}日`;
}
function authorChips(limit) {
  const list = DB.authors.map(a => ({ a, n: poemsOfAuthor(a.id).length })).filter(x => x.n).sort((x, y) => y.n - x.n || x.a.name.localeCompare(y.a.name, 'zh-Hant'));
  const anon = poemsOfAuthor(null).length;
  const shown = limit ? list.slice(0, limit) : list;
  return shown.map(({ a, n }) => `<a class="authchip" href="#/author/${a.id}"><span class="an">${esc(a.name)}</span><span class="ad">${esc(a.dynasty || '　')}</span><span class="ac">${n} 首</span></a>`).join('')
    + (anon && !limit ? `<a class="authchip" href="#/author/none"><span class="an">佚名</span><span class="ad">　</span><span class="ac">${anon} 首</span></a>` : '');
}
function homeView() {
  const ps = live();
  const today = ShiR.todayPoem();
  const last = DB.prefs.last && poemById(DB.prefs.last);
  let hero = '';
  if (today) {
    const lines = (stanzas(today.text)[0] || { lines: [] }).lines.slice(0, 4);
    const vert = today.type === 'classic';
    hero = `<div class="card hero">
      <div class="hero-info">
        <div class="kicker">今日一詩 · ${cnDate(new Date())}</div>
        <h1>${esc(today.title)}</h1>
        <div style="color:var(--ink2);font-size:15px">${esc(authorLabel(authorOf(today)))}</div>
        <div class="row" style="margin-top:12px"><a class="btn" href="#/read/${today.id}">開始閱讀</a><a class="btn ghost" href="#/edit/${today.id}">編輯</a></div>
        ${last && last.id !== today.id ? `<a class="resume" href="#/read/${last.id}">上次讀到〈${esc(last.title)}〉，繼續閱讀 →</a>` : ''}
      </div>
      <div class="hero-poem ${vert ? 'v' : 'h'}" aria-hidden="true">${lines.map(l => `<div>${esc((vert ? '' : '　'.repeat(Math.round(l.ind))) + l.text)}</div>`).join('')}</div>
    </div>`;
  }
  const shelf = DB.collections.map(c => {
    const n = live().filter(p => p.collectionId === c.id).length;
    return `<a class="book" href="#/col/${c.id}">${coverHTML(c, 'sm')}<span style="font-size:13px">${esc(c.name)}</span><span class="muted" style="margin-top:-6px">${n} 首</span></a>`;
  }).join('');
  const sel = (key, opts, cur, label) => `<label class="sr" for="f-${key}">${label}</label><select id="f-${key}" class="fsel" data-in="f-${key}">${opts.map(([v, n]) => `<option value="${esc(v)}"${cur === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const colOpts = [['all', '全部詩集'], ['none', '未分類'], ...DB.collections.map(c => [c.id, c.name])];
  const auOpts = [['all', '全部作者'], ['none', '佚名'], ...[...DB.authors].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')).map(a => [a.id, authorLabel(a)])];
  const dyns = [...new Set(DB.authors.map(a => a.dynasty).filter(Boolean))].sort((a, b) => (DYNASTIES.indexOf(a) + 1 || 99) - (DYNASTIES.indexOf(b) + 1 || 99));
  const dynOpts = [['all', '全部朝代'], ...dyns.map(d => [d, d]), ['none', '未標朝代']];
  const srcs = sourceGroups();
  const srcOpts = [['all', '全部來源'], ...srcs.map(([k, n]) => [k, `${k}（${n}）`]), ['none', '沒有來源']];
  return topbar(`
    <div class="row">
      <label for="q" class="sr">搜尋詩篇</label>
      <input id="q" class="search" data-in="q" placeholder="搜尋詩人、詩題、詩句" value="${esc(HF.q)}">
      <a class="btn dark" href="#/new">${IC.up}新增詩篇</a>
    </div>`) + `
  <main class="page">
    ${!serverMode && !ShiSync.info().configured ? `<a class="onboard" href="#/sync"><b>連接你的詩</b><span>到「同步」貼上 GitHub 密鑰，電腦版的詩就會出現在這裡，出門沒網路也能讀。</span><span class="go">前往設定 →</span></a>` : ''}
    ${last && isMobile() ? `<a class="resume-card m-only" href="#/read/${last.id}"><span class="rbar"></span><span style="flex:1;min-width:0"><span class="muted" style="display:block">繼續閱讀</span><span class="rt">${esc(last.title)}</span></span>›</a>` : ''}
    <section class="wrap" style="align-items:stretch">
      ${hero}
      <div class="drop d-only" data-drop="home" style="flex:1 1 300px;justify-content:center">
        ${IC.file}
        <h3>放入你的詩</h3>
        <p>拖曳檔案、圖片或整個資料夾到這裡。<br>文字檔：.txt、.md、.docx（PTT 文章、報紙副刊格式都認得）。<br>圖片：照片或截圖會自動辨識成文字。<br>匯入資料夾時，重複的詩會自動挑出來。</p>
        <div class="row">
          <label class="btn red sq" for="f-home">選擇檔案或圖片</label>
          <input id="f-home" class="sr" type="file" accept=".txt,.md,.markdown,.docx,.zip,application/zip,text/plain,image/*" multiple data-file="home">
          <label class="btn sq d-only" for="f-folder">匯入整個資料夾</label>
          <input id="f-folder" class="sr" type="file" webkitdirectory directory multiple data-file="folder">
          <a class="btn sq" href="#/new">空白書寫</a>
        </div>
      </div>
    </section>
    ${ShiX.recCardHTML()}
    <section class="sec-block d-only"><div class="row lib-links"><h2 class="sec" style="margin-right:8px">我的書房</h2><a class="btn sq" href="#/favs?tab=favs">★ 收藏的詩（${ps.filter(p => p.fav).length}）</a><a class="btn sq" href="#/favs?tab=marks">劃線與筆記（${ps.reduce((a, p) => a + (p.marks || []).length, 0)}）</a><a class="btn sq" href="#/favs?tab=memo">背過的詩（${ps.filter(p => p.memo && p.memo.n).length}）</a></div></section>

    <section class="sec-block">
      <div class="row" style="justify-content:space-between"><h2 class="sec">詩集</h2></div>
      <div class="shelf">${shelf}<div class="book"><button type="button" class="book-add" data-act="newcol">＋ 新增詩集</button></div></div>
    </section>

    <section class="sec-block">
      <div class="row" style="justify-content:space-between"><h2 class="sec">作者</h2><a href="#/authors">全部作者與朝代 →</a></div>
      <div class="authgrid">${authorChips(10) || '<span class="muted">還沒有作者</span>'}</div>
    </section>

    ${srcs.length ? `<section class="sec-block">
      <div class="row" style="justify-content:space-between"><h2 class="sec">來源</h2></div>
      <div class="authgrid">${srcs.map(([k, n]) => `<a class="authchip" href="#/?src=${encodeURIComponent(k)}"><span class="an src">${esc(k)}</span><span class="ac">${n} 首</span></a>`).join('')}</div>
    </section>` : ''}

    <section class="sec-block">
      <div class="row" style="justify-content:space-between">
        <h2 class="sec">所有詩篇 <span class="muted" style="font-family:var(--sans);font-size:14px">${ps.length} 首</span></h2>
        <div class="row">
          <div class="chips" role="group" aria-label="篩選">
            ${[['all', '全部'], ['fav', '★ 收藏'], ['classic', '古典'], ['modern', '新詩'], ['shape', '圖像詩']].map(([k, n]) => `<button type="button" class="chip${HF.type === k ? ' on' : ''}" data-act="ftype" data-v="${k}" aria-pressed="${HF.type === k}">${n}</button>`).join('')}
          </div>
          ${sel('src', srcOpts, HF.src, '依來源篩選')}${sel('dyn', dynOpts, HF.dyn, '依朝代篩選')}${sel('author', auOpts, HF.author, '依作者篩選')}${sel('col', colOpts, HF.col, '依詩集篩選')}
          ${selBtnHTML()}
        </div>
      </div>
      <div id="authhits">${authHitsHTML()}</div>
      <div class="grid" id="grid">${gridHTML()}</div>
    </section>

    <footer class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:20px">
      <span class="muted">${serverMode ? '資料存在這台電腦上' : '目前以瀏覽器模式執行，資料存在此瀏覽器'} · 詩頁 v${VERSION}</span>
      <div class="row">
        <span class="muted">預設字體</span>
        <div class="seg" style="display:inline-grid">${Object.entries(FONTS).map(([k, v]) => `<button type="button" data-act="set-font" data-v="${k}" class="${DB.prefs.defaultFont === k ? 'on' : ''}" aria-pressed="${DB.prefs.defaultFont === k}" style="height:36px;padding:0 14px">${v[0]}</button>`).join('')}</div>
        <button type="button" class="btn ghost" data-act="today-auto" aria-pressed="${ShiR.todayAuto()}" title="每天第一次打開詩頁時，先顯示今日一詩">${ShiR.todayAuto() ? '✓ ' : ''}每天先看今日一詩</button>
        <a class="btn ghost" href="#/trash">回收桶${trashed().length ? `（${trashed().length}）` : ''}</a>
        <button type="button" class="btn ghost" data-act="backup">匯出備份</button>
        <label class="btn ghost" for="f-restore">匯入備份</label>
        <input id="f-restore" class="sr" type="file" accept=".json,application/json" data-file="restore">
      </div>
    </footer>
  </main>`;
}

// ---------- authors ----------
function authorsView() {
  const groups = {};
  DB.authors.forEach(a => { const k = a.dynasty || '未標朝代'; (groups[k] = groups[k] || []).push(a); });
  const order = Object.keys(groups).sort((a, b) => (DYNASTIES.indexOf(a) + 1 || (a === '未標朝代' ? 999 : 98)) - (DYNASTIES.indexOf(b) + 1 || (b === '未標朝代' ? 999 : 98)));
  const anon = poemsOfAuthor(null).length;
  return topbar(`<a class="btn" href="#/">回首頁</a>`) + `
  <main class="page" style="gap:40px">
    <div><h1 class="sec" style="font-size:34px">作者與朝代</h1><p class="muted" style="margin:8px 0 0">${DB.authors.length} 位作者 · 點作者看他的所有詩</p></div>
    ${order.map(k => `<section class="sec-block" style="gap:14px"><h2 class="sec" style="font-size:22px">${esc(k)}</h2>
      <div class="authgrid">${groups[k].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')).map(a => `<a class="authchip" href="#/author/${a.id}"><span class="an">${esc(a.name)}</span><span class="ad">${esc(a.dynasty || '　')}</span><span class="ac">${poemsOfAuthor(a.id).length} 首</span></a>`).join('')}</div></section>`).join('')}
    ${anon ? `<section class="sec-block" style="gap:14px"><h2 class="sec" style="font-size:22px">佚名</h2><div class="authgrid"><a class="authchip" href="#/author/none"><span class="an">佚名</span><span class="ad">　</span><span class="ac">${anon} 首</span></a></div></section>` : ''}
  </main>`;
}
function authorView(a) {
  const ps = poemsOfAuthor(a ? a.id : null).sort(byCreated);
  const others = DB.authors.filter(x => !a || x.id !== a.id).sort((x, y) => x.name.localeCompare(y.name, 'zh-Hant'));
  return topbar(`<div class="row"><a class="btn" href="#/authors">全部作者</a><a class="btn" href="#/">回首頁</a></div>`) + `
  <main class="page" style="gap:32px"><div class="wrap" style="gap:32px">
    <section style="flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:24px">
      <div class="author-head">
        <div class="kicker">${esc(a && a.dynasty ? a.dynasty : '作者')}</div>
        <h1>${esc(a ? a.name : '佚名')}</h1>
        ${a && a.bio ? `<p class="bio">${esc(a.bio)}</p>` : ''}
        <div class="row" style="margin-top:8px">
          ${ps.length ? `<a class="btn dark" href="#/read/${ps[0].id}" data-act="scope-author">從第一首開始讀</a><a class="btn" href="#/flow/${ps[0].id}" data-act="scope-author">${IC.scroll}連續捲動閱讀全部 ${ps.length} 首</a>` : ''}
          ${ps.length ? `<button type="button" class="btn" data-act="export-author">導出 PDF</button>` : ''}
          ${a ? `<a class="btn ghost" href="#/new?author=${a.id}">新增這位作者的詩</a>` : ''}
          ${ps.length ? selBtnHTML() : ''}
        </div>
      </div>
      <div class="grid">${ps.length ? ps.map(cardHTML).join('') : '<div class="empty" style="grid-column:1/-1">這位作者還沒有詩</div>'}</div>
    </section>
    ${a ? `<aside class="side" style="flex:1 1 280px">
      <div class="card panel">
        <p class="label">作者資料</p>
        <label class="field">作者名<input class="serif" data-in="au-name" value="${esc(a.name)}"></label>
        <label class="field">朝代（新詩可空白）<input data-in="au-dyn" list="dyn-dl" value="${esc(a.dynasty)}" placeholder="例如：唐、宋、現代"></label>
        <label class="field">簡介（選填）<textarea data-in="au-bio" rows="4" class="ta">${esc(a.bio)}</textarea></label>
        <p class="note">修改後所有這位作者的詩都會一起更新。</p>
      </div>
      <div class="card panel">
        <p class="label">合併作者</p>
        <p class="note">同一個人有兩種寫法時（例如「李白」與「李太白」），把這位作者的詩全部移到另一位作者，再刪除這筆。</p>
        <label class="field">合併到<select id="merge-to">${others.map(x => `<option value="${x.id}">${esc(authorLabel(x))}</option>`).join('')}</select></label>
        <button type="button" class="btn sq" data-act="au-merge"${others.length ? '' : ' disabled'}>合併</button>
      </div>
      <button type="button" class="btn ghost danger sq" data-act="au-del" style="align-self:flex-start">刪除這位作者</button>
    </aside>` : ''}
  </div>${dynDatalist()}</main>`;
}
const dynDatalist = () => `<datalist id="dyn-dl">${DYNASTIES.map(d => `<option value="${d}">`).join('')}</datalist>`;

// ---------- editor ----------
let ED = null;
function startNew(colId, authorId) {
  const d = PENDING || { title: '', text: '', type: 'modern' };
  PENDING = null;
  const a = authorId && authorById(authorId);
  ED = { id: null, title: d.title, authorName: a ? a.name : (d.authorName || ''), dynasty: a ? a.dynasty : (d.dynasty || ''), type: d.type || 'modern', collectionId: d.collectionId ?? colId ?? null, tags: d.tags || [], text: d.text, imported: !!d.text, shared: !!d.shared, sourceImg: d.sourceImg || null, ocr: !!d.ocr, vertical: !!d.vertical, ocrLang: d.ocrLang || '', source: d.source || '', date: d.date || '', note: d.note || '', illustration: d.illustration || null, authorNick: d.authorNick || '', trans: d.trans || '', fromRec: d.fromRec || null, recAsk: d.recAsk || null, phoneOcr: !!d.phoneOcr };
  return ED;
}
function startEdit(p) {
  const a = authorOf(p);
  ED = { trans: p.trans || '', id: p.id, title: p.title, authorName: a ? a.name : '', dynasty: a ? a.dynasty : '', type: p.type, collectionId: p.collectionId, tags: [...(p.tags || [])], text: p.text, sourceImg: p.sourceImg || null, ocr: (p.tags || []).includes('待校對'), source: p.source || '', date: p.date || '', note: p.note || '', illustration: p.illustration || null };
  return ED;
}
function colOptions(sel) {
  return `<option value="">（不放入詩集）</option>` + DB.collections.map(c => `<option value="${c.id}"${sel === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('') + `<option value="__new">＋ 新增詩集…</option>`;
}
function editorView(e) {
  const authorsDl = `<datalist id="au-dl">${[...DB.authors].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')).map(a => `<option value="${esc(a.name)}">${esc(a.dynasty || '')}</option>`).join('')}</datalist>`;
  return `<header class="bar"><div class="bar-in">
    <div class="row">
      <a class="back" href="${e.id ? '#/read/' + e.id : '#/'}" aria-label="返回">${IC.back}</a>
      <div class="bar-title">${e.id ? '編輯詩篇' : '新增詩篇'}</div>
      ${e.imported && !e.ocr ? `<span class="muted">${e.shared ? '已帶入分享的文字' : '已從檔案載入'}，請確認標題與分段</span>` : ''}
    </div>
    <div class="row">
      ${e.id ? '<button type="button" class="btn ghost danger" data-act="ed-del">移到回收桶</button>' : ''}
      <button type="button" class="btn red" data-act="ed-save">儲存並閱讀</button>
    </div>
  </div></header>
  <main class="page" style="gap:24px">
    ${e.recAsk ? `<div class="banner row" style="justify-content:space-between">這是今日推薦的〈${esc(e.recAsk.title)}〉（${esc(e.recAsk.author)}）嗎？<button type="button" class="btn sq" data-act="x-recapply">是，套用標題和作者</button></div>` : ''}
    ${e.fromRec && !e.text.trim() ? `<div class="banner">到網路上找〈${esc(e.fromRec.title)}〉的全文，選取詩的部分拷貝，回來按「從剪貼簿貼上」。<div class="row" style="margin-top:10px"><a class="btn sq" href="${esc(ShiX.searchURL(e.fromRec))}" target="_blank" rel="noopener">搜尋全文</a><button type="button" class="btn red sq" data-act="x-paste">從剪貼簿貼上</button></div></div>` : ''}
    ${e.ocr && e.tags.includes('待辨識') ? `<div class="banner">這張照片會在<b>電腦版詩頁開著、連上網路時</b>自動辨識成文字，辨識完會出現在這裡並標上「待校對」。<br>想馬上有文字：在「照片」App 打開這張照片，長按文字選取全部、拷貝，再貼到下面的內文。</div>` : e.phoneOcr ? `<div class="banner">這首是在手機上從圖片辨識出來的，請對照下方的原圖校對。錯字可能比電腦版多一些，網頁截圖上的連結圖示有時會被辨識成多出來的字。</div>` : e.ocr ? `<div class="banner">這首是從圖片辨識出來的，請對照右邊的原圖校對。斷行、縮排與分節是依照文字在圖片上的位置推測的。${e.vertical ? '<br><b>這張圖看起來是直排文字</b>，Windows 內建辨識對直排的效果比較差，可能需要較多修改。' : ''}${e.ocrLang && !/^zh/i.test(e.ocrLang) ? `<br><b>這台電腦目前用「${esc(e.ocrLang)}」辨識</b>，沒有找到繁體中文的辨識功能，中文字可能辨識不出來。可以到 Windows「設定 → 時間與語言 → 語言與地區」為「中文（繁體，台灣）」安裝語言功能。` : ''}${e.id ? '<br>校對完成後，取消勾選下方的「待校對」再儲存。' : ''}</div>` : ''}
    <div class="wrap">
    <aside class="side" style="flex:1 1 ${e.sourceImg ? '250px' : '280px'}">
      <div class="drop" data-drop="editor" style="padding:22px">
        <div style="font-weight:600;font-size:15px">從檔案或圖片載入</div>
        <p style="font-size:13px">.txt · .md · .docx · 照片或截圖<br>拖曳到這裡也可以，會取代目前的內容。</p>
        <label class="btn sq" for="f-ed">瀏覽檔案</label>
        <input id="f-ed" class="sr" type="file" accept=".txt,.md,.markdown,.docx,text/plain,image/*" data-file="editor">
      </div>
      ${e.id ? '' : `<div class="card panel">
        <p class="label">批次匯入</p>
        <p class="note" style="margin:0">一次選很多個檔案，或一個 zip 壓縮檔（例如整個資料夾壓縮起來）。會先列出清單、挑掉重複的，再匯入。</p>
        <label class="btn sq" for="f-batch" style="align-self:flex-start">選擇多個檔案或 zip</label>
        <input id="f-batch" class="sr" type="file" multiple accept=".txt,.md,.markdown,.docx,.zip,application/zip,text/plain,image/*" data-file="batch">
      </div>`}
      ${serverMode ? `<div class="card panel">
        <p class="label">從網址抓取</p>
        <div class="row" style="flex-wrap:nowrap"><input id="ed-url" class="search" style="flex:1;min-width:0;height:40px" placeholder="貼上收錄這首詩的網址" autocomplete="off" spellcheck="false"><button type="button" class="btn sq" data-act="x-fetch" style="height:40px">抓取</button></div>
        <p class="note" style="margin:0">會打開網頁、挑出詩的部分放進下面，請再確認一次。</p>
      </div>` : ''}
      <div class="card panel">
        <p class="label">詩篇資訊</p>
        <label class="field">標題<input class="serif" data-in="ed-title" value="${esc(e.title)}" placeholder="無題"></label>
        <div class="two">
          <label class="field">作者<input data-in="ed-author" list="au-dl" value="${esc(e.authorName)}" placeholder="選擇或輸入新作者" autocomplete="off"></label>
          <label class="field dyn">朝代<input data-in="ed-dyn" list="dyn-dl" value="${esc(e.dynasty)}" placeholder="可空白" autocomplete="off"></label>
        </div>
        <div class="note" id="au-hint"></div>
        <label class="field">詩集<select data-in="ed-col">${colOptions(e.collectionId)}</select></label>
        <label class="field">標籤（用空格或逗號分隔）<input data-in="ed-tags" value="${esc(e.tags.filter(t => t !== '待校對').join(' '))}" placeholder="夏天 夜"></label>
        ${e.ocr ? `<label class="check"><input type="checkbox" data-in="ed-review" ${e.tags.includes('待校對') || !e.id ? 'checked' : ''}> 待校對</label>` : ''}
      </div>
      <div class="card panel">
        <p class="label">出處</p>
        <div class="two">
          <label class="field">來源<input data-in="ed-source" value="${esc(e.source)}" placeholder="例如：PTT poem、聯合報" autocomplete="off"></label>
          <label class="field dyn">日期<input data-in="ed-date" type="date" value="${esc(e.date)}"></label>
        </div>
        <label class="field">附記（後記、註解、作者簡介）<textarea data-in="ed-note" rows="3" class="ta">${esc(e.note)}</textarea></label>
        <p class="label" style="margin-top:6px">插圖</p>
        ${e.illustration ? `<div class="illus-mini"><img data-img="${esc(e.illustration)}" alt="插圖"><button type="button" class="btn ghost sq danger" data-act="ed-rmillus" style="height:36px">移除插圖</button></div>` : ''}
        <div class="row" style="gap:8px">
          <label class="btn ghost sq" for="f-illus" style="height:36px">${e.illustration ? '換一張' : '加上插圖'}</label>
          <input id="f-illus" class="sr" type="file" accept="image/*" data-file="illus">
          <button type="button" class="btn ghost sq" data-act="ed-paste-illus" style="height:36px">從剪貼簿貼上插圖</button>
        </div>
        <p class="note d-only" style="margin:0">也可以複製圖片後按 Ctrl＋V（游標不要在文字框裡）。</p>
      </div>
      ${authorsDl}${dynDatalist()}
    </aside>
    <section class="card ed-main" style="${e.sourceImg ? 'flex-basis:480px' : ''}">
      <div class="ed-tools">
        <button type="button" class="tool" data-act="ins-space">插入全形空格</button>
        <button type="button" class="tool" data-act="indent">縮排 →</button>
        <button type="button" class="tool" data-act="outdent">← 取消縮排</button>
        <button type="button" class="tool" data-act="ins-stanza">插入分節</button>
        <button type="button" class="tool" data-act="x-paste">從剪貼簿貼上</button>
        <span style="flex:1"></span>
        <span class="muted">Tab 鍵會插入全形空格</span>
      </div>
      <label for="ed-text" class="sr">詩的內容</label>
      <textarea id="ed-text" class="ed-text" data-in="ed-text" spellcheck="false" placeholder="在這裡寫下或貼上你的詩。&#10;&#10;空一行代表分節。&#10;行首的空格會原樣保留。">${esc(e.text)}</textarea>
      <div class="ed-foot" id="ed-stats"></div>
      <details class="trans-panel"${e.trans ? ' open' : ''}>
        <summary>對照譯文（選填）</summary>
        <textarea class="ed-text trans-ta" data-in="ed-trans" spellcheck="false" placeholder="例如英文詩的中文翻譯。一行對一行，空一行分節；閱讀時會和原文並排。">${esc(e.trans || '')}</textarea>
      </details>
    </section>
    <aside class="side" style="flex:1 1 ${e.sourceImg ? '320px' : '260px'}">
      ${e.sourceImg ? `<div class="card panel">
        <div class="row" style="justify-content:space-between"><p class="label">原圖對照</p><button type="button" class="btn ghost sq" data-act="ed-zoomimg" style="height:36px">放大</button></div>
        <div class="srcimg" id="srcimg"><img data-img="${esc(e.sourceImg)}" alt="原始圖片"></div>
        <button type="button" class="btn ghost sq danger" data-act="ed-rmimg" style="align-self:flex-start;height:36px">不保留原圖</button>
      </div>` : ''}
      <div class="card panel">
        <p class="label">詩體</p>
        <div class="seg" id="ed-type">${Object.entries(TYPES).map(([k, n]) => `<button type="button" data-act="ed-type" data-v="${k}" class="${e.type === k ? 'on' : ''}" aria-pressed="${e.type === k}">${n}</button>`).join('')}</div>
        <p class="note">古典：預設經典書頁。新詩：保留每個空格與空行，預設詩刊雜誌。圖像詩：鎖定版面、不重新斷行。</p>
      </div>
      <div class="card panel">
        <p class="label">即時預覽</p>
        <div class="mini" id="ed-preview"></div>
      </div>
    </aside>
  </div></main>`;
}
function edAuthorHint() {
  const h = $('#au-hint'); if (!h) return;
  const n = ED.authorName.trim();
  if (!n) { h.textContent = '不填作者會歸在「佚名」。'; return; }
  const same = DB.authors.filter(a => a.name === n);
  if (!same.length) h.textContent = `「${n}」是新作者，儲存時會自動加入作者清單。`;
  else h.textContent = `已有作者：${same.map(authorLabel).join('、')}，${same.length === 1 ? '這首詩會歸到他的名下。' : '會依朝代對應。'}`;
}
function edRefresh() {
  if (!ED) return;
  edAuthorHint();
  const sts = stanzas(ED.text);
  const nl = sts.reduce((a, s) => a + s.lines.length, 0);
  const ni = sts.reduce((a, s) => a + s.lines.filter(l => l.ind > 0).length, 0);
  const st = $('#ed-stats'); if (st) st.innerHTML = `<span>${sts.length} 節 · ${nl} 行</span><span>${ni ? `保留 ${ni} 行縮排` : '沒有縮排'}</span><span>${ED.text.length} 字元</span>`;
  const pv = $('#ed-preview'); if (!pv) return;
  const L = Object.assign(defLayout(ED.type), { size: 14 });
  const au = ED.authorName.trim() ? (ED.dynasty.trim() ? ED.dynasty.trim() + ' · ' : '') + ED.authorName.trim() : '';
  if (ED.type === 'shape') pv.innerHTML = `<div style="font-family:var(--serif);font-weight:700;font-size:17px;margin-bottom:12px">${esc(ED.title || '無題')}</div><pre style="margin:0;font-family:var(--serif);font-size:14px;line-height:1.5">${esc(ED.text)}</pre>`;
  else pv.innerHTML = `<div style="font-family:var(--serif);text-align:${ED.type === 'classic' ? 'center' : 'left'}">
    <div style="font-size:18px;font-weight:700;letter-spacing:.08em">${esc(ED.title || '無題')}</div>
    <div style="font-size:12px;color:var(--ink3);margin:4px 0 12px">${esc(au)}</div>
    <div style="font-size:14px;line-height:28px">${linesHTML(sts, L, 28)}</div></div>`;
}
// 找出內容很像的詩（新增時提醒、匯入時加標籤）
function findDup(text, exceptId) {
  const k = ShiImport.normKey(text); if (k.length < 6) return null;
  let best = null;
  for (const p of live()) {
    if (p.id === exceptId) continue;
    const pk = ShiImport.normKey(p.text);
    let sc = ShiImport.similarity(k, pk);
    if (sc < .85 && Math.min(k.length, pk.length) >= 12 && (pk.includes(k) || k.includes(pk))) sc = .9;
    if (sc >= .85 && (!best || sc > best.sc)) best = { p, sc };
  }
  return best;
}
function dupAsk(d) {
  const a = authorOf(d.p);
  modal({ title: '可能已經有這首了', ok: '仍然新增一首', onOk: () => { ED.dupOk = true; setTimeout(edSave, 0); }, body: `
    <p style="margin:0;line-height:1.8">詩庫裡的〈<b>${esc(d.p.title)}</b>〉${a ? `（${esc(authorLabel(a))}）` : ''}和這首有 <b>${Math.round(d.sc * 100)}%</b> 相同。</p>
    <div class="dup-prev serif">${esc(d.p.text.split('\n').filter(l => l.trim()).slice(0, 4).join('\n'))}</div>
    <div class="row"><a class="btn sq" href="#/read/${d.p.id}" data-act="modal-cancel">打開已有的那首</a><button type="button" class="btn sq" data-act="dup-update" data-id="${d.p.id}">用這次的內容更新它</button></div>` });
}
function edSave() {
  const e = ED;
  if (!e.id && !e.dupOk && e.text.trim()) { const d = findDup(e.text); if (d) { dupAsk(d); return; } }
  let tags = e.tags.filter(t => t !== '待校對');
  if (e.text.trim()) tags = tags.filter(t => t !== '待辨識');
  const rv = $('[data-in=ed-review]');
  if (rv && rv.checked) tags.push('待校對');
  const data = { title: e.title.trim() || '無題', authorId: resolveAuthor(e.authorName, e.dynasty), type: e.type, collectionId: e.collectionId || null, tags, text: e.text.replace(/\s+$/, ''), sourceImg: e.sourceImg || null, source: e.source.trim(), date: e.date, note: e.note.trim(), illustration: e.illustration || null, authorNick: e.authorNick || '', trans: (e.trans || '').replace(/\s+$/, '') };
  let p;
  if (e.id) {
    p = poemById(e.id);
    const typeChanged = p.type !== data.type;
    Object.assign(p, data, { updated: Date.now() });
    if (typeChanged) p.layout = Object.assign(p.layout, { style: defStyle(data.type) });
  } else { p = newPoem(data, data.collectionId); p.tags = tags; DB.poems.push(p); }
  save(); ED = null; go('#/read/' + p.id); toast('已儲存');
}
function taEdit(fn) {
  const ta = $('#ed-text'); if (!ta) return;
  const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
  const r = fn(v, s, en);
  ta.value = r.v; ta.focus(); ta.setSelectionRange(r.s, r.e);
  ED.text = ta.value; edRefresh();
}
function insertAt(str) { taEdit((v, s, e) => ({ v: v.slice(0, s) + str + v.slice(e), s: s + str.length, e: s + str.length })); }
function shiftLines(dir) {
  taEdit((v, s, e) => {
    const a = v.lastIndexOf('\n', s - 1) + 1;
    let b = v.indexOf('\n', Math.max(e - (e > s && v[e - 1] === '\n' ? 1 : 0), s)); if (b < 0) b = v.length;
    const block = v.slice(a, b).split('\n').map(l => dir > 0 ? (l.trim() ? '　　' + l : l) : l.replace(/^(　{1,2}| {1,4}|\t)/, '')).join('\n');
    return { v: v.slice(0, a) + block + v.slice(b), s: a, e: a + block.length };
  });
}

// ---------- reading scope ----------
function scopeOf() { return SCOPES[DB.prefs.scope] ? DB.prefs.scope : 'author'; }
function scopeList(p, scope = scopeOf()) {
  let list;
  if (scope === 'author') list = poemsOfAuthor(p.authorId);
  else if (scope === 'collection') list = live().filter(x => (x.collectionId || null) === (p.collectionId || null));
  else if (scope === 'source') list = live().filter(x => srcKey(x.source) === srcKey(p.source));
  else list = live();
  return list.sort(byCreated);
}
function scopeName(p, scope = scopeOf()) {
  if (scope === 'author') return authorLabel(authorOf(p));
  if (scope === 'collection') { const c = p.collectionId && colById(p.collectionId); return c ? `《${c.name}》` : '未分類'; }
  if (scope === 'source') return srcKey(p.source) ? `來源：${srcKey(p.source)}` : '沒有來源的詩';
  return '全部詩篇';
}
function neighbors(p) {
  const list = scopeList(p), i = list.findIndex(x => x.id === p.id);
  return { list, i, prev: list[i - 1] || null, next: list[i + 1] || null };
}
function scopeSeg(p, act) {
  const s = scopeOf();
  return `<div class="seg scopeseg" role="group" aria-label="閱讀範圍">${Object.entries(SCOPES).map(([k, n]) => `<button type="button" data-act="${act}" data-v="${k}" class="${s === k ? 'on' : ''}" aria-pressed="${s === k}">${n}</button>`).join('')}</div>`;
}
function navStripHTML(p) {
  const { list, i, prev, next } = neighbors(p);
  return `<div class="navstrip no-print">
    ${scopeSeg(p, 'scope')}
    <span class="muted">${esc(scopeName(p))}　第 ${i + 1} / ${list.length} 首</span>
    <span style="flex:1"></span>
    <button type="button" class="btn sq" data-act="go-prev" ${prev ? '' : 'disabled'} aria-label="上一篇">${IC.back}上一篇</button>
    <button type="button" class="btn sq" data-act="go-next" ${next ? '' : 'disabled'} aria-label="下一篇">下一篇${IC.next}</button>
    <a class="btn sq dark" href="#/flow/${p.id}">${IC.scroll}連續捲動</a>
  </div>`;
}
function pagerHTML(p) {
  const { prev, next } = neighbors(p);
  const cell = (q, dir) => q ? `<a class="pager-cell ${dir}" href="#/read/${q.id}"><span class="muted">${dir === 'prev' ? '← 上一篇' : '下一篇 →'}</span><span class="pt">〈${esc(q.title)}〉</span><span class="muted">${esc(authorLabel(authorOf(q)))}</span></a>` : `<span class="pager-cell empty-cell ${dir}"><span class="muted">${dir === 'prev' ? '已經是第一篇' : '已經是最後一篇'}</span></span>`;
  return `<nav class="pager no-print" aria-label="上一篇與下一篇">${cell(prev, 'prev')}${cell(next, 'next')}</nav>`;
}

// ---------- reader ----------
function readerView(p) {
  const L = layoutOf(p), st = STYLES[L.style];
  return `<header class="bar"><div class="bar-in" style="max-width:none">
    <div class="row">
      <a class="back" href="#/" aria-label="返回首頁">${IC.back}</a>
      <div class="bar-title">${esc(p.title)}</div>
      <span class="badge">${TYPES[p.type]}</span>
      <button type="button" class="back" data-act="fav" aria-pressed="${!!p.fav}" aria-label="${p.fav ? '取消收藏' : '收藏'}" title="${p.fav ? '取消收藏' : '收藏'}" id="favbtn">${IC.star(p.fav)}</button>
      <a class="muted" href="${authorOf(p) ? '#/author/' + p.authorId : '#/author/none'}">${esc(authorLabel(authorOf(p)))}</a>
      <span class="muted" id="stylename">· ${st.name}</span>
    </div>
    <div class="row d-only">
      <button type="button" class="btn" data-act="tts-start">聽這首詩</button>
      <a class="btn" href="#/memo/${p.id}">背誦</a>
      <a class="btn" href="#/edit/${p.id}">編輯</a>
      <button type="button" class="btn" data-act="export-open">導出圖片／PDF</button>
      <button type="button" class="btn ghost danger" data-act="del-poem">移到回收桶</button>
    </div>
    <div class="row m-only" style="gap:0">
      <button type="button" class="back" data-act="m-share-open" aria-label="分享成圖片"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg></button>
      <button type="button" class="back" data-act="m-more" aria-label="更多"><svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>
    </div>
  </div></header>
  <div class="mbar m-only" role="toolbar" aria-label="快速切換風格">
    ${p.type !== 'shape' ? `<button type="button" data-act="lay-dir" class="dirbtn${L.dir === 'v' ? ' on' : ''}" aria-pressed="${L.dir === 'v'}" aria-label="切換直排或橫排">${L.dir === 'v' ? '直排' : '橫排'}</button>` : ''}
    ${[[p.type === 'classic' ? 'classic' : 'magazine', '書頁'], ['night', '夜讀']].map(([k, n]) => `<button type="button" data-act="lay" data-k="style" data-v="${k}" class="${layoutOf(p).style === k ? 'on' : ''}" aria-pressed="${layoutOf(p).style === k}">${n}</button>`).join('')}
    <button type="button" data-act="tts-start" class="ico" aria-label="聽這首詩"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg></button>
    <button type="button" data-act="sheet-toggle" aria-label="更多排版設定" class="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></button>
  </div>
  <div class="sheet-bg m-only" data-act="sheet-toggle"></div>
  <div class="reader">
    <main class="stage" id="stage">${stageHTML(p, L)}</main>
    <aside class="controls" id="controls" aria-label="排版設定">${controlsHTML(p, L)}</aside>
  </div>`;
}
function illusHTML(p) { return p.illustration ? `<figure class="illus"><img data-img="${esc(p.illustration)}" alt="〈${esc(p.title)}〉的插圖"></figure>` : ''; }
function afterHTML(p) {
  const bits = [p.source && (srcKey(p.source) ? `<a href="#/?src=${encodeURIComponent(srcKey(p.source))}">${esc(p.source)}</a>` : esc(p.source)), p.date && esc(p.date)].filter(Boolean);
  if (!p.note && !bits.length) return '';
  return `<div class="after">${p.note ? `<div class="pnote">${esc(p.note)}</div>` : ''}${bits.length ? `<div class="psrc">出處　${bits.join('　·　')}</div>` : ''}</div>`;
}
function stageHTML(p, L) {
  return `<div class="stage-col">${navStripHTML(p)}${illusHTML(p)}${articleHTML(p, L)}${afterHTML(p)}${pagerHTML(p)}</div>`;
}
function controlsHTML(p, L) {
  return `<div class="sheet-head m-only"><span class="grab" aria-hidden="true"></span><div class="row" style="justify-content:space-between"><h2 class="sec" style="font-size:18px">排版</h2><button type="button" class="btn ghost sq" data-act="sheet-toggle">完成</button></div></div>` + controlsInner(p, L);
}
function controlsInner(p, L) {
  const st = STYLES[L.style];
  const font = fontKey(L, st), align = L.align || st.align;
  const seg = (key, opts, cur) => `<div class="seg">${opts.map(([k, n]) => `<button type="button" data-act="lay" data-k="${key}" data-v="${k}" class="${cur === k ? 'on' : ''}" aria-pressed="${cur === k}">${n}</button>`).join('')}</div>`;
  const tg = (key, t1, t2) => `<button type="button" class="toggle" data-act="lay-tg" data-k="${key}" aria-pressed="${!!L[key]}"><span><span class="t1">${t1}</span><span class="t2">${t2}</span></span><span class="switch" aria-hidden="true"></span></button>`;
  const order = p.type === 'classic' ? ['classic', 'vertical', 'manuscript', 'night', 'magazine', 'recite', 'shape'] : ['magazine', 'recite', 'shape', 'classic', 'night', 'manuscript', 'vertical'];
  const col = p.collectionId && colById(p.collectionId);
  const au = authorOf(p);
  const vOK = p.type !== 'shape' && L.style !== 'shape';
  const hasTr = !!(p.trans && p.trans.trim());
  return `
    <section><h2 class="label">閱讀方向</h2>
      ${vOK ? `<div class="seg dirseg">${[['h', '橫排'], ['v', '直排']].map(([k, n]) => `<button type="button" data-act="lay" data-k="dir" data-v="${k}" class="${L.dir === k ? 'on' : ''}" aria-pressed="${L.dir === k}">${n}</button>`).join('')}</div>
      ${hasTr && L.bi === 'on' && L.dir === 'v' ? '<p class="note" style="margin:0">顯示對照譯文時會用橫排。</p>' : `<p class="note d-only" style="margin:0">按鍵盤 V 鍵也可以切換。直排的長詩可以左右捲動。</p>`}` : '<p class="note" style="margin:0">圖像詩固定橫排，不會改變排列。</p>'}
    </section>
    ${hasTr ? `<section><h2 class="label">對照譯文</h2>${seg('bi', [['on', '原文＋譯文'], ['off', '只看原文']], L.bi)}</section>` : ''}
    <section><h2 class="label">顯示風格</h2>
      <div class="stylegrid">${order.map(k => { const s = STYLES[k]; return `<button type="button" class="stylebtn${L.style === k ? ' on' : ''}" data-act="lay" data-k="style" data-v="${k}" aria-pressed="${L.style === k}">
        <div class="sw-art" style="background:${s.bg};color:${s.fg};${k === 'magazine' ? 'font-family:var(--sans);font-weight:900;' : ''}"><span style="${k === 'vertical' ? 'writing-mode:vertical-rl;font-size:12px' : ''}">${k === 'shape' ? '形　狀' : k === 'recite' ? '讀　一節' : '明月光'}</span></div>
        <div class="sw-name">${s.name}</div></button>`; }).join('')}</div>
    </section>
    <section><h2 class="label">字體</h2>${seg('font', Object.entries(FONTS).map(([k, v]) => [k, v[0]]), font)}</section>
    <section><h2 class="label">字級 · <span id="sizelabel">${L.size}</span>px</h2>
      <div class="sizer">
        <button type="button" data-act="size" data-v="-2" aria-label="縮小字級" style="font-size:14px">字</button>
        <label class="sr" for="sizer">字級</label>
        <input id="sizer" type="range" min="14" max="40" step="1" value="${L.size}" data-in="size">
        <button type="button" data-act="size" data-v="2" aria-label="放大字級" style="font-size:22px">字</button>
      </div>
    </section>
    <section><h2 class="label">行距</h2>${seg('lh', Object.entries(LH).map(([k, v]) => [k, v[0]]), L.lh)}</section>
    <section><h2 class="label">節距（節與節之間）</h2>${seg('gap', Object.entries(GAP).map(([k, v]) => [k, v[0]]), L.gap)}</section>
    <section><h2 class="label">對齊</h2>${seg('align', [['center', '置中'], ['left', '靠左']], align)}</section>
    <section style="gap:0"><h2 class="label" style="margin-bottom:8px">斷行與空白</h2>
      ${tg('keep', '保留原始空白與縮排', '行首與句中的空格都照原稿')}
      ${tg('hang', '長句懸掛縮排', '自動折行的部分往內縮，看得出原本的斷行')}
      ${tg('seal', '加上印章', '詩的角落蓋一個「詩」字印')}
    </section>
    <section>
      <button type="button" class="btn sq" data-act="lay-reset">恢復預設</button>
      ${col ? `<button type="button" class="btn sq" data-act="lay-all" data-v="collection">把這個版面套用到《${esc(col.name)}》全部詩篇</button>` : ''}
      ${au ? `<button type="button" class="btn sq" data-act="lay-all" data-v="author">把這個版面套用到 ${esc(au.name)} 的全部詩篇</button>` : ''}
      <p class="note">版面會自動儲存在這首詩上。鍵盤左右鍵切換上一篇／下一篇；朗讀模式下左右鍵翻節，翻到最後一節再按會到下一篇。</p>
    </section>`;
}
function readerUpdate(p, full = true) {
  const L = layoutOf(p);
  const stg = $('#stage'); if (stg) stg.innerHTML = stageHTML(p, L);
  if (full) { const c = $('#controls'); if (c) { const sc = c.scrollTop; c.innerHTML = controlsHTML(p, L); c.scrollTop = sc; } }
  const sn = $('#stylename'); if (sn) sn.textContent = '· ' + STYLES[L.style].name;
  document.querySelectorAll('.mbar [data-k=style]').forEach(b => { const on = b.dataset.v === L.style; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const db = $('.mbar .dirbtn'); if (db) { db.classList.toggle('on', L.dir === 'v'); db.setAttribute('aria-pressed', L.dir === 'v'); db.textContent = L.dir === 'v' ? '直排' : '橫排'; }
}

// ---------- continuous scroll ----------
function flowLayout(base, q) {
  if (q.type === 'shape') return Object.assign(defLayout('shape'), { size: base.size });
  const L = Object.assign({}, base);
  if (L.style === 'recite' || L.style === 'shape') L.style = q.type === 'classic' ? 'classic' : 'magazine';
  return L;
}
function flowView(p) {
  const list = scopeList(p);
  const base = layoutOf(p);
  return `<header class="bar"><div class="bar-in" style="max-width:none">
    <div class="row">
      <a class="back" href="#/read/${p.id}" aria-label="回到單篇閱讀">${IC.back}</a>
      <div class="bar-title">連續閱讀 · ${esc(scopeName(p))}</div>
      <span class="muted">${list.length} 首 · 版面統一用〈${esc(p.title)}〉的設定</span>
    </div>
    <div class="row">${scopeSeg(p, 'flow-scope')}<a class="btn" href="#/">回首頁</a></div>
  </div></header>
  <div class="flow">
    ${list.map((q, i) => `${i ? '<div class="flow-sep" aria-hidden="true"><span></span><i>❦</i><span></span></div>' : ''}
      <div class="flow-item">
        <div class="flow-meta no-print"><span class="muted">${i + 1} / ${list.length}</span><a href="#/read/${q.id}">單篇閱讀 →</a></div>
        ${illusHTML(q)}${articleHTML(q, flowLayout(base, q), { anchor: true })}${afterHTML(q)}
      </div>`).join('')}
    <div class="flow-end muted">— 讀完了 —</div>
  </div>`;
}
function bindFlow(id) {
  const el = document.getElementById('f-' + id);
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  flowObs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > .5) { const pid = e.target.dataset.pid; if (DB.prefs.last !== pid) { DB.prefs.last = pid; save(); } } });
  }, { threshold: [.5] });
  document.querySelectorAll('.flow article[data-pid]').forEach(a => flowObs.observe(a));
}

// ---------- collection ----------
function colView(c) {
  const cv = c.cover;
  const poems = live().filter(p => p.collectionId === c.id).sort(byCreated);
  const seg = (key, opts, cur) => `<div class="seg">${opts.map(([k, n]) => `<button type="button" data-act="cv" data-k="${key}" data-v="${k}" class="${cur === k ? 'on' : ''}" aria-pressed="${cur === k}">${n}</button>`).join('')}</div>`;
  const spine = darker(cv.color, .72);
  return topbar(`<div class="row"><span class="muted">詩集設定 · 封面</span><a class="btn" href="#/">回首頁</a></div>`) + `
  <main class="page" style="gap:32px"><div class="wrap" style="gap:32px">
    <aside class="side" style="flex:1 1 300px;gap:22px">
      <div class="drop" data-drop="cover" style="padding:22px">
        ${IC.img}
        <div style="font-weight:600;font-size:15px">上傳封面圖片</div>
        <p style="font-size:13px">JPG · PNG · WebP，最大 15MB<br>建議直式 2:3，例如 1600 × 2400<span class="d-only"><br>也可以複製圖片後在這一頁按 Ctrl＋V</span></p>
        <div class="row">
          <label class="btn sq" for="f-cover">選擇圖片</label>
          <input id="f-cover" class="sr" type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-file="cover">
          <button type="button" class="btn ghost sq" data-act="cv-paste">從剪貼簿貼上</button>
          ${cv.img ? '<button type="button" class="btn ghost sq" data-act="cv-rmimg">移除圖片</button>' : ''}
        </div>
      </div>
      ${cv.img ? `<section style="display:flex;flex-direction:column;gap:10px">
        <h2 class="label">縮放與位置</h2>
        <label style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--ink2)">縮放
          <input type="range" min="100" max="250" value="${cv.zoom}" data-in="cv-zoom" style="flex:1;accent-color:var(--ink)"></label>
        <p class="note">在封面上直接拖曳圖片，調整要顯示的部分。</p>
      </section>` : ''}
      <section style="display:flex;flex-direction:column;gap:10px">
        <h2 class="label">${cv.img ? '書背顏色' : '封面顏色'}</h2>
        <div class="swatches">${COLORS.map(col => `<button type="button" class="sw${cv.color === col ? ' on' : ''}" style="background:${col}" data-act="cv" data-k="color" data-v="${col}" aria-label="顏色 ${col}" aria-pressed="${cv.color === col}"></button>`).join('')}</div>
      </section>
      <section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">封面文字位置</h2>${seg('pos', [['top', '上'], ['middle', '中'], ['bottom', '下'], ['none', '不顯示']], cv.pos)}</section>
      <section style="display:flex;flex-direction:column;gap:10px"><h2 class="label">文字顏色</h2>${seg('ink', [['light', '淺色字'], ['dark', '深色字']], cv.ink)}</section>
      <label class="field">詩集名稱<input class="serif" data-in="cv-name" value="${esc(c.name)}"></label>
      <label class="field">封面副標<input data-in="cv-author" value="${esc(c.author)}" placeholder="例如：你的名字　詩集"></label>
      <button type="button" class="btn ghost danger sq" data-act="del-col" style="align-self:flex-start">刪除這本詩集</button>
    </aside>
    <section style="flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:36px;align-items:center">
      <div class="bookwrap" id="bookwrap">
        <div class="spine" style="background:${spine}"><span style="color:${cv.ink === 'dark' && !cv.img ? '#1C1B19' : '#F6F1E6'}">${esc(c.name)}</span></div>
        ${coverHTML(c, 'lg', { drag: true })}
      </div>
      <div style="align-self:stretch;display:flex;flex-direction:column;gap:16px">
        <div class="row" style="justify-content:space-between">
          <h2 class="sec" style="font-size:22px">收錄的詩 <span class="muted" style="font-family:var(--sans)">${poems.length} 首</span></h2>
          <div class="row">
            ${poems.length ? `<a class="btn sq" href="#/flow/${poems[0].id}" data-act="scope-collection">${IC.scroll}連續閱讀</a><button type="button" class="btn sq" data-act="export-col">導出整本 PDF</button>${selBtnHTML()}` : ''}
            <label class="btn sq" for="f-colpoem">匯入檔案到這本</label>
            <input id="f-colpoem" class="sr" type="file" accept=".txt,.md,.markdown,.docx,.zip,application/zip,text/plain,image/*" multiple data-file="colpoem">
            <a class="btn dark sq" href="#/new?col=${c.id}">新增詩篇</a>
          </div>
        </div>
        <div class="grid">${poems.length ? poems.map(cardHTML).join('') : '<div class="empty" style="grid-column:1/-1">這本詩集還沒有詩</div>'}</div>
      </div>
    </section>
  </div></main>`;
}
function refreshCover(c) {
  const bw = $('#bookwrap'); if (!bw) return;
  const spine = darker(c.cover.color, .72);
  bw.innerHTML = `<div class="spine" style="background:${spine}"><span style="color:${c.cover.ink === 'dark' && !c.cover.img ? '#1C1B19' : '#F6F1E6'}">${esc(c.name)}</span></div>${coverHTML(c, 'lg', { drag: true })}`;
  bindCoverDrag(c);
}
function bindCoverDrag(c) {
  const el = $('#bigcover'); if (!el || !c.cover.img) return;
  let sx, sy, ox, oy, on = false;
  el.addEventListener('pointerdown', e => { on = true; sx = e.clientX; sy = e.clientY; ox = c.cover.x; oy = c.cover.y; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!on) return;
    const k = 100 / (c.cover.zoom / 100);
    c.cover.x = clamp(ox - (e.clientX - sx) / el.clientWidth * k, 0, 100);
    c.cover.y = clamp(oy - (e.clientY - sy) / el.clientHeight * k, 0, 100);
    const img = el.querySelector('img'); if (img) img.style.objectPosition = `${c.cover.x}% ${c.cover.y}%`;
  });
  const end = () => { if (on) { on = false; save(); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
async function setIllus(file) {
  if (!ED || !file) return;
  if (!/^image\//.test(file.type) && !isImage(file)) { toast('請選擇圖片'); return; }
  if (file.size > 15 * 1024 * 1024) { toast('圖片超過 15MB'); return; }
  try {
    const blob = file.size > 2.5 * 1024 * 1024 || !/^image\/(jpeg|png|webp|gif)$/.test(file.type) ? await shrinkImage(file, 2400, 'image/jpeg') : file;
    const url = await uploadImageBlob(blob, file.name || 'illus.jpg');
    const keep = ED; keep.illustration = url; $('#app').innerHTML = editorView(keep); ED = keep; edRefresh(); bindDrops();
    toast('已加上插圖，儲存後會顯示在詩的上方');
  } catch (e) { toast('插圖儲存失敗'); }
}
// 讀剪貼簿裡的圖片（iPhone 第一次會跳出「貼上」確認）
async function clipImage() {
  if (!navigator.clipboard || !navigator.clipboard.read) { toast('這個瀏覽器不能讀取剪貼簿的圖片，請改用「選擇圖片」'); return null; }
  try {
    const items = await navigator.clipboard.read();
    for (const it of items) { const t = it.types.find(x => /^image\//.test(x)); if (t) { const b = await it.getType(t); return new File([b], 'paste.' + (t.split('/')[1] || 'png'), { type: t }); } }
    toast('剪貼簿裡沒有圖片。請長按圖片選「拷貝」，不是拷貝網址', 5000); return null;
  } catch (e) { toast('沒辦法讀取剪貼簿，請再按一次，出現「貼上」時點它', 5000); return null; }
}
const pastedImage = e => { const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(x => x.kind === 'file' && /^image\//.test(x.type)); const f = it && it.getAsFile(); return f ? new File([f], 'paste.' + (f.type.split('/')[1] || 'png'), { type: f.type }) : null; };
document.addEventListener('paste', e => {
  const t = e.target, r = route();
  if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;
  const f = pastedImage(e); if (!f) return;
  if (r.view === 'col' && colById(r.id)) { e.preventDefault(); uploadCover(colById(r.id), f); }
  else if ((r.view === 'edit' || r.view === 'new') && ED) { e.preventDefault(); setIllus(f); }
});
async function uploadCover(c, file) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { toast('請選擇 JPG、PNG 或 WebP 圖片'); return; }
  if (file.size > 15 * 1024 * 1024) { toast('圖片超過 15MB'); return; }
  let url;
  if (serverMode) {
    try { url = await uploadImageBlob(file, file.name); } catch (e) { toast('上傳失敗'); return; }
  } else {
    url = await ShiSync.storeImage(file);
  }
  Object.assign(c.cover, { img: url, zoom: 100, x: 50, y: 50 });
  save(); render(); toast('封面已更新');
}
function newCollection() {
  const name = (prompt('詩集名稱') || '').trim(); if (!name) return null;
  const c = { id: uid(), name, author: '', cover: { img: null, color: COLORS[DB.collections.length % COLORS.length], zoom: 100, x: 50, y: 50, pos: 'top', ink: 'light' } };
  DB.collections.push(c); save(); return c;
}

// ---------- modal ----------
let MODAL_OK = null;
function modal({ title, body, ok = '確定', danger = false, onOk, wide = false }) {
  closeModal();
  const m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-bg';
  m.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-t">
    <h2 id="modal-t">${title}</h2><div class="modal-body">${body}</div>
    <div class="modal-foot"><button type="button" class="btn ghost" data-act="modal-cancel">取消</button>${ok ? `<button type="button" class="btn ${danger ? 'red' : 'dark'}" data-act="modal-ok">${ok}</button>` : ''}</div></div>`;
  document.body.appendChild(m); MODAL_OK = onOk || null;
  const f = m.querySelector('.modal-body input, .modal-body select, .modal-body button'); if (f) f.focus();
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); MODAL_OK = null; }

// ---------- trash ----------
function trashPoems(ids) {
  const t = Date.now(); const ps = ids.map(anyPoemById).filter(p => p && !p.deleted);
  if (!ps.length) return;
  ps.forEach(p => { p.deleted = t; p.updated = t; });
  if (ps.some(p => p.id === DB.prefs.last)) DB.prefs.last = null;
  save();
  toast(ps.length === 1 ? `已把〈${ps[0].title}〉移到回收桶` : `已把 ${ps.length} 首移到回收桶`, 6000,
    { label: '復原', fn: () => { ps.forEach(p => { delete p.deleted; p.updated = Date.now(); }); save(); render(); toast('已復原'); } });
}
const trashed = () => DB.poems.filter(p => p.deleted).sort((a, b) => b.deleted - a.deleted);
function trashView() {
  const ps = trashed();
  const left = p => Math.max(0, 30 - Math.floor((Date.now() - p.deleted) / 864e5));
  return topbar(`<a class="btn" href="#/">回首頁</a>`) + `
  <main class="page" style="gap:28px">
    <div class="row" style="justify-content:space-between">
      <div><h1 class="sec" style="font-size:34px">回收桶</h1><p class="muted" style="margin:8px 0 0">${ps.length} 首 · 移到回收桶超過 30 天的詩會自動永久刪除</p></div>
      ${ps.length ? `<div class="row"><button type="button" class="btn" data-act="trash-restore-all">全部還原</button><button type="button" class="btn ghost danger" data-act="trash-empty">清空回收桶</button></div>` : ''}
    </div>
    ${ps.length ? `<div class="tlist">${ps.map(p => `<div class="trow">
      <div class="tmain"><div class="pcard-title">${esc(p.title)}</div><div class="muted">${esc(authorLabel(authorOf(p)))} · ${TYPES[p.type]} · 還有 ${left(p)} 天會永久刪除</div></div>
      <button type="button" class="btn sq" data-act="trash-restore" data-id="${p.id}">還原</button>
      <button type="button" class="btn ghost sq danger" data-act="trash-purge" data-id="${p.id}">永久刪除</button>
    </div>`).join('')}</div>` : '<div class="empty">回收桶是空的</div>'}
  </main>`;
}

// ---------- selection & batch ----------
const SEL = { on: false, ids: new Set() };
const selBtnHTML = () => `<button type="button" class="btn sq${SEL.on ? ' dark' : ''}" data-act="sel-mode">${SEL.on ? '完成選取' : '選取'}</button>`;
function selBar() {
  let bar = $('#selbar');
  if (!SEL.on) { if (bar) bar.remove(); document.body.classList.remove('selecting'); return; }
  document.body.classList.add('selecting');
  if (!bar) { bar = document.createElement('div'); bar.id = 'selbar'; bar.className = 'selbar no-print'; document.body.appendChild(bar); }
  const n = SEL.ids.size, dis = n ? '' : ' disabled';
  bar.innerHTML = `<div class="selbar-in">
    <b class="selcount">已選 ${n} 首</b>
    <button type="button" class="btn sq" data-act="sel-all">全選這個列表</button>
    <button type="button" class="btn sq ghost" data-act="sel-none"${dis}>全部取消</button>
    <span class="selgap"></span>
    <button type="button" class="btn sq" data-act="batch-col"${dis}>移到詩集</button>
    <button type="button" class="btn sq" data-act="batch-author"${dis}>改作者</button>
    <button type="button" class="btn sq" data-act="batch-tag"${dis}>加標籤</button>
    <button type="button" class="btn sq" data-act="batch-export"${dis}>導出 PDF</button>
    <button type="button" class="btn sq red" data-act="batch-del"${dis}>移到回收桶</button>
  </div>`;
}
function selToggle(btn) {
  const id = btn.dataset.id; if (SEL.ids.has(id)) SEL.ids.delete(id); else SEL.ids.add(id);
  const on = SEL.ids.has(id);
  btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on); btn.querySelector('.selbox').textContent = on ? '✓' : '';
  selBar();
}
const selPoems = () => [...SEL.ids].map(poemById).filter(Boolean).sort(byCreated);
function batchDone(msg) { touch(...selPoems()); SEL.on = false; SEL.ids.clear(); save(); render(); toast(msg); }
function batchCol() {
  const ps = selPoems();
  modal({ title: `把 ${ps.length} 首移到詩集`, body: `
    <label class="field">移到<select id="m-col" data-in="m-col">${DB.collections.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}<option value="">（不放入詩集）</option><option value="__new">＋ 新增詩集…</option></select></label>
    <label class="field" id="m-newwrap" style="display:none">新詩集名稱<input id="m-newname" class="serif"></label>`,
    ok: '移動', onOk: () => {
      let v = $('#m-col').value;
      if (v === '__new') {
        const name = $('#m-newname').value.trim(); if (!name) { $('#m-newname').focus(); return false; }
        const c = { id: uid(), name, author: '', cover: { img: null, color: COLORS[DB.collections.length % COLORS.length], zoom: 100, x: 50, y: 50, pos: 'top', ink: 'light' } };
        DB.collections.push(c); v = c.id;
      }
      ps.forEach(p => { p.collectionId = v || null; });
      const c = v && colById(v); batchDone(`已把 ${ps.length} 首移到${c ? '《' + c.name + '》' : '未分類'}`);
    } });
}
function batchAuthor() {
  const ps = selPoems();
  modal({ title: `修改 ${ps.length} 首的作者`, body: `
    <div class="two"><label class="field">作者<input id="m-au" list="m-au-dl" autocomplete="off" placeholder="空白＝佚名"></label>
    <label class="field dyn">朝代<input id="m-dyn" list="dyn-dl" autocomplete="off" placeholder="可空白"></label></div>
    <datalist id="m-au-dl">${[...DB.authors].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')).map(a => `<option value="${esc(a.name)}">${esc(a.dynasty)}</option>`).join('')}</datalist>${dynDatalist()}
    <p class="note">輸入既有作者的名字會歸到他名下；新名字會自動建立作者。</p>`,
    ok: '修改', onOk: () => {
      const id = resolveAuthor($('#m-au').value, $('#m-dyn').value);
      ps.forEach(p => { p.authorId = id; });
      batchDone(`已把 ${ps.length} 首改成「${authorLabel(authorById(id))}」`);
    } });
}
function batchTag() {
  const ps = selPoems();
  modal({ title: `幫 ${ps.length} 首加標籤`, body: `<label class="field">標籤（用空格或逗號分隔）<input id="m-tags" placeholder="例如：愛情 夏天"></label>
    <label class="check"><input type="checkbox" id="m-tagrm"> 改成「移除」這些標籤</label>`,
    ok: '套用', onOk: () => {
      const tags = $('#m-tags').value.split(/[\s,，、]+/).filter(Boolean); if (!tags.length) { $('#m-tags').focus(); return false; }
      const rm = $('#m-tagrm').checked;
      ps.forEach(p => { p.tags = p.tags || []; tags.forEach(t => { const i = p.tags.indexOf(t); if (rm) { if (i >= 0) p.tags.splice(i, 1); } else if (i < 0) p.tags.push(t); }); });
      batchDone(rm ? `已從 ${ps.length} 首移除標籤` : `已幫 ${ps.length} 首加上標籤`);
    } });
}

// ---------- folder import ----------
let IMP = null;
const SKIP_NAME = /^(\.|~\$)|^(desktop\.ini|thumbs\.db)$/i;
const TEXT_EXT = /\.(txt|md|markdown|text|docx)$/i;
async function entriesFromRoots(roots) {
  const out = [];
  const walk = async e => {
    if (e.isFile) { const f = await new Promise((res, rej) => e.file(res, rej)); out.push({ file: f, rel: e.fullPath.replace(/^\//, '') }); return; }
    const rd = e.createReader(); let batch;
    do { batch = await new Promise((res, rej) => rd.readEntries(res, rej)); for (const c of batch) await walk(c); } while (batch.length);
  };
  for (const r of roots) await walk(r);
  return out;
}
// ---------- zip 壓縮檔（iPhone 不能選資料夾，可以把資料夾壓縮成 zip） ----------
const MIME = { txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic' };
async function unzipEntries(zipFile) {
  const u8 = new Uint8Array(await zipFile.arrayBuffer()), dv = new DataView(u8.buffer);
  let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error(`「${zipFile.name}」不是有效的 zip 壓縮檔`);
  const n = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true);
  const utf8 = new TextDecoder('utf-8', { fatal: true }), big5 = new TextDecoder('big5');
  const out = [];
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(off, true) !== 0x02014b50) break;
    const flags = dv.getUint16(off + 8, true), method = dv.getUint16(off + 10, true);
    const csize = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
    const nb = u8.subarray(off + 46, off + 46 + nl);
    let name; try { name = (flags & 0x800) ? new TextDecoder().decode(nb) : utf8.decode(nb); } catch (er) { name = big5.decode(nb); }
    off += 46 + nl + xl + cl;
    name = name.replace(/\\/g, '/');
    if (name.endsWith('/') || /(^|\/)__MACOSX\//.test(name) || SKIP_NAME.test(name.split('/').pop())) continue;
    const ds = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const raw = u8.subarray(ds, ds + csize);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) {
      if (typeof DecompressionStream === 'undefined') throw new Error('這個瀏覽器不能解開 zip，請更新 iOS 或改選多個檔案');
      data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    } else continue;
    const base = name.split('/').pop(), ext = (base.split('.').pop() || '').toLowerCase();
    out.push({ file: new File([data], base, { type: MIME[ext] || '' }), path: name });
  }
  return out;
}
// 一次匯入很多個檔案或 zip：和「匯入整個資料夾」一樣先列出清單
async function batchImport(files, colId) {
  const list = [];
  const zips = files.filter(f => /\.zip$/i.test(f.name) || f.type === 'application/zip');
  const others = files.filter(f => !zips.includes(f));
  let root = others.length ? '選取的檔案' : zips[0].name.replace(/\.zip$/i, '');
  try {
    for (const z of zips) {
      toast(`正在解開「${z.name}」…`, 60000);
      const ents = await unzipEntries(z);
      const tops = new Set(ents.map(x => x.path.split('/')[0]));
      const zbase = z.name.replace(/\.zip$/i, '');
      // zip 裡只有一個最外層資料夾：用它當名字；不然用 zip 的檔名
      ents.forEach(x => list.push({ file: x.file, rel: tops.size === 1 && x.path.includes('/') ? x.path : zbase + '/' + x.path }));
      if (zips.length === 1 && !others.length && tops.size === 1 && ents[0] && ents[0].path.includes('/')) root = [...tops][0];
    }
  } catch (e) { toast(e.message || '解壓縮失敗', 6000); return; }
  others.forEach(f => list.push({ file: f, rel: root + '/' + f.name }));
  const col = colId && colById(colId);
  await startFolderImport(list, { batch: true, zip: zips.length > 0 && !others.length, col: col ? col.name : '' });
}
async function startFolderImport(list, opt = {}) {
  list = list.filter(x => !SKIP_NAME.test(x.rel.split('/').pop()) && !/(^|\/)__MACOSX\//.test(x.rel));
  if (!list.length) { toast('資料夾裡沒有檔案'); return; }
  toast(`正在讀取 ${list.length} 個檔案…`, 60000);
  const rows = [];
  for (const { file, rel } of list) {
    const parts = rel.split('/'), name = parts[parts.length - 1];
    const row = { id: uid(), file, rel, name, folder: parts.length >= 3 ? parts.slice(1, -1).join(' / ') : '', kind: '', status: '', checked: false, d: null, msg: '' };
    if (isImage(file)) row.kind = 'image';
    else if (TEXT_EXT.test(name)) {
      try { const { text, ext } = await readFile(file); row.d = parseImported(text, name, ext); row.kind = 'text'; }
      catch (e) { row.kind = 'error'; row.status = 'error'; row.msg = e.message || '讀不出來'; }
    } else { row.kind = 'error'; row.status = 'error'; row.msg = /\.(pdf|doc)$/i.test(name) ? '這一版還不支援 ' + extOf(file).toUpperCase() : '不是詩稿檔案'; }
    rows.push(row);
  }
  // 圖片：檔名或標題和某首詩一樣 → 當插圖；否則用文字辨識
  const bk = n => ShiImport.normKey(String(n).replace(/\.[^.]+$/, '').replace(/^.*[》>]/, ''));
  for (const im of rows.filter(r => r.kind === 'image')) {
    const k = bk(im.name);
    const t = k && rows.find(r => r.kind === 'text' && r.folder === im.folder && (bk(r.name) === k || ShiImport.normKey(r.d.title) === k || (k.length >= 3 && bk(r.name).endsWith(k))));
    if (t) { im.status = 'illus'; im.pair = t.id; im.checked = true; im.msg = `當作〈${t.d.title}〉的插圖`; }
    else { im.status = 'ocr'; im.checked = true; im.msg = serverMode ? '會用文字辨識轉成文字（匯入後標上「待校對」）' : '會在手機上辨識成文字（匯入後標上「待校對」）；辨識不了的留給電腦版'; }
  }
  // 重複比對：和詩頁裡已有的詩、和資料夾裡前面的檔案
  const existing = live().map(p => ({ p, k: ShiImport.normKey(p.text) }));
  const textRows = rows.filter(r => r.kind === 'text').sort((a, b) => (a.folder > b.folder ? 1 : a.folder < b.folder ? -1 : 0) || ((a.d.date || '9999') > (b.d.date || '9999') ? 1 : (a.d.date || '9999') < (b.d.date || '9999') ? -1 : 0) || (a.rel > b.rel ? 1 : -1));
  const seen = [];
  for (const r of textRows) {
    const k = ShiImport.normKey(r.d.text); r.key = k;
    if (!k) { r.status = 'error'; r.msg = '檔案裡沒有內容'; continue; }
    const hit = existing.find(e => e.k === k);
    if (hit) { r.status = 'dup'; r.dupOf = hit.p.id; r.msg = `詩頁裡已經有〈${hit.p.title}〉`; continue; }
    const h2 = seen.find(e => e.key === k);
    if (h2) { r.status = 'dup'; r.msg = `和「${h2.rel}」內容相同`; continue; }
    let best = '', bs = 0;
    for (const e of existing) { const sc = ShiImport.similarity(k, e.k); if (sc > bs) { bs = sc; best = e.p.title; } }
    for (const e of seen) { const sc = ShiImport.similarity(k, e.key); if (sc > bs) { bs = sc; best = e.d.title; } }
    seen.push(r);
    if (bs >= .85) { r.status = 'maybe'; r.msg = `和〈${best}〉有 ${Math.round(bs * 100)}% 相同，可能是同一首`; continue; }
    r.status = 'new'; r.checked = true;
  }
  for (const im of rows.filter(r => r.status === 'illus')) {
    const t = rows.find(r => r.id === im.pair);
    const ex = t && t.dupOf && poemById(t.dupOf);
    if (ex && ex.illustration) { im.status = 'dup'; im.checked = false; im.msg = `〈${ex.title}〉已經有插圖了`; }
    else if (ex) im.msg = `加到詩頁裡已有的〈${ex.title}〉當插圖`;
  }
  const order = { new: 0, maybe: 1, ocr: 2, illus: 3, dup: 4, error: 5 };
  rows.sort((a, b) => order[a.status] - order[b.status] || textRows.indexOf(a) - textRows.indexOf(b));
  IMP = { rows, root: list[0].rel.split('/')[0], useFolders: true, rootCol: opt.col || '', order: textRows.map(r => r.id), batch: !!opt.batch, zip: !!opt.zip };
  $('#toast').classList.remove('show');
  go('#/import');
}
const IMP_BADGE = { new: ['新的', 'b-new'], maybe: ['可能重複', 'b-maybe'], dup: ['重複', 'b-dup'], illus: ['插圖', 'b-illus'], ocr: ['圖片辨識', 'b-ocr'], error: ['無法匯入', 'b-err'] };
const FLAG_TEXT = { ptt: 'PTT 文章：已去掉文章標頭、簽名檔與推文', collapsed: '原稿每行之間都空一行，已合併；空兩行以上才當作分節', 'title-guessed': '沒有標題，暫時用第一行當標題', prose: '段落很長，看起來可能是散文' };
function impTarget(r) {
  const name = IMP.useFolders && r.folder ? r.folder : IMP.rootCol;
  return name || '';
}
function importView() {
  const rows = IMP.rows;
  const cnt = s => rows.filter(r => r.status === s).length;
  const nSel = rows.filter(r => r.checked).length;
  const folders = [...new Set(rows.map(r => r.folder).filter(Boolean))];
  const rowHTML = r => {
    const [bl, bc] = IMP_BADGE[r.status] || ['', ''];
    const d = r.d;
    const dis = r.status === 'error';
    const target = r.kind === 'text' || r.status === 'ocr' ? impTarget(r) : '';
    const preview = d ? (d.text.split('\n').slice(0, 14).join('\n') + (d.text.split('\n').length > 14 ? '\n……' : '')) : '';
    return `<details class="irow${r.checked ? ' on' : ''}">
      <summary>
        <label class="icheck" onclick="event.stopPropagation()"><input type="checkbox" data-in="imp-check" data-id="${r.id}" ${r.checked ? 'checked' : ''} ${dis ? 'disabled' : ''} aria-label="匯入 ${esc(d ? d.title : r.name)}"></label>
        <span class="ibadge ${bc}">${bl}</span>
        <span class="ititle">${esc(d ? d.title : r.name)}</span>
        <span class="iauthor">${d ? esc((d.dynasty ? d.dynasty + ' · ' : '') + (d.authorName || '佚名')) : ''}</span>
        <span class="isrc">${d ? esc([d.source, d.date].filter(Boolean).join(' · ')) : ''}</span>
        <span class="icol">${target ? '《' + esc(target) + '》' : ''}</span>
      </summary>
      <div class="idetail">
        <div class="muted">檔案：${esc(r.rel)}</div>
        ${r.msg ? `<div class="imsg">${esc(r.msg)}</div>` : ''}
        ${d ? (d.flags || []).filter(f => FLAG_TEXT[f]).map(f => `<div class="note">・${FLAG_TEXT[f]}</div>`).join('') : ''}
        ${d && d.authorNick ? `<div class="note">・PTT 暱稱「${esc(d.authorNick)}」會存進作者簡介</div>` : ''}
        ${d && d.tags.length ? `<div class="note">・標籤：${d.tags.map(esc).join('、')}</div>` : ''}
        ${preview ? `<pre class="ipre">${esc(preview)}</pre>` : ''}
        ${d && d.note ? `<div class="note">附記：${esc(d.note.slice(0, 120))}${d.note.length > 120 ? '……' : ''}</div>` : ''}
      </div>
    </details>`;
  };
  return topbar(`<a class="btn" href="#/" data-act="imp-cancel">取消</a>`) + `
  <main class="page" style="gap:24px">
    <div>
      <h1 class="sec" style="font-size:32px">${IMP.zip ? '匯入壓縮檔' : IMP.batch ? '批次匯入' : '匯入資料夾'}「${esc(IMP.root)}」</h1>
      <p class="muted" style="margin:8px 0 0">${rows.length} 個檔案 · 點每一列可以展開預覽 · 重複的已經幫你取消勾選</p>
    </div>
    <div class="istats">
      <span class="ibadge b-new">新的 ${cnt('new')}</span>
      <span class="ibadge b-maybe">可能重複 ${cnt('maybe')}</span>
      <span class="ibadge b-dup">重複 ${cnt('dup')}</span>
      ${cnt('illus') ? `<span class="ibadge b-illus">插圖 ${cnt('illus')}</span>` : ''}
      ${cnt('ocr') ? `<span class="ibadge b-ocr">圖片辨識 ${cnt('ocr')}</span>` : ''}
      ${cnt('error') ? `<span class="ibadge b-err">無法匯入 ${cnt('error')}</span>` : ''}
    </div>
    <div class="card panel">
      <p class="label">放到哪本詩集</p>
      ${folders.length ? `<label class="check"><input type="checkbox" data-in="imp-folders" ${IMP.useFolders ? 'checked' : ''}> 子資料夾變成詩集（${folders.map(f => '《' + esc(f) + '》').join('、')}），已經有同名詩集就放進去</label>` : ''}
      <label class="field" style="max-width:420px">${folders.length ? '資料夾最外層的詩' : '這些詩'}放進
        <select data-in="imp-rootcol">
          <option value="">（不放入詩集）</option>
          <option value="${esc(IMP.root)}" ${IMP.rootCol === IMP.root ? 'selected' : ''}>${colByName(IMP.root) ? '' : '新詩集'}《${esc(IMP.root)}》</option>
          ${DB.collections.filter(c => c.name !== IMP.root).map(c => `<option value="${esc(c.name)}" ${IMP.rootCol === c.name ? 'selected' : ''}>《${esc(c.name)}》</option>`).join('')}
        </select></label>
    </div>
    <div class="row" style="justify-content:space-between">
      <div class="row"><button type="button" class="btn sq" data-act="imp-only-new">只勾新的</button><button type="button" class="btn sq ghost" data-act="imp-all">全部勾選</button><button type="button" class="btn sq ghost" data-act="imp-none">全部取消</button></div>
      <button type="button" class="btn red" data-act="imp-go" ${nSel ? '' : 'disabled'}>匯入勾選的 ${nSel} 項</button>
    </div>
    <div class="ilist">${rows.map(rowHTML).join('')}</div>
    <p class="note">匯入前會自動備份目前的資料。原始檔案不會被修改。</p>
  </main>`;
}
const colByName = name => DB.collections.find(c => c.name === name);
function ensureCol(name) {
  let c = colByName(name);
  if (!c) { c = { id: uid(), name, author: '', cover: { img: null, color: COLORS[DB.collections.length % COLORS.length], zoom: 100, x: 50, y: 50, pos: 'top', ink: 'light' } }; DB.collections.push(c); }
  return c.id;
}
async function runImport() {
  const rows = IMP.rows.filter(r => r.checked);
  if (!rows.length) return;
  if (serverMode) { try { await fetch('api/backup?tag=import', { method: 'POST' }); } catch (e) {} }
  else { try { localStorage.setItem('shiye-data-before-import', JSON.stringify(DB)); } catch (e) {} }
  const byId = Object.fromEntries(IMP.rows.map(r => [r.id, r]));
  const textRows = IMP.order.map(id => byId[id]).filter(r => r.checked);
  let t = Date.now() - (rows.length + 5) * 1000;
  const created = {}; let nText = 0, nIllus = 0, nOcr = 0, fail = 0;
  for (const r of textRows) {
    const target = impTarget(r);
    const p = newPoem(Object.assign({}, r.d, { created: t += 1000 }), target ? ensureCol(target) : null);
    if (r.status === 'maybe') p.tags.push('可能重複');
    DB.poems.push(p); created[r.id] = p; nText++;
  }
  const imgs = rows.filter(r => r.kind === 'image');
  for (let i = 0; i < imgs.length; i++) {
    const im = imgs[i];
    toast(`處理圖片 ${i + 1} / ${imgs.length}…`, 60000);
    try {
      if (im.status === 'illus') {
        const pr = byId[im.pair];
        const target = created[im.pair] || (pr && pr.dupOf && poemById(pr.dupOf));
        if (!target || target.illustration) continue;
        target.illustration = serverMode ? await uploadImageBlob(im.file, im.name) : await ShiSync.storeImage(im.file);
        nIllus++;
      } else if (im.status === 'ocr') {
        const d = await ocrFile(im.file);
        const target = impTarget(im);
        const p = newPoem(Object.assign(d, { created: t += 1000 }), target ? ensureCol(target) : null);
        if (!d.pendingOCR) p.tags.push('待校對'); DB.poems.push(p); nOcr++;
      }
    } catch (e) { fail++; }
  }
  const skipped = IMP.rows.length - rows.length;
  save(true); IMP = null; HF.type = 'all'; HF.col = 'all'; HF.author = 'all'; HF.dyn = 'all'; HF.q = '';
  go('#/');
  toast(`已匯入 ${nText + nOcr} 首${nIllus ? `、${nIllus} 張插圖` : ''}，略過 ${skipped} 項${fail ? `，${fail} 張圖片處理失敗` : ''}`, 7000);
}

// ---------- export ----------
let EXP = null;
const EXP_SIZES = { auto: ['原始比例（長圖）', 1080, 0], square: ['正方形 1080×1080（IG 貼文）', 1080, 1080], story: ['直式 1080×1920（限時動態）', 1080, 1920], wall: ['橫式 1920×1080（桌布）', 1920, 1080] };
function openExport(o) {
  EXP = Object.assign({ kind: o.ids ? 'pdf' : 'png', size: 'auto', sign: true, range: 'one', paper: 'A4', unify: false }, o);
  modal({ title: '導出', body: '<div id="exp-body"></div>', ok: '導出', wide: true, onOk: () => { runExport(); return false; } });
  expBody();
}
function expBody() {
  const b = $('#exp-body'); if (!b || !EXP) return;
  const p = EXP.poemId && poemById(EXP.poemId);
  const multi = !!EXP.ids || EXP.range === 'scope';
  const n = EXP.ids ? EXP.ids.length : EXP.range === 'scope' && p ? scopeList(p).length : 1;
  const seg = (key, opts) => `<div class="seg">${opts.map(([k, l]) => `<button type="button" data-act="exp-set" data-k="${key}" data-v="${k}" class="${String(EXP[key]) === String(k) ? 'on' : ''}" aria-pressed="${String(EXP[key]) === String(k)}">${l}</button>`).join('')}</div>`;
  b.innerHTML = `
    ${EXP.ids ? `<p class="note" style="margin:0 0 4px">${esc(EXP.title || '')}　共 ${EXP.ids.length} 首</p>` : `<section><h3 class="label">要導出的詩</h3>${seg('range', [['one', `這一首〈${esc(p.title)}〉`], ['scope', `${esc(scopeName(p))}全部 ${scopeList(p).length} 首`]])}</section>`}
    <section><h3 class="label">格式</h3>${seg('kind', multi ? [['pdf', 'PDF']] : [['png', '圖片 PNG'], ['pdf', 'PDF']])}${multi ? '<p class="note">多首詩會導出成一本 PDF 小書（含目錄）。</p>' : ''}</section>
    ${EXP.kind === 'png' && !multi ? `
      <section><h3 class="label">尺寸</h3><div class="sizes">${Object.entries(EXP_SIZES).map(([k, v]) => `<button type="button" class="sizebtn${EXP.size === k ? ' on' : ''}" data-act="exp-set" data-k="size" data-v="${k}" aria-pressed="${EXP.size === k}"><span class="sz-shape sz-${k}"></span>${v[0]}</button>`).join('')}</div></section>
      <section><button type="button" class="toggle" data-act="exp-tg" data-k="sign" aria-pressed="${EXP.sign}"><span><span class="t1">角落加上作者與印章</span><span class="t2">右下角放一枚「詩」字小印與作者名</span></span><span class="switch" aria-hidden="true"></span></button></section>` : `
      <section><h3 class="label">紙張</h3>${seg('paper', [['A4', 'A4'], ['A5', 'A5（小書）']])}</section>
      ${n > 1 && p ? `<section><button type="button" class="toggle" data-act="exp-tg" data-k="unify" aria-pressed="${EXP.unify}"><span><span class="t1">全部統一用〈${esc(p.title)}〉的版面</span><span class="t2">關掉的話，每首用自己的風格</span></span><span class="switch" aria-hidden="true"></span></button></section>` : ''}`}
    <p class="note" id="exp-status">${serverMode ? '會用電腦上的 Edge 在背景排版，導出的樣子和畫面上一樣。' : '需要開啟詩頁程式才能導出。'}</p>`;
}
function exportFrameHTML(p, L, w, h, sign) {
  const st = STYLES[L.style] || STYLES.classic;
  const au = authorOf(p);
  return `<div class="xframe${h ? ' fixed' : ''}${sign ? ' signed' : ''}" style="width:${w}px;${h ? `height:${h}px;` : ''}background:${st.bg};color:${st.fg}">
    <div class="xfit" id="xfit">${illusHTML(p)}${articleHTML(p, L)}${p.note ? `<div class="pnote x">${esc(p.note)}</div>` : ''}</div>
    ${sign ? `<div class="xsign"><span>${esc(au ? au.name : '佚名')}</span>${SEAL}</div>` : ''}
  </div>`;
}
function exportLayout(p) { return flowLayout(layoutOf(p), p); }
const safeName = s => String(s || '詩頁').replace(/[\\/:*?"<>|]+/g, '').slice(0, 60) || '詩頁';
async function runExport() {
  if (!serverMode) { toast('需要開啟詩頁程式才能導出'); return; }
  const p = EXP.poemId && poemById(EXP.poemId);
  let ids = EXP.ids || (EXP.range === 'scope' ? scopeList(p).map(x => x.id) : [p.id]);
  const kind = ids.length > 1 ? 'pdf' : EXP.kind;
  const q = new URLSearchParams({ ids: ids.join(','), mode: kind });
  let w = 0, h = 0, scale = 1, name;
  if (kind === 'png') {
    const sz = EXP_SIZES[EXP.size]; w = sz[1]; h = sz[2];
    q.set('w', w); q.set('h', h); q.set('sign', EXP.sign ? 1 : 0);
    if (!h) {   // 原始比例：先量出高度
      const box = document.createElement('div'); box.className = 'xmeasure'; box.innerHTML = exportFrameHTML(p, exportLayout(p), w, 0, EXP.sign);
      document.body.appendChild(box); await document.fonts.ready; h = Math.ceil(box.firstElementChild.getBoundingClientRect().height); box.remove();
      q.set('h', 0); scale = 2;
    }
    name = `${safeName(p.title)}.png`;
  } else {
    q.set('paper', EXP.paper);
    if (EXP.unify && p) q.set('unify', p.id);
    if (EXP.coverCol) q.set('cover', EXP.coverCol);
    if (EXP.title) q.set('title', EXP.title);
    if (!EXP.ids && EXP.range === 'scope') q.set('title', scopeName(p) + ' 詩選');
    name = `${safeName(ids.length > 1 ? (q.get('title') || '詩選') : p.title)}.pdf`;
  }
  const st = $('#exp-status'); if (st) st.textContent = '導出中，請稍候…（第一次可能要十幾秒）';
  const okb = $('[data-act=modal-ok]'); if (okb) okb.disabled = true;
  try {
    const r = await fetch('api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, w, h, scale, hash: '#/print?' + q.toString() }) });
    if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) {} throw new Error(j.error === 'NOBROWSER' ? '找不到 Microsoft Edge 或 Chrome，沒辦法導出' : '導出失敗，請再試一次'); }
    const blob = await r.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    closeModal(); EXP = null; toast(`已導出「${name}」，存在「下載」資料夾`, 5000);
  } catch (e) {
    if (st) st.textContent = e.message; if (okb) okb.disabled = false;
  }
}
// 背景 Edge 打開的排版頁
async function renderPrint(r) {
  document.body.classList.add('printmode');
  const app = $('#app'), q = r.q;
  const ps = (q.get('ids') || '').split(',').map(anyPoemById).filter(Boolean);
  const unify = q.get('unify') && anyPoemById(q.get('unify'));
  if (q.get('mode') === 'png') {
    const p = ps[0]; const w = +q.get('w') || 1080, h = +q.get('h') || 0;
    app.innerHTML = exportFrameHTML(p, exportLayout(p), w, h, q.get('sign') === '1');
    await document.fonts.ready;
    if (h) {
      const fit = $('#xfit'), fr = fit.parentElement;
      const sign = fr.querySelector('.xsign');
      const pad = Math.round(Math.min(w, h) * .07), sh = sign ? sign.offsetHeight + pad * .4 : 0;
      const k = Math.min((w - pad * 2) / fit.scrollWidth, (h - pad * 2 - sh) / fit.scrollHeight, 1.8);
      fit.style.transform = `scale(${k})`;
    }
  } else {
    const paper = q.get('paper') === 'A5' ? 'A5' : 'A4';
    const title = q.get('title') || '';
    const col = q.get('cover') && colById(q.get('cover'));
    const multi = ps.length > 1;
    let html = `<style>.xpoem .art.vdir{height:${paper === 'A5' ? 150 : 225}mm}@page{size:${paper};margin:14mm 14mm 16mm}${multi ? '@page{@bottom-center{content:counter(page);font:10pt "Noto Serif TC",serif;color:#8a857a}}@page:first{@bottom-center{content:none}}' : ''}</style>`;
    const pageH = paper === 'A5' ? 178 : 265;
    if (col) html += `<section class="xpage xcover" style="min-height:${pageH}mm"><div class="bookwrap"><div class="spine" style="background:${darker(col.cover.color, .72)}"><span style="color:${col.cover.ink === 'dark' && !col.cover.img ? '#1C1B19' : '#F6F1E6'}">${esc(col.name)}</span></div>${coverHTML(col, 'lg')}</div></section>`;
    else if (multi) html += `<section class="xpage xtitle" style="min-height:${pageH}mm"><div class="xseal">${SEAL}</div><h1>${esc(title || '詩選')}</h1><p>${ps.length} 首</p></section>`;
    if (multi) html += `<section class="xpage xtoc"><h2>目錄</h2><ol>${ps.map(p => `<li><a href="#x-${p.id}"><span class="tt">${esc(p.title)}</span><span class="toc-a">${esc(authorLabel(authorOf(p)))}</span></a></li>`).join('')}</ol></section>`;
    html += ps.map(p => {
      const L = flowLayout(unify ? layoutOf(unify) : layoutOf(p), p);
      // PDF 的直排一頁放不下長詩：超過 16 行改用橫排
      if (L.dir === 'v' && stanzas(p.text).reduce((a, x) => a + x.lines.length + 1, 0) > 18) L.dir = 'h';
      return `<section class="xpage xpoem" id="x-${p.id}">${illusHTML(p)}${articleHTML(p, L)}${afterHTML(p)}</section>`;
    }).join('');
    app.innerHTML = html;
    await document.fonts.ready;
  }
  window.__READY = true;
}

// ---------- 同步設定頁 ----------
function fmtTime(t) {
  if (!t) return '還沒同步過';
  const d = (Date.now() - t) / 1000;
  if (d < 60) return '剛剛';
  if (d < 3600) return `${Math.floor(d / 60)} 分鐘前`;
  if (d < 86400) return `${Math.floor(d / 3600)} 小時前`;
  const x = new Date(t); return `${x.getMonth() + 1}/${x.getDate()} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}
function syncPillHTML() {
  const i = window.ShiSync ? ShiSync.info() : { configured: false, status: {} };
  if (!i.configured) return serverMode ? `<a class="syncpill" href="#/sync">同步到 iPhone</a>` : `<a class="syncpill warn" href="#/sync">尚未同步</a>`;
  const s = i.status.state;
  const label = s === 'syncing' ? '同步中…' : s === 'ok' || s === 'idle' ? `已同步・${fmtTime(i.last)}` : s === 'offline' ? '離線中' : '同步有問題';
  return `<a class="syncpill ${s === 'ok' || s === 'idle' || s === 'syncing' ? 'ok' : 'warn'}" href="#/sync">${label}</a>`;
}
document.addEventListener('shiye-sync', () => { document.querySelectorAll('.syncpill-slot').forEach(x => { x.innerHTML = syncPillHTML(); }); if (route().view === 'sync') { const b = $('#sync-status'); if (b) b.outerHTML = syncStatusHTML(); } });
document.addEventListener('shiye-synced', e => { const d = e.detail || {}; if (d.pulled) toast(`已從${serverMode ? '手機' : '電腦'}同步 ${d.pulled} 項更新`); });
setInterval(() => document.querySelectorAll('.syncpill-slot').forEach(x => { x.innerHTML = syncPillHTML(); }), 30000);
function syncStatusHTML() {
  const i = ShiSync.info(), s = i.status.state;
  const imgs = new Set(); live().forEach(p => [p.illustration, p.sourceImg].forEach(x => x && imgs.add(x))); DB.collections.forEach(c => c.cover && c.cover.img && imgs.add(c.cover.img));
  const icon = s === 'ok' || s === 'idle' ? ['b-new', '✓'] : s === 'syncing' ? ['b-illus', '…'] : ['b-maybe', '!'];
  return `<div class="card panel" id="sync-status">
    <div class="row" style="flex-wrap:nowrap">
      <span class="sync-ico ${icon[0]}" aria-hidden="true">${icon[1]}</span>
      <div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:600">${s === 'syncing' ? '同步中…' : s === 'ok' || s === 'idle' ? '已同步' : s === 'offline' ? '目前離線' : '同步有問題'}</div>
      <div class="muted">${esc(i.status.msg && s !== 'ok' ? i.status.msg : fmtTime(i.last) + '・' + esc(i.owner) + '/' + esc(i.repo))}</div></div>
      <button type="button" class="btn sq" data-act="sync-now"${s === 'syncing' ? ' disabled' : ''}>立即同步</button>
    </div>
    <div class="sync-stats"><div><b>${live().length}</b><span>首詩</span></div><div><b>${DB.authors.length}</b><span>位作者</span></div><div><b>${imgs.size}</b><span>張圖片</span></div></div>
    <p class="note">${serverMode ? '電腦版開著時，每分鐘和修改後都會自動同步。' : '沒有網路時也能讀詩、新增詩；連上網路後會自動上傳。'}</p>
  </div>`;
}
function syncView() {
  const i = ShiSync.info();
  const site = i.owner ? `https://${esc(i.owner)}.github.io/shiye/` : 'https://你的帳號.github.io/shiye/';
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return topbar(`<a class="btn" href="#/">回首頁</a>`) + `
  <main class="page narrow" style="gap:24px">
    <h1 class="sec" style="font-size:32px">同步</h1>
    ${i.configured ? syncStatusHTML() : `
    <div class="card panel">
      <p class="label">連接你的 GitHub 私人儲存庫</p>
      <p class="note" style="margin:0">詩、作者、詩集和圖片會存到你自己的私人儲存庫，${serverMode ? '手機版' : '電腦版'}用同一組設定就會看到同一份資料。</p>
      <label class="field">GitHub 使用者名稱<input id="sy-owner" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="例如 mochia7" value="${esc(i.owner || '')}"></label>
      <label class="field">儲存庫名稱<input id="sy-repo" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(i.repo || 'shiye-data')}"></label>
      <label class="field">同步密鑰（Fine-grained token）<input id="sy-token" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…"></label>
      <p class="note" style="margin:0">密鑰只存在這${serverMode ? '台電腦' : '支手機'}裡，用來讀寫這個儲存庫。還沒有密鑰：到 GitHub 的 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Fine-grained tokens</a> 產生，只開放 shiye-data，Contents 設成 Read and write。</p>
      <div class="row"><button type="button" class="btn red" data-act="sync-connect">連接並同步</button><span class="muted" id="sy-msg"></span></div>
    </div>`}
    ${i.configured ? `<div class="card panel">
      <p class="label">GitHub</p>
      <div class="kv"><span>帳號</span><span>${esc(i.owner)}</span></div>
      <div class="kv"><span>資料位置</span><span>${esc(i.repo)}（私人）</span></div>
      <div class="kv"><span>這台裝置</span><span>${esc(i.device)}</span></div>
      <a class="btn sq" href="#/history" style="align-self:flex-start">時光機：查看過去的版本</a>
      <button type="button" class="btn ghost sq danger" data-act="sync-off" style="align-self:flex-start">中斷這台裝置的同步</button>
      <p class="note" style="margin:0">中斷後，這台裝置上的詩會留著，只是不再同步；GitHub 上的資料也不會被刪除。</p>
    </div>` : ''}
    ${serverMode ? `<div class="card panel">
      <p class="label">iPhone 版</p>
      <p class="note" style="margin:0">用 iPhone 的 Safari 打開 <b>${site}</b>，按「分享 → 加入主畫面」，再到手機版的「同步」貼上同一組密鑰。</p>
    </div>` : `
    ${standalone ? '' : `<div class="card panel">
      <p class="label">加到主畫面</p>
      <p class="note" style="margin:0">在 Safari 按下方的「分享」按鈕 → 「加入主畫面」，之後從主畫面打開，就像一般 App，沒有網路也能讀。</p>
    </div>`}
    <div class="card panel">
      <p class="label">「存到詩頁」捷徑</p>
      <p class="note" style="margin:0">在 PTT App、Safari 選取一段詩 → 分享 → 存到詩頁，就會打開新增詩篇並帶入文字。只要做一次：</p>
      <ol class="steps">
        <li>打開 iPhone 的「捷徑」App，按右上角「＋」，捷徑名稱取「存到詩頁」。</li>
        <li>點下方的「i」，打開「在分享表單中顯示」，接收類型只留「文字」。</li>
        <li>加入動作「URL 編碼」，輸入選「捷徑輸入」。</li>
        <li>加入動作「打開 URL」，網址填：<code>${site}#/new?text=</code>，在最後面插入變數「URL 編碼文字」。</li>
        <li>按「完成」。之後在任何 App 選取文字 → 分享 → 存到詩頁。</li>
      </ol>
    </div>
    <div class="card panel">
      <p class="label">「整頁存到詩頁」捷徑（不用先選取）</p>
      <p class="note" style="margin:0">在 Safari 打開收錄全文的網頁 → 分享 → 整頁存到詩頁，詩頁會從整頁文字裡挑出詩的部分。</p>
      <ol class="steps">
        <li>在「捷徑」App 按「＋」，名稱取「整頁存到詩頁」。點「i」→ 打開「在分享表單中顯示」，接收類型只留「Safari 網頁」。</li>
        <li>加入動作「取得 Safari 閱讀器文章」（英文介面叫 Get Article using Safari Reader，在搜尋欄打「閱讀器」就找得到），輸入選「捷徑輸入」。</li>
        <li>加入動作「取得文章的詳細資訊」，選「內文」。</li>
        <li>加入動作「URL 編碼」，再加入「打開 URL」，網址填：<code>${site}#/new?page=1&amp;text=</code>，最後面插入變數「URL 編碼文字」。</li>
        <li>按「完成」。動作的名稱在不同 iOS 版本可能略有不同。</li>
      </ol>
    </div>
    <div class="card panel">
      <p class="label">每天早上打開今日一詩</p>
      <p class="note" style="margin:0">用「捷徑」的個人自動化，每天固定時間打開今天的詩（從你的詩庫裡挑）。</p>
      <ol class="steps">
        <li>打開「捷徑」App → 下方「自動化」→ 右上角「＋」→「特定時間」。</li>
        <li>設定時間（例如早上 8:00）、選「每天」，再選「立即執行」，按「下一步」。</li>
        <li>加入動作「打開 URL」，網址填：<code>${site}#/today</code>，按「完成」。</li>
      </ol>
      <p class="note" style="margin:0">iPhone 會用 Safari 打開這個網址。Safari 和主畫面上的詩頁資料是分開的，所以第一次要在 Safari 裡也到「同步」貼上同一組密鑰，之後就會看到同一份詩。<br>也可以只打開首頁最下方的「每天先看今日一詩」，每天第一次打開詩頁就會先顯示今天的詩。</p>
    </div>`}
  </main>`;
}

// ---------- 手機：分頁列與簡化畫面 ----------
const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
const TAB_VIEWS = { home: '#/', authors: '#/authors', cols: '#/cols', search: '#/search', favs: '#/favs' };
function mobileChrome(r) {
  document.body.classList.toggle('m-read', r.view === 'read');
  document.body.classList.remove('sheet-open', 'chrome-off');
  let bar = $('#tabbar');
  const show = isMobile() && ['home', 'authors', 'cols', 'search', 'favs', 'author', 'col', 'trash', 'sync'].includes(r.view);
  if (!show) { if (bar) bar.remove(); const f = $('#fab'); if (f) f.remove(); document.body.classList.remove('has-tabbar'); return; }
  document.body.classList.add('has-tabbar');
  const cur = r.view === 'author' ? 'authors' : r.view === 'col' ? 'cols' : r.view;
  const tabs = [['home', '首頁', '詩'], ['authors', '作者', '人'], ['cols', '詩集', '冊'], ['search', '搜尋', '尋'], ['favs', '書房', '☆']];
  if (!bar) { bar = document.createElement('nav'); bar.id = 'tabbar'; bar.className = 'tabbar'; bar.setAttribute('aria-label', '主要分頁'); document.body.appendChild(bar); }
  bar.innerHTML = tabs.map(([k, n, g]) => `<a href="${TAB_VIEWS[k]}" class="${cur === k ? 'on' : ''}"${cur === k ? ' aria-current="page"' : ''}><span class="tg" aria-hidden="true">${g}</span>${n}</a>`).join('');
  let fab = $('#fab');
  if (r.view === 'home' || r.view === 'col' || r.view === 'author') {
    if (!fab) { fab = document.createElement('a'); fab.id = 'fab'; fab.className = 'fab'; fab.setAttribute('aria-label', '新增詩篇'); fab.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'; document.body.appendChild(fab); }
    fab.href = r.view === 'col' ? `#/new?col=${r.id}` : r.view === 'author' && r.id !== 'none' ? `#/new?author=${r.id}` : '#/new';
  } else if (fab) fab.remove();
}
window.addEventListener('resize', () => mobileChrome(route()));
function colsView() {
  const books = DB.collections.map(c => {
    const n = live().filter(p => p.collectionId === c.id).length;
    return `<a class="book" href="#/col/${c.id}">${coverHTML(c, 'sm')}<span style="font-size:13px">${esc(c.name)}</span><span class="muted" style="margin-top:-6px">${n} 首</span></a>`;
  }).join('');
  return topbar('') + `<main class="page" style="gap:20px"><h1 class="sec" style="font-size:30px">詩集</h1>
    <div class="shelf m-shelf">${books}<div class="book"><button type="button" class="book-add" data-act="newcol">＋ 新增詩集</button></div></div></main>`;
}
function searchView() {
  return topbar('') + `<main class="page" style="gap:18px">
    <label for="q" class="sr">搜尋詩篇</label>
    <input id="q" class="search big" data-in="q" type="search" placeholder="搜尋詩人、詩題、詩句" value="${esc(HF.q)}">
    <div id="authhits">${authHitsHTML()}</div>
    <div class="grid" id="grid">${HF.q.trim() ? gridHTML() : '<div class="empty" style="grid-column:1/-1">輸入詩人、詩題或詩裡的一句話</div>'}</div>
  </main>`;
}
function favsView() {
  const ps = live().filter(p => p.fav).sort((a, b) => byCreated(b, a));
  return topbar('') + `<main class="page" style="gap:18px"><h1 class="sec" style="font-size:30px">收藏</h1>
    <div class="grid">${ps.length ? ps.map(cardHTML).join('') : '<div class="empty" style="grid-column:1/-1">閱讀時按標題旁的星號，就會收在這裡</div>'}</div></main>`;
}

// ---------- 手機閱讀：點一下隱藏工具列、左右滑換首 ----------
let touch0 = null;
document.addEventListener('touchstart', e => {
  if (route().view !== 'read' || e.touches.length !== 1 || e.target.closest('.controls, .mbar, .bar, .modal-bg, button, a, input')) { touch0 = null; return; }
  if (e.target.closest('mark.hl')) { touch0 = null; return; }
  const t = e.touches[0], sc = e.target.closest('.art');
  touch0 = { x: t.clientX, y: t.clientY, at: Date.now(), sc, sl: sc ? sc.scrollLeft : 0 };
}, { passive: true });
document.addEventListener('touchend', e => {
  if (!touch0) return;
  const t = e.changedTouches[0], dx = t.clientX - touch0.x, dy = t.clientY - touch0.y, dt = Date.now() - touch0.at;
  const start = touch0; touch0 = null;
  const p = poemById(route().id); if (!p) return;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 60 && dt < 700) {
    if (window.getSelection && String(window.getSelection()).trim()) return;
    const a = start.sc;
    if (a && a.classList.contains('vdir')) {
      // 直排像翻書：往右滑讀下去，捲到最左邊（詩的結尾）再往右滑才換下一首；在最右邊（開頭）往左滑回上一首
      const scrollable = a.scrollWidth > a.clientWidth + 4;
      const atStart = Math.abs(start.sl) <= 2, atEnd = Math.abs(start.sl) + a.clientWidth >= a.scrollWidth - 2;
      if (dx > 0 && (!scrollable || atEnd)) goNeighbor(p, 'next');
      else if (dx < 0 && (!scrollable || atStart)) goNeighbor(p, 'prev');
      return;
    }
    goNeighbor(p, dx < 0 ? 'next' : 'prev'); return;
  }
  if (e.target.closest && e.target.closest('mark.hl')) return;
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400 && isMobile()) document.body.classList.toggle('chrome-off');
});

// 直排的詩：滑鼠滾輪往下＝往左讀
document.addEventListener('wheel', e => {
  const a = e.target.closest && e.target.closest('.art.vdir'); if (!a || a.scrollWidth <= a.clientWidth + 2) return;
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  const max = a.scrollWidth - a.clientWidth, cur = Math.abs(a.scrollLeft);
  if ((e.deltaY > 0 && cur >= max - 1) || (e.deltaY < 0 && cur <= 1)) return;   // 到頭了就讓頁面正常捲
  e.preventDefault(); a.scrollLeft -= e.deltaY;
}, { passive: false });

// ---------- 手機：分享成圖片（直接在手機上畫） ----------
const SHARE_SIZES = { story: ['限時動態', 1080, 1920], square: ['正方形', 1080, 1080], auto: ['長圖', 1080, 0], wall: ['桌布', 1920, 1080] };
let SHARE = null, sealImg = null;
function loadSeal() {
  if (sealImg) return sealImg;
  sealImg = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'icon.svg'; });
  return sealImg;
}
const CANVAS_FONTS = { kai: '"LXGW WenKai TC","BiauKai","DFKai-SB","Kaiti TC","STKaiti",serif', serif: '"Noto Serif TC","Songti TC","PMingLiU",serif', sans: '"Noto Sans TC","PingFang TC",sans-serif' };
async function drawPoem(p, L, W, H, sign) {
  const st = STYLES[L.style] || STYLES.classic;
  const fam = CANVAS_FONTS[fontKey(L, st)] || CANVAS_FONTS.kai;
  try { await Promise.all(['400', '700'].map(w => document.fonts.load(`${w} 40px ${fam.split(',')[0]}`, '詩頁'))); } catch (e) {}
  const au = authorOf(p);
  let vertical = L.dir === 'v' && p.type !== 'shape';
  const rows = [];
  stanzas(p.text).forEach((s, si) => s.lines.forEach((ln, i) => rows.push({ text: ln.text, ind: L.keep ? ln.ind : 0, gap: i === 0 && si > 0 ? Math.min(s.gapMul || 1, 2) : 0 })));
  // 直排的長詩做成圖片字會太小：改用橫排
  if (vertical) {
    const fs0 = W / 30, per = Math.max(4, Math.floor((H || 1920) * .62 / (fs0 * 1.18)));
    const cols = rows.reduce((a, r) => a + (r.gap ? 1 : 0) + Math.max(1, Math.ceil(([...r.text].length + Math.round(r.ind)) / per)), 0);
    if (cols * fs0 * (LH[L.lh] ? LH[L.lh][1] : 2.2) * .8 > W * .8) vertical = false;
  }
  const cv = document.createElement('canvas'), x = cv.getContext('2d');
  const font = (size, bold) => `${bold ? 700 : 400} ${size}px ${fam}`;
  const lhK = LH[L.lh] ? LH[L.lh][1] : 2.2;
  const align = L.align || st.align;
  let layout;
  if (!vertical) {
    const wrap = (fs, maxW) => {
      x.font = font(fs); const out = [];
      rows.forEach(r => {
        const indW = r.ind * fs, hang = L.hang ? fs * 2 : 0; let line = '', first = true, gap = r.gap;
        for (const ch of r.text) {
          const room = maxW - indW - (first ? 0 : hang);
          if (x.measureText(line + ch).width > room && line) { out.push({ t: line, dx: indW + (first ? 0 : hang), gap }); line = ch; first = false; gap = 0; }
          else line += ch;
        }
        out.push({ t: line, dx: indW + (first ? 0 : hang), gap });
      });
      return out;
    };
    const fit = fs => {
      const maxW = W * .78, lines = wrap(fs, maxW), lh = fs * lhK * .82;
      const head = fs * 1.55 + fs * 1.6 + (au ? fs * .7 + fs * .9 : 0);
      const h = head + lines.reduce((a, l) => a + lh + l.gap * lh * .7, 0);
      return { fs, lines, lh, head, h, maxW };
    };
    let fs = Math.round(W / 17);
    layout = fit(fs);
    if (H) { while (fs > 14 && layout.h > H * .78) { fs -= 2; layout = fit(fs); } }
    const outH = H || Math.ceil(layout.h + W * .3);
    cv.width = W; cv.height = outH;
    x.fillStyle = st.bg; x.fillRect(0, 0, W, outH); x.fillStyle = st.fg; x.textBaseline = 'alphabetic';
    const left = (W - layout.maxW) / 2; let y = (outH - layout.h) / 2 + layout.fs * 1.3;
    const cx = W / 2;
    x.textAlign = align === 'center' ? 'center' : 'left';
    x.font = font(layout.fs * 1.55, true); x.fillText(p.title || '無題', align === 'center' ? cx : left, y);
    y += layout.fs * 1.2;
    if (au) { x.globalAlpha = .7; x.font = font(layout.fs * .7); x.fillText(authorLabel(au), align === 'center' ? cx : left, y + layout.fs * .4); x.globalAlpha = 1; y += layout.fs * 1.1; }
    y += layout.fs * 1.2;
    x.font = font(layout.fs);
    const blockW = Math.max(...layout.lines.map(l => x.measureText(l.t).width + l.dx), 1);
    const bx = align === 'center' ? cx - blockW / 2 : left;
    x.textAlign = 'left';
    layout.lines.forEach(l => { y += l.gap * layout.lh * .7; x.fillText(l.t, bx + l.dx, y); y += layout.lh; });
    H = outH;
  } else {
    // 直排：由右至左，一行一欄；太長的句子折到下一欄
    const plan = fs => {
      const colH = (H || 1920) * .62, per = Math.max(4, Math.floor(colH / (fs * 1.18)));
      const cols = [];
      rows.forEach(r => { let t = '　'.repeat(Math.round(r.ind)) + r.text; let first = true; if (r.gap) cols.push(null); do { cols.push({ t: t.slice(0, per), cont: !first }); t = t.slice(per); first = false; } while (t.length); });
      const colW = fs * lhK * .8;
      const titleCols = fs * 2.2 + (au ? fs * 1.3 : 0);
      const w = titleCols + cols.length * colW;
      return { fs, cols, colW, per, w, colH };
    };
    let fs = Math.round((H || 1920) / 22);
    layout = plan(fs);
    while (fs > 14 && layout.w > W * .8) { fs -= 2; layout = plan(fs); }
    if (!H) H = Math.round(W * 1.6);
    cv.width = W; cv.height = H;
    x.fillStyle = st.bg; x.fillRect(0, 0, W, H); x.fillStyle = st.fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    let cx = (W + layout.w) / 2 - layout.fs;
    const top = (H - layout.colH) / 2 + layout.fs * .6;
    const VP = { '，': '︐', '。': '︒', '、': '︑', '：': '︓', '；': '︔', '！': '︕', '？': '︖', '「': '﹁', '」': '﹂', '『': '﹃', '』': '﹄', '（': '︵', '）': '︶', '《': '︽', '》': '︾', '〈': '︿', '〉': '﹀', '…': '︙', '—': '︱', '─': '︱', '～': '≀' };
    const drawCol = (t, size, bold, xx) => { x.font = font(size, bold); [...t].forEach((ch, i) => x.fillText(VP[ch] || ch, xx, top + i * size * 1.18)); };
    drawCol(p.title || '無題', layout.fs * 1.3, true, cx); cx -= layout.fs * 2;
    if (au) { x.globalAlpha = .7; drawCol(authorLabel(au).replace(' · ', '　'), layout.fs * .62, false, cx + layout.fs * .4); x.globalAlpha = 1; cx -= layout.fs * 1.3; }
    layout.cols.forEach(c => { if (c) drawCol(c.t, layout.fs, false, cx); cx -= layout.colW; });
  }
  if (sign) {
    const s = Math.round(Math.min(W, H) * .045), m = Math.round(Math.min(W, H) * .05), im = await loadSeal();
    if (im) x.drawImage(im, W - m - s, H - m - s, s, s);
    x.globalAlpha = .75; x.fillStyle = st.fg; x.textAlign = 'right'; x.textBaseline = 'middle';
    x.font = `400 ${Math.round(s * .55)}px ${fam}`; x.fillText(au ? au.name : '佚名', W - m - s - s * .4, H - m - s / 2); x.globalAlpha = 1;
  }
  return cv;
}
function openShare(p) {
  SHARE = { id: p.id, size: 'story', sign: true };
  modal({ title: '分享成圖片', body: '<div id="share-body"></div>', ok: '', wide: true });
  shareBody();
}
async function shareBody() {
  const b = $('#share-body'); if (!b || !SHARE) return;
  const p = poemById(SHARE.id); if (!p) return;
  b.innerHTML = `<div class="share-prev" id="share-prev"><span class="muted">產生中…</span></div>
    <div class="sizes four">${Object.entries(SHARE_SIZES).map(([k, v]) => `<button type="button" class="sizebtn${SHARE.size === k ? ' on' : ''}" data-act="share-size" data-v="${k}" aria-pressed="${SHARE.size === k}"><span class="sz-shape sz-${k === 'story' ? 'story' : k}"></span>${v[0]}</button>`).join('')}</div>
    <button type="button" class="toggle" data-act="share-sign" aria-pressed="${SHARE.sign}"><span><span class="t1">角落加上作者與印章</span></span><span class="switch" aria-hidden="true"></span></button>
    <div class="row" style="flex-wrap:nowrap"><button type="button" class="btn sq" data-act="share-save" style="flex:1">存到照片</button><button type="button" class="btn red sq" data-act="share-go" style="flex:2">分享到 IG、LINE…</button></div>
    <p class="note" style="margin:0">「存到照片」會打開圖片，長按圖片選「加入照片」。</p>`;
  const sz = SHARE_SIZES[SHARE.size];
  const cv = await drawPoem(p, flowLayout(layoutOf(p), p), sz[1], sz[2], SHARE.sign);
  SHARE.canvas = cv;
  const pv = $('#share-prev'); if (pv) { pv.innerHTML = ''; cv.style.maxWidth = '100%'; cv.style.maxHeight = '46vh'; cv.style.width = 'auto'; cv.style.height = 'auto'; pv.appendChild(cv); }
}
async function shareGo(saveOnly) {
  const p = poemById(SHARE.id); if (!SHARE.canvas) return;
  const blob = await new Promise(res => SHARE.canvas.toBlob(res, 'image/png'));
  const file = new File([blob], `${safeName(p.title)}.png`, { type: 'image/png' });
  if (!saveOnly && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: p.title }); } catch (e) {}
    return;
  }
  const url = URL.createObjectURL(blob);
  if (/iPhone|iPad/.test(navigator.userAgent)) {
    const w = window.open(); if (w) { w.document.write(`<title>${esc(p.title)}</title><body style="margin:0;background:#111"><p style="color:#ddd;font:15px sans-serif;text-align:center">長按圖片 → 加入照片</p><img src="${url}" style="width:100%"></body>`); return; }
  }
  const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
}
function mobileMore(p) {
  modal({ title: esc(p.title), ok: '', body: `<div class="mlist">
    <a class="btn sq" href="#/edit/${p.id}" data-act="modal-cancel">編輯</a>
    <button type="button" class="btn sq" data-act="m-share-open">分享成圖片</button>
    <a class="btn sq" href="#/flow/${p.id}" data-act="modal-cancel">連續捲動閱讀</a>
    ${serverMode ? '<button type="button" class="btn sq" data-act="export-open2">導出 PDF</button>' : ''}
    <button type="button" class="btn sq danger" data-act="m-del">移到回收桶</button></div>` });
}

// ---------- 離線使用 ----------
function registerSW() {
  if (serverMode || !('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------- events ----------
function goNeighbor(p, dir) {
  const n = neighbors(p)[dir]; if (!n) { toast(dir === 'next' ? '已經是最後一篇' : '已經是第一篇'); return; }
  go('#/read/' + n.id);
}
document.addEventListener('click', e => {
  if (e.target.id === 'modal') { closeModal(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, r = route();
  const p = r.view === 'read' ? poemById(r.id) : null;
  const c = r.view === 'col' ? colById(r.id) : null;
  const au = r.view === 'author' ? authorById(r.id) : null;
  switch (a) {
    case 'modal-cancel': closeModal(); break;
    case 'sync-now': ShiSync.syncNow('button'); break;
    case 'sync-connect': {
      const o = $('#sy-owner').value, rp = $('#sy-repo').value, tk = $('#sy-token').value, m = $('#sy-msg');
      if (!o.trim() || !rp.trim() || !tk.trim()) { m.textContent = '三個欄位都要填'; break; }
      b.disabled = true; m.textContent = '連接中…';
      ShiSync.configure(o, rp, tk).then(err => { if (err) { m.textContent = err; b.disabled = false; } else { render(); toast('已連接，之後會自動同步'); } });
      break;
    }
    case 'sync-off': if (confirm('中斷這台裝置的同步？這台裝置上的詩會留著，GitHub 上的資料也不會被刪除。')) { ShiSync.disconnect().then(() => { render(); toast('已中斷同步'); }); } break;
    case 'sheet-toggle': document.body.classList.toggle('sheet-open'); break;
    case 'm-more': { const pp = poemById(r.id); if (pp) mobileMore(pp); break; }
    case 'm-share-open': { const pp = poemById(r.id); if (pp) { closeModal(); openShare(pp); } break; }
    case 'm-del': { const pp = poemById(r.id); closeModal(); if (pp) { const { next, prev } = neighbors(pp); trashPoems([pp.id]); go(next ? '#/read/' + next.id : prev ? '#/read/' + prev.id : '#/'); } break; }
    case 'export-open2': { const pp = poemById(r.id); closeModal(); if (pp) openExport({ poemId: pp.id }); break; }
    case 'share-size': SHARE.size = b.dataset.v; shareBody(); break;
    case 'share-sign': SHARE.sign = !SHARE.sign; shareBody(); break;
    case 'share-save': shareGo(true); break;
    case 'share-go': shareGo(false); break;
    case 'modal-ok': { const fn = MODAL_OK; if (!fn || fn() !== false) closeModal(); break; }
    case 'sel-mode': SEL.on = !SEL.on; SEL.ids.clear(); render(); break;
    case 'sel-toggle': selToggle(b); break;
    case 'sel-all': document.querySelectorAll('[data-act=sel-toggle]').forEach(x => { if (!SEL.ids.has(x.dataset.id)) selToggle(x); }); break;
    case 'sel-none': document.querySelectorAll('[data-act=sel-toggle]').forEach(x => { if (SEL.ids.has(x.dataset.id)) selToggle(x); }); break;
    case 'batch-col': batchCol(); break;
    case 'batch-author': batchAuthor(); break;
    case 'batch-tag': batchTag(); break;
    case 'batch-del': { const ids = [...SEL.ids]; SEL.on = false; SEL.ids.clear(); render(); trashPoems(ids); break; }
    case 'batch-export': { const ps = selPoems(); openExport({ ids: ps.map(x => x.id), title: `選取的 ${ps.length} 首` }); break; }
    case 'trash-restore': { const x = anyPoemById(b.dataset.id); if (x) { delete x.deleted; touch(x); save(); render(); toast(`已還原〈${x.title}〉`); } break; }
    case 'trash-purge': { const x = anyPoemById(b.dataset.id); if (x && confirm(`永久刪除〈${x.title}〉？刪除後就不能復原了。`)) { DB.poems = DB.poems.filter(y => y.id !== x.id); save(); render(); toast('已永久刪除'); } break; }
    case 'trash-restore-all': { const ps = trashed(); ps.forEach(x => { delete x.deleted; touch(x); }); save(); render(); toast(`已還原 ${ps.length} 首`); break; }
    case 'trash-empty': { const n = trashed().length; if (confirm(`永久刪除回收桶裡的 ${n} 首詩？刪除後就不能復原了。`)) { DB.poems = DB.poems.filter(y => !y.deleted); save(); render(); toast('回收桶已清空'); } break; }
    case 'imp-cancel': IMP = null; break;
    case 'imp-only-new': IMP.rows.forEach(x => { x.checked = x.status === 'new' || x.status === 'illus' || x.status === 'ocr'; }); render(); break;
    case 'imp-all': IMP.rows.forEach(x => { x.checked = x.status !== 'error'; }); render(); break;
    case 'imp-none': IMP.rows.forEach(x => { x.checked = false; }); render(); break;
    case 'imp-go': b.disabled = true; b.textContent = '匯入中…'; runImport(); break;
    case 'export-open': if (p) openExport({ poemId: p.id }); break;
    case 'export-col': if (c) { const ps = live().filter(x => x.collectionId === c.id).sort(byCreated); if (ps.length) openExport({ ids: ps.map(x => x.id), title: c.name, coverCol: c.id }); } break;
    case 'export-author': { const ps = poemsOfAuthor(au ? au.id : null).sort(byCreated); if (ps.length) openExport({ ids: ps.map(x => x.id), title: `${au ? au.name : '佚名'} 詩選` }); break; }
    case 'exp-set': EXP[b.dataset.k] = b.dataset.v; expBody(); break;
    case 'exp-tg': EXP[b.dataset.k] = !EXP[b.dataset.k]; expBody(); break;
    case 'set-font': DB.prefs.defaultFont = b.dataset.v; save(); render(); toast(`所有沒有另外設定的詩都改用${FONTS[b.dataset.v][0]}`); break;
    case 'ftype': HF.type = b.dataset.v; render(); break;
    case 'newcol': { const nc = newCollection(); if (nc) go('#/col/' + nc.id); break; }
    case 'backup': {
      const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
      const d = new Date(), a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob); a2.download = `詩頁備份-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
      document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
      break;
    }
    case 'scope-author': DB.prefs.scope = 'author'; save(); break;
    case 'scope-collection': DB.prefs.scope = 'collection'; save(); break;
    case 'ed-type': ED.type = b.dataset.v; document.querySelectorAll('#ed-type button').forEach(x => { x.classList.toggle('on', x.dataset.v === ED.type); x.setAttribute('aria-pressed', x.dataset.v === ED.type); }); edRefresh(); break;
    case 'ed-save': edSave(); break;
    case 'dup-update': {
      const old = poemById(b.dataset.id); if (!old || !ED) break;
      const e = ED; closeModal();
      old.text = e.text.replace(/\s+$/, ''); if (e.title.trim() && (!old.title || old.title === '無題')) old.title = e.title.trim();
      if (!old.authorId && e.authorName.trim()) old.authorId = resolveAuthor(e.authorName, e.dynasty);
      if (e.source && !old.source) old.source = e.source.trim(); if (e.note && !old.note) old.note = e.note.trim();
      if (e.sourceImg && !old.sourceImg) old.sourceImg = e.sourceImg;
      touch(old); save(); ED = null; go('#/read/' + old.id); toast('已更新原本那首'); break;
    }
    case 'ed-del': { const id = ED.id; ED = null; trashPoems([id]); go('#/'); break; }
    case 'ed-rmillus': ED.illustration = null; { const keep = ED; $('#app').innerHTML = editorView(keep); ED = keep; edRefresh(); bindDrops(); } break;
    case 'ed-rmimg': ED.sourceImg = null; { const keep = ED; $('#app').innerHTML = editorView(keep); ED = keep; edRefresh(); bindDrops(); } break;
    case 'ed-zoomimg': { const s = $('#srcimg'); if (s) { s.classList.toggle('big'); b.textContent = s.classList.contains('big') ? '縮小' : '放大'; } break; }
    case 'ins-space': insertAt('　'); break;
    case 'ins-stanza': insertAt('\n\n'); break;
    case 'indent': shiftLines(1); break;
    case 'outdent': shiftLines(-1); break;
    case 'print': window.print(); break;
    case 'fav': if (p) { touch(p); p.fav = !p.fav; save(); b.innerHTML = IC.star(p.fav); b.setAttribute('aria-pressed', p.fav); b.setAttribute('aria-label', p.fav ? '取消收藏' : '收藏'); toast(p.fav ? '已加入收藏' : '已取消收藏'); } break;
    case 'del-poem': if (p) {
      const { next, prev } = neighbors(p);
      trashPoems([p.id]); go(next ? '#/read/' + next.id : prev ? '#/read/' + prev.id : '#/');
    } break;
    case 'scope': DB.prefs.scope = b.dataset.v; save(); if (p) readerUpdate(p, false); break;
    case 'flow-scope': DB.prefs.scope = b.dataset.v; save(); render(); break;
    case 'go-prev': if (p) goNeighbor(p, 'prev'); break;
    case 'go-next': if (p) goNeighbor(p, 'next'); break;
    case 'lay-dir': if (p) { touch(p); p.layout.dir = layoutOf(p).dir === 'v' ? 'h' : 'v'; save(); readerUpdate(p); toast(p.layout.dir === 'v' ? '直排：由右往左讀' : '橫排'); } break;
    case 'lay': if (p) { touch(p); if (b.dataset.k === 'style' && !p.layout.dir) p.layout.dir = layoutOf(p).dir; p.layout[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'style') { p.layout.align = null; p.layout.font = null; RS = 0; } save(); readerUpdate(p); } break;
    case 'lay-tg': if (p) { touch(p); p.layout[b.dataset.k] = !layoutOf(p)[b.dataset.k]; save(); readerUpdate(p); } break;
    case 'size': if (p) { touch(p); p.layout.size = clamp(p.layout.size + Number(b.dataset.v), 14, 40); save(); readerUpdate(p); } break;
    case 'lay-reset': if (p) { touch(p); p.layout = defLayout(p.type); save(); readerUpdate(p); } break;
    case 'lay-all': if (p) {
      const others = (b.dataset.v === 'author' ? poemsOfAuthor(p.authorId) : live().filter(x => x.collectionId === p.collectionId)).filter(x => x.id !== p.id);
      if (!others.length) { toast('沒有其他詩篇可以套用'); break; }
      if (confirm(`把目前的版面套用到另外 ${others.length} 首？`)) { others.forEach(x => { x.layout = Object.assign({}, p.layout); touch(x); }); save(); toast(`已套用到 ${others.length} 首`); }
    } break;
    case 'rc-prev': if (p) { if (RS <= 0) { const n = neighbors(p).prev; if (n) { go('#/read/' + n.id); break; } } RS--; readerUpdate(p, false); } break;
    case 'rc-next': if (p) { const n = Math.max(stanzas(p.text).length, 1); if (RS >= n - 1) { goNeighbor(p, 'next'); break; } RS++; readerUpdate(p, false); } break;
    case 'cv': if (c) { c.cover[b.dataset.k] = b.dataset.v; save(); render(); } break;
    case 'cv-paste': if (c) clipImage().then(f => f && uploadCover(c, f)); break;
    case 'ed-paste-illus': clipImage().then(f => f && setIllus(f)); break;
    case 'cv-rmimg': if (c) { c.cover.img = null; save(); render(); } break;
    case 'del-col': if (c && confirm(`刪除《${c.name}》？裡面的詩不會被刪除，會移到「未分類」。`)) {
      DB.poems.forEach(x => { if (x.collectionId === c.id) x.collectionId = null; });
      DB.collections = DB.collections.filter(x => x.id !== c.id); save(); go('#/'); toast('已刪除詩集');
    } break;
    case 'au-merge': if (au) {
      const to = authorById($('#merge-to').value); if (!to) break;
      const ps = poemsOfAuthor(au.id);
      if (!confirm(`把「${authorLabel(au)}」的 ${ps.length} 首詩移到「${authorLabel(to)}」，並刪除「${au.name}」這筆作者資料？`)) break;
      ps.forEach(x => { x.authorId = to.id; });
      if (!to.dynasty && au.dynasty) to.dynasty = au.dynasty;
      if (!to.bio && au.bio) to.bio = au.bio;
      DB.authors = DB.authors.filter(x => x.id !== au.id); save(); go('#/author/' + to.id); toast('已合併');
    } break;
    case 'au-del': if (au) {
      const ps = poemsOfAuthor(au.id);
      if (!confirm(ps.length ? `刪除作者「${au.name}」？他的 ${ps.length} 首詩不會被刪除，會改成「佚名」。` : `刪除作者「${au.name}」？`)) break;
      ps.forEach(x => { x.authorId = null; });
      DB.authors = DB.authors.filter(x => x.id !== au.id); save(); go('#/authors'); toast('已刪除作者');
    } break;
  }
});
let auT = null;
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset && t.dataset.in; if (!k) return;
  const r = route();
  if (k === 'imp-check') { const x = IMP && IMP.rows.find(y => y.id === t.dataset.id); if (x) { x.checked = t.checked; t.closest('.irow').classList.toggle('on', t.checked); const n = IMP.rows.filter(y => y.checked).length; const g = $('[data-act=imp-go]'); g.textContent = `匯入勾選的 ${n} 項`; g.disabled = !n; } return; }
  if (k === 'imp-folders') { IMP.useFolders = t.checked; render(); return; }
  if (k === 'imp-rootcol') { IMP.rootCol = t.value; render(); return; }
  if (k === 'm-col') { const w = $('#m-newwrap'); if (w) { w.style.display = t.value === '__new' ? '' : 'none'; if (t.value === '__new') $('#m-newname').focus(); } return; }
  if (k === 'q') { HF.q = t.value; refreshGrid(); }
  else if (k === 'f-col' || k === 'f-author' || k === 'f-dyn' || k === 'f-src') { HF[k.slice(2)] = t.value; refreshGrid(); }
  else if (k === 'ed-title') { ED.title = t.value; edRefresh(); }
  else if (k === 'ed-author') {
    ED.authorName = t.value;
    const same = DB.authors.filter(a => a.name === t.value.trim());
    if (same.length === 1) { ED.dynasty = same[0].dynasty; const d = $('[data-in=ed-dyn]'); if (d) d.value = ED.dynasty; }
    edRefresh();
  }
  else if (k === 'ed-dyn') { ED.dynasty = t.value; edRefresh(); }
  else if (k === 'ed-source') { ED.source = t.value; }
  else if (k === 'ed-date') { ED.date = t.value; }
  else if (k === 'ed-note') { ED.note = t.value; }
  else if (k === 'ed-tags') { ED.tags = t.value.split(/[\s,，、]+/).filter(Boolean); }
  else if (k === 'ed-text') { ED.text = t.value; edRefresh(); }
  else if (k === 'ed-trans') { ED.trans = t.value; }
  else if (k === 'ed-col') {
    if (t.value === '__new') { const nc = newCollection(); ED.collectionId = nc ? nc.id : ED.collectionId; t.innerHTML = colOptions(ED.collectionId); t.value = ED.collectionId || ''; }
    else ED.collectionId = t.value || null;
  }
  else if (k === 'size') { const p = poemById(r.id); if (p) { touch(p); p.layout.size = Number(t.value); $('#sizelabel').textContent = t.value; const stg = $('#stage'); if (stg) stg.innerHTML = stageHTML(p, layoutOf(p)); save(); } }
  else if (k === 'cv-zoom' || k === 'cv-name' || k === 'cv-author') {
    const c = colById(r.id); if (!c) return;
    if (k === 'cv-zoom') { c.cover.zoom = Number(t.value); const img = $('#bigcover img'); if (img) img.style.transform = `scale(${c.cover.zoom / 100})`; }
    else { c[k === 'cv-name' ? 'name' : 'author'] = t.value; refreshCover(c); }
    save();
  }
  else if (k === 'au-name' || k === 'au-dyn' || k === 'au-bio') {
    const a = authorById(r.id); if (!a) return;
    const v = k === 'au-bio' ? t.value : t.value.trim();
    if (k === 'au-name' && !v) return;
    a[k === 'au-name' ? 'name' : k === 'au-dyn' ? 'dynasty' : 'bio'] = v; save();
    if (k !== 'au-bio') { clearTimeout(auT); auT = setTimeout(() => { const h = document.querySelector('.author-head'); if (h) { h.querySelector('h1').textContent = a.name; h.querySelector('.kicker').textContent = a.dynasty || '作者'; } }, 100); }
  }
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset && t.dataset.file; if (!k || !t.files || !t.files.length) return;
  const files = [...t.files]; t.value = '';
  handleFiles(k, files);
});
async function handleFiles(kind, files) {
  const r = route();
  if (kind === 'folder') { startFolderImport(files.map(f => ({ file: f, rel: f.webkitRelativePath || f.name }))); return; }
  const isZip = f => /\.zip$/i.test(f.name) || f.type === 'application/zip';
  if (kind === 'batch' || ((kind === 'home' || kind === 'colpoem') && (files.length > 1 || files.some(isZip)))) { batchImport(files, kind === 'colpoem' ? r.id : (kind === 'batch' && ED && ED.collectionId) || null); return; }
  if (kind === 'illus') { setIllus(files[0]); return; }
  if (kind === 'home') importFiles(files);
  else if (kind === 'colpoem') importFiles(files, r.id);
  else if (kind === 'cover') { const c = colById(r.id); if (c) uploadCover(c, files[0]); }
  else if (kind === 'editor') {
    try {
      const f = files[0];
      let d;
      if (isImage(f)) d = await ocrFile(f);
      else { const { text, ext } = await readFile(f); d = parseImported(text, f.name, ext); }
      $('#toast').classList.remove('show');
      if (ED.text.trim() && !confirm('要用載入的內容取代目前的內容嗎？')) return;
      Object.assign(ED, { title: ED.title || d.title, authorName: ED.authorName || d.authorName, dynasty: ED.dynasty || d.dynasty, text: d.text, type: d.type, source: ED.source || d.source || '', date: ED.date || d.date || '', note: ED.note || d.note || '', authorNick: d.authorNick || '' });
      (d.tags || []).forEach(t => { if (!ED.tags.includes(t)) ED.tags.push(t); });
      if (d.ocr) Object.assign(ED, { sourceImg: d.sourceImg, ocr: true, vertical: d.vertical, ocrLang: d.ocrLang });
      const keep = ED; $('#app').innerHTML = editorView(keep); ED = keep; edRefresh(); bindDrops(); toast(d.ocr ? '辨識完成，請對照原圖校對' : '已載入檔案');
    } catch (err) { toast(err.message || '讀取失敗', 6000); }
  }
  else if (kind === 'restore') {
    try {
      const j = JSON.parse(await decodeText(await files[0].arrayBuffer()));
      if (!j || !Array.isArray(j.poems)) throw new Error();
      if (!confirm(`備份裡有 ${j.poems.length} 首詩、${(j.collections || []).length} 本詩集。要用它取代目前的資料嗎？`)) return;
      DB = j; await migrate(); save(true); render(); toast('已還原備份');
    } catch (err) { toast('這不是有效的詩頁備份檔'); }
  }
}
function bindDrops() {
  document.querySelectorAll('[data-drop]').forEach(z => {
    z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', async e => {
      e.preventDefault(); z.classList.remove('over');
      const kind = z.dataset.drop;
      // DataTransfer 只在事件當下有效：先把檔案和資料夾項目拿出來
      const fs = [...(e.dataTransfer.files || [])];
      const roots = kind === 'home' ? [...(e.dataTransfer.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean) : [];
      if (roots.some(x => x.isDirectory)) { const ents = await entriesFromRoots(roots).catch(() => null); if (ents) { startFolderImport(ents); return; } }
      if (!fs.length) return;
      handleFiles(kind === 'home' ? 'home' : kind === 'cover' ? 'cover' : 'editor', kind === 'editor' || kind === 'cover' ? [fs[0]] : fs);
    });
  });
}
// stop the browser from opening files dropped outside a drop zone
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key === 'Escape' && $('#modal')) { closeModal(); return; }
  if ($('#modal')) return;
  if (t.id === 'ed-text' && e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) shiftLines(-1); else insertAt('　'); return; }
  if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || e.altKey || e.ctrlKey || e.metaKey) return;
  const r = route();
  if (r.view !== 'read') return;
  const p = poemById(r.id); if (!p) return;
  if ((e.key === 'v' || e.key === 'V') && p.type !== 'shape') { e.preventDefault(); const b0 = document.createElement('button'); b0.dataset.act = 'lay-dir'; document.body.appendChild(b0); b0.click(); b0.remove(); return; }
  const recite = layoutOf(p).style === 'recite';
  const fwd = e.key === 'ArrowRight' || (recite && (e.key === 'ArrowDown' || e.key === ' '));
  const back = e.key === 'ArrowLeft' || (recite && e.key === 'ArrowUp');
  if (e.key === 'PageDown') { e.preventDefault(); goNeighbor(p, 'next'); }
  else if (e.key === 'PageUp') { e.preventDefault(); goNeighbor(p, 'prev'); }
  else if (fwd) { e.preventDefault(); if (recite) $('[data-act=rc-next]').click(); else goNeighbor(p, 'next'); }
  else if (back) { e.preventDefault(); if (recite) $('[data-act=rc-prev]').click(); else goNeighbor(p, 'prev'); }
});

// ---------- keep the local program alive while the window is open ----------
// 另外開了新的詩頁時，舊視窗會收到通知：先存檔再自己關掉
let gone = false, misses = 0;
function goneOverlay(msg) {
  if ($('#gone')) return;
  const d = document.createElement('div'); d.id = 'gone'; d.className = 'modal-bg';
  d.innerHTML = `<div class="modal" role="alertdialog" aria-labelledby="gone-t"><h2 id="gone-t">這個視窗已經停用</h2><p style="margin:0;line-height:1.8">${msg}</p><div class="modal-foot"><button type="button" class="btn dark" onclick="window.close()">關閉這個視窗</button></div></div>`;
  document.body.appendChild(d);
}
function heartbeat() {
  if (!serverMode) return;
  const ping = () => fetch('api/ping', { method: 'POST' })
    .then(r => r.json().catch(() => ({})))
    .then(j => {
      misses = 0;
      if (j.quit && !gone) {
        gone = true; flushSave();
        setTimeout(() => { window.close(); goneOverlay('詩頁已經在新的視窗開啟，你的修改都存好了。'); }, 600);
      }
    })
    .catch(() => { if (++misses >= 2 && !gone) { gone = true; goneOverlay('詩頁程式已經關閉或在另一個視窗開啟。這個視窗裡的修改無法再儲存，請改用新開的詩頁。'); } });
  ping(); setInterval(ping, 1500);
  window.addEventListener('pagehide', () => { flushSave(); try { navigator.sendBeacon('api/bye'); } catch (e) {} });
}

load().then(() => { render(); if (!PRINT) { heartbeat(); ShiSync.init(); registerSW(); } });
