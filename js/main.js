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
    return { v: SAVE_VER, name: 'หัวหน้า', map: st.map, x: st.x, y: st.y, dir: st.dir, flags: {}, party: [], storage: [],
      bag: {}, money: 300, time: 7 * 60, steps: 0, repel: 0, dex: {}, npcPos: {}, follower: false, starter: null, playMs: 0 };
  }
  G.save = function () {
    const s = { ...G.state, v: SAVE_VER, savedAt: Date.now() };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  };
  G.loadSave = function () {
    try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === SAVE_VER) return s; } catch (e) { /* */ }
    return null;
  };
  G.exportSave = () => {
    const blob = new Blob([JSON.stringify(G.state)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kaengdekbanna-save.json'; a.click();
  };

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
    const save = G.loadSave();
    const opts = [];
    if (save) opts.push({ label: 'เล่นต่อ', sub: `${save.name} · ${(save.party[0] || {}).name || ''} · ${new Date(save.savedAt).toLocaleDateString('th-TH')}` });
    opts.push('เริ่มเกมใหม่');
    const i = await G.ui.choose(opts, { cancel: false, cls: 'title-menu' });
    document.querySelector('#title').classList.add('gone');
    if (save && i === 0) {
      G.state = save; G.state.npcPos = {};
      G.loadMap(save.map, save.x, save.y, save.dir); G.scene = 'world';
    } else {
      if (save && !(await G.ui.confirm('เริ่มใหม่จะทับเซฟเดิมเมื่อบันทึก ตกลงไหม?'))) { document.querySelector('#title').classList.remove('gone'); return title(); }
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
