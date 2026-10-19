// ทดสอบตรรกะเกมโดยไม่ต้องมีหน้าจอ: node tools/test_battle.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = { window: {}, console, Math, Date, Set };
vm.createContext(ctx);
for (const f of ['js/data.js', 'js/formulas.js', 'js/battle.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const G = ctx.window.G; G.DATA = ctx.window.GAME_DATA;
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('ไม่ผ่าน:', msg); } };

// 1) ค่าสเตตัส: เติ้ล Lv5 IV15 HP ต้องเป็น 22 ตามเอกสาร
const tle = G.makeMon('tle', 5, { ivs: 15 });
ok(tle.stats.hp === 22, 'HP เติ้ล Lv5 = ' + tle.stats.hp);
// 2) ดาเมจตามตัวอย่างโครงสูตร: ไม่ติดลบ ไม่เป็น 0 ถ้าธาตุได้ผล
const bee = G.makeMon('bee', 5, { ivs: 15 }), phong = G.makeMon('phong', 4, { ivs: 15 });
const d = G.damage(bee, phong, G.DATA.moves.mud_throw, { rand: 100 });
ok(d.eff === 2 && d.dmg > 0, 'ดิน → สายฟ้า ต้อง ×2 ได้ ' + JSON.stringify(d));
// 3) ต่อสู้ครบ 300 รอบ ไม่ค้าง ไม่ error
G.state = { bag: { rice_ball: 999, herb: 0 } };
const results = {};
for (let i = 0; i < 300; i++) {
  G.rng = G.makeRng(i + 1);
  const party = [G.makeMon(['bee', 'am', 'tle', 'ter'][i % 4], 6)];
  const b = new G.Battle(party, [G.makeMon('pob', 4)], { kind: 'wild' });
  let n = 0;
  while (!b.over && n++ < 200) {
    const ev = i % 3 === 0 && b.foe.hp < b.foe.stats.hp / 2 ? b.turnAction({ type: 'item', id: 'rice_ball' })
      : b.turnAction({ type: 'move', idx: n % b.me.moves.length });
    if (ev.some((e) => e.t === 'need_switch')) break;
  }
  ok(n < 200, 'การต่อสู้ค้างที่รอบ ' + i);
  results[b.over || 'switch'] = (results[b.over || 'switch'] || 0) + 1;
}
console.log('ผลการต่อสู้ 300 ครั้ง:', JSON.stringify(results));
// 4) เลเวลอัปและเรียนท่า
G.rng = G.makeRng(7);
const k = G.makeMon('bee', 8, { ivs: 15 }); k.exp = 700;
const b2 = new G.Battle([k], [G.makeMon('pret', 7, { ivs: 0 })], { kind: 'trainer', trainerName: 'ทดสอบ' });
let ev2 = [];
for (let n = 0; n < 60 && !b2.over; n++) ev2 = ev2.concat(b2.turnAction({ type: 'move', idx: 0 }));
ok(b2.over === 'win' && k.lv >= 9, 'ชนะแล้วต้องเลเวลอัป ได้ lv ' + k.lv + ' ' + b2.over);
ok(ev2.some((e) => e.t === 'learn' && e.move === 'pound_ground'), 'ต้องได้เรียนท่าตะโกนลั่นทุ่งที่ Lv9');
// 5) น้องวิศวะ: ชื่อไม่ซ้ำกับคนที่มีอยู่แล้ว และได้หน้าตาเฉพาะคน
G.rng = G.makeRng(3);
const taken = new Set();
for (let i = 0; i < 8; i++) { const e = G.makeEng('eng_chem', 12, { taken }); ok(!taken.has(e.name), 'ชื่อน้องวิศวะซ้ำ ' + e.name); ok(/^eng:eng_chem:\d$/.test(e.look), 'หน้าตาน้องวิศวะ ' + e.look); taken.add(e.name); }
// 6) ของถือ: ผ้ายันต์ลดดาเมจจากผีสาง ถุงมือช่างเพิ่มท่ากายภาพ
const tank = G.makeMon('bee', 10, { ivs: 15 }); tank.held = 'yantra';
ok(G.heldMult(G.makeMon('pob', 10), tank, G.DATA.moves.raw_bite) === 0.9, 'ผ้ายันต์ต้อง ×0.9');
const hitter = G.makeMon('bee', 10, { ivs: 15 }); hitter.held = 'gloves';
ok(Math.abs(G.heldMult(hitter, G.makeMon('pob', 10), G.DATA.moves.tackle) - 1.1) < 1e-9, 'ถุงมือช่างต้อง ×1.1');
// 7) ยิม 3: พี่บูมใช้ยาฟื้น 2 ครั้ง, ยาหม้อดินแก้สถานะ, ท้องเสียทำให้ฟื้นได้น้อยลง
G.rng = G.makeRng(5);
const boom = G.makeMon('boom', 26, { ivs: 25 }); boom.hp = 5;
const b3 = new G.Battle([G.makeMon('tle', 10)], [boom], { kind: 'master', trainerName: 'พี่บูม', ai: 2, potions: 2 });
const ev3 = b3.turnAction({ type: 'move', idx: 0 });
ok(b3.potions === 1 && ev3.some((e) => e.t === 'msg' && e.text.includes('ใช้ยาฟื้น')), 'พี่บูมต้องใช้ยาฟื้นเมื่อ HP ต่ำ');
const sick = G.makeMon('boom', 26, { ivs: 25 }); sick.hp = 40; sick.status = 'psn';
const b4 = new G.Battle([G.makeMon('tle', 10)], [sick], { kind: 'master', trainerName: 'พี่บูม', ai: 2 });
b4.applyEffect('heal50cure', 'f', [], false);
ok(sick.status === null && sick.hp === Math.min(sick.stats.hp, 40 + Math.floor(sick.stats.hp / 2)), 'ยาหม้อดินต้องแก้ท้องเสียและฟื้นครึ่งหนึ่ง');
const sick2 = G.makeMon('pret', 20); sick2.hp = 10; sick2.status = 'psn';
const b5 = new G.Battle([G.makeMon('tle', 10)], [sick2], { kind: 'wild' });
b5.applyEffect('heal50', 'f', [], false);
ok(sick2.hp === 10 + Math.floor(sick2.stats.hp / 4), 'ท้องเสียอยู่ ฟื้นได้แค่ 1/4');
// 8) น้องหมอพยาบาล: ชื่อเฉพาะคน ชวนด้วยขนมปังสังขยาได้เต็ม
const nurse = G.spawn('med_nurse', 20);
ok(/^eng:med_nurse:\d$/.test(nurse.look) && G.isPerson(nurse), 'น้องพยาบาลต้องได้หน้าตาเฉพาะคน');
// 9) กิมมิคตามชื่อท่า: ตีหลายครั้ง ดูดพลัง เจ็บตัวเอง พักชาร์จ หลบ ฝนกลางสนาม ทุกท่ามีกิมมิค
ok(Object.keys(G.DATA.moves).every((id) => G.GIM[id] && G.gimmickText(id)), 'ทุกท่าต้องมีกิมมิคและคำอธิบาย: ' + Object.keys(G.DATA.moves).filter((id) => !G.GIM[id] || !G.gimmickText(id)).join(','));
const gm = (moveId, setup) => { G.rng = G.makeRng(9); const a = G.makeMon('ter', 40, { ivs: 15 }); a.moves = [{ id: moveId, pp: 20 }]; const f = G.makeMon('pob', 40, { ivs: 15 }); f.moves = [{ id: 'tongue', pp: 30 }];
  const bb = new G.Battle([a], [f], { kind: 'wild' }); if (setup) setup(bb, a, f); return { bb, a, f, ev: bb.turnAction({ type: 'move', idx: 0 }) }; };
