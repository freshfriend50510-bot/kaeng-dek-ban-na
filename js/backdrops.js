// ฉากหลังตอนสู้: ภาพหลายชั้น (ฟ้า → ไกล → กลาง → ใกล้) ตามสถานที่ เปลี่ยนตามช่วงเวลาและฝน มีของขยับเล็กน้อย
// ชั้นนิ่งแคชไว้ตาม bg+แมพ+ช่วงเวลา+ฝน+flag ที่เปลี่ยนหน้าตา แล้ววาดของขยับทับทุกเฟรม
// ฉากกลางแจ้งวาดด้วยสีกลางวันแล้วย้อมสีตามเวลา ไฟ (หน้าต่าง โคม) ลงทะเบียนด้วย P.lit แล้ววาดเรืองแสงหลังย้อม
(function () {
  const G = window.G;
  const W = 240, H = 160, HZ = 70;   // เส้นขอบฟ้า (พื้นเริ่มที่นี่)
  let cache = null;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const tools = (c) => ({
    R: (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); },
    O: (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); },
    E: (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); },
    Poly: (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.fill(); },
    L: (x1, y1, x2, y2, col, w = 1) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); },
  });

  // ---------- ฟ้า ----------
  const SKY = {
    morning: ['#f0b88e', '#f8d8b2', '#fcefd8'], day: ['#58a4d8', '#8cc6e6', '#d8eef0'],
    evening: ['#34407a', '#c9667c', '#f4a85c'], night: ['#060a20', '#121a44', '#2a2d60'], rain: ['#4c5768', '#77828f', '#a3acb4'],
  };
  function drawSky(c, P) {
    const k = P.rain ? 'rain' : P.per, s = SKY[k], g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, s[0]); g.addColorStop(0.6, s[1]); g.addColorStop(1, s[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const { O } = tools(c), glow = (x, y, r, col) => { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); };
    if (P.rain) return;
    if (k === 'night') {
      const r = rng(77);
      for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * 58, b = r(); c.fillStyle = `rgba(255,250,230,${(0.35 + b * 0.6).toFixed(2)})`; c.fillRect(x | 0, y | 0, b > 0.85 ? 2 : 1, b > 0.85 ? 2 : 1); }
      c.fillStyle = 'rgba(180,190,255,0.06)'; c.beginPath(); c.ellipse(70, 26, 90, 10, -0.35, 0, 7); c.fill();   // ทางช้างเผือกจางๆ
      glow(200, 20, 26, 'rgba(230,236,255,0.35)'); O(200, 20, 7, '#f4f2dc'); O(203, 18, 6, s[1]);   // จันทร์เสี้ยว
    } else if (k === 'morning') { glow(42, 56, 40, 'rgba(255,236,170,0.75)'); O(42, 56, 9, '#fff4d0'); }
    else if (k === 'day') { glow(198, 16, 34, 'rgba(255,255,220,0.7)'); O(198, 16, 7, '#fffbe8'); }
    else { glow(182, 60, 50, 'rgba(255,190,110,0.8)'); O(182, 60, 13, '#ffd27a'); O(182, 60, 10, '#ffe8a8'); }
  }
  // เมฆลอยช้าๆ (วาดก่อนชั้นภูมิประเทศ)
  function drawClouds(ctx, t, P) {
    const col = P.rain ? 'rgba(90,98,112,0.85)' : P.per === 'night' ? 'rgba(70,80,130,0.35)' : P.per === 'evening' ? 'rgba(255,190,170,0.7)' : 'rgba(255,255,255,0.75)';
    const n = P.rain ? 7 : 4;
    for (let i = 0; i < n; i++) {
      const sp = 0.0016 + i * 0.0005, x = ((i * 83 + t * sp) % 320) - 40, y = 8 + ((i * 29) % 34), w = 18 + ((i * 13) % 16);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, w, 4.5, 0, 0, 7); ctx.ellipse(x - w * 0.35, y - 3, w * 0.45, 4.5, 0, 0, 7); ctx.ellipse(x + w * 0.3, y - 4, w * 0.4, 5, 0, 0, 7); ctx.fill();
    }
  }

  // ---------- ชิ้นส่วนใช้ซ้ำ ----------
  function hills(c, base, amp, col, seed, f = 0.03) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, HZ + 2);
    for (let x = 0; x <= W; x += 2) c.lineTo(x, base - amp * (0.55 + 0.3 * Math.sin(x * f + seed) + 0.15 * Math.sin(x * f * 2.7 + seed * 3)));
    c.lineTo(W, HZ + 2); c.fill();
  }
  function treeLine(c, y, col, hi, seed, size = 7) {
    const r = rng(seed), { O } = tools(c);
    for (let x = -6; x < W + 8; x += size * 0.9 + r() * size) { const s = size * (0.7 + r() * 0.6); O(x, y - s * 0.4, s, col); if (hi) O(x - s * 0.3, y - s * 0.8, s * 0.45, hi); }
    c.fillStyle = col; c.fillRect(0, y - 2, W, HZ - y + 4);
  }
  function sugarPalm(c, x, y, h, dark) {   // ต้นตาลโตนด ลำต้นตรงยอดเป็นพุ่มกลม
    const { R, L } = tools(c);
    R(x - 1, y - h, 2, h, dark ? '#4a3a2c' : '#6b5440');
    for (let i = 0; i < 11; i++) { const a = -Math.PI + (i / 10) * Math.PI, l = 7 + (i % 2) * 2; L(x, y - h, x + Math.cos(a) * l, y - h + Math.sin(a) * l * 0.8 + 2, dark ? '#2f5a34' : '#4f8a3c', 2); }
    tools(c).O(x, y - h, 3, dark ? '#2a4a2c' : '#3f7a34');
  }
  function bigTree(c, x, y, s, cols) {   // ต้นไม้พุ่มใหญ่ 3 ชั้นสี
    const { R, O } = tools(c);
    R(x - 1.5, y - s * 1.2, 3, s * 1.2, '#5a3d28');
    O(x, y - s * 1.5, s, cols[0]); O(x - s * 0.6, y - s * 1.2, s * 0.7, cols[0]); O(x + s * 0.6, y - s * 1.25, s * 0.7, cols[0]);
    O(x - s * 0.2, y - s * 1.75, s * 0.6, cols[1]); O(x + s * 0.35, y - s * 1.5, s * 0.45, cols[1]); O(x - s * 0.4, y - s * 1.95, s * 0.3, cols[2]);
  }
  function grassGround(c, P, col = ['#9cc85a', '#6e9e3c', '#4f7f2e']) {
    const g = c.createLinearGradient(0, HZ, 0, H); g.addColorStop(0, col[0]); g.addColorStop(0.35, col[1]); g.addColorStop(1, col[2]);
    c.fillStyle = g; c.fillRect(0, HZ, W, H - HZ);
    const r = rng(11);
    for (let i = 0; i < 140; i++) {   // ใบหญ้า ไกลเล็ก ใกล้ใหญ่
      const y = HZ + 2 + r() * r() * (H - HZ), x = r() * W, s = 1 + (y - HZ) / 26;
      c.fillStyle = r() > 0.5 ? 'rgba(200,236,130,0.45)' : 'rgba(40,80,30,0.35)'; c.fillRect(x | 0, y | 0, Math.max(1, s * 0.6), s * 2);
    }
    for (let i = 0; i < 10; i++) { const x = r() * W, y = HZ + 14 + r() * 70; c.fillStyle = ['#f4e46a', '#f4f4ec', '#e88ab0'][i % 3]; c.fillRect(x | 0, y | 0, 2, 2); }   // ดอกหญ้า
  }
  function bush(c, x, y, s, col = '#3f7a34', hi = '#5f9a44') { const { O } = tools(c); O(x, y, s, col); O(x - s * 0.8, y + 1, s * 0.7, col); O(x + s * 0.8, y + 1, s * 0.7, col); O(x - s * 0.2, y - s * 0.4, s * 0.5, hi); }
  function windows(P, R, x0, y0, cols, rows, dx, dy, w, h, day, seed) {   // หน้าต่าง กลางคืนสุ่มเปิดไฟ
    const r = rng(seed);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = x0 + i * dx, y = y0 + j * dy; R(x, y, w, h, day);
      if (r() > 0.45) P.lit(x, y, w, h, r() > 0.8 ? '#bfe4ff' : '#ffd88a');
    }
  }

  // ---------- ฉากกลางแจ้ง ----------
  const OUT = {
    village(c, P) {
      const { R, Poly, O, E } = tools(c);
      hills(c, 54, 12, '#a6bccb', 1.2, 0.022); hills(c, 62, 8, '#86a596', 4.1, 0.04);
      treeLine(c, 66, '#5f8a52', '#76a062', 5, 6);
      // โบสถ์วัด: หลังคาซ้อนสองชั้น ช่อฟ้าทอง
      R(18, 46, 46, 20, '#f2ece0'); R(18, 62, 46, 4, '#d8cdb8'); for (let x = 22; x < 62; x += 8) R(x, 50, 3, 9, '#a8462e');
      Poly([12, 48, 41, 30, 70, 48], '#c4502e'); Poly([20, 40, 41, 24, 62, 40], '#a83a24'); R(12, 47, 58, 2, '#f2c43a'); R(20, 39, 42, 2, '#f2c43a');
      Poly([39, 26, 41, 18, 43, 26], '#f2c43a'); R(11, 44, 2, 5, '#f2c43a'); R(69, 44, 2, 5, '#f2c43a');
      // เจดีย์เล็ก
      R(78, 52, 12, 14, '#f4f0e4'); Poly([77, 52, 84, 34, 91, 52], '#f4f0e4'); R(83, 30, 2, 5, '#f2c43a');
      sugarPalm(c, 104, 66, 30); sugarPalm(c, 126, 66, 24); sugarPalm(c, 232, 66, 34);
      // เรือนไม้ใต้ถุนสูง
      for (const x of [158, 172, 186, 200, 212]) R(x, 54, 2, 13, '#5a3d28');
      R(154, 38, 64, 17, '#9a6a3e'); for (let x = 156; x < 216; x += 4) R(x, 38, 1, 17, '#86592f');
      Poly([148, 40, 186, 22, 224, 40], '#5c4a3e'); R(148, 39, 76, 2, '#3e3028'); R(166, 43, 9, 8, '#3a2a1e'); R(196, 43, 9, 8, '#3a2a1e');
      P.lit(166, 43, 9, 8, '#ffcf7a'); P.lit(196, 43, 9, 8, '#ffcf7a');
      for (let i = 0; i < 6; i++) R(222 + i * 2, 55 + i * 2, 4, 1, '#6b4a2f');   // บันได
      E(186, 66, 40, 3, 'rgba(0,0,0,0.12)');
      // ตุ่มน้ำ ไก่ รั้วไม้ไผ่
      O(146, 62, 4, '#6b3a24'); R(143, 57, 6, 2, '#8a5232');
      for (let x = 0; x < W; x += 5) if (x < 92 || x > 232) R(x, 61, 2, 8, '#c8a868');
      R(0, 63, 92, 1, '#a8884a'); R(0, 66, 92, 1, '#a8884a');
      grassGround(c, P);
      Poly([84, H, 120, HZ, 136, HZ, 150, H], 'rgba(214,180,120,0.55)');   // ทางดินเข้าหมู่บ้าน
      bush(c, 8, 76, 6); bush(c, 230, 78, 7);
    },
    village_anim(ctx, t, P) {   // ควันครัว ไก่จิกดิน
      for (let i = 0; i < 4; i++) { const k = ((t / 2600 + i / 4) % 1); ctx.fillStyle = `rgba(230,230,230,${(0.35 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.arc(214 + Math.sin(k * 6 + i) * 3, 30 - k * 24, 2 + k * 4, 0, 7); ctx.fill(); }
      const peck = Math.sin(t / 220) > 0.6 ? 2 : 0, cx = 136 + Math.sin(t / 3000) * 6;
      ctx.fillStyle = P.night ? '#8a8a9a' : '#f4f0e4'; ctx.fillRect(cx, 74, 6, 4); ctx.fillRect(cx + 5, 71 + peck, 3, 3);
      ctx.fillStyle = '#d9455a'; ctx.fillRect(cx + 6, 70 + peck, 2, 1); ctx.fillStyle = '#f2a03a'; ctx.fillRect(cx + 8, 72 + peck, 1, 1); ctx.fillRect(cx + 1, 78, 1, 2); ctx.fillRect(cx + 4, 78, 1, 2);
    },

    field(c, P) {
      const { R, Poly, O } = tools(c), dry = !P.flags.boss1_done;
      hills(c, 52, 12, '#a8bccc', 2.3, 0.02); hills(c, 60, 7, '#8aa69a', 0.7, 0.05);
      treeLine(c, 64, '#668e56', '#7ca466', 9, 5);
      sugarPalm(c, 20, 66, 26); sugarPalm(c, 30, 66, 20); sugarPalm(c, 214, 66, 30); sugarPalm(c, 168, 64, 18);
      // เถียงนา
      for (const x of [62, 82]) R(x, 54, 2, 13, '#5a3d28'); R(60, 52, 26, 3, '#8a6440'); Poly([56, 46, 73, 36, 90, 46], dry ? '#c4a060' : '#b89650'); R(58, 45, 30, 2, '#8a7040');
      // แปลงนาเป็นแถบตามระยะ คันนาเส้นตัดเข้าหาจุดลับตา
      const rows = [70, 74, 79, 86, 96, 110, 128, 160];
      for (let i = 0; i < rows.length - 1; i++) {
        const y = rows[i], h = rows[i + 1] - y;
        const base = dry ? (i % 2 ? '#c8a874' : '#bc9a66') : P.flags.boss1_done && i === 2 ? '#8ec6d8' : (i % 2 ? '#7eb84a' : '#6aa63c');
        R(0, y, W, h, base); R(0, y, W, 1, dry ? '#a8865a' : '#a8c870');
      }
      c.strokeStyle = dry ? 'rgba(130,96,60,0.6)' : 'rgba(160,200,100,0.7)'; c.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(120 + i * 14, HZ); c.lineTo(120 + i * 70, H); c.stroke(); }
      const r = rng(31);
      if (dry) { c.strokeStyle = 'rgba(110,80,50,0.55)'; for (let i = 0; i < 46; i++) { const x = r() * W, y = HZ + 4 + r() * 86; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3 + r() * 4, y + (r() - 0.5) * 3); c.lineTo(x + 5 + r() * 4, y + 2); c.stroke(); } }
      else for (let i = 0; i < 160; i++) { const y = HZ + 2 + r() * r() * 90, x = r() * W, s = 1 + (y - HZ) / 24; c.fillStyle = r() > 0.4 ? 'rgba(170,220,90,0.8)' : 'rgba(60,110,40,0.5)'; c.fillRect(x | 0, y - s * 2, Math.max(1, s * 0.5), s * 2); }
      // หุ่นไล่กา
      R(228, 56, 2, 16, '#6b4a2f'); R(222, 60, 14, 2, '#6b4a2f'); R(225, 58, 8, 7, '#d9455a'); O(229, 54, 3, '#e8c890'); Poly([224, 53, 229, 48, 234, 53], '#c8a050');
    },
    field_anim(ctx, t, P) {   // นกยางบินผ่าน ลมพัดรวงข้าวเป็นแถบสว่าง
      const x = ((t / 40) % 300) - 30, y = 30 + Math.sin(t / 900) * 4, f = Math.sin(t / 120) > 0 ? -2 : 1;
      ctx.fillStyle = P.night ? 'rgba(200,200,220,0.5)' : '#fbfbf4';
      for (const [dx, dy] of [[0, 0], [-12, 5]]) { ctx.fillRect(x + dx, y + dy, 4, 2); ctx.fillRect(x + dx - 3, y + dy + f, 3, 1); ctx.fillRect(x + dx + 4, y + dy + f, 3, 1); }
      if (P.flags.boss1_done) { const wx = ((t / 14) % 360) - 60; const g = ctx.createLinearGradient(wx - 30, 0, wx + 30, 0); g.addColorStop(0, 'rgba(255,255,200,0)'); g.addColorStop(0.5, 'rgba(255,255,200,0.14)'); g.addColorStop(1, 'rgba(255,255,200,0)'); ctx.fillStyle = g; ctx.fillRect(wx - 30, HZ, 60, 90); }
    },

    market(c, P) {
      const { R, Poly, O } = tools(c);
      // ตึกแถวหลังตลาด
      const cols = ['#e8d8b8', '#d8c8e0', '#f0d0a8', '#c8dcd0', '#e8c8b8', '#d8d0b0'];
      for (let i = 0; i < 6; i++) { const x = i * 40; R(x + 1, 22, 38, 34, cols[i]); R(x, 19, 40, 4, '#8a5a3e'); windows(P, R, x + 6, 27, 3, 2, 11, 11, 6, 7, '#5a7a9a', 40 + i); }
      // เต็นท์แผงลอย ผ้าใบลาย
      const aw = [['#d9455a', '#f4f4ec'], ['#3a8ad8', '#f4f4ec'], ['#4fb05a', '#f4f4ec'], ['#f2a03a', '#f4f4ec'], ['#d9455a', '#f2d24b']];
      for (let i = 0; i < 5; i++) {
        const x = 2 + i * 48, [a, b] = aw[i];
        R(x + 2, 50, 2, 18, '#6b6b6b'); R(x + 40, 50, 2, 18, '#6b6b6b');
        for (let s = 0; s < 44; s += 6) { R(x + s, 42, 6, 9, (s / 6) % 2 ? b : a); }
        for (let s = 0; s < 44; s += 6) Poly([x + s, 51, x + s + 6, 51, x + s + 3, 54], (s / 6) % 2 ? b : a);
        R(x + 3, 58, 38, 7, '#8a6440'); R(x + 3, 58, 38, 1, '#a8825a');   // โต๊ะ
        const goods = [['#f2d24b', '#4fb05a', '#d9455a'], ['#f4f4ec', '#c8a050'], ['#e86a3a', '#f2d24b'], ['#7a3a8a', '#4fb05a'], ['#c8a050', '#f4f4ec']][i];
        for (let g = 0; g < 9; g++) O(x + 7 + g * 4, 56, 2, goods[g % goods.length]);
        P.lit(x + 14, 51, 16, 3, '#ffcf7a');
      }
      // ร่มใหญ่
      Poly([196, 40, 222, 30, 248, 40], '#d9455a'); R(221, 40, 2, 28, '#6b6b6b');
      // พื้นปูนตลาด
      const g = c.createLinearGradient(0, HZ - 4, 0, H); g.addColorStop(0, '#c8bca4'); g.addColorStop(1, '#a89c84'); c.fillStyle = g; c.fillRect(0, HZ - 4, W, H);
      for (let y = HZ; y < H; y += 10 + (y - HZ) / 4) R(0, y, W, 1, 'rgba(90,80,60,0.25)');
      const r = rng(5); for (let i = 0; i < 8; i++) { const x = r() * W, y = HZ + 10 + r() * 60; R(x, y, 8, 6, '#c8783a'); R(x, y, 8, 1, '#e89a5a'); }   // ลังผลไม้
    },
    market_anim(ctx, t, P) {   // ธงราวพลิ้ว + ไฟหลอดกลางคืน
      for (let i = 0; i < 24; i++) {
        const x = i * 10 + 4, y = 10 + Math.sin(i / 23 * Math.PI) * 8, sw = Math.sin(t / 300 + i) * 1.5;
        ctx.fillStyle = ['#d9455a', '#f2d24b', '#3a8ad8', '#4fb05a'][i % 4]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 3.5 + sw, y + 6); ctx.fill();
        if (P.dim) { ctx.fillStyle = (Math.floor(t / 400) + i) % 3 ? '#ffe9a0' : '#fff7d8'; ctx.fillRect(x + 8, y + 1, 2, 2); }
      }
      ctx.strokeStyle = 'rgba(60,60,60,0.6)'; ctx.beginPath(); for (let x = 0; x <= W; x += 4) ctx.lineTo(x, 10 + Math.sin(x / W * Math.PI) * 8); ctx.stroke();
    },

    kku(c, P) {
      const { R, Poly, O } = tools(c);
      treeLine(c, 50, '#6f9a62', '#86b072', 21, 8);
      // ตึกคณะ 5 ชั้น
      R(4, 14, 82, 54, '#e8e0d0'); R(4, 14, 82, 3, '#a8a090'); for (let y = 24; y < 66; y += 10) R(4, y + 6, 82, 2, '#c8c0b0');
      windows(P, R, 9, 19, 7, 5, 11, 10, 7, 6, '#6a8aa8', 3);
      R(36, 56, 18, 12, '#5a6a7a'); R(30, 54, 30, 2, '#8a3a2a');
      // โรงช็อปหลังคาฟันเลื่อย
      R(150, 38, 86, 30, '#9aa3ae'); for (let x = 150; x < 236; x += 14) { Poly([x, 38, x + 14, 28, x + 14, 38], '#7d8794'); R(x + 12, 29, 2, 9, '#cfe4f0'); }
      R(176, 50, 30, 18, '#5f6873'); for (let y = 52; y < 68; y += 3) R(176, y, 30, 1, '#4a525c');   // ประตูม้วน
      windows(P, R, 156, 44, 2, 1, 8, 1, 5, 5, '#6a8aa8', 9); windows(P, R, 214, 44, 2, 1, 8, 1, 5, 5, '#6a8aa8', 10);
      // ต้นราชพฤกษ์ดอกเหลือง
      bigTree(c, 108, 68, 11, ['#5f8a3a', '#f2d24b', '#ffe880']); bigTree(c, 134, 66, 8, ['#5f8a3a', '#f2d24b', '#ffe880']);
      // เสาไฟ
      for (const x of [96, 146]) { R(x, 40, 2, 28, '#5a5a5a'); R(x - 2, 39, 6, 2, '#5a5a5a'); P.lit(x - 2, 41, 6, 2, '#fff2c0'); }
      grassGround(c, P, ['#a8d064', '#78a844', '#58883a']);
      R(0, HZ + 1, W, 4, '#c8c0b0'); R(0, HZ + 1, W, 1, '#e0d8c8');   // ทางเท้า
      bush(c, 12, 78, 6, '#3f7a34'); bush(c, 226, 80, 7, '#3f7a34');
    },
    kku_anim(ctx, t, P) {   // ดอกราชพฤกษ์ร่วง
      for (let i = 0; i < 8; i++) { const k = ((t / 4200 + i / 8) % 1), x = 100 + i * 6 + Math.sin(t / 500 + i) * 6, y = 44 + k * 40; ctx.fillStyle = `rgba(255,224,90,${(1 - k).toFixed(2)})`; ctx.fillRect(x, y, 2, 1); }
    },

    phong(c, P) {
      const { R, Poly, O, L } = tools(c);
      hills(c, 34, 8, '#a6bccb', 3.3, 0.025);
      treeLine(c, 40, '#5f8a52', '#76a062', 41, 7);
      // สะพานคอนกรีตข้ามน้ำ
      R(0, 30, W, 4, '#c8c4bc'); R(0, 34, W, 1, '#8a8680'); for (let x = 10; x < W; x += 36) R(x, 34, 4, 12, '#b0aca4');
      for (let x = 0; x < W; x += 3) R(x, 28, 1, 2, '#a8a49c');
      // ลำน้ำ ไล่สีเข้มลงล่าง สะท้อนฟ้า
      const g = c.createLinearGradient(0, 42, 0, 66); g.addColorStop(0, '#7ab4cc'); g.addColorStop(1, '#4a86a8'); c.fillStyle = g; c.fillRect(0, 42, W, 26);
      R(0, 42, W, 2, 'rgba(60,100,70,0.5)');   // เงาต้นไม้ฝั่งไกลในน้ำ
      // ยอยกปลา (ไม้ไผ่ไขว้)
      L(26, 62, 40, 46, '#6b4a2f'); L(54, 62, 40, 46, '#6b4a2f'); L(40, 46, 60, 40, '#8a6a4a'); c.strokeStyle = 'rgba(240,240,230,0.6)'; c.strokeRect(28, 56, 24, 4);
      // ตลิ่งใกล้ ทรายกับหญ้า
      Poly([0, 64, 60, 66, 140, 63, 240, 66, 240, H, 0, H], '#d8c08a');
      grassGround(c, P, ['#9cc85a', '#6e9e3c', '#4f7f2e']);
      Poly([0, 64, 60, 66, 140, 63, 240, 66, 240, 74, 0, 72], '#d8c08a'); Poly([0, 72, 240, 74, 240, 75, 0, 73], '#b8a070');
      const r = rng(17); for (let i = 0; i < 22; i++) { const x = r() * W; L(x, 76 + r() * 4, x + (r() - 0.5) * 3, 64 + r() * 4, '#4f7f2e'); }   // กก
    },
    phong_anim(ctx, t, P) {   // ประกายน้ำ เรือหางยาวลอยขึ้นลง
      for (let i = 0; i < 18; i++) { const x = (i * 37 + t / (60 + i * 3)) % 260 - 10, y = 46 + (i * 7) % 18, a = 0.25 + 0.25 * Math.sin(t / 300 + i); ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`; ctx.fillRect(x, y, 4 + (i % 3) * 2, 1); }
      const by = 54 + Math.sin(t / 700) * 1.2, bx = 120 + Math.sin(t / 5000) * 10;
      ctx.fillStyle = '#6b3a24'; ctx.beginPath(); ctx.moveTo(bx - 18, by); ctx.lineTo(bx + 18, by); ctx.lineTo(bx + 13, by + 4); ctx.lineTo(bx - 14, by + 4); ctx.fill();
      ctx.fillStyle = '#a85a34'; ctx.fillRect(bx - 18, by, 36, 1); ctx.fillStyle = '#d9455a'; ctx.fillRect(bx - 20, by - 3, 3, 3);
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(bx + 14, by - 2, 4, 3); ctx.strokeStyle = '#5a5a5a'; ctx.beginPath(); ctx.moveTo(bx + 18, by); ctx.lineTo(bx + 30, by + 4); ctx.stroke();
      ctx.fillStyle = '#e8c890'; ctx.fillRect(bx - 4, by - 7, 4, 4); ctx.fillStyle = '#c8a050'; ctx.fillRect(bx - 6, by - 9, 8, 2); ctx.fillStyle = '#3a8ad8'; ctx.fillRect(bx - 4, by - 3, 4, 3);
      ctx.fillStyle = 'rgba(40,70,90,0.3)'; ctx.fillRect(bx - 14, by + 5, 28, 2);
    },

    amphoe(c, P) {
      const { R, Poly, O, L } = tools(c);
      hills(c, 40, 6, '#b0c0cc', 2, 0.03);
      const cols = ['#e8d0a8', '#c8d8e8', '#f0c8b0', '#d8e8c0', '#e8d8e0', '#d0c8b8'];
      for (let i = 0; i < 6; i++) {
        const x = i * 40; if (i === 3) continue;
        R(x + 1, 26, 38, 42, cols[i]); R(x, 23, 40, 4, '#7a4a3a'); R(x + 1, 46, 38, 2, '#a89a88');
        windows(P, R, x + 5, 30, 3, 1, 11, 1, 7, 10, '#5a7a9a', 50 + i);
        R(x + 3, 49, 34, 6, ['#d9455a', '#3a8ad8', '#4fb05a', '', '#f2a03a', '#7a3a8a'][i]); R(x + 6, 51, 20, 2, '#f4f4ec');   // ป้ายร้าน
        R(x + 4, 56, 32, 12, '#4a4a52'); for (let y = 57; y < 68; y += 2) R(x + 4, y, 32, 1, '#5a5a62');
        P.lit(x + 6, 56, 28, 3, '#ffd88a');
      }
      // หอนาฬิกา
      R(126, 8, 28, 60, '#efe6d2'); R(122, 4, 36, 6, '#a63a2a'); Poly([124, 4, 140, -6, 156, 4], '#c4502e'); R(126, 30, 28, 2, '#c8bca4');
      O(140, 20, 8, '#f8f6ec'); c.strokeStyle = '#3a3a3a'; c.beginPath(); c.arc(140, 20, 8, 0, 7); c.stroke(); L(140, 20, 140, 14, '#2a2a2a'); L(140, 20, 144, 21, '#2a2a2a');
      P.lit(133, 13, 14, 14, '#fff6c8');
      R(134, 52, 12, 16, '#6b4a3a');
      // เสาไฟฟ้าและสายไฟห้อย
      for (const x of [8, 108, 212]) { R(x, 18, 3, 50, '#8a8478'); R(x - 6, 22, 15, 2, '#6a6458'); }
      c.strokeStyle = 'rgba(40,40,40,0.7)'; for (const dy of [22, 25]) { c.beginPath(); c.moveTo(9, dy); c.quadraticCurveTo(58, dy + 8, 109, dy); c.quadraticCurveTo(160, dy + 8, 213, dy); c.quadraticCurveTo(230, dy + 4, 240, dy + 3); c.stroke(); }
      // ถนนกับฟุตบาท
      R(0, HZ - 2, W, 4, '#c8c0b0'); R(0, HZ + 2, W, 2, '#8a8478');
      const g = c.createLinearGradient(0, HZ + 4, 0, H); g.addColorStop(0, '#7a7a80'); g.addColorStop(1, '#5a5a62'); c.fillStyle = g; c.fillRect(0, HZ + 4, W, H);
      for (let x = 0; x < W; x += 26) R(x, 108, 14, 2, '#f4f4ec');
      // สามล้อจอด
      R(204, 60, 22, 8, '#3a8ad8'); R(208, 54, 14, 6, '#2a6ab8'); O(208, 69, 3, '#2a2a2a'); O(224, 69, 3, '#2a2a2a'); R(210, 56, 10, 3, '#bfe4ff');
    },
    amphoe_anim(ctx, t, P) {   // ไฟจราจรกะพริบ ฝูงนกพิราบ
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(98, 46, 6, 14); const ph = Math.floor(t / 2500) % 3;
      ['#d9455a', '#f2d24b', '#4fb05a'].forEach((col, i) => { ctx.fillStyle = i === ph ? col : '#444'; ctx.fillRect(99, 47 + i * 4, 4, 3); });
      for (let i = 0; i < 5; i++) { const x = 60 + i * 5 + Math.sin(t / 400 + i) * 2, hop = Math.max(0, Math.sin(t / 300 + i * 2)) * 2; ctx.fillStyle = '#8a8a96'; ctx.fillRect(x, 70 - hop, 3, 2); ctx.fillRect(x + 2, 69 - hop, 1, 1); }
    },

    city(c, P) {
      const { R, Poly, O } = tools(c);
      // ตึกไกลสีจาง
      const r = rng(61);
      for (let x = 0; x < W; x += 10 + r() * 10) { const h = 20 + r() * 26; R(x, 52 - h, 12 + r() * 8, h + 20, '#a8b4c8'); }
      // หอคอยชมวิว
      R(118, 4, 4, 50, '#c8ccd4'); R(112, 16, 16, 8, '#dfe4ea'); R(113, 18, 14, 3, '#7ab0d8'); R(119, 0, 2, 5, '#c8ccd4'); P.lit(113, 18, 14, 3, '#bfe4ff');
      // ตึกสูงกลาง
      for (const [x, w, h, col] of [[0, 30, 50, '#c0c8d4'], [32, 24, 60, '#9aa8bc'], [58, 20, 38, '#b8b0a8'], [150, 26, 54, '#a8b8c8'], [178, 22, 42, '#c8c0b8'], [202, 38, 62, '#98a4b8']]) {
        R(x, HZ - h, w, h, col); R(x, HZ - h, w, 2, 'rgba(255,255,255,0.35)');
        windows(P, R, x + 3, HZ - h + 5, Math.floor((w - 4) / 5), Math.floor((h - 8) / 6), 5, 6, 3, 3, '#6b8fa8', x + h);
      }
      // จอโฆษณา (ภาพเคลื่อนไหวใน anim)
      R(80, 24, 66, 34, '#2a2f48'); R(82, 26, 62, 30, '#1a1d30'); R(108, 58, 4, 12, '#5a5a62');
      // ถนนหลายเลน
      R(0, HZ - 2, W, 4, '#b8b4ac');
      const g = c.createLinearGradient(0, HZ + 2, 0, H); g.addColorStop(0, '#6a6a72'); g.addColorStop(1, '#4a4a52'); c.fillStyle = g; c.fillRect(0, HZ + 2, W, H);
      for (let x = 0; x < W; x += 24) { R(x, 92, 12, 1, '#f2d24b'); R(x + 6, 120, 14, 2, '#f4f4ec'); }
      for (const x of [16, 136, 226]) { R(x, 44, 2, 26, '#4a4a52'); R(x, 44, 8, 2, '#4a4a52'); P.lit(x + 4, 46, 4, 2, '#fff2c0'); }
    },
    city_anim(ctx, t, P) {   // จอ LED เปลี่ยนภาพ ไฟเครื่องบินบนยอดหอ รถวิ่งที่ขอบถนน
      const k = Math.floor(t / 1800) % 3, sh = (t / 30) % 62;
      const g = ctx.createLinearGradient(82, 0, 144, 0);
      [['#7a2ad0', '#e05ad0'], ['#2a7ad0', '#5fe0f0'], ['#d07a2a', '#f2d24b']][k].forEach((col, i) => g.addColorStop(i, col));
      ctx.fillStyle = g; ctx.fillRect(82, 26, 62, 30);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(86, 32, 30, 3); ctx.fillRect(86, 38, 18, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(82 + sh, 26, 3, 30);
      if (Math.floor(t / 600) % 2) { ctx.fillStyle = '#ff4040'; ctx.fillRect(119, 0, 2, 2); }
      for (let i = 0; i < 3; i++) {
        const dir = i % 2 ? 1 : -1, x = dir > 0 ? ((t / (14 + i * 5) + i * 90) % 300) - 30 : 270 - ((t / (16 + i * 4) + i * 70) % 300), y = 74 + i * 6;
        ctx.fillStyle = ['#d9455a', '#f4f4ec', '#3a8ad8'][i]; ctx.fillRect(x, y, 16, 5); ctx.fillStyle = 'rgba(190,230,255,0.9)'; ctx.fillRect(x + 4, y - 3, 8, 3);
        ctx.fillStyle = '#222'; ctx.fillRect(x + 2, y + 5, 3, 2); ctx.fillRect(x + 11, y + 5, 3, 2);
        if (P.dim) { ctx.fillStyle = dir > 0 ? '#fff6c0' : '#ff5040'; ctx.fillRect(dir > 0 ? x + 15 : x, y + 1, 2, 2); }
      }
    },

    forest(c, P) {
      const { R, Poly, O } = tools(c), healed = P.flags.forest_healed;
      // ป่าทึบหลายชั้น ไกลจาง ใกล้เข้ม
      treeLine(c, 30, '#5a7e66', '#6a8e74', 71, 12);
      treeLine(c, 44, '#3f6b46', '#4f7f52', 72, 11);
      const r = rng(73);
      for (let i = 0; i < 9; i++) { const x = i * 28 + r() * 10; R(x, 30, 4, 40, '#4a3424'); R(x + 1, 30, 1, 40, '#5e4430'); }
      treeLine(c, 58, '#2f5a36', '#3f6e40', 74, 10);
      // ตูบปู่ตา ศาลไม้บนเสา มีพวงมาลัยกับของไหว้
      R(116, 48, 3, 20, '#5a3d28'); R(106, 46, 22, 2, '#7a5a3a'); R(108, 36, 18, 10, '#9a6a3e');
      Poly([104, 37, 117, 27, 130, 37], '#a83a24'); R(104, 36, 26, 1, '#f2c43a'); R(114, 39, 6, 7, '#3a2a1e');
      O(110, 44, 2, '#f4f4ec'); O(124, 44, 2, '#f4f4ec'); R(112, 42, 2, 4, '#f2d24b'); R(121, 42, 2, 4, '#f2d24b');
      P.lit(114, 39, 6, 7, '#ffb860');
      for (let i = 0; i < 7; i++) O(108 + i * 3, 47, 1.5, ['#f2a03a', '#f4f4ec', '#e86a8a'][i % 3]);   // มาลัย
      // พื้นป่า ใบไม้แห้ง
      const g = c.createLinearGradient(0, HZ - 4, 0, H); g.addColorStop(0, '#6a7e44'); g.addColorStop(1, '#4a5a30'); c.fillStyle = g; c.fillRect(0, HZ - 4, W, H);
      for (let i = 0; i < 90; i++) { const y = HZ + r() * r() * 90, x = r() * W; c.fillStyle = ['#a8783a', '#c89a4a', '#5e7a3a', '#8a5a2a'][i % 4]; c.fillRect(x | 0, y | 0, 2 + (y - HZ) / 30, 1 + (y - HZ) / 40); }
      // ตอไม้ (ฟื้นแล้วแตกหน่อ) เห็ด รากไม้
      for (const [x, y] of [[30, 76], [206, 80]]) { R(x - 5, y - 6, 10, 7, '#7a5232'); R(x - 5, y - 6, 10, 2, '#c8a070'); if (healed) { O(x, y - 9, 3, '#6ac04a'); O(x + 3, y - 11, 2, '#8ad86a'); } }
      for (const [x, y] of [[54, 82], [58, 84], [186, 78]]) { R(x, y, 1, 3, '#f4f0e4'); O(x + 0.5, y, 2.5, '#d9455a'); }
      bush(c, 6, 70, 8, '#2a4a2c', '#3a5e38'); bush(c, 234, 72, 9, '#2a4a2c', '#3a5e38');
    },
    forest_anim(ctx, t, P) {   // แสงลอดใบไม้ ใบไม้ร่วง หิ่งห้อยกลางคืน
      if (!P.dim && !P.rain) for (let i = 0; i < 4; i++) { const a = 0.08 + 0.04 * Math.sin(t / 1300 + i); ctx.fillStyle = `rgba(255,248,200,${a.toFixed(3)})`; ctx.beginPath(); ctx.moveTo(26 + i * 58, 0); ctx.lineTo(40 + i * 58, 0); ctx.lineTo(60 + i * 58, HZ + 10); ctx.lineTo(38 + i * 58, HZ + 10); ctx.fill(); }
      for (let i = 0; i < 6; i++) { const k = ((t / 6000 + i / 6) % 1), x = (i * 43 + Math.sin(t / 700 + i) * 10) % W, y = k * 90; ctx.fillStyle = ['#c89a4a', '#a8783a', '#7a9a3a'][i % 3]; ctx.fillRect(x, y, 2, 1 + (Math.sin(t / 150 + i) > 0 ? 1 : 0)); }
      if (P.per === 'night' || P.per === 'evening') for (let i = 0; i < 14; i++) { const x = (i * 53 + Math.sin(t / 900 + i) * 14) % W, y = 40 + ((i * 31) % 40) + Math.cos(t / 700 + i) * 5, a = 0.5 + 0.5 * Math.sin(t / 250 + i * 1.7); ctx.fillStyle = `rgba(220,255,140,${(a * 0.8).toFixed(2)})`; ctx.fillRect(x, y, 2, 2); ctx.fillStyle = `rgba(220,255,140,${(a * 0.18).toFixed(2)})`; ctx.fillRect(x - 2, y - 2, 6, 6); }
    },
  };

  // ---------- ฉากในตึก ----------
  const floorPlanks = (c, y0, a, b, line) => { const { R } = tools(c); R(0, y0, W, H - y0, a); for (let y = y0 + 4, i = 0; y < H; y += 5 + i++ * 1.5) { R(0, y, W, 1, line); for (let x = (i * 23) % 40; x < W; x += 40) R(x, y - 4 - i, 1, 4 + i, line); } R(0, y0, W, 2, b); };
  const tileFloor = (c, y0, a, b, shine) => {
    const { R } = tools(c), g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, y0, W, H - y0);
    for (let y = y0, i = 0; y < H; y += 6 + i++ * 2) R(0, y, W, 1, 'rgba(0,0,0,0.1)');
    c.strokeStyle = 'rgba(0,0,0,0.08)'; for (let i = -10; i <= 10; i++) { c.beginPath(); c.moveTo(120 + i * 16, y0); c.lineTo(120 + i * 60, H); c.stroke(); }
    if (shine) { c.fillStyle = shine; c.beginPath(); c.ellipse(120, y0 + 18, 60, 6, 0, 0, 7); c.fill(); }
  };
  const IN = {
    ramen(c, P) {
      const { R, O, Poly } = tools(c);
      R(0, 0, W, 72, '#5a3a2a'); for (let x = 0; x < W; x += 8) R(x, 0, 1, 72, '#4a2e22');
      R(0, 0, W, 6, '#3a241a'); R(0, 64, W, 8, '#7a5236');
      // ผ้าม่านโนเรน
      for (let i = 0; i < 5; i++) { R(80 + i * 16, 6, 15, 22, '#2b3f8a'); R(80 + i * 16, 6, 15, 2, '#1d2c66'); } O(120, 16, 5, '#f4f4ec'); O(120, 16, 3, '#2b3f8a');
      // ป้ายเมนูไม้
      for (let i = 0; i < 6; i++) { const x = i < 3 ? 10 + i * 20 : 166 + (i - 3) * 22; R(x, 12, 16, 26, '#d8b47a'); R(x, 12, 16, 2, '#a8844a'); for (let y = 17; y < 34; y += 5) R(x + 6, y, 4, 3, '#3a241a'); }
      // เคาน์เตอร์กับชามราเมง
      R(0, 46, W, 6, '#a8784a'); R(0, 52, W, 12, '#7a5236'); R(0, 46, W, 1, '#c8986a');
      for (const x of [30, 70, 170, 208]) { Poly([x - 8, 42, x + 8, 42, x + 5, 46, x - 5, 46], '#d9455a'); R(x - 8, 41, 16, 2, '#f4f4ec'); }
      floorPlanks(c, 72, '#8a6440', '#5a3d28', '#74522f');
    },
    ramen_anim(ctx, t) {   // โคมแดงแกว่ง ไอร้อนลอยจากชาม
      for (const [x, k] of [[60, 0], [180, 1.3]]) {
        const sw = Math.sin(t / 900 + k) * 2;
        ctx.fillStyle = '#3a241a'; ctx.fillRect(x, 0, 1, 10);
        const gl = ctx.createRadialGradient(x + sw, 18, 0, x + sw, 18, 24); gl.addColorStop(0, 'rgba(255,140,90,0.35)'); gl.addColorStop(1, 'rgba(255,140,90,0)'); ctx.fillStyle = gl; ctx.fillRect(x - 24, 0, 48, 44);
        ctx.fillStyle = '#d9352a'; ctx.beginPath(); ctx.ellipse(x + sw, 18, 7, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a1a14'; ctx.fillRect(x - 4 + sw, 8, 8, 2); ctx.fillRect(x - 4 + sw, 26, 8, 2);
        ctx.fillStyle = 'rgba(255,220,180,0.5)'; ctx.fillRect(x - 6 + sw, 14, 12, 1); ctx.fillRect(x - 6 + sw, 21, 12, 1);
      }
      for (const x of [30, 70, 170, 208]) for (let i = 0; i < 3; i++) { const k = ((t / 1800 + i / 3 + x / 97) % 1); ctx.fillStyle = `rgba(255,255,255,${(0.4 * (1 - k)).toFixed(2)})`; ctx.fillRect(x - 3 + i * 3 + Math.sin(k * 8 + i) * 2, 40 - k * 16, 1, 3); }
    },

    kku_shop(c, P) {
      const { R, O, Poly } = tools(c);
      R(0, 0, W, 72, '#6a727c'); for (let y = 8; y < 72; y += 8) R(0, y, W, 1, '#5e666f');
      // หลังคาฟันเลื่อยมีกระจกรับแสง
      R(0, 0, W, 12, '#4a525c'); for (let x = 0; x < W; x += 30) { Poly([x, 12, x + 30, 0, x + 30, 12], '#3a424c'); R(x + 26, 1, 3, 11, '#cfe4f0'); }
      // ผนังแขวนเครื่องมือ
      R(10, 18, 56, 34, '#8a7a5a'); for (let x = 14; x < 64; x += 4) for (let y = 22; y < 50; y += 4) R(x, y, 1, 1, '#6a5a3a');
      R(16, 24, 3, 14, '#9aa3ae'); R(14, 24, 7, 3, '#9aa3ae'); R(26, 22, 2, 18, '#d9455a'); R(24, 20, 6, 3, '#8a8a8a'); O(40, 30, 5, '#f2d24b'); O(40, 30, 2, '#8a6a2a'); R(52, 24, 3, 16, '#3a8ad8'); R(50, 38, 7, 3, '#3a3a3a');
      // เครื่องกลึง เครื่องเจาะ
      R(150, 40, 70, 22, '#3a6a5a'); R(150, 40, 70, 3, '#4a8a74'); R(160, 34, 20, 8, '#3a6a5a'); O(204, 46, 5, '#8a9aa4'); R(156, 62, 6, 10, '#2a2a2a'); R(208, 62, 6, 10, '#2a2a2a');
      R(92, 20, 6, 46, '#5a5a62'); R(86, 20, 20, 10, '#d9455a'); R(94, 30, 2, 10, '#c8ccd4'); R(84, 56, 22, 4, '#5a5a62');
      // ป้ายความปลอดภัย
      R(116, 14, 22, 18, '#f2d24b'); Poly([127, 17, 134, 29, 120, 29], '#2a2a2a'); R(126, 21, 2, 4, '#f2d24b');
      // พื้นอีพ็อกซีกับแถบเหลืองดำ
      tileFloor(c, 72, '#7d8a84', '#5a6660', 'rgba(255,255,255,0.08)');
      R(0, 72, W, 3, '#f2d24b'); for (let x = 0; x < W; x += 10) Poly([x, 75, x + 5, 72, x + 8, 72, x + 3, 75], '#2a2a2a');
    },
    kku_shop_anim(ctx, t) {   // สะเก็ดไฟจากหินเจียร
      if ((t / 1600 | 0) % 3 === 0) for (let i = 0; i < 10; i++) { const k = ((t / 400 + i / 10) % 1), x = 204 + Math.cos(i * 0.7) * k * 22, y = 46 - Math.sin(0.3 + i * 0.25) * k * 16 + k * k * 18; ctx.fillStyle = k < 0.5 ? '#fff2a8' : '#f2a03a'; ctx.fillRect(x, y, 1, 1); }
      const a = 0.08 + 0.05 * Math.sin(t / 2000); ctx.fillStyle = `rgba(220,240,255,${a.toFixed(3)})`; for (let x = 26; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 3, 12); ctx.lineTo(x + 16, 72); ctx.lineTo(x + 6, 72); ctx.fill(); }
    },

    hospital(c, P) {
      const { R, O, Poly } = tools(c), m = G.state.map;
      if (m === 'xray' && !P.flags.xray_on) {   // ห้องเอ็กซเรย์มืด มีแค่จอส่องฟิล์ม
        R(0, 0, W, H, '#14181e'); R(0, 72, W, H, '#1c2028');
        R(90, 14, 60, 40, '#2a3038'); R(92, 16, 56, 36, '#3a4a5a'); return;
      }
      R(0, 0, W, 72, '#e4eef0'); R(0, 50, W, 22, '#c8e0e0'); R(0, 48, W, 3, '#9ac0c4');   // ผนังสองสี ราวจับ
      // หน้าต่างมีมู่ลี่
      R(166, 10, 54, 32, '#9fc4dc'); for (let y = 12; y < 42; y += 3) R(166, y, 54, 1, '#e8f0f4'); R(166, 10, 54, 2, '#c8d0d4'); R(192, 10, 2, 32, '#c8d0d4');
      P.lit(166, 10, 54, 32, '#e8f4ff');
      // ป้ายกากบาทกับบอร์ดประกาศ
      R(14, 12, 26, 26, '#f8f8f4'); R(24, 16, 6, 18, '#d9455a'); R(18, 22, 18, 6, '#d9455a');
      R(50, 14, 34, 24, '#c8a878'); R(54, 18, 10, 8, '#f4f4ec'); R(68, 20, 12, 10, '#f2e8a8'); R(56, 28, 8, 7, '#bfe4ff');
      // ม่านกั้นเตียงบนราง
      R(96, 6, 60, 2, '#a8b0b4'); for (let i = 0; i < 6; i++) R(98 + i * 10, 8, 9, 56, i % 2 ? '#a8d8d0' : '#b8e4dc');
      if (m === 'ward') for (const x of [10, 186]) { R(x, 52, 44, 10, '#f4f4f4'); R(x, 50, 12, 4, '#ffffff'); R(x, 62, 44, 3, '#9aa3ae'); R(x + 2, 65, 2, 7, '#7a8288'); R(x + 40, 65, 2, 7, '#7a8288'); R(x + 14, 52, 30, 8, '#8ac4e8'); }
      else { R(70, 30, 2, 40, '#a8b0b4'); R(64, 30, 14, 2, '#a8b0b4'); R(66, 32, 6, 9, 'rgba(190,230,255,0.85)'); R(66, 68, 10, 2, '#7a8288'); }   // เสาน้ำเกลือ
      if (m === 'lab') { R(10, 40, 50, 6, '#f4f4f4'); for (let i = 0; i < 5; i++) { R(14 + i * 9, 30, 4, 10, ['#8fe06a', '#5fb8e0', '#e86a8a', '#f2d24b', '#b08ae0'][i]); R(14 + i * 9, 29, 4, 2, '#f4f4f4'); } }
      tileFloor(c, 72, '#e8ecea', '#c8ceca', 'rgba(255,255,255,0.4)');
      for (const [col, y] of [['#4fb05a', 96], ['#3a8ad8', 102], ['#d9455a', 108], ['#f2d24b', 114]]) R(0, y, W, 3, col);   // เส้นนำทางสี
    },
    hospital_anim(ctx, t, P) {
      if (G.state.map === 'xray') {   // ฟิล์มเอ็กซเรย์เรืองแสงกะพริบ
        const a = P.flags.xray_on ? 0.9 : 0.25 + 0.2 * Math.abs(Math.sin(t / 500));
        ctx.fillStyle = `rgba(200,230,255,${a.toFixed(2)})`; ctx.fillRect(92, 16, 56, 36);
        ctx.fillStyle = 'rgba(40,60,90,0.8)'; ctx.fillRect(118, 20, 4, 28); for (let i = 0; i < 5; i++) { ctx.fillRect(106, 24 + i * 5, 28, 1); }
        ctx.beginPath(); ctx.arc(120, 22, 5, 0, 7); ctx.fill();
        return;
      }
      const k = (t / 1200) % 1; ctx.fillStyle = '#2a3a3a'; ctx.fillRect(196, 50, 30, 18); ctx.strokeStyle = '#5fe08a'; ctx.beginPath();   // จอชีพจร
      for (let x = 0; x < 28; x++) { const p = (x / 28 + k) % 1, y = p > 0.45 && p < 0.5 ? -6 : p > 0.5 && p < 0.55 ? 4 : 0; ctx.lineTo(197 + x, 60 + y); } ctx.stroke();
    },

    clinic(c, P) {
      const { R, O } = tools(c);
      R(0, 0, W, 72, '#dcf0f2'); R(0, 58, W, 14, '#bcdce4'); R(0, 56, W, 2, '#2f8f86');
      // ชั้นยา
      for (const x0 of [8, 176]) { R(x0, 8, 56, 50, '#f4f4ec'); for (let y = 16; y < 56; y += 12) { R(x0, y + 8, 56, 2, '#c8c0a8'); for (let x = x0 + 3; x < x0 + 53; x += 7) R(x, y, 5, 8, ['#d9455a', '#5fb8e0', '#f2d24b', '#4fb05a', '#f4f4ec', '#e88ab0'][(x + y) % 6]); } }
      // โปสเตอร์ล้างมือ ต้นไม้
      R(92, 12, 26, 32, '#f8f8f4'); O(105, 24, 7, '#7cc6de'); R(98, 34, 14, 2, '#3a8ad8'); R(98, 38, 10, 2, '#3a8ad8');
      R(126, 14, 34, 22, '#f8f8f4'); R(130, 18, 26, 3, '#2f8f86'); R(130, 24, 18, 2, '#9aa3ae'); R(130, 28, 22, 2, '#9aa3ae');
      O(146, 50, 6, '#5fae4a'); O(142, 46, 4, '#7cc65a'); R(141, 54, 10, 10, '#b5502f');
      // เคาน์เตอร์จ่ายยา
      R(70, 50, 70, 16, '#f4f4f4'); R(70, 50, 70, 2, '#2f8f86');
      tileFloor(c, 72, '#eef2ee', '#d0d8d2', 'rgba(255,255,255,0.4)');
    },

    arena(c, P) {
      const { R, O, Poly } = tools(c);
      R(0, 0, W, 72, '#100e1c');
      // อัฒจันทร์คนดู
      for (let row = 0; row < 4; row++) { const y = 30 + row * 9; R(0, y, W, 9, row % 2 ? '#1a1630' : '#1e1a38'); for (let x = (row * 5) % 8; x < W; x += 8) { O(x + 3, y + 3, 2.5, '#2e2848'); R(x + 1, y + 5, 5, 4, '#2e2848'); } }
      // จอ LED ยักษ์ (ภาพขยับใน anim)
      R(64, 2, 112, 30, '#0a0b12');
      R(0, 66, W, 6, '#24203a'); R(0, 66, W, 1, '#b04ae8');
      // พื้นเวทีมันวาว
      const g = c.createLinearGradient(0, 72, 0, H); g.addColorStop(0, '#2a2546'); g.addColorStop(1, '#14121f'); c.fillStyle = g; c.fillRect(0, 72, W, H);
      c.strokeStyle = 'rgba(176,74,232,0.35)'; for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(120 + i * 18, 72); c.lineTo(120 + i * 70, H); c.stroke(); }
      for (let y = 78; y < H; y += 10) R(0, y, W, 1, 'rgba(95,224,240,0.18)');
      c.fillStyle = 'rgba(176,74,232,0.25)'; c.beginPath(); c.ellipse(120, 92, 70, 12, 0, 0, 7); c.fill();
    },
    arena_anim(ctx, t, P) {   // จอ LED เคลื่อนไหว สปอตไลต์กวาด ไฟมือถือคนดู
      const k = Math.floor(t / 2200) % 3;
      const g = ctx.createLinearGradient(66, 0, 174, 0); [['#7a2ad0', '#e05ad0', '#5fe0f0'], ['#e05ad0', '#f2a03a', '#7a2ad0'], ['#2a7ad0', '#5fe0f0', '#b04ae8']][k].forEach((col, i) => g.addColorStop(i / 2, col));
      ctx.fillStyle = g; ctx.fillRect(66, 4, 108, 26);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(['VS', 'FIGHT!', 'ESPORT'][k], 120, 21); ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(66 + ((t / 20) % 108), 4, 4, 26);
      for (const [x0, ph, col] of [[20, 0, 'rgba(176,74,232,0.16)'], [220, 2, 'rgba(95,224,240,0.14)']]) {
        const a = Math.sin(t / 1400 + ph) * 0.5, x1 = 120 + Math.sin(a) * 140;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0 - 2, 0); ctx.lineTo(x0 + 2, 0); ctx.lineTo(x1 + 26, H); ctx.lineTo(x1 - 26, H); ctx.fill();
      }
      for (let i = 0; i < 22; i++) { if (Math.sin(t / 300 + i * 2.3) < 0.6) continue; const x = (i * 47) % W, y = 32 + ((i * 13) % 32); ctx.fillStyle = i % 3 ? '#f4f4ec' : '#5fe0f0'; ctx.fillRect(x, y, 1, 2); }
    },

    netcafe(c, P) {
      const { R } = tools(c);
      R(0, 0, W, 72, '#161a2e'); for (let x = 0; x < W; x += 24) R(x, 0, 1, 72, '#1e2338');
      // โปสเตอร์เกม
      for (const [x, col] of [[10, '#7a2ad0'], [46, '#d9455a'], [190, '#2a7ad0']]) { R(x, 8, 26, 34, col); R(x + 3, 30, 20, 3, '#f4f4ec'); R(x + 6, 14, 14, 12, 'rgba(255,255,255,0.25)'); }
      // แถวคอมพิวเตอร์
      R(0, 52, W, 6, '#2a2f48'); for (let x = 74; x < 186; x += 22) { R(x, 36, 18, 14, '#0a0b12'); R(x + 1, 37, 16, 12, '#2a6ab8'); R(x + 8, 50, 2, 3, '#3a3f58'); R(x + 1, 37, 16, 2, 'rgba(255,255,255,0.3)'); P.lit(x + 1, 37, 16, 12, '#5fa8f0'); }
      R(0, 58, W, 14, '#1a1d30');
      tileFloor(c, 72, '#2a2440', '#18162a', null);
      R(0, 72, W, 1, '#e05ad0');
    },
    netcafe_anim(ctx, t) {   // แถบไฟ RGB วิ่ง จอกระพริบ
      for (let x = 0; x < W; x += 4) { const h = (x * 2 + t / 10) % 360; ctx.fillStyle = `hsl(${h},90%,60%)`; ctx.fillRect(x, 50, 4, 2); }
      for (let x = 74, i = 0; x < 186; x += 22, i++) if (Math.sin(t / 700 + i * 1.7) > 0.7) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 1, 37, 16, 12); }
    },

    hotel(c, P) {
      const { R, O, Poly } = tools(c);
      R(0, 0, W, 72, '#efe6d2'); for (let x = 0; x < W; x += 30) R(x, 0, 2, 72, '#e0d4bc');
      R(0, 54, W, 18, '#d8c8a8'); R(0, 52, W, 2, '#c8a050');
      // ภาพวาดกรอบทอง
      for (const x of [20, 186]) { R(x, 14, 34, 26, '#c8a050'); R(x + 2, 16, 30, 22, '#7aa8c8'); Poly([x + 2, 38, x + 14, 26, x + 22, 32, x + 32, 24, x + 32, 38], '#5f8a52'); }
      // ต้นไม้กระถาง
      for (const x of [74, 166]) { R(x - 4, 56, 9, 12, '#c8a050'); O(x, 50, 7, '#4f8a3c'); O(x - 4, 46, 5, '#5fa84a'); O(x + 4, 44, 4, '#6ab854'); }
      // แชนเดอเลียร์
      R(119, 0, 2, 8, '#c8a050'); Poly([104, 8, 136, 8, 128, 18, 112, 18], '#e8d088');
      for (let i = 0; i < 7; i++) { R(106 + i * 4.5, 18, 1, 3 + (i % 2) * 2, '#fff6d0'); P.lit(105 + i * 4.5, 19, 3, 3, '#fff2c0'); }
      // พื้นหินอ่อนลายตาราง
      tileFloor(c, 72, '#f4eee4', '#d8ccb8', 'rgba(255,250,230,0.6)');
      for (let y = 72, i = 0; y < H; y += 12 + i * 3, i++) for (let x = (i % 2) * 20; x < W; x += 40) R(x, y, 20, 12 + i * 3, 'rgba(160,130,90,0.08)');
    },
    hotel_anim(ctx, t) { const a = 0.1 + 0.05 * Math.sin(t / 900); const g = ctx.createRadialGradient(120, 16, 0, 120, 16, 50); g.addColorStop(0, `rgba(255,240,190,${(a * 3).toFixed(2)})`); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(70, 0, 100, 70); },

    airport(c, P) {
      const { R } = tools(c);
      // กระจกบานใหญ่เห็นลานบิน (ฟ้าตามเวลาวาดไว้ด้านหลังแล้ว)
      R(0, 0, W, 6, '#9aa3ae'); for (let x = 0; x < W; x += 40) R(x, 0, 3, 58, '#9aa3ae');
      R(0, 44, W, 14, '#7a8288'); R(0, 44, W, 1, '#c8d0d4'); for (let x = 0; x < W; x += 20) R(x, 50, 10, 1, '#f2d24b');
      R(0, 58, W, 14, '#d8dde0'); R(0, 58, W, 2, '#a8b0b4');
      // ป้ายตารางเที่ยวบิน
      R(80, 62, 80, 9, '#1a1d30'); for (let i = 0; i < 4; i++) R(84 + i * 19, 64, 14, 2, i % 2 ? '#f2d24b' : '#5fe08a');
      tileFloor(c, 72, '#e8ecee', '#c0c8cc', 'rgba(255,255,255,0.5)');
    },
    airport_anim(ctx, t, P) {   // เครื่องบินขึ้นผ่านกระจก
      const k = (t / 9000) % 1, x = -40 + k * 320, y = 40 - k * 30;
      ctx.fillStyle = P.dim ? '#c8ccd8' : '#f4f6f8'; ctx.fillRect(x, y, 28, 4); ctx.fillRect(x + 22, y - 5, 4, 5); ctx.fillRect(x + 8, y + 2, 10, 2);
      ctx.fillStyle = '#3a8ad8'; ctx.fillRect(x + 2, y + 1, 22, 1);
      if (P.dim && Math.floor(t / 400) % 2) { ctx.fillStyle = '#ff4040'; ctx.fillRect(x + 28, y + 1, 2, 2); }
      ctx.fillStyle = '#9aa3ae'; for (let xx = 0; xx < W; xx += 40) ctx.fillRect(xx, 0, 3, 44);
    },

    classroom(c, P) {
      const { R } = tools(c);
      R(0, 0, W, 72, '#e8e0c8'); R(0, 60, W, 12, '#c8b890');
      R(50, 8, 140, 44, '#8a6440'); R(54, 12, 132, 36, '#2f5a46');
      c.strokeStyle = 'rgba(240,240,230,0.75)'; c.beginPath(); c.moveTo(62, 24); c.lineTo(80, 24); c.moveTo(62, 32); c.quadraticCurveTo(80, 18, 100, 34); c.moveTo(120, 20); c.lineTo(170, 20); c.moveTo(120, 28); c.lineTo(156, 28); c.moveTo(120, 36); c.lineTo(164, 36); c.stroke();
      R(60, 48, 120, 3, '#a8845a'); R(70, 46, 6, 2, '#f4f4ec');
      R(8, 12, 30, 22, '#f4f4ec'); R(202, 12, 30, 40, '#9fc4dc'); R(216, 12, 2, 40, '#e8e0c8');
      floorPlanks(c, 72, '#b89a6a', '#8a6a3a', '#a08454');
      for (const x of [10, 70, 150, 210]) { R(x, 82, 26, 4, '#c8a070'); R(x + 2, 86, 2, 8, '#7a5a3a'); R(x + 22, 86, 2, 8, '#7a5a3a'); }
    },

    shop(c, P) {   // ร้านค้าทั่วไป/ร้านสะดวกซื้อ/ร้านยา: ชั้นวางของ
      const { R } = tools(c);
      R(0, 0, W, 72, '#eef0f0'); R(0, 0, W, 8, '#3a8ad8'); R(0, 8, W, 2, '#f2d24b');
      for (const x0 of [6, 86, 166]) { R(x0, 14, 68, 54, '#c8ccd0'); for (let y = 18; y < 66; y += 12) { R(x0, y + 9, 68, 2, '#9aa3ae'); for (let x = x0 + 3; x < x0 + 64; x += 6) R(x, y + (x % 3), 4, 9 - (x % 3), ['#d9455a', '#f2d24b', '#4fb05a', '#3a8ad8', '#f2a03a', '#f4f4ec'][((x / 6 | 0) * 5 + y * 3 + x0) % 6]); } }
      tileFloor(c, 72, '#f4f6f6', '#d4d8da', 'rgba(255,255,255,0.5)');
    },

    temple(c, P) {   // ในโบสถ์: เสาแดงลายทอง ภาพจิตรกรรมฝาผนัง เทียน
      const { R, O, Poly } = tools(c);
      R(0, 0, W, 72, '#8a2e22'); R(0, 0, W, 4, '#5a1a14');
      for (let x = 30; x < W; x += 60) { R(x - 20, 10, 40, 40, '#e8d8a8'); Poly([x - 16, 46, x - 6, 30, x + 4, 46], '#5f8a52'); O(x + 8, 22, 5, '#f2c43a'); R(x - 14, 40, 28, 2, '#4a7aa8'); R(x - 20, 10, 40, 2, '#c8a050'); R(x - 20, 48, 40, 2, '#c8a050'); }
      for (const x of [0, 58, 118, 178, 236]) { R(x, 0, 6, 72, '#a8261c'); for (let y = 4; y < 72; y += 8) R(x + 1, y, 4, 3, '#f2c43a'); }
      R(0, 60, W, 12, '#6a2018'); R(0, 58, W, 2, '#f2c43a');
      for (const x of [96, 144]) { R(x, 50, 3, 9, '#f4f0e0'); P.lit(x, 48, 3, 3, '#ffb860'); }
      floorPlanks(c, 72, '#a8784a', '#6b4a2f', '#8a6038');
      R(60, 90, 120, 50, 'rgba(160,40,30,0.35)'); R(62, 92, 116, 1, 'rgba(242,196,58,0.5)');
    },
    temple_anim(ctx, t) { for (const x of [97, 145]) { const f = Math.sin(t / 120 + x) * 0.8; ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.ellipse(x + 0.5 + f * 0.4, 46, 1.4, 2.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,200,100,0.18)'; ctx.fillRect(x - 5, 40, 11, 12); } },

    wood(c, P) {   // บ้านไม้/ร้านทั่วไป
      const { R, O } = tools(c);
      R(0, 0, W, 72, '#c8a878'); for (let x = 0; x < W; x += 10) R(x, 0, 1, 72, '#b0905e'); R(0, 58, W, 14, '#a8885a'); R(0, 56, W, 2, '#7a5a3a');
      R(170, 12, 40, 30, '#7a5a3a'); R(173, 15, 34, 24, '#a8d0e4'); R(189, 15, 2, 24, '#7a5a3a'); P.lit(173, 15, 34, 24, '#ffd88a');
      R(20, 14, 30, 20, '#f4f0e0'); R(23, 17, 24, 14, '#e8c890');   // รูปติดผนัง
      R(84, 28, 16, 2, '#7a5a3a'); O(92, 22, 6, '#d9455a'); R(118, 6, 1, 12, '#3a2a1e'); O(118, 20, 4, '#f2e8a8'); P.lit(115, 18, 7, 5, '#fff2c0');   // หลอดไฟ
      floorPlanks(c, 72, '#a8845a', '#7a5a3a', '#94744a');
    },
  };
  // แมพในตึกที่ใช้ฉากแบบเดียวกัน
  const ALIAS = { lecture: 'classroom', school: 'classroom', cstore: 'shop', store: 'shop', osm: 'shop', pharmacy: 'shop', arena_lobby: 'arena', arena_practice: 'arena', arena_stage: 'arena' };

  function pick(bg) {
    if (OUT[bg] && typeof OUT[bg] === 'function' && !bg.endsWith('_anim')) return { out: true, key: bg };
    const def = G.world && G.world.def;
    if (IN[bg]) return { out: false, key: bg };
    const m = G.state.map;
    if (IN[ALIAS[bg]]) return { out: false, key: ALIAS[bg] };
    if (def && def.indoor) return { out: false, key: IN[m] ? m : ALIAS[m] || (def.floor === '-' ? 'shop' : 'wood') };
    return { out: true, key: OUT[m] ? m : 'village' };
  }
  const flagKey = (f) => [f.boss1_done, f.forest_healed, f.xray_on].map((x) => (x ? 1 : 0)).join('');

  function build(sel, P) {
    const sky = mk(), land = mk(), lights = [];
    P.lit = (x, y, w, h, col) => { if (w > 0) lights.push([x, y, w, h, col]); };
    const sc = sky.getContext('2d'), lc = land.getContext('2d');
    if (sel.out || sel.key === 'airport') drawSky(sc, P); else sc.clearRect(0, 0, W, H);
    (sel.out ? OUT : IN)[sel.key](lc, P);
    // ย้อมสีตามเวลา (เฉพาะกลางแจ้ง; ในตึกย้อมแค่ตอนสนามบินมองเห็นข้างนอก)
    const tint = !sel.out ? null : P.rain ? 'rgba(50,60,80,0.32)' : { morning: 'rgba(255,180,110,0.12)', evening: 'rgba(200,90,70,0.22)', night: 'rgba(14,22,70,0.58)' }[P.per];
    if (tint) { lc.globalCompositeOperation = 'source-atop'; lc.fillStyle = tint; lc.fillRect(0, 0, W, H); lc.globalCompositeOperation = 'source-over'; }
    // ไฟเรือง (กลางคืน/เย็น/ฝน หรือในตึกเสมอแบบอ่อน)
    const glowA = !sel.out ? 0.25 : P.per === 'night' ? 1 : P.per === 'evening' || P.rain ? 0.55 : 0;
    if (glowA) for (const [x, y, w, h, col] of lights) {
      lc.globalAlpha = glowA; lc.fillStyle = col; lc.fillRect(x, y, w, h);
      const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) * 1.4 + 4, g = lc.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, hexA(col, 0.22)); g.addColorStop(1, hexA(col, 0)); lc.fillStyle = g; lc.fillRect(cx - r, cy - r, r * 2, r * 2);
      lc.globalAlpha = 1;
    }
    return { sky, land };
  }
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  G.drawBackdrop = function (ctx, bg, now) {
    const sel = pick(bg), f = G.state.flags || {};
    const per = G.period(), rain = sel.out && G.raining();
    const key = [sel.key, G.state.map, per, rain ? 1 : 0, flagKey(f)].join('|');
    const P = { per, rain, night: per === 'night', dim: per === 'night' || per === 'evening' || rain, flags: f };
    if (!cache || cache.key !== key) cache = Object.assign(build(sel, P), { key });
    ctx.drawImage(cache.sky, 0, 0);
    if (sel.out || sel.key === 'airport') drawClouds(ctx, now, P);
    ctx.drawImage(cache.land, 0, 0);
    const anim = (sel.out ? OUT : IN)[sel.key + '_anim'];
    if (anim) anim(ctx, now, P);
    if (rain) for (let i = 0; i < 12; i++) {   // วงน้ำกระเพื่อมบนพื้น
      const k = ((now / 900 + i * 0.37) % 1), x = (i * 61) % W, y = HZ + 8 + ((i * 23) % 70);
      ctx.strokeStyle = `rgba(220,230,255,${(0.5 * (1 - k)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(x, y, 1 + k * 6, 0.5 + k * 2, 0, 0, 7); ctx.stroke();
    }
  };
  G.backdropKeys = () => [...Object.keys(OUT).filter((k) => !k.endsWith('_anim')), ...Object.keys(IN).filter((k) => !k.endsWith('_anim'))];
})();
