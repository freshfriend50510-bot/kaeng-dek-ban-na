// กล่องข้อความ ตัวเลือก และเมนูทั้งหมด (HTML ซ้อนบน canvas)
(function (G) {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const stack = [];   // หน้าต่างที่เปิดอยู่ ตัวบนสุดรับปุ่ม
  G.ui = {};
  G.ui.active = () => stack.length > 0;
  G.ui.key = (k) => { const top = stack[stack.length - 1]; if (top) top.onKey(k); };
  function push(m) { stack.push(m); $('#ui').appendChild(m.el); }
  function pop(m) { const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1); m.el.remove(); }
  G.ui.pushTop = push; G.ui.closeTop = pop;   // ให้ไฟล์อื่นสร้างหน้าต่างเองได้
  G.ui.closeAll = () => { while (stack.length) pop(stack[stack.length - 1]); };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- กล่องข้อความแบบพิมพ์ทีละตัว ----------
  // รูปหน้าผู้พูด: หาจากชื่อ (สมาชิกแก๊ง ตัวเรา NPC เทรนเนอร์ สายพันธุ์)
  G.speakerLook = function (name) {
    if (!name) return null;
    const S = G.state;
    if (S) {
      const m = [...S.party, ...S.storage].find((x) => x.name === name);
      if (m) return G.monLook(m);
      if (name === S.name) return 'player';
    }
    if (!speakerMap) {
      speakerMap = {};
      for (const n of G.DATA.world.npcs) if (n.look && n.look !== 'item') { speakerMap[n.name] = speakerMap[n.name] || n.look; if (n.trainer) speakerMap[n.trainer.name] = speakerMap[n.trainer.name] || n.look; }
      for (const [, sp] of Object.entries(G.DATA.species)) if (!speakerMap[sp.name]) speakerMap[sp.name] = sp.look;
      Object.assign(speakerMap, { 'โจ้ แก๊งบ้านเหนือ': 'rival', 'คางคกเจ้าหนอง': 'toad' });
    }
    return speakerMap[name] || null;
  };
  let speakerMap = null;
  // อารมณ์: ใส่ {happy} {angry} {shock} {sad} หน้าข้อความ หรือเดาจากคำในประโยค
  const MOODS = [['angry', /เชอะ|ไม่ยอม|เกลียด|โมโห|หนอย|ไสหัว|อย่ามายุ่ง|เจ็บใจ|ไปไกลๆ|ใครกล้า/], ['sad', /ขอโทษ|เสียใจ|ผิดเอง|ร้องไห้|เหม่อ|ไม่มองหน้า/],
    ['shock', /^\.\.\.|อ้าว|เดี๋ยวนะ|เดี๋ยวก่อน|ห๊ะ|!\?|\?!|^โห|ตกใจ|เอ๊ะ|ว้าย|มืดตึ๊ด|หลุดเชือก/],
    ['happy', /ฮ่า|555|อิอิ|ดีใจ|เก่ง|ขอบใจ|ขอบคุณ|ยินดี|เย้|สุดยอด|เยี่ยม|~|แซ่บ|สัญญา!|ฉลอง/]];
  G.guessMood = (text) => { for (const [m, re] of MOODS) if (re.test(text)) return m; return 'normal'; };
  const EMOTE = { happy: '♪', angry: '💢', shock: '!!', sad: '💧' };
  // บทที่เคยอ่านแล้ว (เก็บในเบราว์เซอร์นี้ ใช้ร่วมทุกช่องเซฟ): กด X บนบทที่เคยอ่าน = ข้ามรวดจนถึงบทใหม่หรือตัวเลือก
  const SEEN_KEY = 'kaengdekbanna_seen';
  let seen = null, seenT = null;
  const seenSet = () => { if (!seen) { try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { seen = new Set(); } } return seen; };
  const lineKey = (name, text) => { let h = 5381; const t = (name || '') + '|' + text; for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36); };
  const markSeen = (k) => {
    const st = seenSet(); if (st.has(k)) return; st.add(k);
    clearTimeout(seenT); seenT = setTimeout(() => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...st].slice(-6000))); } catch (e) { /* */ } }, 800);
  };
  // ---------- สีคำสำคัญในข้อความ (ใช้ทั้งเกม): ชื่อ ท่า ไอเท็ม เงิน ธาตุ สถานะ ผลการโจมตี ----------
  const KW_FIXED = [
    ['ได้ผลดีมาก', 'k-good'], ['ไม่ค่อยได้ผล', 'k-weak'], ['แต่ไม่ได้ผล', 'k-weak'], ['ไม่ได้ผล', 'k-weak'], ['พลาดเป้า', 'k-weak'], ['คริติคอล', 'k-hurt'],
    ['หมดแรง', 'k-hurt'], ['ปวดท้อง', 'k-psn'], ['ท้องเสีย', 'k-psn'], ['ติดพิษ', 'k-psn'], ['อัมพาต', 'k-par'], ['ตัวชา', 'k-par'], ['หลับปุ๋ย', 'k-slp'], ['หลับ', 'k-slp'],
    ['มึนหัว', 'k-cnf'], ['มึนงง', 'k-cnf'], ['ฟื้นพลัง', 'k-good'], ['หายเป็นปกติ', 'k-good'], ['หายจากอาการผิดปกติ', 'k-good'], ['เพิ่มขึ้นมาก', 'k-good'], ['เพิ่มขึ้น', 'k-good'], ['ลดลงมาก', 'k-hurt'], ['ลดลง', 'k-hurt'],
    ['เลเวลอัป', 'k-lv'], ['เติบโตขึ้น', 'k-lv'], ['เข้าแก๊ง', 'k-good'], ['สำเร็จ', 'k-good'], ['ได้รับ', 'k-good'],
    ['ธาตุน้ำ', 'k-water'], ['ธาตุดิน', 'k-earth'], ['ธาตุสายฟ้า', 'k-electric'], ['ธาตุลม', 'k-wind'], ['ธาตุปกติ', 'k-normal'],
    ['FIEWXANDER', 'k-name'], ['JOEKER', 'k-name'], ['หยกJADE', 'k-name']];
  let kwBase = null;
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function kwList() {
    if (!kwBase) {
      const D = G.DATA, m = new Map(KW_FIXED);
      for (const it of Object.values(D.items)) if (it.name.length > 2 && !m.has(it.name)) m.set(it.name, 'k-item');
      for (const mv of Object.values(D.moves)) if (mv.name.length > 2 && !m.has(mv.name)) m.set(mv.name, 'k-move');
      for (const sp of Object.values(D.species)) if (sp.name.length > 1 && !m.has(sp.name)) m.set(sp.name, 'k-name');
      for (const n of D.world.npcs) { const nm = (n.name || '').replace(/ \(.*\)$/, ''); if (/^(พี่|น้อง|ลุง|ป้า|ยาย|ครู|อาจารย์|หลวง|แม่ค้า|หยก|โจ้)/.test(nm) && nm.length > 2 && !m.has(nm)) m.set(nm, 'k-name'); }
      kwBase = m;
    }
    const m = new Map(kwBase);
    const S = G.state;
    if (S) { for (const x of [...S.party, ...S.storage]) if (x.name && x.name.length > 1) m.set(x.name, 'k-name'); if (S.name) m.set(S.name, 'k-name'); }
    return m;
  }
  // แตกข้อความเป็นช่วง [{t, c}] (c = คลาสสี หรือ '')
  G.ui.colorize = function (text) {
    const m = kwList(), keys = [...m.keys()].sort((a, b) => b.length - a.length);
    const re = new RegExp(`(${keys.map(reEsc).join('|')}|\\d[\\d,]*\\s?บาท|ประสบการณ์ \\d+|Lv ?\\d+|"[^"]{1,24}")`, 'g');
    const out = []; let last = 0, mt;
    while ((mt = re.exec(text))) {
      if (mt.index > last) out.push({ t: text.slice(last, mt.index), c: '' });
      const w = mt[0];
      out.push({ t: w, c: m.get(w) || (/บาท$/.test(w) ? 'k-money' : /^ประสบการณ์|^Lv/.test(w) ? 'k-lv' : 'k-quest') });
      last = mt.index + w.length;
    }
    if (last < text.length) out.push({ t: text.slice(last), c: '' });
    return out;
  };
  // แสดงช่วงที่ระบายสีแล้ว เฉพาะ n ตัวอักษรแรก (ใช้กับข้อความพิมพ์ทีละตัว)
  G.ui.colorHTML = function (segs, n = Infinity) {
    let left = n, html = '';
    for (const sg of segs) {
      if (left <= 0) break;
      const ch = Array.from(sg.t), part = ch.slice(0, left).join(''); left -= ch.length;
      html += sg.c ? `<span class="${sg.c}">${esc(part)}</span>` : esc(part);
    }
    return html;
  };
  G.ui.resetKeywords = () => { kwBase = null; };
  G.ui.skipping = false;
  // ประวัติบทสนทนา (ปุ่ม L): 80 บรรทัดล่าสุด
  G.ui.history = [];
  G.ui.showLog = async function () {
    if (!G.ui.history.length) { await G.ui.say('ยังไม่มีบทสนทนา'); return; }
    const rows = G.ui.history.map(([n, t]) => `<div class="log-row">${n ? `<b>${esc(n)}</b>` : ''}<span>${G.settings.colorText !== false ? G.ui.colorHTML(G.ui.colorize(t)) : esc(t)}</span></div>`).join('');
    const p = G.ui.panel(`<div class="choice-title">ประวัติบทสนทนา (ล่าสุดอยู่ล่าง)</div><div class="log-list">${rows}</div>`, 'log-sheet');
    const box = document.querySelector('.log-list'); if (box) box.scrollTop = box.scrollHeight;
    await p;
  };
  G.ui.say = function (text, name, opt = {}) {
    let mood = opt.mood;
    const tag = /^\{(happy|angry|shock|sad|normal)\}\s*/.exec(text);
    if (tag) { mood = tag[1]; text = text.slice(tag[0].length); }
    if (text && !opt.battle) { G.ui.history.push([name || '', text]); if (G.ui.history.length > 80) G.ui.history.shift(); }
    return new Promise((resolve) => {
      const box = el('div', 'panel dialog' + (opt.battle ? ' in-battle' : ''));
      if (name) box.appendChild(el('div', 'speaker', esc(name)));
      const look = !opt.battle && (opt.look || G.speakerLook(name));
      if (look) {
        mood = mood || G.guessMood(text);
        const face = el('div', `face mood-${mood}`);
        const cv = document.createElement('canvas'), pic = G.portrait(look, mood === 'sad' ? 'tired' : mood);
        cv.width = pic.width; cv.height = pic.height; cv.getContext('2d').drawImage(pic, 0, 0);
        face.appendChild(cv);
        if (EMOTE[mood]) face.appendChild(el('i', 'emote', EMOTE[mood]));
        box.appendChild(face); box.classList.add('has-face');
      }
      const body = el('div', 'dialog-text'); box.appendChild(body);
      const arrow = el('div', 'more', '▼'); box.appendChild(arrow);
      const key = lineKey(name, text), track = !opt.battle && !opt.auto;
      const wasSeen = track && G.settings.skipRead !== false && seenSet().has(key);
      if (wasSeen) box.appendChild(el('div', 'skiphint', 'X ข้ามบทที่อ่านแล้ว'));
      if (!wasSeen) G.ui.skipping = false;
      const chars = Array.from(text);
      let n = 0, done = false;
      const fast = opt.battle && G.settings.fast;   // ต่อสู้เร็ว ×2: พิมพ์เร็วขึ้นและรอสั้นลงครึ่งหนึ่ง
      const speed = G.settings.textSpeed * (fast ? 2 : 1), auto = opt.auto && fast ? Math.max(1, opt.auto / 2) : opt.auto;
      let held = false;
      const segs = G.settings.colorText === false ? [{ t: text, c: '' }] : G.ui.colorize(text);
      const complete = () => { clearInterval(tick); n = chars.length; body.innerHTML = G.ui.colorHTML(segs); done = true; box.classList.add('done'); if (track) markSeen(key); if (auto) setTimeout(finish, auto); if (opt.hold && !held) { held = true; resolve(() => pop(m)); } };   // hold = ค้างข้อความไว้ระหว่างเลือกตัวเลือก
      const tick = setInterval(() => {
        n += speed; body.innerHTML = G.ui.colorHTML(segs, n);
        if (n >= chars.length) complete();
      }, 22);
      const finish = () => { if (!stack.includes(m)) return; pop(m); resolve(); };
      let lastPress = 0;
      const m = { el: box, onKey: (k) => {
        if (k !== 'ok' && k !== 'back') return;
        const now = performance.now();
        if (opt.onDouble && now - lastPress < 500) { opt.onDouble(); complete(); finish(); return; }   // กดสองครั้งติด = ข้าม
        lastPress = now;
        if (k === 'back' && wasSeen) { G.ui.skipping = true; complete(); finish(); return; }
        if (!done) complete();
        else if (!opt.auto) { G.sfx('tick'); finish(); }
      } };
      push(m);
      if (wasSeen && G.ui.skipping) { complete(); setTimeout(finish, 70); }
    });
  };
  G.ui.sayAll = async (lines, name) => { for (const l of lines) await G.ui.say(l, name); };

  // ---------- รายการตัวเลือก ----------
  // options: [{label, sub, disabled}] หรือ string; คืน index หรือ -1 เมื่อยกเลิก
  const MEM = {};
  G.ui.choose = function (options, opt = {}) {
    G.ui.skipping = false;   // ถึงตัวเลือกแล้ว หยุดข้ามบท
    return new Promise((resolve) => {
      const box = el('div', 'panel choice ' + (opt.cls || ''));
      if (opt.title) box.appendChild(el('div', 'choice-title', esc(opt.title)));
      if (opt.header) box.appendChild(el('div', 'choice-header', opt.header));   // html สรุปบนหัวเมนู
      const items = options.map((o) => (typeof o === 'string' ? { label: o } : o));
      const list = el('div', 'choice-list' + (opt.grid || opt.cols ? ' grid' : '') + (opt.cols ? ' cols' + opt.cols : ''));
      const rows = items.map((it, i) => {
        const r = el('div', 'choice-item' + (it.disabled ? ' disabled' : '') + (it.cls ? ' ' + it.cls : '') + (it.emoji ? ' tile' : ''));
        r.innerHTML = `${it.icon ? `<canvas width="16" height="16" class="ico" data-sprite="${esc(it.icon)}"></canvas>` : ''}${it.emoji ? `<span class="emo">${it.emoji}</span>` : ''}<span class="lbl">${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}${it.badge ? `<span class="nbadge">${esc(it.badge)}</span>` : ''}`;
        r.addEventListener('click', () => { sel = i; draw(); pick(); });
        list.appendChild(r); return r;
      });
      box.appendChild(list);
      const info = el('div', 'choice-info'); if (opt.info) box.appendChild(info);
      let sel = Math.max(0, Math.min(items.length - 1, opt.remember && MEM[opt.remember] != null ? MEM[opt.remember] : opt.start || 0));   // remember = จำตำแหน่งเลือกล่าสุดของเมนูนั้น
      const draw = () => {
        rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
        if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' });
        if (opt.info) { const t = opt.info(sel) || ''; info.innerHTML = G.settings.colorText === false ? esc(t) : G.ui.colorHTML(G.ui.colorize(t)); }
      };
      const pick = () => { if (items[sel].disabled) { G.sfx('bump'); return; } G.sfx('tick'); if (opt.remember) MEM[opt.remember] = sel; pop(m); resolve(sel); };
      const cols = opt.cols || (opt.grid ? 2 : 1), n = items.length;
      const m = { el: box, onKey: (k) => {
        if (k === 'up') sel = sel - cols >= 0 ? sel - cols : cols > 1 ? Math.min(n - 1, sel + Math.floor((n - 1 - sel) / cols) * cols) : n - 1;
        else if (k === 'down') sel = sel + cols < n ? sel + cols : cols > 1 ? sel % cols : 0;
        else if (k === 'left' && cols > 1) sel = sel % cols ? sel - 1 : Math.min(n - 1, sel + cols - 1);
        else if (k === 'right' && cols > 1) sel = sel % cols < cols - 1 && sel + 1 < n ? sel + 1 : sel - (sel % cols);
        else if (k === 'left' && opt.onSide) { pop(m); resolve(-2); return; }
        else if (k === 'right' && opt.onSide) { pop(m); resolve(-3); return; }
        else if (k === 'ok') return pick();
        else if (k === 'back' && opt.cancel !== false) { G.sfx('tick'); pop(m); resolve(-1); return; }
        draw();
      } };
      push(m); draw();
    });
  };
  // ถามแล้วให้เลือก: ข้อความคำถามค้างอยู่บนจอจนกว่าจะเลือกเสร็จ (เดิมหายทันทีจนอ่านไม่ทัน)
  G.ui.ask = async (q, name, options, copt = {}, sopt = {}) => {
    const close = await G.ui.say(q, name, { ...sopt, hold: true });
    try { return await G.ui.choose(options, copt); } finally { close(); }
  };
  G.ui.confirm = async (q, name) => (await G.ui.ask(q, name, ['ใช่', 'ไม่'], { cls: 'yesno' })) === 0;

  // ---------- หน้าต่างแสดงข้อมูล (ปิดด้วยปุ่มใดก็ได้) ----------
  G.ui.panel = function (html, cls) {
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet ' + (cls || ''), html);
      const m = { el: box, onKey: (k) => { if (k === 'ok' || k === 'back') { pop(m); resolve(); } else if (k === 'up' || k === 'down') box.scrollBy({ top: (k === 'up' ? -1 : 1) * box.clientHeight * 0.4, behavior: 'smooth' }); } };   // ↑↓ เลื่อนดู
      push(m);
    });
  };

  // ---------- หลอด HP ----------
  G.ui.hpBar = (hp, max, ghost) => {   // ghost = หลอดจางสีแดงค้างแสดงส่วนที่เพิ่งเสียไป
    const p = Math.max(0, hp / max), g = ghost > hp ? Math.min(1, ghost / max) : 0;
    return `<div class="hpbar">${g ? `<b style="width:${(g * 100).toFixed(1)}%"></b>` : ''}<i style="width:${(p * 100).toFixed(1)}%" class="${p < 0.2 ? 'red' : p < 0.5 ? 'yellow' : ''}"></i></div>`;
  };
  const STATUS = { par: 'ชา', slp: 'หลับ', psn: 'ท้องเสีย', brn: 'ไฟลวก' };
  G.ui.statusTag = (s) => (s ? `<span class="tag st-${s}">${STATUS[s]}</span>` : '');
  const TYPE_TH = { normal: 'ปกติ', water: 'น้ำ', earth: 'ดิน', electric: 'สายฟ้า', wind: 'ลม' };
  G.ui.typeTag = (t) => `<span class="tag ty-${t}"><canvas class="ty-ico" width="16" height="16" data-sprite="type:${t}"></canvas>${TYPE_TH[t]}</span>`;
  G.TYPE_TH = TYPE_TH;

  // ---------- เมนูทีม ----------
  const KIND_TH = { kid: 'เด็กบ้านนา', ghost: 'ผีสาง', eng: 'น้องวิศวะ', med: 'น้องหมอพยาบาล', boss: 'บอส', master: 'หัวโจก' };
  const monRow = (m, extra) => ({ icon: G.monLook(m), label: `${m.name}  Lv${m.lv}`,
    sub: `${m.hp}/${m.stats.hp}${m.status ? ' · ' + STATUS[m.status] : ''}${m.held ? ' · ถือ' + G.DATA.items[m.held].name : ''}${extra || ''}` });
  // หน้าทีม: การ์ด 2 คอลัมน์ รูป เลเวล ธาตุ หลอด HP/EXP สถานะ ของถือ คืน index หรือ -1
  // ความสามารถติดตัว: ชื่อสั้น + คำอธิบาย (ตรรกะอยู่ใน battle.js)
  const AB_SHORT = { rage: 'บ้าพลัง', analyze: 'วิเคราะห์', eater: 'อิ่มแล้วสู้', quick: 'ดีดเปิดเกม', slick: 'ตัวลื่น', thick: 'หนังหนา', glutton: 'กินจุ', glider: 'ร่อนลม',
    static: 'ไฟฟ้าสถิต', tall: 'สูงชะลูด', songbird: 'เสียงหวาน', deeproot: 'รากลึก', guardian: 'เฝ้านา', levitate: 'ลอยตัว', torrent: 'พลังนาค', dancer: 'จังหวะตาโขน',
    treasure: 'เฝ้าทรัพย์', nurse: 'ดูแลตัวเอง', diligent: 'ขยัน', firstaid: 'ปฐมพยาบาล', scary: 'หน้าดุ', rainlord: 'เจ้าแห่งฝน' };
  G.AB_DESC = { rage: 'เลือดเหลือ 1/3 ท่าดินแรง ×1.5', analyze: 'ลงมือทีหลังศัตรู แรงขึ้น ×1.3', eater: 'ฟื้นพลัง 1/16 ทุกเทิร์น', quick: 'เทิร์นแรกได้ลงมือก่อน',
    slick: 'ฝนตก ความเร็ว ×1.5', thick: 'โดนท่ากายภาพเบาลง ×0.85', glutton: 'ชนะศัตรูแล้วฟื้นพลัง 1/4', glider: 'ท่าลม ×1.2', static: 'โดนตีกายภาพ 30% ทำให้คนตีชา',
    tall: 'โดนท่าดินเบาลงครึ่งหนึ่ง', songbird: 'ท่าเสียง (ร้องโหยหวน เพลง ว้าก) ×1.3', deeproot: 'ฟื้นพลัง 1/16 ทุกเทิร์น', guardian: 'ลงสนามแล้วป้องกัน +1',
    levitate: 'ไม่โดนท่าธาตุดินเลย', torrent: 'เลือดเหลือ 1/3 ท่าน้ำ ×1.5', dancer: 'จบเทิร์นความเร็ว +1 (สูงสุด +2)', treasure: 'อยู่ในทีม เงินรางวัล ×1.5',
    nurse: 'จบเทิร์น 30% หายจากอาการผิดปกติ', diligent: 'ได้ EXP เพิ่ม 10%', firstaid: 'เลือดต่ำกว่าครึ่ง ฟื้นพลัง 1/12 ทุกเทิร์น', scary: 'ลงสนามแล้วโจมตีของศัตรู −1', rainlord: 'ลงสนามแล้วฝนตกทันที 5 เทิร์น' };
  G.AB_SHORT = AB_SHORT;
  const NAT_TH = { atk: 'โจมตี', def: 'ป้องกัน', spa: 'พิเศษ', spd: 'ป้องกันพิเศษ', spe: 'ความเร็ว' };
  G.natureText = (m) => { const n = G.NATURES[m.nature] || G.NATURES.easy; return n[1] ? `${n[0]} (+${NAT_TH[n[1]]} −${NAT_TH[n[2]]})` : n[0]; };
  G.ui.teamScreen = function (opt = {}) {
    const S = G.state;
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet team-sheet');
      const card = (m, k) => {
        const sp = G.DATA.species[m.sp], p = Math.max(0, m.hp / m.stats.hp);
        const ex = Math.min(100, ((m.exp - G.expFor(m.lv)) / (G.expFor(m.lv + 1) - G.expFor(m.lv))) * 100);
        const off = opt.mustAlive && m.hp <= 0;
        return `<div class="tcard ${m.hp <= 0 ? 'down' : ''} ${off ? 'off' : ''}" data-i="${k}">
          <div class="tc-pic"><canvas width="16" height="16" data-sprite="${esc(G.monLook(m))}"></canvas>${k === 0 && S.follower ? '<em class="tc-lead">เดินตาม</em>' : ''}</div>
          <div class="tc-body"><div class="tc-top"><b>${m.shiny ? '<span class="k-shiny">✨</span>' : ''}${esc(m.name)}</b><span class="tc-heart" title="ความสนิท">${'♥'.repeat(G.hearts(m))}</span><span class="lv">Lv${m.lv}</span></div>
            <div class="tc-tags">${G.ui.typeTag(sp.type)}<span class="tag tc-kind">${KIND_TH[sp.kind] || ''}</span>${G.ui.statusTag(m.status)}${m.hp <= 0 ? '<span class="tag tc-ko">หมดแรง</span>' : ''}</div>
            ${G.ui.hpBar(m.hp, m.stats.hp)}<div class="tc-num"><span>${m.hp}/${m.stats.hp}</span>${m.held ? `<span class="tc-held"><canvas width="16" height="16" data-sprite="item:${m.held}"></canvas>${esc(G.DATA.items[m.held].name)}</span>` : ''}</div>
            <div class="expbar"><i style="width:${ex}%"></i></div></div></div>`;
      };
      box.innerHTML = `<div class="choice-title">${esc(opt.title || 'ทีมของเรา')}</div><div class="tgrid">${S.party.map(card).join('')}${'<div class="tcard empty"><span>ว่าง</span></div>'.repeat(6 - S.party.length)}</div><div class="tinfo"></div>`;
      const cards = [...box.querySelectorAll('.tcard[data-i]')], info = box.querySelector('.tinfo');
      let sel = Math.max(0, Math.min(S.party.length - 1, opt.start || 0));
      if (opt.mustAlive && S.party[sel] && S.party[sel].hp <= 0) sel = Math.max(0, S.party.findIndex((m) => m.hp > 0));
      const draw = () => {
        cards.forEach((c, i) => c.classList.toggle('sel', i === sel));
        const m = S.party[sel]; if (!m) return;
        const sp = G.DATA.species[m.sp];
        info.textContent = `${sp.ability ? 'ความสามารถ: ' + AB_SHORT[sp.ability] + ' (' + G.AB_DESC[sp.ability] + ') · ' : ''}นิสัย${G.natureText(m)} · โจมตี ${m.stats.atk} · ป้องกัน ${m.stats.def} · พิเศษ ${m.stats.spa} · ความเร็ว ${m.stats.spe} · EXP อีก ${G.expFor(m.lv + 1) - m.exp}`;
      };
      const pick = () => { if (opt.mustAlive && S.party[sel].hp <= 0) { G.sfx('bump'); return; } G.sfx('tick'); pop(m); resolve(sel); };
      const n = S.party.length;
      const m = { el: box, onKey: (k) => {
        if (k === 'left' || k === 'right') sel = sel % 2 ? sel - 1 : Math.min(n - 1, sel + 1);
        else if (k === 'up') sel = sel >= 2 ? sel - 2 : sel;
        else if (k === 'down') sel = sel + 2 < n ? sel + 2 : sel;
        else if (k === 'ok') return pick();
        else if (k === 'back' && opt.cancel !== false) { G.sfx('tick'); pop(m); resolve(-1); return; }
        draw();
      } };
      cards.forEach((c, i) => c.addEventListener('click', () => { sel = i; draw(); pick(); }));
      push(m); draw();
    });
  };
  G.ui.partyMenu = async function (opt = {}) {
    const S = G.state;
    let start = 0;
    for (;;) {
      const i = await G.ui.teamScreen({ title: opt.title || 'ทีมของเรา · คนแรกเดินตามและลงสู้ก่อน · Z เลือก X ปิด', mustAlive: opt.mustAlive, cancel: opt.cancel, start: opt.pick ? 0 : start });
      if (i < 0 || opt.pick) return i;
      start = i;
      const m = S.party[i];
      const acts = ['ดูข้อมูล', i === 0 ? (S.follower ? 'ให้เลิกเดินตาม' : 'ให้เดินตาม') : 'ให้เดินตาม (ลงสู้คนแรก)', 'สลับลำดับ', m.held ? 'เก็บของถือคืน' : 'ให้ถือของ', 'ตั้งชื่อเล่น', 'ปิด'];
      const act = await G.ui.choose(acts, { cls: 'small', title: m.name });
      if (act === 0) await G.ui.monInfo(m);
      else if (act === 1) {
        if (i === 0) S.follower = !S.follower;
        else { S.party.splice(i, 1); S.party.unshift(m); S.follower = true; start = 0; }
        if (G.world.follow) G.world.follow = { x: G.world.follow.x, y: G.world.follow.y, dir: G.state.dir };
        G.sfx('tick');
      } else if (act === 2) {
        const j = await G.ui.choose(S.party.map((o) => monRow(o)), { title: `สลับ ${m.name} กับใคร?`, cls: 'party', start: i });
        if (j >= 0 && j !== i) { [S.party[i], S.party[j]] = [S.party[j], S.party[i]]; G.sfx('tick'); start = j; }
      } else if (act === 3) {
        if (m.held) { S.bag[m.held] = (S.bag[m.held] || 0) + 1; await G.ui.say(`เก็บ${G.DATA.items[m.held].name}คืนเข้ากระเป๋าแล้ว`); m.held = null; }
        else {
          const id = await G.ui.bagMenu({ pickOnly: true, filter: (it) => it.kind === 'held', title: `ให้ ${m.name} ถืออะไร?` });
          if (id) { S.bag[id]--; m.held = id; G.sfx('buy'); await G.ui.say(`${m.name} ถือ${G.DATA.items[id].name}แล้ว`); }
        }
      } else if (act === 4) {
        const nm = await G.askText(`ตั้งชื่อเล่นให้ ${m.name}`, m.name, 12);
        if (nm) { m.name = nm; G.sfx('buy'); }
      }
    }
  };

  // ---------- คลังแก๊ง (ฝาก/รับสมาชิก กรองตามประเภท) ----------
  G.ui.storageMenu = async function (keeper) {
    const S = G.state;
    for (;;) {
      const i = await G.ui.choose([{ label: 'รับสมาชิกเข้าทีม', sub: `ในคลัง ${S.storage.length}` }, { label: 'ฝากสมาชิกไว้ในคลัง', sub: `ในทีม ${S.party.length}/6` }, 'จัดลำดับทีม', 'ปิด'],
        { title: 'คลังแก๊ง', cls: 'small' });
      if (i === 0) {
        if (!S.storage.length) { await G.ui.say('ยังไม่มีใครอยู่ในคลังเลย', keeper); continue; }
        for (;;) {
          const kinds = [['all', 'ทั้งหมด'], ['kid', 'เด็กบ้านนา'], ['ghost', 'ผีสาง'], ['eng', 'น้องวิศวะ'], ['med', 'น้องหมอพยาบาล']];
          const count = (k) => S.storage.filter((m) => k === 'all' || G.DATA.species[m.sp].kind === k).length;
          const f = await G.ui.choose(kinds.map(([k, n]) => ({ label: n, sub: `${count(k)} คน`, disabled: !count(k) })), { title: 'ดูกลุ่มไหน?', cls: 'small' });
          if (f < 0) break;
          const list = S.storage.map((m, idx) => ({ m, idx })).filter(({ m }) => kinds[f][0] === 'all' || G.DATA.species[m.sp].kind === kinds[f][0])
            .sort((a, b) => b.m.lv - a.m.lv);
          const k = await G.ui.choose(list.map(({ m }) => monRow(m)), { title: `${kinds[f][1]} ในคลัง (เรียงตามเลเวล)`, cls: 'party',
            info: (j) => { const m = list[j] && list[j].m; return m ? `${KIND_TH[G.DATA.species[m.sp].kind]} · ${G.TYPE_TH[G.DATA.species[m.sp].type]} · ${G.DATA.species[m.sp].desc}` : ''; } });
          if (k < 0) continue;
          const pick = list[k];
          if (S.party.length >= 6) {
            const out = await G.ui.choose(S.party.map((m) => monRow(m)), { title: `ทีมเต็ม ให้ใครออกไปพักแทน ${pick.m.name}?`, cls: 'party' });
            if (out < 0) continue;
            const [gone] = S.party.splice(out, 1, pick.m); S.storage.splice(pick.idx, 1, gone);
            await G.ui.say(`${pick.m.name} เข้าทีม ${gone.name} ไปพักในคลัง`, keeper);
          } else { S.storage.splice(pick.idx, 1); S.party.push(pick.m); await G.ui.say(`${pick.m.name} เข้าทีมแล้ว!`, keeper); }
          G.sfx('buy');
        }
      } else if (i === 1) {
        if (S.party.length <= 1) { await G.ui.say('ต้องมีอย่างน้อยหนึ่งคนอยู่ในทีม', keeper); continue; }
        const k = await G.ui.partyMenu({ pick: true, title: 'ฝากใครไว้ในคลัง?' });
        if (k < 0) continue;
        const rest = S.party.filter((m, j) => j !== k && m.hp > 0);
        if (!rest.length) { await G.ui.say('ฝากไม่ได้ ทีมจะไม่เหลือคนที่ยังสู้ไหว', keeper); continue; }
        const [m] = S.party.splice(k, 1); S.storage.push(m); G.sfx('tick');
        await G.ui.say(`${m.name} ไปพักในคลังแล้ว`, keeper);
      } else if (i === 2) await G.ui.partyMenu();
      else return;
    }
  };
  G.askText = (title, value, max) => new Promise((resolve) => {
    const box = document.createElement('div'); box.className = 'panel sheet namebox';
    box.innerHTML = `<div class="choice-title">${esc(title)}</div><input maxlength="${max || 10}" aria-label="${esc(title)}"><div class="hint">พิมพ์แล้วกด Enter · Esc ยกเลิก</div>`;
    document.querySelector('#ui').appendChild(box);
    const inp = box.querySelector('input'); inp.value = value || ''; inp.focus(); inp.select();
    const done = (v) => { box.remove(); resolve(v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(inp.value.trim() || null); } else if (e.key === 'Escape') done(null); e.stopPropagation(); });
  });

  // ข้อมูลสมาชิก: 3 แท็บ (ประวัติ · ค่าพลังกราฟหกเหลี่ยม · ท่า) ← → เปลี่ยนแท็บ
  const STAT_TH = [['hp', 'HP'], ['atk', 'โจมตี'], ['def', 'ป้องกัน'], ['spe', 'ความเร็ว'], ['spd', 'ป้องกันพิเศษ'], ['spa', 'พิเศษ']];
  function hexChart(cv, m) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2 + 2, R = Math.min(W, H) * 0.3;
    const sp = G.DATA.species[m.sp], nt = G.NATURES[m.nature] || {};
    const pt = (i, r) => [cx + Math.sin((i / 6) * Math.PI * 2) * r, cy - Math.cos((i / 6) * Math.PI * 2) * r];
    const poly = (r, fill, stroke) => { g.beginPath(); for (let i = 0; i < 6; i++) { const [x, y] = pt(i, typeof r === 'function' ? r(i) : r); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.stroke(); } };
    g.lineWidth = 1;
    for (const k of [1, 0.75, 0.5, 0.25]) poly(R * k, k === 1 ? 'rgba(246,238,216,0.06)' : null, 'rgba(246,238,216,0.18)');
    for (let i = 0; i < 6; i++) { const [x, y] = pt(i, R); g.strokeStyle = 'rgba(246,238,216,0.12)'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); }
    const base = (i) => R * Math.min(1, (sp[STAT_TH[i][0]] || 0) / 130);
    const cap = (k) => Math.floor((291 * m.lv) / 100) + (k === 'hp' ? m.lv + 10 : 5);   // ค่าที่ได้ถ้าค่าพื้นฐาน 130 ที่เลเวลนี้
    const cur = (i) => { const k = STAT_TH[i][0]; return R * Math.max(0.08, Math.min(1.1, m.stats[k] / cap(k))); };
    poly(base, 'rgba(95,184,224,0.25)', 'rgba(95,184,224,0.7)');   // ค่าพื้นฐานของสายพันธุ์
    poly(cur, 'rgba(217,178,90,0.45)', '#f2d24b');                   // ค่าจริงตอนนี้ (เทียบเพดานที่เลเวลเดียวกัน)
    g.font = `${Math.round(H / 15)}px Itim, Tahoma, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    STAT_TH.forEach(([k, n], i) => {
      const [x, y] = pt(i, R + H * 0.11);
      g.fillStyle = nt[1] === k ? '#ff9a8a' : nt[2] === k ? '#8ab8ff' : '#f6eed8';
      g.fillText(`${n}${nt[1] === k ? '▲' : nt[2] === k ? '▼' : ''}`, x, y - H * 0.035); g.fillStyle = '#d9b25a'; g.fillText(k === 'hp' ? `${m.hp}/${m.stats.hp}` : m.stats[k], x, y + H * 0.04);
    });
  }
  G.ui.monInfo = function (m) {
    const sp = G.DATA.species[m.sp], TABS = ['ประวัติ', 'ค่าพลัง', 'ท่า'];
    let tab = 0;
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet mon-info');
      const head = () => `<div class="info-head"><canvas class="info-sprite" width="16" height="16" data-sprite="${G.monLook(m)}"></canvas>
        <div><b>${m.shiny ? '<span class="k-shiny">✨</span>' : ''}${esc(m.name)}</b> Lv${m.lv} ${G.ui.typeTag(sp.type)} ${G.ui.statusTag(m.status)} <small>${KIND_TH[sp.kind] || ''}${m.name !== sp.name && sp.kind !== 'eng' && sp.kind !== 'med' ? ' · ' + esc(sp.name) : ''}</small>
        <div class="mi-tabs">${TABS.map((t, i) => `<span class="${i === tab ? 'on' : ''}" data-t="${i}">${t}</span>`).join('')}<em>← →</em></div></div></div>`;
      const body = () => {
        if (tab === 0) return `<div class="mi-body"><p>${esc(sp.desc)}</p>${G.LORE && (G.LORE[m.sp] || G.LORE[m.sp.replace(/2$/, '')]) ? `<p class="mi-lore">📜 ${esc(G.LORE[m.sp] || G.LORE[m.sp.replace(/2$/, '')])}</p>` : ''}
          ${sp.ability ? `<p><b class="mi-k">ความสามารถ</b> ${esc(AB_SHORT[sp.ability])} — <small>${esc(G.AB_DESC[sp.ability])}</small></p>` : ''}
          <p><b class="mi-k">นิสัย</b> ${esc(G.natureText(m))} · <b class="mi-k">ความสนิท</b> <span class="tc-heart">${'♥'.repeat(G.hearts(m)) || '—'}</span>${G.hearts(m) >= 4 ? ' <small>(สนิทมาก บางทีจะทนหมัดสุดท้ายได้)</small>' : ''}</p>
          ${m.held ? `<p><b class="mi-k">ถือ</b> <canvas class="mi-ico" width="16" height="16" data-sprite="item:${m.held}"></canvas>${esc(G.DATA.items[m.held].name)}</p>` : ''}
          ${(m.ribbons || []).length ? `<p><b class="mi-k">ริบบิ้น</b> ${m.ribbons.map((r) => ({ champ: '🏆 แชมป์อีสาน', tower: '🗼 หอท้าสู้ 20 ชนะ' }[r] || r)).join(' ')}</p>` : ''}
          ${m.traded ? '<p><small>ได้มาจากการแลก (EXP ×1.5)</small></p>' : ''}
          <p><b class="mi-k">EXP</b> อีก ${Math.max(0, G.expFor(m.lv + 1) - m.exp)} ถึง Lv${m.lv + 1}</p><div class="expbar"><i style="width:${Math.min(100, ((m.exp - G.expFor(m.lv)) / (G.expFor(m.lv + 1) - G.expFor(m.lv))) * 100)}%"></i></div></div>`;
        if (tab === 1) return `<div class="mi-body mi-stat"><canvas class="mi-hex" width="520" height="300"></canvas><small class="mi-legend"><i class="lg-cur"></i>ค่าตอนนี้ <i class="lg-base"></i>ค่าพื้นฐานสายพันธุ์ · ▲▼ ผลของนิสัย</small></div>`;
        return `<table class="moves"><tr><th>ท่า</th><th>ธาตุ</th><th>พลัง</th><th>PP</th></tr>${m.moves.map((s) => { const mv = G.DATA.moves[s.id];
          return `<tr><td>${esc(mv.name)}<br><small>${esc(G.gimmickText ? G.gimmickText(s.id) || '' : '')}</small></td><td>${G.ui.typeTag(mv.type)}</td><td>${mv.power || '—'}</td><td>${s.pp}/${mv.pp}</td></tr>`; }).join('')}</table>`;
      };
      const render = () => {
        box.innerHTML = head() + body() + '<div class="hint">← → เปลี่ยนแท็บ · Z/X ปิด</div>';
        const cv = box.querySelector('.mi-hex'); if (cv) hexChart(cv, m);
        box.querySelectorAll('[data-t]').forEach((e) => e.addEventListener('click', (ev) => { ev.stopPropagation(); tab = +e.dataset.t; G.sfx('tick'); render(); }));
      };
      const mm = { el: box, onKey: (k) => {
        if (k === 'left' || k === 'right') { tab = (tab + (k === 'left' ? 2 : 1)) % 3; G.sfx('tick'); render(); }
        else if (k === 'ok' || k === 'back') { pop(mm); resolve(); }
      } };
      push(mm); render();
    });
  };

  // ---------- กระเป๋า ----------
  let lastTab = null;
  const BAG_TABS = [['ยา', ['heal', 'healall', 'cure', 'mint']], ['เพิ่มเลเวล', ['exp', 'lvup']], ['ของกินชวน', ['recruit', 'repel']], ['ของถือ', ['held']], ['วัตถุดิบ', ['ingr']], ['ของสำคัญ', ['tm', 'key', 'kit']]];
  const SOURCE = { tm_wind_blade: 'รางวัลชนะยิม 1 พี่ออสซี่', tm_short_circuit: 'รางวัลชนะยิม 2 พี่เฟรนด์', tm_mud_therapy: 'รางวัลชนะยิม 3 พี่บูม', first_aid: 'พี่บูมให้หลังกลับใจ', rod: 'ลุงเปลี่ยนให้เป็นค่าหาไส้เดือน', porridge: 'ซื้อจากตลาดเช้าตัวอำเภอ', yantra: 'หลวงตามอบให้หลังฝนตก', goggles: 'พ่อแอมให้ (แว่นสมัยเรียนวิศวะ)' };
  const BADGES = [['gym1', 'ตราผ้าโพก', 'พี่ออสซี่ · ร้านราเมงลมทุ่ง', 'เปิดทางรถสองแถวไป มข.'], ['gym2', 'ตราเฟือง', 'พี่เฟรนด์ · โรงช็อปวิศวะ มข.', 'เปิดสะพานข้ามลำน้ำพอง'],
    ['gym3', 'ตราหูฟัง', 'พี่บูม · คลินิกหลังโรงพยาบาลอำเภอ', 'เฒ่าจ้ำอนุญาตให้เข้าดอนปู่ตา'], ['gym4', 'ตราไม้เรียว', 'พี่ต้นน้ำ · ห้องสมุดโรงเรียนมัธยม', '—']];
  G.BADGES = BADGES;
  // หน้ากระเป๋า: แท็บตามหมวด รายการพร้อมไอคอน และรายละเอียดด้านขวา (แท็บตรายิมดูอย่างเดียว) คืน id ไอเท็มหรือ null
  // โอกาสชวนสำเร็จ (%) ของของชวนกับผี/คนตรงหน้า ตามสูตรเดียวกับ useItem ใน battle.js
  const chanceOf = (foe, id) => {
    const it = G.DATA.items[id]; if (!foe || !it || it.kind !== 'recruit') return null;
    const eng = G.isPerson(foe), fits = it.for === (eng ? G.DATA.species[foe.sp].kind : 'ghost');
    return Math.min(100, Math.round((G.recruitValue(foe, it.value * (fits ? 1 : 0.5) * G.recruitSit(id, foe, (G.battleTurn ? G.battleTurn() : 0) + 1)) / 256) * 100));
  };
  // ความหายาก: ของสำคัญ = ทอง, ของถือ/ท่าลับ/ไอเทมเลเวล = ม่วง, ของแพง = ฟ้า, ที่เหลือธรรมดา
  G.rarity = (id) => { const it = G.DATA.items[id]; if (!it) return 'c';
    if (it.kind === 'key' || it.kind === 'kit') return 'l'; if (['held', 'tm', 'lvup', 'mint'].includes(it.kind)) return 'r'; return (+it.price || 0) >= 300 ? 'u' : 'c'; };
  const RARE_TH = { c: 'ธรรมดา', u: 'ดี', r: 'หายาก', l: 'ของสำคัญ' };
  // ของใหม่: ได้มาแต่ยังไม่เคยเปิดดูในกระเป๋า (S.seenItems)
  const isNew = (id) => G.state && G.state.bag[id] > 0 && !(G.state.seenItems || {})[id];
  G.ui.newItemCount = () => (G.state ? Object.keys(G.state.bag).filter((k) => G.DATA.items[k] && isNew(k)).length : 0);
  G.ui.bagScreen = function (opt = {}) {
    const chance = (id) => chanceOf(opt.foe, id);
    const S = G.state, I = G.DATA.items;
    return new Promise((resolve) => {
      const tabs = BAG_TABS.map(([name, kinds]) => [name, Object.keys(S.bag).filter((k) => S.bag[k] > 0 && I[k] && kinds.includes(I[k].kind) && (!opt.filter || opt.filter(I[k])))])
        .filter(([, ids]) => ids.length || !opt.filter);
      if (!opt.filter) tabs.push(['ตรายิม', null]);
      let t = Math.max(0, Math.min(tabs.length - 1, opt.tab != null ? opt.tab : tabs.findIndex(([, ids]) => ids && ids.length))), sel = 0;
      const box = el('div', 'panel sheet bag-sheet');
      const render = () => {
        const [, ids] = tabs[t];
        const head = `<div class="bag-tabs">${tabs.map(([n, l], i) => `<span class="${i === t ? 'on' : ''}" data-t="${i}">${n}${l ? ` <small>${l.length}</small>` : ''}${l && l.some(isNew) ? '<i class="ndot"></i>' : ''}</span>`).join('')}</div>`;
        let list, detail;
        if (!ids) {   // ตรายิม
          const b = BADGES[sel];
          list = BADGES.map(([f, n], i) => `<div class="bag-item ${i === sel ? 'sel' : ''} ${S.flags[f + '_done'] ? '' : 'locked'}" data-i="${i}"><canvas width="16" height="16" data-sprite="badge:${f}"></canvas><span>${S.flags[f + '_done'] ? n : '???'}</span></div>`).join('');
          detail = S.flags[b[0] + '_done'] ? `<canvas class="bag-big" width="16" height="16" data-sprite="badge:${b[0]}"></canvas><b>${b[1]}</b><p>ได้จาก ${b[2]}</p><p class="bag-src">ผล: ${b[3]}</p>`
            : `<canvas class="bag-big locked" width="16" height="16" data-sprite="badge:${b[0]}"></canvas><b>ยังไม่ได้</b><p>ชนะ ${b[2].split(' · ')[0]} เพื่อรับตรานี้</p>`;
        } else if (!ids.length) { list = '<div class="bag-empty">ยังไม่มีของในหมวดนี้</div>'; detail = ''; }
        else {
          const id = ids[sel], it = I[id];
          if (!opt.inBattle) { S.seenItems = S.seenItems || {}; setTimeout(() => { S.seenItems[id] = 1; }, 0); }
          list = ids.map((k, i) => `<div class="bag-item rar-${G.rarity(k)} ${i === sel ? 'sel' : ''}" data-i="${i}"><canvas width="16" height="16" data-sprite="item:${k}"></canvas><span>${esc(I[k].name)}${isNew(k) && k !== id ? '<i class="nbadge">ใหม่</i>' : ''}</span><em>${I[k].kind === 'tm' ? '' : '×' + S.bag[k]}${chance(k) !== null ? ` · ${chance(k)}%` : ''}</em></div>`).join('');
          detail = `<canvas class="bag-big rar-${G.rarity(id)}" width="16" height="16" data-sprite="item:${id}"></canvas><b>${esc(it.name)}</b><span class="rar-tag rar-${G.rarity(id)}">${RARE_TH[G.rarity(id)]}</span>${it.kind === 'tm' ? '' : `<span class="bag-count">มี ${S.bag[id]} ชิ้น</span>`}<p>${esc(it.desc)}</p>${chance(id) !== null ? `<p class="bag-chance">โอกาสชวนสำเร็จตอนนี้ ${chance(id)}%</p>` : ''}${SOURCE[id] ? `<p class="bag-src">${SOURCE[id]}</p>` : ''}${it.price && it.kind !== 'tm' && it.kind !== 'held' ? `<p class="bag-src">ราคาร้าน ${it.price} บาท</p>` : ''}`;
        }
        box.innerHTML = `<div class="choice-title">${esc(opt.title || 'กระเป๋า')} · เงิน ${S.money} บาท</div>${head}<div class="bag-body"><div class="bag-list">${list}</div><div class="bag-detail">${detail}</div></div>
          <div class="hint">← → เปลี่ยนหมวด · ↑ ↓ เลือก · Z ${opt.inBattle ? 'ใช้' : opt.pickOnly ? 'เลือก' : 'ใช้/ดู'} · X ปิด</div>`;
        const it = box.querySelector('.bag-item.sel'); if (it) it.scrollIntoView({ block: 'nearest' });
        box.querySelectorAll('[data-t]').forEach((e) => e.addEventListener('click', () => { t = +e.dataset.t; sel = 0; G.sfx('tick'); render(); }));
        box.querySelectorAll('.bag-item').forEach((e) => e.addEventListener('click', () => { if (sel === +e.dataset.i) pick(); else { sel = +e.dataset.i; render(); } }));
      };
      const len = () => (tabs[t][1] ? tabs[t][1].length : BADGES.length);
      const pick = () => { const ids = tabs[t][1]; if (!ids || !ids.length) { G.sfx('bump'); return; } G.sfx('tick'); pop(m); resolve(ids[sel]); };
      const m = { el: box, onKey: (k) => {
        if (k === 'left' || k === 'right') { t = (t + (k === 'left' ? tabs.length - 1 : 1)) % tabs.length; sel = 0; G.sfx('tick'); }
        else if (k === 'up') sel = (sel - 1 + len()) % Math.max(1, len());
        else if (k === 'down') sel = (sel + 1) % Math.max(1, len());
        else if (k === 'ok') return pick();
        else if (k === 'back') { G.sfx('tick'); pop(m); resolve(null); return; }
        render();
      } };
      push(m); render();
    });
  };
  G.ui.bagMenu = async function (opt = {}) {
    const S = G.state, I = G.DATA.items;
    for (;;) {
      const any = Object.keys(S.bag).some((k) => S.bag[k] > 0 && I[k] && (!opt.filter || opt.filter(I[k])));
      if (!any && opt.filter) { await G.ui.say(opt.pickOnly ? 'ไม่มีของที่ใช้ได้' : 'ไม่มีของที่ใช้ตอนนี้ได้'); return null; }
      const picked = await G.ui.bagScreen({ ...opt, tab: lastTab });
      if (!picked) return null;
      const ids = [picked], i = 0;
      const it = I[ids[i]];
      if (!opt.filter) lastTab = BAG_TABS.findIndex(([, kinds]) => kinds.includes(it.kind));
      if (opt.inBattle || opt.pickOnly) return ids[i];
      if (it.kind === 'heal' || it.kind === 'cure') {
        const t = await G.ui.partyMenu({ pick: true, title: `ใช้${it.name}กับใคร?` });
        if (t < 0) continue;
        const m = S.party[t];
        if (it.kind === 'heal') {
          if (m.hp <= 0 || m.hp >= m.stats.hp) { await G.ui.say('ใช้ตอนนี้ไม่ได้'); continue; }
          m.hp = Math.min(m.stats.hp, m.hp + it.value);
        } else { if (!m.status) { await G.ui.say('ไม่มีอาการผิดปกติ'); continue; } m.status = null; }
        S.bag[ids[i]]--; G.sfx('heal'); await G.ui.say(`${m.name} ดีขึ้นแล้ว!`);
      } else if (it.kind === 'healall') {
        if (S.party.every((m) => m.hp <= 0 || m.hp >= m.stats.hp)) { await G.ui.say('ทุกคนพลังเต็มอยู่แล้ว'); continue; }
        S.party.forEach((m) => { if (m.hp > 0) m.hp = m.stats.hp; });
        S.bag[ids[i]]--; G.sfx('heal'); await G.ui.say(`แบ่ง${it.name}กินกันทั้งแก๊ง ทุกคนฟื้นพลังเต็ม!`);
      } else if (it.kind === 'repel') {
        S.bag[ids[i]]--; S.repel = it.value; G.sfx('heal'); await G.ui.say('โปรยข้าวสารเสกแล้ว ผีสางอ่อนๆ จะไม่เข้าใกล้สักพัก');
      } else if (it.kind === 'held') {
        const t = await G.ui.partyMenu({ pick: true, title: `ให้ใครถือ${it.name}?` });
        if (t < 0) continue;
        const m = S.party[t];
        if (m.held) S.bag[m.held] = (S.bag[m.held] || 0) + 1;
        S.bag[ids[i]]--; m.held = ids[i]; G.sfx('buy'); await G.ui.say(`${m.name} ถือ${it.name}แล้ว`);
      } else if (it.kind === 'tm') await G.ui.teachTM(ids[i]);
      else if (it.kind === 'exp' || it.kind === 'lvup') {
        const t = await G.ui.partyMenu({ pick: true, title: `ให้ใครกิน${it.name}?` });
        if (t < 0) continue;
        const m = S.party[t];
        if (m.lv >= 100) { await G.ui.say(`${m.name} เลเวลสูงสุดแล้ว`); continue; }
        S.bag[ids[i]]--; G.sfx('heal');
        await G.ui.say(`${m.name} กิน${it.name} อร่อยมาก!`);
        await G.ui.giveExp(m, it.kind === 'exp' ? it.value : G.expFor(Math.min(100, m.lv + it.value)) - m.exp);
      }
      else if (it.kind === 'mint') {   // ยาดองเปลี่ยนนิสัย
        const t = await G.ui.partyMenu({ pick: true, title: `ให้ใครดื่ม${it.name}?` });
        if (t < 0) continue;
        const m = S.party[t], keys = Object.keys(G.NATURES);
        const k = await G.ui.choose(keys.map((n) => G.natureText({ nature: n })), { title: `นิสัยใหม่ของ ${m.name} (ตอนนี้: ${G.natureText(m)})`, cls: 'small' });
        if (k < 0) continue;
        m.nature = keys[k]; G.refreshStats(m); S.bag[ids[i]]--; G.sfx('heal');
        await G.ui.say(`${m.name} ดื่ม${it.name}แล้วนิสัยเปลี่ยนเป็น ${G.natureText(m)}!`);
      }
      else if (it.kind === 'kit') {   // กระเป๋าปฐมพยาบาล: วันละครั้ง (นับวันจากเวลาเล่นในเกม)
        const day = Math.floor((S.playMs || 0) / (1440 * 1000));
        if (S.kitDay === day) { await G.ui.say('วันนี้ใช้กระเป๋าปฐมพยาบาลไปแล้ว พรุ่งนี้ค่อยใช้ใหม่นะ'); continue; }
        if (S.party.every((m) => m.hp >= m.stats.hp && !m.status)) { await G.ui.say('ทุกคนแข็งแรงดีอยู่แล้ว'); continue; }
        S.party.forEach((m) => { m.hp = m.stats.hp; m.status = null; }); S.kitDay = day;
        G.sfx('heal'); await G.ui.say('เปิดกระเป๋าปฐมพยาบาลของพี่บูม ทำแผลให้ทุกคน ฟื้นพลังเต็ม!');
      } else if (ids[i] === 'bike') { G.toggleBike(); return null; }
      else if (it.kind === 'key') await G.ui.say(it.desc);
      else await G.ui.say(`${it.name}ใช้ได้ตอนต่อสู้เท่านั้น`);
    }
  };
  // ---------- วิวัฒนาการ: evo = "ร่างใหม่:เลเวล[:night|rain|flag]" ----------
  G.evoReady = function (m) {
    const ev = (G.DATA.species[m.sp].evo || '').split(':');
    if (!ev[0] || m.lv < +ev[1] || m.noEvo === m.lv || m.held === 'everstone') return null;
    const c = ev[2];
    if (c === 'night' ? !G.isNight() : c === 'rain' ? !G.raining() : c ? !G.state.flags[c] : false) return null;
    return ev[0];
  };
  G.EVO_HINT = { night: 'ตอนกลางคืน', rain: 'ตอนฝนตก', forest_healed: 'หลังดอนปู่ตาฟื้น', naga_done: 'หลังได้พรจากแม่นาค' };
  function evolveScene(m, to) {   // ภาพสลับร่างเร็วขึ้นเรื่อยๆ ตัวเรืองแสงขาว กด X หยุดได้
    return new Promise((resolve) => {
      const tsp = G.DATA.species[to], box = el('div', 'panel evo-panel');
      box.innerHTML = `<div class="choice-title">วิวัฒนาการ!</div><canvas class="evo-cv" width="64" height="64"></canvas><div class="evo-text">${esc(m.name)} กำลังเปลี่ยนร่าง...</div><div class="evo-hint">กด X เพื่อหยุด</div>`;
      const cv = box.querySelector('canvas'), x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      const a = G.sprite(G.monLook(m)), b = G.sprite(tsp.look + (m.shiny ? '*' : ''));
      const t0 = performance.now(), dur = G.settings.fast ? 1800 : 3200; let done = false;
      const step = (now) => {
        if (done) return;
        const t = Math.min(1, (now - t0) / dur), showB = Math.sin(t * t * Math.PI * 26) > 0 || t >= 1;
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, 64, 64); x.drawImage(showB ? b : a, 0, 0, 64, 64);
        x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(255,255,255,${t < 1 ? 0.35 + t * 0.6 : 0})`; x.fillRect(0, 0, 64, 64);
        if (t >= 1) { done = true; x.globalCompositeOperation = 'source-over'; G.sfx('level'); setTimeout(() => { pop(m2); resolve(true); }, 500); return; }
        requestAnimationFrame(step);
      };
      const m2 = { el: box, onKey: (k) => { if (k === 'back' && !done) { done = true; pop(m2); resolve(false); } } };
      push(m2); G.sfx('power'); requestAnimationFrame(step);
    });
  }
  // ชวนผีครบทุกชนิด → ตะกรุดนำโชค (เจอสีพิเศษ ×3)
  G.ui.dexReward = async function () {
    const S = G.state, sp = G.DATA.species;
    if (S.bag.lucky_charm) return;
    const ghosts = Object.keys(sp).filter((k) => sp[k].kind === 'ghost');
    if (!ghosts.every((k) => S.dex[k] === 2)) return;
    S.bag.lucky_charm = 1; G.sfx('level');
    await G.ui.say('สมุดบันทึกผีครบทุกชนิดแล้ว! หลวงตาฝากตะกรุดนำโชคมาให้ ต่อไปจะเจอผีสีพิเศษบ่อยขึ้นสามเท่า');
  };
  G.ui.tryEvolve = async function (m) {
    const to = G.evoReady(m); if (!to) return;
    const tsp = G.DATA.species[to], old = m.name, nick = m.name !== G.DATA.species[m.sp].name;
    await G.ui.say(`เอ๊ะ? ${m.name} ตัวสั่นเรืองแสง...`);
    if (!(await evolveScene(m, to))) { m.noEvo = m.lv; await G.ui.say(`${m.name} หยุดเปลี่ยนร่างไว้ก่อน (เลเวลขึ้นครั้งหน้าจะลองใหม่)`); return; }
    m.sp = to; if (!nick) m.name = tsp.name;
    G.refreshStats(m); G.state.dex[to] = 2;
    await G.ui.say(`ยินดีด้วย! ${old} เปลี่ยนร่างเป็น ${tsp.name} แล้ว!`);
    await G.ui.dexReward();
    for (const [lv, mid] of tsp.learnset) if (lv <= m.lv && lv > (m.lv - 1) && !m.moves.some((s) => s.id === mid)) await G.ui.learnMove(m, mid);
  };
  // ---------- EXP นอกการต่อสู้ (ของกินเพิ่มเลเวล) ----------
  G.ui.giveExp = async function (m, amount, quiet) {   // quiet = ไม่บอกถ้าไม่ได้เลเวลอัป
    const sp = G.DATA.species[m.sp], before = m.lv, stage = G.growthStage(m.lv), learned = [];
    m.exp += Math.max(0, Math.floor(amount));
    while (m.lv < 100 && m.exp >= G.expFor(m.lv + 1)) {
      m.lv++; G.refreshStats(m);
      for (const [lv, mid] of sp.learnset) if (lv === m.lv && !m.moves.some((x) => x.id === mid)) learned.push(mid);
    }
    if (m.lv === before) { if (quiet) return; await G.ui.say(`${m.name} ได้รับประสบการณ์ ${Math.floor(amount)} (อีก ${G.expFor(m.lv + 1) - m.exp} ถึงเลเวลถัดไป)`); return; }
    G.sfx('level'); await G.ui.say(`${m.name} เลเวลอัปเป็น ${m.lv}!`);
    if (sp.kind === 'kid' && G.growthStage(m.lv) > stage) await G.ui.say(`${m.name} เติบโตขึ้นเป็นขั้นที่ ${G.growthStage(m.lv)}!`);
    for (const mid of learned) await G.ui.learnMove(m, mid);
    await G.ui.tryEvolve(m);
  };
  // เรียนท่าใหม่นอกการต่อสู้: ท่าเต็ม 4 ให้เลือกลืมท่าเก่า (หรือไม่เรียน) คืน true ถ้าได้เรียน
  G.ui.learnMove = async function (m, mid) {
    const mv = G.DATA.moves[mid];
    if (m.moves.some((x) => x.id === mid)) { await G.ui.say(`${m.name} ใช้ท่า ${mv.name} อยู่แล้ว`); return false; }
    if (m.moves.length < 4) { m.moves.push({ id: mid, pp: mv.pp }); G.sfx('level'); await G.ui.say(`${m.name} เรียนท่า ${mv.name} ได้แล้ว!`); return true; }
    const k = await G.ui.ask(`${m.name} อยากเรียนท่า ${mv.name} แต่จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, m.moves.map((x) => G.DATA.moves[x.id].name).concat([`ไม่เรียน ${mv.name}`]), { cls: 'small', info: (j) => (m.moves[j] ? G.DATA.moves[m.moves[j].id].desc + (G.gimmickText(m.moves[j].id) ? ' · ' + G.gimmickText(m.moves[j].id) : '') : '') });
    if (k < 0 || k >= 4) { await G.ui.say(`${m.name} ไม่ได้เรียน ${mv.name}`); return false; }
    const old = G.DATA.moves[m.moves[k].id].name;
    m.moves[k] = { id: mid, pp: mv.pp }; G.sfx('level'); await G.ui.say(`ลืม ${old} แล้วเรียน ${mv.name} แทน!`);
    return true;
  };

  // ---------- ครูสอนท่า: จัดท่าฟรี (ท่าที่เคยเรียนตามเลเวล/ซื้อ/ท่าลับที่เคยสอน) และขายท่าพิเศษตามธาตุ ----------
  const TUTOR = [['wrench_throw', 400], ['cheer_faculty', 500], ['piston_ram', 900], ['river_splash', 400], ['foam_burst', 800], ['mermaid_song', 1000],
    ['hoe_swing', 400], ['brick_smash', 700], ['stone_drop', 900], ['live_wire', 400], ['plasma', 700], ['ghost_light', 1000],
    ['basket_flap', 300], ['clean_wind', 700], ['takhian_leaf', 1000]];
  const movePool = (m) => {   // ท่าที่สมาชิกคนนี้ใช้ได้ทั้งหมด
    const sp = G.DATA.species[m.sp], ids = new Set(sp.learnset.filter(([lv]) => lv <= m.lv).map(([, id]) => id));
    for (const id of m.extra || []) ids.add(id);
    for (const x of m.moves) ids.add(x.id);
    return [...ids].filter((id) => G.DATA.moves[id]);
  };
  const moveInfo = (id) => { const mv = G.DATA.moves[id], gm = G.gimmickText(id); return `${G.TYPE_TH[mv.type]} · ${mv.cat === 'status' ? 'ท่าสถานะ' : 'พลัง ' + mv.power} · ${mv.desc}${gm ? ' · ' + gm : ''}`; };
  G.ui.arrangeMoves = async function (m) {
    for (;;) {
      const items = m.moves.map((x) => ({ icon: `type:${G.DATA.moves[x.id].type}`, label: G.DATA.moves[x.id].name, sub: `${x.pp}/${G.DATA.moves[x.id].pp}` }));
      if (m.moves.length < 4) items.push({ label: '+ ใส่ท่าเพิ่ม', sub: `${m.moves.length}/4` });
      const k = await G.ui.choose(items, { title: `จัดท่าของ ${m.name} (เลือกช่องที่จะเปลี่ยน)`, cls: 'small', info: (j) => (m.moves[j] ? moveInfo(m.moves[j].id) : 'เลือกท่าที่เคยเรียนมาใส่ช่องว่าง') });
      if (k < 0) return;
      const pool = movePool(m).filter((id) => !m.moves.some((x) => x.id === id));
      const opts = pool.map((id) => ({ icon: `type:${G.DATA.moves[id].type}`, label: G.DATA.moves[id].name, sub: G.TYPE_TH[G.DATA.moves[id].type] }));
      if (k < m.moves.length && m.moves.length > 1) opts.push({ label: 'ลืมท่านี้ (เว้นช่องว่าง)' });
      if (!opts.length) { await G.ui.say('ยังไม่มีท่าอื่นให้เปลี่ยน ลองเรียนท่าพิเศษกับครูดูนะ'); continue; }
      const j = await G.ui.choose(opts, { title: k < m.moves.length ? `เปลี่ยน ${G.DATA.moves[m.moves[k].id].name} เป็น...` : 'ใส่ท่าไหน?', cls: 'party', info: (q) => (pool[q] ? moveInfo(pool[q]) : 'ลืมแล้วเรียนกลับมาใหม่ได้ฟรีที่ครูสอนท่า') });
      if (j < 0) continue;
      if (j >= pool.length) { m.moves.splice(k, 1); G.sfx('tick'); continue; }
      const id = pool[j], slot = { id, pp: G.DATA.moves[id].pp };
      if (k < m.moves.length) m.moves[k] = slot; else m.moves.push(slot);
      G.sfx('buy');
    }
  };
  G.ui.tutor = async function (name) {
    const S = G.state;
    for (;;) {
      const i = await G.ui.choose(['จัดท่า (ฟรี)', 'เรียนท่าพิเศษ (เสียเงิน)', 'ไม่เป็นไร'], { title: `${name} · เงิน ${S.money} บาท`, cls: 'small',
        info: (k) => ['เปลี่ยนท่าที่ใช้สู้ เอาท่าที่ลืมไปแล้วกลับมาใช้ได้ฟรี', 'สอนท่าใหม่ที่เรียนเองไม่ได้ ต้องเป็นธาตุเดียวกัน (ท่าปกติเรียนได้ทุกคน)', ''][k] });
      if (i < 0 || i === 2) return;
      const t = await G.ui.partyMenu({ pick: true, title: i === 0 ? 'จะจัดท่าให้ใคร?' : 'จะเรียนท่าพิเศษให้ใคร?' });
      if (t < 0) continue;
      const m = S.party[t], type = G.DATA.species[m.sp].type;
      if (i === 0) { await G.ui.arrangeMoves(m); continue; }
      const list = TUTOR.filter(([id]) => { const mv = G.DATA.moves[id]; return mv && (mv.type === type || mv.type === 'normal'); });
      const has = (id) => movePool(m).includes(id);
      const k = await G.ui.choose(list.map(([id, price]) => ({ icon: `type:${G.DATA.moves[id].type}`, label: G.DATA.moves[id].name, sub: has(id) ? 'เรียนแล้ว' : `${price} บาท`, disabled: has(id) })),
        { title: `ท่าพิเศษสำหรับ ${m.name} (ธาตุ${G.TYPE_TH[type]})`, cls: 'party', info: (q) => (list[q] ? moveInfo(list[q][0]) : '') });
      if (k < 0) continue;
      const [id, price] = list[k];
      if (S.money < price) { await G.ui.say(`เงินไม่พอ ท่านี้ ${price} บาท`, name); continue; }
      if (!(await G.ui.confirm(`สอนท่า ${G.DATA.moves[id].name} ให้${m.name} ${price} บาทนะ ตกลงไหม?`, name))) continue;
      S.money -= price; m.extra = [...(m.extra || []), id]; G.sfx('buy');
      await G.ui.say('ฮึบ! ฝึกจนเหงื่อท่วม...', name);
      if (!(await G.ui.learnMove(m, id))) await G.ui.say('ไม่เป็นไร ท่านี้จำไว้แล้ว มาจัดท่าใส่ทีหลังได้ฟรี', name);
    }
  };

  // ท่าลับรางวัลยิม: สอนใครก็ได้ที่ธาตุตรงกัน ใช้ซ้ำได้
  G.ui.teachTM = async function (id) {
    const S = G.state, it = G.DATA.items[id], mv = G.DATA.moves[it.move];
    const t = await G.ui.partyMenu({ pick: true, title: `สอนท่า ${mv.name} (ธาตุ${G.TYPE_TH[it.for]}) ให้ใคร?` });
    if (t < 0) return;
    const m = S.party[t];
    if (G.DATA.species[m.sp].type !== it.for) { await G.ui.say(`${m.name} ไม่ใช่ธาตุ${G.TYPE_TH[it.for]} เรียนท่านี้ไม่ได้`); return; }
    if (m.moves.some((s2) => s2.id === it.move)) { await G.ui.say(`${m.name} ใช้ท่า ${mv.name} เป็นอยู่แล้ว`); return; }
    if (m.moves.length < 4) { m.moves.push({ id: it.move, pp: mv.pp }); }
    else {
      const k = await G.ui.ask(`${m.name} จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, m.moves.map((s2) => G.DATA.moves[s2.id].name).concat(['ไม่เรียน']), { cls: 'small' });
      if (k < 0 || k >= 4) return;
      m.moves[k] = { id: it.move, pp: mv.pp };
    }
    m.extra = [...new Set([...(m.extra || []), it.move])];
    G.sfx('level'); await G.ui.say(`${m.name} เรียนท่าลับ ${mv.name} ได้แล้ว!`);
  };

  // ---------- ร้านค้า ----------
  G.ui.shop = async function (stock, keeper) {
    const S = G.state, I = G.DATA.items;
    for (;;) {
      const i = await G.ui.choose(stock.map((k) => ({ label: I[k].name, sub: I[k].price + ' บาท' + (S.bag[k] ? ` · มี ${S.bag[k]}` : '') })).concat([{ label: 'ขายของในกระเป๋า', sub: 'ได้ครึ่งราคา' }]),
        { title: `เงิน ${S.money} บาท`, cls: 'bag', info: (k) => (k < stock.length ? I[stock[k]] && I[stock[k]].desc : 'ขายของที่เหลือใช้ได้ครึ่งราคา (ของสำคัญและท่าลับขายไม่ได้)') });
      if (i < 0) return;
      if (i === stock.length) { await sellMenu(keeper); continue; }
      const it = I[stock[i]], most = Math.min(99, Math.floor(S.money / it.price));
      const qtys = [...new Set([1, 5, 10, most].filter((q) => q >= 1 && q <= most))];
      if (!qtys.length) { await G.ui.say('เงินไม่พอจ้า', keeper); continue; }
      const q = await G.ui.choose(qtys.map((n) => ({ label: n === most && n > 10 ? `${n} ชิ้น (เต็มเงิน)` : `${n} ชิ้น`, sub: n * it.price + ' บาท' })), { cls: 'small' });
      if (q < 0) continue;
      S.money -= qtys[q] * it.price; S.bag[stock[i]] = (S.bag[stock[i]] || 0) + qtys[q];
      G.sfx('buy'); await G.ui.say(`ได้${it.name} ${qtys[q]} ชิ้น ขอบใจหลาย!`, keeper);
    }
  };
  // ขายของ: ครึ่งราคาร้าน ของสำคัญ/ท่าลับ/ของไม่มีราคา ขายไม่ได้
  async function sellMenu(keeper) {
    const S = G.state, I = G.DATA.items;
    for (;;) {
      const ids = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && I[k] && I[k].price > 0 && !['key', 'tm'].includes(I[k].kind));
      if (!ids.length) { await G.ui.say('ไม่มีของที่ขายได้เลย', keeper); return; }
      const i = await G.ui.choose(ids.map((k) => ({ label: `${I[k].name} ×${S.bag[k]}`, sub: `ชิ้นละ ${Math.floor(I[k].price / 2)} บาท` })), { title: `ขายของ · เงิน ${S.money} บาท`, cls: 'bag', info: (k) => I[ids[k]].desc });
      if (i < 0) return;
      const k = ids[i], have = S.bag[k], each = Math.floor(I[k].price / 2);
      const qtys = [...new Set([1, 5, have].filter((q) => q <= have))];
      const q = await G.ui.choose(qtys.map((n) => ({ label: n === have && n > 1 ? `ทั้งหมด ${n} ชิ้น` : `${n} ชิ้น`, sub: `ได้ ${n * each} บาท` })), { cls: 'small' });
      if (q < 0) continue;
      S.bag[k] -= qtys[q]; S.money += qtys[q] * each;
      G.sfx('buy'); await G.ui.say(`ขาย${I[k].name} ${qtys[q]} ชิ้น ได้ ${qtys[q] * each} บาท`, keeper);
    }
  }

  // ---------- สมุดบันทึก: ยังไม่พบ / เคยพบ / เคยสู้ / ชวนสำเร็จ (+ อยู่ในทีม / อยู่ในคลัง) ----------
  G.ui.notebook = function () {
    const S = G.state, sp = G.DATA.species, fought = S.fought || {};
    const ids = Object.keys(sp).filter((k) => sp[k].kind === 'ghost' || (G.isPerson(k) && G.DATA.engNames[k]));
    const inTeam = (k) => S.party.filter((m) => m.sp === k).length, inBox = (k) => S.storage.filter((m) => m.sp === k).length;
    const stateOf = (k) => (S.dex[k] === 2 ? 3 : fought[k] ? 2 : S.dex[k] ? 1 : 0);
    const LABEL = ['ยังไม่พบ', 'เคยพบ', 'เคยสู้', 'ชวนสำเร็จ'];
    const card = (k) => {
      const st = stateOf(k), t = inTeam(k), b = inBox(k);
      const tags = (st ? `<span class="tag nb-st${st}">${LABEL[st]}</span>` : '') + (t ? `<span class="tag nb-team">ในทีม ${t}</span>` : '') + (b ? `<span class="tag nb-box">ในคลัง ${b}</span>` : '');
      const desc = st === 0 ? 'ยังไม่เคยเจอ' : st === 1 ? 'เคยเห็นแวบๆ ต้องลองสู้ดูถึงจะรู้มากกว่านี้' : esc(sp[k].desc);
      // ที่อยู่: แมพ ช่วงเวลา ความหายาก · เส้นทางวิวัฒนาการ · สีพิเศษที่เคยชวนได้
      const where = st ? Object.entries(G.DATA.encounters).map(([mp, list]) => {
        const e = list.find((x) => x.sp === k); if (!e) return '';
        const pct = (key) => { const tot = list.reduce((a2, x) => a2 + x[key], 0); return tot ? Math.round((e[key] / tot) * 100) : 0; };
        const d = pct('day'), n = pct('night'), r = Math.max(d, n), rare = r >= 25 ? 'เจอบ่อย' : r >= 12 ? 'พอเจอได้' : r > 0 ? 'หายาก' : '';
        return rare ? `${G.DATA.world.maps[mp] ? G.DATA.world.maps[mp].name : mp} (${d && n ? 'ทั้งวัน' : d ? 'กลางวัน' : 'กลางคืน'} · ${rare})` : '';
      }).filter(Boolean).join(' · ') : '';
      const ev = (sp[k].evo || '').split(':'), evo = st >= 2 && ev[0] ? `เปลี่ยนร่างที่ Lv${ev[1]}${ev[2] ? ' ' + (G.EVO_HINT[ev[2]] || '') : ''} → ${S.dex[ev[0]] ? sp[ev[0]].name : '???'}` : '';
      const from = Object.keys(sp).find((b2) => (sp[b2].evo || '').split(':')[0] === k);
      const shinyT = ((S.shinyDex || {})[k] ? '<span class="tag k-shiny">✨ สีพิเศษ</span>' : '') + (st ? `<span class="tag nb-star" title="ดาวการศึกษา">${'★'.repeat(G.researchStars(k))}${'☆'.repeat(3 - G.researchStars(k))}</span>` : '');
      return `<div class="nb-row st${st}"><canvas width="16" height="16" data-sprite="${st ? sp[k].look : ''}"></canvas>
        <div><b>${st ? esc(sp[k].name) : '???'}</b> ${st >= 2 ? G.ui.typeTag(sp[k].type) : ''}<br>${tags}${shinyT}<br><small>${desc}</small>${where ? `<br><small class="nb-where">📍 ${esc(where)}</small>` : st && from ? `<br><small class="nb-where">📍 ได้จากการเปลี่ยนร่างของ${S.dex[from] ? esc(sp[from].name) : 'ผีบางชนิด'}</small>` : ''}${evo ? `<br><small class="nb-evo">✦ ${esc(evo)}</small>` : ''}</div></div>`;
    };
    const ghosts = ids.filter((k) => sp[k].kind === 'ghost'), engs = ids.filter((k) => sp[k].kind === 'eng'), meds = ids.filter((k) => sp[k].kind === 'med');
    const count = (list) => [1, 2, 3].map((n) => list.filter((k) => stateOf(k) >= n).length);
    const [gs, gf, gc] = count(ghosts), [es, ef, ec] = count(engs), [ms, mf, mc] = count(meds);
    const people = [...S.party, ...S.storage].filter((m) => sp[m.sp].kind === 'eng').length;
    const medPeople = [...S.party, ...S.storage].filter((m) => sp[m.sp].kind === 'med').length;
    // ตัวกรอง ←/→: ธาตุ (เฉพาะตัวที่เคยสู้ ถึงจะรู้ธาตุ) หรือพื้นที่ที่เจอ
    const where = (k, map) => (G.DATA.encounters[map] || []).some((e) => e.sp === k);
    const FILTERS = [['ทั้งหมด', () => true], ...Object.keys(TYPE_TH).map((t) => [`ธาตุ${TYPE_TH[t]}`, (k) => stateOf(k) >= 2 && sp[k].type === t, t]),
      ['ทุ่งนา', (k) => stateOf(k) >= 1 && where(k, 'field')], ['มข.', (k) => stateOf(k) >= 1 && where(k, 'kku')],
      ['ริมพอง', (k) => stateOf(k) >= 1 && where(k, 'phong')], ['ตัวอำเภอ', (k) => stateOf(k) >= 1 && where(k, 'amphoe')], ['โรงพยาบาล', (k) => stateOf(k) >= 1 && where(k, 'ward')]];
    let f = 0;
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet notebook');
      const render = () => {
        const [fname, test, t] = FILTERS[f];
        const g = ghosts.filter(test), e = engs.filter(test), md = meds.filter(test);
        box.innerHTML = `<div class="choice-title">สมุดบันทึก (แอมเขียน)</div>
          <div class="nb-filter"><span class="nb-arrow">◀</span>${t ? `<canvas width="16" height="16" class="ty-ico" data-sprite="type:${t}"></canvas>` : ''}<b>${fname}</b><span class="nb-arrow">▶</span><small>กด ←/→ เปลี่ยนตัวกรอง</small></div>
          ${g.length || (!e.length && !md.length) ? `<div class="nb-head">ผีสาง — เจอ ${gs}/${ghosts.length} · สู้ ${gf} · ชวนได้ ${gc}</div><div class="nb">${g.map(card).join('') || '<small>ยังไม่มีในหมวดนี้</small>'}</div>` : ''}
          ${e.length ? `<div class="nb-head">น้องวิศวะ — เจอ ${es}/${engs.length} สาขา · สู้ ${ef} · ชวนได้ ${ec} สาขา · อยู่ในแก๊ง ${people} คน</div><div class="nb">${e.map(card).join('')}</div>` : ''}
          ${md.length ? `<div class="nb-head">น้องหมอพยาบาล — เจอ ${ms}/${meds.length} · สู้ ${mf} · ชวนได้ ${mc} · อยู่ในแก๊ง ${medPeople} คน</div><div class="nb">${md.map(card).join('')}</div>` : ''}`;
        box.querySelectorAll('.nb-arrow').forEach((a, i) => a.addEventListener('click', () => m.onKey(i ? 'right' : 'left')));
      };
      const m = { el: box, onKey: (k) => {
        if (k === 'left' || k === 'right') { f = (f + (k === 'right' ? 1 : FILTERS.length - 1)) % FILTERS.length; G.sfx('tick'); render(); box.scrollTop = 0; }
        else if (k === 'up' || k === 'down') box.scrollTop += k === 'down' ? 40 : -40;
        else if (k === 'ok' || k === 'back') { pop(m); resolve(); }
      } };
      render(); push(m);
    });
  };

  // ---------- สมุดเควสต์ ----------
  // สมุดเควสต์: เลือกเควสต์ที่จะทำตอนนี้ (ลูกศรชี้ตาม) หรือเปิดดูทั้งหมด
  G.ui.questLog = async function () {
    const S = G.state, Q = G.DATA.quests;
    for (;;) {
      const act = Q.filter((q) => G.questState(q) === 'active');
      const cur = (G.trackedQuest() || act.find((q) => q.kind === 'main') || {}).id;
      const items = act.map((q) => ({ label: `${q.id === cur ? '➤ ' : ''}${q.kind === 'main' ? '★ ' : ''}${q.name}`, sub: (G.DATA.world.maps[G.questTarget(q).map] || {}).name || '' }));
      items.push({ label: 'ดูเควสต์ทั้งหมด' });
      const i = await G.ui.choose(items, { title: 'เลือกเควสต์ที่จะทำ (ลูกศรสีทองชี้ตาม) · ★ = เนื้อเรื่องหลัก', cls: 'party',
        info: (k) => { const q = act[k]; if (!q) return 'ดูเควสต์ที่ทำเสร็จแล้วและที่ยังไม่ได้รับ'; return q.desc + (q.reward.length ? ` · รางวัล: ${q.reward.map(([a, v]) => (a === 'money' ? v + ' บาท' : G.DATA.items[a].name + ' ×' + v)).join(', ')}` : ''); } });
      if (i < 0) return;
      if (i >= act.length) { await questOverview(); continue; }
      S.trackQuest = act[i].kind === 'main' ? null : act[i].id; G.sfx('tick');
      G.showToast(`ติดตาม: ${act[i].name}`);
      return;
    }
  };
  const questOverview = function () {
    const Q = G.DATA.quests;
    const row = (q) => { const st = G.questState(q), mapName = st === 'active' ? (G.DATA.world.maps[G.questTarget(q).map] || {}).name : '';
      return `<div class="q-row q-${st}"><i>${st === 'done' ? '✓' : st === 'active' ? '▶' : '·'}</i><div><b>${esc(q.name)}</b>${st === 'active' ? `<small> · ${esc(mapName)}</small>` : ''}<br><small>${esc(q.desc)}</small>${q.reward.length && st !== 'done' ? `<br><small class="q-rw">รางวัล: ${q.reward.map(([k, v]) => (k === 'money' ? v + ' บาท' : G.DATA.items[k].name + ' ×' + v)).join(' · ')}</small>` : ''}</div></div>`; };
    const main = Q.filter((q) => q.kind === 'main' && G.questState(q) !== 'locked');
    const side = Q.filter((q) => q.kind === 'side' && G.questState(q) !== 'locked');
    const hidden = Q.filter((q) => q.kind === 'side' && G.questState(q) === 'locked').length;
    return G.ui.panel(`<div class="choice-title">สมุดเควสต์</div><div class="nb-head">เนื้อเรื่องหลัก</div>${main.map(row).join('')}
      <div class="nb-head">ช่วยชาวบ้าน</div>${side.map(row).join('') || '<small>ยังไม่ได้รับเควสต์ช่วยชาวบ้าน ลองคุยกับคนที่มีเครื่องหมาย ! เหนือหัว</small>'}
      ${hidden ? `<div class="hint">ยังมีเควสต์ช่วยชาวบ้านที่ยังไม่เจออีก ${hidden} อัน</div>` : ''}`, 'notebook');
  };

  // ---------- เดินทางเร็ว: นั่งสองแถว/เรือไปที่ที่เคยไปแล้ว (ต้องอยู่ข้างนอก) ----------
  const SPOTS = [['village', 'บ้านโนนสะอาด', 4, 11, 'down'], ['market', 'ตลาดนัดตำบล', 21, 8, 'down'], ['kku', 'มหาวิทยาลัยขอนแก่น', 5, 13, 'down'],
    ['phong', 'ริมลำน้ำพอง', 20, 11, 'down'], ['amphoe', 'ตัวอำเภอ (หน้าโรงพยาบาล)', 32, 8, 'down'],
    ['city', 'ตัวเมืองขอนแก่น (ป้ายสองแถว)', 7, 17, 'down']];
  G.travelSpots = () => SPOTS.filter(([m]) => (G.state.visited || {})[m]);
  G.ui.travel = async function () {
    const S = G.state;
    if (G.world.def.indoor) { await G.ui.say('ออกไปข้างนอกก่อน ลุงสองแถวรออยู่ริมถนน'); return; }
    const spots = G.travelSpots().filter(([m]) => m !== S.map);
    const i = await G.ui.choose(spots.map(([, n]) => n), { title: 'นั่งสองแถวลุงไปไหนดี? (ไปได้เฉพาะที่เคยไปแล้ว)', cls: 'small' });
    if (i < 0) return;
    const [m, n, x, y, dir] = spots[i];
    G.ui.closeAll(); G.sfx('door');
    await G.fadeTo(() => G.showToast(`นั่งสองแถวไป${n}...`));
    await G.wait(400);
    await G.fadeTo(() => G.loadMap(m, x, y, dir));
  };

  // ---------- เมนูหลัก ----------
  // ฟื้นทีมด่วน: ใช้ยาที่พอดีที่สุดให้คนเลือดน้อยก่อน (ไม่เปลืองยาแรงกับแผลเล็ก) แล้วแก้อาการผิดปกติ
  G.ui.quickHeal = async function () {
    const S = G.state, I = G.DATA.items, used = {};
    const use = (id) => { S.bag[id]--; used[id] = (used[id] || 0) + 1; };
    for (const m of S.party) if (m.hp > 0 && m.status) { const id = Object.keys(S.bag).find((k) => S.bag[k] > 0 && I[k] && I[k].kind === 'cure'); if (id) { use(id); m.status = null; } }
    for (let guard = 0; guard < 200; guard++) {
      const hurt = S.party.filter((m) => m.hp > 0 && m.hp < m.stats.hp).sort((a, b) => a.hp / a.stats.hp - b.hp / b.stats.hp)[0];
      if (!hurt) break;
      const need = hurt.stats.hp - hurt.hp, meds = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && I[k] && I[k].kind === 'heal').sort((a, b) => I[a].value - I[b].value);
      if (!meds.length) break;
      const id = meds.find((k) => I[k].value >= need) || meds[meds.length - 1];
      use(id); hurt.hp = Math.min(hurt.stats.hp, hurt.hp + I[id].value);
    }
    const list = Object.entries(used).map(([k, n]) => `${I[k].name} ×${n}`).join(', ');
    if (!list) { await G.ui.say('ไม่มียาหรือของกินที่ใช้ฟื้นได้เลย ลองแวะร้านค้าหรือพักที่บ้าน'); return; }
    G.sfx('heal');
    const left = S.party.filter((m) => m.hp > 0 && m.hp < m.stats.hp).length;
    await G.ui.say(`ใช้ ${list}${left ? ` · ยาหมด ยังมีอีก ${left} คนที่เลือดไม่เต็ม` : ' · ทุกคนพร้อมลุยแล้ว!'}`);
  };
  // ตารางธาตุ: แถว = ธาตุท่าที่ใช้ตี คอลัมน์ = ธาตุของฝ่ายที่โดน
  G.ui.typeChart = function () {
    const T = G.DATA.types, ch = G.DATA.chart;
    const head = T.map((t) => `<th>${G.ui.typeTag(t)}</th>`).join('');
    const rows = T.map((a) => `<tr><th>${G.ui.typeTag(a)}</th>${T.map((d) => { const v = ch[a][d]; return `<td class="tc-${v > 1 ? 'up' : v < 1 ? 'down' : 'eq'}">${v > 1 ? '×2' : v < 1 ? '×½' : '·'}</td>`; }).join('')}</tr>`).join('');
    const tips = T.map((a) => { const good = T.filter((d) => ch[a][d] > 1).map((d) => G.TYPE_TH[d]); return good.length ? `<li>${G.ui.typeTag(a)} แรงกับ ${good.join(' ')}</li>` : ''; }).join('');
    return G.ui.panel(`<div class="choice-title">ตารางธาตุ</div><div class="tchart-wrap"><table class="tchart"><tr><th class="corner">ท่า ↓ / โดน →</th>${head}</tr>${rows}</table><ul class="howto tchart-tips">${tips}<li>ท่าธาตุเดียวกับตัวเองแรงขึ้น ×1.5</li></ul></div>`, 'tchart-sheet');
  };
  let lastMain = '';
  // ---------- เมนูหลัก: ไทล์ไอคอน 3 คอลัมน์ + หัวสรุป (ชื่อ เงิน เวลาเล่น ตรา สมุด ที่อยู่) ----------
  const playTime = (ms) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  G.ui.mainMenu = async function () {
    const S = G.state, F = S.flags;
    const T = [];
    const add = (key, emoji, sub, badge) => T.push({ key, label: key, emoji, sub, badge });
    if (S.party.length) add('ทีม', '👥', `${S.party.length}/6`);
    add('กระเป๋า', '🎒', '', G.ui.newItemCount() ? 'ใหม่' : '');
    if (S.party.some((m) => m.hp > 0 && (m.hp < m.stats.hp || m.status))) add('ฟื้นทีมด่วน', '💊', 'ใช้ยาที่คุ้ม');
    if (F.starter_chosen) { const ks = Object.keys(G.DATA.species); add('สมุดบันทึก', '📖', `${ks.filter((k) => S.dex[k] === 2).length}/${ks.length}`); }
    if (F.intro_done) add('สมุดเควสต์', '📜', '');
    if (F.intro_done && G.ui.codex) add('สมุดเรื่องเล่า', '📚', '');
    if (G.travelSpots().length > 1) add('เดินทาง', '🚌', '');
    if (G.ui.achievements) add('ความสำเร็จ', '🏆', G.ui.achCount ? G.ui.achCount() : '');
    add('ตารางธาตุ', '⚖️', ''); add('วิธีเล่น', '❓', ''); add('มีอะไรใหม่', '📰', ''); add('บันทึกเกม', '💾', `ช่อง ${G.slot}`); add('ตั้งค่า', '⚙️', ''); add('ปิด', '✖️', '');
    const where = (G.world.def && G.world.def.name) || '';
    const header = `<div class="mm-head"><canvas width="16" height="16" data-sprite="${esc(S.look || 'player')}"></canvas><div><b>${esc(S.name)}</b><small>📍 ${esc(where)}</small></div>
      <div class="mm-stats"><span>💰 ${S.money} บาท</span><span>⏱ ${playTime(S.playMs || 0)}</span><span class="mm-badges">${BADGES.slice(0, 3).map(([f, n]) => `<canvas width="16" height="16" class="${F[f + '_done'] ? '' : 'off'}" title="${esc(n)}" data-sprite="badge:${f}"></canvas>`).join('')}</span></div></div>`;
    const i = await G.ui.choose(T, { cls: 'mainmenu', cols: 3, header, start: Math.max(0, T.findIndex((t) => t.key === lastMain)) });
    const pick = T[i] && T[i].key; if (pick && pick !== 'ปิด') lastMain = pick;
    if (pick === 'ทีม') await G.ui.partyMenu();
    else if (pick === 'กระเป๋า') await G.ui.bagMenu();
    else if (pick === 'ฟื้นทีมด่วน') await G.ui.quickHeal();
    else if (pick === 'สมุดบันทึก') await G.ui.notebook();
    else if (pick === 'สมุดเควสต์') await G.ui.questLog();
    else if (pick === 'เดินทาง') await G.ui.travel();
    else if (pick === 'ความสำเร็จ') await G.ui.achievements();
    else if (pick === 'สมุดเรื่องเล่า') await G.ui.codex();
    else if (pick === 'ตารางธาตุ') await G.ui.typeChart();
    else if (pick === 'วิธีเล่น') await G.ui.panel(G.HOWTO, 'tip-sheet');
    else if (pick === 'มีอะไรใหม่') await G.ui.whatsNew();
    else if (pick === 'บันทึกเกม') { if (await G.ui.saveMenu()) { G.sfx('buy'); await G.ui.say(`บันทึกเกมลงช่อง ${G.slot} แล้ว`); } }
    else if (pick === 'ตั้งค่า') await G.ui.settings();
  };

  // ---------- ตั้งค่า: แบ่งหมวด (← → เปลี่ยนหมวด) ----------
  const on = (b) => (b ? 'เปิด' : 'ปิด');
  const vol = (v) => ((v ?? 100) + 75) % 125;   // 100 → 75 → 50 → 25 → 0 → 100
  const SETTINGS = [
    ['เสียง', () => `เพลง: ${on(G.settings.music)}`, '', () => { G.settings.music = !G.settings.music; G.restartMusic(); }],
    ['เสียง', () => `ระดับเพลง: ${G.settings.volMusic ?? 100}%`, 'กดเพื่อปรับ 100 → 75 → 50 → 25 → 0', () => { G.settings.volMusic = vol(G.settings.volMusic); G.setVolume(); }],
    ['เสียง', () => `เสียงเอฟเฟกต์: ${on(G.settings.sound)}`, '', () => { G.settings.sound = !G.settings.sound; G.restartMusic(); }],
    ['เสียง', () => `ระดับเสียงประกอบ: ${G.settings.volSfx ?? 100}%`, 'กดเพื่อปรับ 100 → 75 → 50 → 25 → 0', () => { G.settings.volSfx = vol(G.settings.volSfx); G.setVolume(); G.sfx('buy'); }],
    ['เสียง', () => `เสียงบรรยากาศ: ${on(G.settings.ambient !== false)}`, 'จิ้งหรีดกับกบตอนกลางคืน นกตอนเช้า ลมในทุ่งนา และเสียงฝน', () => { G.settings.ambient = G.settings.ambient === false; }],
    ['หน้าจอ', () => `ความเร็วข้อความ: ${['ช้า', 'กลาง', 'เร็ว'][G.settings.textSpeed - 1]}`, '', () => { G.settings.textSpeed = (G.settings.textSpeed % 3) + 1; }],
    ['หน้าจอ', () => `ขนาดตัวอักษร: ${['ปกติ', 'ใหญ่', 'ใหญ่มาก'][G.settings.textSize || 0]}`, 'ขยายตัวหนังสือในกล่องข้อความและเมนู', () => { G.settings.textSize = ((G.settings.textSize || 0) + 1) % 3; G.applyTextSize(); }],
    ['หน้าจอ', () => `สีคำสำคัญในข้อความ: ${on(G.settings.colorText !== false)}`, 'ชื่อตัวละคร = ฟ้า · ท่า = ส้ม · ไอเท็ม = เหลือง · เงิน = เขียวอ่อน · ได้ผลดีมาก/ฟื้นพลัง = เขียว · หมดแรง/ลดลง = แดง · ไม่ค่อยได้ผล = เทา · ธาตุ ตามสีธาตุ · อาการผิดปกติแยกสี', () => { G.settings.colorText = G.settings.colorText === false; }],
    ['หน้าจอ', () => `ไกด์และลูกศรชี้ทาง: ${on(G.settings.guide)}`, '', () => { G.settings.guide = !G.settings.guide; }],
    ['หน้าจอ', () => `แถบทีมและมินิแมพ: ${on(G.settings.hud !== false)}`, '', () => { G.settings.hud = G.settings.hud === false; }],
    ['หน้าจอ', () => `ลดการสั่นจอและแฟลช: ${on(G.settings.calm)}`, 'สำหรับคนที่ตาล้าง่าย: ตอนตีโดนสั่นน้อยลง และไม่กะพริบจอตอนเข้าต่อสู้', () => { G.settings.calm = !G.settings.calm; }],
    ['หน้าจอ', () => `โหมดสีสำหรับคนตาบอดสี: ${on(G.settings.cbMode)}`, 'เพิ่มลายบนหลอดพลังและป้ายธาตุ เปลี่ยนแดง/เขียวเป็นส้ม/ฟ้า', () => { G.settings.cbMode = !G.settings.cbMode; G.applyTextSize(); }],
    ['การเล่น', () => `เก็บเวลเร็ว + ติดคริง่าย: ${on(G.settings.easy !== false)}`, 'เปิด: EXP ×3 แบ่งให้ทั้งแก๊ง และฝั่งเราติดคริ 25%', () => { G.settings.easy = G.settings.easy === false; }],
    ['การเล่น', () => `ความเร็วการต่อสู้: ${G.settings.fast ? '×2 เร็ว' : 'ปกติ'}`, '×2: ข้อความและท่าทางในการต่อสู้เร็วขึ้นเท่าตัว เก็บเลเวลได้ไวขึ้น', () => { G.settings.fast = !G.settings.fast; }],
    ['การเล่น', () => `วิ่งตลอด (กด X ค้างเพื่อเดินช้า): ${on(G.settings.autoRun !== false)}`, 'เปิด: เดินเร็วเป็นค่าเริ่มต้น กด X ค้างไว้ถ้าอยากเดินช้าๆ', () => { G.settings.autoRun = G.settings.autoRun === false; }],
    ['การเล่น', () => `ไล่ผีอ่อนแบบรวบรัด: ${on(G.settings.quickWild !== false)}`, 'ผีป่าที่อ่อนกว่าแก๊งมาก (ห่าง 8 เลเวล) และเคยชวนแล้ว จะถามว่าจะไล่ไปเลยไหม ได้ EXP ไม่ต้องเข้าฉากสู้', () => { G.settings.quickWild = G.settings.quickWild === false; }],
    ['การเล่น', () => `ข้ามบทที่เคยอ่าน (ปุ่ม X): ${on(G.settings.skipRead !== false)}`, 'บทที่เคยอ่านแล้วจะมีป้าย "X ข้าม" กด X แล้วข้ามรวดจนถึงบทใหม่หรือตัวเลือก', () => { G.settings.skipRead = G.settings.skipRead === false; }],
    ['เซฟ', () => `บันทึกอัตโนมัติ: ${on(G.settings.autosave !== false)}`, () => `บันทึกลงช่อง ${G.slot} เองหลังเหตุการณ์ การต่อสู้ เปลี่ยนแผนที่ และทุก 1 นาที`, () => { G.settings.autosave = G.settings.autosave === false; }],
    ['เซฟ', () => 'สำรองเซฟเป็นไฟล์', 'ดาวน์โหลดเซฟทุกช่องเก็บไว้ในเครื่อง', () => G.exportSave()],
    ['เซฟ', () => 'ใส่รหัสลับ', '', () => G.ui.secretCode()],
  ];
  const CATS = ['เสียง', 'หน้าจอ', 'การเล่น', 'เซฟ'];
  let lastCat = 0;
  G.ui.settings = async function () {
    for (;;) {
      const rows = SETTINGS.filter((r) => r[0] === CATS[lastCat]);
      const header = `<div class="set-tabs">${CATS.map((c, i) => `<span class="${i === lastCat ? 'on' : ''}">${c}</span>`).join('')}</div>`;
      const k = await G.ui.choose(rows.map((r) => r[1]()), { cls: 'small settings', header, onSide: true, remember: 'set' + lastCat,
        info: (j) => { const t = rows[j] && rows[j][2]; return typeof t === 'function' ? t() : t || ''; } });
      if (k === -2 || k === -3) { lastCat = (lastCat + (k === -2 ? CATS.length - 1 : 1)) % CATS.length; G.sfx('tick'); continue; }
      if (k < 0) break;
      await rows[k][3](); G.saveSettings();
    }
    G.saveSettings();
  };

  // ---------- รหัสลับ ----------
  // ตั้งเลเวลสมาชิกใหม่ (ได้ท่าตามเลเวล ฟื้นพลังเต็ม)
  const setLevel = (m, lv) => {
    m.lv = lv; m.exp = G.expFor(lv); G.refreshStats(m); m.hp = m.stats.hp; m.status = null;
    m.moves = G.movesAt(m.sp, lv).map((id) => ({ id, pp: G.DATA.moves[id].pp }));
  };
  const CODES = {
    BEE50: async () => {
      const S = G.state;
      let m = [...S.party, ...S.storage].find((x) => x.sp === 'bee');
      if (!m) { m = G.makeMon('bee', 50); if (S.party.length < 6) S.party.push(m); else S.storage.push(m); }
      setLevel(m, 50);
      G.sfx('level'); await G.ui.say(`${m.name} กลายเป็น Lv 50 แล้ว! (ชุดตำนานหมู่บ้าน)`);
    },
  };
  G.ui.secretCode = async function () {
    const code = await G.askText('ใส่รหัสลับ', '', 16);
    if (!code) return;
    const fn = CODES[code.trim().toUpperCase().replace(/\s+/g, '')];
    if (!fn) { G.sfx('bump'); await G.ui.say('รหัสไม่ถูกต้อง'); return; }
    await fn();
    if (await G.ui.confirm('บันทึกเกมเลยไหม?')) { if (await G.ui.saveMenu()) await G.ui.say(`บันทึกลงช่อง ${G.slot} แล้ว`); }
  };

  // วาดสไปรต์ลง canvas เล็กในหน้าต่าง
  const obs = new MutationObserver(() => {
    document.querySelectorAll('canvas[data-sprite]').forEach((c) => {
      if (c.dataset.done) return; c.dataset.done = 1;
      if (!c.dataset.sprite) return;
      c.getContext('2d').drawImage(G.sprite(c.dataset.sprite), 0, 0);
    });
  });
  window.addEventListener('DOMContentLoaded', () => obs.observe($('#ui'), { childList: true, subtree: true }));
})(window.G = window.G || {});
