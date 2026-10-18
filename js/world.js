// แผนที่ การเดิน NPC การเจอผีสาง และกลางวัน-กลางคืน
// ความหมายตัวอักษรในแผนที่ (data_src/*.txt):
//  .  ดิน/หญ้า      :  ทางดินแดง     #  ต้นไม้        P  ป่าดอนปู่ตา    w  น้ำ
//  T  ต้นข้าว (ในแผนที่ที่มีผีสาง = สุ่มเจอ)       R  หลังคามุงแฝก   r  หลังคาสังกะสี
//  H  ฝาไม้          h  ผนังปูน      D  ประตู (เดินชน = เข้า)          S  ป้าย
//  F  รั้ว           o  กองฟาง       b  บ่อน้ำ        f  ดอกไม้        ^  ศาลปู่ตา
//  M  หลังคาสิม      m  ผนังสิม      A  หลังคาศาลา   I  เสาศาลา       L  พื้นศาลา
//  K  หลังคาร้านราเมง  n  ผ้าม่านร้านราเมง
(function (G) {
  'use strict';
  const TS = 16, VW = 15, VH = 10;
  const WALK = '.:fTL';
  G.world = { npcs: [], map: null, rows: null, moving: null, anim: 0 };
  const W = G.world;

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

  const tileCache = {};
  function tileCanvas(ch, x, y, frame) {
    const v = Math.floor(hash(x, y) * 4);
    const key = ch + v + (ch === 'w' ? frame : '');
    if (tileCache[key]) return tileCache[key];
    const c = document.createElement('canvas'); c.width = c.height = TS;
    const g = c.getContext('2d');
    const R = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(a, b, w, h); };
    const grass = () => { R('#9caf55', 0, 0, 16, 16); const s = hash(v, 7); R('#879d48', (s * 13) | 0, 3, 1, 2); R('#b6c46a', ((s * 7) | 0) + 6, 10, 1, 1); R('#879d48', 11, ((s * 9) | 0) + 4, 1, 2); };
    switch (ch) {
      case '.': grass(); break;
      case 'f': grass(); [['#e8c34a', 3, 4], ['#f2efe4', 10, 9], ['#d9455a', 6, 12]].forEach(([col, a, b]) => { R(col, a, b, 2, 2); R('#5f7f43', a, b + 2, 1, 2); }); break;
      case ':': R('#c47a4a', 0, 0, 16, 16); R('#b06a3e', (v * 4) % 13, 5, 2, 1); R('#d48d5c', 9, (v * 3) % 12 + 2, 1, 1); R('#b06a3e', 3, 12, 1, 1); break;
      case '#': case 'P': {
        grass();
        const dark = ch === 'P';
        g.fillStyle = dark ? '#24402a' : '#3f6b34'; g.beginPath(); g.arc(8, 7, 7, 0, 7); g.fill();
        g.fillStyle = dark ? '#335a38' : '#5a8a45'; g.beginPath(); g.arc(6, 5, 3.5, 0, 7); g.fill();
        R('#5a3a22', 7, 13, 2, 3);
        if (dark && v === 1) R('#c5482b', 6, 11, 4, 1);
        break; }
      case 'w': R('#4f8fb0', 0, 0, 16, 16); R('#7cb6cf', (frame * 5 + v * 3) % 12, 4, 4, 1); R('#7cb6cf', (frame * 3 + 8 + v) % 12, 11, 3, 1); break;
      case 'T': R('#6e9b3a', 0, 0, 16, 16); for (let i = 0; i < 5; i++) { R('#4f7a2a', i * 3 + 1, 4 + (i % 2) * 3, 1, 8); R('#a8c45a', i * 3 + 1, 3 + (i % 2) * 3, 1, 2); } break;
      case 'R': R('#b08a4a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 3) R('#8a6a34', 0, i, 16, 1); R('#c9a45a', v * 3, 1, 3, 1); break;
      case 'r': R('#9a3a2a', 0, 0, 16, 16); for (let i = 1; i < 16; i += 4) R('#7a2a1e', i, 0, 1, 16); R('#b85a44', 0, 0, 16, 1); break;
      case 'A': R('#a63a2a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#86281c', 0, i + 3, 16, 1); R('#d9b25a', 0, 15, 16, 1); break;
      case 'M': R('#b5402a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#8e2c1c', 0, i + 3, 16, 1); R('#d9b25a', 0, 0, 16, 1); R('#d9b25a', 0, 15, 16, 1); break;
      case 'K': R('#3a2a24', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#2a1d18', 0, i + 3, 16, 1); break;
      case 'H': R('#6b5040', 0, 0, 16, 16); for (let i = 3; i < 16; i += 4) R('#54402f', 0, i, 16, 1); R('#3a2a20', 0, 15, 16, 1); break;
      case 'h': case 'm': R(ch === 'm' ? '#f2efe4' : '#d8d0c0', 0, 0, 16, 16); R('#b8b0a0', 0, 15, 16, 1); if (v % 2) { R('#6b8fa8', 4, 4, 8, 6); R('#3a2a20', 4, 4, 8, 1); } break;
      case 'n': R('#2b3f8a', 0, 0, 16, 16); R('#1f2f6b', 7, 0, 1, 16); R('#f4f4ec', 3, 5, 3, 3); R('#f4f4ec', 10, 5, 3, 3); break;
      case 'D': R('#6b5040', 0, 0, 16, 16); R('#3a2a20', 3, 1, 10, 15); R('#2a1d18', 4, 2, 8, 14); R('#d9b25a', 10, 9, 1, 1); break;
      case 'S': grass(); R('#5a3a22', 7, 9, 2, 7); R('#8a6a4a', 2, 3, 12, 7); R('#6b5040', 2, 9, 12, 1); R('#3a2a20', 4, 5, 8, 1); R('#3a2a20', 4, 7, 6, 1); break;
      case 'F': grass(); R('#8a6a4a', 0, 6, 16, 2); R('#8a6a4a', 0, 11, 16, 2); R('#6b5040', 2, 4, 2, 11); R('#6b5040', 12, 4, 2, 11); break;
      case 'o': grass(); g.fillStyle = '#d9b25a'; g.beginPath(); g.ellipse(8, 10, 7, 6, 0, 0, 7); g.fill(); R('#b08a3a', 3, 9, 10, 1); R('#e9c86a', 6, 5, 3, 1); break;
      case 'b': grass(); g.fillStyle = '#8a8a8a'; g.beginPath(); g.ellipse(8, 10, 7, 5, 0, 0, 7); g.fill(); g.fillStyle = '#2a4a5a'; g.beginPath(); g.ellipse(8, 9, 5, 3, 0, 0, 7); g.fill(); R('#6b5040', 2, 0, 1, 9); R('#6b5040', 13, 0, 1, 9); R('#6b5040', 2, 0, 12, 1); break;
      case '^': R('#24402a', 0, 0, 16, 16); R('#5a3a22', 7, 10, 2, 6); R('#f2efe4', 4, 5, 8, 6); R('#c5482b', 3, 2, 10, 3); R('#d9b25a', 7, 7, 2, 2); break;
      case 'I': R('#a0784e', 0, 0, 16, 16); R('#5a3a22', 6, 0, 4, 16); break;
      case 'L': R('#a0784e', 0, 0, 16, 16); for (let i = 3; i < 16; i += 4) R('#8a6440', 0, i, 16, 1); break;
      default: grass();
    }
    tileCache[key] = c;
    return c;
  }

  G.loadMap = function (id, x, y, dir) {
    const S = G.state;
    S.map = id; S.x = x; S.y = y; if (dir) S.dir = dir;
    W.map = id; W.rows = G.DATA.maps[id]; W.moving = null;
    W.def = G.DATA.world.maps[id];
    G.refreshNpcs();
    G.showToast(W.def.name);
    G.music(W.def.music);
  };

  G.refreshNpcs = function () {
    const F = G.state.flags;
    W.npcs = G.DATA.world.npcs.filter((n) => n.map === W.map && (!n.showIf || F[n.showIf]) && (!n.hideIf || !F[n.hideIf]))
      .map((n) => ({ ...n, x: (G.state.npcPos[n.id] || n).x, y: (G.state.npcPos[n.id] || n).y, dir: n.dir }));
  };

  const tileAt = (x, y) => (W.rows[y] && W.rows[y][x]) || '#';
  const npcAt = (x, y) => W.npcs.find((n) => n.x === x && n.y === y);
  const warpAt = (x, y) => G.DATA.world.warps.find((w) => w.map === W.map && w.x === x && w.y === y);
  const doorAt = (x, y) => G.DATA.world.doors.find((d) => d.map === W.map && d.x === x && d.y === y);
  const signAt = (x, y) => G.DATA.world.signs.find((s) => s.map === W.map && s.x === x && s.y === y);
  G.world.passable = (x, y) => (WALK.includes(tileAt(x, y)) || !!warpAt(x, y)) && !npcAt(x, y) && x >= 0 && y >= 0 && y < W.rows.length && x < W.rows[0].length;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  G.DIRS = DIRS;

  // ---------- เดิน ----------
  G.world.tryMove = function (dir, run) {
    const S = G.state;
    S.dir = dir;
    const [dx, dy] = DIRS[dir], nx = S.x + dx, ny = S.y + dy;
    const door = doorAt(nx, ny);
    if (door) { G.runScript(door.script, door); return; }
    if (!G.world.passable(nx, ny)) { if (!W.bumpCD) { G.sfx('bump'); W.bumpCD = 14; } return; }
    W.moving = { fx: S.x, fy: S.y, tx: nx, ty: ny, t: 0, speed: run ? 0.25 : 0.125 };
  };

  G.world.update = function () {
    W.anim++;
    if (W.bumpCD) W.bumpCD--;
    const m = W.moving;
    if (!m) return;
    m.t += m.speed;
    if (m.t >= 1) {
      G.state.x = m.tx; G.state.y = m.ty; W.moving = null;
      G.world.afterStep();
    }
  };

  G.world.afterStep = function () {
    const S = G.state;
    S.steps++;
    if (S.repel > 0) { S.repel--; if (S.repel === 0) G.runScript('repel_end'); }
    const wp = warpAt(S.x, S.y);
    if (wp) { G.fadeTo(() => G.loadMap(wp.to, wp.tx, wp.ty)); return; }
    // เทรนเนอร์มองเห็นเรา
    for (const n of W.npcs) {
      const tr = n.trainer;
      if (!tr || S.flags[tr.flag]) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= tr.sight; i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (x === S.x && y === S.y) { G.runScript('trainer_spot', n, i); return; }
        if (!WALK.includes(tileAt(x, y)) || npcAt(x, y)) break;
      }
    }
    // สุ่มเจอผีสางในนาข้าว
    if (W.def.encounter && tileAt(S.x, S.y) === 'T' && G.rng() < 0.14) {
      const table = G.DATA.encounters[W.map];
      const night = G.isNight();
      const roll = G.rng() * 100;
      let acc = 0;
      for (const e of table) {
        acc += night ? e.night : e.day;
        if (roll < acc) {
          const lv = G.rng.int(e.min, e.max);
          if (S.repel > 0 && lv < S.party[0].lv) return;
          G.runScript('wild', e.sp, lv);
          return;
        }
      }
    }
  };

  const DOOR_LABEL = { door_home: 'เข้าบ้าน (พัก/บันทึก)', door_shop: 'เข้าร้านชำ', door_osm: 'ให้ป้านวลรักษา', door_temple: 'เข้าสิม',
    door_school: 'ดูโรงเรียน', door_tiang: 'ฝาก/รับผีสาง', door_ramen: 'เข้าร้านราเมง', door_bee: 'บ้านบี', door_am: 'บ้านแอม', door_tle: 'บ้านเติ้ล', door_ter: 'บ้านเต๋อ' };
  const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };
  // สิ่งที่คุยได้รอบตัว (หันหน้าไปหาก่อน ถ้าไม่มีค่อยดูรอบๆ)
  G.world.nearby = function () {
    const S = G.state;
    const dirs = [S.dir, ...Object.keys(DIRS).filter((d) => d !== S.dir)];
    for (const dir of dirs) {
      const [dx, dy] = DIRS[dir], x = S.x + dx, y = S.y + dy;
      const n = npcAt(x, y);
      if (n) return { kind: 'npc', ref: n, dir, x, y, label: n.look === 'item' ? 'เก็บของ' : n.look === 'buffalo' ? 'ดูควาย' : `คุยกับ${n.name || ''}` };
      const sg = signAt(x, y);
      if (sg) return { kind: 'sign', ref: sg, dir, x, y, label: 'อ่านป้าย' };
      const d = doorAt(x, y);
      if (d && dir === S.dir) return { kind: 'door', ref: d, dir, x, y, label: DOOR_LABEL[d.script] || 'เข้าไป' };
    }
    return null;
  };

  G.world.interact = function () {
    const S = G.state;
    const near = G.world.nearby();
    if (near) {
      S.dir = near.dir;
      if (near.kind === 'npc') { const n = near.ref; if (n.look !== 'item' && n.look !== 'toad') n.dir = BACK[near.dir]; G.runScript(n.script, n); }
      else if (near.kind === 'sign') G.runScript('sign', near.ref);
      else G.runScript(near.ref.script, near.ref);
      return;
    }
    const [dx, dy] = DIRS[S.dir], t = tileAt(S.x + dx, S.y + dy);
    if (t === 'w') G.runScript('water');
    else if (t === 'b') G.runScript('well');
  };

  // ---------- เวลา ----------
  G.isNight = () => { const h = Math.floor(G.state.time / 60) % 24; return h >= 19 || h < 6; };
  G.darkness = () => {
    const h = (G.state.time / 60) % 24;
    if (h >= 6 && h < 17) return 0;
    if (h >= 17 && h < 19) return ((h - 17) / 2) * 0.45;
    if (h >= 19 || h < 5) return 0.45;
    return (1 - (h - 5)) * 0.45;
  };

  // ---------- วาด ----------
  G.world.draw = function (ctx) {
    const S = G.state;
    let px = S.x, py = S.y;
    if (W.moving) { px = W.moving.fx + (W.moving.tx - W.moving.fx) * W.moving.t; py = W.moving.fy + (W.moving.ty - W.moving.fy) * W.moving.t; }
    const cols = W.rows[0].length, rows = W.rows.length;
    let cx = px * TS - (VW * TS) / 2 + TS / 2, cy = py * TS - (VH * TS) / 2 + TS / 2;
    cx = Math.max(0, Math.min(cols * TS - VW * TS, cx)); cy = Math.max(0, Math.min(rows * TS - VH * TS, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    W.cam = { cx, cy, px, py };
    const frame = Math.floor(W.anim / 30) % 2;
    const x0 = Math.floor(cx / TS), y0 = Math.floor(cy / TS);
    for (let y = y0; y <= y0 + VH; y++) for (let x = x0; x <= x0 + VW; x++) {
      if (y >= rows || x >= cols) continue;
      ctx.drawImage(tileCanvas(W.rows[y][x], x, y, frame), x * TS - cx, y * TS - cy);
    }
    // ตัวละคร เรียงตามแกน y
    const actors = W.npcs.map((n) => ({ y: n.y, draw: () => drawActor(ctx, n.look, n.x * TS - cx, n.y * TS - cy, n.dir, false, n) }));
    const walking = !!W.moving;
    actors.push({ y: py, draw: () => drawActor(ctx, 'player', Math.round(px * TS - cx), Math.round(py * TS - cy), S.dir, walking) });
    if (S.follower) {
      const f = S.party[0];
      if (f) {
        const [dx, dy] = DIRS[S.dir];
        actors.push({ y: py - dy * 0.9 - 0.01, draw: () => drawActor(ctx, G.DATA.species[f.sp].look, Math.round((px - dx * 0.9) * TS - cx), Math.round((py - dy * 0.9) * TS - cy), S.dir, walking) });
      }
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    // หญ้าบังขา
    if (tileAt(S.x, S.y) === 'T' && !W.moving) { ctx.fillStyle = '#6e9b3a'; ctx.fillRect(S.x * TS - cx + 2, S.y * TS - cy + 11, 12, 5); }
    const dk = G.darkness();
    if (dk > 0) {
      ctx.fillStyle = `rgba(16,20,58,${dk})`; ctx.fillRect(0, 0, 240, 160);
      if (G.isNight()) { // ผีโพงลอยเรืองแสงในทุ่ง
        ctx.globalCompositeOperation = 'lighter';
        const gx = Math.round(px * TS - cx + 8), gy = Math.round(py * TS - cy + 8);
        const grd = ctx.createRadialGradient(gx, gy, 2, gx, gy, 40);
        grd.addColorStop(0, 'rgba(255,220,140,0.18)'); grd.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = grd; ctx.fillRect(gx - 40, gy - 40, 80, 80);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  function drawActor(ctx, look, x, y, dir, walking, npc) {
    const spr = G.sprite(look);
    const bob = walking ? (Math.floor(W.anim / 6) % 2) : (npc && npc.look !== 'item' ? (Math.floor((W.anim + x) / 40) % 2) * 0 : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 3, y + 14, 10, 2);
    if (dir === 'left') { ctx.save(); ctx.translate(x + 16, y - bob); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0); ctx.restore(); }
    else ctx.drawImage(spr, x, y - bob);
    if (dir === 'up' && look !== 'item' && look !== 'toad' && look !== 'buffalo') { // หันหลัง: ปิดหน้าด้วยสีผม
      const d = G._spriteDefs.LOOKS[look];
      if (d) { ctx.fillStyle = d.hair === 'bald' ? d.S : (d.hair === 'bandana' ? d.B : d.H); ctx.fillRect(x + 4, y - bob + 4, 8, 4); }
    }
    if (npc && npc.trainer && !G.state.flags[npc.trainer.flag]) { ctx.fillStyle = '#c5482b'; ctx.fillRect(x + 7, y - 4, 2, 2); }
  }
})(window.G = window.G || {});
