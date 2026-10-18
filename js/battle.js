// ตรรกะการต่อสู้ล้วนๆ ไม่แตะหน้าจอ: รับคำสั่ง คืนรายการเหตุการณ์ให้ UI เล่นทีละอัน
(function (G) {
  'use strict';
  const STATUS_NAME = { par: 'อัมพาต', slp: 'หลับ', psn: 'ท้องเสีย' };
  const STAT_NAME = { atk: 'พลังโจมตี', def: 'พลังป้องกัน', spa: 'พลังพิเศษ', spd: 'ป้องกันพิเศษ', spe: 'ความเร็ว', acc: 'ความแม่น' };
  const STRUGGLE = { id: 'struggle', name: 'ดิ้นสุดแรง', type: 'normal', cat: 'phys', power: 50, acc: 0, pp: 1, priority: 0, effect: '', chance: 0, typeless: true };

  function freshVol() { return { st: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }, cnf: 0, turns: 0 }; }

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

    // action: {type:'move', idx} | {type:'item', id, target} | {type:'switch', idx} | {type:'run'}
    turnAction(action) {
      const ev = [];
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
      // ความแม่น
      if (mv.acc > 0) {
        const hit = mv.acc * G.accFactor(uv.st.acc);
        if (r() * 100 >= hit) { ev.push({ t: 'msg', text: 'แต่พลาดเป้า!' }); return; }
      }
      if (mv.cat !== 'status') {
        let other = 1;
        const ab = this.sp(user).ability;
        if (ab === 'rage' && mv.type === 'earth' && user.hp <= user.stats.hp / 3) other *= 1.5;
        if (ab === 'analyze' && movedSecond) other *= 1.3;
        other *= G.heldMult(user, tgt, mv);
        const easy = !G.settings || G.settings.easy !== false;
        const crit = r() < (side === 'p' && easy ? 0.25 : 1 / 16);   // ฝั่งเราติดคริ 25% ในโหมดเก็บเวลเร็ว
        const phys = mv.cat === 'phys';
        const { dmg, eff } = G.damage(user, tgt, mv, {
          crit, rand: r.int(85, 100), other,
          atkStage: phys ? uv.st.atk : uv.st.spa, defStage: phys ? tv.st.def : tv.st.spd,
        });
        tgt.hp = Math.max(0, tgt.hp - dmg);
        ev.push({ t: 'hit', side: tside, eff });
        ev.push({ t: 'hp', side: tside, hp: tgt.hp });
        if (crit) { ev.push({ t: 'crit', side: tside }); ev.push({ t: 'msg', text: side === 'p' ? 'คริติคอล! ตีเข้าจุดสำคัญเต็มๆ!' : 'โดนจุดสำคัญ!' }); }
        if (eff > 1) ev.push({ t: 'msg', text: 'ได้ผลดีมาก!' });
        else if (eff < 1) ev.push({ t: 'msg', text: 'ไม่ค่อยได้ผล...' });
        if (mv === STRUGGLE) {
          user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(user.stats.hp / 4)));
          ev.push({ t: 'hp', side, hp: user.hp });
        }
        if (tgt.hp > 0 && mv.effect && r.chance(mv.chance)) this.applyEffect(mv.effect, side, ev, true);
      } else {
        this.applyEffect(mv.effect, side, ev, false);
      }
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
        const m = side === 'p' ? this.me : this.foe;
        if (m.hp <= 0) continue;
        if (m.status === 'psn') {
          m.hp = Math.max(0, m.hp - Math.max(1, Math.floor(m.stats.hp / 8)));
          ev.push({ t: 'msg', text: `${this.label(side)} ปวดท้อง!` }); ev.push({ t: 'hp', side, hp: m.hp });
        }
        if (this.sp(m).ability === 'eater' && m.hp > 0 && m.hp < m.stats.hp) {
          m.hp = Math.min(m.stats.hp, m.hp + Math.max(1, Math.floor(m.stats.hp / 16)));
          ev.push({ t: 'msg', text: `${this.label(side)} แอบกินขนมฟื้นแรง` }); ev.push({ t: 'hp', side, hp: m.hp });
        }
      }
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
        const g = fought ? gain : Math.floor(gain / 2);   // คนที่ไม่ได้ลงสนามได้ครึ่งหนึ่ง
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
