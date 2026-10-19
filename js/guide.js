// ไกด์: บอกเป้าหมายถัดไป ลูกศรชี้ทาง และปุ่ม "คุย" ที่เด้งขึ้นเมื่อเดินเข้าใกล้คน/ป้าย/ประตู
(function (G) {
  'use strict';
  // เควสต์มาจาก data_src/quests.csv: เควสต์หลักทำตามลำดับในไฟล์ เควสต์รองเริ่มเมื่อมี flag start
  const Q = () => G.DATA.quests;
  G.questTarget = function (q) {
    const t = q.mid && G.state.flags[q.mid] && q.target2 ? q.target2 : q.target;
    const [kind, a, b, c] = t.split(':');
    if (kind === 'npcs') {   // หลายจุด (เช่น เก็บของ/เทรนเนอร์หลายคน): ชี้ไปอันแรกที่ยังไม่ได้
      const F = G.state.flags, list = a.split(';').map((id) => G.DATA.world.npcs.find((k) => k.id === id));
      const n = list.find((k) => !F[k.flag || (k.trainer && k.trainer.flag)]) || list[0];
      return { map: n.map, x: n.x, y: n.y };
    }
    if (kind === 'npc') { const n = G.DATA.world.npcs.find((k) => k.id === a); return { map: n.map, x: n.x, y: n.y }; }
    return { map: a, x: +b, y: +c };
  };
  G.questState = function (q) {
    const F = G.state.flags;
    if (F[q.done]) return 'done';
    if (q.kind === 'main') return Q().filter((k) => k.kind === 'main').find((k) => !F[k.done]) === q ? 'active' : 'locked';
    return F[q.start] ? 'active' : 'locked';
  };
  // เครื่องหมายเหนือหัว: ! คนที่มีเควสต์รองให้รับ, ? เป้าหมายของเควสต์รองที่กำลังทำ
  G.questMark = function (npcId) {
    const F = G.state.flags;
    for (const q of Q()) {
      if (q.kind !== 'side' || F[q.done]) continue;
      if (!F[q.start] && q.giver === npcId && (!q.after || F[q.after])) return '!';
      if (F[q.start]) { const t = q.mid && F[q.mid] && q.target2 ? q.target2 : q.target; if (t === 'npc:' + npcId || (t.startsWith('npcs:') && t.slice(5).split(';').includes(npcId))) return '?'; }
    }
    return null;
  };
  // เควสต์ที่ผู้เล่นเลือกติดตาม (เลือกในสมุดเควสต์ หรือรับเควสต์รองใหม่) ลูกศรชี้ไปเควสต์นั้นก่อน
  G.trackedQuest = function () {
    const id = G.state.trackQuest, q = id && Q().find((k) => k.id === id);
    return q && G.questState(q) === 'active' ? q : null;
  };
  G.objective = function () {
    const tq = G.trackedQuest();
    if (tq && tq.kind === 'side') return { text: `[เควสต์รอง] ${tq.desc}`, ...G.questTarget(tq) };
    const q = Q().find((k) => k.kind === 'main' && !G.state.flags[k.done]);
    if (!q) {
      const side = Q().find((k) => G.questState(k) === 'active');
      if (side) return { text: `[เควสต์รอง] ${side.desc}`, ...G.questTarget(side) };
      const S = G.state;
      const engs = [...S.party, ...S.storage].filter((m) => G.isPerson(m)).length;
      const all = Object.values(G.DATA.engNames).reduce((a, l) => a + l.length, 0) + 1;
      return { text: `จบเกมแล้ว! ชวนน้องวิศวะ น้องพยาบาล น้องหมอเข้าแก๊ง (${engs}/${all} คน)` };
    }
    return { text: q.desc, ...G.questTarget(q) };
  };

  // หาเส้นทางระหว่างแผนที่ (วาร์ป ประตูตึก รถสองแถว) แล้วชี้ไปที่ทางออกแรกที่ต้องเดินไป
  function links() {
    const W = G.DATA.world, out = [...W.warps, ...W.doors.filter((d) => d.to)];
    for (const r of W.rides || []) { const n = W.npcs.find((k) => k.id === r.npc); out.push({ map: r.map, x: n.x, y: n.y, to: r.to }); }
    return out;
  }
  function routeTarget(obj) {
    const cur = G.state.map;
    if (!obj.map) return null;
    if (obj.map === cur) return { x: obj.x, y: obj.y };
    const warps = links();
    const q = [[cur, null]], seen = new Set([cur]);
    while (q.length) {
      const [m, first] = q.shift();
      for (const w of warps.filter((w) => w.map === m)) {
        if (seen.has(w.to)) continue;
        const f = first || w;
        if (w.to === obj.map) return { x: f.x, y: f.y };
        seen.add(w.to); q.push([w.to, f]);
      }
    }
    return null;
  }

  // ---------- วาดลูกศรชี้เป้าหมายบนแผนที่ ----------
  G.drawGuide = function (ctx) {
    if (!G.settings.guide || !G.state || G.busy) return;
    const obj = G.objective(), t = routeTarget(obj);
    if (!t) return;
    const cam = G.world.cam;
    let sx = t.x * 16 - cam.cx + 8, sy = t.y * 16 - cam.cy - 4;
    const bob = Math.sin(performance.now() / 180) * 2;
    const inView = sx > 4 && sx < 236 && sy > 8 && sy < 156;
    ctx.save();
    if (inView) {
      ctx.translate(sx, sy + bob);
      ctx.fillStyle = '#18203f'; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(6, -9); ctx.lineTo(0, 0); ctx.fill();
      ctx.fillStyle = '#d9b25a'; ctx.beginPath(); ctx.moveTo(-4.5, -8); ctx.lineTo(4.5, -8); ctx.lineTo(0, -1.5); ctx.fill();
    } else { // เป้าหมายอยู่นอกจอ: ลูกศรที่ขอบจอชี้ไปทางนั้น
      const px = (G.world.cam.px) * 16 - cam.cx + 8, py = (G.world.cam.py) * 16 - cam.cy + 8;
      const a = Math.atan2(sy - py, sx - px);
      ctx.translate(px + Math.cos(a) * 22, py + Math.sin(a) * 22); ctx.rotate(a); // ลูกศรวนรอบตัวผู้เล่น ชี้ไปทางเป้าหมาย
      ctx.translate(bob, 0);
      ctx.beginPath(); [[9, 0], [1, -6], [1, -2.5], [-7, -2.5], [-7, 2.5], [1, 2.5], [1, 6]].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#18203f'; ctx.stroke(); ctx.fillStyle = '#d9b25a'; ctx.fill();
    }
    ctx.restore();
  };

  // ---------- ป้ายลอยชื่อตึก/ร้าน (ตัวใหญ่ = ชื่อ ตัวเล็ก = ขายอะไร) วางบนหลังคาเหนือประตู ----------
  const labelBox = document.querySelector('#labels');
  let labelMap = null, labels = [];
  const WALKS = '.:fTL_-x~><O2aeg+0dv1345=';
  const solid = (x, y) => { const t = G.world.tileAt(x, y); return t !== '#' && !WALKS.includes(t); };
  function buildLabels() {
    labelMap = G.world.map; labels = []; labelBox.innerHTML = '';
    const add = (o, name, sub, ax, ay) => {
      const e = document.createElement('div'); e.className = 'blabel' + (o.npc ? ' small' : '');
      e.innerHTML = `<b></b>${sub ? '<small></small>' : ''}`; e.firstChild.textContent = name; if (sub) e.lastChild.textContent = sub;
      labelBox.appendChild(e); labels.push({ e, ax, ay, ...o, sub });
    };
    for (const d of G.DATA.world.doors) {
      if (d.map !== labelMap || !d.name) continue;
      let top = d.y; while (top > 0 && solid(d.x, top - 1)) top--;
      let l = d.x, r = d.x; while (solid(l - 1, d.y)) l--; while (solid(r + 1, d.y)) r++;
      add({ door: d }, d.name, d.sells, ((l + r + 1) / 2) * 16, top * 16 + 2);
    }
    for (const n of G.world.npcs) if (n.tag) add({ npc: n }, n.tag[0], n.tag[1], n.x * 16 + 8, n.y * 16 - 3);
  }
  function updateLabels(show) {
    if (!show || !G.world.cam) { labelBox.hidden = true; return; }
    if (labelMap !== G.world.map || labels.some((l) => l.npc && !G.world.npcs.includes(l.npc)) || G.world.npcs.some((n) => n.tag && !labels.some((l) => l.npc === n))) buildLabels();
    labelBox.hidden = false;
    const { cx, cy } = G.world.cam, near = G.world.near;
    // ไม่ให้ป้ายซ้อนใต้แถบเป้าหมาย มินิแมพ ปุ่ม นาฬิกา ชื่อแมพ
    const blocks = ['#quest', '#minimap', '#hud-btns', '#clock', '#toast'].map((q) => document.querySelector(q)).filter((e) => e && !e.hidden && e.offsetParent && e.offsetWidth && getComputedStyle(e).opacity > 0.05).map((e) => e.getBoundingClientRect());
    for (const l of labels) {
      const x = l.ax - cx;
      let y = l.ay - cy;
      if (l.door && y < 44) y = Math.max(y, l.door.y * 16 - cy - 2);   // หลังคาพ้นจอหรือโดนแถบบนบัง ย้ายป้ายลงมาติดเหนือประตู
      const hide = x < -40 || x > 280 || y < 22 || y > 175 || (l.npc && near && near.ref === l.npc);
      l.e.hidden = hide; if (hide) continue;
      l.e.style.left = `calc(var(--px) * ${x})`; l.e.style.top = `calc(var(--px) * ${y})`;
      const closed = l.door && l.door.open && !G.hourIn(l.door.open);
      l.e.classList.toggle('closed', !!closed);
      const sm = l.e.querySelector('small'), want = closed ? 'ปิดแล้ว' : l.sub;
      if (sm && sm.textContent !== want) sm.textContent = want;
      const r = l.e.getBoundingClientRect();
      l.e.style.visibility = blocks.some((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top) ? 'hidden' : '';
    }
  }

  // ---------- แถบเป้าหมาย + ปุ่มคุย ----------
  const quest = document.querySelector('#quest'), talk = document.querySelector('#talk');
  let lastQuest = '';
  G.updateHud = function () {
    const show = G.scene === 'world' && G.state && G.state.flags.intro_done && !G.ui.active() && !G.busy;
    if (show && G.settings.guide) {
      const obj = G.objective();
      const lead = G.state.party.find((m) => m.hp > 0);
      const low = lead && lead.hp < lead.stats.hp * 0.3 ? ' · พลังเหลือน้อย แวะพักที่ศาลา อสม. หรือบ้าน' : '';
      const txt = obj.text + low;
      if (txt !== lastQuest) { quest.innerHTML = `<b>เป้าหมาย</b>${txt}`; lastQuest = txt; }
      quest.hidden = false;
    } else quest.hidden = true;
    G.updateGangHud(show);
    updateLabels(show);

    const near = show && !G.world.moving ? G.world.nearby() : null;
    if (!near) { talk.hidden = true; G.world.near = null; return; }
    G.world.near = near;
    const cam = G.world.cam;
    talk.style.left = `calc(var(--px) * ${near.x * 16 - cam.cx + 8})`;
    talk.style.top = `calc(var(--px) * ${near.y * 16 - cam.cy - 2})`;
    const label = near.label;
    if (talk.dataset.label !== label) { talk.dataset.label = label; talk.innerHTML = `${label}<kbd>Z</kbd>`; }
    talk.hidden = false;
  };
  talk.addEventListener('click', (e) => { e.preventDefault(); G.unlockAudio(); if (!G.busy && !G.ui.active()) G.world.interact(); });

  // ---------- เคล็ดลับครั้งแรก ----------
  G.tip = async function (flag, html) {
    if (G.state.flags[flag]) return;
    G.state.flags[flag] = true;
    await G.ui.panel(`<div class="tip">${html}<div class="hint">กด Z หรือแตะเพื่อปิด</div></div>`, 'tip-sheet');
  };
  G.HOWTO = `<div class="choice-title">วิธีเล่น</div>
    <ul class="howto">
      <li><b>เดิน</b> ลูกศรหรือ WASD · กด X ค้างเพื่อวิ่ง</li>
      <li><b>คุย อ่านป้าย เข้าบ้าน</b> เดินไปใกล้ๆ จะมีปุ่มเด้งขึ้นมา แตะปุ่มหรือกด Z</li>
      <li><b>ไม่รู้จะไปไหน</b> ดูเป้าหมายมุมซ้ายบน แล้วเดินตามลูกศรสีทอง</li>
      <li><b>เจอผีสาง</b> เดินในนาข้าว · ตีให้อ่อนแรงแล้วเปิดกระเป๋าถวายข้าวเหนียวเพื่อชวนเข้าแก๊ง</li>
      <li><b>ธาตุ</b> น้ำ › ดิน › สายฟ้า › ลม › น้ำ · ตีถูกธาตุแรง 2 เท่า</li>
      <li><b>เดินทางเร็ว</b> เมนู (Enter) › เดินทาง นั่งสองแถวไปที่ที่เคยไปแล้ว · ตั้งค่า › ความเร็วการต่อสู้ ×2 · ท่าที่มี ▲×2 คือตีถูกธาตุ</li>
      <li><b>หนี</b> หนีผีป่าได้ง่าย (เลเวลไม่น้อยกว่าศัตรูหนีได้แน่นอน) · สู้กับคนอื่นหนีไม่ได้ · ข้อความ EXP/เลเวลอัปหลังชนะ <b>กด Z สองครั้งติด</b> เพื่อข้ามรวด</li>
      <li><b>ปุ่มลัด</b> B กระเป๋า · T ทีม · M แผนที่ · Q สมุดเควสต์ (เลือกเควสต์ให้ลูกศรชี้) · L ประวัติบทสนทนา · Tab ซ่อน/แสดงแถบทีมและมินิแมพ · คลิกการ์ดสมาชิกเพื่อดูข้อมูล</li>
      <li><b>จอยเกม</b> A ตกลง · B ถอย · X กระเป๋า · Y ทีม · Start เมนู · Select แผนที่ · LB เควสต์ · RB ประวัติบทสนทนา</li>
      <li><b>วิ่ง</b> วิ่งเป็นค่าเริ่มต้น กด X ค้างไว้เพื่อเดินช้า (ปิดได้ในตั้งค่า) · เมนู › ฟื้นทีมด่วน ใช้ยาให้ทุกคนอัตโนมัติ</li>
      <li><b>เข้าตึก</b> เดินชนประตู · ออกทางพรมแดงข้างล่าง</li>
      <li><b>ทีม</b> คนแรกในทีมเดินตามและลงสู้ก่อน · เปลี่ยนที่เมนูทีม › ให้เดินตาม · จัดทีม/ฝากสมาชิกที่คลังแก๊ง (เถียงนาตาสี หรือคอมหอพัก)</li>
      <li><b>จัดท่า/เรียนท่า</b> ครูมวยบุญหลาย (หมู่บ้าน) หรืออาจารย์ทองพูน (ตึกเรียน มข.) จัดท่าฟรี ท่าที่ลืมไปเอากลับมาได้ · ยายเพ็ญข้าวจี่ (ตลาด) ขายของกินเพิ่มเลเวล</li>
      <li><b>สีตัวอักษร</b> <span class="k-name">ชื่อ</span> · <span class="k-move">ท่า</span> · <span class="k-item">ไอเท็ม</span> · <span class="k-money">เงิน</span> · <span class="k-good">ได้ผลดี/ฟื้นพลัง</span> · <span class="k-hurt">หมดแรง/ลดลง</span> · <span class="k-weak">ไม่ค่อยได้ผล</span> · <span class="k-water">น้ำ</span> <span class="k-earth">ดิน</span> <span class="k-electric">สายฟ้า</span> <span class="k-wind">ลม</span> (ปิดได้ในตั้งค่า)</li>
      <li><b>เหนื่อย</b> พักฟรีที่บ้านหรือศาลา อสม. · บันทึกเกมได้ 3 ช่องที่บ้านหรือในเมนู (Enter)</li>
    </ul>`;
})(window.G = window.G || {});
