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
// ด่าน 3 (ริมพอง ตัวอำเภอ โรงพยาบาล):
//  d  หาดทราย   v  พงอ้อริมน้ำ (สุ่มเจอผี)   y  เจดีย์ร้าง   U  ผนังโรงพยาบาล   [  เก้าอี้รอคิว   ]  ตู้ยา
//  1 3 4 5 =  เส้นสีบนพื้นโรงพยาบาล (เขียว ฟ้า เหลือง แดง ม่วง) เดินตามไปแผนกต่างๆ
(function (G) {
  'use strict';
  const TS = 16, VW = 15, VH = 10;
  const WALK = '.:fTL_-x~><O2aeg+0dv1345=;{ฌต';   // ต้องตรงกับ WALK ใน tools/build_data.py
  const COUNTER = 'c67,ฉ';              // คุยกับคนหลังเคาน์เตอร์ได้
  G.world = { npcs: [], map: null, rows: null, moving: null, anim: 0, follow: null };
  const W = G.world;

  function hash(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }

  const tileCache = {};
  // var = ตัวเลือกเพิ่ม เช่น ผนังด้านหน้า/บน พื้นของแผนที่ เฟรมน้ำ
  function tileCanvas(ch, x, y, frame, vr) {
    const v = Math.floor(hash(x, y) * 4);
    const anim = 'w~><iv)*`{ฏฑต'.includes(ch);   // vr ของน้ำ/ข้าว: dry = ก่อนฝนตก, mud = ขอบหนองแห้ง, lotus = บัวหลังฝน
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
    const darkfl = () => { R('#dfe2ee', 0, 0, 16, 16); R('#c3c8dc', 0, 0, 16, 1); R('#c3c8dc', 0, 0, 1, 16); if ((x + y) % 2) R('#e9ebf4', 1, 1, 15, 15); R('#f6f7fb', 2, 2, 3, 1); };   // พื้นสนามอีสปอร์ต: ขาวเทาเงา อ่านง่าย
    const netfl = () => {   // ร้านเน็ต: พรมกรมท่าลายหกเหลี่ยม
      R('#1c2740', 0, 0, 16, 16); g.strokeStyle = '#273556'; g.lineWidth = 1; g.beginPath();
      for (const [hx, hy] of [[4, 4], [12, 4], [8, 11], [0, 11], [16, 11]]) { g.moveTo(hx - 3, hy); g.lineTo(hx - 1.5, hy - 3); g.lineTo(hx + 1.5, hy - 3); g.lineTo(hx + 3, hy); g.lineTo(hx + 1.5, hy + 3); g.lineTo(hx - 1.5, hy + 3); g.closePath(); }
      g.stroke(); if (v === 1) R('#2f8a9a', 8, 11, 1, 1);
    };
    const marble = () => {   // โรงแรม: หินอ่อนครีม ลายเส้น ขอบทอง
      R('#efe6d6', 0, 0, 16, 16); R('#e2d6c0', 0, 0, 16, 1); R('#e2d6c0', 0, 0, 1, 16);
      g.strokeStyle = '#d6c8ae'; g.lineWidth = 1; g.beginPath(); g.moveTo(2 + v * 2, 2); g.quadraticCurveTo(8, 6 + v, 14 - v, 13); g.stroke();
      if ((x + y) % 2 === 0) { R('#c9a45a', 0, 0, 2, 1); R('#c9a45a', 0, 0, 1, 2); }
    };
    const fl = vr || '';
    const floor = () => (fl.startsWith('F-') ? tilefl() : fl.startsWith('F{') ? darkfl() : fl.startsWith('Fn') ? netfl() : fl.startsWith('F*') ? marble() : wood());
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
        else if (vr === 'DM') { R('#7a4a2a', 0, 0, 16, 16); R('#c9a45a', 1, 0, 14, 16); R('#b8bcc4', 2, 1, 6, 15); R('#d0d4dc', 8, 1, 6, 15); R('#8f949e', 7, 1, 2, 15); R('#e8ecf0', 3, 2, 1, 12); R('#f2d24b', 6, 0, 4, 1); }
        else if (vr === 'DA') { R('#1b2036', 0, 0, 16, 16); R('#5fe0f0', 0, 0, 16, 1); R('#9fd8f0', 1, 2, 6, 14); R('#9fd8f0', 9, 2, 6, 14); R('#c8ecf8', 2, 3, 2, 8); R('#c8ecf8', 10, 3, 2, 8); R('#3a3f48', 7, 1, 2, 15); R('#b04ae8', 0, 1, 16, 1); }
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
      case '!': if (vr === 'clock') {   // หอนาฬิกาวงเวียนตัวอำเภอ
          pave(); R('#c9bea8', 4, 6, 8, 10); R('#e6dcc8', 5, 6, 6, 9); R('#a63a2a', 3, 1, 10, 5); R('#86281c', 3, 5, 10, 1); O('#f4f4ec', 8, 9, 2.5, 2.5); R('#2a2a2a', 8, 7, 1, 2); R('#2a2a2a', 8, 9, 2, 1); R('#d9b25a', 7, 0, 2, 1); break; }
        pave(); R('#8f949e', 3, 11, 10, 5); R('#b8bcc4', 3, 11, 10, 1); g.fillStyle = '#d9b25a'; g.beginPath(); g.arc(8, 6, 5, 0, 7); g.fill();
        for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; R('#d9b25a', 7 + Math.round(Math.cos(a) * 6), 5 + Math.round(Math.sin(a) * 6), 2, 2); }
        g.fillStyle = '#8a6a24'; g.beginPath(); g.arc(8, 6, 2, 0, 7); g.fill(); break;
      case '&': grass(); R('#3f7a34', 1, 3, 14, 12); R('#5a9a45', 2, 3, 12, 3); R('#2f5a2a', 1, 14, 14, 1); break;
      case '$': pave(); R('#c5482b', 3, 1, 10, 15); R('#e8e2d0', 4, 3, 5, 8); R('#2a2a2a', 10, 4, 2, 3); R('#5fb8e0', 5, 4, 1, 2); R('#f2d24b', 7, 4, 1, 2); R('#6cc04a', 5, 7, 1, 2); R('#2a2a2a', 4, 12, 8, 2); break;
      case '?': pave(); R('#5a3a22', 3, 10, 2, 6); R('#5a3a22', 11, 10, 2, 6); R('#2f6b5a', 1, 2, 14, 9); R('#f4f4ec', 3, 4, 5, 3); R('#f2d24b', 9, 4, 4, 2); R('#f4f4ec', 9, 7, 4, 2); break;
      case '@': R('#55555e', 0, 0, 16, 16); R('#2f6fb0', 0, 3, 16, 10); R('#9fc4dc', 2, 4, 5, 3); R('#9fc4dc', 9, 4, 5, 3); R('#1f4f80', 0, 12, 16, 1); O('#2a2a2a', 4, 14, 2, 2); O('#2a2a2a', 12, 14, 2, 2); R('#f2d24b', 0, 8, 16, 1); break;
      case '0': water(); R('#8a6440', 0, 1, 16, 14); for (let i = 3; i < 16; i += 4) R('#6b4a2f', i, 1, 1, 14); R('#5a3a22', 0, 1, 16, 1); R('#5a3a22', 0, 14, 16, 1); break;
      // ---------- ในตึก ----------
      case '_': floor(); break;
      // ---------- ด่าน 3 ----------
      case 'd': R('#e8d4a0', 0, 0, 16, 16); R('#d4bc84', (v * 5) % 13, 3, 2, 1); R('#f4e4b8', (v * 3 + 6) % 13, 9, 2, 1); R('#c9ad74', 4, (v * 4) % 12 + 2, 1, 1); R('#d4bc84', 11, 13, 1, 1); break;
      case 'v': grass(); for (let i = 0; i < 5; i++) { const xx = i * 3 + 1 + (frame && i % 2 ? 1 : 0); R('#5f7f43', xx, 3 + (i % 2) * 2, 1, 12); R('#8a6a44', xx, 1 + (i % 2) * 2, 1, 3); R('#a8c45a', xx + 1, 8 + (i % 3), 1, 3); } break;
      case 'y': grass(); R('#8a8070', 3, 10, 10, 5); R('#a89a84', 4, 6, 8, 4); R('#8a8070', 5, 3, 6, 3); R('#a89a84', 7, 0, 2, 3); R('#6b6254', 3, 14, 10, 1); R('#5f7f43', 3 + v, 9, 2, 2); R('#5f7f43', 10, 5 - (v % 2), 2, 1); break;
      case 'U': R('#f0f0ea', 0, 0, 16, 16); R('#d8d8d0', 0, 15, 16, 1); if (vr === 'cross') { R('#d9455a', 6, 2, 4, 12); R('#d9455a', 2, 6, 12, 4); } else { R('#5a7a9a', 3, 3, 10, 8); R('#9fc4dc', 4, 4, 4, 6); R('#f0f0ea', 7, 3, 1, 8); R('#c4c8c0', 2, 11, 12, 1); } break;
      case '[': floor(); R('#5a6a7a', 0, 10, 16, 2); R('#3a8ac0', 1, 4, 6, 6); R('#3a8ac0', 9, 4, 6, 6); R('#5fa8e0', 1, 4, 6, 1); R('#5fa8e0', 9, 4, 6, 1); R('#3a3f48', 2, 12, 1, 3); R('#3a3f48', 13, 12, 1, 3); break;
      case ']': floor(); R('#f4f4ec', 1, 0, 14, 16); R('#c4c8c0', 1, 15, 14, 1); for (const yy of [2, 7]) { R('#9fc4dc', 2, yy, 12, 4); R(['#d9455a', '#f2d24b', '#6cc04a'][(v + yy) % 3], 3, yy + 1, 2, 3); R('#f4f4ec', 6, yy + 2, 3, 2); R(['#5fb8e0', '#e86a9a', '#f28c28'][(v + yy) % 3], 10, yy + 1, 2, 3); } R('#d9455a', 6, 12, 4, 1); R('#d9455a', 7, 11, 2, 3); break;
      case '1': case '3': case '4': case '5': case '=': {
        floor(); const col = { 1: '#4fb05a', 3: '#3a8ad8', 4: '#e8c034', 5: '#d9455a', '=': '#9a5ad0' }[ch];
        const lk = (vr || '').slice(2, 6); R(col, 6, 6, 4, 4);
        if (lk[0] === '1') R(col, 6, 0, 4, 6); if (lk[1] === '1') R(col, 10, 6, 6, 4); if (lk[2] === '1') R(col, 6, 10, 4, 6); if (lk[3] === '1') R(col, 0, 6, 6, 4);
        break; }
      case '%':
        if (vr === 'faceH') { R('#eef2f4', 0, 0, 16, 16); R('#c8dce4', 0, 10, 16, 1); R('#9fc4dc', 0, 12, 16, 4); if (v === 3) { R('#9fc4dc', 4, 3, 8, 5); R('#f4f4ec', 4, 3, 8, 1); } else if (v === 1) { R('#d9455a', 7, 3, 2, 6); R('#d9455a', 5, 5, 6, 2); } }
        else if (vr === 'faceN') {   // ผนังร้านเน็ต: เขียวเข้ม แถบไฟนีออน โปสเตอร์เกม
          R('#16323a', 0, 0, 16, 16); R('#1d3f48', 0, 0, 16, 2); R('#ff4fb0', 0, 11, 16, 1); R('#0e2026', 0, 12, 16, 4); R('#4fe0ff', 0, 14, 16, 1);
          if (v === 2) { R('#0c0d14', 2, 1, 12, 9); R(['#d9455a', '#7a2ad0', '#2a8ad8'][(x + y) % 3], 3, 2, 10, 7); R('#ffffff', 4, 3, 5, 1); R('#f2d24b', 9, 5, 3, 3); R('#0c0d14', 4, 7, 7, 1); }
          else if (v === 0) { R('#0c0d14', 4, 3, 8, 5); R('#5fe0f0', 5, 4, 6, 1); R('#ff4fb0', 5, 6, 4, 1); }
        }
        else if (vr === 'topN') { R('#0b181d', 0, 0, 16, 16); R('#16323a', 0, 0, 16, 2); }
        else if (vr === 'faceM') {   // ผนังโรงแรม: ครีม บัวทอง บุไม้ช่วงล่าง ภาพแขวน/โคมผนัง
          R('#efe0c0', 0, 0, 16, 16); R('#e4d2ae', 0, 0, 16, 1); R('#c9a45a', 0, 8, 16, 1); R('#7a4a2a', 0, 9, 16, 7); R('#8a5a34', 1, 10, 6, 5); R('#8a5a34', 9, 10, 6, 5); R('#c9a45a', 0, 15, 16, 1);
          if (v === 2) { R('#b08a3a', 3, 1, 10, 7); R('#7fb0c8', 4, 2, 8, 3); R('#6a9a50', 4, 5, 8, 2); R('#f2d24b', 9, 2, 2, 1); }
          else if (v === 1) { R('#c9a45a', 7, 3, 2, 4); O('#fff2c0', 8, 2.5, 3, 2); }
        }
        else if (vr === 'topM') { R('#5a3a22', 0, 0, 16, 16); R('#6b4a2f', 0, 0, 16, 2); }
        else if (vr === 'faceE') {   // ผนังสนาม: ม่วงสด แผงขาว แถบไฟฟ้า/ชมพู
          R('#5a3aa8', 0, 0, 16, 16); R('#6e4ec4', 0, 0, 16, 2); R('#f4f4fb', 1, 3, 14, 5); R('#d8d4f0', 1, 7, 14, 1);
          R('#5fe0f0', 0, 10, 16, 1); R('#ff6ac0', 0, 12, 16, 1); R('#3a2478', 0, 14, 16, 2);
          if (v === 2) { R('#ff6ac0', 3, 4, 4, 3); R('#5fe0f0', 9, 4, 4, 3); } else if (v === 1) { R('#7a5ad8', 5, 4, 6, 3); R('#ffffff', 6, 5, 4, 1); } }
        else if (vr === 'topE') { R('#3a2478', 0, 0, 16, 16); R('#5a3aa8', 0, 0, 16, 2); }
        else if (vr === 'topH') { R('#8a9aa8', 0, 0, 16, 16); R('#9aaab8', 0, 0, 16, 2); }
        else if (vr === 'face') { R('#e8dcc0', 0, 0, 16, 16); R('#d4c6a6', 0, 4, 16, 1); R('#8a6a4a', 0, 13, 16, 3); if (v === 3) { R('#6b8fa8', 4, 3, 8, 6); R('#f4f4ec', 4, 3, 8, 1); } }
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
      case 'O': floor(); if (vr && vr.endsWith('wet')) { O('#9fd8f0', 8, 9, 7, 5); O('#c8ecf8', 6, 8, 3, 2); R('#f2d24b', 11, 2, 4, 6); R('#2a2a2a', 12, 3, 2, 1); R('#2a2a2a', 12, 5, 2, 2); R('#f2d24b', 10, 8, 1, 2); R('#f2d24b', 15, 8, 1, 2); break; } O('#1f1d24', 8, 9, 7, 5); O('#2e2a36', 7, 8, 5, 3); R('#8a7aa8', 5, 7, 3, 1); R('#5fb8e0', 10, 10, 1, 1); break;
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


      // ---------- เฟอร์นิเจอร์ในร้านเน็ต/โรงแรม (อักษรไทยเป็นรหัสช่อง) ----------
      case 'ก': floor(); R('#1f4f52', 1, 4, 14, 10); R('#2f7276', 1, 4, 14, 3); R('#183e40', 0, 6, 2, 8); R('#183e40', 14, 6, 2, 8);
        R('#3a8a8e', 3, 8, 4, 4); R('#3a8a8e', 9, 8, 4, 4); R('#4fa4a8', 3, 8, 4, 1); R('#4fa4a8', 9, 8, 4, 1); R('#c9a45a', 2, 14, 1, 2); R('#c9a45a', 13, 14, 1, 2); break;   // โซฟากำมะหยี่
      case 'ค': floor(); R('#b08a3a', 5, 11, 6, 5); R('#c9a45a', 4, 10, 8, 2);
        for (const [a, b, r] of [[8, 6, 4], [4, 7, 3], [12, 7, 3], [6, 3, 2.5], [10, 3, 2.5]]) O(a % 4 ? '#3f8a45' : '#2f6b34', a, b, r, r * 0.8);
        R('#5aa45a', 7, 2, 1, 3); R('#5aa45a', 11, 5, 2, 1); break;   // ต้นไม้ใหญ่กระถางทอง
      case 'ง': floor(); R('#5a3a22', 1, 1, 14, 14); R('#6b4a2f', 2, 2, 12, 12);
        for (let yy = 3; yy < 13; yy += 3) for (let xx = 3; xx < 13; xx += 3) { R('#c9a45a', xx + 1, yy, 1, 1); R(hash(xx + x, yy + y) < 0.6 ? '#f2d24b' : '#3a2a20', xx, yy + 1, 2, 1); }
        break;   // ตู้กุญแจห้อง
      case 'ฉ': floor(); R('#5a2a1a', 0, 6, 16, 10); R('#7a3a22', 0, 7, 16, 8); R('#c9a45a', 0, 10, 16, 1); R('#f4f0e6', 0, 3, 16, 4); R('#ded6c4', 0, 6, 16, 1);
        if (v === 0) { R('#2a2a33', 3, 0, 6, 4); R('#5fb8e0', 4, 1, 4, 2); } else if (v === 1) { O('#f2d24b', 8, 4, 2, 1.2); R('#c9a45a', 7, 2, 2, 1); } else if (v === 2) { R('#f4f4ec', 5, 3, 5, 2); R('#c5482b', 6, 3, 3, 1); }
        break;   // เคาน์เตอร์หินอ่อนต้อนรับ
      case 'ช': floor(); R('#c9a45a', 2, 2, 1, 13); R('#c9a45a', 13, 2, 1, 13); R('#c9a45a', 2, 2, 12, 1); R('#b08a3a', 2, 13, 12, 1);
        R('#2f6fb0', 4, 5, 8, 4); R('#d9455a', 4, 9, 5, 4); R('#4a3020', 9, 9, 3, 4); O('#2a2a2a', 4, 15, 1.5, 1); O('#2a2a2a', 12, 15, 1.5, 1); break;   // รถเข็นกระเป๋า
      case 'ซ': floor(); O('#3a2416', 8, 10, 7, 4); O('#5a3a22', 8, 9, 7, 4); R('#4a2e1c', 3, 12, 1, 4); R('#4a2e1c', 12, 12, 1, 4);
        R('#e8ecf0', 7, 4, 2, 5); O('#e86a9a', 7, 3, 1.5, 1.5); O('#f2d24b', 9.5, 3.5, 1.5, 1.5); O('#d9455a', 8, 1.8, 1.4, 1.4); R('#4f8a45', 8, 4, 1, 2); break;   // โต๊ะกาแฟ แจกันดอกไม้
      case 'ฌ': floor(); R('#8a1f2a', 0, 0, 16, 16); R('#a02a36', 1, 1, 14, 14);
        for (let k = 2; k < 16; k += 4) { R('#b8434e', k, 7, 2, 2); }
        break;   // พรมแดงขอบทอง
      case 'ฏ': floor(); R('#2a2e3a', 1, 0, 14, 16); R('#9fe0ff', 2, 1, 12, 13); R('#c8f0ff', 2, 1, 12, 1);
        for (const yy of [3, 7, 11]) { R('#5f6873', 2, yy + 2, 12, 1); for (let k = 0; k < 5; k++) R(['#d9455a', '#f2d24b', '#6cc04a', '#e86a9a', '#2f6fb0'][(k + yy + v) % 5], 3 + k * 2, yy - 1, 1, 3); }
        if (frame) R('#ffffff', 12, 2, 1, 10); R('#14141a', 1, 14, 14, 2); break;   // ตู้แช่น้ำเรืองแสง
      case 'ฑ': floor(); R('#1a1030', 2, 0, 12, 16); R('#2a1a50', 3, 1, 10, 3); R(frame ? '#ff4fb0' : '#4fe0ff', 4, 1, 8, 2);
        R('#0c0d14', 3, 4, 10, 6); R(frame ? '#2a8a3a' : '#2a3a9a', 4, 5, 8, 4); R('#f2d24b', 5 + frame * 3, 6, 2, 2); R('#ffffff', 9, 7 - frame, 1, 1);
        R('#3a2a60', 2, 10, 12, 3); R('#d9455a', 4, 11, 2, 1); R('#2a2a2a', 4, 9, 1, 2); O('#f2d24b', 9, 11.5, 1, 1); O('#4fe07a', 11, 11.5, 1, 1); R('#120a24', 3, 13, 10, 3); break;   // ตู้เกมอาเขต
      case 'ฒ': floor(); O(['#d9455a', '#2f6fb0', '#f2d24b', '#7a2ad0'][v], 8, 10, 6.5, 5); O(['#e86a7a', '#4f8fd0', '#f8e27a', '#9a5ad0'][v], 7, 8, 4, 2.5); R('rgba(0,0,0,0.25)', 3, 14, 10, 1); break;   // บีนแบก
      case 'ณ': floor(); R('#3a3f48', 5, 6, 6, 9); R('#5f6873', 4, 5, 8, 2); R('#4fa05a', 6, 8, 4, 1); R('#2a2e35', 5, 14, 6, 1); break;   // ถังขยะ
      case 'ด': floor(); R('#e8ecf0', 4, 6, 8, 10); R('#c8ccd4', 4, 14, 8, 2); R('#9fd8f0', 5, 0, 6, 6); R('#c8ecf8', 6, 1, 2, 4); R('#d9455a', 5, 9, 2, 2); R('#2f6fb0', 9, 9, 2, 2); break;   // ตู้กดน้ำดื่ม
      case 'ต': R('#24345a', 0, 0, 16, 16); R('#2a3d68', 0, 0, 16, 1); R('#2a3d68', 0, 0, 1, 16);
        if ((v + frame) % 2) R('#b06aff', 7, 7, 2, 2); break;   // พรมทางเดิน (ขอบไฟนีออนวาดใน decor)
      // ---------- ด่านสุดท้าย: เมืองขอนแก่น สนามอีสปอร์ต ----------
      case '(': {   // ผนังกระจกสนามอีสปอร์ต: กระจกน้ำเงินม่วง เส้นเฟรม แถบนีออนที่ขอบบน
        R('#1b2036', 0, 0, 16, 16); R('#2a3360', 1, 1, 6, 14); R('#2a3360', 9, 1, 6, 14);
        R('#3e4c8a', 1, 1, 6, 4); R('#3e4c8a', 9, 1, 6, 4); R('#6a7ad0', 2, 2, 1, 6); R('#6a7ad0', 10, 2, 1, 6);
        R('#141828', 7, 0, 2, 16); R('#141828', 0, 15, 16, 1);
        if (vr === 'top') { R('#b04ae8', 0, 0, 16, 2); R('#f0a8ff', 0, 0, 16, 1); }
        if (vr === 'base') { R('#3a3f48', 0, 12, 16, 4); R('#5fe0f0', 0, 12, 16, 1); }
        break; }
      case ')': {   // จอ LED ยักษ์: สลับภาพตามเฟรม ขอบดำ
        R('#0c0d14', 0, 0, 16, 16);
        const t = (x + frame) % 4, row = y % 2;
        const pal = [['#7a2ad0', '#e05ad0'], ['#1f7ad8', '#5fe0f0'], ['#d9455a', '#f2d24b'], ['#2a2e8a', '#9a5ad0']][t];
        R(pal[0], 0, row ? 0 : 1, 16, row ? 15 : 15); R(pal[1], 0, row ? 9 : 4, 16, 2);
        if ((x + y + frame) % 3 === 0) { R('#ffffff', 3, row ? 3 : 7, 10, 1); R('#ffffff', 3, row ? 5 : 9, 6, 1); }
        else if ((x + frame) % 3 === 1) { g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.arc(8, 8, 4, 0, 7); g.moveTo(8, 2); g.lineTo(8, 14); g.moveTo(2, 8); g.lineTo(14, 8); g.stroke(); }
        R('#000000', 0, row ? 15 : 0, 16, 1);
        break; }
      case '*': {   // ป้ายไฟนีออนบนหลังคา: ตัวอักษรเรืองแสง (กะพริบตามเฟรม)
        R('#14121e', 0, 0, 16, 16); R('#26203a', 0, 13, 16, 3);
        const L = (vr || 'L★').slice(1), neon = [['#ff4fb0', '#ffd2ec'], ['#4fe0ff', '#d2f8ff'], ['#ffd84a', '#fff6c8'], ['#b06aff', '#ecdcff']][(x >> 1) % 4];
        const on = frame || (x * 3 + y) % 7 !== 0;
        g.font = 'bold 12px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (on) { g.shadowColor = neon[0]; g.shadowBlur = 4; }
        g.fillStyle = on ? neon[0] : '#4a3a5a'; g.fillText(L, 8, 7);
        g.shadowBlur = 0; if (on) { g.fillStyle = neon[1]; g.font = 'bold 11px monospace'; g.fillText(L, 8, 7); }
        break; }
      case ',': {   // แผงตลาดถนนคนเดิน: ผ้าใบลายทาง + ของบนโต๊ะ
        R('#b8a888', 0, 0, 16, 16); const st = ['#d9455a', '#2f6fb0', '#e8913a', '#4fa05a'][v];
        for (let i = 0; i < 16; i += 4) { R(st, i, 0, 2, 6); R('#f4f4ec', i + 2, 0, 2, 6); }
        R('#8a3a22', 0, 6, 16, 1); R('#6b4a2f', 1, 9, 14, 4); R('#8a6440', 1, 9, 14, 1); R('#4a3020', 2, 13, 1, 3); R('#4a3020', 13, 13, 1, 3);
        const goods = [['#f2d24b', '#c5482b', '#6cc04a'], ['#f4f4ec', '#e86a9a', '#5fb8e0'], ['#8a5a34', '#f28c28', '#f2d24b'], ['#6cc04a', '#d9455a', '#f4f4ec']][(x + y) % 4];
        goods.forEach((c, k) => O(c, 4 + k * 4, 8.5, 1.6, 1.4));
        R('#fff2a8', 7, 6, 2, 1);
        break; }
      case ';': {   // ฟุตปาธอิฐตัวหนอน
        R('#b9b0a2', 0, 0, 16, 16);
        for (let yy = 0; yy < 16; yy += 4) for (let xx = (yy / 4) % 2 ? -4 : 0; xx < 16; xx += 8) { R('#a69c8c', xx, yy, 8, 1); R('#a69c8c', xx + 7, yy, 1, 4); }
        if (v === 2) R('#c2584a', 2, 5, 4, 2); if (v === 3) R('#8f8676', 10, 9, 3, 1);
        break; }
      case '|': {   // ลังกำบังในห้องซ้อม (ไม้ขอบเหล็ก)
        floor(); R('#2a2e3a', 1, 2, 14, 14); R('#6b4a2f', 2, 3, 12, 12); R('#8a6440', 2, 3, 12, 2);
        g.strokeStyle = '#4a3020'; g.lineWidth = 1; g.beginPath(); g.moveTo(3, 5); g.lineTo(13, 14); g.moveTo(13, 5); g.lineTo(3, 14); g.stroke();
        R('#f2d24b', 3, 8, 3, 1); R('#9aa3ae', 1, 2, 14, 1);
        break; }
      case '{': {   // พื้นสนาม/ห้องซ้อม/เวที: ขาวเทาเงา มีไฟม่วงฟ้าแวบตามพื้น
        darkfl();
        if ((x * 7 + y * 3 + frame) % 9 === 0) { R('#b06aff', 7, 7, 2, 2); R('#e2c8ff', 7, 7, 1, 1); }
        else if ((x * 5 + y * 11) % 13 === 0) R('#5fd0e8', 6, 13, 4, 1);
        break; }
      case '}': {   // ที่นั่งอัฒจันทร์ (เก้าอี้แดงเป็นแถว)
        R('#2a2a33', 0, 0, 16, 16); R('#3a3a46', 0, 0, 16, 2);
        for (const xx of [1, 9]) { R('#a82a3a', xx, 4, 6, 7); R('#d9455a', xx, 4, 6, 2); R('#6a1a24', xx, 11, 6, 2); }
        R('#1a1a22', 0, 14, 16, 2);
        break; }
      case '`': {   // โต๊ะคอมเกมมิ่ง: จอโค้ง คีย์บอร์ดไฟ RGB
        floor(); R('#1a1a22', 0, 9, 16, 7); R('#2a2a33', 0, 9, 16, 1);
        R('#0c0d14', 2, 1, 12, 8); R(frame ? '#2a6ad8' : '#7a2ad0', 3, 2, 10, 6); R('#9fe0ff', 4, 3, 3, 1); R('#ffffff', 9, 5, 2, 1);
        R('#3a3f48', 7, 8, 2, 2);
        const rgb = ['#ff4f6a', '#ffd84a', '#4fe07a', '#4fb8ff', '#b06aff'];
        for (let k = 0; k < 5; k++) R(rgb[(k + frame + v) % 5], 3 + k * 2, 11, 2, 1);
        R('#5a5f66', 13, 11, 2, 3);
        R('#14141a', 5, 13, 6, 3); R(['#d9455a', '#4fb8ff', '#4fe07a', '#b06aff'][v], 7, 13, 2, 3);   // เก้าอี้เกมมิ่ง
        break; }
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
    if (!W.def.indoor) (S.visited = S.visited || {})[id] = 1;   // ที่ที่เคยมาแล้ว ใช้เดินทางเร็วได้
    G.refreshNpcs();
    // คนเดินตามโผล่ข้างหลังเรา
    const [dx, dy] = DIRS[S.dir] || [0, 1];
    const bx = x - dx, by = y - dy;
    W.follow = WALK.includes(tileAt(bx, by)) && !npcAt(bx, by) ? { x: bx, y: by, dir: S.dir } : { x, y, dir: S.dir };
    G.showToast(W.def.name);
    W.amb = makeAmbient();
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
  const walkerAt = (x, y) => W.amb && W.amb.walkers.some((w) => (w.x === x && w.y === y) || (w.mv && w.mv.tx === x && w.mv.ty === y));
  G.world.passable = (x, y) => (walkable(x, y) || !!warpAt(x, y)) && !npcAt(x, y) && !walkerAt(x, y) && x >= 0 && y >= 0 && y < W.rows.length && x < W.rows[0].length;
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
    const pushed = npcAt(nx, ny);
    if (pushed && pushed.push) {   // ดันเตียงคนไข้ไปข้างหน้าหนึ่งช่อง (ถ้าข้างหน้าว่าง)
      const bx = nx + dx, by = ny + dy;
      if (walkable(bx, by) && !npcAt(bx, by) && !warpAt(bx, by) && !doorAt(bx, by) && !(W.follow && W.follow.x === bx && W.follow.y === by)) {
        pushed.x = bx; pushed.y = by; S.npcPos[pushed.id] = { x: bx, y: by }; G.sfx('slide');
        startMove(nx, ny, 0.1, false); return;
      }
    }
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
    if (W.amb) updateAmbient();
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
    if (wp) { G.sfx('door'); G.fadeTo(() => G.loadMap(wp.to, wp.tx, wp.ty, wp.dir)).then(() => G.runScript('enter', wp.to)); return; }
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
    if (W.encCD > 0) W.encCD--;   // เพิ่งสู้ไป เดินได้อีกสักพักก่อนเจอตัวใหม่
    else if (W.def.encounter && (W.def.encTiles || 'Tgv').includes(here) && G.rng() < (W.def.encRate || 0.14)) {
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
          W.encCD = 5;
          G.runScript('wild', e.sp, lv);
          return;
        }
      }
    }
  };

  // ป้ายชื่อปุ่ม "คุย" ตอนยืนหน้าประตู
  G.world.doorLabel = (d) => d.label || (d.to ? `เข้า${G.DATA.world.maps[d.to].name.replace(/ \(.*\)$/, '')}` : 'เข้าไป');
  const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };
  // สิ่งที่คุยได้รอบตัว (หันหน้าไปหาก่อน ถ้าไม่มีค่อยดูรอบๆ)
  G.world.nearby = function () {
    const S = G.state;
    const dirs = [S.dir, ...Object.keys(DIRS).filter((d) => d !== S.dir)];
    for (const dir of dirs) {
      const [dx, dy] = DIRS[dir], x = S.x + dx, y = S.y + dy;
      let n = npcAt(x, y);
      if (!n && COUNTER.includes(tileAt(x, y))) n = npcAt(x + dx, y + dy);   // คนอยู่หลังเคาน์เตอร์
      if (n) return { kind: 'npc', ref: n, dir, x: n.x, y: n.y, label: n.look === 'item' ? 'เก็บของ' : n.look === 'buffalo' ? 'ดูควาย' : n.look === 'dog' ? 'ลูบหัวหมา' : n.push ? 'ดูเตียง' : `คุยกับ${n.name || ''}` };
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
  // เส้นสีบนพื้น: ต่อไปทางช่องข้างๆ ที่เป็นสีเดียวกันหรือเป็นประตู (บิตบน/ขวา/ล่าง/ซ้าย)
  const LINK = (ch, x, y) => [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => { const t = tileAt(x + dx, y + dy); return t === ch || t === 'D' ? '1' : '0'; }).join('');
  // ---------- รายละเอียดทับช่อง (วาดทุกเฟรม ไม่แคช เพราะขึ้นกับช่องข้างๆ และเวลา) ----------
  const TALL = '#PJ&hHCUNQ(D%RrAMmKkcsBW6789]),|`$@z^SI!';   // ของสูงที่ทอดเงาลงช่องข้างล่าง/ขวา
  const WATERS = 'wi';
  const GROUND = '.:fTgveda;{_-+L0O2x1345=ฌต';
  function decor(ctx, ch, x, y, sx, sy, frame, nightLit, lamps) {
    const at = (dx, dy) => tileAt(x + dx, y + dy);
    const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(sx + a, sy + b, w, h); };
    if (WATERS.includes(ch) && tileVariant(ch, x, y) !== 'mud') {   // ขอบน้ำ: หาดทรายบางๆ + ฟองคลื่นขยับ
      const land = (t) => !WATERS.includes(t) && t !== '0';
      const f = (frame + x + y) % 2;
      if (land(at(0, -1))) { R('rgba(222,206,160,0.9)', 0, 0, 16, 2); R('rgba(240,250,255,0.85)', f, 2, 4, 1); R('rgba(240,250,255,0.85)', 8 + f, 2, 5, 1); }
      if (land(at(0, 1))) { R('rgba(222,206,160,0.9)', 0, 14, 16, 2); R('rgba(240,250,255,0.8)', 3 - f, 13, 5, 1); R('rgba(240,250,255,0.8)', 11 - f, 13, 3, 1); }
      if (land(at(-1, 0))) { R('rgba(222,206,160,0.9)', 0, 0, 2, 16); R('rgba(240,250,255,0.8)', 2, 3 + f, 1, 4); R('rgba(240,250,255,0.8)', 2, 10 + f, 1, 3); }
      if (land(at(1, 0))) { R('rgba(222,206,160,0.9)', 14, 0, 2, 16); R('rgba(240,250,255,0.8)', 13, 2 - f + 2, 1, 4); R('rgba(240,250,255,0.8)', 13, 11 - f, 1, 3); }
      return;
    }
    if (GROUND.includes(ch)) {
      // เงาตกจากของสูง: แดดส่องจากซ้ายบน เงาลงด้านล่างและด้านขวา
      const up = at(0, -1), left = at(-1, 0), ul = at(-1, -1);
      if (TALL.includes(up) && up !== ch) { ctx.fillStyle = 'rgba(20,24,40,0.22)'; ctx.fillRect(sx, sy, 16, 3); ctx.fillStyle = 'rgba(20,24,40,0.12)'; ctx.fillRect(sx, sy + 3, 16, 2); }
      if (TALL.includes(left) && left !== ch) { ctx.fillStyle = 'rgba(20,24,40,0.16)'; ctx.fillRect(sx, sy + (TALL.includes(up) ? 5 : 0), 3, 16 - (TALL.includes(up) ? 5 : 0)); }
      else if (TALL.includes(ul) && !TALL.includes(up)) { ctx.fillStyle = 'rgba(20,24,40,0.14)'; ctx.fillRect(sx, sy, 3, 3); }
    }
    if (ch === 'ต') {   // พรมทางเดินร้านเน็ต: เส้นไฟนีออนตามขอบ
      const c = frame ? '#4fe0ff' : '#2f9ab0';
      if (at(-1, 0) !== 'ต') R(c, 0, 0, 1, 16); if (at(1, 0) !== 'ต') R(c, 15, 0, 1, 16);
      if (at(0, -1) !== 'ต') R(c, 0, 0, 16, 1); if (at(0, 1) !== 'ต') R(c, 0, 15, 16, 1);
    }
    if (ch === 'ฌ') {   // พรมแดง: ขอบทองด้านที่ไม่ต่อพรม
      if (at(-1, 0) !== 'ฌ') R('#c9a45a', 0, 0, 2, 16); if (at(1, 0) !== 'ฌ') R('#c9a45a', 14, 0, 2, 16);
      if (at(0, -1) !== 'ฌ') R('#c9a45a', 0, 0, 16, 2); if (at(0, 1) !== 'ฌ') R('#c9a45a', 0, 14, 16, 2);
    }
    if (ch === ':') {   // ทางดิน: หญ้าแซมขอบ
      const grassy = (t) => '.fJ#&S'.includes(t);
      const tuft = (a, b) => { R('#8fa64e', a, b, 1, 2); R('#a9bc62', a + 1, b - 1, 1, 2); };
      if (grassy(at(0, -1))) for (let k = (x * 5) % 4; k < 16; k += 5) tuft(k, 0);
      if (grassy(at(0, 1))) for (let k = (x * 3) % 4 + 1; k < 16; k += 5) tuft(k, 14);
      if (grassy(at(-1, 0))) for (let k = (y * 5) % 4; k < 16; k += 5) tuft(0, k);
      if (grassy(at(1, 0))) for (let k = (y * 3) % 4 + 2; k < 16; k += 5) tuft(14, k);
    }
    if (ch === 'a') {   // ขอบถนนติดฟุตปาธ: ขอบคอนกรีต + เส้นขาวริมถนน
      if (at(0, -1) !== 'a' && at(0, -1) !== '+' && at(0, -1) !== '@') { R('#8a8a90', 0, 0, 16, 2); R('#e8e4d8', 0, 3, 16, 1); }
      if (at(0, 1) !== 'a' && at(0, 1) !== '+' && at(0, 1) !== '@') { R('#e8e4d8', 0, 12, 16, 1); R('#3e3e46', 0, 14, 16, 2); }
    }
    if (nightLit && 'CUhm'.includes(ch)) {   // กลางคืน: บางห้องเปิดไฟ
      const v = Math.floor(hash(x, y) * 4), lit = hash(x * 7, y * 3) < 0.55;
      if (!lit) return;
      const win = ch === 'C' ? [4, 4, 4, 5] : ch === 'U' ? (tileVariant(ch, x, y) === 'cross' ? null : [4, 4, 4, 6]) : v % 2 ? [4, 5, 8, 5] : null;
      if (!win) return;
      const flick = 0.75 + 0.25 * Math.sin((W.anim + x * 37 + y * 11) / 40);
      R(`rgba(255,214,130,${0.85 * flick})`, ...win);
      if (ch === 'C') R(`rgba(255,214,130,${0.85 * flick})`, 9, 4, 3, 5);
      lamps.push([sx + 8, sy + 7, 14]);
    }
  }
  // ข้อความบนป้ายไฟนีออนแต่ละป้าย (แผนที่:x เริ่ม,y)
  const NEON = { 'city:31,1': ' ★VALOLAND★CHAMPIONS★ESPORTS★ ', 'city:3,19': '★ HOTEL★', 'city:14,21': 'OPEN24H', 'city:24,20': 'NET★GG',
    'city:41,18': 'NIGHT★' };
  function tileVariant(ch, x, y) {
    if (ch === '%') return (y + 1 < W.rows.length && tileAt(x, y + 1) !== '%' ? 'face' : 'top') + (W.def.floor === '-' && W.def.music === 'hospital' ? 'H' : W.def.floor === '{' ? 'E' : W.def.floor === 'n' ? 'N' : W.def.floor === '*' ? 'M' : '');
    if (ch === 'U') return tileAt(x, y - 1) === 'N' && x % 6 === 2 ? 'cross' : '';
    if ('_xtcskBpWG~O2678[]1345=|`กคงฉชซฌฏฑฒณดต'.includes(ch)) return 'F' + (W.def.floor || '_') + ('1345='.includes(ch) ? LINK(ch, x, y) : '') + (ch === 'O' && W.def.wet ? 'wet' : '');
    if (ch === '*') {   // ป้ายไฟนีออน: หาตัวอักษรตามตำแหน่งในแถบป้าย
      let x0 = x; while (tileAt(x0 - 1, y) === '*') x0--;
      const word = NEON[`${W.map}:${x0},${y}`] || 'OPEN★';
      return 'L' + (word[(x - x0) % word.length] || ' ');
    }
    if (ch === '!' && W.map === 'amphoe') return 'clock';
    if (ch === 'a') return y % 2 === 1 && x % 2 === 0 && tileAt(x, y + 1) === 'a' ? 'lane' : '';
    if (ch === 'D' && W.def.floor === '*') return 'DM';
    if (ch === 'D') return 'D' + (tileAt(x - 1, y) === 'C' || tileAt(x + 1, y) === 'C' ? 'C' : tileAt(x - 1, y) === 'Q' || tileAt(x + 1, y) === 'Q' ? 'Q' : '(D'.includes(tileAt(x - 1, y)) && '(D'.includes(tileAt(x + 1, y)) ? 'A' : '');
    if (ch === '(') return tileAt(x, y - 1) !== '(' && tileAt(x, y - 1) !== ')' ? 'top' : tileAt(x, y + 1) !== '(' && tileAt(x, y + 1) !== ')' ? 'base' : '';
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
      if (ch === '*' || ch === ')') lamps.push([x * TS - cx + 8, y * TS - cy + 8, ch === ')' ? 30 : 24]);
      if (ch === 'Y' && tileVariant(ch, x, y) === 'on') lamps.push([x * TS - cx + 8, y * TS - cy + 7, 46]);
      if (ch === '~') drawCurtainSway(ctx, x, y, x * TS - cx, y * TS - cy);
    }
    // รายละเอียดเสริมทับพื้น: เงาตึก/ต้นไม้ ขอบน้ำ ขอบทางดิน ขอบถนน ไฟหน้าต่างตอนกลางคืน
    const nightLit = !W.def.indoor && G.isNight();
    for (let y = y0; y <= y0 + VH; y++) for (let x = x0; x <= x0 + VW; x++) {
      if (y >= rows || x >= cols) continue;
      decor(ctx, W.rows[y][x], x, y, x * TS - cx, y * TS - cy, frame, nightLit, lamps);
    }
    if (W.amb) drawAmbientLow(ctx, cx, cy);
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
    if (W.amb) for (const w of W.amb.walkers) {   // คนเดินไปมา (ประกอบฉาก คุยไม่ได้)
      const m = w.mv, k = m ? m.t : 0, wx = m ? m.fx + (m.tx - m.fx) * k : w.x, wy = m ? m.fy + (m.ty - m.fy) * k : w.y;
      actors.push({ y: wy - 0.02, draw: () => drawActor(ctx, w.look, Math.round(wx * TS - cx), Math.round(wy * TS - cy), w.dir, m ? (Math.floor(W.anim / 8) % 2) + 1 : 0) });
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    if (W.amb) drawAmbientHigh(ctx, cx, cy);
    // หญ้าบังขา
    const here = tileAt(S.x, S.y);
    if ('Tgv'.includes(here) && !W.moving) { ctx.fillStyle = here === 'T' ? '#6e9b3a' : here === 'v' ? '#7a9a4a' : '#5f8a3a'; ctx.fillRect(S.x * TS - cx + 2, S.y * TS - cy + 11, 12, 5); }
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
    if (!G.mapShot) ctx.drawImage(vignette(), 0, 0);   // mapShot = ถ่ายภาพแมพเต็มแผ่นตอนทดสอบ
  };

  // ---------- ของประกอบฉาก: ปลาว่าย ใบไม้ร่วง รถวิ่ง คนเดิน เงาเมฆ น้ำระยิบ ----------
  const WALKER_LOOKS = {
    village: ['elder', 'samorn', 'beedad', 'beemom', 'vendor', 'coop', 'teryai'], market: ['vendor', 'coop', 'samorn', 'driver', 'beemom', 'mkowner'],
    field: ['beedad', 'tasi'], phong: ['fisher', 'beedad', 'coop'],
    city: ['student1', 'student2', 'coop', 'guard', 'henchman2', 'vendor', 'beemom', 'eng:eng_mech:2', 'eng:med_nurse:4', 'samorn'],
    amphoe: ['receptionist', 'coop', 'guard', 'yaihom', 'eng:med_nurse:1', 'eng:med_doc:3', 'vendor', 'hiatong', 'breadlady'],
  };
  const CAR_COLS = ['#d9455a', '#3a7fb0', '#f4f4ec', '#2a2a33', '#e8c034', '#5f9a50'];
  function makeAmbient() {
    const A = { fish: [], leaves: [], cars: [], walkers: [], lanes: [], trees: [], ripples: [], clouds: [] };
    const rows = W.rows, H = rows.length, Wd = rows[0].length, out = !W.def.indoor;
    const water = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
      const c = rows[y][x];
      if (c === 'w' || c === 'i') water.push([x, y]);
      if (out && '#JP&'.includes(c)) A.trees.push([x, y, c]);
    }
    for (let i = 0; i < Math.min(10, Math.floor(water.length / 8)); i++) {
      const [x, y] = water[Math.floor(G.rng() * water.length)], a = G.rng() * 6.28;
      A.fish.push({ x: x * TS + 8, y: y * TS + 8, a, sp: 0.25 + G.rng() * 0.25, col: ['#f28c28', '#c8d0d8', '#d9455a', '#e8c034'][i % 4], turn: 0 });
    }
    A.water = water;
    if (out) {   // ช่องทางรถ: แถวถนนลาดยางยาวต่อกันอย่างน้อย 12 ช่อง
      for (let y = 0; y < H; y++) {
        let x0 = -1;
        for (let x = 0; x <= Wd; x++) {
          const on = x < Wd && '+a@'.includes(rows[y][x]);
          if (on && x0 < 0) x0 = x;
          if (!on && x0 >= 0) { if (x - x0 >= 12) A.lanes.push({ y, x0, x1: x - 1, dir: A.lanes.filter((l) => Math.abs(l.y - y) <= 1).length % 2 ? -1 : 1, cd: G.rng() * 200 }); x0 = -1; }
        }
      }
      const looks = WALKER_LOOKS[W.map] || (W.map === 'kku' ? null : []);
      const n = G.raining() ? 0 : G.isNight() ? 1 : W.map === 'field' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        for (let tries = 0; tries < 40; tries++) {
          const x = Math.floor(G.rng() * Wd), y = Math.floor(G.rng() * H);
          if (!':eL.'.includes(rows[y][x]) || !ambFree(x, y, A)) continue;
          const look = looks ? looks[Math.floor(G.rng() * looks.length)] : `eng:${['eng_mech', 'eng_civil', 'eng_elec', 'eng_chem', 'eng_env', 'eng_ie'][i % 6]}:${(i * 3 + 1) % 8}`;
          if (looks && !looks.length) break;
          A.walkers.push({ x, y, dir: 'down', look, wait: 30 + G.rng() * 90, mv: null }); break;
        }
      }
      for (let i = 0; i < 3; i++) A.clouds.push({ x: G.rng() * Wd * TS, y: G.rng() * H * TS, r: 40 + G.rng() * 40, v: 0.08 + G.rng() * 0.08 });
    }
    return A;
  }
  // ช่องว่างสำหรับคนเดิน/รถ: เดินได้ ไม่ใช่ทางออก ไม่มีใครยืนอยู่
  function ambFree(x, y, A) {
    const S = G.state;
    if (!WALK.includes(tileAt(x, y)) || warpAt(x, y) || doorAt(x, y) || npcAt(x, y)) return false;
    if (x === S.x && y === S.y) return false;
    if (W.moving && x === W.moving.tx && y === W.moving.ty) return false;
    if (W.follow && x === W.follow.x && y === W.follow.y) return false;
    return !(A || W.amb).walkers.some((w) => (w.x === x && w.y === y) || (w.mv && w.mv.tx === x && w.mv.ty === y));
  }
  function updateAmbient() {
    const A = W.amb, S = G.state;
    for (const f of A.fish) {   // ปลาว่าย: ชนขอบน้ำแล้วหันกลับ บางทีกระโดดเป็นวงน้ำ
      if (--f.turn <= 0) { f.a += (G.rng() - 0.5) * 1.6; f.turn = 40 + G.rng() * 80; }
      const nx = f.x + Math.cos(f.a) * f.sp, ny = f.y + Math.sin(f.a) * f.sp, t = tileAt(Math.floor(nx / TS), Math.floor(ny / TS));
      if (t === 'w' || t === 'i') { f.x = nx; f.y = ny; } else f.a += Math.PI * (0.6 + G.rng() * 0.8);
      if (G.rng() < 0.0015) A.ripples.push({ x: f.x, y: f.y, t: 0 });
    }
    A.ripples = A.ripples.filter((r) => (r.t += 1) < 50);
    if (A.trees.length && W.cam && A.leaves.length < 24 && G.rng() < (G.raining() ? 0.25 : 0.12)) {   // ใบไม้ร่วงจากต้นไม้ที่อยู่ในจอ
      const vis = A.trees.filter(([x, y]) => x * TS >= W.cam.cx - 16 && x * TS <= W.cam.cx + 240 && y * TS >= W.cam.cy - 16 && y * TS <= W.cam.cy + 160);
      if (vis.length) {
        const [x, y, c] = vis[Math.floor(G.rng() * vis.length)];
        A.leaves.push({ x: x * TS + G.rng() * 16, y: y * TS + 4 + G.rng() * 6, vx: 0.15 + G.rng() * 0.3, vy: 0.18 + G.rng() * 0.2, ph: G.rng() * 6, life: 160 + G.rng() * 100,
          col: c === 'J' ? '#f2a0c0' : ['#6cc04a', '#c9b84a', '#d9822b', '#8fbf5a'][Math.floor(G.rng() * 4)] });
      }
    }
    for (const l of A.leaves) { l.ph += 0.06; l.x += l.vx + Math.sin(l.ph) * 0.35; l.y += l.vy; l.life--; }
    A.leaves = A.leaves.filter((l) => l.life > 0);
    for (const ln of A.lanes) {   // รถวิ่งตามถนน หยุดรอถ้ามีคนยืนขวางหน้า
      if (--ln.cd <= 0 && A.cars.filter((c) => c.lane === ln).length < 2) {
        const kind = W.map === 'kku' && G.rng() < 0.3 ? 'bike' : G.rng() < 0.25 ? 'bike' : W.map === 'kku' && G.rng() < 0.2 ? 'bus' : 'car';
        A.cars.push({ lane: ln, kind, x: ln.dir > 0 ? ln.x0 * TS - 24 : ln.x1 * TS + 24, sp: (kind === 'bike' ? 1.3 : 0.9) + G.rng() * 0.4, col: CAR_COLS[Math.floor(G.rng() * CAR_COLS.length)] });
        ln.cd = 200 + G.rng() * 360;
      }
    }
    for (const c of A.cars) {
      const ln = c.lane, front = c.x + ln.dir * 14;
      const blocked = [[S.x, S.y], W.follow ? [W.follow.x, W.follow.y] : null, ...A.walkers.map((w) => [w.x, w.y])].some((p) => p && p[1] === ln.y && (p[0] * TS + 8 - front) * ln.dir > -4 && (p[0] * TS + 8 - front) * ln.dir < 14)
        || W.npcs.some((n) => n.y === ln.y && (n.x * TS + 8 - front) * ln.dir > -4 && (n.x * TS + 8 - front) * ln.dir < 14);
      if (!blocked) c.x += ln.dir * c.sp;
    }
    A.cars = A.cars.filter((c) => c.x > c.lane.x0 * TS - 40 && c.x < c.lane.x1 * TS + 40);
    for (const w of A.walkers) {   // คนเดินทีละช่อง เดินไปเรื่อยๆ แล้วหยุดพัก
      if (w.mv) { w.mv.t += 1 / 18; if (w.mv.t >= 1) { w.x = w.mv.tx; w.y = w.mv.ty; w.mv = null; } continue; }
      if (--w.wait > 0) continue;
      const dirs = Object.keys(DIRS).sort(() => G.rng() - 0.5);
      const keep = G.rng() < 0.7 ? [w.dir, ...dirs] : dirs;
      for (const d of keep) {
        const [dx, dy] = DIRS[d], nx = w.x + dx, ny = w.y + dy;
        if (':eL.f'.includes(tileAt(nx, ny)) && ambFree(nx, ny)) { w.dir = d; w.mv = { fx: w.x, fy: w.y, tx: nx, ty: ny, t: 0 }; break; }
      }
      w.wait = G.rng() < 0.2 ? 60 + G.rng() * 120 : 4;
    }
    for (const c of A.clouds) { c.x += c.v; if (c.x - c.r > W.rows[0].length * TS) c.x = -c.r; }
  }
  function drawCar(ctx, c, x, y) {
    const R = (col, a, b, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
    const f = c.lane.dir > 0;
    if (c.kind === 'bike') {
      R('#2a2a2a', -6, 4, 4, 4); R('#2a2a2a', 3, 4, 4, 4); R(c.col, -4, 1, 9, 3); R('#3a3f48', f ? 4 : -6, -1, 2, 3);
      R('#d9a57b', -2, -6, 4, 4); R('#2f3d6b', -2, -2, 4, 4); R(c.col === '#f4f4ec' ? '#d9455a' : '#f4f4ec', -2, -8, 4, 2);
      return;
    }
    const w = c.kind === 'bus' ? 30 : 22, h0 = c.kind === 'bus' ? -10 : -6;
    R('rgba(0,0,0,0.25)', -w / 2 + 1, 6, w, 2);
    R(c.kind === 'bus' ? '#2f6fb0' : c.col, -w / 2, h0 + 4, w, 10 - h0 - 4 + 1);
    R(c.kind === 'bus' ? '#2f6fb0' : c.col, -w / 2 + 4, h0, w - 9, 5);
    R('#9fc4dc', -w / 2 + 6, h0 + 1, 5, 3); R('#9fc4dc', -w / 2 + 12, h0 + 1, w - 19, 3);
    R('#2a2a2a', -w / 2 + 3, 5, 5, 4); R('#2a2a2a', w / 2 - 8, 5, 5, 4);
    R(f ? '#fff2a8' : '#d9455a', f ? w / 2 - 1 : -w / 2, h0 + 6, 1, 2); R(f ? '#d9455a' : '#fff2a8', f ? -w / 2 : w / 2 - 1, h0 + 6, 1, 2);
    if (c.kind === 'bus') R('#f2d24b', -w / 2, 2, w, 1);
  }
  function drawAmbientLow(ctx, cx, cy) {
    const A = W.amb;
    for (const f of A.fish) {   // ปลาใต้น้ำ (เงาจางๆ)
      const x = Math.round(f.x - cx), y = Math.round(f.y - cy); if (x < -8 || x > 248 || y < -8 || y > 168) continue;
      const dx = Math.cos(f.a) >= 0 ? 1 : -1;
      ctx.globalAlpha = 0.75; ctx.fillStyle = f.col; ctx.fillRect(x - 3, y, 6, 2); ctx.fillRect(x - 3 - dx * 2, y - (W.anim % 20 < 10 ? 1 : 0), 2, 3);
      ctx.fillStyle = '#1b1414'; ctx.fillRect(x + dx * 1, y, 1, 1); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = 'rgba(232,248,255,0.7)'; ctx.lineWidth = 1;
    for (const r of A.ripples) { ctx.globalAlpha = 1 - r.t / 50; ctx.beginPath(); ctx.ellipse(r.x - cx, r.y - cy, 2 + r.t / 5, 1 + r.t / 10, 0, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (A.water.length && !G.isNight()) {   // น้ำระยิบระยับ
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 6; i++) { const [x, y] = A.water[(Math.floor(W.anim / 18) * 7 + i * 131) % A.water.length]; const sx = x * TS - cx + ((i * 5) % 12) + 2, sy = y * TS - cy + ((i * 3) % 10) + 3; if (sx > -2 && sx < 242 && sy > -2 && sy < 162) ctx.fillRect(sx, sy, 2, 1); }
    }
    for (const c of A.cars) { const x = c.x - cx, y = c.lane.y * TS + 8 - cy; if (x > -40 && x < 280 && y > -20 && y < 180) drawCar(ctx, c, x, y); }
  }
  function drawAmbientHigh(ctx, cx, cy) {
    const A = W.amb;
    for (const l of A.leaves) {
      const x = Math.round(l.x - cx), y = Math.round(l.y - cy); if (x < -4 || x > 244 || y < -4 || y > 164) continue;
      ctx.globalAlpha = Math.min(1, l.life / 40); ctx.fillStyle = l.col;
      if (Math.sin(l.ph) > 0) { ctx.fillRect(x, y, 3, 2); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 1, 3, 1); } else { ctx.fillRect(x, y, 2, 3); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 1, y, 1, 3); }
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + 2, y + 6, 2, 1);   // เงาใบไม้บนพื้น
    }
    ctx.globalAlpha = 1;
    if (A.clouds.length && !G.isNight() && !G.raining()) {   // เงาเมฆลอยผ่านช้าๆ
      for (const c of A.clouds) {
        const x = c.x - cx, y = c.y - cy; if (x < -c.r || x > 240 + c.r || y < -c.r || y > 160 + c.r) continue;
        const g = ctx.createRadialGradient(x, y, c.r * 0.2, x, y, c.r); g.addColorStop(0, 'rgba(20,30,60,0.12)'); g.addColorStop(1, 'rgba(20,30,60,0)');
        ctx.fillStyle = g; ctx.fillRect(x - c.r, y - c.r, c.r * 2, c.r * 2);
      }
    }
  }
  let vig = null;
  function vignette() {   // ขอบจอมืดลงนิดๆ ให้ภาพดูนุ่มเหมือนเลนส์
    if (vig) return vig;
    vig = document.createElement('canvas'); vig.width = 240; vig.height = 160;
    const g = vig.getContext('2d'), grd = g.createRadialGradient(120, 80, 60, 120, 80, 150);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(10,10,30,0.28)'); g.fillStyle = grd; g.fillRect(0, 0, 240, 160);
    return vig;
  }

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
    ctx.fillStyle = 'rgba(10,14,30,0.26)'; ctx.beginPath(); ctx.ellipse(x + 8, y + 15, 5.5, 2, 0, 0, 7); ctx.fill();   // เงานุ่มใต้เท้า
    const spr = custom && (look === 'toad' || look === 'item' || look === 'buffalo' || look === 'bed') ? G.sprite(look) : G.actorSprite(look, dir, frame);
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
