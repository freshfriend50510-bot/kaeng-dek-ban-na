// หน้าจอต่อสู้: วาดฉากบน canvas + แผงข้อมูล/เมนูเป็น HTML แล้วเล่นเหตุการณ์จาก G.Battle ทีละอัน
(function (G) {
  'use strict';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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

  async function play(b, events) {
    for (const e of events) {
      switch (e.t) {
        case 'msg': await G.ui.say(e.text, null, { battle: true, auto: 650 }); break;
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
        case 'level': if (b.P[e.idx] === b.me) { V.php = b.me.hp; V.pSprite = G.monLook(b.me); render(b); } G.sfx('level'); break;
        case 'learn': await learnMove(b.P[e.idx], e.move); break;
        case 'recruit_try': V.wobble = 0.001; G.sfx('wobble'); await wait(1300); V.wobble = 0; break;
      }
    }
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
          return { label: mv.name, sub: `${G.TYPE_TH[mv.type]} ${s.pp}/${mv.pp}`, disabled: s.pp <= 0 }; }),
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
    if (opt.kind === 'wild' && fsp.kind === 'eng') await G.ui.say(`${b.foe.name} (${fsp.name.replace('น้อง', '')}) เดินออกมาจากพงหญ้า ขอท้าสู้!`, null, { battle: true, auto: 800 });
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
    const indoor = { ramen: ['#4a3028', '#6b4a34', '#b8875a', '#a07448'], kku_shop: ['#2a2e35', '#3a3f48', '#7d8794', '#6b7480'] }[bg]
      || (G.world.def && G.world.def.indoor ? ['#d8c9a8', '#e8dcc0', '#b8875a', '#a07448'] : null);
    if (indoor) {   // ฉากในตึก: ผนัง + พื้น
      R(indoor[0], 0, 0, 240, 74); R(indoor[1], 0, 60, 240, 14); R(indoor[2], 0, 74, 240, 86);
      for (let y = 80; y < 160; y += 10) R(indoor[3], 0, y, 240, 1);
      if (bg === 'kku_shop') { R('#f2d24b', 0, 70, 240, 3); for (let x = 0; x < 240; x += 12) R('#2a2a2a', x, 70, 6, 3); R('#5f6873', 20, 20, 40, 40); R('#5f6873', 180, 24, 36, 36); R('#9aa3ae', 30, 30, 20, 4); }
      if (bg === 'ramen') { R('#2b3f8a', 0, 0, 240, 22); for (let x = 10; x < 240; x += 40) R('#f4f4ec', x, 6, 8, 8); R('#c5482b', 100, 30, 40, 26); }
      return;
    }
    const sky = ctx.createLinearGradient(0, 0, 0, 90);
    if (bg === 'market') { sky.addColorStop(0, night ? '#2a2f5a' : '#e8b07a'); sky.addColorStop(1, night ? '#4a3a5a' : '#f2d2a0'); }
    else { sky.addColorStop(0, night ? '#1d2650' : '#8fc3d6'); sky.addColorStop(1, night ? '#3d3a6a' : '#e8e2c0'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 240, 160);
    if (bg === 'kku') {   // ตึกคณะกับโรงช็อปเป็นฉากหลัง
      R(night ? '#3a3f58' : '#c9c0b0', 6, 30, 70, 40); R(night ? '#2a2f48' : '#8f949e', 6, 26, 70, 5);
      for (let x = 12; x < 72; x += 12) for (let y = 36; y < 66; y += 12) R(night && (x + y) % 3 ? '#f2d27a' : '#5a7a9a', x, y, 7, 7);
      R(night ? '#2f3448' : '#7d8794', 160, 38, 76, 32); for (let x = 160; x < 236; x += 12) { ctx.fillStyle = night ? '#252a3c' : '#9aa3ae'; ctx.beginPath(); ctx.moveTo(x, 38); ctx.lineTo(x + 12, 30); ctx.lineTo(x + 12, 38); ctx.fill(); }
    }
    ctx.fillStyle = night ? '#2f4a32' : '#6e9b3a'; ctx.fillRect(0, 70, 240, 90);
    ctx.fillStyle = night ? '#3a5a3a' : '#87b04a';
    for (let i = 0; i < 240; i += 6) ctx.fillRect(i, 70 + ((i * 7) % 5), 2, 6);
    if (bg !== 'market' && bg !== 'kku') { ctx.fillStyle = night ? '#24402a' : '#3f6b34'; for (const [x, r] of [[20, 10], [50, 7], [200, 9], [225, 6]]) { ctx.beginPath(); ctx.arc(x, 68, r, Math.PI, 0); ctx.fill(); } }
  }
  G.drawBattle = function (ctx) {
    if (!V.active) return;
    const night = G.isNight();
    drawBackdrop(ctx, V.bg, night);
    const plat = (x, y, w) => { ctx.fillStyle = 'rgba(70,45,25,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, w, w / 4, 0, 0, 7); ctx.fill(); };
    plat(178, 64, 34); plat(62, 112, 38);
    const now = performance.now();
    const shakeX = (side) => (V.shake && V.shake.side === side ? Math.sin((V.shake.t += 1) * 1.6) * (V.shake.t < 14 ? 3 : 0) : 0);
    const lungeX = (side) => (V.lunge && V.lunge.side === side ? Math.sin(Math.min(Math.PI, (V.lunge.t += 0.25))) * 8 * (side === 'p' ? 1 : -1) : 0);
    const draw = (id, x, y, flip, faint, side) => {
      if (!id) return;
      if (faint >= 1) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 4, y - 10, 60, 58); ctx.clip();
      const dy = faint ? faint * 48 : 0;
      if (flip) { ctx.translate(x + 48 + lungeX(side) + shakeX(side), y + dy); ctx.scale(-3, 3); }
      else { ctx.translate(x + lungeX(side) + shakeX(side), y + dy); ctx.scale(3, 3); }
      if (side === 'f' && V.wobble) { const a = Math.sin(now / 90) * 0.15; ctx.translate(8, 16); ctx.rotate(a); ctx.translate(-8, -16); }
      ctx.drawImage(G.sprite(id), 0, 0);
      ctx.restore();
    };
    for (const s of ['p', 'f']) if (V.faint && V.faint[s] > 0 && V.faint[s] < 1) V.faint[s] = Math.min(1, V.faint[s] + 0.06);
    draw(V.fSprite, 154, 20, false, V.faint ? V.faint.f : 0, 'f');
    draw(V.pSprite, 38, 66, true, V.faint ? V.faint.p : 0, 'p');
    if (V.critFlash > 0) { ctx.fillStyle = `rgba(255,240,180,${V.critFlash / 14})`; ctx.fillRect(0, 0, 240, 160); V.critFlash--; }
    if (V.wobble) { ctx.fillStyle = '#f4f4ec'; for (let i = 0; i < 3; i++) { const a = now / 300 + i * 2.1; ctx.fillRect(178 + Math.cos(a) * 26, 40 + Math.sin(a) * 10, 3, 3); } }
  };
})(window.G = window.G || {});
