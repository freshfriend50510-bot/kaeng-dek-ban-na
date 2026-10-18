// ไกด์: บอกเป้าหมายถัดไป ลูกศรชี้ทาง และปุ่ม "คุย" ที่เด้งขึ้นเมื่อเดินเข้าใกล้คน/ป้าย/ประตู
(function (G) {
  'use strict';
  const STEPS = [
    { until: 'starter_chosen', text: 'ไปศาลากลางบ้าน คุยกับผู้ใหญ่บ้านสมบัติ', map: 'village', npc: 'elder' },
    { until: 'gift_rice', text: 'ไปรับข้าวเหนียวจากป้าสมร หน้าร้านชำ', map: 'village', npc: 'samorn' },
    { until: 'catch_tutorial', text: 'ไปหาตาสีที่เถียงนา เรียนวิธีชวนผีเข้าแก๊ง', map: 'village', npc: 'tasi' },
    { until: 'field_open', text: 'ขอให้พ่อบีจูงควายออกจากทางลงทุ่ง', map: 'village', npc: 'beedad' },
    { until: 'boss1_done', text: 'ลงทุ่งนา เก็บเลเวลในนาข้าว แล้วไปสู้คางคกที่หนองใหญ่ (แนะนำ Lv 8)', map: 'field', npc: 'toad' },
    { until: 'gym1_done', text: 'ข้ามคันนากลางหนองไปตลาดนัด เข้าร้านราเมง ผ่านม่านลมไปท้าพี่ออสซี่ (แนะนำ Lv 10)', map: 'ramen', npc: 'ossie' },
    { until: 'festival_done', text: 'กลับหมู่บ้าน ไปงานบุญบั้งไฟกับผู้ใหญ่บ้านที่ศาลา', map: 'village', npc: 'elder' },
    { until: 'kku_arrived', text: 'นั่งรถสองแถวของลุงที่ตลาดนัด ไปมหาวิทยาลัยขอนแก่น', map: 'market', npc: 'driver' },
    { until: 'tr_wak1', text: 'ไปโรงช็อปวิศวะ ชนะพี่ว้ากหน้าประตู (แนะนำ Lv 14)', map: 'kku', npc: 'wak1' },
    { until: 'tr_wak2', text: 'ชนะพี่ว้ากอีกคนหน้าโรงช็อป', map: 'kku', npc: 'wak2' },
    { until: 'shop_gate', text: 'ในโรงช็อปไฟดับ! ไปห้องคัตเอาต์ สับไฟให้ติดครบ 4 ดวง', map: 'kku_shop', x: 5, y: 3 },
    { until: 'gym2_done', text: 'ผ่านประตูเหล็กไปท้าพี่เฟรนด์ (แนะนำ Lv 16)', map: 'kku_shop', npc: 'friend' },
  ];

  G.objective = function () {
    const S = G.state, F = S.flags;
    const st = STEPS.find((s) => !F[s.until]);
    if (!st) {
      const engs = [...S.party, ...S.storage].filter((m) => G.DATA.species[m.sp].kind === 'eng').length;
      const all = Object.values(G.DATA.engNames).reduce((a, l) => a + l.length, 0) + 1;
      return { text: `ชวนน้องวิศวะเข้าแก๊ง (${engs}/${all} คน) · ยิม 3 พี่บูมมาในเวอร์ชันหน้า` };
    }
    let x = st.x, y = st.y, map = st.map;
    if (st.npc) { const n = G.DATA.world.npcs.find((n) => n.id === st.npc); x = n.x; y = n.y; map = n.map; }
    return { text: st.text, map, x, y };
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
      <li><b>ปุ่มลัด</b> B กระเป๋า · T ทีม · M แผนที่ · Tab ซ่อน/แสดงแถบทีมและมินิแมพ · แตะการ์ดสมาชิกเพื่อดูข้อมูล</li>
      <li><b>เข้าตึก</b> เดินชนประตู · ออกทางพรมแดงข้างล่าง</li>
      <li><b>ทีม</b> คนแรกในทีมเดินตามและลงสู้ก่อน · เปลี่ยนที่เมนูทีม › ให้เดินตาม · จัดทีม/ฝากสมาชิกที่คลังแก๊ง (เถียงนาตาสี หรือคอมหอพัก)</li>
      <li><b>เหนื่อย</b> พักฟรีที่บ้านหรือศาลา อสม. · บันทึกเกมได้ 3 ช่องที่บ้านหรือในเมนู (Enter)</li>
    </ul>`;
})(window.G = window.G || {});
