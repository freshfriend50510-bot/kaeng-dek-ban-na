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
  G.ui.skipping = false;
  G.ui.say = function (text, name, opt = {}) {
    let mood = opt.mood;
    const tag = /^\{(happy|angry|shock|sad|normal)\}\s*/.exec(text);
    if (tag) { mood = tag[1]; text = text.slice(tag[0].length); }
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
      const complete = () => { clearInterval(tick); n = chars.length; body.textContent = text; done = true; box.classList.add('done'); if (track) markSeen(key); if (auto) setTimeout(finish, auto); };
      const tick = setInterval(() => {
        n += speed; body.textContent = chars.slice(0, n).join('');
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
  G.ui.choose = function (options, opt = {}) {
    G.ui.skipping = false;   // ถึงตัวเลือกแล้ว หยุดข้ามบท
    return new Promise((resolve) => {
      const box = el('div', 'panel choice ' + (opt.cls || ''));
      if (opt.title) box.appendChild(el('div', 'choice-title', esc(opt.title)));
      const items = options.map((o) => (typeof o === 'string' ? { label: o } : o));
      const list = el('div', 'choice-list' + (opt.grid ? ' grid' : ''));
      const rows = items.map((it, i) => {
        const r = el('div', 'choice-item' + (it.disabled ? ' disabled' : ''));
        r.innerHTML = `${it.icon ? `<canvas width="16" height="16" class="ico" data-sprite="${esc(it.icon)}"></canvas>` : ''}<span class="lbl">${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}`;
        r.addEventListener('click', () => { sel = i; draw(); pick(); });
        list.appendChild(r); return r;
      });
      box.appendChild(list);
      const info = el('div', 'choice-info'); if (opt.info) box.appendChild(info);
      let sel = Math.max(0, opt.start || 0);
      const draw = () => {
        rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
        if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' });
        if (opt.info) info.textContent = opt.info(sel) || '';
      };
      const pick = () => { if (items[sel].disabled) { G.sfx('bump'); return; } G.sfx('tick'); pop(m); resolve(sel); };
      const cols = opt.grid ? 2 : 1;
      const m = { el: box, onKey: (k) => {
        if (k === 'up') sel = (sel - cols + items.length) % items.length;
        else if (k === 'down') sel = (sel + cols) % items.length;
        else if (k === 'left' && cols > 1) sel = sel % 2 ? sel - 1 : sel;
        else if (k === 'right' && cols > 1) sel = sel % 2 ? sel : Math.min(items.length - 1, sel + 1);
        else if (k === 'ok') return pick();
        else if (k === 'back' && opt.cancel !== false) { G.sfx('tick'); pop(m); resolve(-1); return; }
        draw();
      } };
      push(m); draw();
    });
  };
  G.ui.confirm = async (q, name) => { await G.ui.say(q, name, { auto: 1 }); return (await G.ui.choose(['ใช่', 'ไม่'], { cls: 'yesno' })) === 0; };

  // ---------- หน้าต่างแสดงข้อมูล (ปิดด้วยปุ่มใดก็ได้) ----------
  G.ui.panel = function (html, cls) {
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet ' + (cls || ''), html);
      const m = { el: box, onKey: (k) => { if (k === 'ok' || k === 'back') { pop(m); resolve(); } } };
      push(m);
    });
  };

  // ---------- หลอด HP ----------
  G.ui.hpBar = (hp, max) => {
    const p = Math.max(0, hp / max);
    return `<div class="hpbar"><i style="width:${(p * 100).toFixed(1)}%" class="${p < 0.2 ? 'red' : p < 0.5 ? 'yellow' : ''}"></i></div>`;
  };
  const STATUS = { par: 'ชา', slp: 'หลับ', psn: 'ท้องเสีย' };
  G.ui.statusTag = (s) => (s ? `<span class="tag st-${s}">${STATUS[s]}</span>` : '');
  const TYPE_TH = { normal: 'ปกติ', water: 'น้ำ', earth: 'ดิน', electric: 'สายฟ้า', wind: 'ลม' };
  G.ui.typeTag = (t) => `<span class="tag ty-${t}"><canvas class="ty-ico" width="16" height="16" data-sprite="type:${t}"></canvas>${TYPE_TH[t]}</span>`;
  G.TYPE_TH = TYPE_TH;

  // ---------- เมนูทีม ----------
  const KIND_TH = { kid: 'เด็กบ้านนา', ghost: 'ผีสาง', eng: 'น้องวิศวะ', med: 'น้องหมอพยาบาล', boss: 'บอส', master: 'หัวโจก' };
  const monRow = (m, extra) => ({ icon: G.monLook(m), label: `${m.name}  Lv${m.lv}`,
    sub: `${m.hp}/${m.stats.hp}${m.status ? ' · ' + STATUS[m.status] : ''}${m.held ? ' · ถือ' + G.DATA.items[m.held].name : ''}${extra || ''}` });
  // หน้าทีม: การ์ด 2 คอลัมน์ รูป เลเวล ธาตุ หลอด HP/EXP สถานะ ของถือ คืน index หรือ -1
  const AB_SHORT = { rage: 'บ้าพลัง', analyze: 'วิเคราะห์', eater: 'อิ่มแล้วสู้', quick: 'ดีดเปิดเกม' };
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
          <div class="tc-body"><div class="tc-top"><b>${esc(m.name)}</b><span class="lv">Lv${m.lv}</span></div>
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
        info.textContent = `${sp.ability ? 'ความสามารถ: ' + AB_SHORT[sp.ability] + ' · ' : ''}โจมตี ${m.stats.atk} · ป้องกัน ${m.stats.def} · พิเศษ ${m.stats.spa} · ความเร็ว ${m.stats.spe} · EXP อีก ${G.expFor(m.lv + 1) - m.exp}`;
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

  G.ui.monInfo = function (m) {
    const sp = G.DATA.species[m.sp];
    const AB = { rage: 'บ้าพลัง — HP ต่ำกว่า 1/3 ท่าธาตุดินแรง ×1.5', analyze: 'วิเคราะห์ — ลงมือทีหลังศัตรู ท่าแรง ×1.3',
      eater: 'อิ่มแล้วสู้ — ฟื้น HP 1/16 ทุกท้ายเทิร์น', quick: 'ดีดเปิดเกม — เทิร์นแรกลงมือก่อนเสมอ' };
    const moves = m.moves.map((s) => { const mv = G.DATA.moves[s.id];
      return `<tr><td>${esc(mv.name)}</td><td>${G.ui.typeTag(mv.type)}</td><td>${mv.power || '—'}</td><td>${s.pp}/${mv.pp}</td></tr>`; }).join('');
    const st = m.stats;
    return G.ui.panel(`
      <div class="info-head"><canvas class="info-sprite" width="16" height="16" data-sprite="${G.monLook(m)}"></canvas>
        <div><b>${esc(m.name)}</b> Lv${m.lv} ${G.ui.typeTag(sp.type)} ${G.ui.statusTag(m.status)} <small>${KIND_TH[sp.kind] || ''}${m.name !== sp.name && sp.kind !== 'eng' && sp.kind !== 'med' ? ' · ' + esc(sp.name) : ''}</small><br>
        <small>${esc(sp.desc)}</small>${sp.ability ? `<br><small>ความสามารถ: ${esc(AB[sp.ability])}</small>` : ''}${m.held ? `<br><small>ถือ: ${esc(G.DATA.items[m.held].name)}</small>` : ''}</div></div>
      <div class="stats">HP ${m.hp}/${st.hp} · โจมตี ${st.atk} · ป้องกัน ${st.def} · พิเศษ ${st.spa} · ป้องกันพิเศษ ${st.spd} · ความเร็ว ${st.spe}</div>
      <table class="moves"><tr><th>ท่า</th><th>ธาตุ</th><th>พลัง</th><th>PP</th></tr>${moves}</table>`, 'mon-info');
  };

  // ---------- กระเป๋า ----------
  let lastTab = null;
  const BAG_TABS = [['ยา', ['heal', 'healall', 'cure']], ['เพิ่มเลเวล', ['exp', 'lvup']], ['ของกินชวน', ['recruit', 'repel']], ['ของถือ', ['held']], ['ของสำคัญ', ['tm', 'key', 'kit']]];
  const SOURCE = { tm_wind_blade: 'รางวัลชนะยิม 1 พี่ออสซี่', tm_short_circuit: 'รางวัลชนะยิม 2 พี่เฟรนด์', tm_mud_therapy: 'รางวัลชนะยิม 3 พี่บูม', first_aid: 'พี่บูมให้หลังกลับใจ', rod: 'ลุงเปลี่ยนให้เป็นค่าหาไส้เดือน', porridge: 'ซื้อจากตลาดเช้าตัวอำเภอ', yantra: 'หลวงตามอบให้หลังฝนตก', goggles: 'พ่อแอมให้ (แว่นสมัยเรียนวิศวะ)' };
  const BADGES = [['gym1', 'ตราผ้าโพก', 'พี่ออสซี่ · ร้านราเมงลมทุ่ง', 'เปิดทางรถสองแถวไป มข.'], ['gym2', 'ตราเฟือง', 'พี่เฟรนด์ · โรงช็อปวิศวะ มข.', 'เปิดสะพานข้ามลำน้ำพอง'],
    ['gym3', 'ตราหูฟัง', 'พี่บูม · คลินิกหลังโรงพยาบาลอำเภอ', 'เฒ่าจ้ำอนุญาตให้เข้าดอนปู่ตา'], ['gym4', 'ตราไม้เรียว', 'พี่ต้นน้ำ · ห้องสมุดโรงเรียนมัธยม', '—']];
  G.BADGES = BADGES;
  // หน้ากระเป๋า: แท็บตามหมวด รายการพร้อมไอคอน และรายละเอียดด้านขวา (แท็บตรายิมดูอย่างเดียว) คืน id ไอเท็มหรือ null
  G.ui.bagScreen = function (opt = {}) {
    const S = G.state, I = G.DATA.items;
    return new Promise((resolve) => {
      const tabs = BAG_TABS.map(([name, kinds]) => [name, Object.keys(S.bag).filter((k) => S.bag[k] > 0 && I[k] && kinds.includes(I[k].kind) && (!opt.filter || opt.filter(I[k])))])
        .filter(([, ids]) => ids.length || !opt.filter);
      if (!opt.filter) tabs.push(['ตรายิม', null]);
      let t = Math.max(0, Math.min(tabs.length - 1, opt.tab != null ? opt.tab : tabs.findIndex(([, ids]) => ids && ids.length))), sel = 0;
      const box = el('div', 'panel sheet bag-sheet');
      const render = () => {
        const [, ids] = tabs[t];
        const head = `<div class="bag-tabs">${tabs.map(([n, l], i) => `<span class="${i === t ? 'on' : ''}" data-t="${i}">${n}${l ? ` <small>${l.length}</small>` : ''}</span>`).join('')}</div>`;
        let list, detail;
        if (!ids) {   // ตรายิม
          const b = BADGES[sel];
          list = BADGES.map(([f, n], i) => `<div class="bag-item ${i === sel ? 'sel' : ''} ${S.flags[f + '_done'] ? '' : 'locked'}" data-i="${i}"><canvas width="16" height="16" data-sprite="badge:${f}"></canvas><span>${S.flags[f + '_done'] ? n : '???'}</span></div>`).join('');
          detail = S.flags[b[0] + '_done'] ? `<canvas class="bag-big" width="16" height="16" data-sprite="badge:${b[0]}"></canvas><b>${b[1]}</b><p>ได้จาก ${b[2]}</p><p class="bag-src">ผล: ${b[3]}</p>`
            : `<canvas class="bag-big locked" width="16" height="16" data-sprite="badge:${b[0]}"></canvas><b>ยังไม่ได้</b><p>ชนะ ${b[2].split(' · ')[0]} เพื่อรับตรานี้</p>`;
        } else if (!ids.length) { list = '<div class="bag-empty">ยังไม่มีของในหมวดนี้</div>'; detail = ''; }
        else {
          const id = ids[sel], it = I[id];
          list = ids.map((k, i) => `<div class="bag-item ${i === sel ? 'sel' : ''}" data-i="${i}"><canvas width="16" height="16" data-sprite="item:${k}"></canvas><span>${esc(I[k].name)}</span><em>${I[k].kind === 'tm' ? '' : '×' + S.bag[k]}</em></div>`).join('');
          detail = `<canvas class="bag-big" width="16" height="16" data-sprite="item:${id}"></canvas><b>${esc(it.name)}</b>${it.kind === 'tm' ? '' : `<span class="bag-count">มี ${S.bag[id]} ชิ้น</span>`}<p>${esc(it.desc)}</p>${SOURCE[id] ? `<p class="bag-src">${SOURCE[id]}</p>` : ''}${it.price && it.kind !== 'tm' && it.kind !== 'held' ? `<p class="bag-src">ราคาร้าน ${it.price} บาท</p>` : ''}`;
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
      else if (it.kind === 'kit') {   // กระเป๋าปฐมพยาบาล: วันละครั้ง (นับวันจากเวลาเล่นในเกม)
        const day = Math.floor((S.playMs || 0) / (1440 * 1000));
        if (S.kitDay === day) { await G.ui.say('วันนี้ใช้กระเป๋าปฐมพยาบาลไปแล้ว พรุ่งนี้ค่อยใช้ใหม่นะ'); continue; }
        if (S.party.every((m) => m.hp >= m.stats.hp && !m.status)) { await G.ui.say('ทุกคนแข็งแรงดีอยู่แล้ว'); continue; }
        S.party.forEach((m) => { m.hp = m.stats.hp; m.status = null; }); S.kitDay = day;
        G.sfx('heal'); await G.ui.say('เปิดกระเป๋าปฐมพยาบาลของพี่บูม ทำแผลให้ทุกคน ฟื้นพลังเต็ม!');
      } else if (it.kind === 'key') await G.ui.say(it.desc);
      else await G.ui.say(`${it.name}ใช้ได้ตอนต่อสู้เท่านั้น`);
    }
  };
  // ---------- EXP นอกการต่อสู้ (ของกินเพิ่มเลเวล) ----------
  G.ui.giveExp = async function (m, amount) {
    const sp = G.DATA.species[m.sp], before = m.lv, stage = G.growthStage(m.lv), learned = [];
    m.exp += Math.max(0, Math.floor(amount));
    while (m.lv < 100 && m.exp >= G.expFor(m.lv + 1)) {
      m.lv++; G.refreshStats(m);
      for (const [lv, mid] of sp.learnset) if (lv === m.lv && !m.moves.some((x) => x.id === mid)) learned.push(mid);
    }
    if (m.lv === before) { await G.ui.say(`${m.name} ได้รับประสบการณ์ ${Math.floor(amount)} (อีก ${G.expFor(m.lv + 1) - m.exp} ถึงเลเวลถัดไป)`); return; }
    G.sfx('level'); await G.ui.say(`${m.name} เลเวลอัปเป็น ${m.lv}!`);
    if (sp.kind === 'kid' && G.growthStage(m.lv) > stage) await G.ui.say(`${m.name} เติบโตขึ้นเป็นขั้นที่ ${G.growthStage(m.lv)}!`);
    for (const mid of learned) await G.ui.learnMove(m, mid);
  };
  // เรียนท่าใหม่นอกการต่อสู้: ท่าเต็ม 4 ให้เลือกลืมท่าเก่า (หรือไม่เรียน) คืน true ถ้าได้เรียน
  G.ui.learnMove = async function (m, mid) {
    const mv = G.DATA.moves[mid];
    if (m.moves.some((x) => x.id === mid)) { await G.ui.say(`${m.name} ใช้ท่า ${mv.name} อยู่แล้ว`); return false; }
    if (m.moves.length < 4) { m.moves.push({ id: mid, pp: mv.pp }); G.sfx('level'); await G.ui.say(`${m.name} เรียนท่า ${mv.name} ได้แล้ว!`); return true; }
    await G.ui.say(`${m.name} อยากเรียนท่า ${mv.name} แต่จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, { auto: 1 });
    const k = await G.ui.choose(m.moves.map((x) => G.DATA.moves[x.id].name).concat([`ไม่เรียน ${mv.name}`]), { cls: 'small', info: (j) => (m.moves[j] ? G.DATA.moves[m.moves[j].id].desc : '') });
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
  const moveInfo = (id) => { const mv = G.DATA.moves[id]; return `${G.TYPE_TH[mv.type]} · ${mv.cat === 'status' ? 'ท่าสถานะ' : 'พลัง ' + mv.power} · ${mv.desc}`; };
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
      await G.ui.say(`${m.name} จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, { auto: 1 });
      const k = await G.ui.choose(m.moves.map((s2) => G.DATA.moves[s2.id].name).concat(['ไม่เรียน']), { cls: 'small' });
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
      const i = await G.ui.choose(stock.map((k) => ({ label: I[k].name, sub: I[k].price + ' บาท' })),
        { title: `เงิน ${S.money} บาท`, cls: 'bag', info: (k) => I[stock[k]] && I[stock[k]].desc });
      if (i < 0) return;
      const it = I[stock[i]];
      const qtys = [1, 5, 10].filter((q) => q * it.price <= S.money);
      if (!qtys.length) { await G.ui.say('เงินไม่พอจ้า', keeper); continue; }
      const q = await G.ui.choose(qtys.map((n) => ({ label: `${n} ชิ้น`, sub: n * it.price + ' บาท' })), { cls: 'small' });
      if (q < 0) continue;
      S.money -= qtys[q] * it.price; S.bag[stock[i]] = (S.bag[stock[i]] || 0) + qtys[q];
      G.sfx('buy'); await G.ui.say(`ได้${it.name} ${qtys[q]} ชิ้น ขอบใจหลาย!`, keeper);
    }
  };

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
      return `<div class="nb-row st${st}"><canvas width="16" height="16" data-sprite="${st ? sp[k].look : ''}"></canvas>
        <div><b>${st ? esc(sp[k].name) : '???'}</b> ${st >= 2 ? G.ui.typeTag(sp[k].type) : ''}<br>${tags}<br><small>${desc}</small></div></div>`;
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
  G.ui.questLog = function () {
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
  G.ui.mainMenu = async function () {
    const S = G.state;
    const items = [];
    if (S.party.length) items.push('ทีม');
    items.push('กระเป๋า');
    if (S.flags.starter_chosen) items.push('สมุดบันทึก');
    if (S.flags.intro_done) items.push('สมุดเควสต์');
    if (G.travelSpots().length > 1) items.push('เดินทาง');
    items.push('ตรา', 'วิธีเล่น', 'บันทึกเกม', 'ตั้งค่า', 'ปิด');
    const i = await G.ui.choose(items, { cls: 'mainmenu', title: `${S.name} · ${S.money} บาท` });
    const pick = items[i];
    if (pick === 'ทีม') await G.ui.partyMenu();
    else if (pick === 'กระเป๋า') await G.ui.bagMenu();
    else if (pick === 'สมุดบันทึก') await G.ui.notebook();
    else if (pick === 'สมุดเควสต์') await G.ui.questLog();
    else if (pick === 'เดินทาง') await G.ui.travel();
    else if (pick === 'ตรา') await G.ui.panel(`<div class="choice-title">ตรายิม</div><div class="badges">${
      [['gym1', 'ผ้าโพก'], ['gym2', 'เฟือง'], ['gym3', 'หูฟัง'], ['gym4', 'ไม้เรียว']].map(([f, n]) =>
        `<div class="badge ${S.flags[f + '_done'] ? 'on' : ''}"><canvas width="16" height="16" data-sprite="badge:${f}"></canvas>ตรา${n}</div>`).join('')}</div>`);
    else if (pick === 'วิธีเล่น') await G.ui.panel(G.HOWTO, 'tip-sheet');
    else if (pick === 'บันทึกเกม') { if (await G.ui.saveMenu()) { G.sfx('buy'); await G.ui.say(`บันทึกเกมลงช่อง ${G.slot} แล้ว`); } }
    else if (pick === 'ตั้งค่า') {
      const on = (b) => (b ? 'เปิด' : 'ปิด');
      const s = await G.ui.choose([`ความเร็วข้อความ: ${['ช้า', 'กลาง', 'เร็ว'][G.settings.textSpeed - 1]}`, `เพลง: ${on(G.settings.music)}`,
        `เสียงเอฟเฟกต์: ${on(G.settings.sound)}`, `ไกด์และลูกศรชี้ทาง: ${on(G.settings.guide)}`, `แถบทีมและมินิแมพ: ${on(G.settings.hud !== false)}`, `เก็บเวลเร็ว + ติดคริง่าย: ${on(G.settings.easy !== false)}`, 'สำรองเซฟเป็นไฟล์', 'ใส่รหัสลับ', `บันทึกอัตโนมัติ: ${on(G.settings.autosave !== false)}`,
        `เสียงบรรยากาศ: ${on(G.settings.ambient !== false)}`, `ลดการสั่นจอและแฟลช: ${on(G.settings.calm)}`, `ข้ามบทที่เคยอ่าน (ปุ่ม X): ${on(G.settings.skipRead !== false)}`, `ความเร็วการต่อสู้: ${G.settings.fast ? '×2 เร็ว' : 'ปกติ'}`], { cls: 'small',
        info: (k) => ({ 5: 'เปิด: EXP ×3 แบ่งให้ทั้งแก๊ง และฝั่งเราติดคริ 25%', 8: `บันทึกลงช่อง ${G.slot} เองหลังเหตุการณ์ การต่อสู้ เปลี่ยนแผนที่ และทุก 1 นาที`,
          9: 'จิ้งหรีดกับกบตอนกลางคืน นกตอนเช้า ลมในทุ่งนา และเสียงฝน', 10: 'สำหรับคนที่ตาล้าง่าย: ตอนตีโดนสั่นน้อยลง และไม่กะพริบจอตอนเข้าต่อสู้',
          11: 'บทที่เคยอ่านแล้วจะมีป้าย "X ข้าม" กด X แล้วข้ามรวดจนถึงบทใหม่หรือตัวเลือก', 12: '×2: ข้อความและท่าทางในการต่อสู้เร็วขึ้นเท่าตัว เก็บเลเวลได้ไวขึ้น' }[k] || '') });
      if (s === 0) G.settings.textSpeed = (G.settings.textSpeed % 3) + 1;
      if (s === 1) { G.settings.music = !G.settings.music; G.restartMusic(); }
      if (s === 2) { G.settings.sound = !G.settings.sound; G.restartMusic(); }
      if (s === 3) G.settings.guide = !G.settings.guide;
      if (s === 4) G.settings.hud = G.settings.hud === false;
      if (s === 5) G.settings.easy = G.settings.easy === false;
      if (s === 6) await G.exportSave();
      if (s === 7) await G.ui.secretCode();
      if (s === 8) G.settings.autosave = G.settings.autosave === false;
      if (s === 9) G.settings.ambient = G.settings.ambient === false;
      if (s === 10) G.settings.calm = !G.settings.calm;
      if (s === 11) G.settings.skipRead = G.settings.skipRead === false;
      if (s === 12) G.settings.fast = !G.settings.fast;
      G.saveSettings();
    }
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
