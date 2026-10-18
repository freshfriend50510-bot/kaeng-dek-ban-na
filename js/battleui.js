// หน้าจอต่อสู้: วาดฉากบน canvas + แผงข้อมูล/เมนูเป็น HTML แล้วเล่นเหตุการณ์จาก G.Battle ทีละอัน
(function (G) {
  'use strict';
  const wait = (ms) => new Promise((r) => setTimeout(r, G.settings.fast ? ms / 2 : ms));   // ต่อสู้เร็ว ×2
  const V = (G.battleView = { active: false });

  function panelsHTML(b) {
    const f = b.foe, m = b.me, fsp = G.DATA.species[f.sp], msp = G.DATA.species[m.sp];
    const expPct = Math.min(100, ((m.exp - G.expFor(m.lv)) / (G.expFor(m.lv + 1) - G.expFor(m.lv))) * 100);
    return `
      <div class="panel bpanel foe-panel"><div class="bname">${f.name} ${G.ui.typeTag(fsp.type)} <span class="lv">Lv${f.lv}</span></div>
        ${G.ui.hpBar(V.fhp, f.stats.hp)}${G.ui.statusTag(f.status)}${b.isWild() && G.state.dex[f.sp] === 2 ? '<span class="tag got">เคยชวนแล้ว</span>' : ''}</div>
      <div class="panel bpanel me-panel"><div class="bname">${m.name} ${G.ui.typeTag(msp.type)} <span class="lv">Lv${m.lv}</span></div>
        ${G.ui.hpBar(V.php, m.stats.hp)}<div class="hpnum">${Math.max(0, Math.round(V.php))}/${m.stats.hp} ${G.ui.statusTag(m.status)}</div>
        <div class="expbar"><i style="width:${expPct}%"></i></div></div>`;
  }
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
        case 'anim': V.lunge = { side: e.side, t: 0 }; G.sfx(e.cat === 'status' ? 'status' : 'attack'); await wait(220); break;
        case 'hit': V.shake = { side: e.side, t: 0 }; G.sfx(e.eff > 1 ? 'super' : 'hit'); await wait(200); break;
        case 'crit': V.critFlash = 10; V.shake = { side: e.side, t: 0 }; G.sfx('super'); await wait(160); break;
        case 'hp': await tweenHp(b, e.side, e.hp); break;
        case 'status': render(b); break;
        case 'faint': V.faint[e.side] = 0.001; G.sfx('faint'); await wait(450); break;
        case 'send':
          if (e.side === 'f') { V.fhp = b.foe.hp; V.faint.f = 0; V.fSprite = G.monLook(b.foe); G.markSeen(b.foe.sp); }
          else { V.php = b.me.hp; V.faint.p = 0; V.pSprite = G.monLook(b.me); }
          render(b); G.sfx('send'); await wait(250);
          if (e.side === 'p' && V.onSend) await V.onSend(b);
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
    await G.ui.say(`${mon.name} อยากเรียนท่า ${mv.name} แต่จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, { battle: true, auto: 1 });
    const opts = mon.moves.map((s) => G.DATA.moves[s.id].name).concat([`ไม่เรียน ${mv.name}`]);
    const i = await G.ui.choose(opts, { cancel: false, cls: 'small' });
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
        if (m.moves.every((s) => s.pp <= 0)) return { type: 'move', idx: 0 };
        const i = await G.ui.choose(m.moves.map((s) => { const mv = G.DATA.moves[s.id];
          const e = mv.cat === 'status' ? 1 : G.typeEff(mv.type, G.DATA.species[b.foe.sp].type);   // บอกผลธาตุก่อนกดใช้
          return { icon: `type:${mv.type}`, label: mv.name + (e > 1 ? ' ▲×2' : e < 1 ? ' ▼×½' : ''), sub: `${G.TYPE_TH[mv.type]} ${s.pp}/${mv.pp}`, disabled: s.pp <= 0 }; }),
          { grid: true, cls: 'bmoves', info: (k) => { const s = m.moves[k]; if (!s) return ''; const mv = G.DATA.moves[s.id];
            const eff = mv.cat === 'status' ? '' : ` · ต่อ${b.foe.name}: ${{ 2: 'ได้ผลดีมาก', 1: 'ปกติ', 0.5: 'ไม่ค่อยได้ผล' }[G.typeEff(mv.type, G.DATA.species[b.foe.sp].type)]}`;
            return `${mv.desc}${mv.power ? ' · พลัง ' + mv.power : ''}${eff}`; } });
        if (i >= 0) return { type: 'move', idx: i };
      } else if (top === 1) {
        const id = await G.ui.bagMenu({ inBattle: true, filter: (it) => ['heal', 'cure', 'recruit', 'healall'].includes(it.kind) });
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
    Object.assign(V, { active: true, b, php: b.me.hp, fhp: b.foe.hp, faint: { p: 0, f: 0 }, shake: null, lunge: null, wobble: 0,
      pSprite: null, fSprite: opt.kind === 'wild' ? G.monLook(b.foe) : (opt.trainerLook || G.monLook(b.foe)),
      intro: 0, bg: opt.bg || G.world.def.bg || G.state.map, onSend: opt.onSend });
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
    V.pSprite = G.monLook(b.me); render(b); G.sfx('send');
    await G.ui.say(`ไปเลย ${b.me.name}!`, null, { battle: true, auto: 500 });
    if (V.onSend) await V.onSend(b);
    if (b.rageDone && opt.rage && opt.rage.text) await G.ui.say(opt.rage.text, null, { battle: true, auto: 900 });
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
    if (result === 'win' && opt.kind !== 'wild' && opt.money) {
      S.money += opt.money;
      await G.ui.say(`ได้เงินรางวัล ${opt.money} บาท`, null, { battle: true, auto: 700 });
    }
    if (result === 'recruit') {
      const m = b.foe; m.status = null;
      G.state.dex[m.sp] = 2;
      if (S.party.length < 6) { S.party.push(m); await G.ui.say(`${m.name} เข้าแก๊งแล้ว!`, null, { battle: true }); }
      else { S.storage.push(m); await G.ui.say(`ทีมเต็มแล้ว ${m.name} ไปรออยู่ในคลังแก๊ง (เถียงนาตาสี/คอมหอพัก)`, null, { battle: true }); }
    }
    S.party.forEach((m) => { delete m._fainted; });
    V.layer.remove(); V.active = false;
    G.scene = 'world';
    G.music(G.world.def.music);
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
      if (bg === 'ramen') { R('#2b3f8a', 0, 0, 240, 22); for (let x = 10; x < 240; x += 40) R('#f4f4ec', x, 6, 8, 8); R('#c5482b', 100, 30, 40, 26); }
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, 90);
    if (bg === 'market') { sky.addColorStop(0, night ? '#2a2f5a' : '#e8b07a'); sky.addColorStop(1, night ? '#4a3a5a' : '#f2d2a0'); }
    else { sky.addColorStop(0, night ? '#1d2650' : '#8fc3d6'); sky.addColorStop(1, night ? '#3d3a6a' : '#e8e2c0'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 240, 160);
    if (bg === 'phong') {   // ลำน้ำพองกับสะพาน
      R(night ? '#2a3a6a' : '#4f8fb0', 0, 56, 240, 16); R(night ? '#3a4a7a' : '#7cb6cf', 30, 60, 30, 2); R(night ? '#3a4a7a' : '#7cb6cf', 150, 64, 40, 2);
      R(night ? '#3a2f28' : '#8a6440', 0, 46, 240, 3); for (let x = 6; x < 240; x += 24) R(night ? '#3a2f28' : '#6b4a2f', x, 46, 3, 12);
    }
    if (bg === 'amphoe') {   // ตึกแถวกับหอนาฬิกา
      for (let x = 0; x < 240; x += 40) { R(night ? '#3a3f58' : '#d8c9a8', x + 2, 34, 36, 36); R(night ? '#2a2f48' : '#9a3a2a', x, 30, 40, 5); R(night && x % 80 ? '#f2d27a' : '#5a7a9a', x + 10, 44, 8, 8); R(night ? '#f2d27a' : '#5a7a9a', x + 24, 44, 8, 8); }
      R(night ? '#4a4f68' : '#e6dcc8', 110, 10, 20, 60); R(night ? '#5a3a3a' : '#a63a2a', 106, 4, 28, 8); ctx.fillStyle = '#f4f4ec'; ctx.beginPath(); ctx.arc(120, 24, 6, 0, 7); ctx.fill(); R('#2a2a2a', 120, 19, 1, 5); R('#2a2a2a', 120, 24, 4, 1);
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
    const lungeX = (side) => (V.lunge && V.lunge.side === side ? Math.sin(Math.min(Math.PI, (V.lunge.t += 0.25))) * 8 * (side === 'p' ? 1 : -1) : 0);
    // หมดแรง: คนนั่งทรุดหอบแฮ่กๆ (ไม่มีภาพบาดเจ็บ) ผี/สัตว์ค่อยๆ จางหายเป็นควัน
    const draw = (id, x, y, flip, faint, side) => {
      if (!id) return;
      const sit = faint ? G.sitSprite(id) : null;
      if (faint >= 1 && !sit) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 4, y - 10, 60, 58); ctx.clip();
      const pant = sit && faint > 0.5 ? Math.floor(now / 260) % 2 : 0;
      if (flip) { ctx.translate(x + 48 + lungeX(side) + shakeX(side), y + pant); ctx.scale(-3, 3); }
      else { ctx.translate(x + lungeX(side) + shakeX(side), y + pant); ctx.scale(3, 3); }
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
    draw(V.pSprite, 38, 66, true, V.faint ? V.faint.p : 0, 'p');
    if (V.critFlash > 0) { ctx.fillStyle = `rgba(255,240,180,${V.critFlash / (calm ? 40 : 14)})`; ctx.fillRect(0, 0, 240, 160); V.critFlash--; }
    if (V.wobble) { ctx.fillStyle = '#f4f4ec'; for (let i = 0; i < 3; i++) { const a = now / 300 + i * 2.1; ctx.fillRect(178 + Math.cos(a) * 26, 40 + Math.sin(a) * 10, 3, 3); } }
  };
})(window.G = window.G || {});
