// หน้าจอต่อสู้: วาดฉากบน canvas + แผงข้อมูล/เมนูเป็น HTML แล้วเล่นเหตุการณ์จาก G.Battle ทีละอัน
(function (G) {
  'use strict';
  const wait = (ms) => new Promise((r) => setTimeout(r, G.settings.fast ? ms / 2 : ms));   // ต่อสู้เร็ว ×2
  const V = (G.battleView = { active: false });

  function panelsHTML(b) {
    const f = b.foe, m = b.me, fsp = G.DATA.species[f.sp], msp = G.DATA.species[m.sp];
    const expPct = Math.min(100, ((m.exp - G.expFor(m.lv)) / (G.expFor(m.lv + 1) - G.expFor(m.lv))) * 100);
    return `
      <div class="panel bpanel foe-panel"><div class="bname">${f.shiny ? '<span class="k-shiny">✨</span>' : ''}${f.name} ${G.ui.typeTag(fsp.type)} <span class="lv">Lv${f.lv}</span></div>
        ${G.ui.hpBar(V.fhp, f.stats.hp)}${G.ui.statusTag(f.status)}${b.isWild() && G.state.dex[f.sp] === 2 ? '<span class="tag got">เคยชวนแล้ว</span>' : ''}${['master', 'boss'].includes(b.opt.kind) ? gaugeHTML(b, 'f') : ''}</div>
      <div class="panel bpanel me-panel"><div class="bname">${m.name} ${G.ui.typeTag(msp.type)} <span class="lv">Lv${m.lv}</span></div>
        ${G.ui.hpBar(V.php, m.stats.hp)}<div class="hpnum">${Math.max(0, Math.round(V.php))}/${m.stats.hp} ${G.ui.statusTag(m.status)}</div>
        <div class="expbar"><i style="width:${expPct}%"></i></div>${gaugeHTML(b, 'p')}</div>`;
  }
  const gaugeHTML = (b, side) => `<div class="gauge ${b.ultReady(side) ? 'full' : ''} ${b.ultUsed[side] ? 'used' : ''}"><i style="width:${b.gauge[side]}%"></i><span>${b.ultUsed[side] ? 'ใช้ท่าไม้ตายแล้ว' : b.ultReady(side) ? '★ ท่าไม้ตายพร้อม!' : 'เกจหมอลำ'}</span></div>`;
  function render(b) { V.layer.innerHTML = panelsHTML(b); }

  async function tweenHp(b, side, to) {
    const key = side === 'p' ? 'php' : 'fhp';
    const from = V[key], steps = 14;
    for (let i = 1; i <= steps; i++) { V[key] = from + ((to - from) * i) / steps; render(b); await wait(22); }
  }

  // ข้อความ EXP/เลเวลอัป: กด Z สองครั้งติดกัน = ข้ามทั้งหมด แล้วสรุปเลเวลที่ขึ้นในบรรทัดเดียว
  async function play(b, events) {
    let skip = false;
    const ups = new Map();
    const summary = async () => {
      if (skip && ups.size) await G.ui.say(`เลเวลอัป: ${[...ups].map(([n, lv]) => `${n} Lv ${lv}`).join(' · ')}`, null, { battle: true, auto: 900 });
      ups.clear();
    };
    for (const e of events) {
      switch (e.t) {
        case 'msg':
          if (e.reward && skip) break;
          await G.ui.say(e.text, null, { battle: true, auto: 650, onDouble: e.reward ? () => { skip = true; } : null });
          break;
        case 'anim': if (e.id && e.id.startsWith('ult_')) { V.cutin = { t0: performance.now(), text: G.DATA.moves[e.id].name, side: e.side }; G.sfx('power'); await wait(900); }
          startAct(e.side, e.type, e.cat, e.id, 0); V.fx = { side: e.side, type: e.type, cat: e.cat, id: e.id, t0: performance.now() }; G.sfx(e.cat === 'status' ? 'status' : 'attack'); await wait(SIG[e.id] ? Math.round(durOf(e.id) * 0.566) : e.cat === 'status' ? 300 : 260); break;
        case 'hit': V.shake = { side: e.side, t: 0 }; V.knock = { side: e.side, t0: performance.now() }; G.sfx(e.eff > 1 ? 'super' : 'hit'); await wait(200); break;
        case 'crit': V.critFlash = 10; V.shake = { side: e.side, t: 0 }; G.sfx('super'); await wait(160); break;
        case 'hp': await tweenHp(b, e.side, e.hp); break;
        case 'status': render(b); break;
        case 'faint': V.faint[e.side] = 0.001; G.sfx('faint'); await wait(450); break;
        case 'send':
          if (e.side === 'f') { V.fhp = b.foe.hp; V.faint.f = 0; V.fSprite = G.monLook(b.foe); G.markSeen(b.foe.sp); }
          else { V.php = b.me.hp; V.faint.p = 0; V.pSprite = G.monLook(b.me); }
          render(b); G.sfx('send'); await wait(250);
          if (e.side === 'p' && V.onSend) await V.onSend(b);
          if (e.side === 'f' && V.onFoeSend) await V.onFoeSend(b);
          break;
        case 'level': ups.set(b.P[e.idx].name, e.lv); if (b.P[e.idx] === b.me) { V.php = b.me.hp; V.pSprite = G.monLook(b.me); render(b); } G.sfx('level'); break;
        case 'learn': await summary(); await learnMove(b.P[e.idx], e.move); break;   // สรุปเลเวลก่อนถามเรียนท่า
        case 'recruit_try': V.wobble = 0.001; G.sfx('wobble'); await wait(1300); V.wobble = 0; break;
      }
    }
    await summary();
    render(b);
  }

  async function learnMove(mon, mid) {
    const mv = G.DATA.moves[mid];
    if (mon.moves.length < 4) {
      mon.moves.push({ id: mid, pp: mv.pp });
      await G.ui.say(`${mon.name} เรียนท่า ${mv.name} ได้แล้ว!`, null, { battle: true });
      return;
    }
    const opts = mon.moves.map((s) => G.DATA.moves[s.id].name).concat([`ไม่เรียน ${mv.name}`]);
    const i = await G.ui.ask(`${mon.name} อยากเรียนท่า ${mv.name} แต่จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, opts, { cancel: false, cls: 'small' }, { battle: true });
    if (i < 4) {
      const old = G.DATA.moves[mon.moves[i].id].name;
      mon.moves[i] = { id: mid, pp: mv.pp };
      await G.ui.say(`ลืม ${old} แล้วเรียน ${mv.name} แทน!`, null, { battle: true });
    } else await G.ui.say(`${mon.name} ไม่ได้เรียน ${mv.name}`, null, { battle: true });
  }

  async function chooseAction(b) {
    for (;;) {
      const top = await G.ui.choose(['สู้', 'กระเป๋า', 'ทีม', 'หนี'], { grid: true, cancel: false, cls: 'bmenu', title: `${b.me.name} จะทำอะไร?` });
      if (top === 0) {
        const m = b.me;
        if (m.moves.every((s) => s.pp <= 0) && !b.ultReady('p')) return { type: 'move', idx: 0 };
        const ult = b.ultReady('p') ? G.DATA.moves[G.ultOf(m)] : null;
        const i = await G.ui.choose(m.moves.map((s) => { const mv = G.DATA.moves[s.id];
          const e = mv.cat === 'status' ? 1 : G.typeEff(mv.type, G.DATA.species[b.foe.sp].type);   // บอกผลธาตุก่อนกดใช้
          return { icon: `type:${mv.type}`, label: mv.name + (e > 1 ? ' ▲×2' : e < 1 ? ' ▼×½' : ''), sub: `${G.TYPE_TH[mv.type]} ${s.pp}/${mv.pp}`, disabled: s.pp <= 0 }; }).concat(ult ? [{ icon: `type:${ult.type}`, label: '★ ' + ult.name, sub: 'ท่าไม้ตาย · ใช้ได้ครั้งเดียว', cls: 'ult' }] : []),
          { grid: true, cls: 'bmoves', info: (k) => { if (ult && k === m.moves.length) return ult.desc + ' · พลัง ' + ult.power; const s = m.moves[k]; if (!s) return ''; const mv = G.DATA.moves[s.id];
            const eff = mv.cat === 'status' ? '' : ` · ต่อ${b.foe.name}: ${{ 2: 'ได้ผลดีมาก', 1: 'ปกติ', 0.5: 'ไม่ค่อยได้ผล' }[G.typeEff(mv.type, G.DATA.species[b.foe.sp].type)]}`;
            const gm = G.gimmickText(mv.id); return `${mv.desc}${mv.power ? ' · พลัง ' + mv.power : ''}${eff}${gm ? ' · ' + gm : ''}`; } });
        if (ult && i === m.moves.length) return { type: 'ult' };
        if (i >= 0) return { type: 'move', idx: i };
      } else if (top === 1) {
        const id = await G.ui.bagMenu({ inBattle: true, foe: b.isWild() ? b.foe : null, filter: (it) => ['heal', 'cure', 'recruit', 'healall'].includes(it.kind) });
        if (!id) continue;
        const it = G.DATA.items[id];
        if (it.kind === 'recruit') {
          if (!b.isWild()) { await G.ui.say('ลูกทีมของคนอื่นชวนไม่ได้!', null, { battle: true }); continue; }
          return { type: 'item', id };
        }
        if (it.kind === 'healall') return { type: 'item', id };
        const t = await G.ui.partyMenu({ pick: true, title: `ใช้${it.name}กับใคร?` });
        if (t < 0) continue;
        const mon = G.state.party[t];
        if (it.kind === 'heal' && (mon.hp <= 0 || mon.hp >= mon.stats.hp)) { await G.ui.say('ใช้ตอนนี้ไม่ได้', null, { battle: true }); continue; }
        if (it.kind === 'cure' && !mon.status && !(t === b.pi && b.pv.cnf)) { await G.ui.say('ไม่มีอาการผิดปกติ', null, { battle: true }); continue; }
        return { type: 'item', id, target: t };
      } else if (top === 2) {
        const t = await G.ui.partyMenu({ pick: true, title: 'ส่งใครลงสนาม?' });
        if (t < 0) continue;
        if (t === b.pi) { await G.ui.say(`${b.me.name} อยู่ในสนามแล้ว!`, null, { battle: true }); continue; }
        if (G.state.party[t].hp <= 0) { await G.ui.say('หมดแรงอยู่ สู้ไม่ไหว', null, { battle: true }); continue; }
        return { type: 'switch', idx: t };
      } else {
        if (!b.isWild()) { await G.ui.say('สู้กับคนอื่นอยู่ หนีไม่ได้!', null, { battle: true }); continue; }
        return { type: 'run' };
      }
    }
  }

  // opt: { kind, trainerName, trainerLook, ai, bg, rage, onSend }
  G.runBattle = async function (foes, opt) {
    const S = G.state;
    G.music(opt.kind === 'wild' ? 'battle' : 'boss');
    await G.flash();
    G.scene = 'battle';
    S.party.forEach((m) => { m._fainted = false; });
    const b = new G.Battle(S.party, foes, opt);
    Object.assign(V, { active: true, b, php: b.me.hp, fhp: b.foe.hp, faint: { p: 0, f: 0 }, shake: null, lunge: null, fx: null, wobble: 0,
      pSprite: null, fSprite: opt.kind === 'wild' ? G.monLook(b.foe) : (opt.trainerLook || G.monLook(b.foe)),
      intro: 0, bg: opt.bg || G.world.def.bg || G.state.map, onSend: opt.onSend, onFoeSend: opt.onFoeSend });
    V.layer = document.createElement('div'); V.layer.className = 'battle-layer';
    document.querySelector('#ui').appendChild(V.layer);
    G.markSeen(b.foe.sp);
    const fsp = G.DATA.species[b.foe.sp];
    if (opt.kind === 'wild' && G.isPerson(b.foe)) await G.ui.say(`${b.foe.name} (${fsp.name.replace('น้อง', '')}) ${fsp.kind === 'med' ? 'เดินออกมาจากหัวมุมตึก' : 'เดินออกมาจากพงหญ้า'} ขอท้าสู้!`, null, { battle: true, auto: 800 });
    else if (opt.kind === 'wild') await G.ui.say(`${b.foe.name}ป่า โผล่ออกมา!`, null, { battle: true, auto: 700 });
    else {
      await G.ui.say(`${opt.trainerName} ท้าสู้!`, null, { battle: true, auto: 700 });
      V.fSprite = G.monLook(b.foe);
      await G.ui.say(`${opt.trainerName} ส่ง ${b.foe.name} ออกมา!`, null, { battle: true, auto: 600 });
    }
    if (b.foe.shiny) { G.sfx('power'); V.sparkle = performance.now(); await G.ui.say('✨ ตัวนี้สีไม่เหมือนตัวอื่น... ผีสีพิเศษ! หายากมากๆ ชวนให้ได้นะ!', null, { battle: true }); }
    V.pSprite = G.monLook(b.me); render(b); G.sfx('send');
    await G.ui.say(`ไปเลย ${b.me.name}!`, null, { battle: true, auto: 500 });
    if (V.onSend) await V.onSend(b);
    if (b.rageDone && opt.rage && opt.rage.text) await G.ui.say(opt.rage.text, null, { battle: true, auto: 900 });
    const WTH = { sun: '☀️ แดดจ้า: ท่าดินแรงขึ้น ท่าน้ำอ่อนลง', fog: '🌫️ หมอกลงหนา: ท่าสายฟ้าแรงขึ้น', dust: '😷 ฝุ่น PM ฟุ้ง: ท่าลมแรงขึ้น' };
    if (WTH[b.weather]) await G.ui.say(WTH[b.weather], null, { battle: true, auto: 900 });
    await play(b, b.begin());
    while (!b.over) {
      const act = await chooseAction(b);
      await play(b, b.turnAction(act));
      while (!b.over && b.me.hp <= 0) {
        const i = await G.ui.partyMenu({ pick: true, mustAlive: true, cancel: false, title: 'ส่งใครลงสนามต่อ?' });
        await play(b, b.forceSwitch(i));
      }
    }
    const result = b.over;
    S.fought = S.fought || {};
    b.F.forEach((m, i) => { if (i <= b.fi) S.fought[m.sp] = 1; });   // สมุดบันทึก: เคยสู้แล้ว
    if (b.bonusMoney && result !== 'lose') { S.money += b.bonusMoney; await G.ui.say(`เหรียญที่เก็บได้ระหว่างสู้ ${b.bonusMoney} บาท`, null, { battle: true, auto: 700 }); }
    if (result === 'win' && opt.kind !== 'wild' && opt.money) {
      const rich = S.party.some((m) => G.DATA.species[m.sp].ability === 'treasure'), got = Math.floor(opt.money * (rich ? 1.5 : 1));   // ปู่โสมเฝ้าทรัพย์ในทีม เงินรางวัล ×1.5
      S.money += got;
      await G.ui.say(`ได้เงินรางวัล ${got} บาท${rich ? ' (ปู่โสมช่วยเฝ้าทรัพย์ ×1.5)' : ''}`, null, { battle: true, auto: 700 });
    }
    if (result === 'recruit') {
      const m = b.foe; m.status = null;
      G.state.dex[m.sp] = 2;
      if (m.shiny) (S.shinyDex = S.shinyDex || {})[m.sp] = 1;
      S.chain = S.chain && S.chain.sp === m.sp ? { sp: m.sp, n: S.chain.n + 1 } : { sp: m.sp, n: 1 };   // ชวนชนิดเดิมต่อเนื่อง เพิ่มโอกาสสีพิเศษ
      await G.ui.dexReward();
      if (S.chain.n >= 2) G.showToast(`ชวน${G.DATA.species[m.sp].name}ต่อเนื่อง ${S.chain.n} ตัว · โอกาสเจอสีพิเศษเพิ่มขึ้น!`);
      if (S.party.length < 6) { S.party.push(m); await G.ui.say(`${m.name} เข้าแก๊งแล้ว!`, null, { battle: true }); }
      else { S.storage.push(m); await G.ui.say(`ทีมเต็มแล้ว ${m.name} ไปรออยู่ในคลังแก๊ง (เถียงนาตาสี/คอมหอพัก)`, null, { battle: true }); }
    }
    S.party.forEach((m) => { delete m._fainted; });
    V.layer.remove(); V.active = false;
    G.scene = 'world';
    G.music(G.world.def.music);
    S.party.forEach((m) => G.addFriend(m, result === 'win' ? (m.hp > 0 ? 3 : 1) : m.hp > 0 ? 0 : -2));   // ความสนิท
    if (result !== 'lose') for (const m of S.party.slice()) await G.ui.tryEvolve(m);   // วิวัฒนาการหลังจบการต่อสู้
    return result;
  };

  // ---------- วาดฉาก ----------
  function drawBackdrop(ctx, bg, night) {
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const indoor = { ramen: ['#4a3028', '#6b4a34', '#b8875a', '#a07448'], kku_shop: ['#2a2e35', '#3a3f48', '#7d8794', '#6b7480'],
      hospital: ['#dfe8ee', '#c8d8e4', '#e8ece8', '#d0d6d0'], clinic: ['#d8ecf0', '#bcdce4', '#e8ece8', '#d0d6d0'] }[bg]
      || (G.world.def && G.world.def.indoor ? ['#d8c9a8', '#e8dcc0', '#b8875a', '#a07448'] : null);
    if (indoor) {   // ฉากในตึก: ผนัง + พื้น
      R(indoor[0], 0, 0, 240, 74); R(indoor[1], 0, 60, 240, 14); R(indoor[2], 0, 74, 240, 86);
      for (let y = 80; y < 160; y += 10) R(indoor[3], 0, y, 240, 1);
      if (bg === 'kku_shop') { R('#f2d24b', 0, 70, 240, 3); for (let x = 0; x < 240; x += 12) R('#2a2a2a', x, 70, 6, 3); R('#5f6873', 20, 20, 40, 40); R('#5f6873', 180, 24, 36, 36); R('#9aa3ae', 30, 30, 20, 4); }
      if (bg === 'hospital') { R('#4fb05a', 0, 116, 240, 4); R('#3a8ad8', 0, 124, 240, 4); R('#d9455a', 0, 132, 240, 4); R('#f4f4ec', 20, 18, 40, 30); R('#d9455a', 36, 22, 8, 22); R('#d9455a', 29, 29, 22, 8); R('#9fc4dc', 170, 16, 50, 34); R('#f4f4ec', 194, 16, 2, 34); }
      if (bg === 'clinic') { R('#f4f4ec', 14, 14, 30, 50); R('#9fc4dc', 17, 18, 24, 20); R('#2f8f86', 0, 60, 240, 3); R('#f4f4ec', 182, 10, 34, 50); for (let y = 16; y < 56; y += 9) R('#d9455a', 186, y, 6, 5), R('#5fb8e0', 196, y, 6, 5), R('#f2d24b', 206, y, 6, 5); R('#6cc04a', 100, 40, 10, 20); R('#b5502f', 98, 56, 14, 8); }
      if (bg === 'arena') {   // สนามอีสปอร์ต: ผนังมืด จอ LED ไฟเวทีม่วงฟ้า
        R('#141220', 0, 0, 240, 74); R('#1d1a2e', 0, 60, 240, 14); R('#16141f', 0, 74, 240, 86); for (let y = 80; y < 160; y += 10) R('#2a2542', 0, y, 240, 1);
        R('#0c0d14', 60, 8, 120, 44); R('#7a2ad0', 63, 11, 114, 38); R('#e05ad0', 63, 30, 114, 4); R('#ffffff', 80, 18, 50, 3); R('#ffffff', 80, 24, 30, 3);
        R('#b04ae8', 0, 70, 240, 2); R('#5fe0f0', 0, 73, 240, 1);
        for (const x of [14, 40, 196, 222]) { R('#2a2542', x, 0, 6, 60); R(x % 4 ? '#5fe0f0' : '#ff4fb0', x + 1, 4, 4, 4); }
      }
      if (bg === 'ramen') { R('#2b3f8a', 0, 0, 240, 22); for (let x = 10; x < 240; x += 40) R('#f4f4ec', x, 6, 8, 8); R('#c5482b', 100, 30, 40, 26); }
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, 90);
    if (bg === 'market') { sky.addColorStop(0, night ? '#2a2f5a' : '#e8b07a'); sky.addColorStop(1, night ? '#4a3a5a' : '#f2d2a0'); }
    else { sky.addColorStop(0, night ? '#1d2650' : '#8fc3d6'); sky.addColorStop(1, night ? '#3d3a6a' : '#e8e2c0'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 240, 160);
    if (bg === 'forest') {   // ดอนปู่ตา: ป่าทึบสองชั้น ตูบปู่ตาเล็กๆ กลางป่า แสงลอดใบไม้
      for (let x = -10; x < 250; x += 22) { ctx.fillStyle = night ? '#14261c' : '#2a4a30'; ctx.beginPath(); ctx.arc(x, 44 + (x % 3) * 4, 20, 0, 7); ctx.fill(); }
      for (let x = 0; x < 250; x += 30) { ctx.fillStyle = night ? '#1c3424' : '#3f6b3a'; ctx.beginPath(); ctx.arc(x + 8, 60, 18, 0, 7); ctx.fill(); R(night ? '#2a1d14' : '#5a3a22', x + 6, 66, 4, 10); }
      R('#8a5a34', 112, 52, 16, 12); R('#c5482b', 108, 48, 24, 5); R('#f2d24b', 118, 56, 4, 4);
      if (!night) for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,248,200,0.12)'; ctx.beginPath(); ctx.moveTo(30 + i * 55, 0); ctx.lineTo(44 + i * 55, 0); ctx.lineTo(60 + i * 55, 80); ctx.lineTo(40 + i * 55, 80); ctx.fill(); }
    }
    if (bg === 'phong') {   // ลำน้ำพองกับสะพาน
      R(night ? '#2a3a6a' : '#4f8fb0', 0, 56, 240, 16); R(night ? '#3a4a7a' : '#7cb6cf', 30, 60, 30, 2); R(night ? '#3a4a7a' : '#7cb6cf', 150, 64, 40, 2);
      R(night ? '#3a2f28' : '#8a6440', 0, 46, 240, 3); for (let x = 6; x < 240; x += 24) R(night ? '#3a2f28' : '#6b4a2f', x, 46, 3, 12);
    }
    if (bg === 'amphoe') {   // ตึกแถวกับหอนาฬิกา
      for (let x = 0; x < 240; x += 40) { R(night ? '#3a3f58' : '#d8c9a8', x + 2, 34, 36, 36); R(night ? '#2a2f48' : '#9a3a2a', x, 30, 40, 5); R(night && x % 80 ? '#f2d27a' : '#5a7a9a', x + 10, 44, 8, 8); R(night ? '#f2d27a' : '#5a7a9a', x + 24, 44, 8, 8); }
      R(night ? '#4a4f68' : '#e6dcc8', 110, 10, 20, 60); R(night ? '#5a3a3a' : '#a63a2a', 106, 4, 28, 8); ctx.fillStyle = '#f4f4ec'; ctx.beginPath(); ctx.arc(120, 24, 6, 0, 7); ctx.fill(); R('#2a2a2a', 120, 19, 1, 5); R('#2a2a2a', 120, 24, 4, 1);
    }
    if (bg === 'city') {   // ตึกสูงในเมือง ป้ายไฟนีออน และสนามอีสปอร์ตแสงม่วง
      for (const [x, w, h] of [[0, 34, 46], [36, 26, 60], [150, 30, 54], [184, 24, 40], [210, 30, 58]]) {
        R(night ? '#2a2f48' : '#a8adb8', x, 70 - h, w, h);
        for (let yy = 76 - h; yy < 66; yy += 8) for (let xx = x + 4; xx < x + w - 4; xx += 7) R(night && (xx + yy) % 3 ? '#f2d27a' : night ? '#3a3f58' : '#6b8fa8', xx, yy, 4, 4);
      }
      R(night ? '#1b2036' : '#3e4c8a', 70, 22, 76, 48); R('#b04ae8', 70, 22, 76, 3); R(night ? '#7a2ad0' : '#5a3aa0', 80, 30, 56, 20); R('#ffffff', 90, 36, 30, 2); R('#5fe0f0', 90, 41, 18, 2);
      R('#55555e', 0, 70, 240, 90); for (let x = 0; x < 240; x += 24) R('#f2d24b', x, 112, 12, 2);
      return;
    }
    if (bg === 'kku') {   // ตึกคณะกับโรงช็อปเป็นฉากหลัง
      R(night ? '#3a3f58' : '#c9c0b0', 6, 30, 70, 40); R(night ? '#2a2f48' : '#8f949e', 6, 26, 70, 5);
      for (let x = 12; x < 72; x += 12) for (let y = 36; y < 66; y += 12) R(night && (x + y) % 3 ? '#f2d27a' : '#5a7a9a', x, y, 7, 7);
      R(night ? '#2f3448' : '#7d8794', 160, 38, 76, 32); for (let x = 160; x < 236; x += 12) { ctx.fillStyle = night ? '#252a3c' : '#9aa3ae'; ctx.beginPath(); ctx.moveTo(x, 38); ctx.lineTo(x + 12, 30); ctx.lineTo(x + 12, 38); ctx.fill(); }
    }
    ctx.fillStyle = night ? '#2f4a32' : '#6e9b3a'; ctx.fillRect(0, 70, 240, 90);
    ctx.fillStyle = night ? '#3a5a3a' : '#87b04a';
    for (let i = 0; i < 240; i += 6) ctx.fillRect(i, 70 + ((i * 7) % 5), 2, 6);
    if (!['market', 'kku', 'amphoe'].includes(bg)) { ctx.fillStyle = night ? '#24402a' : '#3f6b34'; for (const [x, r] of [[20, 10], [50, 7], [200, 9], [225, 6]]) { ctx.beginPath(); ctx.arc(x, 68, r, Math.PI, 0); ctx.fill(); } }
  }
  // เอฟเฟกต์ท่าตามธาตุ: น้ำ = ฟองน้ำลอยโค้งแล้วกระเซ็น, ดิน = ก้อนดินพุ่งแล้วฝุ่นตลบ, สายฟ้า = ฟ้าผ่าซิกแซก,
  // ลม = ลมหมุนวนพร้อมใบไม้, ปกติ = ดาวกระแทก, ท่าสถานะ = ประกายลอยรอบตัวผู้ใช้
  const FXC = { water: ['#7cc6de', '#e8f8ff'], earth: ['#8a5a34', '#d8b47a'], electric: ['#fff2a8', '#f2d24b'], wind: ['#c8f0b0', '#5fae4a'], normal: ['#ffffff', '#f2d24b'] };
  // ท่าที่มีชื่อเฉพาะ: วาดของจริงตามชื่อท่า [แบบ, ของ, ตัวเลือก]
  //  throw = ขว้างของโค้งไปหาศัตรู · rush = ของวิ่งพุ่งชน · drop = ของหล่นจากฟ้าใส่ · cloud = เมฆ/ควันลอยเหนือศัตรู
  //  wave = คลื่น/เสียงจากผู้ใช้ไปหาศัตรู · self = ของโผล่เหนือตัวผู้ใช้ · on = ของโผล่ที่ตัวศัตรู · beam = ลำแสงตรง
  //  slash = รอยฟัน · dark = จอมืด    ตัวเลือก: text = คำพูดเด้งที่ศัตรู, zzz = ศัตรูง่วง, n = จำนวนชิ้น, c = สี
  const SIG = {
    silly_face: ['self', '🤪', { text: '?!' }], mud_throw: ['throw', '🟤', { blobs: true, bc: '#6b4a2a' }], pound_ground: ['wave', '📢', { text: 'เฮ้ยยย!!', self: true }],
    field_slam: ['drop', '🌾', { n: 3 }], push_glasses: ['self', '👓', { glint: true }], battery_shot: ['throw', '🔋'], lecture: ['wave', '📚', { text: 'บลาๆๆ', zzz: true }],
    plasma: ['beam', '⚡', { c: '#fff2a8' }], belly_bump: ['body', '🫃', { text: 'ดึ๋ง!', boing: true }], sweet_smile: ['wave', '💕'], bamboo_squirt: ['beam', '🎋', { c: '#7cc6de' }],
    sticky_rice: ['self', '🍙', { hearts: true }], pond_dive: ['drop', '💦', { n: 3 }], tongue: ['self', '😛', { text: 'แบร่~' }], dust_kick: ['cloud', '💨'],
    spin: ['self', '🌀', { spin: true }], whirlwind: ['on', '🌪️', { spin: true }], splash_spook: ['throw', '👻'], koi_hop: ['drop', '🦶', { n: 2 }],
    raw_bite: ['on', '🦷', { text: 'งั่ม!' }], basket_flap: ['throw', '🧺', { spin: true }], wail: ['wave', '🎵', { text: 'ฮือออ~' }], spook: ['on', '👻', { text: 'แบ่!!' }],
    beg_merit: ['self', '🥣', { hearts: true }], mud_spout: ['beam', '🐸', { c: '#8a5a34' }], belly_flop: ['drop', '🐸', { big: true }], rain_call: ['self', '🌧️', { rain: true }],
    gape: ['self', '😮', { rain: true }], wind_blade: ['slash', '🌾', { c: '#c8f0b0' }], bamboo_sword: ['slash', '🎋', { c: '#d8e8a0' }], samurai_stare: ['on', '👁️', { text: 'จ้อง...' }],
    wind_step: ['self', '💨', { after: true }], buffalo_charge: ['rush', '🐃', { big: true, ride: true, text: 'ม้อออ!' }], radio_wave: ['wave', '📻', { arcs: true }], monsoon_splash: ['cloud', '🌧️', { rain: true, big: true }],
    kite_storm: ['throw', '🪁', { tornado: true }], wrench_throw: ['throw', '🔧', { spin: true }], tighten_bolt: ['self', '🔩', { spin: true }], grease: ['throw', '🛢️', { blobs: true }],
    piston_ram: ['rush', '⚙️', { spin: true }], pour_concrete: ['drop', '🪣', { pour: '#a8a8a8' }], level_check: ['self', '🔭', { aim: true }], brick_smash: ['drop', '🧱', { n: 3 }],
    live_wire: ['beam', '🔌', { c: '#f2d24b', zig: true }], multimeter: ['on', '📟', { text: '0.00V' }], short_circuit: ['on', '🔌', { sparks: true }], blackout: ['dark', '💡'],
    acid_splash: ['throw', '🧪', { blobs: true, bc: '#8fe06a' }], fumes: ['cloud', '☁️', { tint: 'rgba(160,90,200,0.45)' }], titrate: ['self', '⚗️', { rain: true }], foam_burst: ['on', '🫧', { bubbles: true }],
    pm_dust: ['cloud', '😷', { tint: 'rgba(120,120,120,0.5)' }], plant_tree: ['self', '🌱', { grow: '🌳' }], clean_wind: ['wave', '🍃'], stopwatch: ['self', '⏱️', { spin: true }],
    conveyor_rush: ['rush', '📦'], kpi_pressure: ['on', '📉', { text: 'KPI!' }], lean_strike: ['slash', '✂️', { c: '#f4f4ec' }], cheer_faculty: ['self', '📣', { text: 'วิศวะ สู้ๆ!', confetti: true }],
    wak_shout: ['wave', '📢', { text: 'ว้ากกก!!' }], mermaid_song: ['wave', '🎶', { zzz: true }], river_splash: ['throw', '🐟'], takhian_leaf: ['on', '🍃', { spin: true, n: 4 }],
    nang_gaze: ['on', '😒', { text: 'ค้อน!' }], dike_stance: ['self', '🛡️'], hoe_swing: ['slash', '⛏️', { c: '#d8b47a' }], glow_flash: ['self', '🔆', { flash: true }],
    ghost_light: ['beam', '🟠', { c: '#f2a03a' }], naga_wave: ['on', '🌊', { big: true, naga: true }], naga_coil: ['on', '🐍', { coil: true }], mask_dance: ['self', '👺', { bounce: true }],
    wood_sword: ['slash', '🗡️', { c: '#d9b25a' }], treasure_guard: ['self', '💰', { coins: true }], stone_drop: ['drop', '🧱', { n: 4 }], saline_drip: ['self', '💧', { iv: true }],
    night_round: ['beam', '🔦', { c: '#fff8c0' }], take_meds: ['throw', '💊', { text: 'กินยายัง?' }], wheel_ram: ['rush', '🦽'], squeak_wheel: ['wave', '🛞', { text: 'เอี๊ยดดด!' }],
    wrong_ward: ['on', '🔀', { spin: true, text: 'ทางไหน?' }], bandage: ['self', '🩹', { hearts: true }], inject: ['throw', '💉'], case_present: ['on', '📊', { zzz: true }],
    anatomy_strike: ['throw', '🦴', { spin: true }], mud_therapy: ['drop', '🟤', { big: true, text: 'ปึก!' }], herbal_pot: ['self', '🏺', { steam: true }], numb_shot: ['throw', '💉', { zzz: true }],
    pulse_check: ['self', '🩺', { ecg: true }], looking_down: ['on', '😏', { text: 'หึ...' }],
    // ท่าพื้นฐาน + ท่าวาโลแลนด์ (m = ท่าทางของตัวละคร ถ้าไม่ใส่จะเดาจากแบบเอฟเฟกต์)
    tackle: ['body', '💥', { m: 'rush' }], dash: ['body', '💨', { m: 'dashx', after: true }], flicker: ['on', '💡', { flash: true, blink: true }],
    updraft: ['self', '🌬️', { m: 'jump', wind: true }], tail_dash: ['body', '🌪️', { m: 'dashx', after: true, c: '#c8f0b0' }], cloudburst: ['cloud', '☁️', { tint: 'rgba(240,244,255,0.75)', big: true }],
    blade_storm: ['multi', '🔪', { n: 6, spin: true }], dark_cover: ['cloud', '🌑', { tint: 'rgba(20,18,40,0.65)', m: 'vanish' }], shadow_hand: ['on', '🖐️', { rise: true, shade: true }],
    paint_shells: ['multi', '🎨', { n: 4, arc: true, paint: true }], boom_bot: ['rush', '🤖', { text: 'ตูม!', boom: true }], showstopper: ['rocket', '🚀', { big: true, text: 'ตูม!!' }],
    fault_line: ['ground', '🪨', { m: 'stomp' }], stim_beacon: ['self', '🚩', { confetti: true }], high_gear: ['body', '⚡', { m: 'dashx', after: true, c: '#fff2a8' }],
    relay_bolt: ['multi', '🔵', { n: 1, hop: true, sparks: true }], overdrive: ['beam', '✋', { c: '#5fe0f0', wide: true }], turret_fire: ['multi', '🔫', { n: 6, bullet: true, turret: true }],
    shock_dart: ['multi', '🏹', { n: 1, straight: true, sparks: true }], healing_orb: ['self', '🟢', { hearts: true }], ice_barrier: ['self', '🧊', { wall: true }],
    slow_orb: ['throw', '🔮', { freeze: true }], toxic_screen: ['cloud', '☠️', { tint: 'rgba(120,220,90,0.5)', big: true }], snake_bite: ['throw', '🐍', { blobs: true, bc: '#8fe06a', text: 'ฉึก!' }],
    empress: ['self', '👑', { flash: true, aura: '#b06aff' }], leer_eye: ['throw', '👁️', { spin: true }], headshot: ['snipe', '🔫', { text: 'HEADSHOT!' }],
    operator: ['snipe', '🔭', { big: true, text: 'ปัง!!' }], hot_hands: ['throw', '🔥', { big: true }], tour_de_force: ['snipe', '💎', { text: 'สง่างาม~' }],
    incendiary: ['drop', '🔥', { n: 5, sat: true }],
    // ท่าไม้ตาย
    ult_bee: ['rush', '🐃', { big: true, ride: true, text: 'ม้อออออ!!', m: 'ride' }], ult_am: ['beam', '⚡', { c: '#fff2a8', wide: true, zig: true }], ult_tle: ['drop', '🍙', { n: 5, big: true }],
    ult_ter: ['throw', '🪁', { tornado: true, big: true }], ult_water: ['cloud', '🌧️', { rain: true, big: true }], ult_earth: ['ground', '🪨', { m: 'stomp' }],
    ult_electric: ['beam', '⚡', { c: '#fff2a8', zig: true, wide: true }], ult_wind: ['on', '🌪️', { big: true, spin: true }], ult_normal: ['wave', '🎶', { arcs: true, text: 'ม่วนซื่น!' }],
  };
  // ---------- ฉากเฉพาะท่า: วาดตามชื่อท่าตรงๆ (กระดานสอน กินข้าวเหนียว กระโดดลงนา ขากรรไกรงับ ฯลฯ) แทนแบบทั่วไปใน SIG ----------
  const PI = Math.PI;
  function chalkBoard(H, lines, talk, screen) {   // กระดาน/จอพรีเซนต์ข้างผู้ใช้ เขียนทีละบรรทัด
    const { ctx, t, ax, ay, dir, cl, say, em } = H, a = cl(t * 8) * (1 - cl((t - 0.9) * 10)); if (a <= 0) return;
    const w = 48, h = 32, x = Math.round(ax + (dir > 0 ? 24 : -24 - w)), y = Math.round(ay - 46);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(x + 6, y + h, 2, 14); ctx.fillRect(x + w - 8, y + h, 2, 14);
    ctx.fillStyle = screen ? '#9aa0ac' : '#8a5a34'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = screen ? '#f6f8fc' : '#2f5a3a'; ctx.fillRect(x, y, w, h);
    if (!screen) { ctx.fillStyle = '#d8d0b8'; ctx.fillRect(x + 2, y + h - 1, w - 4, 2); }
    ctx.font = '6px Itim, Tahoma, sans-serif'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    let pen = null;
    lines.forEach((ln, i) => {
      const k = cl((t - 0.1) * 3.4 - i * 0.9); if (k <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y, (w - 4) * k, h); ctx.clip();
      ctx.fillStyle = screen ? (i ? '#203040' : '#2f6fb0') : '#f4f4ec'; ctx.fillText(ln, x + 3, y + 2 + i * 9); ctx.restore();
      if (k < 1) pen = [x + 3 + (w - 6) * k, y + 6 + i * 9];
    });
    if (screen) for (let i = 0; i < 3; i++) { const k = cl((t - 0.45) * 4 - i * 0.3); ctx.fillStyle = ['#d9455a', '#f2a03a', '#5fae4a'][i]; ctx.fillRect(x + 30 + i * 5, y + h - 3 - k * (8 + i * 4), 4, k * (8 + i * 4)); }
    ctx.restore();
    if (pen) em(screen ? '🖊️' : '🖍️', pen[0] + 3, pen[1] - 3, 8, 0, false, a);
    if (screen && t > 0.5) { H.dot('#ff3040', x + 32 + Math.sin(t * 20) * 6, y + 20 + Math.cos(t * 13) * 3, 1.5); }
    if (t > 0.2 && t < 0.88) say(talk, ax, ay - 34 - (Math.floor(t * 6) % 2), a);
  }
  function teeth(ctx, x, y, w, up) {   // แถวฟันขาวพร้อมเหงือก
    ctx.fillStyle = '#c0485a'; ctx.fillRect(x - w / 2, up ? y - 4 : y, w, 4);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const x0 = x - w / 2 + (i * w) / 5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w / 10, y + (up ? 7 : -7)); ctx.lineTo(x0 + w / 5, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  const tan = 'rgba(216,180,122,', heal = (H, from) => { const { t, ax, ay, dot } = H; if (t > from) for (let i = 0; i < 7; i++) dot(i % 2 ? '#8fe06a' : '#e8ffd8', ax - 14 + i * 5, ay + 14 - (t - from) * 70 - (i % 3) * 5, 1.5); };
  const SCENE = {
    lecture: (H) => chalkBoard(H, ['บทที่ 1: ทฤษฎี', 'F = m · a', '∫ f(x) dx = ?'], 'บลาๆๆ...'),
    case_present: (H) => chalkBoard(H, ['Case #47', 'ไข้ 3 วัน', 'Dx: ?'], 'และเคสถัดไป...', true),
    sticky_rice: (H) => {   // ปั้นข้าวเหนียวใส่ปาก กัดสามคำ เศษข้าวร่วง แล้วฟื้นพลัง
      const { t, ax, ay, dir, em, say, dot } = H, bites = Math.min(3, Math.floor(t * 4.2));
      if (t < 0.75) em('🍙', ax + dir * 10, ay - 2 + Math.sin(t * 40), 22 - bites * 4);
      if (t > 0.2 && t < 0.8) for (let i = 0; i < 3; i++) dot('#f8f4e8', ax + dir * (5 + i * 3), ay + 2 + ((t * 70 + i * 7) % 16), 1);
      if (t > 0.2 && t < 0.75) say('งั่มๆ', ax, ay - 32, 1);
      if (t > 0.7) em('😋', ax, ay - 30, 12, 0, false, 1 - H.cl((t - 0.9) * 10));
      heal(H, 0.7);
    },
    field_slam: (H) => {   // กระโดดลงนา: เงาใต้ศัตรู แล้วโคลนกระจาย ต้นข้าวปลิว
      const { ctx, t, tx, ty, dot, em, say, cl } = H;
      if (t < 0.5) { ctx.globalAlpha = 0.4; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(tx, ty + 20, 4 + t * 26, 2 + t * 7, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      else { const h = cl((t - 0.5) / 0.45); ctx.globalAlpha = 1 - h * 0.8;
        for (let i = 0; i < 12; i++) { const a = PI * (0.1 + (i / 11) * 0.8); dot(i % 3 ? '#6b4a2a' : '#8a6a44', tx + Math.cos(a) * h * 30 * (i % 2 ? 1 : -1), ty + 18 - Math.sin(a) * h * 34 + h * h * 30, 3 - h); }
        for (let i = 0; i < 3; i++) em('🌾', tx + (i - 1) * 16 * h, ty + 10 - h * 22, 10, (i - 1) * h * 2);
        ctx.globalAlpha = 1; say('ตูม!', tx, ty - 30, 1 - h); }
    },
    pond_dive: (H) => {   // กระโดดตูมลงหนอง: เสาน้ำกระเซ็น หยดน้ำ วงน้ำ
      const { ctx, t, tx, ty, dot, say, cl } = H;
      if (t < 0.5) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#9fd8f0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tx, ty + 20, 6 + t * 20, 2 + t * 5, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else { const h = cl((t - 0.5) / 0.45); ctx.globalAlpha = 1 - h * 0.7;
        ctx.fillStyle = 'rgba(159,216,240,0.85)'; const ch = Math.sin(h * PI) * 46; ctx.fillRect(tx - 7, ty + 18 - ch, 14, ch);
        for (let i = 0; i < 14; i++) { const a = (i / 13) * PI; dot(i % 2 ? '#e8f8ff' : '#7cc6de', tx + Math.cos(a) * h * 34, ty + 14 - Math.sin(a) * h * 38 + h * h * 34, 2.5); }
        ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 1.5; for (let r = 0; r < 2; r++) { ctx.beginPath(); ctx.ellipse(tx, ty + 20, 10 + h * 30 + r * 8, 3 + h * 8 + r * 2, 0, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1; say('ตูม!!', tx, ty - 34, 1 - h); }
    },
    belly_flop: (H) => {   // กระโดดทับทั้งตัว: ฝุ่นวงแหวน ดาวหมุน
      const { ctx, t, tx, ty, dot, em, say, cl } = H;
      if (t < 0.5) { ctx.globalAlpha = 0.45; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(tx, ty + 20, 4 + t * 30, 2 + t * 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      else { const h = cl((t - 0.5) / 0.45); ctx.globalAlpha = 1 - h;
        for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; dot(tan + '0.85)', tx + Math.cos(a) * (10 + h * 26), ty + 20 + Math.sin(a) * (3 + h * 7), 4 - h * 2); }
        for (let i = 0; i < 3; i++) em('⭐', tx + Math.cos(i * 2.1 + t * 9) * 18, ty - 22 + Math.sin(i * 2.1 + t * 9) * 5, 8);
        ctx.globalAlpha = 1; say('อั้ก!', tx, ty - 34, 1 - h); }
    },
    koi_hop: (H) => {   // กระโดดกอยขาเดียว: ฝุ่นตรงจุดที่เท้าลงทีละจังหวะ แล้วกระแทกพื้นใส่ศัตรู
      const { ctx, t, ax, ay, tx, ty, dot, burst, say, cl } = H;
      for (let j = 1; j <= 3; j++) { const at = (0.55 * j) / 3, d = t - at; if (d < 0 || d > 0.3) continue; const k = (0.7 * j) / 3; ctx.globalAlpha = 1 - d / 0.3; for (let i = 0; i < 4; i++) dot(tan + '0.9)', ax + (tx - ax) * k + (i - 1.5) * 5, ay + 22 + (ty - ay) * k - d * 20, 2.5); ctx.globalAlpha = 1; }
      if (t > 0.55) { const h = cl((t - 0.55) / 0.45); ctx.globalAlpha = 1 - h; burst(tx, ty + 6, h, '#d8b47a'); ctx.globalAlpha = 1; say('ฮึบ!', tx, ty - 30, 1 - h); }
    },
    dust_kick: (H) => {   // เตะฝุ่น: ฝุ่นพุ่งจากปลายเท้าเป็นรูปพัด แล้วตลบที่ศัตรู
      const { ctx, t, ax, ay, tx, ty, dir, dot, em, say, cl } = H;
      if (t > 0.22 && t < 0.4) em('🦶', ax + dir * 16, ay + 14, 11, dir * -0.6, dir < 0);
      for (let i = 0; i < 16; i++) { const k = cl((t - 0.28 - (i % 5) * 0.03) / 0.35); if (k <= 0 || k >= 1) continue; const sp = (i / 15 - 0.5) * 30 * k; dot(tan + (0.9 - k * 0.4) + ')', ax + (tx - ax) * k, ay + 18 + (ty - ay - 12) * k + sp - Math.sin(k * PI) * 10, 2 + k * 2); }
      if (t > 0.6) { const h = cl((t - 0.6) / 0.4); ctx.globalAlpha = 1 - h; for (let i = 0; i < 7; i++) dot(tan + '0.6)', tx + Math.cos(i * 0.9 + t * 4) * (8 + h * 12), ty + Math.sin(i * 1.4 + t * 4) * (6 + h * 6), 6 + h * 4); ctx.globalAlpha = 1; say('แค่กๆ', tx, ty - 32, 1 - h); }
    },
    spin: (H) => {   // หมุนติ้ว: ลมวนรอบตัวตอนพุ่ง แล้วกระแทกเป็นวง
      const { ctx, t, ax, ay, tx, ty, dot, burst, cl } = H, k = cl(t / 0.42), x = ax + (tx - ax) * k * 0.78, y = ay + (ty - ay) * k * 0.78;
      if (t < 0.7) for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(200,240,176,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + 4 - i * 9, 16 - i * 2, 4, 0, t * 30 + i, t * 30 + i + 3.6); ctx.stroke(); }
      if (t > 0.42) { const h = cl((t - 0.42) / 0.5); ctx.globalAlpha = 1 - h; burst(tx, ty, h, '#c8f0b0'); for (let i = 0; i < 5; i++) dot('#5fae4a', tx + Math.cos(i * 1.3 + h * 6) * h * 22, ty + Math.sin(i * 1.3 + h * 6) * h * 14, 2); ctx.globalAlpha = 1; }
    },
    splash_spook: (H) => {   // โผล่หน้าผีหลอก แล้วพ่นน้ำเย็นจากปาก
      const { ctx, t, ax, ay, tx, ty, dir, dot, em, say, cl } = H;
      if (t < 0.32) { em('👻', ax + dir * 6, ay - 26, 10 + cl(t * 8) * 8); say('แบ่!', ax, ay - 42, 1); }
      for (let i = 0; i < 14; i++) { const k = cl((t - 0.25 - i * 0.018) / 0.3); if (k <= 0 || k >= 1) continue; dot(i % 2 ? '#e8f8ff' : '#7cc6de', ax + dir * 8 + (tx - ax - dir * 8) * k, ay - 6 + (ty - ay + 6) * k - Math.sin(k * PI) * 10 + Math.sin(i) * 2, 2.5); }
      if (t > 0.55) { const h = cl((t - 0.55) / 0.45); ctx.globalAlpha = 1 - h; for (let i = 0; i < 8; i++) dot('#bfe8f8', tx + Math.cos(i * 0.8) * h * 22, ty + Math.sin(i * 0.8) * h * 16, 2.5); em('❄️', tx + 12, ty - 14 - h * 8, 9); ctx.globalAlpha = 1; say('เย็นเฉียบ!', tx, ty - 32, 1 - h); }
    },
    raw_bite: (H) => {   // ขากรรไกรใหญ่บน-ล่างงับปิดใส่ศัตรู
      const { ctx, t, tx, ty, say, burst, cl } = H, c = t < 0.45 ? Math.pow(t / 0.45, 2) : 1, a = 1 - cl((t - 0.75) * 4);
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; teeth(ctx, tx, ty - 32 + c * 24, 40, true); teeth(ctx, tx, ty + 28 - c * 24, 40, false); ctx.restore(); }
      if (t > 0.45) { const h = cl((t - 0.45) / 0.5); ctx.globalAlpha = 1 - h; burst(tx, ty - 2, h); ctx.globalAlpha = 1; say('งั่ม!', tx + 18, ty - 30, 1 - h); }
    },
    basket_flap: (H) => {   // กระพือกระด้ง: กระด้งกลมโบกขึ้นลง ลมและแกลบปลิวไปหาศัตรู
      const { ctx, t, ax, ay, tx, ty, dir, dot, cl, burst } = H, bx = ax + dir * 16, by = ay - 6, ry = 12 * Math.abs(Math.cos(t * 24)) + 2;
      if (t < 0.8) { ctx.fillStyle = '#c9a063'; ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(bx, by, 13, ry, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(122,90,42,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx, by, 8, ry * 0.6, 0, 0, 7); ctx.stroke(); }
      for (let i = 0; i < 3; i++) { const k = cl(t * 1.6 - 0.15 - i * 0.18); if (k <= 0 || k >= 1) continue; ctx.strokeStyle = 'rgba(200,240,176,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + (tx - bx) * k, by + (ty - by) * k, 8 + i * 3, dir > 0 ? -1 : 2.1, dir > 0 ? 1 : 4.2); ctx.stroke(); }
      for (let i = 0; i < 10; i++) { const k = cl((t - 0.2 - i * 0.03) / 0.45); if (k <= 0 || k >= 1) continue; dot('#e8d07a', bx + (tx - bx) * k, by + (ty - by) * k + Math.sin(i * 2 + k * 12) * 10, 1.3); }
      if (t > 0.6) { const h = cl((t - 0.6) / 0.4); ctx.globalAlpha = 1 - h; burst(tx, ty, h, '#c8f0b0'); ctx.globalAlpha = 1; }
    },
    kite_storm: (H) => {   // ว่าวจุฬาลอยเหนือสนาม สายป่านจากมือผู้ใช้ แล้วลมหมุนเป็นพายุที่ศัตรู
      const { ctx, t, ax, ay, tx, ty, dir, em, cl } = H, kx = ax + (tx - ax) * 0.55 + Math.sin(t * 7) * 12, ky = 18 + Math.cos(t * 5) * 5, a = 1 - cl((t - 0.88) * 8);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#f4f4ec'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax + dir * 8, ay - 8); ctx.quadraticCurveTo(ax + dir * 30, ky + 40, kx, ky + 6); ctx.stroke(); ctx.restore();
      em('🪁', kx, ky, 18, Math.sin(t * 9) * 0.4, dir < 0, a);
      if (t > 0.35) { const h = cl((t - 0.35) / 0.55); ctx.globalAlpha = a; for (let r = 0; r < 5; r++) { ctx.strokeStyle = r % 2 ? '#c8f0b0' : '#5fae4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tx, ty + 16 - r * 9, 5 + r * 4 * h + 2, 3, 0, t * 26 + r, t * 26 + r + 4.4); ctx.stroke(); } for (let i = 0; i < 3; i++) em('🍃', tx + Math.cos(t * 14 + i * 2) * 18, ty - 4 + Math.sin(t * 14 + i * 2) * 8 - i * 6, 8); ctx.globalAlpha = 1; }
    },
    grease: (H) => {   // อัดจารบี: กระบอกอัดที่มือ จารบีดำพุ่งเป็นสาย แล้วนองลื่นใต้ศัตรู
      const { ctx, t, ax, ay, tx, ty, dir, dot, em, say, cl } = H;
      if (t < 0.7) em('🛢️', ax + dir * 14, ay + 2, 12);
      for (let i = 0; i < 10; i++) { const k = cl((t - 0.15 - i * 0.03) / 0.35); if (k <= 0 || k >= 1) continue; dot('#1e1a18', ax + dir * 16 + (tx - ax - dir * 16) * k, ay + (ty - ay) * k - Math.sin(k * PI) * 16, 3); dot('#6a6060', ax + dir * 16 + (tx - ax - dir * 16) * k - 1, ay + (ty - ay) * k - Math.sin(k * PI) * 16 - 1, 1); }
      if (t > 0.5) { const h = cl((t - 0.5) / 0.4); ctx.globalAlpha = 1 - cl((t - 0.9) * 10); ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.ellipse(tx, ty + 20, 6 + h * 18, 2 + h * 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a8a9a'; ctx.fillRect(tx - 6 + h * 4, ty + 18, 6, 1); for (let i = 0; i < 4; i++) dot('#1e1a18', tx - 10 + i * 7, ty - 4 + i * 3, 2.5); ctx.globalAlpha = 1; say('ลื่น!', tx, ty - 32, 1 - cl((t - 0.85) * 6)); }
    },
    brick_smash: (H) => {   // วางก้อนอิฐ มือสับลงมา อิฐหักสองท่อน เศษกระจาย
      const { ctx, t, tx, ty, dot, em, say, cl } = H, bx = tx - 12, by = ty - 2;
      const bk = (x, y, w, r) => { ctx.save(); ctx.translate(x + w / 2, y + 5); ctx.rotate(r); ctx.fillStyle = '#b8503a'; ctx.fillRect(-w / 2, -5, w, 10); ctx.fillStyle = '#e0c8a8'; ctx.fillRect(-w / 2, -1, w, 1); ctx.fillStyle = '#8a3a2a'; ctx.fillRect(-w / 2, 4, w, 1); ctx.restore(); };
      if (t < 0.5) { bk(bx, by, 24, 0); if (t > 0.25) em('✋', tx, by - 24 + cl((t - 0.25) / 0.25) * 18, 14, -0.4); }
      else { const h = cl((t - 0.5) / 0.45); ctx.globalAlpha = 1 - cl((h - 0.7) * 3); bk(bx - h * 12, by + h * h * 18, 12, -h * 1.2); bk(bx + 12 + h * 12, by + h * h * 18, 12, h * 1.2); for (let i = 0; i < 8; i++) dot(i % 2 ? '#b8503a' : '#e0c8a8', tx + Math.cos(i * 0.8) * h * 26, by + Math.sin(i * 0.8) * h * 14 - h * 6, 1.5); ctx.globalAlpha = 1; say('ป้าก!', tx, ty - 32, 1 - h); }
    },
    dike_stance: (H) => {   // ปักหลักคันนา: ค้อนตอกหลักไม้ลงคันดินสามที แล้วยืนหยัดมีเกราะดิน
      const { ctx, t, ax, ay, dir, dot, em, say, cl } = H, sx = ax + dir * 22, gy = ay + 22, sink = Math.min(3, Math.floor(t * 5.5)) * 3, a = 1 - cl((t - 0.9) * 10);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.ellipse(ax + dir * 8, gy + 2, 30, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#9a6a3a'; ctx.fillRect(sx - 3, gy - 24 + sink, 6, 24 - sink); ctx.fillStyle = '#c89a5a'; ctx.fillRect(sx - 3, gy - 24 + sink, 6, 2); ctx.restore();
      if (t < 0.62) { const ph = (t * 5.5) % 1; em('🔨', sx + dir * 7, gy - 34 + sink - Math.sin(ph * PI) * 8, 18, dir * (0.9 - ph * 1.6), dir < 0); if (ph < 0.2) for (let i = 0; i < 4; i++) dot(tan + '0.9)', sx + (i - 1.5) * 5, gy - 2 - ph * 20, 2); }
      if (t > 0.6) { const h = cl((t - 0.6) / 0.3); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = '#d8b47a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(ax, ay + 4, 18 + h * 4, 26 + h * 4, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; say('ปักหลัก!', ax, ay - 34, a); }
    },
    river_splash: (H) => {   // สะบัดหางปลา น้ำสาดเป็นโค้งใส่หน้า
      const { ctx, t, ax, ay, tx, ty, dir, dot, em, say, cl } = H;
      if (t < 0.45) em('🐟', ax + dir * 14, ay + 4, 14, Math.sin(t * 28) * 0.7, dir < 0);
      for (let i = 0; i < 12; i++) { const k = cl((t - 0.2 - i * 0.02) / 0.4); if (k <= 0 || k >= 1) continue; dot(i % 3 ? '#7cc6de' : '#e8f8ff', ax + (tx - ax) * k, ay + (ty - ay) * k - Math.sin(k * PI) * (30 + (i % 4) * 4), 2.5); }
      if (t > 0.6) { const h = cl((t - 0.6) / 0.4); ctx.globalAlpha = 1 - h; for (let i = 0; i < 9; i++) dot('#e8f8ff', tx + Math.cos(i * 0.7) * h * 24, ty - 4 + Math.sin(i * 0.7) * h * 18, 2.5); ctx.globalAlpha = 1; say('ซ่า!', tx, ty - 32, 1 - h); }
    },
    wrong_ward: (H) => {   // รถเข็นวนรอบศัตรูจนงง เส้นทางวนเป็นวงรี
      const { ctx, t, tx, ty, em, say, cl } = H, a = 1 - cl((t - 0.88) * 8);
      ctx.save(); ctx.globalAlpha = a * 0.6; ctx.setLineDash([3, 3]); ctx.strokeStyle = '#f4f4ec'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(tx, ty + 14, 28, 9, 0, 0, 7); ctx.stroke(); ctx.restore();
      const g = t * PI * 5, x = tx + Math.cos(g) * 28, y = ty + 14 + Math.sin(g) * 9;
      em('🦽', x, y - 6, 16, 0, Math.sin(g) > 0, a);
      if (t > 0.3) for (let i = 0; i < 3; i++) em('💫', tx + Math.cos(t * 12 + i * 2.1) * 12, ty - 22 + Math.sin(t * 12 + i * 2.1) * 4, 8, 0, false, a);
      if (t > 0.25) say('ตึกไหนเนี่ย?', tx, ty - 36, a);
    },
    anatomy_strike: (H) => {   // ทุบตามกายวิภาค: เป้าแดงขึ้นที่หัว อก เข่า แล้วกระดูกทุบทีละจุด
      const { ctx, t, tx, ty, em, say, burst, cl } = H, pts = [[0, -16], [3, 0], [-4, 14]];
      pts.forEach(([dx, dy], i) => {
        const x = tx + dx, y = ty + dy, on = t - 0.08 - i * 0.14, hitAt = t - 0.3 - i * 0.14;
        if (on > 0 && hitAt < 0.15) { ctx.strokeStyle = '#ff3040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6 - Math.min(on, 0.3) * 6, 0, 7); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke(); }
        if (hitAt > -0.12 && hitAt < 0) em('🦴', x + 10, y - 10 + (hitAt + 0.12) * 80, 11, 0.8);
        if (hitAt > 0 && hitAt < 0.25) { ctx.globalAlpha = 1 - hitAt * 4; burst(x, y, hitAt * 3, '#f4f4ec'); ctx.globalAlpha = 1; }
      });
      if (t > 0.3) say('จุดนี้!', tx, ty - 36, 1 - cl((t - 0.85) * 6));
    },
    bandage: (H) => {   // พันผ้าพันแผลรอบตัวทีละรอบ แล้วติดพลาสเตอร์
      const { ctx, t, ax, ay, em, cl } = H, a = 1 - cl((t - 0.9) * 10);
      for (let i = 0; i < 5; i++) { const k = cl((t - i * 0.11) * 6); if (k <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.translate(ax, ay - 12 + i * 7); ctx.rotate(-0.25); ctx.fillStyle = '#c8c0b0'; ctx.fillRect(-13, 1, 26 * k, 4); ctx.fillStyle = '#f8f6f0'; ctx.fillRect(-13, 0, 26 * k, 4); ctx.restore(); }
      if (t > 0.6) em('🩹', ax + 8, ay - 14, 10, 0.3, false, a);
      heal(H, 0.6);
    },
    beg_merit: (H) => {   // ยื่นขันขอส่วนบุญ ของกินหล่นจากฟ้าลงขัน
      const { t, ax, ay, em, say, cl } = H, a = 1 - cl((t - 0.9) * 10);
      em('🥣', ax, ay - 22, 14, 0, false, a);
      ['🍚', '🍌', '🍬'].forEach((f, i) => { const k = cl((t - 0.12 - i * 0.16) / 0.25); if (k > 0 && k < 1) em(f, ax - 6 + i * 6, ay - 76 + k * 52, 10); });
      if (t > 0.3) say('สาธุ~', ax, ay - 46, a);
      heal(H, 0.65);
    },
    battery_shot: (H) => {   // ขว้างถ่านไฟฉาย แล้วไฟช็อตแตกเป็นซิกแซก
      const { ctx, t, ax, ay, tx, ty, em, line, cl } = H, k = cl(t / 0.55);
      if (t < 0.56) em('🔋', ax + (tx - ax) * k, ay + (ty - ay) * k - Math.sin(k * PI) * 24, 12, t * 14);
      if (t > 0.55) { const h = cl((t - 0.55) / 0.45); ctx.globalAlpha = 1 - h; for (let i = 0; i < 5; i++) { const a0 = i * 1.26 + h, r = 6 + h * 18; line(i % 2 ? '#fff2a8' : '#f2d24b', 2, [[tx, ty], [tx + Math.cos(a0) * r * 0.5 + 3, ty + Math.sin(a0) * r * 0.5 - 3], [tx + Math.cos(a0) * r, ty + Math.sin(a0) * r]]); } em('⚡', tx, ty - 22, 12); ctx.globalAlpha = 1; }
    },
    treasure_guard: (H) => {   // กอดไหสมบัติแน่น เหรียญหมุนรอบ
      const { ctx, t, ax, ay, em, say, cl } = H, a = 1 - cl((t - 0.9) * 10);
      em('🏺', ax, ay + 6, 18, Math.sin(t * 30) * 0.05, false, a);
      for (let i = 0; i < 5; i++) em('🪙', ax + Math.cos(t * 8 + i * 1.26) * 22, ay + Math.sin(t * 8 + i * 1.26) * 8 - 4, 8, 0, false, a);
      if (t > 0.4) { ctx.globalAlpha = a * 0.6; ctx.strokeStyle = '#f2d24b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ax, ay + 4, 22, 28, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (t > 0.2) say('ของข้า!', ax, ay - 34, a);
    },
    piston_ram: (H) => {   // กระบอกสูบที่ผู้ใช้ ก้านลูกสูบยืดกระแทกศัตรู พ่นไอ
      const { ctx, t, ax, ay, tx, ty, dir, dot, burst, cl } = H, bx = ax + dir * 14, by = ay, a = 1 - cl((t - 0.88) * 8);
      const e = t < 0.2 ? 0 : t < 0.48 ? Math.pow((t - 0.2) / 0.28, 2) : t < 0.65 ? 1 : 1 - (t - 0.65) / 0.25, ex = bx + (tx - bx) * 0.8 * Math.max(0, e), ey = by + (ty - by) * 0.8 * Math.max(0, e);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#c0c4cc'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.fillStyle = '#6a7080'; ctx.fillRect(bx - 7, by - 7, 14, 14); ctx.fillStyle = '#9aa0ac'; ctx.fillRect(bx - 7, by - 7, 14, 3);
      ctx.fillStyle = '#5a6070'; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 7); ctx.fill(); ctx.restore();
      if (t > 0.2 && t < 0.7) for (let i = 0; i < 3; i++) dot('rgba(255,255,255,0.6)', bx - dir * (6 + i * 4), by - 8 - ((t * 60 + i * 5) % 14), 2.5);
      if (t > 0.48) { const h = cl((t - 0.48) / 0.45); ctx.globalAlpha = 1 - h; burst(tx, ty, h); ctx.globalAlpha = 1; }
    },
    conveyor_rush: (H) => {   // สายพานวิ่งจากผู้ใช้ถึงศัตรู กล่องไหลตาม
      const { ctx, t, now, ax, ay, tx, ty, em, burst, cl } = H, a = cl(t * 6) * (1 - cl((t - 0.85) * 7)), y0 = ay + 22, y1 = ty + 22;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(tx, y1); ctx.stroke();
      for (let i = 0; i < 12; i++) { const k = ((i / 12) + now / 900) % 1; ctx.fillStyle = '#7a7a88'; ctx.fillRect(ax + (tx - ax) * k - 1, y0 + (y1 - y0) * k - 3, 2, 6); }
      ctx.restore();
      for (let i = 0; i < 2; i++) { const k = cl((t - i * 0.15) / 0.6); if (k > 0 && k < 1) em('📦', ax + (tx - ax) * k, y0 + (y1 - y0) * k - 8, 10); }
      if (t > 0.45) { const h = cl((t - 0.45) / 0.5); ctx.globalAlpha = 1 - h; burst(tx, ty, h); ctx.globalAlpha = 1; }
    },
    stone_drop: (H) => {   // อิฐเจดีย์เก่าร่วงจากยอดเจดีย์ที่โผล่เหนือศัตรู
      const { ctx, t, tx, ty, em, dot, cl } = H;
      em('🛕', tx, ty - 62, 20, 0, false, cl(t * 5) * (1 - cl((t - 0.8) * 5)));
      for (let i = 0; i < 4; i++) { const k = cl((t - 0.15 - i * 0.09) / 0.35); if (k <= 0) continue; const x = tx + (i - 1.5) * 10; if (k < 1) em('🧱', x, ty - 50 + k * 54, 11, i * 0.7); else { ctx.globalAlpha = Math.max(0, 1 - (t - 0.5 - i * 0.09) * 3); dot(tan + '0.8)', x, ty + 10, 6); ctx.globalAlpha = 1; } }
    },
    pound_ground: (H) => {   // ตะโกนลั่นทุ่ง: วงเสียงแผ่จากปาก ต้นหญ้าเอนตาม
      const { ctx, t, ax, ay, line, say, cl } = H;
      for (let i = 0; i < 3; i++) { const k = cl(t * 1.8 - i * 0.25); if (k <= 0 || k >= 1) continue; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(ax, ay - 8, 10 + k * 46, 6 + k * 24, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      for (let i = 0; i < 10; i++) { const gx = ax - 50 + i * 11, lean = Math.sin(t * 12 + i) * 4 * (1 - t) + (gx < ax ? -3 : 3) * cl(t * 3); line('#5fae4a', 1.5, [[gx, ay + 26], [gx + lean, ay + 18]]); }
      say('เฮ้ยยย!!', ax, ay - 34, 1 - cl((t - 0.85) * 6));
    },
    push_glasses: (H) => {   // นิ้วดันแว่นขึ้น แว่นวิ้ง แล้วเป้าเล็งที่ศัตรู
      const { ctx, t, ax, ay, tx, ty, dir, em, cl } = H;
      em('👓', ax + dir * 2, ay - 14 - cl(t / 0.35) * 5, 14);
      if (t < 0.35) em('☝️', ax + dir * 4, ay - 2 - cl(t / 0.35) * 6, 9);
      if (t > 0.35 && t < 0.7) em('✨', ax + dir * 10, ay - 24, 8 + Math.sin(t * 30) * 2);
      if (t > 0.45) { const r = 12 - (t - 0.45) * 10; ctx.strokeStyle = '#d9455a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, ty - 6, r, 0, 7); ctx.moveTo(tx - r - 4, ty - 6); ctx.lineTo(tx + r + 4, ty - 6); ctx.moveTo(tx, ty - 6 - r - 4); ctx.lineTo(tx, ty - 6 + r + 4); ctx.stroke(); }
    },
    wak_shout: (H) => {   // เข้าไปว้ากใกล้ๆ หน้า เส้นเสียงแตกใส่ศัตรู
      const { ctx, t, tx, ty, line, say, em, cl } = H;
      if (t > 0.25 && t < 0.75) { for (let i = 0; i < 6; i++) { const a0 = i * 1.05 + t * 3, r = 14 + ((t * 80 + i * 6) % 14); line('#fff8e0', 2, [[tx + Math.cos(a0) * r, ty - 4 + Math.sin(a0) * r * 0.7], [tx + Math.cos(a0) * (r + 6), ty - 4 + Math.sin(a0) * (r + 6) * 0.7]]); } say('ว้ากกก!!', tx, ty - 34 + Math.sin(t * 60) * 1.5, 1); }
      if (t > 0.6) em('💫', tx, ty - 22, 10, t * 6, false, 1 - cl((t - 0.85) * 6));
    },
  };
  // ท่าทางของตัวละครที่ใช้ท่า ปรับเพิ่มบางท่า (ท่าที่มีอยู่แล้ว)
  const MOTION_OF = { whirlwind: 'spin', mask_dance: 'spin', piston_ram: 'lunge', buffalo_charge: 'ride', belly_bump: 'bump', conveyor_rush: 'rush', wheel_ram: 'rush',
    koi_hop: 'hop', pond_dive: 'leap', belly_flop: 'leap', field_slam: 'leap', spin: 'spinrush', dust_kick: 'kick', basket_flap: 'fan', river_splash: 'fan', kite_storm: 'fan', dike_stance: 'hammer', treasure_guard: 'eat', anatomy_strike: 'slash', splash_spook: 'recoil', grease: 'throw', wrong_ward: 'cast', case_present: 'talk', bandage: 'spin', beg_merit: 'bounce', push_glasses: 'aim', stone_drop: 'stomp', brick_smash: 'slash', wind_step: 'dashx', blackout: 'vanish', spook: 'vanish', glow_flash: 'cast',
    wak_shout: 'inface', pound_ground: 'shout', wail: 'shout', cheer_faculty: 'shout', squeak_wheel: 'shout', lecture: 'talk', silly_face: 'bounce', tongue: 'bounce', sticky_rice: 'eat',
    level_check: 'aim', samurai_stare: 'aim', nang_gaze: 'aim', looking_down: 'aim', raw_bite: 'lunge', hoe_swing: 'slash', bamboo_sword: 'slash', wood_sword: 'slash', wind_blade: 'slash', lean_strike: 'slash' };
  const MOTION_BY_KIND = { throw: 'throw', rush: 'lunge', body: 'rush', drop: 'jump', cloud: 'cast', wave: 'shout', self: 'bounce', on: 'cast', beam: 'recoil', slash: 'slash', dark: 'vanish', multi: 'throw', snipe: 'aim', ground: 'stomp', rocket: 'recoil' };
  G.motionFor = (id, cat) => { const sg = SIG[id]; return (sg && sg[2] && sg[2].m) || MOTION_OF[id] || (sg && MOTION_BY_KIND[sg[0]]) || (cat === 'status' ? 'bounce' : cat === 'spec' ? 'cast' : 'lunge'); };
  // ท่าที่เล่นนานกว่าปกติ (เขียนกระดาน กินข้าว ปักหลัก ฯลฯ) จังหวะโดนตีอยู่ที่ ~57% ของเวลา
  const DUR = { lecture: 1400, case_present: 1400, sticky_rice: 1100, beg_merit: 1100, bandage: 1000, dike_stance: 1100, wrong_ward: 1100, anatomy_strike: 1000, kite_storm: 1000 };
  const durOf = (id) => DUR[id] || (SIG[id] ? 760 : 560);
  G.fxDur = durOf;
  const EMOJI = (size) => `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  function drawSig(ctx, now, f, t, sig, P) {
    const [kind, prop, o = {}] = sig, { ax, ay, tx, ty, c1, c2, cl, dot, line } = P;
    const em = (ch, x, y, size, rot = 0, flip = false, alpha = 1) => {
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(x), Math.round(y)); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = true; ctx.fillStyle = '#000'; ctx.font = EMOJI(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0); ctx.restore();
    };
    const say = (txt, x, y, a) => { ctx.save(); ctx.globalAlpha = a; ctx.font = '10px Itim, Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#18203f'; ctx.strokeText(txt, x, y); ctx.fillStyle = '#fff8e0'; ctx.fillText(txt, x, y); ctx.restore(); };
    const burst = (x, y, s, c) => { for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; line(i % 2 ? c2 : c || c1, 2, [[x + Math.cos(a) * (3 + s * 8), y + Math.sin(a) * (3 + s * 8)], [x + Math.cos(a) * (8 + s * 14), y + Math.sin(a) * (8 + s * 14)]]); } };
    const right = tx > ax, size = o.big ? 22 : 15, hit = t > 0.55 ? (t - 0.55) / 0.45 : 0;
    const sc = SCENE[f.id];
    if (sc) sc({ ctx, t, now, ax, ay, tx, ty, right, dir: right ? 1 : -1, hit, c1, c2, cl, dot, line, em, say, burst, o });
    else if (kind === 'throw') {
      const k = cl(t / 0.6), x = ax + (tx - ax) * k, y = ay + (ty - ay) * k - Math.sin(k * Math.PI) * 26;
      if (t < 0.62) em(prop, x, y, size, o.spin ? t * 18 : 0);
      if (hit) {
        ctx.globalAlpha = 1 - hit; burst(tx, ty, hit, o.bc);
        if (o.blobs) for (let i = 0; i < 6; i++) dot(o.bc || '#2a2a2a', tx + Math.cos(i * 1.1) * hit * 18, ty + 6 + Math.sin(i * 1.7) * 8 + hit * 6, 3);
        if (o.tornado) for (let r = 0; r < 4; r++) { ctx.strokeStyle = c1; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tx, ty + 12 - r * 9, 6 + r * 4, 3, 0, hit * 12 + r, hit * 12 + r + 4.5); ctx.stroke(); }
        if (o.freeze) { ctx.strokeStyle = '#bfe8f8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tx, ty + 14, 6 + hit * 20, 2 + hit * 6, 0, 0, 7); ctx.stroke(); for (let i = 0; i < 4; i++) em('❄️', tx + (i - 1.5) * 10, ty + 8 - hit * 10, 7); }
        ctx.globalAlpha = 1; if (t < 0.85) em(prop, tx, ty + hit * 8, size, 0, false, 1 - hit);
      }
    } else if (kind === 'rush') {
      const k = cl(t / 0.65), x = ax + (tx - ax) * k, y = ay + 6 + (ty - ay) * k;
      if (t < 0.7 && !o.ride) { em(prop, x, y, size + 2, o.spin ? t * 16 : 0, right); for (let i = 1; i < 4; i++) dot('rgba(216,180,122,0.7)', x - (tx - ax) * 0.08 * i, y + 8, 3 - i * 0.6); }
      if (hit) { ctx.globalAlpha = 1 - hit; burst(tx, ty, hit); if (o.boom) { dot('#f2a03a', tx, ty, 4 + hit * 20); dot('#fff2a8', tx, ty, 2 + hit * 10); } if (o.text) say(o.text, tx, ty - 30, 1 - hit); }
    } else if (kind === 'drop') {
      const n = o.n || 1;
      for (let i = 0; i < n; i++) {
        const k = cl((t - i * 0.12) / 0.45); if (k <= 0) continue;
        const x = tx + (i - (n - 1) / 2) * 12, y = ty - 60 + k * 60;
        if (k < 1) em(prop, x, y, size, i * 0.6); else { ctx.globalAlpha = Math.max(0, 1 - (t - 0.45 - i * 0.12) * 2.5); dot('rgba(216,180,122,0.8)', x, ty + 12, 6); ctx.globalAlpha = 1; }
      }
      if (o.sat) em('🛰️', tx, ty - 66, 14, 0, false, 1 - cl((t - 0.7) * 3));
      if (o.pour && t > 0.3 && t < 0.85) { ctx.fillStyle = o.pour; ctx.fillRect(tx - 3, ty - 46, 6, 46 * cl((t - 0.3) * 3)); }
    } else if (kind === 'cloud') {
      const a = cl(t * 4) * (1 - cl((t - 0.8) * 5));
      em(prop, tx + Math.sin(t * 9) * 3, ty - 30, o.big ? 26 : 20, 0, false, a);
      if (o.tint) { ctx.globalAlpha = a; for (let i = 0; i < 5; i++) dot(o.tint, tx + (i - 2) * 8, ty + Math.sin(t * 8 + i) * 4, 10); ctx.globalAlpha = 1; }
      if (o.rain && t > 0.2) for (let i = 0; i < (o.big ? 14 : 8); i++) { const yy = ((t * 260 + i * 37) % 44); line('#9fd8f0', 1.5, [[tx - 16 + (i * 7) % 32, ty - 22 + yy], [tx - 18 + (i * 7) % 32, ty - 18 + yy]]); }
    } else if (kind === 'wave') {
      em(prop, ax + (right ? 14 : -14), ay - 14, 14, 0, !right);
      for (let i = 0; i < 3; i++) {
        const k = cl(t * 1.6 - i * 0.18); if (k <= 0 || k >= 1) continue;
        const x = ax + (tx - ax) * k, y = ay + (ty - ay) * k;
        if (o.arcs || !SIG_NOTES[prop]) { ctx.globalAlpha = 1 - k * 0.5; ctx.strokeStyle = c1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6 + i * 2, right ? -0.9 : 2.2, right ? 0.9 : 4.0); ctx.stroke(); ctx.globalAlpha = 1; }
        else em(prop, x, y - Math.sin(k * 9) * 5, 12);
      }
    } else if (kind === 'self') {
      const pop = Math.sin(cl(t * 2.2) * Math.PI / 2), up = ay - 22 - (o.bounce ? Math.abs(Math.sin(t * 14)) * 6 : 0);
      em(o.grow && t > 0.5 ? o.grow : prop, ax + (o.after ? -8 + Math.sin(t * 20) * 4 : 0), up, 10 + pop * 6, o.spin ? t * 14 : 0, false, 1 - cl((t - 0.8) * 5));
      if (o.glint && t > 0.3 && t < 0.7) em('✨', ax + 8, up - 4, 10);
      if (o.hearts) for (let i = 0; i < 3; i++) em('💗', ax - 12 + i * 12, ay - 10 - t * 26 - i * 3, 8, 0, false, 1 - t);
      if (o.rain && t > 0.3) for (let i = 0; i < 6; i++) line('#9fd8f0', 1.5, [[ax - 10 + i * 4, up + 8 + ((t * 120 + i * 9) % 16)], [ax - 11 + i * 4, up + 12 + ((t * 120 + i * 9) % 16)]]);
      if (o.coins) for (let i = 0; i < 5; i++) em('🪙', ax - 14 + i * 7, up + 8 + Math.sin(t * 10 + i) * 4, 8);
      if (o.steam) for (let i = 0; i < 3; i++) dot('rgba(255,255,255,0.6)', ax - 4 + i * 4, up - 8 - ((t * 40 + i * 6) % 16), 2.5);
      if (o.iv) line('#9fd8f0', 1.5, [[ax, up + 8], [ax, ay - 2]]);
      if (o.ecg) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([ax - 20 + i * 3.3, up + 14 + ([0, 0, 0, -6, 6, -10, 0, 0, 0, -4, 0, 0, 0][i] || 0)]); line('#6cf06c', 1.5, pts.slice(0, 1 + Math.floor(t * 13))); }
      if (o.aim) { ctx.strokeStyle = '#d9455a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, ty, 10 - t * 4, 0, 7); ctx.moveTo(tx - 14, ty); ctx.lineTo(tx + 14, ty); ctx.moveTo(tx, ty - 14); ctx.lineTo(tx, ty + 14); ctx.stroke(); }
      if (o.confetti) for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#d9455a', '#f2d24b', '#5fb8e0', '#6cc04a'][i % 4]; ctx.fillRect(ax - 20 + i * 5, ay - 30 + ((t * 60 + i * 11) % 36), 2, 2); }
      if (o.flash && !G.settings.calm && t > 0.3 && t < 0.6) { ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffd08a'; ctx.fillRect(0, 0, 240, 160); ctx.globalAlpha = 1; }
      if (o.wind) for (let i = 0; i < 4; i++) line('#c8f0b0', 1.5, [[ax - 14 + i * 9, ay + 22 - ((t * 90 + i * 11) % 34)], [ax - 14 + i * 9, ay + 30 - ((t * 90 + i * 11) % 34)]]);
      if (o.wall) for (let i = 0; i < 3; i++) { const k = cl(t * 3 - i * 0.3); if (k > 0) { ctx.globalAlpha = 0.85; ctx.fillStyle = '#bfe8f8'; ctx.fillRect(ax + (right ? 18 : -30), ay + 18 - i * 12 - k * 2, 12, 11 * k); ctx.fillStyle = '#ffffff'; ctx.fillRect(ax + (right ? 19 : -29), ay + 19 - i * 12, 3, 4 * k); ctx.globalAlpha = 1; } }
      if (o.aura) { ctx.globalAlpha = 0.45 * Math.sin(t * Math.PI); ctx.strokeStyle = o.aura; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ax, ay + 4, 18 + t * 6, 26 + t * 6, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (o.text) say(o.text, ax, up - 14, 1 - cl((t - 0.8) * 5));
      if (!o.hearts && !o.coins) for (let i = 0; i < 6; i++) dot(i % 2 ? c1 : c2, ax + Math.cos(i + t * 6) * 16, ay + 10 - t * 24 - (i % 3) * 4, 1.5);
    } else if (kind === 'on') {
      const pop = Math.sin(cl(t * 2.5) * Math.PI / 2), n = o.n || 1, a = 1 - cl((t - 0.8) * 5);
      for (let i = 0; i < n; i++) {
        const ang = t * 10 + (i * Math.PI * 2) / n, x = n > 1 ? tx + Math.cos(ang) * 16 : tx, y = n > 1 ? ty + Math.sin(ang) * 10 : ty - 6;
        em(prop, x, y, (o.big ? 24 : 14) * (0.6 + pop * 0.4), o.spin && n === 1 ? t * 12 : 0, false, a);
      }
      if (o.naga && t > 0.3) em('🐉', tx + (right ? -1 : 1) * (30 - t * 30), ty - 20, 18, 0, right, a);
      if (o.coil) for (let r = 0; r < 3; r++) { ctx.globalAlpha = a; ctx.strokeStyle = '#2f6fb0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(tx, ty + 10 - r * 8, 14 - t * 3, 4, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (o.sparks) for (let i = 0; i < 6; i++) { const ang = i + now / 50; line('#fff2a8', 2, [[tx + Math.cos(ang) * 6, ty + Math.sin(ang) * 6], [tx + Math.cos(ang) * 16, ty + Math.sin(ang) * 14]]); }
      if (o.bubbles) for (let i = 0; i < 8; i++) { ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx + Math.cos(i * 0.8) * t * 24, ty + Math.sin(i * 1.3) * t * 16, 2 + (i % 3), 0, 7); ctx.stroke(); }
      if (o.rise) { const k = cl(t * 2); em(prop, tx + 4, ty + 22 - k * 24, 16, 0, false, a); if (o.shade) { ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#14122a'; ctx.beginPath(); ctx.ellipse(tx, ty + 20, 18, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
      if (o.blink && !G.settings.calm && Math.floor(t * 12) % 2) { ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff8c0'; ctx.fillRect(0, 0, 240, 160); ctx.globalAlpha = 1; }
      if (o.text) say(o.text, tx, ty - 26, a);
    } else if (kind === 'beam') {
      em(prop, ax + (right ? 12 : -12), ay - 6, 13, 0, !right);
      if (t > 0.15 && t < 0.85) {
        const k = cl((t - 0.15) * 3), ex = ax + (tx - ax) * k, ey = ay + (ty - ay) * k;
        if (o.zig) { const pts = []; for (let i = 0; i <= 8; i++) pts.push([ax + (ex - ax) * (i / 8), ay + (ey - ay) * (i / 8) + (i % 2 ? -4 : 4)]); line(o.c, 3, pts); line('#ffffff', 1, pts); }
        else { line(o.c, o.wide ? 10 : 5, [[ax, ay], [ex, ey]]); line('rgba(255,255,255,0.8)', o.wide ? 4 : 1.5, [[ax, ay], [ex, ey]]); }
      }
      if (hit) { ctx.globalAlpha = 1 - hit; burst(tx, ty, hit, o.c); }
    } else if (kind === 'slash') {
      if (t < 0.55) em(prop, ax + (tx - ax) * cl(t / 0.5), ay + (ty - ay) * cl(t / 0.5) - 10, 14, t * 10);
      if (t > 0.35) for (let i = 0; i < 3; i++) {
        const k = cl((t - 0.35 - i * 0.08) * 4); if (k <= 0) continue;
        ctx.globalAlpha = 1 - cl((t - 0.7) * 3.3); ctx.strokeStyle = o.c || c1; ctx.lineWidth = 3; ctx.beginPath();
        ctx.arc(tx - 6 + i * 6, ty - 4 + i * 4, 14, -2.4, -2.4 + k * 2.2); ctx.stroke();
      }
    } else if (kind === 'body') {   // ตัวละครพุ่งไปเอง: เส้นความเร็ว + แรงกระแทกตอนถึงตัว
      if (t > 0.1 && t < 0.5) { ctx.globalAlpha = 0.7; for (let i = 0; i < 5; i++) { const k = cl((t - 0.1) / 0.4), x = ax + (tx - ax) * k * 0.8, y = ay + (ty - ay) * k * 0.8 + (i - 2) * 6; line(o.c || c2, 1.5, [[x - (right ? 26 : -26), y], [x - (right ? 8 : -8), y]]); } ctx.globalAlpha = 1; }
      if (t > 0.42) { const h = cl((t - 0.42) / 0.5); ctx.globalAlpha = 1 - h; burst(tx, ty, h, o.c); em(prop, tx, ty - 4, 14 + h * 10); for (let i = 0; i < 3; i++) em('⭐', tx + Math.cos(i * 2.1 + t * 8) * 18, ty - 18 + Math.sin(i * 2.1 + t * 8) * 6, 7); ctx.globalAlpha = 1; }
      if (o.boing && t > 0.42) { const h = cl((t - 0.42) / 0.5); ctx.globalAlpha = 1 - h; ctx.strokeStyle = '#ffd0e0'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(tx, ty + 4, 6 + h * 20 + i * 6, 4 + h * 10 + i * 3, 0, 0, 7); ctx.stroke(); } ctx.globalAlpha = 1; }
    } else if (kind === 'multi') {   // ของหลายชิ้นต่อกัน: มีด กระสุน ลูกบอลเด้ง ลูกศร
      const n = o.n || 3;
      if (o.turret) em('🗼', ax + (right ? 22 : -22), ay + 4, 14);
      for (let i = 0; i < n; i++) {
        const st = i * (0.45 / Math.max(1, n)), k = cl((t - st) / 0.42); if (k <= 0 || k >= 1) continue;
        const sx = o.turret ? ax + (right ? 22 : -22) : ax, x = sx + (tx - sx) * k + (o.arc ? 0 : (i % 2 ? 3 : -3)), lift = o.arc ? Math.sin(k * Math.PI) * (18 + i * 4) : o.hop ? Math.abs(Math.sin(k * Math.PI * 3)) * 16 : o.straight ? 0 : Math.sin(k * Math.PI) * 6;
        const y = ay + (ty - ay) * k - lift + (o.arc ? (i - n / 2) * 4 : 0);
        if (o.bullet) { line('#fff2a8', 2, [[x - (right ? 8 : -8), y + 2], [x, y]]); dot('#ffffff', x, y, 1.5); }
        else em(prop, x, y, o.straight ? 13 : 11, o.spin ? k * 20 : o.straight ? (right ? -0.5 : 2.6) : 0, !right && !o.spin);
        if (o.sparks) dot('#fff2a8', x + Math.sin(now / 30) * 4, y + Math.cos(now / 30) * 4, 1.5);
      }
      if (hit) { ctx.globalAlpha = 1 - hit; burst(tx, ty, hit, o.c); if (o.paint) for (let i = 0; i < 7; i++) dot(['#ff4fb0', '#f2d24b', '#4fe0ff', '#6cf06c'][i % 4], tx + Math.cos(i * 0.9) * (6 + hit * 16), ty + Math.sin(i * 1.3) * (4 + hit * 10), 3.5); if (o.sparks) for (let i = 0; i < 5; i++) line('#fff2a8', 2, [[tx, ty], [tx + Math.cos(i * 1.3) * 16 * hit, ty + Math.sin(i * 1.3) * 12 * hit]]); ctx.globalAlpha = 1; }
    } else if (kind === 'snipe') {   // เล็งเป้าบนหัว แล้วยิงนัดเดียว เส้นกระสุน แสงวาบ
      em(prop, ax + (right ? 16 : -16), ay - 4, 14, right ? -0.3 : 0.3, !right);
      if (t < 0.55) { const r = 16 - t * 18; ctx.strokeStyle = '#ff4f6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, ty - 8, r, 0, 7); ctx.moveTo(tx - r - 5, ty - 8); ctx.lineTo(tx + r + 5, ty - 8); ctx.moveTo(tx, ty - 8 - r - 5); ctx.lineTo(tx, ty - 8 + r + 5); ctx.stroke(); dot('#ff4f6a', tx, ty - 8, 1.5); }
      else if (t < 0.66) { line('#fff8c0', o.big ? 4 : 2.5, [[ax + (right ? 22 : -22), ay - 6], [tx, ty - 8]]); line('#ffffff', 1, [[ax + (right ? 22 : -22), ay - 6], [tx, ty - 8]]); if (!G.settings.calm) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 240, 160); ctx.globalAlpha = 1; } }
      if (t > 0.55) { const h = cl((t - 0.55) / 0.45); ctx.globalAlpha = 1 - h; burst(tx, ty - 8, h, '#fff2a8'); if (o.text) say(o.text, tx, ty - 34 - h * 6, 1 - h); ctx.globalAlpha = 1; }
    } else if (kind === 'ground') {   // รอยแยกแผ่นดินวิ่งจากผู้ใช้ไปถึงศัตรู แล้วหินพุ่งขึ้น
      const gy0 = ay + 20, gy1 = ty + 18, k = cl(t / 0.55), pts = [];
      for (let i = 0; i <= 10; i++) { const q = (i / 10) * k; pts.push([ax + (tx - ax) * q + (i % 2 ? 3 : -3), gy0 + (gy1 - gy0) * q + (i % 2 ? -2 : 2)]); }
      line('#3a2a1a', 3, pts); line('#8a5a34', 1, pts);
      if (hit) for (let i = 0; i < 4; i++) em(prop, tx + (i - 1.5) * 9, ty + 16 - Math.sin(cl(hit * 2 - i * 0.2) * Math.PI) * 26, 10, i);
    } else if (kind === 'rocket') {   // จรวดพุ่งขึ้นฟ้าจากผู้ใช้ แล้วตกลงใส่ศัตรูระเบิดตูม
      if (t < 0.4) { const k = t / 0.4; em(prop, ax + (right ? 6 : -6), ay - k * 90, o.big ? 18 : 14, -0.8); for (let i = 0; i < 4; i++) dot(i % 2 ? '#f2a03a' : '#fff2a8', ax + (right ? 6 : -6) + Math.sin(i + now / 40) * 2, ay - k * 90 + 12 + i * 5, 2.5 - i * 0.4); }
      else if (t < 0.6) { const k = (t - 0.4) / 0.2; em(prop, tx, ty - 90 + k * 90, o.big ? 18 : 14, 2.4); }
      else { const h = (t - 0.6) / 0.4; ctx.globalAlpha = 1 - h; dot('#f2a03a', tx, ty, 6 + h * 26); dot('#fff2a8', tx, ty, 3 + h * 14); burst(tx, ty, h, '#f2a03a'); if (o.text) say(o.text, tx, ty - 34, 1 - h); ctx.globalAlpha = 1; }
    } else if (kind === 'dark') {
      ctx.globalAlpha = 0.75 * Math.sin(Math.min(1, t) * Math.PI); ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, 240, 160); ctx.globalAlpha = 1;
      em(prop, tx, ty - 26, 14, 0, false, 1 - t); say('ไฟดับ!', tx, ty - 40, Math.sin(t * Math.PI));
    }
    ctx.globalAlpha = 1;
    if (o.zzz && t > 0.45) for (let i = 0; i < 3; i++) say('z', tx + 10 + i * 6, ty - 14 - i * 7 - (t - 0.45) * 20, 1 - cl((t - 0.85) * 6));
    if (o.text && !sc && !['self', 'on', 'snipe', 'rocket', 'rush'].includes(kind) && t > 0.4) say(o.text, tx, ty - 28, 1 - cl((t - 0.85) * 6));
  }
  const SIG_NOTES = { '🎵': 1, '🎶': 1, '💕': 1, '🍃': 1 };
  function drawFx(ctx, now) {
    const f = V.fx; if (!f) return;
    const sig = SIG[f.id];
    const t = (now - f.t0) / ((G.settings.fast ? 0.5 : 1) * durOf(f.id));
    if (t >= 1) { V.fx = null; return; }
    const C = { p: [62, 92], f: [178, 44] }, [ax, ay] = C[f.side], [tx, ty] = C[f.side === 'p' ? 'f' : 'p'];
    const [c1, c2] = FXC[f.type] || FXC.normal, cl = (v) => Math.max(0, Math.min(1, v));
    const dot = (c, x, y, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
    const line = (c, w, pts) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    ctx.save();
    if (sig) drawSig(ctx, now, f, t, sig, { ax, ay, tx, ty, c1, c2, cl, dot, line });
    else if (f.cat === 'status') {
      for (let i = 0; i < 10; i++) {
        const a = i * 0.63 + t * 5, r = 16 + (i % 3) * 5, y = ay + 14 - cl(t * 1.2 - (i % 4) * 0.08) * 34;
        ctx.globalAlpha = 1 - t; dot(i % 2 ? c1 : c2, ax + Math.cos(a) * r, y, i % 3 ? 1.5 : 2.5);
      }
    } else if (f.type === 'water') {
      for (let i = 0; i < 7; i++) {
        const k = cl(t * 1.8 - i * 0.07); if (k <= 0 || k >= 1) continue;
        dot(c1, ax + (tx - ax) * k, ay + (ty - ay) * k - Math.sin(k * Math.PI) * 22, 4 - (i % 2)); dot(c2, ax + (tx - ax) * k - 1, ay + (ty - ay) * k - Math.sin(k * Math.PI) * 22 - 1, 1);
      }
      if (t > 0.5) {
        const s = (t - 0.5) * 2; ctx.globalAlpha = 1 - s;
        ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(tx, ty + 12, 8 + s * 22, 3 + s * 7, 0, 0, 7); ctx.stroke();
        for (let i = 0; i < 6; i++) dot(c1, tx + Math.cos(i) * s * 20, ty + 4 - Math.sin(s * Math.PI) * 14 + i, 2);
      }
    } else if (f.type === 'earth') {
      for (let i = 0; i < 5; i++) {
        const k = cl(t * 1.7 - i * 0.09); if (k <= 0 || k >= 1) continue;
        const x = ax + (tx - ax) * k + (i - 2) * 3, y = ay + 10 + (ty - ay) * k - Math.sin(k * Math.PI) * 26;
        ctx.fillStyle = i % 2 ? c1 : '#6b4a2f'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4 + (i % 2), 4);
      }
      if (t > 0.5) { const s = (t - 0.5) * 2; ctx.globalAlpha = 0.85 * (1 - s); for (let i = 0; i < 7; i++) dot(i % 2 ? c2 : c1, tx + (i - 3) * (4 + s * 6), ty + 14 - s * 8 - (i % 3) * 3, 4 + s * 6); }
    } else if (f.type === 'electric') {
      if (t < 0.35) for (let i = 0; i < 5; i++) dot(c1, ax + Math.cos(i * 1.3 + t * 30) * 14, ay + Math.sin(i * 1.3 + t * 30) * 14, 1.5);
      else {
        const flick = Math.floor(now / 45) % 2;
        const pts = [[tx + 6, ty - 48]]; for (let i = 1; i <= 6; i++) pts.push([tx + (i % 2 ? -7 : 6) + (flick ? 2 : -2), ty - 48 + i * 9]);
        line(c2, 4, pts); line('#ffffff', 1.5, pts);
        if (!G.settings.calm && t < 0.5) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff8c0'; ctx.fillRect(0, 0, 240, 160); }
        ctx.globalAlpha = 1; for (let i = 0; i < 6; i++) dot(c1, tx + Math.cos(i + now / 60) * 16, ty + Math.sin(i + now / 60) * 12, 1.5);
      }
    } else if (f.type === 'wind') {
      for (let i = 0; i < 3; i++) { const k = cl(t * 2 - i * 0.12); if (k > 0 && k < 1) line(c1, 1.5, [[ax + (tx - ax) * k - 10, ay + (ty - ay) * k + i * 5 - 5], [ax + (tx - ax) * k + 6, ay + (ty - ay) * k + i * 5 - 7]]); }
      if (t > 0.35) {
        const s = (t - 0.35) / 0.65; ctx.globalAlpha = 1 - s * 0.6;
        for (let r = 0; r < 3; r++) { ctx.strokeStyle = r % 2 ? c2 : c1; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tx, ty + 8 - r * 8, 12 + r * 4, 4, 0, s * 9 + r, s * 9 + r + 4); ctx.stroke(); }
        for (let i = 0; i < 4; i++) { const a = s * 10 + i * 1.6; ctx.fillStyle = c2; ctx.fillRect(Math.round(tx + Math.cos(a) * 18), Math.round(ty + 4 + Math.sin(a) * 6 - i * 4), 3, 2); }
      }
    } else {
      if (t > 0.4) {
        const s = (t - 0.4) / 0.6; ctx.globalAlpha = 1 - s * 0.7;
        for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; line(i % 2 ? c2 : c1, 3, [[tx + Math.cos(a) * (4 + s * 8), ty + Math.sin(a) * (4 + s * 8)], [tx + Math.cos(a) * (10 + s * 16), ty + Math.sin(a) * (10 + s * 16)]]); }
        dot(c1, tx, ty, 5 * (1 - s) + 1);
      }
    }
    ctx.restore();
  }
  G.battleTurn = () => (V.active && V.b ? V.b.turn : 0);
  G.battleFx = (side, type, cat, ago = 0, id) => { V.fx = { side, type, cat, id, t0: performance.now() - ago }; startAct(side, type, cat, id, ago); };
  // ---------- ท่าทางตัวละคร: ผู้ใช้ท่าขยับตามท่า (พุ่ง กระโดด หมุน ขว้าง ร่าย ตะโกน หายตัว เล็ง ฟัน) ฝ่ายโดนตีถูกกระแทกถอย ----------
  function startAct(side, type, cat, id, ago) {
    const dur = (G.settings.fast ? 0.5 : 1) * durOf(id);
    V.act = { side, type, m: G.motionFor(id, cat), t0: performance.now() - (ago || 0), dur };
  }
  const ease = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  function pose(side, now) {
    const P = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1, ghost: false, aura: null };
    const breathe = Math.sin(now / 380 + (side === 'p' ? 0 : 1.7));
    P.sy = 1 + breathe * 0.025; P.sx = 1 - breathe * 0.012;   // หายใจขยับตัวเบาๆ ตลอด
    const a = V.act;
    if (a && a.side === side) {
      const t = (now - a.t0) / a.dur;
      if (t >= 1) V.act = null;
      else {
        const [vx, vy] = side === 'p' ? [116, -46] : [-116, 46], S = Math.sin, PI = Math.PI;
        const go = (k) => { P.dx = vx * k; P.dy = vy * k; };
        switch (a.m) {
          case 'rush': case 'dashx': case 'bump': case 'spinrush': {
            const out = a.m === 'dashx' ? 0.25 : 0.42, k = t < out ? ease(t / out) : t < out + 0.18 ? 1 : 1 - ease((t - out - 0.18) / (1 - out - 0.18));
            go(k * 0.78); P.ghost = a.m !== 'bump';
            if (t > out && t < out + 0.14) { P.sx *= a.m === 'bump' ? 1.4 : 1.18; P.sy *= a.m === 'bump' ? 0.78 : 0.86; }
            if (a.m === 'bump' && t > out + 0.14 && t < out + 0.4) P.dy -= S(((t - out - 0.14) / 0.26) * PI) * 12;   // พุงเด้งกลับ
            if (a.m === 'spinrush') P.rot = ease(Math.min(1, t / 0.75)) * PI * 6 * (side === 'p' ? 1 : -1);
            if (a.m === 'dashx' && (t < 0.05 || (t > out - 0.03 && t < out + 0.03))) P.alpha = 0.5;
            break; }
          case 'ride': {   // กระโดดขึ้นหลังควาย ควบไปชน แล้วควบกลับ
            const mount = t < 0.1 ? ease(t / 0.1) : t > 0.9 ? 1 - ease((t - 0.9) / 0.1) : 1;
            const k = t < 0.1 ? 0 : t < 0.5 ? ease((t - 0.1) / 0.4) : t < 0.64 ? 1 : 1 - ease((t - 0.64) / 0.26);
            const run = t > 0.1 && t < 0.9 && !(t > 0.5 && t < 0.64), bob = run ? -Math.abs(S(t * PI * 12)) * 3 : 0;
            go(k * 0.72); P.dy += -18 * mount + bob;
            P.rot = (t > 0.1 && t < 0.5 ? 0.1 : t > 0.5 && t < 0.6 ? -0.12 : 0) * (side === 'p' ? 1 : -1);
            if (t > 0.5 && t < 0.6) { P.sx *= 1.1; P.sy *= 0.9; }
            P.mount = { a: mount, lift: 18 * mount, run, back: t > 0.64 };
            break; }
          case 'leap': {   // กระโดดโค้งไปลงทับศัตรู แล้วกระโดดกลับ
            if (t < 0.5) { const k = ease(t / 0.5); go(k * 0.8); P.dy -= S(k * PI) * 42; if (t < 0.08) { P.sx *= 1.12; P.sy *= 0.88; } }
            else if (t < 0.68) { go(0.8); if (t < 0.6) { P.sx *= 1.25; P.sy *= 0.76; } }
            else { const k = ease((t - 0.68) / 0.32); go(0.8 * (1 - k)); P.dy -= S(k * PI) * 18; }
            break; }
          case 'hop': {   // กระโดดขาเดียวสามจังหวะไปหาศัตรู
            if (t < 0.55) { const k = t / 0.55; go(k * 0.7); P.dy -= Math.abs(S(k * PI * 3)) * 14; P.rot = 0.12 * (side === 'p' ? 1 : -1); }
            else if (t < 0.65) { go(0.7); P.sx *= 1.15; P.sy *= 0.85; }
            else go(0.7 * (1 - ease((t - 0.65) / 0.35)));
            break; }
          case 'kick': {   // เอนตัวง้าง แล้วเตะเสยไปข้างหน้า
            const sd = side === 'p' ? 1 : -1;
            if (t < 0.25) P.rot = -0.3 * sd * (t / 0.25);
            else if (t < 0.45) { const k = (t - 0.25) / 0.2; P.rot = sd * (-0.3 + 0.75 * k); go(0.1 * k); }
            else { const k = ease((t - 0.45) / 0.55); P.rot = 0.45 * sd * (1 - k); go(0.1 * (1 - k)); }
            break; }
          case 'eat': P.dy = S(t * PI * 10) * 1.5; P.sy *= 1 - 0.05 * Math.abs(S(t * PI * 10)); P.sx *= 1 + 0.03 * Math.abs(S(t * PI * 10)); break;   // เคี้ยว/กอดแน่น
          case 'fan': P.rot = S(t * PI * 9) * 0.16 * (1 - t); P.dy = -Math.abs(S(t * PI * 9)) * 2; break;   // โบกกระด้ง สะบัดหาง ชักว่าว
          case 'talk': P.dx = S(t * PI * 3) * 2; P.sy *= 1 + 0.03 * S(t * PI * 14); P.rot = S(t * PI * 2) * 0.05; break;   // ยืนบรรยายหน้ากระดาน
          case 'hammer': { const ph = (t * 5.5) % 1; if (t < 0.62) { P.dy = -S(ph * PI) * 5; P.rot = (0.15 - ph * 0.3) * (side === 'p' ? 1 : -1); } else { P.sy *= 1.05; P.dy = -2; } break; }   // ตอกหลัก แล้วยืดตัวยืนหยัด
          case 'inface': {   // เดินเข้าไปว้ากใกล้หน้า ตัวสั่น แล้วถอยกลับ
            const k = t < 0.25 ? ease(t / 0.25) : t < 0.75 ? 1 : 1 - ease((t - 0.75) / 0.25); go(0.55 * k);
            if (t > 0.25 && t < 0.75) { P.dx += S(now / 18) * 2.5; P.sx *= 1.08; P.sy *= 1.08; }
            break; }
          case 'jump': case 'stomp': {
            const up = a.m === 'stomp' ? 44 : 34, k = Math.min(1, t / 0.7);
            P.dy = -S(k * PI) * up; P.dx = vx * 0.1 * S(k * PI);
            if (t > 0.68 && t < 0.86) { P.sx *= 1.22; P.sy *= 0.8; }
            if (t < 0.12) { P.sx *= 1.12; P.sy *= 0.88; }
            break; }
          case 'spin': P.rot = ease(t) * PI * 4 * (side === 'p' ? 1 : -1); P.dy = -S(t * PI) * 10; break;
          case 'throw':
            if (t < 0.3) { const k = t / 0.3; go(-0.05 * k); P.rot = -0.25 * k; }
            else if (t < 0.5) { const k = (t - 0.3) / 0.2; go(-0.05 + 0.13 * k); P.rot = -0.25 + 0.45 * k; }
            else { const k = ease((t - 0.5) / 0.5); go(0.08 * (1 - k)); P.rot = 0.2 * (1 - k); }
            break;
          case 'cast': P.dy = -S(t * PI) * 7; P.aura = a.type; break;
          case 'recoil': P.aura = a.type; if (t < 0.4) P.dy = -S((t / 0.4) * PI / 2) * 5; else { const k = (t - 0.4) / 0.6; go(-0.07 * S(Math.min(1, k * 2) * PI / 2) * (1 - k)); P.dy = -5 * (1 - k); } break;
          case 'shout': if (t < 0.85) P.dx = S(now / 22) * 2.5; P.sx *= 1 + 0.1 * S(t * PI); P.sy *= 1 + 0.1 * S(t * PI); break;
          case 'bounce': P.dy = -Math.abs(S(t * PI * 3)) * 11 * (1 - t * 0.4); if (Math.abs(S(t * PI * 3)) < 0.15) { P.sx *= 1.12; P.sy *= 0.9; } P.aura = a.type; break;
          case 'slash': { const k = t < 0.35 ? ease(t / 0.35) : t < 0.55 ? 1 : 1 - ease((t - 0.55) / 0.45); go(0.36 * k); P.rot = (t < 0.45 ? -0.3 : 0.45) * k * (side === 'p' ? 1 : -1); P.ghost = t < 0.5; break; }
          case 'vanish': P.alpha = 1 - S(t * PI) * 0.92; P.dy = -S(t * PI) * 4; break;
          case 'aim':
            if (t < 0.55) { go(-0.02 * ease(t / 0.2)); P.sy *= 0.93; P.sx *= 1.04; }
            else { const k = (t - 0.55) / 0.45; go(-0.02 - 0.07 * S(Math.min(1, k * 3) * PI / 2) * (1 - k)); P.rot = -0.18 * (1 - k) * (side === 'p' ? 1 : -1); }
            break;
          default: { const k = S(Math.min(1, t / 0.5) * PI); go(0.09 * k); }   // lunge
        }
      }
    }
    const kn = V.knock;
    if (kn && kn.side === side) {
      const tk = (now - kn.t0) / (G.settings.fast ? 160 : 280);
      if (tk >= 1) V.knock = null;
      else { const [vx, vy] = side === 'p' ? [116, -46] : [-116, 46], k = Math.sin(tk * Math.PI) * (G.settings.calm ? 0.03 : 0.07); P.dx -= vx * k; P.dy -= vy * k; P.sx *= 1 + 0.12 * Math.sin(tk * Math.PI); P.sy *= 1 - 0.1 * Math.sin(tk * Math.PI); P.rot += (side === 'p' ? -0.15 : 0.15) * Math.sin(tk * Math.PI); }
    }
    return P;
  }   // เล่นเอฟเฟกต์ท่า (ใช้ในฉากเนื้อเรื่องได้)
  G.drawBattle = function (ctx) {
    if (!V.active) return;
    const night = G.isNight();
    drawBackdrop(ctx, V.bg, night);
    const tn = !(G.world.def && G.world.def.indoor) && G.tint();   // แสงเช้า/เย็นบนฉากหลัง
    if (tn) { ctx.fillStyle = tn; ctx.fillRect(0, 0, 240, 160); }
    const plat = (x, y, w) => { ctx.fillStyle = 'rgba(70,45,25,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, w, w / 4, 0, 0, 7); ctx.fill(); };
    plat(178, 64, 34); plat(62, 112, 38);
    const now = performance.now();
    const calm = G.settings.calm;   // ลดการสั่นจอ/แฟลช
    const shakeX = (side) => (V.shake && V.shake.side === side ? Math.sin((V.shake.t += 1) * 1.6) * (V.shake.t < 14 ? (calm ? 1 : 3) : 0) : 0);

    // หมดแรง: คนนั่งทรุดหอบแฮ่กๆ (ไม่มีภาพบาดเจ็บ) ผี/สัตว์ค่อยๆ จางหายเป็นควัน
    const draw = (id, x, y, flip, faint, side) => {
      if (!id) return;
      const sit = faint ? G.sitSprite(id) : null;
      if (faint >= 1 && !sit) return;
      const P = faint ? { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1 } : pose(side, now);
      const moving = P.dx || P.dy || P.rot;
      // ภาพติดตาตอนพุ่ง/ฟัน และออร่าตอนร่ายพลัง
      if (P.ghost && V.act) for (let i = 3; i >= 1; i--) {
        const g = pose.call(null, side, now - i * 45); ctx.save(); ctx.globalAlpha = 0.16 * (4 - i);
        if (flip) { ctx.translate(x + 48 + g.dx, y + g.dy); ctx.scale(-3, 3); } else { ctx.translate(x + g.dx, y + g.dy); ctx.scale(3, 3); }
        ctx.drawImage(G.sprite(id), 0, 0); ctx.restore();
      }
      if (P.mount) {   // ควายใต้ตัวผู้ขี่ + ฝุ่นตลบตามหลัง
        const M = P.mount, fwd = side === 'p', bx = x + 24 + P.dx - (1 - M.a) * (fwd ? 22 : -22), by = y + 40 + P.dy + M.lift;
        ctx.save(); ctx.globalAlpha = M.a;
        if (M.run) for (let i = 1; i < 5; i++) { ctx.fillStyle = `rgba(216,180,122,${0.7 - i * 0.12})`; ctx.beginPath(); ctx.arc(bx + (fwd ? -1 : 1) * (14 + i * 8), by + 14 - ((now / 40 + i * 3) % 6), 5 - i * 0.6, 0, 7); ctx.fill(); }
        ctx.translate(Math.round(bx), Math.round(by)); if (fwd !== M.back) ctx.scale(-1, 1);
        ctx.imageSmoothingEnabled = true; ctx.fillStyle = '#000'; ctx.font = EMOJI(44); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐃', 0, 0); ctx.restore();
      }
      if (P.aura) { const [ca] = FXC[P.aura] || FXC.normal; ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(now / 60); ctx.fillStyle = ca; ctx.beginPath(); ctx.ellipse(x + 24 + P.dx, y + 30 + P.dy, 26, 30, 0, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.save();
      if (!moving) { ctx.beginPath(); ctx.rect(x - 4, y - 10, 60, 58); ctx.clip(); }
      const pant = sit && faint > 0.5 ? Math.floor(now / 260) % 2 : 0;
      ctx.globalAlpha = P.alpha;
      if (flip) { ctx.translate(x + 48 + P.dx + shakeX(side), y + pant + P.dy); ctx.scale(-3, 3); }
      else { ctx.translate(x + P.dx + shakeX(side), y + pant + P.dy); ctx.scale(3, 3); }
      ctx.translate(8, 16); ctx.rotate(P.rot); ctx.scale(P.sx, P.sy); ctx.translate(-8, -16);
      if (side === 'f' && V.wobble) { const a = Math.sin(now / 90) * 0.15; ctx.translate(8, 16); ctx.rotate(a); ctx.translate(-8, -16); }
      if (sit) {
        if (faint < 0.5) { ctx.globalAlpha = 1; ctx.drawImage(G.sprite(id), 0, faint * 6); }   // ทรุดลง
        else {
          ctx.drawImage(sit, 0, 0);
          ctx.fillStyle = '#9fd8f0';   // เหงื่อตก
          const d = (now / 40) % 12;
          ctx.fillRect(12, 2 + d * 0.5, 1, 2); if (d > 6) ctx.fillRect(3, 4 + (d - 6) * 0.6, 1, 1);
          ctx.fillStyle = 'rgba(255,255,255,0.7)';   // ไอหอบ
          if (pant) { ctx.fillRect(13, 8, 1, 1); ctx.fillRect(14, 7, 1, 1); }
        }
      } else if (faint) {
        ctx.globalAlpha = Math.max(0, 1 - faint);
        ctx.drawImage(G.sprite(id), 0, -faint * 4);
        ctx.globalAlpha = Math.max(0, 0.6 - faint * 0.6); ctx.fillStyle = '#f4f4ec';
        for (let i = 0; i < 4; i++) ctx.fillRect(3 + i * 3, 12 - faint * (10 + i * 3), 2, 2);
      } else ctx.drawImage(G.sprite(id), 0, 0);
      ctx.restore();
    };
    if (G.raining() && !['indoor', 'kku_shop', 'ramen'].includes(V.bg) && G.drawRain) G.drawRain(ctx, now);
    for (const s of ['p', 'f']) if (V.faint && V.faint[s] > 0 && V.faint[s] < 1) V.faint[s] = Math.min(1, V.faint[s] + 0.06);
    draw(V.fSprite, 154, 20, false, V.faint ? V.faint.f : 0, 'f');
    if (V.sparkle && now - V.sparkle < 2200) {   // ผีสีพิเศษ: ประกายดาววิบวับรอบตัว
      const t = (now - V.sparkle) / 2200;
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 5, r = 18 + t * 14, x = 178 + Math.cos(a) * r, y = 44 + Math.sin(a) * r * 0.8, s = 1 + Math.abs(Math.sin(t * 20 + i)) * 2;
        ctx.fillStyle = `rgba(255,248,200,${1 - t})`; ctx.fillRect(x - s, y, s * 2 + 1, 1); ctx.fillRect(x, y - s, 1, s * 2 + 1); }
    }
    draw(V.pSprite, 38, 66, true, V.faint ? V.faint.p : 0, 'p');
    drawFx(ctx, now);
    if (V.cutin) {   // ท่าไม้ตาย: แถบดำพาดจอ ชื่อท่าสีทองวิ่งเข้า
      const t = (now - V.cutin.t0) / 1100;
      if (t >= 1) V.cutin = null;
      else {
        const a2 = Math.min(1, t * 6) * (1 - Math.max(0, (t - 0.8) * 5)), x = 120 + (1 - Math.min(1, t * 3)) * (V.cutin.side === 'p' ? -160 : 160);
        ctx.save(); ctx.globalAlpha = a2 * 0.85; ctx.fillStyle = '#0c0d18'; ctx.fillRect(0, 38, 240, 30);
        ctx.fillStyle = '#f2d24b'; ctx.fillRect(0, 38, 240, 2); ctx.fillRect(0, 66, 240, 2);
        ctx.globalAlpha = a2; ctx.font = 'bold 15px Itim, Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = '#3a1a00'; ctx.strokeText('★ ' + V.cutin.text + ' ★', x, 56); ctx.fillStyle = '#fff2a8'; ctx.fillText('★ ' + V.cutin.text + ' ★', x, 56);
        ctx.font = '8px Itim, Tahoma, sans-serif'; ctx.fillStyle = '#f2d24b'; ctx.fillText('ท่าไม้ตาย!', x, 44); ctx.restore();
      }
    }
    if (V.critFlash > 0) { ctx.fillStyle = `rgba(255,240,180,${V.critFlash / (calm ? 40 : 14)})`; ctx.fillRect(0, 0, 240, 160); V.critFlash--; }
    if (V.wobble) { ctx.fillStyle = '#f4f4ec'; for (let i = 0; i < 3; i++) { const a = now / 300 + i * 2.1; ctx.fillRect(178 + Math.cos(a) * 26, 40 + Math.sin(a) * 10, 3, 3); } }
  };
})(window.G = window.G || {});
