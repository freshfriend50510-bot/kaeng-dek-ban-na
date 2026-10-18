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

  G.calcStats = function (spId, lv, ivs) {
    const sp = G.DATA.species[spId];
    const m = sp.kind === 'kid' ? G.stageMult(lv) : 1;
    const out = {};
    for (const k of STATS) {
      const b = Math.round(sp[k] * m);
      const core = Math.floor(((2 * b + ivs[k]) * lv) / 100);
      out[k] = k === 'hp' ? core + lv + 10 : core + 5;
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
    const stats = G.calcStats(spId, lv, ivs);
    return {
      sp: spId, name: opt.name || sp.name, lv, exp: G.expFor(lv), ivs, stats,
      hp: stats.hp, status: null, slp: 0,
      moves: G.movesAt(spId, lv).map((id) => ({ id, pp: G.DATA.moves[id].pp })),
    };
  };

  G.refreshStats = function (mon) {
    const old = mon.stats.hp;
    mon.stats = G.calcStats(mon.sp, mon.lv, mon.ivs);
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

  G.expGain = (foe, trainer) => Math.floor((G.DATA.species[foe.sp].baseexp * foe.lv) / 7 * (trainer ? 1.5 : 1));

  // โอกาสชวนผีสางเข้าแก๊ง (สูตรเดียวกับอัตราจับรุ่น III-IV)
  G.recruitValue = function (mon, foodMult) {
    const R = G.DATA.species[mon.sp].catch;
    const M = mon.stats.hp, H = mon.hp;
    const S = mon.status === 'slp' ? 2 : (mon.status === 'par' || mon.status === 'psn') ? 1.5 : 1;
    return Math.max(1, (((3 * M - 2 * H) * R * foodMult) / (3 * M)) * S);
  };
})(window.G = window.G || {});
