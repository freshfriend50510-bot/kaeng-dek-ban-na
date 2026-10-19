// สูตรหลักของเกม — ต้องตรงกับ tools/simulate.py เสมอ
(function (G) {
  'use strict';
  const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

  // ตัวสุ่มที่ใส่ seed ได้ (mulberry32) ใช้เล่นซ้ำสถานการณ์เดิมตอนหาบั๊ก
  G.makeRng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
    f.chance = (pct) => f() * 100 < pct;
    return f;
  };
  G.rng = G.makeRng(Date.now());

  // เด็กเติบโต (เปลี่ยนชุด/ของประจำตัว) ที่เลเวล 16 และ 32
  G.growthStage = (lv) => (lv >= 32 ? 3 : lv >= 16 ? 2 : 1);
  G.stageMult = (lv) => [1, 1, 1.35, 1.75][G.growthStage(lv)];

  // นิสัย: เพิ่มค่าหนึ่ง ×1.1 ลดอีกค่า ×0.9 (easy = สบายๆ ไม่เปลี่ยนอะไร)
  G.NATURES = {
    easy: ['สบายๆ'], hot: ['ใจร้อน', 'atk', 'spa'], shy: ['ขี้อาย', 'def', 'atk'], dreamy: ['ช่างฝัน', 'spa', 'atk'], calm: ['ใจเย็น', 'spd', 'spe'],
    naughty: ['ซุกซน', 'spe', 'def'], greedy: ['ตะกละ', 'atk', 'spe'], playful: ['ขี้เล่น', 'spe', 'spa'], sly: ['เจ้าเล่ห์', 'spa', 'def'],
    stubborn: ['หัวแข็ง', 'def', 'spa'], kind: ['ใจดี', 'spd', 'atk'], diligent: ['ขยัน', 'atk', 'spd'], brave: ['ใจเด็ด', 'atk', 'def'],
  };
  G.randomNature = (rng) => { const k = Object.keys(G.NATURES); return k[Math.floor((rng || G.rng)() * k.length)]; };
  G.calcStats = function (spId, lv, ivs, nature) {
    const nt = G.NATURES[nature] || G.NATURES.easy;
    const sp = G.DATA.species[spId];
    const m = sp.kind === 'kid' ? G.stageMult(lv) : 1;
    const out = {};
    for (const k of STATS) {
      const b = Math.round(sp[k] * m);
      const core = Math.floor(((2 * b + ivs[k]) * lv) / 100);
      out[k] = k === 'hp' ? core + lv + 10 : Math.floor((core + 5) * (nt[1] === k ? 1.1 : nt[2] === k ? 0.9 : 1));
    }
    return out;
  };

  G.expFor = (lv) => lv * lv * lv; // กลุ่ม Medium Fast: n³

  G.movesAt = function (spId, lv) {
    const list = G.DATA.species[spId].learnset.filter(([l]) => l <= lv).map(([, m]) => m);
    return [...new Set(list)].slice(-4);
  };

  G.makeMon = function (spId, lv, opt = {}) {
    const rng = opt.rng || G.rng;
    const ivs = {};
    for (const k of STATS) ivs[k] = opt.ivs != null ? opt.ivs : rng.int(0, 31);
    const sp = G.DATA.species[spId];
    const nature = opt.nature === 'random' ? G.randomNature(rng) : opt.nature || 'easy';
    const stats = G.calcStats(spId, lv, ivs, nature);
    const mon = {
      sp: spId, name: opt.name || sp.name, lv, exp: G.expFor(lv), ivs, stats,
      hp: stats.hp, status: null, slp: 0, held: null, nature,
      moves: G.movesAt(spId, lv).map((id) => ({ id, pp: G.DATA.moves[id].pp })),
    };
    if (opt.look) mon.look = opt.look;
    return mon;
  };

  // น้องวิศวะ: สุ่มคนจากรายชื่อสาขานั้น ไม่ซ้ำกับคนที่อยู่ในแก๊งแล้ว (taken = ชื่อที่ใช้ไปแล้ว)
  G.makeEng = function (spId, lv, opt = {}) {
    const rng = opt.rng || G.rng;
    const list = (G.DATA.engNames || {})[spId];
    if (!list) return G.makeMon(spId, lv, opt);
    const taken = opt.taken || new Set();
    let pool = list.map((e, i) => i).filter((i) => !taken.has(list[i].name));
    if (!pool.length) pool = list.map((e, i) => i);
    const i = pool[Math.floor(rng() * pool.length)];
    return G.makeMon(spId, lv, { ...opt, name: list[i].name, look: `eng:${spId}:${i}` });
  };
  // สร้างตัวละครตามชนิด (น้องวิศวะได้ชื่อ/หน้าตาเฉพาะคน)
  G.spawn = (spId, lv, opt = {}) => { opt = { nature: 'random', ...opt };   // ผีป่า/คนที่เจอ: สุ่มนิสัย
    return (G.DATA.engNames || {})[spId] ? G.makeEng(spId, lv, opt) : G.makeMon(spId, lv, opt); };

  // คนที่ชวนเข้าแก๊งได้ (น้องวิศวะ น้องหมอพยาบาล): มีชื่อและหน้าตาเฉพาะคน ชวนด้วยของกินคนละอย่างกับผี
  G.PERSON_KINDS = ['eng', 'med'];
  G.isPerson = (m) => G.PERSON_KINDS.includes(G.DATA.species[m.sp || m].kind);

  G.refreshStats = function (mon) {
    const old = mon.stats.hp;
    mon.stats = G.calcStats(mon.sp, mon.lv, mon.ivs, mon.nature);
    mon.hp = Math.min(mon.stats.hp, mon.hp + (mon.stats.hp - old));
  };

  G.typeEff = (moveType, defType) => G.DATA.chart[moveType][defType];

  G.stageFactor = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
  G.accFactor = (s) => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));

  // ctx: { crit, rand(85-100), atkStage, defStage, other }
  G.damage = function (att, def, move, ctx) {
    const sp = G.DATA.species;
    const phys = move.cat === 'phys';
    let aSt = ctx.atkStage || 0, dSt = ctx.defStage || 0;
    if (ctx.crit) { aSt = Math.max(0, aSt); dSt = Math.min(0, dSt); }
    let A = (phys ? att.stats.atk : att.stats.spa) * G.stageFactor(aSt);
    const D = (phys ? def.stats.def : def.stats.spd) * G.stageFactor(dSt);
    if (phys && att.status === 'brn') A *= 0.5;
    const L = att.lv, P = move.power;
    let dmg = Math.floor(Math.floor(((Math.floor((2 * L) / 5) + 2) * P * A) / D) / 50) + 2;
    if (ctx.crit) dmg = Math.floor(dmg * 1.5);
    dmg = Math.floor((dmg * ctx.rand) / 100);
    if (!move.typeless && move.type === sp[att.sp].type) dmg = Math.floor(dmg * 1.5);
    const eff = move.typeless ? 1 : G.typeEff(move.type, sp[def.sp].type);
    dmg = Math.floor(dmg * eff);
    dmg = Math.floor(dmg * (ctx.other || 1));
    if (eff > 0 && dmg < 1) dmg = 1;
    return { dmg, eff };
  };

  // ของถือ: ผ้ายันต์ลดดาเมจจากผีสาง ถุงมือช่าง/แว่นเซฟตี้เพิ่มดาเมจท่ากายภาพ/พิเศษ
  G.heldMult = function (att, def, move) {
    const I = G.DATA.items, sp = G.DATA.species;
    let k = 1;
    const a = att.held && I[att.held], d = def.held && I[def.held];
    if (a && a.for === 'phys' && move.cat === 'phys') k *= a.value;
    if (a && a.for === 'spec' && move.cat === 'spec') k *= a.value;
    if (a && a.for === move.type) k *= a.value;   // เช่น เกล็ดพญานาค ดินจอมปลวก: ท่าธาตุนั้นแรงขึ้น
    if (d && d.for === 'ghost' && sp[att.sp].kind === 'ghost') k *= d.value;
    return k;
  };

  G.expGain = (foe, trainer) => Math.floor((G.DATA.species[foe.sp].baseexp * foe.lv) / 7 * (trainer ? 1.5 : 1));

  // โอกาสชวนผีสางเข้าแก๊ง (สูตรเดียวกับอัตราจับรุ่น III-IV)
  G.recruitValue = function (mon, foodMult) {
    const R = G.DATA.species[mon.sp].catch;
    const M = mon.stats.hp, H = mon.hp;
    const S = mon.status === 'slp' ? 2 : (mon.status === 'par' || mon.status === 'psn') ? 1.5 : 1;
    return Math.max(1, (((3 * M - 2 * H) * R * foodMult) / (3 * M)) * S);
  };
})(window.G = window.G || {});
