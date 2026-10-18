// แถบข้อมูลบนแผนที่: สมาชิกแก๊ง (เลเวล/เลือด), มินิแมพ, ปุ่มลัด กระเป๋า ทีม แผนที่ เมนู
(function (G) {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const hud = $('#hud'), partyEl = $('#party-hud'), mini = $('#minimap'), mctx = mini.getContext('2d');
  const STATUS = { par: 'ชา', slp: 'หลับ', psn: 'ท้องเสีย' };

  // สีของแต่ละช่องบนแผนที่ย่อ
  const MAPCOL = { '.': '#9caf55', f: '#9caf55', ':': '#c47a4a', '#': '#3f6b34', P: '#24402a', w: '#4f8fb0', T: '#6e9b3a',
    R: '#b08a4a', r: '#9a3a2a', A: '#a63a2a', M: '#b5402a', K: '#3a2a24', H: '#6b5040', h: '#d8d0c0', m: '#f2efe4', n: '#2b3f8a',
    D: '#2a1d18', S: '#8a6a4a', o: '#d9b25a', b: '#8a8a8a', '^': '#c5482b', I: '#5a3a22', L: '#a0784e', F: '#8a6a4a',
    a: '#55555e', '+': '#9a9aa2', e: '#cbbfa8', g: '#5f8a3a', J: '#3a6a3a', N: '#8f949e', C: '#e6dcc8', q: '#7d8794', Q: '#6b7480',
    l: '#cbbfa8', j: '#8a6440', z: '#c5482b', i: '#4f8a45', '!': '#d9b25a', '&': '#3f7a34', $: '#c5482b', '?': '#2f6b5a', '@': '#2f6fb0',
    0: '#8a6440', X: '#c5482b', _: '#b8875a', '%': '#4a3a30', x: '#c5482b', '~': '#2b3f8a', E: '#5f6873', '>': '#3a3f48', '<': '#3a3f48',
    O: '#1f1d24', Z: '#5f6873', Y: '#e8dcc0', '2': '#8a3f6b' };
  const mapCache = {};
  function mapImage(id, scale) {
    const key = id + scale;
    if (mapCache[key]) return mapCache[key];
    const rows = G.DATA.maps[id], c = document.createElement('canvas');
    c.width = rows[0].length * scale; c.height = rows.length * scale;
    const x = c.getContext('2d');
    rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { x.fillStyle = MAPCOL[r[i]] || '#9caf55'; x.fillRect(i * scale, y * scale, scale, scale); } });
    mapCache[key] = c;
    return c;
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
  function drawMini() {
    const id = G.state.map, img = mapImage(id, 2);
    if (mini.width !== img.width || mini.height !== img.height) {
      mini.width = img.width; mini.height = img.height;
      mini.style.width = `calc(var(--px) * ${img.width * 0.75})`; mini.style.height = `calc(var(--px) * ${img.height * 0.75})`;
    }
    mctx.drawImage(img, 0, 0);
    for (const n of G.world.npcs) { mctx.fillStyle = n.trainer && !G.state.flags[n.trainer.flag] ? '#d9455a' : '#f6eed8'; mctx.fillRect(n.x * 2, n.y * 2, 2, 2); }
    const obj = G.objective();
    if (G.settings.guide && obj.map === id) { mctx.fillStyle = '#ffd84a'; mctx.fillRect(obj.x * 2 - 1, obj.y * 2 - 1, 4, 4); }
    const blink = Math.floor(performance.now() / 300) % 2;
    mctx.fillStyle = blink ? '#ffffff' : '#18203f';
    mctx.fillRect(G.state.x * 2 - 1, G.state.y * 2 - 1, 4, 4);
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
    const id = G.state.map, rows = G.DATA.maps[id], sc = 14;
    const html = `<div class="choice-title">แผนที่: ${G.DATA.world.maps[id].name}</div>
      <div class="bigmap-wrap"><canvas id="bigmap" width="${rows[0].length * sc}" height="${rows.length * sc}"></canvas></div>
      <div class="legend"><span><i class="me"></i>เรา</span><span><i class="goal"></i>เป้าหมาย</span><span><i class="foe"></i>คนที่ยังไม่ได้สู้</span><span><i class="exit"></i>ทางไปที่อื่น</span></div>`;
    const p = G.ui.panel(html, 'bigmap-sheet');
    const c = document.querySelector('#bigmap'), x = c.getContext('2d');
    x.drawImage(mapImage(id, sc), 0, 0);
    x.font = '17px Itim, Tahoma, sans-serif'; x.textAlign = 'center';
    const label = (t, px, py) => { x.lineWidth = 3; x.strokeStyle = 'rgba(24,32,63,.9)'; x.strokeText(t, px, py); x.fillStyle = '#f6eed8'; x.fillText(t, px, py); };
    for (const d of G.DATA.world.doors.filter((d) => d.map === id && d.to)) label(G.DATA.world.maps[d.to].name.replace(/^(.*?) · .*/, '$1'), d.x * sc + sc / 2, d.y * sc - sc * 1.2);
    const EXTRA = { village: [['ศาลากลางบ้าน', 11.5, 7], ['ดอนปู่ตา', 3.5, 2], ['หนองน้ำ', 5, 22]], field: [['หนองใหญ่ (คางคก)', 24, 13]], market: [['รถสองแถวไป มข.', 20, 11]],
      kku: [['บึงสีฐาน', 38, 26], ['ลานจอดรถ', 22.5, 2], ['หญ้ารก', 16, 30], ['สะพานลำน้ำพอง', 44, 13.5], ['รถสองแถวกลับตลาด', 6, 11.5], ['ลานเฟือง', 12.5, 12.5]] };
    for (const [t, ex, ey] of EXTRA[id] || []) label(t, ex * sc, ey * sc);
    for (const w of G.DATA.world.warps.filter((w) => w.map === id && !G.DATA.world.maps[id].indoor)) {
      x.fillStyle = '#5fb8e0'; x.fillRect(w.x * sc, w.y * sc, sc, sc);
      label('ไป' + G.DATA.world.maps[w.to].name, Math.min(c.width - 80, Math.max(80, w.x * sc + sc / 2)), Math.min(c.height - 6, Math.max(18, w.y * sc + (w.y === 0 ? sc + 18 : -8))));
    }
    for (const n of G.world.npcs) if (n.trainer && !G.state.flags[n.trainer.flag]) { x.fillStyle = '#d9455a'; x.fillRect(n.x * sc, n.y * sc, sc, sc); }
    const obj = G.objective();
    if (obj.map === id) { x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(obj.x * sc + sc / 2, obj.y * sc + sc / 2, sc * 0.55, 0, 7); x.fill(); }
    x.fillStyle = '#ffffff'; x.strokeStyle = '#18203f'; x.lineWidth = 2;
    x.beginPath(); x.arc(G.state.x * sc + sc / 2, G.state.y * sc + sc / 2, sc * 0.45, 0, 7); x.fill(); x.stroke();
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
