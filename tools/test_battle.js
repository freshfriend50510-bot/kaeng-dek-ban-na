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
console.log(fails ? `ไม่ผ่าน ${fails} ข้อ` : 'ผ่านทุกข้อ');
process.exit(fails ? 1 : 0);
