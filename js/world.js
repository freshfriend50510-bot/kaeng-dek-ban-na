// แผนที่ การเดิน NPC การเจอผีสาง และกลางวัน-กลางคืน
// ความหมายตัวอักษรในแผนที่ (data_src/*.txt):
//  .  ดิน/หญ้า      :  ทางดินแดง     #  ต้นไม้        P  ป่าดอนปู่ตา    w  น้ำ
//  T  ต้นข้าว (ในแผนที่ที่มีผีสาง = สุ่มเจอ)       R  หลังคามุงแฝก   r  หลังคาสังกะสี
//  H  ฝาไม้          h  ผนังปูน      D  ประตู (เดินชน = เข้า)          S  ป้าย
//  F  รั้ว           o  กองฟาง       b  บ่อน้ำ        f  ดอกไม้        ^  ศาลปู่ตา
//  M  หลังคาสิม      m  ผนังสิม      A  หลังคาศาลา   I  เสาศาลา       L  พื้นศาลา
//  K  หลังคาร้านราเมง  n  ผ้าม่านร้านราเมง
// ในเมือง (มข.):
//  a  ถนนลาดยาง     e  ทางเท้าปูอิฐ   +  ทางม้าลาย    g  หญ้ารก (สุ่มเจอน้องวิศวะ)   J  ต้นจามจุรี
//  N  หลังคาตึก     C  ผนังตึกมีหน้าต่าง   q  หลังคาโรงช็อป   Q  ผนังโรงช็อป   l  เสาไฟ (ติดตอนค่ำ)
//  j  ม้านั่ง        z  มอไซค์จอด      i  บัวในบึง      !  อนุสาวรีย์เฟือง   &  พุ่มไม้ตัด
//  $  ตู้กดน้ำ       ?  ป้ายประกาศ     @  รถสองแถว     0  สะพานไม้      X  ประตูกั้น (เปิดเมื่อมี flag ใน gates)
// ในตึก:
//  _  พื้นในตึก (ไม้/ปูนตาม floor ของแผนที่)   %  ผนัง    x  พรมหน้าประตู (เดินทับ = ออก)
//  t  โต๊ะ  c  เคาน์เตอร์ (คุยข้ามได้)  k  เตา  s  ชั้นวาง  B  เตียง  p  กระถางต้นไม้  W  ทีวี  G  ไห/ขวดใหญ่
//  ~  ม่านผ้า (ม่านหลอกดู curtains)  E  เครื่องจักร  > <  สายพานพาเลื่อน  O  คราบน้ำมันลื่น
//  Z  คัตเอาต์  Y  หลอดไฟบนผนัง  V  แท่นพระ  u  กระดานดำ  6  เครื่องปั่น  7  กระทะ  8  โต๊ะหมูกระทะ  9  คอมพิวเตอร์  2  พรม
(function (G) {
  'use strict';
  const TS = 16, VW = 15, VH = 10;
  const WALK = '.:fTL_-x~><O2aeg+0';   // ต้องตรงกับ WALK ใน tools/build_data.py
  const COUNTER = 'c67';              // คุยกับคนหลังเคาน์เตอร์ได้
  G.world = { npcs: [], map: null, rows: null, moving: null, anim: 0, follow: null };
  const W = G.world;

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

  const tileCache = {};
  // var = ตัวเลือกเพิ่ม เช่น ผนังด้านหน้า/บน พื้นของแผนที่ เฟรมน้ำ
  function tileCanvas(ch, x, y, frame, vr) {
    const v = Math.floor(hash(x, y) * 4);
    const anim = 'w~><i'.includes(ch);   // vr ของน้ำ/ข้าว: dry = ก่อนฝนตก, mud = ขอบหนองแห้ง, lotus = บัวหลังฝน
    const key = ch + v + (anim ? frame : '') + (vr || '');
    if (tileCache[key]) return tileCache[key];
    const c = document.createElement('canvas'); c.width = c.height = TS;
    const g = c.getContext('2d');
    const R = (col, a, b, w, h) => { g.fillStyle = col; g.fillRect(a, b, w, h); };
    const O = (col, cx, cy, rx, ry) => { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.fill(); };
    const grass = () => { R('#9caf55', 0, 0, 16, 16); const s = hash(v, 7); R('#879d48', (s * 13) | 0, 3, 1, 2); R('#b6c46a', ((s * 7) | 0) + 6, 10, 1, 1); R('#879d48', 11, ((s * 9) | 0) + 4, 1, 2); };
    const pave = () => { R('#cbbfa8', 0, 0, 16, 16); R('#b5a88e', 0, 7, 16, 1); R('#b5a88e', 0, 15, 16, 1); R('#b5a88e', (v % 2) * 8 + 3, 0, 1, 7); R('#b5a88e', (v % 2) * 8 + 11 - 8 * (v % 2), 8, 1, 7); };
    const water = () => { R('#4f8fb0', 0, 0, 16, 16); R('#7cb6cf', (frame * 5 + v * 3) % 12, 4, 4, 1); R('#7cb6cf', (frame * 3 + 8 + v) % 12, 11, 3, 1); };
    const wood = () => { R('#b8875a', 0, 0, 16, 16); for (let i = 3; i < 16; i += 4) R('#a07448', 0, i, 16, 1); R('#a07448', (v * 5) % 16, 0, 1, 3); R('#a07448', (v * 7 + 8) % 16, 4, 1, 3); };
    const tilefl = () => { R('#d8d6cc', 0, 0, 16, 16); R('#c4c2b8', 0, 0, 16, 1); R('#c4c2b8', 0, 0, 1, 16); R('#c4c2b8', 8, 0, 1, 16); R('#c4c2b8', 0, 8, 16, 1); };
    const floor = () => (vr === 'F-' ? tilefl() : wood());
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
      case 'w':
        if (vr === 'mud') {   // โคลนแห้งแตกระแหง ลายรอยแตกสุ่มต่อช่อง
          R('#a8845a', 0, 0, 16, 16); R('#b8946a', 0, 0, 16, 1);
          g.strokeStyle = '#7f6040'; g.lineWidth = 1; g.beginPath();
          let cx = 1 + hash(x, y + 9) * 4, cy = 2 + hash(x + 3, y) * 4; g.moveTo(cx, cy);
          for (let k = 0; k < 4; k++) { cx += 2 + hash(x + k, y * 7) * 3; cy += (hash(x * 5, y + k) - 0.4) * 5; g.lineTo(Math.min(15, cx), Math.max(1, Math.min(15, cy))); }
          const bx = 3 + hash(y, x) * 8; g.moveTo(bx, 9); g.lineTo(bx + 1.5, 12.5); g.lineTo(bx - 1, 15); g.stroke();
          R('#c9a87a', (v * 5) % 12 + 2, 13, 2, 1); break;
        }
        water();
        if (vr === 'lotus') { O('#4f8a45', 7, 9, 5, 3); O('#5f9a50', 11, 6, 3, 2); O('#f2a0c0', 7, 7, 2, 2.5); R('#fff2f6', 7, 5, 1, 1); }
        break;
      case 'T':
        if (vr === 'dry') { R('#a89a50', 0, 0, 16, 16); for (let i = 0; i < 5; i++) { R('#8a7a3a', i * 3 + 1, 6 + (i % 2) * 3, 1, 6); R('#c9b86a', i * 3 + 1, 5 + (i % 2) * 3, 1, 2); } R('#8a7a3a', 0, 15, 16, 1); break; }
        R('#6e9b3a', 0, 0, 16, 16); for (let i = 0; i < 5; i++) { R('#4f7a2a', i * 3 + 1, 4 + (i % 2) * 3, 1, 8); R('#a8c45a', i * 3 + 1, 3 + (i % 2) * 3, 1, 2); } break;
      case 'R': R('#b08a4a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 3) R('#8a6a34', 0, i, 16, 1); R('#c9a45a', v * 3, 1, 3, 1); break;
      case 'r': R('#9a3a2a', 0, 0, 16, 16); for (let i = 1; i < 16; i += 4) R('#7a2a1e', i, 0, 1, 16); R('#b85a44', 0, 0, 16, 1); break;
      case 'A': R('#a63a2a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#86281c', 0, i + 3, 16, 1); R('#d9b25a', 0, 15, 16, 1); break;
      case 'M': R('#b5402a', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#8e2c1c', 0, i + 3, 16, 1); R('#d9b25a', 0, 0, 16, 1); R('#d9b25a', 0, 15, 16, 1); break;
      case 'K': R('#3a2a24', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) R('#2a1d18', 0, i + 3, 16, 1); break;
      case 'H': R('#6b5040', 0, 0, 16, 16); for (let i = 3; i < 16; i += 4) R('#54402f', 0, i, 16, 1); R('#3a2a20', 0, 15, 16, 1); break;
      case 'h': case 'm': R(ch === 'm' ? '#f2efe4' : '#d8d0c0', 0, 0, 16, 16); R('#b8b0a0', 0, 15, 16, 1); if (v % 2) { R('#6b8fa8', 4, 4, 8, 6); R('#3a2a20', 4, 4, 8, 1); } break;
      case 'n': R('#2b3f8a', 0, 0, 16, 16); R('#1f2f6b', 7, 0, 1, 16); R('#f4f4ec', 3, 5, 3, 3); R('#f4f4ec', 10, 5, 3, 3); break;
      case 'D':
        if (vr === 'DC') { R('#e6dcc8', 0, 0, 16, 16); R('#5a6a7a', 2, 1, 12, 15); R('#9fc4dc', 3, 2, 4, 13); R('#9fc4dc', 9, 2, 4, 13); R('#d9b25a', 7, 8, 2, 1); }
        else if (vr === 'DQ') { R('#7d8794', 0, 0, 16, 16); R('#3a3f48', 1, 1, 14, 15); for (let i = 3; i < 16; i += 3) R('#555c66', 1, i, 14, 1); R('#f2d24b', 1, 1, 14, 1); }
        else { R('#6b5040', 0, 0, 16, 16); R('#3a2a20', 3, 1, 10, 15); R('#2a1d18', 4, 2, 8, 14); R('#d9b25a', 10, 9, 1, 1); }
        break;
      case 'S': grass(); R('#5a3a22', 7, 9, 2, 7); R('#8a6a4a', 2, 3, 12, 7); R('#6b5040', 2, 9, 12, 1); R('#3a2a20', 4, 5, 8, 1); R('#3a2a20', 4, 7, 6, 1); break;
      case 'F': grass(); R('#8a6a4a', 0, 6, 16, 2); R('#8a6a4a', 0, 11, 16, 2); R('#6b5040', 2, 4, 2, 11); R('#6b5040', 12, 4, 2, 11); break;
      case 'o': grass(); O('#d9b25a', 8, 10, 7, 6); R('#b08a3a', 3, 9, 10, 1); R('#e9c86a', 6, 5, 3, 1); break;
      case 'b': grass(); O('#8a8a8a', 8, 10, 7, 5); O('#2a4a5a', 8, 9, 5, 3); R('#6b5040', 2, 0, 1, 9); R('#6b5040', 13, 0, 1, 9); R('#6b5040', 2, 0, 12, 1); break;
      case '^': R('#24402a', 0, 0, 16, 16); R('#5a3a22', 7, 10, 2, 6); R('#f2efe4', 4, 5, 8, 6); R('#c5482b', 3, 2, 10, 3); R('#d9b25a', 7, 7, 2, 2); break;
      case 'I': R('#a0784e', 0, 0, 16, 16); R('#5a3a22', 6, 0, 4, 16); break;
      case 'L': R('#a0784e', 0, 0, 16, 16); for (let i = 3; i < 16; i += 4) R('#8a6440', 0, i, 16, 1); break;
      // ---------- เมือง ----------
      case 'a': R('#55555e', 0, 0, 16, 16); R('#62626b', (v * 5) % 14, 4, 2, 1); R('#4a4a52', (v * 3 + 7) % 14, 11, 2, 1); if (vr === 'lane') R('#f2d24b', 3, 15, 10, 1); break;
      case '+': R('#55555e', 0, 0, 16, 16); for (let i = 1; i < 16; i += 5) R('#eeeae0', i, 1, 3, 14); break;
      case 'e': pave(); break;
      case 'g': R('#5f8a3a', 0, 0, 16, 16); for (let i = 0; i < 6; i++) { const xx = (i * 5 + v) % 15; R('#3f6a2a', xx, 2 + (i % 3) * 2, 1, 10); R('#8fbf5a', xx + 1, 1 + (i % 3) * 2, 1, 4); } R('#3f6a2a', 0, 15, 16, 1); break;
      case 'J': grass(); O('#3a6a3a', 8, 6, 8, 6); O('#4f8a45', 6, 4, 4, 3); O('#e88aa8', 4 + v, 3, 1, 1); O('#e88aa8', 11 - v, 6, 1, 1); O('#e88aa8', 9, 2 + v, 1, 1); R('#5a3a22', 7, 11, 2, 5); break;
      case 'N': R('#8f949e', 0, 0, 16, 16); R('#a6abb5', 0, 0, 16, 1); R('#7a7f89', 0, 15, 16, 1); if (v === 2) { R('#6a6f79', 4, 5, 6, 4); R('#b8bcc4', 5, 6, 4, 1); } break;
      case 'C': R('#e6dcc8', 0, 0, 16, 16); R('#c9bea8', 0, 15, 16, 1); R('#5a7a9a', 3, 3, 10, 7); R('#9fc4dc', 4, 4, 4, 5); R('#e6dcc8', 7, 3, 1, 7); R('#b5aa94', 2, 10, 12, 1); break;
      case 'q': R('#7d8794', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) { R('#9aa3ae', 0, i, 16, 1); R('#5f6873', 0, i + 3, 16, 1); } R('#c5ccd4', 0, 0, 16, 1); break;
      case 'Q': R('#7d8794', 0, 0, 16, 16); for (let i = 1; i < 16; i += 2) R('#6b7480', i, 0, 1, 16); R('#4a515a', 0, 15, 16, 1); if (v === 1) { R('#f2d24b', 3, 4, 10, 3); R('#2a2a2a', 4, 5, 8, 1); } break;
      case 'l': pave(); R('#3a3f48', 7, 3, 2, 13); R('#3a3f48', 5, 2, 6, 2); R('#fff2a8', 6, 4, 4, 1); R('#2a2a2a', 6, 14, 4, 2); break;
      case 'j': pave(); R('#8a6440', 1, 7, 14, 2); R('#8a6440', 1, 10, 14, 2); R('#3a3f48', 2, 12, 1, 3); R('#3a3f48', 13, 12, 1, 3); R('#6b4a2f', 1, 4, 14, 2); break;
      case 'z': pave(); for (const [xx, col] of [[1, '#c5482b'], [8, '#2b3f8a']]) { O('#2a2a2a', xx + 1, 12, 2, 2); O('#2a2a2a', xx + 5, 12, 2, 2); R(col, xx, 7, 6, 4); R('#2a2a2a', xx + 4, 5, 1, 3); R('#b8bcc4', xx + 3, 5, 3, 1); } break;
      case 'i': water(); O('#4f8a45', 8, 9, 6, 4); O('#f2a0c0', 8, 7, 2, 3); R('#fff2f6', 8, 5, 1, 1); break;
      case '!': pave(); R('#8f949e', 3, 11, 10, 5); R('#b8bcc4', 3, 11, 10, 1); g.fillStyle = '#d9b25a'; g.beginPath(); g.arc(8, 6, 5, 0, 7); g.fill();
        for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; R('#d9b25a', 7 + Math.round(Math.cos(a) * 6), 5 + Math.round(Math.sin(a) * 6), 2, 2); }
        g.fillStyle = '#8a6a24'; g.beginPath(); g.arc(8, 6, 2, 0, 7); g.fill(); break;
      case '&': grass(); R('#3f7a34', 1, 3, 14, 12); R('#5a9a45', 2, 3, 12, 3); R('#2f5a2a', 1, 14, 14, 1); break;
      case '$': pave(); R('#c5482b', 3, 1, 10, 15); R('#e8e2d0', 4, 3, 5, 8); R('#2a2a2a', 10, 4, 2, 3); R('#5fb8e0', 5, 4, 1, 2); R('#f2d24b', 7, 4, 1, 2); R('#6cc04a', 5, 7, 1, 2); R('#2a2a2a', 4, 12, 8, 2); break;
      case '?': pave(); R('#5a3a22', 3, 10, 2, 6); R('#5a3a22', 11, 10, 2, 6); R('#2f6b5a', 1, 2, 14, 9); R('#f4f4ec', 3, 4, 5, 3); R('#f2d24b', 9, 4, 4, 2); R('#f4f4ec', 9, 7, 4, 2); break;
      case '@': R('#55555e', 0, 0, 16, 16); R('#2f6fb0', 0, 3, 16, 10); R('#9fc4dc', 2, 4, 5, 3); R('#9fc4dc', 9, 4, 5, 3); R('#1f4f80', 0, 12, 16, 1); O('#2a2a2a', 4, 14, 2, 2); O('#2a2a2a', 12, 14, 2, 2); R('#f2d24b', 0, 8, 16, 1); break;
      case '0': water(); R('#8a6440', 0, 1, 16, 14); for (let i = 3; i < 16; i += 4) R('#6b4a2f', i, 1, 1, 14); R('#5a3a22', 0, 1, 16, 1); R('#5a3a22', 0, 14, 16, 1); break;
      // ---------- ในตึก ----------
      case '_': floor(); break;
      case '%':
        if (vr === 'face') { R('#e8dcc0', 0, 0, 16, 16); R('#d4c6a6', 0, 4, 16, 1); R('#8a6a4a', 0, 13, 16, 3); if (v === 3) { R('#6b8fa8', 4, 3, 8, 6); R('#f4f4ec', 4, 3, 8, 1); } }
        else { R('#4a3a30', 0, 0, 16, 16); R('#5a4a3e', 0, 0, 16, 2); }
        break;
      case 'x': floor(); R('#c5482b', 2, 2, 12, 12); R('#d9b25a', 3, 3, 10, 1); R('#d9b25a', 3, 12, 10, 1); break;
      case '2': floor(); R('#8a3f6b', 0, 0, 16, 16); R('#d9b25a', 0, 1, 16, 1); R('#d9b25a', 0, 14, 16, 1); R('#a85a8a', 6, 6, 4, 4); break;
      case 't': floor(); R('#8a5a34', 1, 3, 14, 9); R('#a8744a', 1, 3, 14, 2); R('#5a3a22', 2, 12, 2, 4); R('#5a3a22', 12, 12, 2, 4); if (v % 2) R('#f4f4ec', 5, 5, 4, 3); break;
      case 'c': floor(); R('#6b4a2f', 0, 4, 16, 12); R('#c9a45a', 0, 3, 16, 3); R('#5a3a22', 0, 15, 16, 1); break;
      case 'k': floor(); R('#5a5f66', 1, 2, 14, 14); R('#2a2a2a', 3, 4, 4, 4); R('#2a2a2a', 9, 4, 4, 4); R('#e8913a', 4, 5, 2, 2); R('#b8bcc4', 2, 10, 12, 1); break;
      case 's': floor(); R('#6b4a2f', 1, 0, 14, 16); for (const yy of [1, 6, 11]) { R('#4a3020', 2, yy + 4, 12, 1); R(['#c5482b', '#5fb8e0', '#e9b949'][(v + yy) % 3], 3, yy, 3, 4); R(['#6cc04a', '#f4f4ec', '#8a3f6b'][(v + yy) % 3], 7, yy + 1, 2, 3); R('#d9b25a', 10, yy, 3, 4); } break;
      case 'B': floor(); R('#5a3a22', 1, 1, 14, 15); R('#f4f4ec', 2, 2, 12, 5); R('#5fb8e0', 2, 7, 12, 8); R('#4a90c0', 2, 7, 12, 1); break;
      case 'p': floor(); R('#b5502f', 5, 10, 6, 5); R('#8a3a22', 5, 10, 6, 1); O('#3f7a34', 8, 6, 5, 5); O('#5a9a45', 7, 5, 2, 2); break;
      case 'W': floor(); R('#6b4a2f', 1, 9, 14, 7); R('#2a2a2a', 2, 1, 12, 9); R('#3a6a9a', 3, 2, 10, 7); R('#9fc4dc', 4, 3, 3, 2); break;
      case 'G': floor(); O('#8a5a34', 8, 10, 6, 6); R('#6b4a2f', 5, 3, 6, 3); R('#a8744a', 5, 3, 6, 1); break;
      case '~': floor(); R('#2b3f8a', 0, 0, 16, 9); R('#1f2f6b', 5, 0, 1, 9); R('#1f2f6b', 10, 0, 1, 9); R('#f4f4ec', 2, 3, 2, 2); R('#f4f4ec', 12, 3, 2, 2); R('#7a2e2a', 0, 0, 16, 1); break;
      case 'E': R('#3a3f48', 0, 0, 16, 16); R('#5f6873', 1, 1, 14, 10); R('#9aa3ae', 1, 1, 14, 1); g.fillStyle = '#b8bcc4'; g.beginPath(); g.arc(6, 6, 3, 0, 7); g.fill(); R('#3a3f48', 5, 5, 2, 2); R(v % 2 ? '#6cc04a' : '#d9455a', 11, 4, 2, 2); R('#f2d24b', 0, 12, 16, 1); R('#2a2a2a', 0, 13, 16, 1); break;
      case '>': case '<': {
        R('#3a3f48', 0, 0, 16, 16); R('#2a2e35', 0, 2, 16, 12); const d = ch === '>' ? 1 : -1;
        for (let k = 0; k < 3; k++) { const xx = (((k * 6 + frame * 3 * d) % 18) + 18) % 18 - 1; for (let j = 0; j < 3; j++) R('#f2d24b', xx + (d > 0 ? j : 2 - j), 5 + j, 1, 1), R('#f2d24b', xx + (d > 0 ? j : 2 - j), 10 - j, 1, 1); }
        R('#5f6873', 0, 1, 16, 1); R('#5f6873', 0, 14, 16, 1); break; }
      case 'O': floor(); O('#1f1d24', 8, 9, 7, 5); O('#2e2a36', 7, 8, 5, 3); R('#8a7aa8', 5, 7, 3, 1); R('#5fb8e0', 10, 10, 1, 1); break;
      case 'Z': R('#e8dcc0', 0, 0, 16, 16); R('#5f6873', 3, 1, 10, 14); R('#9aa3ae', 4, 2, 8, 12); R('#2a2a2a', 7, 3, 2, 10);
        if (vr === 'on') { R('#c5482b', 6, 3, 4, 3); R('#6cc04a', 4, 12, 2, 1); } else { R('#c5482b', 6, 10, 4, 3); R('#d9455a', 4, 12, 2, 1); } break;
      case 'Y': R('#e8dcc0', 0, 0, 16, 16); R('#8a6a4a', 0, 13, 16, 3); R('#5f6873', 6, 0, 4, 4); O(vr === 'on' ? '#fff2a8' : '#5a5a66', 8, 7, 4, 4); if (vr === 'on') O('#ffffff', 7, 6, 1, 1); break;
      case 'V': R('#e8dcc0', 0, 0, 16, 16); R('#a63a2a', 0, 10, 16, 6); R('#d9b25a', 0, 10, 16, 1); O('#d9b25a', 8, 6, 4, 4); O('#e9c86a', 8, 2, 2, 2); R('#d9b25a', 4, 9, 8, 2); break;
      case 'u': R('#e8dcc0', 0, 0, 16, 16); R('#8a6440', 0, 1, 16, 12); R('#2f4a3a', 0, 2, 16, 10); R('#8a6a4a', 0, 13, 16, 3); R('#c9a45a', 0, 11, 16, 1);
        g.strokeStyle = '#e8ecdf'; g.lineWidth = 1; g.beginPath();
        if (v === 0) { g.moveTo(2, 7); g.lineTo(4, 4); g.lineTo(6, 7); g.moveTo(8, 5.5); g.lineTo(13, 5.5); g.moveTo(8, 8.5); g.lineTo(11, 8.5); }
        else if (v === 1) { g.arc(5, 6, 2.5, 0, 7); g.moveTo(9, 4); g.lineTo(13, 8); g.moveTo(13, 4); g.lineTo(9, 8); }
        else if (v === 2) { g.moveTo(2, 9); g.lineTo(5, 4); g.lineTo(8, 9); g.lineTo(11, 4); g.lineTo(14, 9); }
        else { g.moveTo(3, 4.5); g.lineTo(12, 4.5); g.moveTo(3, 7.5); g.lineTo(9, 7.5); g.moveTo(11, 9); g.lineTo(13, 9); }
        g.stroke(); break;
      case '6': floor(); R('#6b4a2f', 0, 7, 16, 9); R('#c9a45a', 0, 6, 16, 2); R('#b8bcc4', 4, 1, 4, 6); R('#f28c28', 5, 3, 2, 3); R('#e86a9a', 10, 2, 3, 4); R('#f4f4ec', 10, 2, 3, 1); break;
      case '7': floor(); R('#5a5f66', 1, 4, 14, 12); R('#2a2a2a', 3, 2, 10, 4); O('#3a3a3a', 8, 4, 5, 2); R('#e8913a', 5, 7, 6, 1); break;
      case '8': floor(); R('#6b4a2f', 1, 3, 14, 10); O('#3a3a3a', 8, 7, 5, 4); O('#8a8a8a', 8, 6, 4, 2); R('#c5482b', 6, 6, 1, 1); R('#e88aa8', 9, 7, 2, 1); R('#5a3a22', 2, 13, 2, 3); R('#5a3a22', 12, 13, 2, 3); break;
      case '9': floor(); R('#6b4a2f', 1, 8, 14, 8); R('#2a2a2a', 3, 1, 10, 7); R(frame ? '#5fb8e0' : '#4a90c0', 4, 2, 8, 5); R('#b8bcc4', 4, 10, 8, 2); break;
      default: grass();
    }
    tileCache[key] = c;
    return c;
  }

  G.loadMap = function (id, x, y, dir) {
    const S = G.state;
    S.map = id; S.x = x; S.y = y; if (dir) S.dir = dir;
    W.map = id; W.rows = G.DATA.maps[id]; W.moving = null; W.fmove = null;
    W.def = G.DATA.world.maps[id];
    G.refreshNpcs();
    // คนเดินตามโผล่ข้างหลังเรา
    const [dx, dy] = DIRS[S.dir] || [0, 1];
    const bx = x - dx, by = y - dy;
    W.follow = WALK.includes(tileAt(bx, by)) && !npcAt(bx, by) ? { x: bx, y: by, dir: S.dir } : { x, y, dir: S.dir };
    G.showToast(W.def.name);
    G.music(W.def.music);
    if (G.autosave && !G.busy) setTimeout(() => G.autosave({ silent: true }), 0);   // เปลี่ยนแผนที่แล้วบันทึกเงียบๆ
  };

  // ช่วงเวลาเปิด [จาก, ถึง) ชั่วโมงในเกม รองรับช่วงข้ามเที่ยงคืน
  G.hourIn = (range) => { if (!range) return true; const h = Math.floor(G.state.time / 60) % 24, [a, b] = range; return a <= b ? h >= a && h < b : h >= a || h < b; };
  G.refreshNpcs = function () {
    const F = G.state.flags;
    W.hour = Math.floor(G.state.time / 60) % 24;
    W.npcs = G.DATA.world.npcs.filter((n) => n.map === W.map && (!n.showIf || F[n.showIf]) && (!n.hideIf || !F[n.hideIf]) && G.hourIn(n.hours))
      .map((n) => ({ ...n, x: (G.state.npcPos[n.id] || n).x, y: (G.state.npcPos[n.id] || n).y, dir: n.dir }));
  };

  const tileAt = (x, y) => (W.rows[y] && W.rows[y][x]) || '#';
  const npcAt = (x, y) => W.npcs.find((n) => n.x === x && n.y === y);
  const onMap = (list, x, y) => (G.DATA.world[list] || []).find((o) => o.map === W.map && o.x === x && o.y === y);
  const warpAt = (x, y) => onMap('warps', x, y);
  const doorAt = (x, y) => onMap('doors', x, y);
  const signAt = (x, y) => onMap('signs', x, y);
  const objAt = (x, y) => onMap('objects', x, y);
  const gateAt = (x, y) => onMap('gates', x, y);
  G.world.tileAt = tileAt;
  G.world.gateOpen = (x, y) => { const gt = gateAt(x, y); return !!(gt && G.state.flags[gt.flag]); };
  const walkable = (x, y) => WALK.includes(tileAt(x, y)) || (tileAt(x, y) === 'X' && G.world.gateOpen(x, y));
  G.world.passable = (x, y) => (walkable(x, y) || !!warpAt(x, y)) && !npcAt(x, y) && x >= 0 && y >= 0 && y < W.rows.length && x < W.rows[0].length;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  G.DIRS = DIRS;
  const dirOf = (dx, dy) => (dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down');

  // ---------- เดิน ----------
  function startMove(nx, ny, speed, forced) {
    const S = G.state;
    W.moving = { fx: S.x, fy: S.y, tx: nx, ty: ny, t: 0, speed, forced };
    const f = W.follow;
    if (S.follower && f && (f.x !== S.x || f.y !== S.y)) W.fmove = { fx: f.x, fy: f.y, tx: S.x, ty: S.y, dir: dirOf(S.x - f.x, S.y - f.y) };
    else if (f) W.fmove = { fx: f.x, fy: f.y, tx: f.x, ty: f.y, dir: f.dir };
  }
  G.world.tryMove = function (dir, run) {
    const S = G.state;
    S.dir = dir;
    const [dx, dy] = DIRS[dir], nx = S.x + dx, ny = S.y + dy;
    const door = doorAt(nx, ny);
    if (door) { G.world.enterDoor(door); return; }
    if (!G.world.passable(nx, ny)) { if (!W.bumpCD) { G.sfx('bump'); W.bumpCD = 14; } return; }
    startMove(nx, ny, run ? 0.25 : 0.125, false);
  };
  G.world.enterDoor = function (door) {
    const F = G.state.flags;
    if (door.need && !door.need.every((f) => F[f])) { G.runScript(door.script || 'door_locked', door); return; }
    if (!door.to) { G.runScript(door.script, door); return; }
    if (door.open && !G.hourIn(door.open)) { G.runScript('door_closed', door); return; }
    G.sfx('door');
    G.fadeTo(() => G.loadMap(door.to, door.tx, door.ty, 'up')).then(() => G.runScript('enter', door.to));
  };

  G.world.update = function () {
    W.anim++;
    // ชั่วโมงเปลี่ยน: NPC ไปทำงาน/กลับบ้านตามตารางเวลา
    if (W.hour !== Math.floor(G.state.time / 60) % 24 && !G.busy && !W.moving) {
      // ฝนสุ่มตกได้หลังคางคกยอมให้ฝนกลับมา (โอกาสชั่วโมงละ 15% ตกนาน 1-3 ชั่วโมง)
      const S = G.state;
      if (S.flags.boss1_done && !(S.rainLeft > 0) && G.rng() < 0.15) { S.rainLeft = 60 + Math.floor(G.rng() * 120); if (!W.def.indoor) G.showToast('ฝนเริ่มตก...'); }
      G.refreshNpcs();
    }
    if (W.bumpCD) W.bumpCD--;
    for (const n of W.npcs) if (n.alert > 0) n.alert--;
    const m = W.moving;
    if (!m) return;
    m.t += m.speed;
    if (m.t >= 1) {
      G.state.x = m.tx; G.state.y = m.ty; W.moving = null;
      if (W.fmove) { W.follow = { x: W.fmove.tx, y: W.fmove.ty, dir: W.fmove.dir }; W.fmove = null; }
      G.world.afterStep();
    }
  };

  G.world.afterStep = function () {
    const S = G.state;
    S.steps++;
    if (S.repel > 0) { S.repel--; if (S.repel === 0) G.runScript('repel_end'); }
    const wp = warpAt(S.x, S.y);
    if (wp) { G.sfx('door'); G.fadeTo(() => G.loadMap(wp.to, wp.tx, wp.ty, wp.dir)); return; }
    const here = tileAt(S.x, S.y);
    // ม่านหลอกในร้านราเมง: ผิดผืนแล้ววนกลับทางเข้า
    if (here === '~') {
      const ct = (G.DATA.world.curtains || []).find((c) => c.map === W.map && c.y === S.y);
      if (ct && !ct.ok.includes(S.x)) { G.runScript('curtain_wrong', ct); return; }
    }
    // พื้นน้ำมันลื่นไถลไปทางเดิม / สายพานพาเลื่อน
    const slide = here === 'O' ? S.dir : here === '>' ? 'right' : here === '<' ? 'left' : null;
    if (slide) {
      const [dx, dy] = DIRS[slide], nx = S.x + dx, ny = S.y + dy;
      if (G.world.passable(nx, ny) && !doorAt(nx, ny)) { startMove(nx, ny, here === 'O' ? 0.3 : 0.16, true); if (here === 'O' && !W.slideSfx) { G.sfx('slide'); W.slideSfx = 1; } return; }
    }
    W.slideSfx = 0;
    // เทรนเนอร์มองเห็นเรา
    for (const n of W.npcs) {
      const tr = n.trainer;
      if (!tr || S.flags[tr.flag]) continue;
      const [dx, dy] = DIRS[n.dir];
      for (let i = 1; i <= tr.sight; i++) {
        const x = n.x + dx * i, y = n.y + dy * i;
        if (x === S.x && y === S.y) { G.runScript('trainer_spot', n, i); return; }
        if (!walkable(x, y) || npcAt(x, y)) break;
      }
    }
    // สุ่มเจอผีสางในนาข้าว / น้องวิศวะในหญ้ารก
    if (W.def.encounter && (here === 'T' || here === 'g') && G.rng() < 0.14) {
      const table = G.DATA.encounters[W.map];
      const night = G.isNight(), wet = G.raining();
      const weight = (e) => (night ? e.night : e.day) * (wet && G.DATA.species[e.sp].type === 'water' ? 2.5 : 1);   // ฝนตก ผีน้ำออกมาเยอะ
      const roll = G.rng() * table.reduce((a, e) => a + weight(e), 0);
      let acc = 0;
      for (const e of table) {
        acc += weight(e);
        if (roll < acc) {
          const lv = G.rng.int(e.min, e.max);
          const lead = S.party.find((m) => m.hp > 0);
          if (S.repel > 0 && lead && lv < lead.lv) return;
          G.runScript('wild', e.sp, lv);
          return;
        }
      }
    }
  };

  // ป้ายชื่อปุ่ม "คุย" ตอนยืนหน้าประตู
  G.world.doorLabel = (d) => (d.to ? `เข้า${G.DATA.world.maps[d.to].name.replace(/ \(.*\)$/, '')}` : 'เข้าไป');
  const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };
  // สิ่งที่คุยได้รอบตัว (หันหน้าไปหาก่อน ถ้าไม่มีค่อยดูรอบๆ)
  G.world.nearby = function () {
    const S = G.state;
    const dirs = [S.dir, ...Object.keys(DIRS).filter((d) => d !== S.dir)];
    for (const dir of dirs) {
      const [dx, dy] = DIRS[dir], x = S.x + dx, y = S.y + dy;
      let n = npcAt(x, y);
      if (!n && COUNTER.includes(tileAt(x, y))) n = npcAt(x + dx, y + dy);   // คนอยู่หลังเคาน์เตอร์
      if (n) return { kind: 'npc', ref: n, dir, x: n.x, y: n.y, label: n.look === 'item' ? 'เก็บของ' : n.look === 'buffalo' ? 'ดูควาย' : n.look === 'dog' ? 'ลูบหัวหมา' : `คุยกับ${n.name || ''}` };
      const f = W.follow, lead = S.party[0];
      if (S.follower && lead && f && f.x === x && f.y === y && dir === S.dir) return { kind: 'follower', ref: lead, dir, x, y, label: `คุยกับ${lead.name}` };
      const sg = signAt(x, y);
      if (sg) return { kind: 'sign', ref: sg, dir, x, y, label: 'อ่านป้าย' };
      const ob = objAt(x, y);
      if (ob && (dir === S.dir || dir === 'up')) return { kind: 'obj', ref: ob, dir, x, y, label: ob.label };
      const d = doorAt(x, y);
      if (d && dir === S.dir) return { kind: 'door', ref: d, dir, x, y, label: G.world.doorLabel(d) };
    }
    return null;
  };

  G.world.interact = function () {
    const S = G.state;
    const near = G.world.nearby();
    if (near) {
      S.dir = near.dir;
      if (near.kind === 'npc') { const n = near.ref; if (!['item', 'toad', 'buffalo'].includes(n.look)) n.dir = BACK[near.dir]; G.runScript(n.script, n); }
      else if (near.kind === 'follower') { W.follow.dir = BACK[near.dir]; G.runScript('follower_talk', near.ref); }
      else if (near.kind === 'sign') G.runScript('sign', near.ref);
      else if (near.kind === 'obj') G.runScript(near.ref.script, near.ref);
      else G.world.enterDoor(near.ref);
      return;
    }
    const [dx, dy] = DIRS[S.dir], t = tileAt(S.x + dx, S.y + dy);
    if (t === 'w' || t === 'i') G.runScript('water');
    else if (t === 'b') G.runScript('well');
  };

  // ---------- เวลา ----------
  G.isNight = () => { const h = Math.floor(G.state.time / 60) % 24; return h >= 19 || h < 6; };
  // 4 ช่วง: เช้า 5-9 กลางวัน 9-16 เย็น 16-19 กลางคืน 19-5
  G.period = () => { const h = Math.floor(G.state.time / 60) % 24; return h >= 5 && h < 9 ? 'morning' : h >= 9 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'evening' : 'night'; };
  G.PERIOD_TH = { morning: 'เช้า', day: 'กลางวัน', evening: 'เย็น', night: 'กลางคืน' };
  G.raining = () => G.state.rainLeft > 0 && !W.def.indoor;
  // สีแสงตามเวลา: เช้าแสงทองอ่อน เย็นแสงส้ม (ซ้อนก่อนความมืด)
  G.tint = () => {
    const h = (G.state.time / 60) % 24;
    const bell = (a, b) => (h <= a || h >= b ? 0 : Math.sin(((h - a) / (b - a)) * Math.PI));
    if (h >= 5 && h < 9) return `rgba(255,196,110,${(0.16 * bell(5, 9)).toFixed(3)})`;
    if (h >= 15.5 && h < 19.5) return `rgba(255,110,40,${(0.24 * bell(15.5, 19.5)).toFixed(3)})`;
    return null;
  };
  G.darkness = () => {
    const h = (G.state.time / 60) % 24;
    if (h >= 6 && h < 17) return 0;
    if (h >= 17 && h < 19) return ((h - 17) / 2) * 0.45;
    if (h >= 19 || h < 5) return 0.45;
    return (1 - (h - 5)) * 0.45;
  };

  // ---------- วาด ----------
  function tileVariant(ch, x, y) {
    if (ch === '%') return y + 1 < W.rows.length && tileAt(x, y + 1) !== '%' ? 'face' : 'top';
    if ('_xtcskBpWG~O2678'.includes(ch)) return 'F' + (W.def.floor || '_');
    if (ch === 'a') return y % 2 === 1 && x % 2 === 0 && tileAt(x, y + 1) === 'a' ? 'lane' : '';
    if (ch === 'D') return 'D' + (tileAt(x - 1, y) === 'C' || tileAt(x + 1, y) === 'C' ? 'C' : tileAt(x - 1, y) === 'Q' || tileAt(x + 1, y) === 'Q' ? 'Q' : '');
    if (ch === 'Z') { const o = objAt(x, y); return o && G.state.flags['sw_' + o.arg] ? 'on' : ''; }
    if (ch === 'Y') { const l = onMap('lamps', x, y); return l && G.state.flags['lamp_' + l.i] ? 'on' : ''; }
    // ก่อนชนะคางคก ทุ่งแล้ง: ข้าวเหลือง หนองน้ำงวดเหลือแต่โคลนแตกระแหงที่ขอบ / หลังฝนตก มีบัวขึ้น
    if ((ch === 'T' || ch === 'w') && !W.def.indoor && W.map !== 'kku') {
      const rained = G.state.flags.boss1_done;
      if (ch === 'T') return rained ? '' : 'dry';
      if (!rained) return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !'w0'.includes(tileAt(x + dx, y + dy))) ? 'mud' : '';
      return hash(x * 3, y * 5) < 0.18 ? 'lotus' : '';
    }
    return '';
  }
  G.world.draw = function (ctx) {
    const S = G.state;
    let px = S.x, py = S.y;
    if (W.moving) { px = W.moving.fx + (W.moving.tx - W.moving.fx) * W.moving.t; py = W.moving.fy + (W.moving.ty - W.moving.fy) * W.moving.t; }
    const cols = W.rows[0].length, rows = W.rows.length;
    let cx = px * TS - (VW * TS) / 2 + TS / 2, cy = py * TS - (VH * TS) / 2 + TS / 2;
    // แผนที่เล็กกว่าจอ (ในตึก) ให้อยู่กลางจอ
    cx = cols * TS <= VW * TS ? -(VW * TS - cols * TS) / 2 : Math.max(0, Math.min(cols * TS - VW * TS, cx));
    cy = rows * TS <= VH * TS ? -(VH * TS - rows * TS) / 2 : Math.max(0, Math.min(rows * TS - VH * TS, cy));
    cx = Math.round(cx); cy = Math.round(cy);
    W.cam = { cx, cy, px, py };
    const frame = Math.floor(W.anim / 30) % 2;
    const x0 = Math.max(0, Math.floor(cx / TS)), y0 = Math.max(0, Math.floor(cy / TS));
    const lamps = [];
    for (let y = y0; y <= y0 + VH; y++) for (let x = x0; x <= x0 + VW; x++) {
      if (y >= rows || x >= cols) continue;
      let ch = W.rows[y][x];
      if (ch === 'X') {   // ประตูกั้น: เปิดแล้วเห็นเป็นพื้น ปิดอยู่เห็นเป็นราวกั้น
        const open = G.world.gateOpen(x, y), base = W.def.indoor ? '_' : '0';
        ctx.drawImage(tileCanvas(base, x, y, frame, tileVariant(base, x, y)), x * TS - cx, y * TS - cy);
        if (!open) drawGate(ctx, x * TS - cx, y * TS - cy, W.def.indoor);
        continue;
      }
      ctx.drawImage(tileCanvas(ch, x, y, frame, tileVariant(ch, x, y)), x * TS - cx, y * TS - cy);
      if (ch === 'l') lamps.push([x * TS - cx + 8, y * TS - cy + 4, 34]);
      if (ch === 'Y' && tileVariant(ch, x, y) === 'on') lamps.push([x * TS - cx + 8, y * TS - cy + 7, 46]);
      if (ch === '~') drawCurtainSway(ctx, x, y, x * TS - cx, y * TS - cy);
    }
    // ตัวละคร เรียงตามแกน y
    const walking = !!W.moving;
    const step = walking ? (Math.floor(W.anim / 7) % 2) + 1 : 0;
    const actors = W.npcs.map((n) => ({ y: n.y, draw: () => drawActor(ctx, n.look, n.x * TS - cx, n.y * TS - cy, n.dir, 0, n) }));
    actors.push({ y: py, draw: () => drawActor(ctx, 'player', Math.round(px * TS - cx), Math.round(py * TS - cy), S.dir, step) });
    const lead = S.party[0];
    if (S.follower && lead && W.follow) {
      const fm = W.fmove, t = W.moving ? W.moving.t : 0;
      const fx = fm ? fm.fx + (fm.tx - fm.fx) * t : W.follow.x, fy = fm ? fm.fy + (fm.ty - fm.fy) * t : W.follow.y;
      const fdir = fm ? fm.dir : W.follow.dir;
      if (fx !== px || fy !== py) actors.push({ y: fy - 0.01, draw: () => drawActor(ctx, G.monLook(lead), Math.round(fx * TS - cx), Math.round(fy * TS - cy), fdir, fm && (fm.fx !== fm.tx || fm.fy !== fm.ty) ? step : 0) });
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    // หญ้าบังขา
    const here = tileAt(S.x, S.y);
    if ((here === 'T' || here === 'g') && !W.moving) { ctx.fillStyle = here === 'T' ? '#6e9b3a' : '#5f8a3a'; ctx.fillRect(S.x * TS - cx + 2, S.y * TS - cy + 11, 12, 5); }
    // ความมืด: ตึกที่ไฟดับ / กลางคืนข้างนอก
    const blackout = W.def.darkUntil && !S.flags[W.def.darkUntil];
    const dk = blackout ? 0.78 : W.def.indoor ? 0 : Math.min(0.6, G.darkness() + (G.raining() ? 0.12 : 0));
    const tn = !W.def.indoor && !blackout && G.tint();
    if (tn) { ctx.fillStyle = tn; ctx.fillRect(0, 0, 240, 160); }
    if (dk > 0) {
      ctx.fillStyle = `rgba(10,12,34,${dk})`; ctx.fillRect(0, 0, 240, 160);
      ctx.globalCompositeOperation = 'lighter';
      const glow = (gx, gy, r, col) => { const grd = ctx.createRadialGradient(gx, gy, 2, gx, gy, r); grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(gx - r, gy - r, r * 2, r * 2); };
      const pgx = Math.round(px * TS - cx + 8), pgy = Math.round(py * TS - cy + 8);
      if (blackout) glow(pgx, pgy, 30, 'rgba(255,230,170,0.42)');   // ไฟฉายของแอม
      else if (G.isNight()) glow(pgx, pgy, 40, 'rgba(255,220,140,0.18)');
      if (G.isNight() || blackout || dk >= 0.3) for (const [lx, ly, r] of lamps) glow(lx, ly, r, 'rgba(255,236,160,0.38)');
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  function drawGate(ctx, x, y, indoor) {
    if (indoor) {   // ประตูเหล็กโรงช็อป
      ctx.fillStyle = '#3a3f48'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#9aa3ae'; for (let i = 1; i < 16; i += 3) ctx.fillRect(x + i, y, 1, 16);
      ctx.fillStyle = '#f2d24b'; ctx.fillRect(x, y + 6, 16, 2); ctx.fillStyle = '#2a2a2a'; for (let i = 0; i < 16; i += 4) ctx.fillRect(x + i, y + 6, 2, 2);
    } else {        // แผงกั้นสะพานปิดซ่อม
      ctx.fillStyle = '#c5482b'; ctx.fillRect(x + 1, y + 5, 14, 3); ctx.fillStyle = '#f4f4ec'; for (let i = 2; i < 15; i += 4) ctx.fillRect(x + i, y + 5, 2, 3);
      ctx.fillStyle = '#3a3f48'; ctx.fillRect(x + 2, y + 8, 2, 7); ctx.fillRect(x + 12, y + 8, 2, 7);
      ctx.fillStyle = '#f28c28'; ctx.fillRect(x + 6, y + 10, 4, 5); ctx.fillStyle = '#f4f4ec'; ctx.fillRect(x + 6, y + 12, 4, 1);
    }
  }
  // ม่านผืนจริงจะพลิ้วไหวตามลม (คำใบ้)
  function drawCurtainSway(ctx, x, y, sx, sy) {
    const ct = (G.DATA.world.curtains || []).find((c) => c.map === W.map && c.y === y);
    if (!ct || !ct.ok.includes(x)) return;
    const s = Math.round(Math.sin(W.anim / 12) * 1.5);
    ctx.fillStyle = '#3b55b0'; ctx.fillRect(sx + 1 + s, sy + 9, 4, 2); ctx.fillRect(sx + 11 + s, sy + 9, 4, 2);
  }

  function drawActor(ctx, look, x, y, dir, frame, npc) {
    const custom = !!G._spriteDefs.CUSTOM[look];
    const bob = custom && npc == null && frame ? Math.floor(W.anim / 6) % 2 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + 3, y + 14, 10, 2);
    const spr = custom && (look === 'toad' || look === 'item' || look === 'buffalo') ? G.sprite(look) : G.actorSprite(look, dir, frame);
    ctx.drawImage(spr, x, y - bob);
    if (npc && npc.trainer && !G.state.flags[npc.trainer.flag]) { ctx.fillStyle = '#c5482b'; ctx.fillRect(x + 7, y - 4, 2, 2); }
    const qm = npc && G.questMark ? G.questMark(npc.id) : null;
    if (qm && !(npc.alert > 0)) {   // ! = มีเควสต์ให้รับ  ? = ไปส่งเควสต์ได้
      const by = y - 13 + Math.round(Math.sin(W.anim / 10));
      ctx.fillStyle = '#18203f'; ctx.fillRect(x + 4, by - 1, 8, 10); ctx.fillStyle = qm === '!' ? '#f2d24b' : '#7cd0f0'; ctx.fillRect(x + 5, by, 6, 8);
      ctx.fillStyle = '#18203f';
      if (qm === '!') { ctx.fillRect(x + 7, by + 1, 2, 4); ctx.fillRect(x + 7, by + 6, 2, 1); }
      else { ctx.fillRect(x + 6, by + 1, 4, 1); ctx.fillRect(x + 9, by + 2, 1, 2); ctx.fillRect(x + 7, by + 3, 2, 1); ctx.fillRect(x + 7, by + 4, 1, 1); ctx.fillRect(x + 7, by + 6, 1, 1); }
    }
    if (npc && npc.alert > 0) {   // ตกใจ "!"
      ctx.fillStyle = '#f4f4ec'; ctx.fillRect(x + 4, y - 12, 8, 9); ctx.fillStyle = '#c5482b'; ctx.fillRect(x + 7, y - 11, 2, 5); ctx.fillRect(x + 7, y - 5, 2, 1);
    }
  }
})(window.G = window.G || {});
