// แถบข้อมูลบนแผนที่: สมาชิกแก๊ง (เลเวล/เลือด), มินิแมพ, ปุ่มลัด กระเป๋า ทีม แผนที่ เมนู
(function (G) {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const hud = $('#hud'), partyEl = $('#party-hud'), mini = $('#minimap'), mctx = mini.getContext('2d');
  const STATUS = { par: 'ชา', slp: 'หลับ', psn: 'ท้องเสีย', brn: 'ไฟลวก' };

  // หมุดบนแผนที่: ลูกศรตัวเรา ดาวเป้าหมาย จุดคน
  const star = (x, cx, cy, r, fill) => { x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fillStyle = fill; x.fill(); x.lineWidth = Math.max(1, r / 4); x.strokeStyle = '#18203f'; x.stroke(); };
  const arrow = (x, cx, cy, r, dir, fill) => {
    const a = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[dir] || 0;
    x.save(); x.translate(cx, cy); x.rotate(a); x.beginPath(); x.moveTo(r, 0); x.lineTo(-r * 0.75, -r * 0.75); x.lineTo(-r * 0.35, 0); x.lineTo(-r * 0.75, r * 0.75); x.closePath();
    x.fillStyle = fill; x.fill(); x.lineWidth = Math.max(1, r / 3.5); x.strokeStyle = '#18203f'; x.stroke(); x.restore();
  };
  function pins(x, f, big) {   // f = พิกเซลต่อช่อง
    const F = G.state.flags, id = G.state.map;
    for (const n of G.world.npcs) {
      const foe = n.trainer && !F[n.trainer.flag];
      x.fillStyle = foe ? '#d9455a' : 'rgba(246,238,216,0.9)'; x.beginPath(); x.arc((n.x + 0.5) * f, (n.y + 0.5) * f, f * (foe ? 0.42 : 0.3), 0, 7); x.fill();
      if (foe) { x.lineWidth = Math.max(1, f / 8); x.strokeStyle = '#18203f'; x.stroke(); }
    }
    const obj = G.objective();
    if ((big || G.settings.guide) && obj.map === id) star(x, (obj.x + 0.5) * f, (obj.y + 0.5) * f, f * (big ? 0.75 : 1.1), '#ffd84a');
    arrow(x, (G.state.x + 0.5) * f, (G.state.y + 0.5) * f, f * (big ? 0.7 : 1.05), G.state.dir, '#ffffff');
  }

  // ---------- สมาชิกแก๊ง ----------
  let lastSig = '';
  function renderParty() {
    const P = G.state.party;
    const sig = P.map((m) => `${G.monLook(m)}${m.name}${m.lv}${m.hp}/${m.stats.hp}${m.status}`).join('|') + G.state.follower;
    if (sig === lastSig) return;
    lastSig = sig;
    partyEl.innerHTML = P.map((m, i) => {
      const p = Math.max(0, m.hp / m.stats.hp);
      return `<button class="pm ${m.hp <= 0 ? 'down' : ''}" data-i="${i}" title="ดูข้อมูล ${m.name}">
        <canvas width="16" height="16" data-sprite="${G.monLook(m)}"></canvas>
        <span class="pm-body"><span class="pm-name">${m.name}<em>Lv${m.lv}</em></span>
        <span class="pm-hp"><i style="width:${(p * 100).toFixed(0)}%" class="${p < 0.2 ? 'red' : p < 0.5 ? 'yellow' : ''}"></i></span>
        <span class="pm-num">${m.hp}/${m.stats.hp}${m.status ? ' · ' + STATUS[m.status] : ''}</span></span></button>`;
    }).join('');
    partyEl.querySelectorAll('canvas').forEach((c) => c.getContext('2d').drawImage(G.sprite(c.dataset.sprite), 0, 0));
  }
  partyEl.addEventListener('click', (e) => {
    const b = e.target.closest('.pm'); if (!b) return;
    G.unlockAudio(); G.runScript('_mon', +b.dataset.i);
  });

  // ---------- มินิแมพ ----------
  let miniKey = '', miniBase = null;
  function drawMini() {
    const rows = G.DATA.maps[G.state.map], cols = rows[0].length, nr = rows.length;
    const k = Math.min(1.5, 72 / cols, 54 / nr), dpr = G.dpr || 1, px = G.pxScale || 3;   // แมพใหญ่ (ตัวเมือง) ย่อลงไม่ให้บังจอ
    const f = Math.max(2, Math.round(k * px * dpr)), key = G.world.mapImage().width + '|' + f + '|' + G.state.map + '|' + Object.keys(G.state.flags).length;
    if (key !== miniKey) {   // ภาพแมพจริงย่อลงให้ช่องละ f พิกเซลจอพอดี
      miniKey = key; miniBase = G.downscale(G.world.mapImage(), cols * f, nr * f);
      mini.width = cols * f; mini.height = nr * f; mini.style.width = cols * f / dpr + 'px'; mini.style.height = nr * f / dpr + 'px';
    }
    mctx.drawImage(miniBase, 0, 0);
    pins(mctx, f, false);
  }
  mini.addEventListener('click', () => { G.unlockAudio(); G.runScript('_map'); });

  G.updateGangHud = function (show) {
    show = show && G.settings.hud !== false;
    hud.hidden = !show;
    if (!show) return;
    renderParty();
    drawMini();
  };

  // ---------- แผนที่ใหญ่ ----------
  G.SCRIPTS._map = async function () {
    const id = G.state.map, rows = G.DATA.maps[id], sc = (G.dpr || 1) >= 1.5 ? 32 : 16, u = sc / 16;   // จอความละเอียดสูง วาดแผนที่ละเอียดเป็นสองเท่า
    const html = `<div class="choice-title">แผนที่: ${G.DATA.world.maps[id].name}</div>
      <div class="bigmap-wrap"><canvas id="bigmap" width="${rows[0].length * sc}" height="${rows.length * sc}"></canvas></div>
      <div class="legend"><span><i class="me"></i>เรา</span><span><i class="goal"></i>เป้าหมาย</span><span><i class="foe"></i>คนที่ยังไม่ได้สู้</span><span><i class="exit"></i>ทางไปที่อื่น</span></div>`;
    const p = G.ui.panel(html, 'bigmap-sheet');
    const c = document.querySelector('#bigmap'), x = c.getContext('2d');
    x.imageSmoothingEnabled = false; x.drawImage(G.world.mapImage(), 0, 0, c.width, c.height);
    x.font = `${17 * u}px Itim, Tahoma, sans-serif`; x.textAlign = 'center';
    const label = (t, px, py) => { x.lineWidth = 3 * u; x.strokeStyle = 'rgba(24,32,63,.9)'; x.strokeText(t, px, py); x.fillStyle = '#f6eed8'; x.fillText(t, px, py); };
    for (const d of G.DATA.world.doors.filter((d) => d.map === id && d.to)) label(G.DATA.world.maps[d.to].name.replace(/^(.*?) · .*/, '$1'), d.x * sc + sc / 2, d.y * sc - sc * 1.2);
    const EXTRA = { village: [['ศาลากลางบ้าน', 11.5, 7], ['ดอนปู่ตา', 3.5, 2], ['หนองน้ำ', 5, 22]], donputa: [['ตูบปู่ตา', 6.5, 9.5], ['หนองแม่นาค', 15.5, 2.5], ['ลานตัดไม้', 26, 8]], field: [['หนองใหญ่ (คางคก)', 24, 13]], market: [['รถสองแถวไป มข.', 20, 11]],
      kku: [['บึงสีฐาน', 38, 26], ['ลานจอดรถ', 22.5, 2], ['หญ้ารก', 16, 30], ['สะพานลำน้ำพอง', 44, 13.5], ['รถสองแถวกลับตลาด', 6, 11.5], ['ลานเฟือง', 12.5, 12.5]],
      phong: [['ลำน้ำพอง', 3.5, 9], ['เกาะทราย', 2.5, 1.6], ['ท่าน้ำ', 5, 19], ['ศาลาริมน้ำ', 20.5, 13.6], ['ศาลนางตะเคียน', 24.5, 9.2], ['นาริมพอง', 34, 1.8], ['พงอ้อ', 14, 1.8]],
      amphoe: [['หอนาฬิกา', 20.5, 12.4], ['ตลาดเช้า (ตี 5-9 โมง)', 9, 16.6], ['สวนสาธารณะ', 9, 22], ['วัดริมน้ำ', 13.5, 1.8], ['ซากเจดีย์', 2.5, 7]],
      city: [['บึงแก่นนคร', 14, 2.2], ['ถนนมิตรภาพ', 30, 14.6], ['ถนนคนเดิน (ค่ำ)', 43.5, 39.2], ['สวนสาธารณะ', 55, 18.6], ['ป้ายสองแถว', 4, 18.8], ['ไปสนามบิน →', 58, 13.2]],
      hospital: [['เวชระเบียน', 15, 13], ['จุดคัดกรอง', 3, 8.6]], ward: [['ห้องยา', 20.5, 9.8], ['น้องจ๋า', 3.5, 10.6]] };
    for (const [t, ex, ey] of EXTRA[id] || []) label(t, ex * sc, ey * sc);
    const said = new Set();
    for (const w of G.DATA.world.warps.filter((w) => w.map === id && !G.DATA.world.maps[id].indoor)) {
      x.fillStyle = 'rgba(95,184,224,0.75)'; x.fillRect(w.x * sc, w.y * sc, sc, sc);
      if (said.has(w.to)) continue; said.add(w.to);   // ทางออกกว้างหลายช่อง เขียนชื่อครั้งเดียว
      label('ไป' + G.DATA.world.maps[w.to].name, Math.min(c.width - 80 * u, Math.max(80 * u, w.x * sc + sc / 2)), Math.min(c.height - 6 * u, Math.max(18 * u, w.y * sc + (w.y === 0 ? sc + 18 * u : -8 * u))));
    }
    pins(x, sc, true);
    await p;
  };
  G.SCRIPTS._mon = (i) => (G.state.party[i] ? G.ui.monInfo(G.state.party[i]) : null);
  G.SCRIPTS._bag = () => G.ui.bagMenu();
  G.SCRIPTS._team = () => G.ui.partyMenu();

  document.querySelectorAll('#hud-btns [data-act]').forEach((b) => b.addEventListener('click', () => {
    G.unlockAudio();
    if (G.busy || G.ui.active()) return;
    G.runScript({ bag: '_bag', team: '_team', map: '_map', menu: '_menu' }[b.dataset.act]);
  }));
})(window.G = window.G || {});
