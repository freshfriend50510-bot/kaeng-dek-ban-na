// กล่องข้อความ ตัวเลือก และเมนูทั้งหมด (HTML ซ้อนบน canvas)
(function (G) {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const stack = [];   // หน้าต่างที่เปิดอยู่ ตัวบนสุดรับปุ่ม
  G.ui = {};
  G.ui.active = () => stack.length > 0;
  G.ui.key = (k) => { const top = stack[stack.length - 1]; if (top) top.onKey(k); };
  function push(m) { stack.push(m); $('#ui').appendChild(m.el); }
  function pop(m) { const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1); m.el.remove(); }
  G.ui.closeAll = () => { while (stack.length) pop(stack[stack.length - 1]); };
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  // ---------- กล่องข้อความแบบพิมพ์ทีละตัว ----------
  G.ui.say = function (text, name, opt = {}) {
    return new Promise((resolve) => {
      const box = el('div', 'panel dialog' + (opt.battle ? ' in-battle' : ''));
      if (name) box.appendChild(el('div', 'speaker', esc(name)));
      const body = el('div', 'dialog-text'); box.appendChild(body);
      const arrow = el('div', 'more', '▼'); box.appendChild(arrow);
      const chars = Array.from(text);
      let n = 0, done = false;
      const speed = G.settings.textSpeed;
      const tick = setInterval(() => {
        n += speed; body.textContent = chars.slice(0, n).join('');
        if (n >= chars.length) { clearInterval(tick); done = true; box.classList.add('done'); if (opt.auto) setTimeout(() => finish(), opt.auto); }
      }, 22);
      const finish = () => { if (!stack.includes(m)) return; pop(m); resolve(); };
      const m = { el: box, onKey: (k) => {
        if (k !== 'ok' && k !== 'back') return;
        if (!done) { clearInterval(tick); n = chars.length; body.textContent = text; done = true; box.classList.add('done'); if (opt.auto) setTimeout(finish, opt.auto); }
        else if (!opt.auto) { G.sfx('tick'); finish(); }
      } };
      push(m);
    });
  };
  G.ui.sayAll = async (lines, name) => { for (const l of lines) await G.ui.say(l, name); };

  // ---------- รายการตัวเลือก ----------
  // options: [{label, sub, disabled}] หรือ string; คืน index หรือ -1 เมื่อยกเลิก
  G.ui.choose = function (options, opt = {}) {
    return new Promise((resolve) => {
      const box = el('div', 'panel choice ' + (opt.cls || ''));
      if (opt.title) box.appendChild(el('div', 'choice-title', esc(opt.title)));
      const items = options.map((o) => (typeof o === 'string' ? { label: o } : o));
      const list = el('div', 'choice-list' + (opt.grid ? ' grid' : ''));
      const rows = items.map((it, i) => {
        const r = el('div', 'choice-item' + (it.disabled ? ' disabled' : ''));
        r.innerHTML = `${it.icon ? `<canvas width="16" height="16" class="ico" data-sprite="${esc(it.icon)}"></canvas>` : ''}<span class="lbl">${esc(it.label)}</span>${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ''}`;
        r.addEventListener('click', () => { sel = i; draw(); pick(); });
        list.appendChild(r); return r;
      });
      box.appendChild(list);
      const info = el('div', 'choice-info'); if (opt.info) box.appendChild(info);
      let sel = Math.max(0, opt.start || 0);
      const draw = () => {
        rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
        if (rows[sel]) rows[sel].scrollIntoView({ block: 'nearest' });
        if (opt.info) info.textContent = opt.info(sel) || '';
      };
      const pick = () => { if (items[sel].disabled) { G.sfx('bump'); return; } G.sfx('tick'); pop(m); resolve(sel); };
      const cols = opt.grid ? 2 : 1;
      const m = { el: box, onKey: (k) => {
        if (k === 'up') sel = (sel - cols + items.length) % items.length;
        else if (k === 'down') sel = (sel + cols) % items.length;
        else if (k === 'left' && cols > 1) sel = sel % 2 ? sel - 1 : sel;
        else if (k === 'right' && cols > 1) sel = sel % 2 ? sel : Math.min(items.length - 1, sel + 1);
        else if (k === 'ok') return pick();
        else if (k === 'back' && opt.cancel !== false) { G.sfx('tick'); pop(m); resolve(-1); return; }
        draw();
      } };
      push(m); draw();
    });
  };
  G.ui.confirm = async (q, name) => { await G.ui.say(q, name, { auto: 1 }); return (await G.ui.choose(['ใช่', 'ไม่'], { cls: 'yesno' })) === 0; };

  // ---------- หน้าต่างแสดงข้อมูล (ปิดด้วยปุ่มใดก็ได้) ----------
  G.ui.panel = function (html, cls) {
    return new Promise((resolve) => {
      const box = el('div', 'panel sheet ' + (cls || ''), html);
      const m = { el: box, onKey: (k) => { if (k === 'ok' || k === 'back') { pop(m); resolve(); } } };
      push(m);
    });
  };

  // ---------- หลอด HP ----------
  G.ui.hpBar = (hp, max) => {
    const p = Math.max(0, hp / max);
    return `<div class="hpbar"><i style="width:${(p * 100).toFixed(1)}%" class="${p < 0.2 ? 'red' : p < 0.5 ? 'yellow' : ''}"></i></div>`;
  };
  const STATUS = { par: 'ชา', slp: 'หลับ', psn: 'ท้องเสีย' };
  G.ui.statusTag = (s) => (s ? `<span class="tag st-${s}">${STATUS[s]}</span>` : '');
  const TYPE_TH = { normal: 'ปกติ', water: 'น้ำ', earth: 'ดิน', electric: 'สายฟ้า', wind: 'ลม' };
  G.ui.typeTag = (t) => `<span class="tag ty-${t}">${TYPE_TH[t]}</span>`;
  G.TYPE_TH = TYPE_TH;

  // ---------- เมนูทีม ----------
  const KIND_TH = { kid: 'เด็กบ้านนา', ghost: 'ผีสาง', eng: 'น้องวิศวะ', boss: 'บอส', master: 'หัวโจก' };
  const monRow = (m, extra) => ({ icon: G.monLook(m), label: `${m.name}  Lv${m.lv}`,
    sub: `${m.hp}/${m.stats.hp}${m.status ? ' · ' + STATUS[m.status] : ''}${m.held ? ' · ถือ' + G.DATA.items[m.held].name : ''}${extra || ''}` });
  G.ui.partyMenu = async function (opt = {}) {
    const S = G.state;
    let start = 0;
    for (;;) {
      const options = S.party.map((m, k) => ({ ...monRow(m, k === 0 && S.follower ? ' · เดินตาม' : ''), disabled: opt.mustAlive && m.hp <= 0 }));
      const i = await G.ui.choose(options, { title: opt.title || 'ทีมของเรา (คนแรก = เดินตามและลงสู้ก่อน)', cls: 'party', cancel: opt.cancel !== false,
        start: opt.pick ? Math.max(0, options.findIndex((o) => !o.disabled)) : start,
        info: (k) => { const m = S.party[k]; if (!m) return ''; const sp = G.DATA.species[m.sp];
          return `${KIND_TH[sp.kind] || ''} · ${G.TYPE_TH[sp.type]} · EXP ถึงเลเวลถัดไป ${G.expFor(m.lv + 1) - m.exp}`; } });
      if (i < 0 || opt.pick) return i;
      start = i;
      const m = S.party[i];
      const acts = ['ดูข้อมูล', i === 0 ? (S.follower ? 'ให้เลิกเดินตาม' : 'ให้เดินตาม') : 'ให้เดินตาม (ลงสู้คนแรก)', 'สลับลำดับ', m.held ? 'เก็บของถือคืน' : 'ให้ถือของ', 'ตั้งชื่อเล่น', 'ปิด'];
      const act = await G.ui.choose(acts, { cls: 'small', title: m.name });
      if (act === 0) await G.ui.monInfo(m);
      else if (act === 1) {
        if (i === 0) S.follower = !S.follower;
        else { S.party.splice(i, 1); S.party.unshift(m); S.follower = true; start = 0; }
        if (G.world.follow) G.world.follow = { x: G.world.follow.x, y: G.world.follow.y, dir: G.state.dir };
        G.sfx('tick');
      } else if (act === 2) {
        const j = await G.ui.choose(S.party.map((o) => monRow(o)), { title: `สลับ ${m.name} กับใคร?`, cls: 'party', start: i });
        if (j >= 0 && j !== i) { [S.party[i], S.party[j]] = [S.party[j], S.party[i]]; G.sfx('tick'); start = j; }
      } else if (act === 3) {
        if (m.held) { S.bag[m.held] = (S.bag[m.held] || 0) + 1; await G.ui.say(`เก็บ${G.DATA.items[m.held].name}คืนเข้ากระเป๋าแล้ว`); m.held = null; }
        else {
          const id = await G.ui.bagMenu({ pickOnly: true, filter: (it) => it.kind === 'held', title: `ให้ ${m.name} ถืออะไร?` });
          if (id) { S.bag[id]--; m.held = id; G.sfx('buy'); await G.ui.say(`${m.name} ถือ${G.DATA.items[id].name}แล้ว`); }
        }
      } else if (act === 4) {
        const nm = await G.askText(`ตั้งชื่อเล่นให้ ${m.name}`, m.name, 12);
        if (nm) { m.name = nm; G.sfx('buy'); }
      }
    }
  };

  // ---------- คลังแก๊ง (ฝาก/รับสมาชิก กรองตามประเภท) ----------
  G.ui.storageMenu = async function (keeper) {
    const S = G.state;
    for (;;) {
      const i = await G.ui.choose([{ label: 'รับสมาชิกเข้าทีม', sub: `ในคลัง ${S.storage.length}` }, { label: 'ฝากสมาชิกไว้ในคลัง', sub: `ในทีม ${S.party.length}/6` }, 'จัดลำดับทีม', 'ปิด'],
        { title: 'คลังแก๊ง', cls: 'small' });
      if (i === 0) {
        if (!S.storage.length) { await G.ui.say('ยังไม่มีใครอยู่ในคลังเลย', keeper); continue; }
        for (;;) {
          const kinds = [['all', 'ทั้งหมด'], ['kid', 'เด็กบ้านนา'], ['ghost', 'ผีสาง'], ['eng', 'น้องวิศวะ']];
          const count = (k) => S.storage.filter((m) => k === 'all' || G.DATA.species[m.sp].kind === k).length;
          const f = await G.ui.choose(kinds.map(([k, n]) => ({ label: n, sub: `${count(k)} คน`, disabled: !count(k) })), { title: 'ดูกลุ่มไหน?', cls: 'small' });
          if (f < 0) break;
          const list = S.storage.map((m, idx) => ({ m, idx })).filter(({ m }) => kinds[f][0] === 'all' || G.DATA.species[m.sp].kind === kinds[f][0])
            .sort((a, b) => b.m.lv - a.m.lv);
          const k = await G.ui.choose(list.map(({ m }) => monRow(m)), { title: `${kinds[f][1]} ในคลัง (เรียงตามเลเวล)`, cls: 'party',
            info: (j) => { const m = list[j] && list[j].m; return m ? `${KIND_TH[G.DATA.species[m.sp].kind]} · ${G.TYPE_TH[G.DATA.species[m.sp].type]} · ${G.DATA.species[m.sp].desc}` : ''; } });
          if (k < 0) continue;
          const pick = list[k];
          if (S.party.length >= 6) {
            const out = await G.ui.choose(S.party.map((m) => monRow(m)), { title: `ทีมเต็ม ให้ใครออกไปพักแทน ${pick.m.name}?`, cls: 'party' });
            if (out < 0) continue;
            const [gone] = S.party.splice(out, 1, pick.m); S.storage.splice(pick.idx, 1, gone);
            await G.ui.say(`${pick.m.name} เข้าทีม ${gone.name} ไปพักในคลัง`, keeper);
          } else { S.storage.splice(pick.idx, 1); S.party.push(pick.m); await G.ui.say(`${pick.m.name} เข้าทีมแล้ว!`, keeper); }
          G.sfx('buy');
        }
      } else if (i === 1) {
        if (S.party.length <= 1) { await G.ui.say('ต้องมีอย่างน้อยหนึ่งคนอยู่ในทีม', keeper); continue; }
        const k = await G.ui.partyMenu({ pick: true, title: 'ฝากใครไว้ในคลัง?' });
        if (k < 0) continue;
        const rest = S.party.filter((m, j) => j !== k && m.hp > 0);
        if (!rest.length) { await G.ui.say('ฝากไม่ได้ ทีมจะไม่เหลือคนที่ยังสู้ไหว', keeper); continue; }
        const [m] = S.party.splice(k, 1); S.storage.push(m); G.sfx('tick');
        await G.ui.say(`${m.name} ไปพักในคลังแล้ว`, keeper);
      } else if (i === 2) await G.ui.partyMenu();
      else return;
    }
  };
  G.askText = (title, value, max) => new Promise((resolve) => {
    const box = document.createElement('div'); box.className = 'panel sheet namebox';
    box.innerHTML = `<div class="choice-title">${esc(title)}</div><input maxlength="${max || 10}" aria-label="${esc(title)}"><div class="hint">พิมพ์แล้วกด Enter · Esc ยกเลิก</div>`;
    document.querySelector('#ui').appendChild(box);
    const inp = box.querySelector('input'); inp.value = value || ''; inp.focus(); inp.select();
    const done = (v) => { box.remove(); resolve(v); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(inp.value.trim() || null); } else if (e.key === 'Escape') done(null); e.stopPropagation(); });
  });

  G.ui.monInfo = function (m) {
    const sp = G.DATA.species[m.sp];
    const AB = { rage: 'บ้าพลัง — HP ต่ำกว่า 1/3 ท่าธาตุดินแรง ×1.5', analyze: 'วิเคราะห์ — ลงมือทีหลังศัตรู ท่าแรง ×1.3',
      eater: 'อิ่มแล้วสู้ — ฟื้น HP 1/16 ทุกท้ายเทิร์น', quick: 'ดีดเปิดเกม — เทิร์นแรกลงมือก่อนเสมอ' };
    const moves = m.moves.map((s) => { const mv = G.DATA.moves[s.id];
      return `<tr><td>${esc(mv.name)}</td><td>${G.ui.typeTag(mv.type)}</td><td>${mv.power || '—'}</td><td>${s.pp}/${mv.pp}</td></tr>`; }).join('');
    const st = m.stats;
    return G.ui.panel(`
      <div class="info-head"><canvas class="info-sprite" width="16" height="16" data-sprite="${G.monLook(m)}"></canvas>
        <div><b>${esc(m.name)}</b> Lv${m.lv} ${G.ui.typeTag(sp.type)} ${G.ui.statusTag(m.status)} <small>${KIND_TH[sp.kind] || ''}${m.name !== sp.name && sp.kind !== 'eng' ? ' · ' + esc(sp.name) : ''}</small><br>
        <small>${esc(sp.desc)}</small>${sp.ability ? `<br><small>ความสามารถ: ${esc(AB[sp.ability])}</small>` : ''}${m.held ? `<br><small>ถือ: ${esc(G.DATA.items[m.held].name)}</small>` : ''}</div></div>
      <div class="stats">HP ${m.hp}/${st.hp} · โจมตี ${st.atk} · ป้องกัน ${st.def} · พิเศษ ${st.spa} · ป้องกันพิเศษ ${st.spd} · ความเร็ว ${st.spe}</div>
      <table class="moves"><tr><th>ท่า</th><th>ธาตุ</th><th>พลัง</th><th>PP</th></tr>${moves}</table>`, 'mon-info');
  };

  // ---------- กระเป๋า ----------
  const BAG_ORDER = ['heal', 'healall', 'cure', 'recruit', 'repel', 'held', 'tm'];
  const BAG_TH = { heal: 'ยา', healall: 'ยา', cure: 'ยา', recruit: 'ของกินชวน', repel: 'ของใช้', held: 'ของถือ', tm: 'ของสำคัญ' };
  G.ui.bagMenu = async function (opt = {}) {
    const S = G.state, I = G.DATA.items;
    for (;;) {
      const ids = Object.keys(S.bag).filter((k) => S.bag[k] > 0 && I[k] && (!opt.filter || opt.filter(I[k])))
        .sort((a, b) => BAG_ORDER.indexOf(I[a].kind) - BAG_ORDER.indexOf(I[b].kind));
      if (!ids.length) { await G.ui.say(opt.pickOnly ? 'ไม่มีของที่ใช้ได้' : 'กระเป๋าว่างเปล่า'); return null; }
      const i = await G.ui.choose(ids.map((k) => ({ label: I[k].name, sub: (I[k].kind === 'tm' ? '' : '×' + S.bag[k]) + ' ' + BAG_TH[I[k].kind] })),
        { title: opt.title || 'กระเป๋า', cls: 'bag', info: (k) => I[ids[k]] && I[ids[k]].desc });
      if (i < 0) return null;
      const it = I[ids[i]];
      if (opt.inBattle || opt.pickOnly) return ids[i];
      if (it.kind === 'heal' || it.kind === 'cure') {
        const t = await G.ui.partyMenu({ pick: true, title: `ใช้${it.name}กับใคร?` });
        if (t < 0) continue;
        const m = S.party[t];
        if (it.kind === 'heal') {
          if (m.hp <= 0 || m.hp >= m.stats.hp) { await G.ui.say('ใช้ตอนนี้ไม่ได้'); continue; }
          m.hp = Math.min(m.stats.hp, m.hp + it.value);
        } else { if (!m.status) { await G.ui.say('ไม่มีอาการผิดปกติ'); continue; } m.status = null; }
        S.bag[ids[i]]--; G.sfx('heal'); await G.ui.say(`${m.name} ดีขึ้นแล้ว!`);
      } else if (it.kind === 'healall') {
        if (S.party.every((m) => m.hp <= 0 || m.hp >= m.stats.hp)) { await G.ui.say('ทุกคนพลังเต็มอยู่แล้ว'); continue; }
        S.party.forEach((m) => { if (m.hp > 0) m.hp = m.stats.hp; });
        S.bag[ids[i]]--; G.sfx('heal'); await G.ui.say(`แบ่ง${it.name}กินกันทั้งแก๊ง ทุกคนฟื้นพลังเต็ม!`);
      } else if (it.kind === 'repel') {
        S.bag[ids[i]]--; S.repel = it.value; G.sfx('heal'); await G.ui.say('โปรยข้าวสารเสกแล้ว ผีสางอ่อนๆ จะไม่เข้าใกล้สักพัก');
      } else if (it.kind === 'held') {
        const t = await G.ui.partyMenu({ pick: true, title: `ให้ใครถือ${it.name}?` });
        if (t < 0) continue;
        const m = S.party[t];
        if (m.held) S.bag[m.held] = (S.bag[m.held] || 0) + 1;
        S.bag[ids[i]]--; m.held = ids[i]; G.sfx('buy'); await G.ui.say(`${m.name} ถือ${it.name}แล้ว`);
      } else if (it.kind === 'tm') await G.ui.teachTM(ids[i]);
      else await G.ui.say(`${it.name}ใช้ได้ตอนต่อสู้เท่านั้น`);
    }
  };
  // ท่าลับรางวัลยิม: สอนใครก็ได้ที่ธาตุตรงกัน ใช้ซ้ำได้
  G.ui.teachTM = async function (id) {
    const S = G.state, it = G.DATA.items[id], mv = G.DATA.moves[it.move];
    const t = await G.ui.partyMenu({ pick: true, title: `สอนท่า ${mv.name} (ธาตุ${G.TYPE_TH[it.for]}) ให้ใคร?` });
    if (t < 0) return;
    const m = S.party[t];
    if (G.DATA.species[m.sp].type !== it.for) { await G.ui.say(`${m.name} ไม่ใช่ธาตุ${G.TYPE_TH[it.for]} เรียนท่านี้ไม่ได้`); return; }
    if (m.moves.some((s2) => s2.id === it.move)) { await G.ui.say(`${m.name} ใช้ท่า ${mv.name} เป็นอยู่แล้ว`); return; }
    if (m.moves.length < 4) { m.moves.push({ id: it.move, pp: mv.pp }); }
    else {
      await G.ui.say(`${m.name} จำได้แค่ 4 ท่า จะลืมท่าไหน?`, null, { auto: 1 });
      const k = await G.ui.choose(m.moves.map((s2) => G.DATA.moves[s2.id].name).concat(['ไม่เรียน']), { cls: 'small' });
      if (k < 0 || k >= 4) return;
      m.moves[k] = { id: it.move, pp: mv.pp };
    }
    G.sfx('level'); await G.ui.say(`${m.name} เรียนท่าลับ ${mv.name} ได้แล้ว!`);
  };

  // ---------- ร้านค้า ----------
  G.ui.shop = async function (stock, keeper) {
    const S = G.state, I = G.DATA.items;
    for (;;) {
      const i = await G.ui.choose(stock.map((k) => ({ label: I[k].name, sub: I[k].price + ' บาท' })),
        { title: `เงิน ${S.money} บาท`, cls: 'bag', info: (k) => I[stock[k]] && I[stock[k]].desc });
      if (i < 0) return;
      const it = I[stock[i]];
      const qtys = [1, 5, 10].filter((q) => q * it.price <= S.money);
      if (!qtys.length) { await G.ui.say('เงินไม่พอจ้า', keeper); continue; }
      const q = await G.ui.choose(qtys.map((n) => ({ label: `${n} ชิ้น`, sub: n * it.price + ' บาท' })), { cls: 'small' });
      if (q < 0) continue;
      S.money -= qtys[q] * it.price; S.bag[stock[i]] = (S.bag[stock[i]] || 0) + qtys[q];
      G.sfx('buy'); await G.ui.say(`ได้${it.name} ${qtys[q]} ชิ้น ขอบใจหลาย!`, keeper);
    }
  };

  // ---------- สมุดบันทึกผีสาง ----------
  G.ui.notebook = function () {
    const S = G.state, sp = G.DATA.species;
    const ids = Object.keys(sp).filter((k) => sp[k].kind === 'ghost' || (sp[k].kind === 'eng' && G.DATA.engNames[k]));
    const rows = ids.map((k) => {
      const st = S.dex[k] || 0;
      return `<div class="nb-row ${st ? '' : 'unknown'}"><canvas width="16" height="16" data-sprite="${st ? sp[k].look : ''}"></canvas>
        <div><b>${st ? esc(sp[k].name) : '???'}</b> ${st ? G.ui.typeTag(sp[k].type) : ''} ${st === 2 ? '<span class="tag got">อยู่ในแก๊ง</span>' : ''}<br>
        <small>${st ? esc(sp[k].desc) : 'ยังไม่เคยเจอ'}</small></div></div>`;
    }).join('');
    const seen = ids.filter((k) => S.dex[k]).length, got = ids.filter((k) => S.dex[k] === 2).length;
    return G.ui.panel(`<div class="choice-title">สมุดบันทึก (แอมเขียน) — เจอ ${seen}/${ids.length} · ชวนได้ ${got} · น้องวิศวะในแก๊ง ${[...S.party, ...S.storage].filter((m) => sp[m.sp].kind === 'eng').length} คน</div><div class="nb">${rows}</div>`, 'notebook');
  };

  // ---------- เมนูหลัก ----------
  G.ui.mainMenu = async function () {
    const S = G.state;
    const items = [];
    if (S.party.length) items.push('ทีม');
    items.push('กระเป๋า');
    if (S.flags.starter_chosen) items.push('สมุดบันทึก');
    items.push('ตรา', 'วิธีเล่น', 'บันทึกเกม', 'ตั้งค่า', 'ปิด');
    const i = await G.ui.choose(items, { cls: 'mainmenu', title: `${S.name} · ${S.money} บาท` });
    const pick = items[i];
    if (pick === 'ทีม') await G.ui.partyMenu();
    else if (pick === 'กระเป๋า') await G.ui.bagMenu();
    else if (pick === 'สมุดบันทึก') await G.ui.notebook();
    else if (pick === 'ตรา') await G.ui.panel(`<div class="choice-title">ตรายิม</div><div class="badges">${
      [['gym1', 'ผ้าโพก'], ['gym2', 'เฟือง'], ['gym3', 'หูฟัง'], ['gym4', 'ไม้เรียว']].map(([f, n]) =>
        `<div class="badge ${S.flags[f + '_done'] ? 'on' : ''}"><i></i>ตรา${n}</div>`).join('')}</div>`);
    else if (pick === 'วิธีเล่น') await G.ui.panel(G.HOWTO, 'tip-sheet');
    else if (pick === 'บันทึกเกม') { if (await G.ui.saveMenu()) { G.sfx('buy'); await G.ui.say(`บันทึกเกมลงช่อง ${G.slot} แล้ว`); } }
    else if (pick === 'ตั้งค่า') {
      const on = (b) => (b ? 'เปิด' : 'ปิด');
      const s = await G.ui.choose([`ความเร็วข้อความ: ${['ช้า', 'กลาง', 'เร็ว'][G.settings.textSpeed - 1]}`, `เพลง: ${on(G.settings.music)}`,
        `เสียงเอฟเฟกต์: ${on(G.settings.sound)}`, `ไกด์และลูกศรชี้ทาง: ${on(G.settings.guide)}`, `แถบทีมและมินิแมพ: ${on(G.settings.hud !== false)}`, `เก็บเวลเร็ว + ติดคริง่าย: ${on(G.settings.easy !== false)}`, 'สำรองเซฟเป็นไฟล์'], { cls: 'small',
        info: (k) => (k === 5 ? 'เปิด: EXP ×3 แบ่งให้ทั้งแก๊ง และฝั่งเราติดคริ 25%' : '') });
      if (s === 0) G.settings.textSpeed = (G.settings.textSpeed % 3) + 1;
      if (s === 1) { G.settings.music = !G.settings.music; G.restartMusic(); }
      if (s === 2) { G.settings.sound = !G.settings.sound; G.restartMusic(); }
      if (s === 3) G.settings.guide = !G.settings.guide;
      if (s === 4) G.settings.hud = G.settings.hud === false;
      if (s === 5) G.settings.easy = G.settings.easy === false;
      if (s === 6) G.exportSave();
      G.saveSettings();
    }
  };

  // วาดสไปรต์ลง canvas เล็กในหน้าต่าง
  const obs = new MutationObserver(() => {
    document.querySelectorAll('canvas[data-sprite]').forEach((c) => {
      if (c.dataset.done) return; c.dataset.done = 1;
      if (!c.dataset.sprite) return;
      c.getContext('2d').drawImage(G.sprite(c.dataset.sprite), 0, 0);
    });
  });
  window.addEventListener('DOMContentLoaded', () => obs.observe($('#ui'), { childList: true, subtree: true }));
})(window.G = window.G || {});
