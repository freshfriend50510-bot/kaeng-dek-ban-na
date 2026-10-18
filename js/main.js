// จุดเริ่มเกม: game loop, ปุ่มกด, เซฟ/โหลด, ฉากเปลี่ยน
(function (G) {
  'use strict';
  const SAVE_KEY = 'kaengdekbanna_save', SAVE_VER = 1;
  G.DATA = window.GAME_DATA;
  G.settings = { textSpeed: 2, sound: true, music: true, guide: true, hud: true, easy: true };
  try { Object.assign(G.settings, JSON.parse(localStorage.getItem(SAVE_KEY + '_settings') || '{}')); } catch (e) { /* ไม่มีที่เก็บ */ }
  G.saveSettings = () => { try { localStorage.setItem(SAVE_KEY + '_settings', JSON.stringify(G.settings)); } catch (e) { /* */ } };
  G.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  G.scene = 'title';

  function newState() {
    const st = G.DATA.world.start;
    return { v: SAVE_VER, id: Date.now().toString(36), name: 'หัวหน้า', map: st.map, x: st.x, y: st.y, dir: st.dir, flags: {}, party: [], storage: [],
      bag: {}, money: 300, time: 7 * 60, steps: 0, repel: 0, dex: {}, npcPos: {}, follower: false, starter: null, playMs: 0 };
  }
  // เซฟ 3 ช่อง: เซฟแบบเก่า (คีย์อื่นในเครื่อง) จะถูกคัดลอกเข้าช่องว่างให้อัตโนมัติ โดยไม่ลบของเดิมทิ้ง
  const slotKey = (n) => `${SAVE_KEY}_${n}`;
  G.slot = 1;
  function adoptOldSaves() {
    try {
      const slots = [1, 2, 3].map((n) => localStorage.getItem(slotKey(n)));
      const known = new Set(slots.filter(Boolean).map((t) => { try { return JSON.parse(t).savedAt; } catch (e) { return null; } }));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || /_settings$/.test(k) || /^kaengdekbanna_(save_[123]|backup_)/.test(k)) continue;
        let s; try { s = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        if (!s || !Array.isArray(s.party) || !s.flags || !s.map || known.has(s.savedAt)) continue;
        const free = [1, 2, 3].find((n) => !localStorage.getItem(slotKey(n)));
        if (!free) return;
        localStorage.setItem(slotKey(free), JSON.stringify({ ...s, v: SAVE_VER }));
        known.add(s.savedAt);
      }
    } catch (e) { /* ไม่มีที่เก็บ */ }
  }
  adoptOldSaves();
  // บันทึกทับเซฟของเกมอื่นเมื่อไร เก็บเซฟเดิมไว้เป็นสำรองก่อนเสมอ (กู้คืนได้ที่หน้าแรก)
  const BACKUP = 'kaengdekbanna_backup_';
  function backupSlot(n) {
    try {
      const old = localStorage.getItem(slotKey(n));
      if (!old) return;
      const o = JSON.parse(old);
      if (o.id && G.state && o.id === G.state.id) return;   // เกมเดียวกัน ไม่ต้องสำรอง
      localStorage.setItem(BACKUP + (o.savedAt || Date.now()), old);
      const keys = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(BACKUP)) keys.push(k); }
      keys.sort().slice(0, Math.max(0, keys.length - 12)).forEach((k) => localStorage.removeItem(k));   // เก็บสำรองล่าสุด 12 อัน
    } catch (e) { /* ไม่มีที่เก็บ */ }
  }
  G.save = function (slot) {
    if (slot) G.slot = slot;
    if (!G.state.id) G.state.id = Date.now().toString(36);
    backupSlot(G.slot);
    const s = { ...G.state, v: SAVE_VER, savedAt: Date.now() };
    try { localStorage.setItem(slotKey(G.slot), JSON.stringify(s)); return true; } catch (e) { return false; }
  };
  // เซฟทุกอันที่ยังอยู่ในเบราว์เซอร์นี้ (ช่อง 1-3 เซฟแบบเก่า และเซฟสำรอง)
  G.allSaves = function () {
    const out = [], seen = new Set();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || /_settings$/.test(k)) continue;
        let s; try { s = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
        if (!s || !Array.isArray(s.party) || !s.flags || !s.map) continue;
        const sig = `${s.name}|${s.savedAt}|${s.playMs}`;
        if (seen.has(sig)) continue;
        seen.add(sig); out.push({ key: k, s });
      }
    } catch (e) { /* ไม่มีที่เก็บ */ }
    return out.sort((a, b) => (b.s.savedAt || 0) - (a.s.savedAt || 0));
  };
  G.loadSave = function (slot) {
    try { const s = JSON.parse(localStorage.getItem(slotKey(slot))); if (s && s.v === SAVE_VER) return migrate(s); } catch (e) { /* */ }
    return null;
  };
  // เซฟจากเวอร์ชันก่อน: เติมของที่เพิ่มเข้ามาทีหลัง
  function migrate(s) {
    s.storage = s.storage || []; s.npcPos = {}; s.bag = s.bag || {};
    for (const m of [...s.party, ...s.storage]) if (m.held === undefined) m.held = null;
    if (s.flags.gym1_done && !s.bag.tm_wind_blade) s.bag.tm_wind_blade = 1;
    if (s.flags.boss1_done) s.flags.rival2_done = true;
    if (!G.DATA.maps[s.map]) { s.map = G.DATA.world.start.map; s.x = G.DATA.world.start.x; s.y = G.DATA.world.start.y; }
    return s;
  }
  const playTime = (ms) => { const m = Math.floor(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} ชม.`; };
  G.slotSummary = (n) => {
    const s = G.loadSave(n);
    if (!s) return { label: `ช่อง ${n} — ว่าง`, sub: '', empty: true };
    const badges = ['gym1', 'gym2', 'gym3', 'gym4'].filter((f) => s.flags[f + '_done']).length;
    return { label: `ช่อง ${n} — ${s.name}`, sub: `${(G.DATA.world.maps[s.map] || {}).name || ''} · ตรา ${badges} · ${playTime(s.playMs || 0)}` };
  };
  G.ui.saveMenu = async function () {
    const i = await G.ui.choose([1, 2, 3].map((n) => { const o = G.slotSummary(n); return { ...o, label: o.label + (n === G.slot ? ' (ช่องนี้)' : '') }; }),
      { title: 'บันทึกลงช่องไหน?', cls: 'party', start: G.slot - 1 });
    if (i < 0) return false;
    if (i + 1 !== G.slot && !G.slotSummary(i + 1).empty && !(await G.ui.confirm(`ช่อง ${i + 1} มีเซฟอยู่แล้ว จะบันทึกทับไหม?`))) return false;
    return G.save(i + 1);
  };
  G.exportSave = () => {
    const blob = new Blob([JSON.stringify({ ...G.state, v: SAVE_VER })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `kaengdekbanna-save-${G.slot}.json`; a.click();
  };
  const importSave = () => new Promise((resolve) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return resolve(null);
      f.text().then((t) => { try { const s = JSON.parse(t); resolve(s && s.v === SAVE_VER && s.party ? s : null); } catch (e) { resolve(null); } }); };
    inp.click();
  });

  // ---------- ปุ่ม ----------
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Space: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back', Enter: 'menu', KeyM: 'map', KeyB: 'bag', KeyT: 'team', Tab: 'hud' };
  const held = {};
  G.press = function (k) {
    G.unlockAudio();
    if (G.ui.active()) { if (['map', 'bag', 'team', 'hud'].includes(k)) k = 'back'; G.ui.key(k === 'menu' ? 'ok' : k); return; }
    if (G.scene !== 'world' || G.busy || G.world.moving || fading) return;
    if (k === 'ok') G.world.interact();
    else if (k === 'menu') G.runScript('_menu');
    else if (k === 'map') G.runScript('_map');
    else if (k === 'bag') G.runScript('_bag');
    else if (k === 'team' && G.state.party.length) G.runScript('_team');
    else if (k === 'hud') { G.settings.hud = G.settings.hud === false; G.saveSettings(); }
  };
  G.SCRIPTS._menu = () => G.ui.mainMenu();
  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code]; if (!k) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') { if (e.code === 'Enter') document.activeElement.blur(); return; }
    e.preventDefault();
    if (!e.repeat || ['up', 'down', 'left', 'right'].includes(k)) {
      if (!held[k] || G.ui.active()) G.press(k);
    }
    held[k] = true;
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) held[k] = false; });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  // ปุ่มบนจอสัมผัส
  document.querySelectorAll('[data-key]').forEach((b) => {
    const k = b.dataset.key;
    const down = (e) => { e.preventDefault(); held[k] = true; G.press(k); };
    const up = (e) => { e.preventDefault(); held[k] = false; };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up);
  });

  // ---------- ฉากเปลี่ยน ----------
  let fading = false;
  const fadeEl = document.querySelector('#fade');
  G.fadeTo = async function (fn) {
    fading = true; fadeEl.classList.add('on'); await G.wait(260);
    fn(); await G.wait(60); fadeEl.classList.remove('on'); await G.wait(200); fading = false;
  };
  G.flash = async function () {
    for (let i = 0; i < 3; i++) { fadeEl.classList.add('flash'); await G.wait(80); fadeEl.classList.remove('flash'); await G.wait(80); }
  };
  let toastT = null;
  G.showToast = (text) => { const t = document.querySelector('#toast'); t.textContent = text; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); };
  let rain = 0; G.rainFor = (frames) => { rain = frames; };
  G.askName = () => new Promise((resolve) => {
    const box = document.createElement('div'); box.className = 'panel sheet namebox';
    box.innerHTML = '<div class="choice-title">หัวหน้าแก๊งชื่ออะไร?</div><input maxlength="10" value="หัวหน้า" aria-label="ชื่อหัวหน้าแก๊ง"><div class="hint">พิมพ์ชื่อแล้วกด Enter</div>';
    document.querySelector('#ui').appendChild(box);
    const inp = box.querySelector('input'); inp.focus(); inp.select();
    const done = () => { const v = inp.value.trim() || 'หัวหน้า'; box.remove(); resolve(v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(); } e.stopPropagation(); });
  });

  // ---------- หน้าจอเริ่ม ----------
  async function title() {
    G.scene = 'title';
    const any = [1, 2, 3].some((n) => !G.slotSummary(n).empty);
    const found = G.allSaves();
    const opts = [];
    if (any) opts.push({ label: 'เล่นต่อ', sub: 'เลือกช่องเซฟ' });
    opts.push('เริ่มเกมใหม่');
    if (found.length) opts.push({ label: 'กู้เซฟเก่า', sub: `พบ ${found.length} เซฟในเบราว์เซอร์นี้` });
    opts.push('นำเข้าเซฟจากไฟล์');
    const i = await G.ui.choose(opts, { cancel: false, cls: 'title-menu' });
    const pick = typeof opts[i] === 'string' ? opts[i] : opts[i].label;
    if (pick === 'เล่นต่อ') {
      const k = await G.ui.choose([1, 2, 3].map((n) => { const o = G.slotSummary(n); return { ...o, disabled: o.empty }; }), { title: 'เล่นต่อจากช่องไหน?', cls: 'party' });
      if (k < 0) return title();
      const sv = G.loadSave(k + 1);
      if (!sv) { await G.ui.say('เปิดเซฟช่องนี้ไม่ได้ ลองเลือก "กู้เซฟเก่า" ที่หน้าแรก'); return title(); }   // ห้ามกลายเป็นเกมใหม่
      return start(sv, k + 1);
    }
    if (pick === 'กู้เซฟเก่า') {
      const when = (t) => (t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'ไม่ทราบเวลา');
      const j = await G.ui.choose(found.map(({ key, s }) => ({
        label: `${s.name} · Lv${Math.max(0, ...s.party.map((m) => m.lv || 0))} · ตรา ${['gym1', 'gym2', 'gym3', 'gym4'].filter((f) => s.flags[f + '_done']).length}`,
        sub: `${(G.DATA.world.maps[s.map] || {}).name || s.map} · ${when(s.savedAt)}${key.includes('backup') ? ' · สำรอง' : ''}` })),
      { title: 'เลือกเซฟที่จะกู้ (ใหม่สุดอยู่บน)', cls: 'party' });
      if (j < 0) return title();
      const k = await G.ui.choose([1, 2, 3].map((n) => G.slotSummary(n)), { title: 'กู้เข้าช่องไหน? (เซฟเดิมในช่องจะถูกเก็บสำรองไว้)', cls: 'party' });
      if (k < 0) return title();
      G.state = { ...found[j].s, v: SAVE_VER, npcPos: {} };
      if (!G.state.id) G.state.id = 'old' + (G.state.savedAt || Date.now()).toString(36);
      G.save(k + 1);
      const sv = G.loadSave(k + 1);
      if (!sv) { await G.ui.say('กู้เซฟนี้ไม่สำเร็จ'); return title(); }
      G.sfx('level'); await G.ui.say(`กู้เซฟของ ${sv.name} เข้าช่อง ${k + 1} แล้ว`);
      return start(sv, k + 1);
    }
    if (pick === 'นำเข้าเซฟจากไฟล์') {
      const s = await importSave();
      if (!s) { await G.ui.say('อ่านไฟล์เซฟไม่ได้'); return title(); }
      const k = await G.ui.choose([1, 2, 3].map((n) => G.slotSummary(n)), { title: 'เก็บเซฟนี้ไว้ช่องไหน?', cls: 'party' });
      if (k < 0) return title();
      G.state = s; G.save(k + 1);
      return start(G.loadSave(k + 1), k + 1);
    }
    if ((any || found.length) && !(await G.ui.confirm('เริ่มเกมใหม่ตั้งแต่ต้นจริงไหม? (ถ้าจะเล่นเซฟเดิม ให้เลือก "เล่นต่อ" หรือ "กู้เซฟเก่า")'))) return title();
    const free = [1, 2, 3].findIndex((n) => G.slotSummary(n).empty);
    const k = await G.ui.choose([1, 2, 3].map((n) => G.slotSummary(n)), { title: 'เริ่มใหม่ในช่องไหน? (แนะนำช่องว่าง)', cls: 'party', start: Math.max(0, free) });
    if (k < 0) return title();
    if (!G.slotSummary(k + 1).empty && !(await G.ui.confirm(`ช่อง ${k + 1} มีเซฟอยู่ ถ้าบันทึกจะทับ (เซฟเดิมถูกเก็บสำรองไว้กู้ได้) ตกลงไหม?`))) return title();
    return start(null, k + 1);
  }
  async function start(save, slot) {
    G.slot = slot;
    document.querySelector('#title').classList.add('gone');
    if (save) {
      G.state = save;
      G.loadMap(save.map, save.x, save.y, save.dir); G.scene = 'world';
    } else {
      G.state = newState();
      const st = G.DATA.world.start;
      G.loadMap(st.map, st.x, st.y, st.dir); G.scene = 'world';
      await G.runScript('intro');
    }
  }

  // ---------- วนลูปเกม ----------
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(100, now - last); last = now; acc += dt;
    while (acc >= 1000 / 60) {
      acc -= 1000 / 60;
      if (G.scene === 'world' && G.state) {
        G.state.time = (G.state.time + 1 / 60) % 1440; // 1 วินาทีจริง = 1 นาทีในเกม
        G.state.playMs += 1000 / 60;
        if (!G.busy && !G.ui.active() && !G.world.moving && !fading) {
          const dir = ['up', 'down', 'left', 'right'].find((d) => held[d]);
          if (dir) G.world.tryMove(dir, held.back);
        }
        G.world.update();
        if (rain > 0) rain--;
      }
    }
    ctx.fillStyle = '#1c2340'; ctx.fillRect(0, 0, 240, 160);
    if (G.scene === 'battle') G.drawBattle(ctx);
    else if (G.scene === 'world' && G.state) {
      G.world.draw(ctx);
      G.drawGuide(ctx);
      if (G.fx) G.fx.draw(ctx, now);
      if (rain > 0) { ctx.strokeStyle = 'rgba(200,220,255,0.6)'; ctx.beginPath(); for (let i = 0; i < 60; i++) { const x = (i * 53 + now / 3) % 260 - 10, y = (i * 37 + now / 1.5) % 170 - 10; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 8); } ctx.stroke(); }
      const h = Math.floor(G.state.time / 60), m = Math.floor(G.state.time % 60);
      document.querySelector('#clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    G.updateHud();
    requestAnimationFrame(frame);
  }

  // ขยายจอให้พอดีหน้าต่างและคมแบบพิกเซล
  function fit() {
    const scr = document.querySelector('#screen');
    const touch = matchMedia('(pointer: coarse)').matches;
    const maxW = window.innerWidth - 16, maxH = window.innerHeight - (touch ? 190 : 16);
    let s = Math.min(maxW / 240, maxH / 160);
    if (s >= 2) s = Math.floor(s * 2) / 2;
    scr.style.width = 240 * s + 'px'; scr.style.height = 160 * s + 'px';
    document.documentElement.style.setProperty('--px', s + 'px');
  }
  window.addEventListener('resize', fit); fit();

  // แสดงข้อผิดพลาดบนจอ จะได้รู้ว่าพังตรงไหน
  window.addEventListener('error', (e) => { const t = document.querySelector('#toast'); t.textContent = 'ผิดพลาด: ' + e.message; t.classList.add('on', 'err'); });

  G.state = null;
  requestAnimationFrame(frame);
  title();
})(window.G = window.G || {});