let r9 = gm('blade_storm'); ok(r9.ev.some((e) => e.t === 'msg' && /โดนไป [2-5] ครั้ง/.test(e.text)), 'พายุมีดบินต้องตีหลายครั้ง');
r9 = gm('raw_bite', (bb, a) => { a.hp = 10; }); ok(r9.a.hp > 10 && r9.ev.some((e) => e.t === 'msg' && e.text.includes('ดูดพลัง')), 'งับของดิบต้องดูดพลัง');
r9 = gm('buffalo_charge'); ok(r9.a.hp < r9.a.stats.hp && r9.ev.some((e) => e.t === 'msg' && e.text.includes('เจ็บตัวเอง')), 'ควายชนต้องเจ็บตัวเอง');
r9 = gm('showstopper'); ok(r9.bb.pv.recharge || r9.bb.over, 'บั้งไฟต้องพักชาร์จ'); if (!r9.bb.over) { const e2 = r9.bb.turnAction({ type: 'move', idx: 0 }); ok(e2.some((e) => e.t === 'msg' && e.text.includes('พักชาร์จ')), 'เทิร์นหลังบั้งไฟต้องพัก'); }
r9 = gm('wind_step'); ok(r9.bb.pv.dodge === false || r9.ev.some((e) => e.t === 'msg' && e.text.includes('หลบ')), 'ก้าวหลบสายลมต้องหลบได้');
r9 = gm('rain_call'); ok(r9.bb.rain > 0, 'ร้องเรียกฝนต้องมีฝนกลางสนาม');
r9 = gm('treasure_guard'); ok(r9.bb.bonusMoney > 0, 'หวงสมบัติต้องได้เหรียญ');
console.log(fails ? `ไม่ผ่าน ${fails} ข้อ` : 'ผ่านทุกข้อ');
process.exit(fails ? 1 : 0);
