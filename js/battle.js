// ตรรกะการต่อสู้ล้วนๆ ไม่แตะหน้าจอ: รับคำสั่ง คืนรายการเหตุการณ์ให้ UI เล่นทีละอัน
(function (G) {
  'use strict';
  const STATUS_NAME = { par: 'อัมพาต', slp: 'หลับ', psn: 'ท้องเสีย' };
  const STAT_NAME = { atk: 'พลังโจมตี', def: 'พลังป้องกัน', spa: 'พลังพิเศษ', spd: 'ป้องกันพิเศษ', spe: 'ความเร็ว', acc: 'ความแม่น' };
  const STRUGGLE = { id: 'struggle', name: 'ดิ้นสุดแรง', type: 'normal', cat: 'phys', power: 50, acc: 0, pp: 1, priority: 0, effect: '', chance: 0, typeless: true };

  const SOUND = ['wail', 'mermaid_song', 'pound_ground', 'wak_shout', 'squeak_wheel', 'radio_wave', 'cheer_faculty', 'lecture', 'case_present'];   // ท่าเสียง (นกร้องเพลง ×1.3)
  function freshVol() { return { st: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }, cnf: 0, turns: 0, recharge: false, flinch: false, dodge: false, focus: false, regen: 0, burn: 0, last: null, chain: 0 }; }

  // ---------- กิมมิคประจำท่า (ตามชื่อท่า) ----------
  // hits [ต่ำ,สูง] + per = ตีหลายครั้ง (พลังต่อครั้ง), recoil = เจ็บตัวเองตามดาเมจ, drain = ดูดพลัง, crit = โอกาสคริ, sure = ไม่พลาด,
  // sureIf = ไม่พลาดเมื่อ (night/person), crash = พลาดแล้วเจ็บตัว, boost = [เงื่อนไข, คูณ, ข้อความ], flinch = ศัตรูสะดุ้งเสียเทิร์น (ต้องตีก่อน),
  // recharge = เทิร์นหน้าต้องพัก, rain = เรียกฝนกลางสนาม 5 เทิร์น (ท่าน้ำแรงขึ้น), also = [ผล, โอกาส, เงื่อนไข] ผลเสริม, cure = หายอาการผิดปกติ,
  // regen = ฟื้นทีละนิดทุกเทิร์น, dodge = หลบท่าโจมตีครั้งต่อไป, focus = ท่าโจมตีครั้งต่อไปคริแน่, breakDef = ทำลายบัฟป้องกัน, haze = ลมพัดบัฟศัตรูหาย,
  // chain = ใช้ซ้ำติดกันแรงขึ้น, money = ได้เงินเพิ่มหลังจบ, scan = บอกพลังที่เหลือของศัตรู, burn = ไฟติดพื้นเผาศัตรูทุกเทิร์น, heal8 = ฟื้นนิดหน่อย
  const GIM = {
    tackle: { boost: ['foeFull', 1.5, 'เปิดฉากพุ่งชนเต็มแรง!'] }, silly_face: { also: ['cnf', 30], txt: 'ศัตรูอาจขำจนมึน' }, mud_throw: { also: ['foe_acc-1', 30], txt: 'โคลนอาจเข้าตา' },
    pound_ground: { also: ['cnf', 20], txt: 'ศัตรูอาจหูอื้อจนมึน' }, field_slam: { crash: true, flinch: 20 }, push_glasses: { focus: true }, battery_shot: { boost: ['rain', 1.5, 'น้ำนำไฟฟ้า!'] },
    lecture: { sureIf: 'person', txt: 'นักศึกษาหนีไม่พ้น' }, plasma: { boost: ['foePar', 2, 'ไฟฟ้าวิ่งครบวงจร!'] }, belly_bump: { boost: ['userDef', 1.5, 'พุงแน่นเด้งแรง!'] },
    sweet_smile: { also: ['heal8', 100], txt: 'ยิ้มแล้วตัวเองสดชื่นขึ้น' }, bamboo_squirt: { hits: [2, 2], per: 0.6 }, sticky_rice: { cure: true }, pond_dive: { boost: ['rain', 1.5, 'กระโดดลงน้ำฝนตูมใหญ่!'], crash: true },
    dash: { boost: ['first', 1.3, 'วิ่งเต็มสปีด!'] }, tongue: { also: ['cnf', 20], txt: 'ศัตรูอาจหัวร้อนจนมึน' }, dust_kick: { also: ['foe_acc-1', 30], txt: 'ฝุ่นเข้าตา' }, spin: { hits: [1, 2] },
    whirlwind: { haze: true }, splash_spook: { also: ['cnf', 20], boost: ['night', 1.5, 'หลอกตอนมืดได้ผลกว่า!'] }, koi_hop: { hits: [2, 3], per: 0.7 }, raw_bite: { drain: 0.5, flinch: 20 },
    basket_flap: { also: ['foe_acc-1', 20], txt: 'ลมพัดฝุ่นเข้าตา' }, flicker: { boost: ['night', 1.5, 'แสงวูบในความมืด!'] }, wail: { also: ['foe_spa-1', 100], txt: 'ขนลุกจนพลังพิเศษลด' },
    spook: { sureIf: 'night' }, beg_merit: { money: 5, txt: 'ได้เหรียญทำบุญติดมือ' }, mud_spout: { also: ['foe_spe-1', 30], txt: 'โคลนติดตัวจนช้า' }, belly_flop: { recoil: 0.25, flinch: 30 },
    rain_call: { rain: true }, gape: { boost: ['rain', 1.5, 'อ้าปากรับน้ำฝน!'] }, wind_blade: { crit: 0.3 }, bamboo_sword: { crit: 0.25 }, samurai_stare: { also: ['foe_spe-1', 100], txt: 'ศัตรูตัวแข็งจนช้าลง' },
    wind_step: { dodge: true }, buffalo_charge: { recoil: 0.25, flinch: 20 }, radio_wave: { also: ['foe_spd-1', 20], txt: 'คลื่นรบกวน' }, monsoon_splash: { rain: true, boost: ['rain', 1.3, 'ฝนห่าใหญ่!'] },
    kite_storm: { boost: ['first', 1.3, 'ลมส่งว่าวพุ่ง!'] }, wrench_throw: { crit: 0.25 }, tighten_bolt: { also: ['self_spd+1', 100] }, grease: { also: ['foe_def-1', 50], txt: 'ลื่นจนเสียหลัก' },
    piston_ram: { chain: true, recoil: 0.15 }, pour_concrete: { also: ['foe_spe-1', 100], txt: 'ปูนติดเท้าแน่นอน' }, level_check: { focus: true }, brick_smash: { breakDef: true },
    live_wire: { boost: ['rain', 1.5, 'สายไฟโดนน้ำ!'] }, multimeter: { scan: true }, short_circuit: { recoil: 0.12 }, blackout: { also: ['foe_spe-1', 100, 'night'], txt: 'กลางคืนศัตรูช้าลงด้วย' },
    acid_splash: { also: ['foe_def-1', 20], txt: 'กัดกร่อนเกราะ' }, fumes: { also: ['foe_acc-1', 30], txt: 'แสบตา' }, titrate: { also: ['self_acc+1', 100] }, foam_burst: { hits: [2, 3], per: 0.45 },
    pm_dust: { also: ['psn', 20], txt: 'ฝุ่นเข้าปอดจนท้องเสีย' }, plant_tree: { regen: 4 }, clean_wind: { cure: true, txt: 'ลมพัดอาการป่วยของตัวเองหาย' }, stopwatch: { also: ['self_acc+1', 100] },
    conveyor_rush: { hits: [1, 2] }, kpi_pressure: { also: ['foe_spe-1', 100], txt: 'กดดันจนช้า' }, lean_strike: { sure: true, crit: 0.2 }, cheer_faculty: { also: ['self_spa+1', 100] },
    wak_shout: { also: ['foe_def-1', 50], txt: 'ศัตรูเสียขวัญ' }, mermaid_song: { boost: ['night', 1.3, 'เพลงยามค่ำคืน'] }, river_splash: { boost: ['rain', 1.5, 'สาดน้ำกลางฝน!'] },
    takhian_leaf: { hits: [2, 3], per: 0.5 }, nang_gaze: { also: ['cnf', 20], txt: 'ค้อนจนศัตรูงง' }, dike_stance: { regen: 3 }, hoe_swing: { crit: 0.25 }, glow_flash: { also: ['par', 30, 'night'], txt: 'กลางคืนอาจทำให้ชา' },
    ghost_light: { boost: ['night', 1.5, 'แสงผีกลางคืน!'] }, naga_wave: { boost: ['rain', 1.3, 'คลื่นนาคาในสายฝน!'], also: ['foe_spe-1', 20] }, naga_coil: { drain: 0.25 }, mask_dance: { also: ['self_atk+1', 100] },
    wood_sword: { crit: 0.3 }, treasure_guard: { money: 8, txt: 'แอบหยิบเหรียญจากไห' }, stone_drop: { crash: true, flinch: 20 }, saline_drip: { regen: 3 },
    night_round: { boost: ['foeSlp', 2, 'ตรวจวอร์ดเจอคนหลับ!'], boost2: ['night', 1.3, 'กะดึก!'] }, take_meds: { cure: true, txt: 'ถามไปถามมาตัวเองก็กินยาด้วย' }, wheel_ram: { recoil: 0.12 },
    squeak_wheel: { also: ['cnf', 20], txt: 'หูอื้อจนมึน' }, wrong_ward: { also: ['foe_spe-1', 100], txt: 'หลงทางจนช้า' }, bandage: { cure: true }, inject: { sure: true }, case_present: { sureIf: 'person', txt: 'นักศึกษาหลับแน่นอน' },
    anatomy_strike: { crit: 0.35 }, mud_therapy: { drain: 0.3 }, herbal_pot: { regen: 2 }, numb_shot: { also: ['foe_spe-1', 100], txt: 'ชาจนช้า' }, pulse_check: { scan: true, focus: true },
    looking_down: { also: ['foe_spa-1', 100], txt: 'ศัตรูหมดความมั่นใจ' },
    updraft: { dodge: true }, tail_dash: { boost: ['fresh', 1.5, 'แดชเปิดตัว!'] }, cloudburst: { dodge: true }, blade_storm: { hits: [2, 5], per: 0.4 }, dark_cover: { dodge: true },
    shadow_hand: { boost: ['night', 1.5, 'มือเงาแรงขึ้นในความมืด!'] }, paint_shells: { hits: [2, 3], per: 0.5 }, boom_bot: { also: ['foe_def-1', 30], flinch: 30 }, showstopper: { recharge: true },
    fault_line: { breakDef: true }, stim_beacon: { also: ['self_spe+1', 100] }, high_gear: { boost: ['fresh', 1.5, 'ออกตัวเต็มเกียร์!'] }, relay_bolt: { hits: [1, 3], per: 0.6 }, overdrive: { recharge: true },
    turret_fire: { hits: [2, 4], per: 0.4 }, shock_dart: { sure: true, scan: true }, healing_orb: { cure: true }, ice_barrier: { also: ['self_spd+1', 100] }, slow_orb: { also: ['foe_spe-1', 100] },
    toxic_screen: { also: ['foe_spa-1', 20] }, snake_bite: { drain: 0.25 }, empress: { also: ['self_spe+1', 100] }, leer_eye: { also: ['foe_def-1', 100] }, headshot: { sure: true, crit: 0.5 },
    operator: { recharge: true, crit: 0.3 }, hot_hands: { also: ['foe_def-1', 20], txt: 'ไฟลวกเกราะ' }, tour_de_force: { sure: true, crit: 0.3 }, incendiary: { burn: 3 },
  };
  G.GIM = GIM;
  const COND_TH = { foeFull: 'ศัตรูพลังเต็ม', rain: 'ฝนตก', foePar: 'ศัตรูอัมพาต', userDef: 'ป้องกันตัวเองขึ้นอยู่', first: 'ได้ตีก่อน', night: 'กลางคืน', foeSlp: 'ศัตรูหลับ', fresh: 'เทิร์นแรกที่ลงสนาม' };
  // คำอธิบายกิมมิคสั้นๆ (แสดงในเมนูท่า)
  G.gimmickText = function (id) {
    const g = GIM[id]; if (!g) return '';
    const t = [];
    if (g.hits) t.push(g.hits[0] === g.hits[1] ? `ตี ${g.hits[0]} ครั้ง` : `ตี ${g.hits[0]}-${g.hits[1]} ครั้ง`);
    if (g.boost) t.push(`${COND_TH[g.boost[0]]} แรง ×${g.boost[1]}`);
    if (g.boost2) t.push(`${COND_TH[g.boost2[0]]} แรง ×${g.boost2[1]}`);
    if (g.recoil) t.push('เจ็บตัวเองด้วย'); if (g.drain) t.push('ดูดพลังมาฟื้นตัวเอง'); if (g.crit) t.push(`ติดคริง่าย (${Math.round(g.crit * 100)}%)`);
    if (g.sure) t.push('ไม่มีพลาด'); if (g.sureIf) t.push(g.sureIf === 'night' ? 'กลางคืนไม่มีพลาด' : 'ใช้กับนักศึกษาไม่มีพลาด'); if (g.crash) t.push('พลาดแล้วเจ็บตัว');
    if (g.flinch) t.push(`ตีก่อนอาจทำให้ศัตรูสะดุ้งเสียเทิร์น (${g.flinch}%)`); if (g.recharge) t.push('เทิร์นหน้าต้องพักชาร์จ'); if (g.rain) t.push('เรียกฝนกลางสนาม 5 เทิร์น ท่าน้ำแรงขึ้น');
    if (g.cure) t.push('หายอาการผิดปกติ'); if (g.regen) t.push(`ฟื้นพลังทีละนิด ${g.regen} เทิร์น`); if (g.dodge) t.push('หลบท่าโจมตีครั้งต่อไป'); if (g.focus) t.push('ท่าโจมตีครั้งต่อไปคริแน่นอน');
    if (g.breakDef) t.push('ทำลายบัฟป้องกันศัตรู'); if (g.haze) t.push('ลมพัดบัฟศัตรูหายหมด'); if (g.chain) t.push('ใช้ติดกันแรงขึ้นเรื่อยๆ'); if (g.money) t.push('ได้เงินเพิ่มหลังจบ');
    if (g.scan) t.push('อ่านพลังที่เหลือของศัตรู'); if (g.burn) t.push(`ไฟเผาพื้นศัตรู ${g.burn} เทิร์น`);
    if (g.txt) t.push(g.txt);
    else if (g.also) {
      const [e, ch, cond] = g.also, m = /^(self|foe)_(\w+)([+-]\d)$/.exec(e);
      const STN = { atk: 'พลังโจมตี', def: 'พลังป้องกัน', spa: 'พลังพิเศษ', spd: 'ป้องกันพิเศษ', spe: 'ความเร็ว', acc: 'ความแม่น' };
      const d = m ? `${STN[m[2]]}${m[1] === 'self' ? 'ตัวเอง' : 'ศัตรู'}${m[3][0] === '+' ? 'ขึ้น' : 'ลด'}` : { cnf: 'ศัตรูมึนหัว', par: 'ศัตรูอัมพาต', psn: 'ศัตรูท้องเสีย', slp: 'ศัตรูหลับ', heal8: 'ฟื้นพลังนิดหน่อย' }[e] || e;
      t.push(`${cond ? COND_TH[cond] + ' ' : ''}${d}${ch < 100 ? ` (${ch}%)` : ''}`);
    }
    return t.join(' · ');
  };

  class Battle {
    // opt: { kind:'wild'|'trainer'|'boss'|'master', trainerName, ai:0|1|2, rng, canRun }
    constructor(party, foes, opt = {}) {
      this.P = party; this.F = foes; this.opt = opt;
      this.rng = opt.rng || G.rng;
      this.pi = party.findIndex((m) => m.hp > 0); this.fi = 0;
      this.pv = freshVol(); this.fv = freshVol();
      this.participants = new Set([this.pi]);
      this.runTries = 0; this.over = null; this.turn = 0;
      this.ai = opt.ai != null ? opt.ai : (opt.kind === 'wild' ? 0 : opt.kind === 'trainer' ? 1 : 2);
      this.bossHealed = false;
      this.rageDone = false;
      this.potions = opt.potions || 0;   // ยาฟื้นที่มาสเตอร์ใช้ได้ (พี่บูม 2 ครั้ง)
      this.weather = opt.weather !== undefined ? opt.weather : (G.fieldWeather ? G.fieldWeather() : null);   // sun แดดจ้า · fog หมอก · dust ฝุ่น PM
      this.started = false;
      this.applyRage([]);
    }
    // opt.rage = { sp, st, text }: ศัตรูชนิดนี้ลงสนามมาพร้อมบัฟ (เช่น พี่เฟรนด์โมโหเพราะเห็นอุ๋งอิ๋งในแก๊ง)
    applyRage(ev) {
      const rg = this.opt.rage;
      if (!rg || this.rageDone || this.foe.sp !== rg.sp) return;
      this.rageDone = true;
      Object.assign(this.fv.st, rg.st);
      if (rg.text) ev.push({ t: 'msg', text: rg.text });
    }
    get me() { return this.P[this.pi]; }
    get foe() { return this.F[this.fi]; }
    isWild() { return this.opt.kind === 'wild'; }
    sp(m) { return G.DATA.species[m.sp]; }
    label(side) {
      if (side === 'p') return this.me.name;
      if (G.isPerson(this.foe)) return this.foe.name + (this.isWild() ? '' : 'ของศัตรู');
      return this.isWild() ? this.foe.name + 'ป่า' : this.foe.name + 'ของศัตรู';
    }

    speedOf(side) {
      const m = side === 'p' ? this.me : this.foe, v = side === 'p' ? this.pv : this.fv;
      let s = m.stats.spe * G.stageFactor(v.st.spe);
      if (m.status === 'par') s *= 0.5;
      const ab = this.sp(m).ability, it = m.held && G.DATA.items[m.held];
      if (ab === 'slick' && (this.rain > 0 || (G.raining && G.raining()))) s *= 1.5;   // ตัวลื่นในฝน
      if (it && it.for === 'spe') s *= it.value;   // ตะกรุดเร็ว
      return s;
    }

    chooseFoeMove() {
      const f = this.foe, usable = f.moves.filter((m) => m.pp > 0);
      if (!usable.length) return STRUGGLE.id;
      const r = this.rng;
      if (this.ai === 0) return usable[Math.floor(r() * usable.length)].id;
      const M = G.DATA.moves;
      if (this.ai === 2) {
        const heal = usable.find((m) => M[m.id].effect.startsWith('heal50'));
        if (heal && !this.bossHealed && f.hp < f.stats.hp * 0.25) { this.bossHealed = true; return heal.id; }
        if (this.fv.turns === 0 && !this.rageDone) {
          const buff = usable.find((m) => M[m.id].effect.startsWith('self_'));
          if (buff) return buff.id;
        }
      }
      if (this.ai >= 1 && r() < (this.ai === 2 ? 0.85 : 0.7)) {
        let best = null, bestV = -1;
        for (const m of usable) {
          const mv = M[m.id];
          if (mv.cat === 'status') continue;
          const v = mv.power * G.typeEff(mv.type, this.sp(this.me).type) * (mv.type === this.sp(f).type ? 1.5 : 1);
          if (v > bestV) { bestV = v; best = m.id; }
        }
        if (best) return best;
      }
      const nonHeal = usable.filter((m) => !M[m.id].effect.startsWith('heal50') || f.hp < f.stats.hp / 2 || (M[m.id].effect === 'heal50cure' && f.status));
      const pool = nonHeal.length ? nonHeal : usable;
      return pool[Math.floor(r() * pool.length)].id;
    }

    // เปิดฉาก: ความสามารถตอนลงสนาม (เรียกจาก battleui หลังแนะนำตัว หรือเทิร์นแรกอัตโนมัติ)
    begin() { const ev = []; if (!this.started) { this.started = true; this.onEntry('p', ev); this.onEntry('f', ev); } return ev; }
    // action: {type:'move', idx} | {type:'item', id, target} | {type:'switch', idx} | {type:'run'}
    turnAction(action) {
      const ev = this.begin();
      if (this.over) return ev;
      this.turn++;
      let foeMove = this.chooseFoeMove();
      // มาสเตอร์ใช้ยาฟื้นก่อนลงมือ (เสียตาเดินของศัตรูในเทิร์นนั้น)
      if (this.potions > 0 && this.foe.hp > 0 && this.foe.hp < this.foe.stats.hp * 0.3) {
        this.potions--;
        const f = this.foe, amt = Math.floor(f.stats.hp * 0.6 * (f.status === 'psn' ? 0.5 : 1));
        f.hp = Math.min(f.stats.hp, f.hp + amt);
        ev.push({ t: 'msg', text: `${this.opt.trainerName} ใช้ยาฟื้นพลังให้ ${f.name}!${f.status === 'psn' ? ' (ท้องเสียอยู่ ยาเลยได้ผลแค่ครึ่งเดียว)' : ''}` });
        ev.push({ t: 'hp', side: 'f', hp: f.hp });
        foeMove = null;
      }
      if (action.type === 'run') {
        this.runTries++;
        // หนีง่าย: เร็วเท่ากันหรือเลเวลไม่น้อยกว่าศัตรู = หนีได้แน่นอน, ช้ากว่าก็ยังมีโอกาสสูงและเพิ่มขึ้นทุกครั้งที่ลอง
        const pct = this.me.lv >= this.foe.lv ? 100 : Math.min(100, (this.speedOf('p') / this.speedOf('f')) * 60 + 45 + 30 * (this.runTries - 1));
        if (this.rng.chance(pct)) { ev.push({ t: 'msg', text: 'หนีมาได้แล้ว!' }); this.over = 'run'; ev.push({ t: 'end', result: 'run' }); return ev; }
        ev.push({ t: 'msg', text: 'หนีไม่พ้น!' });
        if (foeMove) this.doMove('f', foeMove, ev, false);
      } else if (action.type === 'switch') {
        this.switchIn(action.idx, ev);
        if (foeMove) this.doMove('f', foeMove, ev, false);
      } else if (action.type === 'item') {
        const done = this.useItem(action.id, action.target, ev);
        if (this.over) return ev;
        if (done !== 'skipFoe' && foeMove) this.doMove('f', foeMove, ev, false);
      } else {
        const slot = this.me.moves[action.idx];
        const myMove = slot && slot.pp > 0 ? slot.id : STRUGGLE.id;
        const M = (id) => (id === 'struggle' ? STRUGGLE : G.DATA.moves[id]);
        const pPri = M(myMove).priority + (this.sp(this.me).ability === 'quick' && this.pv.turns === 0 ? 0.5 : 0);
        const fPri = foeMove ? M(foeMove).priority : -99;
        let first = 'p';
        if (fPri > pPri) first = 'f';
        else if (fPri === pPri) {
          const a = this.speedOf('p'), b = this.speedOf('f');
          first = a > b ? 'p' : a < b ? 'f' : (this.rng() < 0.5 ? 'p' : 'f');
        }
        const order = (first === 'p' ? [['p', myMove], ['f', foeMove]] : [['f', foeMove], ['p', myMove]]).filter((o) => o[1]);
        for (let i = 0; i < order.length; i++) {
          const [side, mv] = order[i];
          const actor = side === 'p' ? this.me : this.foe;
          if (actor.hp <= 0) continue;
          const target = side === 'p' ? this.foe : this.me;
          if (target.hp <= 0) continue;
          this.doMove(side, mv, ev, i === 1);
          if (this.checkFaints(ev)) return ev;
        }
      }
      if (this.checkFaints(ev)) return ev;
      this.endOfTurn(ev);
      this.checkFaints(ev);
      return ev;
    }

    doMove(side, moveId, ev, movedSecond) {
      const r = this.rng;
      const user = side === 'p' ? this.me : this.foe, tgt = side === 'p' ? this.foe : this.me;
      const uv = side === 'p' ? this.pv : this.fv, tv = side === 'p' ? this.fv : this.pv;
      const tside = side === 'p' ? 'f' : 'p';
      const name = this.label(side), tname = this.label(tside);
      uv.turns++;
      if (user.hp <= 0) return;
      if (uv.recharge) { uv.recharge = false; ev.push({ t: 'msg', text: `${name} ต้องพักชาร์จพลัง!` }); return; }
      if (uv.flinch) { uv.flinch = false; ev.push({ t: 'msg', text: `${name} สะดุ้งจนขยับไม่ทัน!` }); return; }
      if (user.status === 'slp') {
        if (user.slp > 0) { user.slp--; ev.push({ t: 'msg', text: `${name} หลับปุ๋ยอยู่...` }); return; }
        user.status = null; ev.push({ t: 'msg', text: `${name} ตื่นแล้ว!` }); ev.push({ t: 'status', side, status: null });
      }
      if (user.status === 'par' && r() < 0.25) { ev.push({ t: 'msg', text: `${name} ตัวชา ขยับไม่ได้!` }); return; }
      if (uv.cnf > 0) {
        uv.cnf--;
        if (uv.cnf === 0) ev.push({ t: 'msg', text: `${name} หายมึนแล้ว!` });
        else {
          ev.push({ t: 'msg', text: `${name} มึนหัวอยู่...` });
          if (r() < 1 / 3) {
            const self = { ...STRUGGLE, power: 40 };
            const { dmg } = G.damage(user, user, self, { rand: 100 });
            user.hp = Math.max(0, user.hp - dmg);
            ev.push({ t: 'msg', text: 'มึนจนชนตัวเอง!' });
            ev.push({ t: 'hp', side, hp: user.hp });
            return;
          }
        }
      }
      let mv;
      if (moveId === 'struggle') { mv = STRUGGLE; ev.push({ t: 'msg', text: `${name} ไม่มีแรงใช้ท่าแล้ว!` }); }
      else {
        mv = G.DATA.moves[moveId];
        const slot = user.moves.find((m) => m.id === moveId);
        if (slot) slot.pp--;
      }
      ev.push({ t: 'msg', text: `${name} ใช้ท่า ${mv.name}!` });
      ev.push({ t: 'anim', side, type: mv.type, cat: mv.cat, id: mv.id });
      const g = GIM[mv.id] || {};
      uv.chain = uv.last === mv.id ? Math.min(2, uv.chain + 1) : 0; uv.last = mv.id;
      // หลบ (ก้าวหลบสายลม ควันมืด ม่านเมฆ)
      if (tv.dodge && mv.cat !== 'status') { tv.dodge = false; ev.push({ t: 'msg', text: `${tname} หลบได้ทันอย่างกับสายลม!` }); return; }
      // ความแม่น
      const night = G.isNight ? G.isNight() : false;
      const sure = g.sure || (g.sureIf === 'night' && night) || (g.sureIf === 'person' && G.isPerson && G.isPerson(tgt));
      if (mv.acc > 0 && !sure) {
        const hit = mv.acc * G.accFactor(uv.st.acc);
        if (r() * 100 >= hit) {
          ev.push({ t: 'msg', text: 'แต่พลาดเป้า!' });
          if (g.crash) { user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(user.stats.hp / 8))); ev.push({ t: 'msg', text: `${name} พลาดแล้วล้มเจ็บตัวเอง!` }); ev.push({ t: 'hp', side, hp: user.hp }); }
          return;
        }
      }
      if (mv.cat !== 'status') {
        if (this.sp(tgt).ability === 'levitate' && mv.type === 'earth') { ev.push({ t: 'msg', text: `${tname} ลอยตัวอยู่ ท่าธาตุดินไม่โดนเลย!` }); this.gimmickAfter(g, side, ev, night); return; }
        let other = this.abMult(user, tgt, mv) * this.weatherMult(mv);
        const ab = this.sp(user).ability;
        if (ab === 'rage' && mv.type === 'earth' && user.hp <= user.stats.hp / 3) other *= 1.5;
        if (ab === 'analyze' && movedSecond) other *= 1.3;
        other *= G.heldMult(user, tgt, mv);
        const easy = !G.settings || G.settings.easy !== false;
        // เงื่อนไขเพิ่มพลังตามชื่อท่า
        const cond = (c) => ({ foeFull: tgt.hp >= tgt.stats.hp, rain: this.rain > 0 || (G.raining ? G.raining() : false), foePar: tgt.status === 'par', userDef: uv.st.def > 0,
          first: !movedSecond, night, foeSlp: tgt.status === 'slp', fresh: uv.turns <= 1 })[c];
        for (const bz of [g.boost, g.boost2]) if (bz && cond(bz[0])) { other *= bz[1]; ev.push({ t: 'msg', text: bz[2] }); }
        if (g.chain && uv.chain) { other *= 1 + 0.5 * uv.chain; ev.push({ t: 'msg', text: `ลูกสูบเร่งรอบ! แรงขึ้น ×${1 + 0.5 * uv.chain}` }); }
        if (this.rain > 0 && mv.type === 'water') other *= 1.5;
        const phys = mv.cat === 'phys';
        const n = g.hits ? r.int(g.hits[0], g.hits[1]) : 1, hm = n > 1 || g.hits ? { ...mv, power: Math.max(10, Math.round(mv.power * (g.per || 1))) } : mv;
        let total = 0, k = 0;
        for (; k < n && tgt.hp > 0; k++) {
          let crit = r() < Math.max(side === 'p' && easy ? 0.25 : 1 / 16, g.crit || 0);   // ฝั่งเราติดคริ 25% ในโหมดเก็บเวลเร็ว
          if (uv.focus) { crit = true; uv.focus = false; }
          const { dmg, eff } = G.damage(user, tgt, hm, {
            crit, rand: r.int(85, 100), other,
            atkStage: phys ? uv.st.atk : uv.st.spa, defStage: phys ? tv.st.def : tv.st.spd,
          });
          const sash = tgt.held && G.DATA.items[tgt.held] && G.DATA.items[tgt.held].for === 'sash' && tgt.hp >= tgt.stats.hp && dmg >= tgt.hp;
          tgt.hp = Math.max(sash ? 1 : 0, tgt.hp - dmg); total += dmg;
          if (sash) { ev.push({ t: 'msg', text: `${tname} ยึด${G.DATA.items[tgt.held].name}ไว้ รอดมาได้ด้วยพลังเฮือกสุดท้าย!` }); tgt.held = null; }
          ev.push({ t: 'hit', side: tside, eff });
          ev.push({ t: 'hp', side: tside, hp: tgt.hp });
          if (crit) { ev.push({ t: 'crit', side: tside }); ev.push({ t: 'msg', text: side === 'p' ? 'คริติคอล! ตีเข้าจุดสำคัญเต็มๆ!' : 'โดนจุดสำคัญ!' }); }
          if (k === 0) { if (eff > 1) ev.push({ t: 'msg', text: 'ได้ผลดีมาก!' }); else if (eff < 1) ev.push({ t: 'msg', text: 'ไม่ค่อยได้ผล...' }); }
        }
        if (n > 1) ev.push({ t: 'msg', text: `โดนไป ${k} ครั้ง!` });
        if (g.drain && total > 0 && user.hp < user.stats.hp) { user.hp = Math.min(user.stats.hp, user.hp + Math.max(1, Math.floor(total * g.drain))); ev.push({ t: 'hp', side, hp: user.hp }); ev.push({ t: 'msg', text: `${name} ดูดพลังมาฟื้นตัวเอง!` }); }
        if (g.recoil && total > 0) { user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(total * g.recoil))); ev.push({ t: 'hp', side, hp: user.hp }); ev.push({ t: 'msg', text: `${name} เจ็บตัวเองจากแรงกระแทก!` }); }
        if (g.flinch && !movedSecond && tgt.hp > 0 && r.chance(g.flinch)) tv.flinch = true;
        this.afterHit(user, tgt, mv, side, total, ev);
        if (g.breakDef && (tv.st.def > 0 || tv.st.spd > 0)) { tv.st.def = Math.min(0, tv.st.def); tv.st.spd = Math.min(0, tv.st.spd); ev.push({ t: 'msg', text: `บัฟป้องกันของ ${tname} พังทลาย!` }); }
        if (g.haze && Object.values(tv.st).some((v) => v > 0)) { for (const kk in tv.st) tv.st[kk] = Math.min(0, tv.st[kk]); ev.push({ t: 'msg', text: `ลมพัดบัฟของ ${tname} หายเกลี้ยง!` }); }
        if (g.burn && tgt.hp > 0) { tv.burn = g.burn; ev.push({ t: 'msg', text: `ไฟลุกท่วมพื้นรอบตัว ${tname}!` }); }
        if (g.recharge) uv.recharge = true;
        if (mv === STRUGGLE) {
          user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(user.stats.hp / 4)));
          ev.push({ t: 'hp', side, hp: user.hp });
        }
        if (tgt.hp > 0 && mv.effect && r.chance(mv.chance)) this.applyEffect(mv.effect, side, ev, true);
      } else {
        this.applyEffect(mv.effect, side, ev, false);
      }
      this.gimmickAfter(g, side, ev, night);
    }
    // ผลเสริมของกิมมิคที่ใช้ได้ทั้งท่าโจมตีและท่าสถานะ
    gimmickAfter(g, side, ev, night) {
      const user = side === 'p' ? this.me : this.foe, tgt = side === 'p' ? this.foe : this.me, uv = side === 'p' ? this.pv : this.fv;
      const name = this.label(side), tname = this.label(side === 'p' ? 'f' : 'p');
      if (g.also) { const [e, ch, cond] = g.also; if ((!cond || (cond === 'night' && night)) && (e.startsWith('self_') || e === 'heal8' || tgt.hp > 0) && this.rng.chance(ch)) this.applyEffect(e, side, ev, true); }
      if (g.cure && (user.status || uv.cnf)) { user.status = null; uv.cnf = 0; ev.push({ t: 'status', side, status: null }); ev.push({ t: 'msg', text: `${name} หายจากอาการผิดปกติ!` }); }
      if (g.regen) { uv.regen = g.regen; ev.push({ t: 'msg', text: `${name} จะฟื้นพลังทีละนิดไปอีก ${g.regen} เทิร์น` }); }
      if (g.dodge) { uv.dodge = true; ev.push({ t: 'msg', text: `${name} ตั้งท่าพร้อมหลบ!` }); }
      if (g.focus) { uv.focus = true; ev.push({ t: 'msg', text: `${name} เล็งจุดอ่อนไว้แล้ว ท่าต่อไปคริแน่!` }); }
      if (g.rain) { this.rain = 5; ev.push({ t: 'msg', text: 'ฝนตกลงมากลางสนาม! ท่าธาตุน้ำแรงขึ้น' }); }
      if (g.money && side === 'p') { const amt = g.money * user.lv; this.bonusMoney = (this.bonusMoney || 0) + amt; ev.push({ t: 'msg', text: `เก็บเหรียญได้ ${amt} บาท!` }); }
      if (g.scan && tgt.hp > 0) ev.push({ t: 'msg', text: `อ่านค่าได้: ${tname} เหลือพลัง ${tgt.hp}/${tgt.stats.hp}` });
    }

    applyEffect(eff, side, ev, secondary) {
      const tside = side === 'p' ? 'f' : 'p';
      const m = /^(self|foe)_(\w+)([+-]\d)$/.exec(eff);
      if (m) {
        const who = m[1] === 'self' ? side : tside;
        const v = who === 'p' ? this.pv : this.fv;
        const d = parseInt(m[3], 10), k = m[2];
        const before = v.st[k];
        v.st[k] = Math.max(-6, Math.min(6, before + d));
        const nm = this.label(who);
        if (v.st[k] === before) ev.push({ t: 'msg', text: `${STAT_NAME[k]}ของ ${nm} เปลี่ยนไม่ได้อีกแล้ว!` });
        else ev.push({ t: 'msg', text: `${STAT_NAME[k]}ของ ${nm} ${d > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}${Math.abs(d) > 1 ? 'มาก' : ''}!` });
        return;
      }
      const user = side === 'p' ? this.me : this.foe, tgt = side === 'p' ? this.foe : this.me;
      const tv = side === 'p' ? this.fv : this.pv;
      const tname = this.label(tside);
      if (eff === 'heal8') {
        if (user.hp >= user.stats.hp) return;
        user.hp = Math.min(user.stats.hp, user.hp + Math.max(1, Math.floor(user.stats.hp / 8)));
        ev.push({ t: 'hp', side, hp: user.hp }); ev.push({ t: 'msg', text: `${this.label(side)} สดชื่นขึ้นนิดหน่อย` });
        return;
      }
      if (eff === 'heal50' || eff === 'heal50cure') {
        const cure = eff === 'heal50cure' && user.status;
        if (user.hp >= user.stats.hp && !cure) { ev.push({ t: 'msg', text: 'แต่พลังเต็มอยู่แล้ว!' }); return; }
        const sick = user.status === 'psn' && !cure;   // ท้องเสียอยู่ ฟื้นได้ครึ่งเดียว
        user.hp = Math.min(user.stats.hp, user.hp + Math.floor(user.stats.hp / (sick ? 4 : 2)));
        ev.push({ t: 'hp', side, hp: user.hp });
        ev.push({ t: 'msg', text: `${this.label(side)} ฟื้นพลังขึ้นมา!${sick ? ' (ท้องเสียอยู่ เลยฟื้นได้นิดเดียว)' : ''}` });
        if (cure) { user.status = null; if (side === 'p') this.pv.cnf = 0; else this.fv.cnf = 0; ev.push({ t: 'status', side, status: null }); ev.push({ t: 'msg', text: `${this.label(side)} หายจากอาการผิดปกติ!` }); }
      } else if (eff === 'cnf') {
        if (tv.cnf > 0) { if (!secondary) ev.push({ t: 'msg', text: `${tname} มึนอยู่แล้ว!` }); return; }
        tv.cnf = this.rng.int(2, 5) + 1;
        ev.push({ t: 'msg', text: `${tname} มึนหัวไปแล้ว!` });
      } else if (eff === 'par' || eff === 'slp' || eff === 'psn') {
        if (tgt.status) { if (!secondary) ev.push({ t: 'msg', text: 'แต่ไม่ได้ผล!' }); return; }
        tgt.status = eff;
        if (eff === 'slp') tgt.slp = this.rng.int(1, 3);
        ev.push({ t: 'status', side: tside, status: eff });
        ev.push({ t: 'msg', text: `${tname} ${STATUS_NAME[eff]}!` });
      }
    }

    endOfTurn(ev) {
      for (const side of ['p', 'f']) {
        const m = side === 'p' ? this.me : this.foe, v = side === 'p' ? this.pv : this.fv;
        v.flinch = false;
        if (m.hp <= 0) continue;
        if (v.regen > 0) { v.regen--; if (m.hp < m.stats.hp) { m.hp = Math.min(m.stats.hp, m.hp + Math.max(1, Math.floor(m.stats.hp / 16))); ev.push({ t: 'msg', text: `${this.label(side)} ฟื้นพลังทีละนิด` }); ev.push({ t: 'hp', side, hp: m.hp }); } }
        this.endAbility(side, m, v, ev); if (m.hp <= 0) continue;
        if (v.burn > 0) { v.burn--; m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.stats.hp / 12))); ev.push({ t: 'msg', text: `${this.label(side)} โดนไฟเผาพื้นร้อนจนเจ็บ!` }); ev.push({ t: 'hp', side, hp: m.hp }); if (m.hp <= 0) continue; }
        if (m.status === 'psn') {
          m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.stats.hp / 8)));
          ev.push({ t: 'msg', text: `${this.label(side)} ปวดท้อง!` }); ev.push({ t: 'hp', side, hp: m.hp });
        }
        if (this.sp(m).ability === 'eater' && m.hp > 0 && m.hp < m.stats.hp) {
          m.hp = Math.min(m.stats.hp, m.hp + Math.max(1, Math.floor(m.stats.hp / 16)));
          ev.push({ t: 'msg', text: `${this.label(side)} แอบกินขนมฟื้นแรง` }); ev.push({ t: 'hp', side, hp: m.hp });
        }
      }
      if (this.rain > 0 && --this.rain === 0) ev.push({ t: 'msg', text: 'ฝนกลางสนามหยุดแล้ว' });
    }

    // ---------- ความสามารถติดตัว + ของถือ + สภาพอากาศ ----------
    onEntry(side, ev) {
      const m = side === 'p' ? this.me : this.foe, v = side === 'p' ? this.pv : this.fv;
      if (!m || m.hp <= 0) return;
      const ab = this.sp(m).ability;
      if (ab === 'guardian') { v.st.def = Math.min(6, v.st.def + 1); ev.push({ t: 'msg', text: `${this.label(side)} ยืนเฝ้านา ป้องกันขึ้น!` }); }
      if (ab === 'scary') { const ov = side === 'p' ? this.fv : this.pv; ov.st.atk = Math.max(-6, ov.st.atk - 1); ev.push({ t: 'msg', text: `${this.label(side)} ทำหน้าน่ากลัว โจมตีของ${this.label(side === 'p' ? 'f' : 'p')}ลดลง!` }); }
    }
    abMult(user, tgt, mv) {
      const a = this.sp(user).ability, d = this.sp(tgt).ability;
      let k = 1;
      if (a === 'glider' && mv.type === 'wind') k *= 1.2;
      if (a === 'songbird' && SOUND.includes(mv.id)) k *= 1.3;
      if (a === 'torrent' && mv.type === 'water' && user.hp <= user.stats.hp / 3) k *= 1.5;
      if (a === 'spark' && mv.type === 'electric' && G.isNight && G.isNight()) k *= 1.25;
      if (d === 'thick' && mv.cat === 'phys') k *= 0.85;
      if (d === 'tall' && mv.type === 'earth') k *= 0.5;
      return k;
    }
    weatherMult(mv) {
      const w = this.weather;
      if (w === 'sun') return mv.type === 'earth' ? 1.2 : mv.type === 'water' ? 0.85 : 1;
      if (w === 'dust') return mv.type === 'wind' ? 1.2 : 1;
      if (w === 'fog') return mv.type === 'electric' ? 1.2 : 1;   // หมอกชื้นนำไฟฟ้า
      return 1;
    }
    afterHit(user, tgt, mv, side, total, ev) {
      const tside = side === 'p' ? 'f' : 'p';
      if (total > 0 && mv.cat === 'phys' && user.hp > 0 && !user.status && this.sp(tgt).ability === 'static' && this.rng.chance(30)) {
        user.status = 'par'; ev.push({ t: 'msg', text: `${this.label(side)} โดนไฟฟ้าสถิตจนตัวชา!` }); ev.push({ t: 'status', side, status: 'par' });
      }
      if (tgt.hp <= 0 && user.hp > 0 && user.hp < user.stats.hp && this.sp(user).ability === 'glutton') {
        user.hp = Math.min(user.stats.hp, user.hp + Math.floor(user.stats.hp / 4)); ev.push({ t: 'msg', text: `${this.label(side)} กินจุ ฟื้นพลังหลังชนะ!` }); ev.push({ t: 'hp', side, hp: user.hp });
      }
      const it = tgt.held && G.DATA.items[tgt.held];
      if (it && it.for === 'berry' && tgt.hp > 0 && tgt.hp <= tgt.stats.hp / 2) {
        tgt.hp = Math.min(tgt.stats.hp, tgt.hp + Math.floor(tgt.stats.hp * it.value)); tgt.held = null;
        ev.push({ t: 'msg', text: `${this.label(tside)} แกะ${it.name}กิน ฟื้นพลัง!` }); ev.push({ t: 'hp', side: tside, hp: tgt.hp });
      }
    }
    endAbility(side, m, v, ev) {
      const ab = this.sp(m).ability, it = m.held && G.DATA.items[m.held], nm = this.label(side);
      const heal = (frac, text) => { if (m.hp >= m.stats.hp) return; m.hp = Math.min(m.stats.hp, m.hp + Math.max(1, Math.floor(m.stats.hp * frac))); ev.push({ t: 'msg', text }); ev.push({ t: 'hp', side, hp: m.hp }); };
      if (ab === 'deeproot') heal(1 / 16, `${nm} หยั่งรากลึก ฟื้นพลัง`);
      if (ab === 'firstaid' && m.hp < m.stats.hp / 2) heal(1 / 12, `${nm} ปฐมพยาบาลตัวเอง`);
      if (ab === 'nurse' && m.status && this.rng.chance(30)) { m.status = null; ev.push({ t: 'msg', text: `${nm} ดูแลตัวเองจนหายป่วย!` }); ev.push({ t: 'status', side, status: null }); }
      if (ab === 'dancer' && v.st.spe < 2) { v.st.spe++; ev.push({ t: 'msg', text: `${nm} เต้นจนเร็วขึ้น!` }); }
      if (it && it.for === 'leftover') heal(1 / 16, `${nm} นับ${it.name} จิตใจสงบ ฟื้นพลัง`);
    }

    // คืน true ถ้าการต่อสู้หยุดรอ (จบ หรือรอผู้เล่นเลือกตัวใหม่)
    checkFaints(ev) {
      if (this.over) return true;
      if (this.foe.hp <= 0 && !this.foe._fainted) {
        this.foe._fainted = true;
        ev.push({ t: 'faint', side: 'f' });
        ev.push({ t: 'msg', text: `${this.label('f')} หมดแรง!` });
        this.giveExp(ev);
        const next = this.F.findIndex((m) => m.hp > 0);
        if (next < 0) {
          this.over = 'win';
          ev.push({ t: 'end', result: 'win' });
          return true;
        }
        this.fi = next; this.fv = freshVol();
        this.participants = new Set(this.me.hp > 0 ? [this.pi] : []);
        ev.push({ t: 'msg', text: `${this.opt.trainerName} ส่ง ${this.foe.name} ออกมา!` });
        ev.push({ t: 'send', side: 'f' });
        this.applyRage(ev);
        this.onEntry('f', ev);
      }
      if (this.me.hp <= 0 && !this.me._fainted) {
        this.me._fainted = true;
        ev.push({ t: 'faint', side: 'p' });
        ev.push({ t: 'msg', text: `${this.me.name} หมดแรง!` });
        if (!this.P.some((m) => m.hp > 0)) {
          this.over = 'lose';
          ev.push({ t: 'end', result: 'lose' });
          return true;
        }
        ev.push({ t: 'need_switch' });
        return true;
      }
      return false;
    }

    giveExp(ev) {
      const easy = !G.settings || G.settings.easy !== false;
      const gain = G.expGain(this.foe, !this.isWild()) * (easy ? 3 : 1);
      this.P.forEach((m, idx) => {
        if (!m || m.hp <= 0) return;
        const fought = this.participants.has(idx);
        if (!fought && !easy) return;
        const g = Math.floor((fought ? gain : Math.floor(gain / 2)) * (this.sp(m).ability === 'diligent' ? 1.1 : 1));   // คนที่ไม่ได้ลงสนามได้ครึ่งหนึ่ง · ขยัน +10%
        m.exp += g;
        ev.push({ t: 'msg', text: `${m.name} ได้รับประสบการณ์ ${g}`, reward: true });
        while (m.lv < 100 && m.exp >= G.expFor(m.lv + 1)) {
          const oldStage = G.growthStage(m.lv);
          m.lv++;
          G.refreshStats(m);
          ev.push({ t: 'level', idx, lv: m.lv });
          ev.push({ t: 'msg', text: `${m.name} เลเวลอัปเป็น ${m.lv}!`, reward: true });
          if (this.sp(m).kind === 'kid' && G.growthStage(m.lv) > oldStage)
            ev.push({ t: 'msg', text: `${m.name} เติบโตขึ้นเป็นขั้นที่ ${G.growthStage(m.lv)}!` });
          for (const [lv, mid] of this.sp(m).learnset) {
            if (lv === m.lv && !m.moves.some((s) => s.id === mid)) ev.push({ t: 'learn', idx, move: mid });
          }
        }
      });
    }

    // เรียกหลัง need_switch
    forceSwitch(idx) {
      const ev = [];
      this.switchIn(idx, ev);
      return ev;
    }

    switchIn(idx, ev) {
      if (this.me.hp > 0) ev.push({ t: 'msg', text: `${this.me.name} กลับมาก่อน!` });
      this.pi = idx; this.pv = freshVol(); this.me._fainted = false;
      this.participants.add(idx);
      ev.push({ t: 'send', side: 'p' });
      ev.push({ t: 'msg', text: `ไปเลย ${this.me.name}!` });
      this.onEntry('p', ev);
    }

    useItem(id, target, ev) {
      const it = G.DATA.items[id];
      G.state.bag[id]--;
      if (it.kind === 'recruit') {
        if (!this.isWild()) { ev.push({ t: 'msg', text: 'ผีของคนอื่นชวนไม่ได้!' }); G.state.bag[id]++; return 'skipFoe'; }
        const kind = this.sp(this.foe).kind, eng = G.isPerson(this.foe);
        const fits = it.for === (eng ? kind : 'ghost');
        ev.push({ t: 'msg', text: eng ? `ยื่น${it.name}ให้ ${this.foe.name}...` : `ถวาย${it.name}ให้ ${this.foe.name}...` });
        if (!fits) ev.push({ t: 'msg', text: eng ? `${this.foe.name}ทำหน้างงๆ ไม่ค่อยอยากได้${it.name}...` : `ผีสางงงๆ กับ${it.name}...` });
        const a = G.recruitValue(this.foe, it.value * (fits ? 1 : 0.5));
        ev.push({ t: 'recruit_try' });
        if (this.rng() * 256 < a) {
          ev.push({ t: 'msg', text: eng ? `${this.foe.name} กินจนอิ่ม แล้วขอเข้าแก๊งด้วยคน!` : `${this.foe.name} กินอย่างอร่อย แล้วขอตามมาเข้าแก๊ง!` });
          this.over = 'recruit';
          ev.push({ t: 'end', result: 'recruit' });
          return 'done';
        }
        ev.push({ t: 'msg', text: eng ? `${this.foe.name} ยังไม่ยอมเข้าแก๊ง!` : `${this.foe.name} ยังไม่ยอมเชื่อง!` });
        return 'done';
      }
      if (it.kind === 'healall') {
        this.P.forEach((m, i) => { if (m.hp > 0) { m.hp = m.stats.hp; if (i === this.pi) ev.push({ t: 'hp', side: 'p', hp: m.hp }); } });
        ev.push({ t: 'msg', text: `แบ่ง${it.name}กินกันทั้งแก๊ง ทุกคนฟื้นพลังเต็ม!` });
        return 'done';
      }
      const m = this.P[target];
      if (it.kind === 'heal') {
        m.hp = Math.min(m.stats.hp, m.hp + it.value);
        if (target === this.pi) ev.push({ t: 'hp', side: 'p', hp: m.hp });
        ev.push({ t: 'msg', text: `ใช้${it.name} ${m.name} ฟื้นพลัง` });
      } else if (it.kind === 'cure') {
        m.status = null;
        if (target === this.pi) { this.pv.cnf = 0; ev.push({ t: 'status', side: 'p', status: null }); }
        ev.push({ t: 'msg', text: `ใช้${it.name} ${m.name} หายเป็นปกติ` });
      }
      return 'done';
    }
  }
  G.Battle = Battle;
  G.STRUGGLE = STRUGGLE;
})(window.G = window.G || {});
