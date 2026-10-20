// สคริปต์เหตุการณ์และบทพูดทั้งหมด แก้บทพูดได้ที่ไฟล์นี้
(function (G) {
  'use strict';
  const say = (t, n) => G.ui.say(t, n);
  const S = () => G.state;
  const F = () => G.state.flags;
  const KIDS = ['bee', 'am', 'tle', 'ter'];
  const COUNTER = { bee: 'phrai', am: 'kongkoi', tle: 'krahang', ter: 'phong' }; // ผีธาตุที่ชนะทางเด็กแต่ละคน
  const COUNTER3 = { bee: 'nangngueak', am: 'taehak', tle: 'takhian', ter: 'krasue' };   // คู่แข่งรอบ 3 (ผีริมพอง)
  const KID_LINES = {
    bee: ['เฮ้ย เลือกกูๆ! เอ้ย เลือกเราๆ!', 'แรงเราเยอะนะ ยกกระสอบข้าวได้สองกระสอบ!'],
    am: ['ตามสถิติแล้ว เลือกเราจะชนะง่ายที่สุด 73.4 เปอร์เซ็นต์', 'เดี๋ยวเราจดทุกอย่างลงสมุดให้เอง'],
    tle: ['ไปก็ได้นะ... แต่ขอห่อข้าวเหนียวไปด้วยได้ไหม', 'ถ้าเหนื่อยเรากินขนมแป๊บเดียวก็หาย'],
    ter: ['ไปเลยๆๆ ช้าอยู่ทำไม!', 'เราวิ่งเร็วสุดในหมู่บ้าน ถามใครก็ได้!'],
  };
  // คุยกับคนที่เดินตาม
  const FOLLOW_LINES = {
    bee: ['หิวข้าวแล้วอะ... เอ้ย ไม่หิวๆ ไปต่อ!', 'เดินเยอะขาแข็งแรงขึ้นเยอะเลยนะเนี่ย', 'ควายที่บ้านคงคิดถึงเราแล้วแหละ'],
    am: ['เราจดแผนที่ไว้หมดแล้ว ไม่หลงแน่นอน', 'ตึกวิศวะสวยมาก โตขึ้นเราจะมาเรียนที่นี่!', 'รู้ไหม ผีโพงเรืองแสงเพราะ... ยังไม่รู้เหมือนกัน'],
    tle: ['มีขนมเหลือไหม... ถามเฉยๆ', 'เดินช้าๆ ก็ได้นะ เหนื่อย', 'น้ำปั่นร้านอิงอิงอร่อยไหมน้า'],
    ter: ['เร็วอีก! เร็วอีก!', 'แข่งวิ่งไปถึงต้นไม้นั่นกันไหม!', 'เบื่อเดิน อยากวิ่ง!'],
  };
  // บทพูดตามที่/เวลา/สถานการณ์ของเด็กสี่คน (ใช้ทั้งตอนคุยกับคนเดินตามและตอนไปถึงที่ใหม่ครั้งแรก)
  const PLACE_LINES = {
    village: { bee: 'กลับบ้านแล้ว! กลิ่นข้าวเหนียวนึ่งลอยมาจากบ้านไหนน้า', am: 'หมู่บ้านเราเล็กนิดเดียวเมื่อเทียบกับในเมือง แต่อบอุ่นที่สุด', tle: 'แม่ทำข้าวรอไว้แน่เลย แวะบ้านก่อนไหม', ter: 'วิ่งรอบหมู่บ้านสามรอบยังไม่เหนื่อยเลย!' },
    field: { bee: 'ทุ่งนาบ้านเรา พ่อบอกปีนี้ข้าวจะงามที่สุด', am: 'คันนาพวกนี้ขุดด้วยมือทั้งนั้นเลยนะ นับไม่ถ้วน', tle: 'นอนใต้เถียงนาสักงีบดีไหม ลมเย็นสบาย', ter: 'แข่งวิ่งบนคันนา ใครตกนาแพ้!' },
    market: { bee: 'ลูกชิ้นปิ้งไม้ละห้าบาท! ซื้อสักสิบไม้', am: 'ตลาดนัดมาทุกวันพุธ คนมาจากสามตำบลเลยนะ', tle: 'ขนมครกร้านป้าหอมจัง ขอแวะแป๊บเดียว', ter: 'คนเยอะ วิ่งไม่ได้ อึดอัดเลย' },
    kku: { bee: 'มหาลัยใหญ่เหมือนเมืองเลย หลงแน่ๆ', am: 'ที่นี่แหละ มข.! สักวันเราจะมาเรียนวิศวะที่นี่', tle: 'ได้ยินว่าโรงอาหารที่นี่มีเป็นร้อยร้าน...', ter: 'ถนนยาวขนาดนี้ ปั่นจักรยานแข่งได้สบาย!' },
    phong: { bee: 'ลำน้ำพองกว้างจัง ปลาตัวโตแน่เลย', am: 'น้ำพองไหลมาจากเขื่อนอุบลรัตน์นะ รู้ยัง', tle: 'ลุงเปลี่ยนบอกจะพาล่องเรือ... ขอนั่งเฉยๆ ได้ไหม', ter: 'อยากกระโดดน้ำ! ...ล้อเล่น ไม่กล้า' },
    amphoe: { bee: 'ตัวอำเภอคึกคักกว่าตลาดนัดอีก', am: 'หอนาฬิกานี่สร้างมาตั้งแต่สมัยพ่อเรายังเด็ก', tle: 'ตลาดเช้ามีโจ๊กกับปาท่องโก๋ ตื่นเช้าคุ้มเลย', ter: 'ไฟแดงนานจัง ข้ามไปเลยได้ไหม... ไม่ได้สินะ' },
    city: { bee: 'ตึกสูงจนคอตั้งบ่า ที่นี่คือขอนแก่นเหรอ', am: 'เมืองขอนแก่นมีสนามอีสปอร์ตด้วย สุดยอด!', tle: 'ร้านสะดวกซื้ออยู่ทุกหัวมุมเลย อันตรายต่อกระเป๋าเงิน', ter: 'รถเยอะมาก ต้องจับมือกันข้ามถนนนะ' },
    donputa: { bee: 'เข้าป่าปู่ตาต้องสำรวมนะ แม่สอนไว้', am: 'ต้นไม้บางต้นที่นี่อายุเป็นร้อยปีเลยนะ', tle: 'เงียบจัง... ได้ยินเสียงใบไม้คุยกันเลย', ter: 'วันนี้ไม่วิ่ง วันนี้เดินเบาๆ' },
  };
  const MOOD_LINES = {
    night: { bee: 'มืดแล้ว ผีออกเยอะ ระวังตัวด้วย', am: 'ดาวเยอะจัง นั่นดาวลูกไก่ใช่ไหม', tle: 'ง่วงแล้ว... กลับบ้านนอนกันเถอะ', ter: 'กลางคืนก็วิ่งได้ ไฟฉายอยู่ไหน!' },
    rain: { bee: 'ฝนตกแล้ว! ข้าวในนาต้องดีใจแน่', am: 'ฝนตกผีน้ำออกเยอะนะ เตรียมของชวนไว้', tle: 'เปียกหมดเลย... ขอหลบใต้ชายคาก่อน', ter: 'กระโดดแอ่งน้ำ! ตูม!' },
    tired: { bee: 'ไหวอยู่ๆ แค่ถลอกนิดเดียว', am: 'ตามสถิติ เราควรพักก่อนนะ', tle: 'ไม่ไหวแล้ว... ขอยาสมุนไพรหน่อย', ter: 'ขาสั่นแล้ว แต่ยังวิ่งได้... มั้ง' },
    clear: { bee: 'เราทำได้จริงๆ ด้วย จากเด็กบ้านนามาถึงตรงนี้', am: 'บันทึกการเดินทางของเราเต็มเล่มแล้ว ต้องซื้อเล่มใหม่', tle: 'เที่ยวกันต่อไหม ยังมีร้านอร่อยอีกเยอะ', ter: 'ไปต่อ! ยังมีศึกแชมป์อีสานรออยู่!' },
  };
  G.kidLine = function (m, first) {   // first = ไปถึงที่นี่ครั้งแรก (ใช้แต่บทตามสถานที่)
    const k = m && m.sp, map = G.state.map;
    if (!PLACE_LINES.village[k]) return null;
    if (first) return PLACE_LINES[map] ? PLACE_LINES[map][k] : null;
    const pool = [];
    if (PLACE_LINES[map]) pool.push(PLACE_LINES[map][k]);
    if (G.isNight()) pool.push(MOOD_LINES.night[k]);
    if (G.raining()) pool.push(MOOD_LINES.rain[k], MOOD_LINES.rain[k]);
    if (m.hp < m.stats.hp / 3) pool.push(MOOD_LINES.tired[k], MOOD_LINES.tired[k], MOOD_LINES.tired[k]);
    if (F().game_clear) pool.push(MOOD_LINES.clear[k]);
    return pool.length && G.rng() < 0.65 ? pool[Math.floor(G.rng() * pool.length)] : null;
  };
  const MED_LINES = ['เดินเยอะดีนะคะ ได้ออกกำลังกาย', 'ใครเจ็บตรงไหนบอกได้เลย พกพลาสเตอร์มาเต็มกระเป๋า', 'อ่านหนังสือไม่ทันสอบแล้ว... ช่างมันก่อน!', 'พี่บูมใจดีขึ้นเยอะเลยนะ ตั้งแต่แพ้น้องๆ'];
  const ENG_LINES = ['อยากกินหมูกระทะอีกแล้วครับพี่', 'งานกลุ่มยังไม่เสร็จเลย... ช่างมันก่อน ไปลุย!', 'พี่เฟรนด์ดุแต่ใจดีนะ จริงๆ', 'ใส่เสื้อช็อปแล้วรู้สึกเท่ขึ้นสามเท่า', 'เดินตามน้องประถมแบบนี้ รุ่นพี่เห็นต้องโดนว้ากแน่'];

  G.markSeen = (sp) => { if (!G.state.dex[sp]) G.state.dex[sp] = 1; };
  G.heal = () => { for (const m of [...S().party, ...S().storage]) { m.hp = m.stats.hp; m.status = null; m.moves.forEach((s) => { s.pp = G.DATA.moves[s.id].pp; }); } };
  const give = async (id, n) => { S().bag[id] = (S().bag[id] || 0) + n; G.sfx('buy'); G.ui.history.push(['', `ได้รับ ${G.DATA.items[id].name}${G.DATA.items[id].kind === 'tm' ? '' : ' ×' + n}`]); await G.ui.itemGet(id, n); };
  const has = (sp) => [...S().party, ...S().storage].some((m) => m.sp === sp);
  const inParty = (sp) => S().party.some((m) => m.sp === sp);
  // ฉากย้อนความหลัง: จอสีซีเปีย ป้ายบอกเวลา/สถานที่ แล้วเล่าทีละบรรทัด [ข้อความ, ผู้พูด ('' = บรรยาย)]
  G.flashback = async (title, lines) => {
    const game = document.querySelector('#game'), old = game.style.filter;
    document.body.classList.add('flashback'); game.style.filter = 'sepia(0.85) contrast(0.95) brightness(0.92)';
    try {
      await G.ui.gotPopup({ sprite: 'item:old_photo', name: title, head: 'ความทรงจำ', desc: '', auto: 1800 });
      for (const [t, n] of lines) await say(n ? t : `(${t})`, n || null);
    } finally { game.style.filter = old; document.body.classList.remove('flashback'); }
  };
  const recruit = (m) => { if (S().party.length < 6) S().party.push(m); else S().storage.push(m); G.state.dex[m.sp] = 2; };
  const takenNames = () => new Set([...S().party, ...S().storage].map((m) => m.name));
  // จุดฟื้นล่าสุด (หมดแรงแล้วไปตื่นที่นี่)
  const restHere = () => { S().lastHeal = { map: S().map, x: S().x, y: S().y, dir: S().dir }; };
  const fullHeal = async (text, name) => { G.heal(); G.sfx('heal'); restHere(); await say(text || 'ทุกคนกลับมาแข็งแรงเต็มที่!', name); };
  // ลุงสองแถว: ให้เลือกไปที่ไหนก็ได้ (เส้นทางของลุงคันนี้ + ทุกที่ที่เคยไปแล้ว)
  const rideMenu = async (name, routes, greet) => {
    const list = [...routes];
    for (const [m, label, x, y, dir] of G.travelSpots()) if (m !== S().map && !list.some((r) => r[0] === m)) list.push([m, label, x, y, dir]);
    if (!list.length) { await say('ตอนนี้ลุงยังไม่มีที่ให้ไปนะหลาน', name); return; }
    const i = await G.ui.ask(greet, name, list.map((r) => r[1]).concat(['ยังไม่ไป']), { title: 'นั่งสองแถวไปไหนดี?', cls: 'small' });
    if (i < 0 || i >= list.length) return;
    const [m, label, x, y, dir] = list[i];
    await ride(m, x, y, dir, `นั่งสองแถวไป${label}...`);
  };
  const ride = async (to, x, y, dir, text) => {
    await G.fadeTo(() => { G.showToast(text); });
    await G.wait(1200);   // ให้อ่านป้ายบอกทางทัน
    await G.fadeTo(() => G.loadMap(to, x, y, dir));
    await SCRIPTS.enter(to);
  };

  // เควสต์รอง: ปิดเควสต์แล้วให้รางวัลตาม quests.csv (ครั้งเดียว)
  const quest = (id) => G.DATA.quests.find((q) => q.id === id);
  async function finishQuest(id) {
    const q = quest(id);
    if (F()[q.done]) return;
    F()[q.done] = true; G.sfx('level'); if (S().trackQuest === id) S().trackQuest = null;
    await say(`เควสต์ "${q.name}" สำเร็จ!`);
    for (const [k, v] of q.reward) {
      if (k === 'money') { S().money += v; G.sfx('buy'); await say(`ได้รับเงิน ${v} บาท`); } else await give(k, v);
    }
  }
  const startQuest = async (id) => { const q = quest(id); F()[q.start] = true; S().trackQuest = id; G.sfx('alert'); await say(`รับเควสต์ "${q.name}" แล้ว ลูกศรจะชี้ไปเควสต์นี้ (เปลี่ยนเควสต์ได้ที่เมนู › สมุดเควสต์)`); };

  // จบด่าน: ให้ผู้เล่นเลือกเองว่าจะชวนเด็กบ้านนาคนไหนเข้าแก๊ง (เข้ามาที่เลเวล 10)
  const JOIN_LV = 10;
  async function pickKid(flag, who) {
    if (F()[flag]) return;
    const left = KIDS.filter((k) => !has(k));
    if (!left.length) { F()[flag] = true; return; }
    await say(left.length === 1 ? `${G.DATA.species[left[0]].name}วิ่งมาหา อยากเข้าแก๊งด้วย!` : 'เด็กๆ ในหมู่บ้านได้ข่าวว่าแก๊งเราชนะอีกแล้ว หลายคนอยากเข้าแก๊งด้วย!', who);
    for (;;) {
      const i = await G.ui.choose(left.map((k) => ({ icon: k, label: G.DATA.species[k].name, sub: `${G.TYPE_TH[G.DATA.species[k].type]} · Lv${JOIN_LV}` })),
        { title: 'ชวนใครเข้าแก๊ง? (เลือกได้หนึ่งคน)', cls: 'starter', cancel: false, info: (j) => G.DATA.species[left[j]].desc });
      const k = left[i], sp = G.DATA.species[k];
      await say(KID_LINES[k][0], sp.name);
      if (!(await G.ui.confirm(`ชวน${sp.name}เข้าแก๊งใช่ไหม?`))) continue;
      recruit(G.makeMon(k, JOIN_LV));
      F()[flag] = true; G.sfx('level');
      await say(KID_LINES[k][1], sp.name);
      await say(`${sp.name} เข้าแก๊งแล้ว! (Lv ${JOIN_LV})${S().party.some((m) => m.sp === k) ? '' : ' ทีมเต็ม เลยไปรออยู่ในคลังแก๊ง'}`);
      return k;
    }
  }

  async function blackout() {
    await say('ทุกคนหมดแรง... ฟ้ามืดลงต่อหน้าต่อตา');
    const lost = Math.floor(S().money * 0.1);
    S().money -= lost;
    G.heal();
    const lh = S().lastHeal || { map: 'home', x: 4, y: 4, dir: 'down' };
    await G.fadeTo(() => G.loadMap(lh.map, lh.x, lh.y, lh.dir));
    if (lh.map === 'home') await say(`ตื่นมาที่บ้าน แม่ทำกับข้าวรอไว้ ทุกคนกลับมาแข็งแรง${lost ? ` (ทำเงินหล่นหาย ${lost} บาท)` : ''}`, 'แม่');
    else await say(`ตื่นมาที่${G.DATA.world.maps[lh.map].name} ทุกคนกลับมาแข็งแรง${lost ? ` (ทำเงินหล่นหาย ${lost} บาท)` : ''}`);
  }

  async function trainerBattle(n) {
    const tr = n.trainer;
    if (tr.need && !F()[tr.need]) { await say(tr.needText || 'ยังผ่านไม่ได้', tr.name); return; }
    if (tr.dyn === 'rival3') { await SCRIPTS.joe3(n); return; }
    let team = tr.team;
    if (tr.dyn === 'rival2') team = [[COUNTER[S().starter], 9], ['pob', 8]];
    const taken = new Set();
    const foes = team.map(([sp, lv]) => { const m = G.spawn(sp, lv, { taken }); taken.add(m.name); return m; });
    await say(tr.intro, tr.name);
    const r = await G.runBattle(foes, { kind: 'trainer', trainerName: tr.name, trainerLook: n.look, money: tr.money });
    if (r === 'win') { F()[tr.flag] = true; await say(tr.lose, tr.name); G.refreshNpcs(); if (tr.after && SCRIPTS[tr.after]) await SCRIPTS[tr.after](n); }
    else await blackout();
  }

  // ยิงบั้งไฟขึ้นฟ้า (เอฟเฟกต์บนจอ)
  G.playRocket = () => new Promise((resolve) => {
    const t0 = performance.now();
    G.sfx('rocket');
    G.fx = { draw(ctx, now) {
      const t = (now - t0) / 2600;
      if (t >= 1) { G.fx = null; resolve(); return; }
      const x = 120 + Math.sin(t * 9) * 3, y = 150 - t * 190;
      ctx.fillStyle = 'rgba(240,240,230,0.5)';
      for (let i = 1; i < 14; i++) { const yy = y + i * 9; ctx.beginPath(); ctx.arc(x + Math.sin(i + t * 20) * i * 0.6, yy, 2 + i * 0.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#f2a03a'; ctx.fillRect(x - 2, y + 10, 4, 6); ctx.fillStyle = '#fff2a8'; ctx.fillRect(x - 1, y + 11, 2, 3);
      ctx.fillStyle = '#c5482b'; ctx.fillRect(x - 2, y - 6, 4, 16); ctx.fillStyle = '#d9b25a'; ctx.fillRect(x - 2, y - 2, 4, 2);
      ctx.fillStyle = '#f4f4ec'; ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 3, y - 6); ctx.lineTo(x, y - 11); ctx.fill();
      ctx.fillStyle = '#8a6440'; ctx.fillRect(x - 1, y + 10, 2, 20);
    } };
  });

  const SCRIPTS = {
    async intro() {
      await G.ui.panel(`<div class="intro"><b>แก๊งเด็กบ้านนา</b><br><br>ปีนี้ฝนไม่ตกมาสามเดือนแล้ว<br>ทุ่งนาหลังหมู่บ้านแห้งผาก และผีสางก็ออกมาป่วนกันทุกคืน<br><br><small>ลูกศร/WASD เดิน · Z หรือ Space คุย/ตกลง · X ยกเลิก (กดค้าง = วิ่ง) · Enter เมนู</small></div>`);
      const name = await G.askName();
      S().name = name;
      await say(`${name}! ตื่นได้แล้วลูก ผู้ใหญ่บ้านเรียกเด็กๆ ไปที่ศาลากลางบ้านแน่ะ`, 'แม่');
      await say('ออกจากบ้านทางพรมแดงข้างล่าง แล้วเดินไปทางขวาตามทางดินแดงนะลูก', 'แม่');
      F().intro_done = true;
      restHere();
      await G.tip('tip_controls', G.HOWTO);
    },
    async enter(map) {   // เข้าแมพครั้งแรก
      if (map === 'phong' && !F().phong_arrived) {
        F().phong_arrived = true;
        const kid = S().party.find((m) => G.DATA.species[m.sp].kind === 'kid');
        await say('ลมจากลำน้ำพองเย็นสบายจัง... แต่ในพงอ้อมีอะไรขยับไปมาแน่ะ', kid ? kid.name : S().name);
        if (inParty('ungying')) await say('พี่บูมเป็นรุ่นพี่ที่สนิทกับเฟรนด์... เขาจะรู้เรื่องเราไหมนะ', 'อุ๋งอิ๋ง');
        await G.tip('tip_phong', `<div class="choice-title">ริมลำน้ำพอง · ด่าน 3</div><ul class="howto">
          <li><b>พงอ้อ</b> นาริมน้ำ และสวนในตัวอำเภอ มี<b>ผีชุดใหม่ทั้งหมด</b> นางเงือก นางตะเคียน ผีตาแฮก กระสือ (เฉพาะกลางคืน) ผีตาโขน ผีปู่โสม</li>
          <li><b>ลุงเปลี่ยน</b>ที่ท่าน้ำ พาข้ามไปเกาะทรายได้ หาไส้เดือนให้ลุงแล้วจะได้<b>เบ็ดตกปลา</b> (ตกตอนเช้ามืดหรือฝนตก มีโอกาสเจอนาคน้อย)</li>
          <li>เดินตามถนนไปทางขวาถึงตัวอำเภอ <b>โรงพยาบาล</b>อยู่ติดวงเวียนหอนาฬิกา · ตลาดเช้าเปิดตี 5 ถึง 9 โมงเท่านั้น</li></ul>`);
      }
      if (map === 'city' && !F().city_arrived) {
        F().city_arrived = true;
        const kid = S().party.find((m) => G.DATA.species[m.sp].kind === 'kid');
        await say('{shock}ว้าว... ตึกสูงเต็มไปหมด! นั่นป้ายไฟสนามอีสปอร์ตใช่ไหม', kid ? kid.name : S().name);
        await G.tip('tip_city', `<div class="choice-title">ตัวเมืองขอนแก่น · ด่านสุดท้าย</div><ul class="howto">
          <li>ไปหา<b>พี่หยก</b>ที่ศาลากลางน้ำบึงแก่นนคร (ซ้ายบน) แล้วไป<b>สนามอีสปอร์ต</b> (ขวาบน)</li><li>กด <b>Q</b> เปิดสมุดเควสต์ เลือกเควสต์ที่จะทำ ลูกศรจะชี้ตาม · เมืองนี้มีเควสต์รองหลายอัน ดูคนที่มี <b>!</b> เหนือหัว</li>
          <li><b>โรงแรมนักแข่ง</b>พักฟรีและบันทึกเกมได้ · <b>ร้านสะดวกซื้อ</b>ขายยาและของกินชวน · <b>ร้านเน็ต</b>เปิด 10 โมงถึงตี 2</li>
          <li><b>ถนนคนเดิน</b>เปิดตอนค่ำ มีครูสอนท่ากับยายเพ็ญข้าวจี่ · <b>สวนสาธารณะ</b>หญ้ารกมีผีออก · เดินตามถนนไปทางขวาสุดถึงสนามบิน</li></ul>`);
      }
      if (map === 'hospital' && !F().hosp_arrived) {
        F().hosp_arrived = true;
        await G.tip('tip_hosp', `<div class="choice-title">โรงพยาบาลอำเภอ</div><ul class="howto">
          <li>ไปทำบัตรคิวที่<b>เวชระเบียน</b>ก่อน แล้ว<b>เดินตามเส้นสีบนพื้น</b>ไปทีละขั้น เข้าห้องผิดหรือข้ามคิว ป้าพยาบาลจะพากลับล็อบบี้</li>
          <li><b>ป้าพยาบาลหัวหน้า</b>ในล็อบบี้รักษาให้ฟรี · ชั้น 2 มีเตียงขวางทาง <b>เดินชนเพื่อดันเตียง</b> · ระวังพื้นเปียกลื่น</li>
          <li>ในวอร์ดชั้น 2 เจอ <b>น้องพยาบาล น้องหมอ</b> ชวนเข้าแก๊งได้ด้วย <b>ขนมปังสังขยา</b> (ตลาดเช้า/ร้านขายยา) · กลางคืนผีพยาบาลออกเยอะ</li></ul>`);
      }
      if (map === 'kku' && !F().kku_arrived) {
        F().kku_arrived = true;
        const kid = S().party.find((m) => G.DATA.species[m.sp].kind === 'kid');
        await say('โห! นี่เหรอมหาวิทยาลัย ตึกใหญ่กว่าวัดบ้านเราอีก!', kid ? kid.name : S().name);
        await G.tip('tip_kku', `<div class="choice-title">มหาวิทยาลัยขอนแก่น · คณะวิศวะ</div><ul class="howto">
          <li><b>หญ้ารก</b> เดินแล้วเจอ <b>น้องวิศวะ</b> 6 สาขา แต่ละคนชื่อและหน้าตาไม่ซ้ำกัน · ชวนเข้าแก๊งด้วย <b>คูปองหมูกระทะ</b> ได้ผลดีกว่าข้าวเหนียว</li>
          <li><b>ทุกตึกเดินเข้าได้</b> โรงอาหาร (น้ำปั่นอิงอิง) ร้านหมูกระทะ หอพัก (พัก/บันทึก/คลังแก๊ง) ตึกเรียน</li>
          <li><b>โรงช็อป</b> คือยิม 2 ของพี่เฟรนด์ ต้องชนะพี่ว้ากสองคนหน้าประตูก่อน</li>
          <li><b>ทีม</b> คนแรกในทีมจะเดินตามและลงสู้ก่อน เปลี่ยนได้ที่เมนูทีม › ให้เดินตาม</li></ul>`);
      }
      if (map === 'kku_shop' && !F().shop_entered) {
        F().shop_entered = true;
        await say('ในโรงช็อปมืดตึ๊ดตื๋อ... ไฟดับทั้งตึก!');
        await say('เดี๋ยวเราเปิดไฟฉายให้ ห้องคัตเอาต์น่าจะอยู่ทางซ้ายบน ต้องไปสับไฟให้ติดครบ ประตูเหล็กข้างหลังถึงจะเปิด', has('am') ? 'แอม' : S().name);
      }
    },
    // ---------- บ้านเรา ----------
    async mom() {
      if (!F().starter_chosen) { await say('รีบไปศาลากลางบ้านเถอะลูก ผู้ใหญ่บ้านรออยู่', 'แม่'); return; }
      await say('กลับมาแล้วเหรอลูก แม่จัดข้าวเหนียวกับไก่ย่างให้กินจนอิ่ม', 'แม่');
      await fullHeal('ทุกคนกลับมาแข็งแรงเต็มที่!');
      if (await G.ui.confirm('จะบันทึกเกมไหม?')) { if (await G.ui.saveMenu()) await say('บันทึกเกมแล้ว'); }
    },
    async bed() {
      await say('นอนพักแป๊บนึง... ฟี้~');
      await fullHeal();
      if (await G.ui.confirm('จะบันทึกเกมไหม?')) { if (await G.ui.saveMenu()) await say('บันทึกเกมแล้ว'); }
    },
    async tv() {
      const news = F().gym1_done ? 'ข่าวภาคค่ำ: "เด็กประถมจากบ้านโนนสะอาด ชนะแก๊งร้านราเมงที่ตลาดนัด!" ...หน้าเราออกทีวีด้วย!'
        : F().boss1_done ? 'ข่าวภาคค่ำ: "ฝนตกครั้งแรกในรอบสามเดือนที่บ้านโนนสะอาด"' : 'พยากรณ์อากาศ: "ภาคอีสานยังแล้งต่อเนื่อง ฝนไม่ตกอีกหลายวัน"';
      await say(news);
    },
    // ---------- ศาลากลางบ้าน ----------
    async elder() {
      if (F().gym1_done && !F().festival_done) { await SCRIPTS.festival(); return; }
      if (F().starter_chosen) {
        if (!F().boss1_done) await say('ได้ยินว่าคางคกตัวใหญ่ไปนั่งขวางทางน้ำที่หนองใหญ่ในทุ่ง ฝนถึงได้ไม่ตก ฝากด้วยนะ', 'ผู้ใหญ่บ้านสมบัติ');
        else if (!F().gym1_done) await say('ฝนตกแล้ว! ขอบใจหลายๆ เลย ทางไปตลาดนัดตำบลเปิดแล้วนะ ระวังแก๊งนักเลงด้วย', 'ผู้ใหญ่บ้านสมบัติ');
        else await say('ลุงสองแถวที่ตลาดนัดรอพาไปขอนแก่นอยู่ ไปให้ไกลกว่าที่ลุงเคยไปนะหลาน', 'ผู้ใหญ่บ้านสมบัติ');
        return;
      }
      await G.ui.sayAll(['มาแล้วเหรอ เข้ามาๆ', 'ฝนไม่ตกมาสามเดือน นาแห้งหมด แถมผีสางยังออกมาป่วนทุ่งทุกคืน',
        'ผู้ใหญ่อย่างเราสู้ผีไม่ไหวหรอก ผีสางมันไม่กลัวผู้ใหญ่ มันกลัวเด็กซนๆ',
        'เลยอยากให้เจ้าตั้งแก๊งเด็กไปจัดการ เด็กสี่คนนี้อาสามาแล้ว', 'เลือกมาหนึ่งคนเป็นคู่หู ที่เหลือเดี๋ยวก็ตามไปช่วยเอง'], 'ผู้ใหญ่บ้านสมบัติ');
      for (;;) {
        const i = await G.ui.choose(KIDS.map((k) => ({ icon: k, label: G.DATA.species[k].name, sub: G.TYPE_TH[G.DATA.species[k].type] })),
          { title: 'เลือกคู่หูคนแรก', cls: 'starter', cancel: false, info: (j) => G.DATA.species[KIDS[j]].desc });
        const k = KIDS[i], sp = G.DATA.species[k];
        await G.ui.monInfo(G.makeMon(k, 5, { ivs: 15 }));
        await say(KID_LINES[k][0], sp.name);
        if (await G.ui.confirm(`เลือก${sp.name}เป็นคู่หูใช่ไหม?`)) {
          S().party.push(G.makeMon(k, 5));
          S().starter = k;
          F().starter_chosen = true;
          G.state.follower = true;
          G.sfx('level');
          await say(KID_LINES[k][1], sp.name);
          await say(`${sp.name} เข้าแก๊งแล้ว! (${sp.name}จะเดินตามเราไปทุกที่)`);
          break;
        }
      }
      await say('ไปหาป้านวลที่ศาลา อสม. ถ้าเหนื่อย และแวะร้านป้าสมรด้วยนะ ป้าเขามีของจะให้', 'ผู้ใหญ่บ้านสมบัติ');
      G.refreshNpcs();
      await SCRIPTS.rival();
    },
    // งานบุญบั้งไฟฉลองชนะยิม 1 แล้วเด็กคนที่ 3 เข้าแก๊ง
    async festival() {
      await G.ui.sayAll(['ได้ข่าวแล้ว! ชนะแก๊งพี่ออสซี่ได้ด้วย เก่งแท้ลูกหลานบ้านเรา', 'ตามที่สัญญากับคางคกเจ้าหนองไว้ ทั้งหมู่บ้านเลยจัดบุญบั้งไฟกันคืนนี้',
        'มาๆ หัวหน้าแก๊งจุดลูกแรกเลย!'], 'ผู้ใหญ่บ้านสมบัติ');
      G.music('boss');
      await say('สาม... สอง... หนึ่ง... จุด!');
      await G.playRocket();
      G.rainFor(180);
      await say('บั้งไฟพุ่งทะลุเมฆ แล้วฝนก็โปรยลงมาเย็นฉ่ำทั้งหมู่บ้าน! ไกลๆ ได้ยินเสียงคางคกร้องอ๊บๆ อย่างพอใจ');
      G.music(G.world.def.music);
      await pickKid('member3_joined');   // ปกติเลือกไปแล้วตอนชนะพี่ออสซี่ (กันเซฟเก่า)
      await G.ui.sayAll(['พี่ออสซี่บอกว่าคนต่อไปคือพี่เฟรนด์ หัวโจกวิศวะที่มหาวิทยาลัยขอนแก่น', 'ลุงสองแถวที่ตลาดนัดตำบลวิ่งรถไป มข. ทุกวัน ไปนั่งรถลุงเขาได้เลย',
        'เอานี่ไป ค่าขนมเดินทาง'], 'ผู้ใหญ่บ้านสมบัติ');
      S().money += 500; G.sfx('buy'); await say('ได้รับเงิน 500 บาท');
      F().festival_done = true;
    },
    async kid(n) {
      const k = n.look;
      await say(KID_LINES[k][Math.floor(G.rng() * 2)], G.DATA.species[k].name);
    },
    async rival() {
      if (F().rival1_done) return;
      await say('เดี๋ยวก่อน! ได้ข่าวว่าบ้านนี้ตั้งแก๊งเด็กเหรอ', 'โจ้ แก๊งบ้านเหนือ');
      await say('แก๊งบ้านเหนือชวนผีได้ก่อนพวกแกตั้งนาน ลองหน่อยไหมล่ะ!', 'โจ้ แก๊งบ้านเหนือ');
      const sp = COUNTER[S().starter];
      const r = await G.runBattle([G.makeMon(sp, 4)], { kind: 'trainer', trainerName: 'โจ้ แก๊งบ้านเหนือ', trainerLook: 'rival', money: 50 });
      F().rival1_done = true;
      if (r === 'win') await say('เชอะ! ฟลุคแหละ คราวหน้าไม่ยอมแน่! เดี๋ยวไปดักรอที่ทุ่งนา!', 'โจ้ แก๊งบ้านเหนือ');
      else { await say('ฮ่าๆ แก๊งบ้านใต้ก็แค่นี้! ไปฝึกมาใหม่นะ!', 'โจ้ แก๊งบ้านเหนือ'); G.heal(); await say('(ป้านวลวิ่งมาช่วยทายาให้ทุกคน)'); }
      G.refreshNpcs();
    },
    // ---------- ร้านค้า บ้านเพื่อน ----------
    async samorn() {
      if (F().starter_chosen && !F().gift_rice) {
        await say('อ้าว ได้ข่าวว่าตั้งแก๊งแล้วนี่ เอานี่ไป ข้าวเหนียวปั้น ไว้ถวายผีสางให้มันเชื่อง', 'ป้าสมร');
        await give('rice_ball', 5); F().gift_rice = true;
        await say('ผีสางมันก็หิวเหมือนคนนั่นแหละ ตีให้มันอ่อนแรงก่อน แล้วค่อยยื่นข้าวให้ มันจะยอมตามมา', 'ป้าสมร');
      }
      await say('ร้านชำป้าสมร มีอะไรให้ช่วยจ๊ะ', 'ป้าสมร');
      const stock = ['rice_ball', 'herb', 'holy_water', 'magic_rice'];
      if (F().boss1_done) stock.splice(1, 0, 'rice_pork', 'kafae');
      if (F().gym1_done) stock.push('yahom');
      await G.ui.shop(stock, 'ป้าสมร');
      await say('ขอบใจหลายจ้า', 'ป้าสมร');
    },
    async nual() { await say('มาๆ ป้าทายาหม่องให้ แป๊บเดียวหาย', 'ป้านวล อสม.'); await fullHeal('ทุกคนกลับมาแข็งแรงเต็มที่!', 'ป้านวล อสม.'); },
    async osm_bed() { await say('นอนพักบนเตียง อสม. ป้านวลมาวัดไข้ให้'); await fullHeal(); },
    async teacher() {
      await G.ui.sayAll(['ครูสอนเรื่องธาตุให้ฟังนะ', 'น้ำชนะดิน ดินชนะสายฟ้า สายฟ้าชนะลม และลมชนะน้ำ วนเป็นวงกลม',
        'ตีถูกธาตุแรงเป็นสองเท่า ตีผิดธาตุเหลือครึ่งเดียว ส่วนธาตุปกติไม่แพ้ไม่ชนะใคร',
        'ถ้าใช้ท่าธาตุเดียวกับตัวเอง ยังแรงขึ้นอีกครึ่งเท่าด้วยนะ'], 'ครูบุญมี');
    },
    async blackboard() { await say('บนกระดานเขียนว่า: น้ำ › ดิน › สายฟ้า › ลม › น้ำ  (ตีถูกธาตุแรง 2 เท่า) และ "การบ้าน: ชวนผีสางมาให้ครูดูหนึ่งตัว"'); },
    async classmate() { await say('วันเสาร์ยังต้องมาโรงเรียน... ครูให้มาทำเวรรดน้ำต้นไม้อะ', 'เด็กนักเรียนต่าย'); },
    async monk() {
      await G.ui.sayAll(['สมัยก่อนมีพญาคางคกผู้รบชนะพญาแถน จนพญาแถนสัญญาว่าจะส่งฝนมาทุกปี',
        'ชาวบ้านจึงจุดบั้งไฟขึ้นฟ้าเตือนพญาแถนทุกต้นฤดูฝน', 'ปีนี้ไม่มีใครจุดบั้งไฟ ได้ยินว่าคางคกที่หนองใหญ่เลยงอนนั่งขวางทางน้ำ',
        'ถ้าไปเจอ ลองคุยดีๆ ก่อนนะหลาน'], 'หลวงตา');
      F().legend_heard = true;
      if (F().boss1_done && !F().yantra_given) {
        await say('หลานช่วยให้ฝนตกได้ หลวงตาให้ผ้ายันต์ผืนนี้ไว้ป้องกันตัว ให้เพื่อนในแก๊งถือไว้ ผีสางจะตีเบาลง', 'หลวงตา');
        await give('yantra', 1); F().yantra_given = true;
      }
    },
    async novice(n) {   // ฝากเลี้ยงที่วัด: เดินไปเรื่อยๆ ลูกทีมที่ฝากไว้ได้ EXP เอง (สูงสุด 2 ตัว)
      const D = (S().daycare = S().daycare || []), nm = n ? n.name : 'เณรน้อย';
      const gain = (d) => Math.floor((S().steps - d.steps) * 8);
      // ไข่ผี: มีผีฝากอยู่และเดินครบ 400 ก้าวนับจากฝาก/ไข่ใบก่อน เณรเจอไข่ในลานวัด (พกได้ 3 ใบ ไม่ได้จากคน เด็ก หรือผีในตำนาน)
      const ghost = D.find((d) => G.canEgg(d.mon.sp));
      if (ghost && S().steps - Math.max(ghost.steps, S().eggCheck || 0) >= 400 && (S().eggs || []).length < 3) {
        S().eggCheck = S().steps;
        const base = G.eggBase(ghost.mon.sp), mv = ghost.mon.moves[Math.floor(G.rng() * ghost.mon.moves.length)];
        (S().eggs = S().eggs || []).push({ sp: base, steps: S().steps, move: mv && mv.id, from: ghost.mon.name });
        S().bag.ghost_egg = S().eggs.length;
        await G.ui.sayAll([`{shock}เมื่อเช้าเณรกวาดลานวัด เจอไข่ลายแปลกๆ อยู่ข้างๆ ${ghost.mon.name}!`, 'ฝากเด็กๆ ช่วยพกไว้หน่อยนะ เดินไปเรื่อยๆ เดี๋ยวก็ฟัก'], nm);
        await G.ui.itemGet('ghost_egg', 1);
      }
      const opts = ['ฝากลูกทีมไว้ที่วัด', ...D.map((d) => `รับ${d.mon.name}คืน (+${gain(d)} EXP)`), 'ไม่เป็นไร'];
      const i = await G.ui.ask(D.length ? `ลูกทีมที่ฝากไว้ช่วยกวาดลานวัดทุกวันเลย เดินไปเยอะๆ เขาก็เก่งขึ้นเอง` : 'ฝากลูกทีมไว้กับเณรได้นะ ช่วยงานวัดไปด้วย ฝึกตัวไปด้วย พี่เดินทางไกลแค่ไหน เขาก็เก่งขึ้นตามนั้น', nm, opts, { cls: 'small' });
      if (i === 0) {
        if (D.length >= 2) { await say('ฝากได้ทีละสองคนเท่านั้นนะ', nm); return; }
        if (S().party.length <= 1) { await say('ต้องเหลือเพื่อนเดินทางอย่างน้อยหนึ่งคนนะ', nm); return; }
        const t = await G.ui.partyMenu({ pick: true, title: 'ฝากใครไว้ที่วัด?' }); if (t < 0) return;
        const m = S().party.splice(t, 1)[0]; D.push({ mon: m, steps: S().steps }); G.sfx('door');
        await say(`ฝาก${m.name}ไว้แล้ว เดินไปเยอะๆ แล้วค่อยกลับมารับนะ`, nm);
      } else if (i > 0 && i <= D.length) {
        if (S().party.length >= 6) { await say('ทีมเต็มอยู่ ฝากใครไว้ในคลังก่อนนะ', nm); return; }
        const d = D.splice(i - 1, 1)[0], g = gain(d); S().party.push(d.mon); G.addFriend(d.mon, 10);
        await say(`${d.mon.name}กลับมาแล้ว! ช่วยงานวัดจนสดชื่นเลย`, nm);
        if (g > 0) await G.ui.giveExp(d.mon, g);
      } else await say('หลวงตาบอกว่าถ้าตั้งใจไหว้พระ จิตใจจะสงบ สู้ผีก็ไม่กลัว', nm);
    },
    async egg_hatch(egg) {   // ไข่ผีฟัก: เลเวล 5 ได้ท่าของพ่อแม่ติดมาหนึ่งท่า โอกาสสีพิเศษ ×2
      await G.ui.sayAll(['{shock}เอ๊ะ! ไข่ผีในกระเป๋าขยับดุ๊กดิ๊ก...', '...แตกแล้ว!']);
      const m = G.makeMon(egg.sp, 5, { nature: 'random' });
      if (egg.move && !m.moves.some((x) => x.id === egg.move) && G.DATA.moves[egg.move]) { const slot = { id: egg.move, pp: G.DATA.moves[egg.move].pp }; if (m.moves.length < 4) m.moves.push(slot); else m.moves[3] = slot; }
      if (G.rng() < G.shinyOdds(egg.sp, G.state.map) * 2) m.shiny = true;
      m.friend = 120; S().dex[egg.sp] = 2; if (m.shiny) (S().shinyDex = S().shinyDex || {})[egg.sp] = 1;
      G.sfx('level'); G.stat('hatched');
      await say(`${m.shiny ? '✨ ' : ''}${m.name} ฟักออกมาแล้ว!${egg.move ? ` ติดท่า${G.DATA.moves[egg.move].name}มาจาก${egg.from}ด้วย` : ''}`);
      if (S().party.length < 6) S().party.push(m); else { S().storage.push(m); await say(`ทีมเต็ม ${m.name} ไปรออยู่ในคลังแก๊ง`); }
    },
    async altar() { await say('ไหว้พระสามครั้ง... จิตใจสงบลง ทุกคนสดชื่นขึ้น'); G.state.party.forEach((m) => { m.status = null; }); G.sfx('heal'); },
    async jam() {
      if (!F().gym3_done) { await say('บ่ได้ดอกหลาน ปู่ตาบ่ให้เข้า ไว้มีบุญค่อยมา', 'เฒ่าจ้ำ'); return; }
      if (!F().putata_asked) {
        await G.ui.sayAll(['ตราหูฟังนี่... หลานได้มาจากหมอบูมใช่ไหม ปู่ตาอนุญาตให้หลานเข้าดอนได้แล้ว',
          '{sad}แต่ช่วงนี้เฒ่าฝันร้ายทุกคืน ได้ยินเสียงเลื่อยดังมาจากในดอน... มีคนแอบเข้าไปตัดไม้',
          'ผีที่อาศัยต้นไม้ในดอนเลยหนีกระจัดกระจาย บางตัวหนีไปไกลถึงโรงพยาบาลอำเภอ',
          'เฒ่าแก่แล้ว เดินขึ้นดอนไม่ไหว หลานช่วยไปหาปู่ตาที่ตูบกลางดอนหน่อยนะ ทางขึ้นอยู่ข้างหลังเฒ่านี่แหละ'], 'เฒ่าจ้ำ');
        await startQuest('s_putata'); return;
      }
      if (!F().putata_done) await say('เดินขึ้นไปตามทางดินแดงข้างศาล ปู่ตารออยู่ที่ตูบกลางดอน', 'เฒ่าจ้ำ');
      else await say('{happy}ป่าดอนปู่ตากลับมาเขียวแล้ว ผีในดอนก็กลับบ้านกันหมด ขอบใจหลานๆ นะ', 'เฒ่าจ้ำ');
    },
    // ---------- ดอนปู่ตา: ไล่คนตัดไม้ ป่าฟื้น แม่นาคได้เจอลูก ----------
    async puta(n) {
      if (!F().puta_met) {
        await G.ui.sayAll(['{happy}มาแล้วรึ หลานๆ แก๊งเด็กบ้านนา ปู่เฝ้าดูพวกหลานมาตั้งแต่ไล่คางคกเจ้าหนองแล้วนะ',
          'ปู่คือปู่ตา ผีบรรพบุรุษที่เฝ้าดอนนี้กับหมู่บ้านมาหลายร้อยปี',
          '{sad}ช่วงนี้มีคนแปลกหน้าเข้ามาตัดไม้ในดอน ต้นตะเคียนเก่าแก่ล้มไปหลายต้น',
          'ผีที่อาศัยต้นไม้เหล่านั้นไม่มีบ้าน ต้องหนีไปอยู่ในเมือง อยู่ในโรงพยาบาล คนก็ตกใจกันไปหมด',
          'ร้ายกว่านั้น พวกมันจับผีน้อยไปใช้สู้ด้วย ใต้หนองกลางดอนยังมีแม่นาคหลับอยู่ เสียงเลื่อยทำให้นางหลับไม่สนิทเลย',
          '{angry}ปู่ออกไปไล่เองไม่ได้ หลานช่วยไล่คนตัดไม้ทั้งสามคนออกไปจากดอนทีนะ พวกมันอยู่ฝั่งขวาของดอน'], n.name);
        F().puta_met = true; G.refreshNpcs(); return;
      }
      if (!F().loggers_out) { await say('คนตัดไม้ยังอยู่ฝั่งขวาของดอน มีสามคน หัวหน้าเรียกตัวเองว่าเสี่ยเลื่อย ระวังตัวด้วยนะหลาน', n.name); return; }
      if (!F().putata_done) {
        await G.ui.sayAll(['{happy}ได้ยินแล้ว พวกมันวิ่งหนีออกไปหมดแล้ว เก่งมากหลาน', 'ทีนี้ถึงตาปู่บ้าง... หลานๆ ยืนล้อมตูบ แล้วตั้งใจขอให้ป่ากลับมานะ'], n.name);
        await G.fadeTo(() => { F().forest_healed = true; G.refreshNpcs(); });
        G.sfx('heal');
        await G.ui.sayAll(['ลมเย็นพัดผ่านดอน... ตอไม้ทุกตอแตกหน่อเขียวขึ้นมา', 'ผีกองกอยกับผีตะเคียนค่อยๆ เดินกลับเข้าป่ามาหาบ้านของตัวเอง', '{shock}ผิวหนองกลางดอนกระเพื่อม... มีอะไรตัวใหญ่ขยับอยู่ใต้น้ำ']);
        await finishQuest('s_putata');
        await G.ui.sayAll(['แม่นาคตื่นแล้ว... นางกำลังร้องหาลูก', 'เมื่อหลายปีก่อน ลูกนาคของนางพลัดหลงไปตามลำน้ำพอง หลานลองไปตกปลาแถวริมพองดู อาจได้เจอ', 'ถ้าเจอแล้ว พามาให้แม่เขาเห็นหน้าหน่อยนะ'], n.name);
        await startQuest('s_naga'); return;
      }
      await say(F().naga_done ? '{happy}ดอนกลับมาร่มเย็นแล้ว ปู่จะเฝ้าหมู่บ้านต่อไป หลานไปไหนมาไหนปู่ก็มองอยู่นะ' : 'แม่นาครออยู่ที่หนองกลางดอน ลูกนาคน่าจะอยู่แถวลำน้ำพอง ตกปลาดูนะหลาน', n.name);
    },
    async loggers_check() {
      const left = ['tr_logger1', 'tr_logger2', 'tr_logboss'].filter((f) => !F()[f]).length;
      if (left) { await say(`ยังมีคนตัดไม้เหลืออีก ${left} คน`); return; }
      if (F().loggers_out) return;
      F().loggers_out = true; G.sfx('alert');
      await G.fadeTo(() => G.refreshNpcs());
      await G.ui.sayAll(['คนตัดไม้ทั้งหมดเก็บเลื่อยวิ่งหนีออกจากดอนไปแล้ว', 'ผีที่ถูกจับมาก็หลุดเป็นอิสระ หนีกลับเข้าป่าไป', 'กลับไปบอกปู่ตาที่ตูบกลางดอนกันเถอะ']);
    },
    async naga_mom(n) {
      if (F().naga_done) { await say(F().naga_kept ? '{happy}ลูกแม่อยู่กับพวกเจ้าแล้วสดใสดี แม่ฝากลูกด้วยนะ' : '{happy}ลูกแม่กลับมาบ้านแล้ว เดินผ่านลำน้ำพองเมื่อไร แม่จะคอยคุ้มครองพวกเจ้า', n.name); return; }
      const i = S().party.findIndex((m) => m.sp === 'nak');
      if (i < 0) {
        await say('งูใหญ่เกล็ดสีฟ้าทองขดตัวอยู่ริมหนอง มงกุฎบนหัวส่องประกาย');
        await say('{sad}ลูกแม่... ลูกแม่อยู่ไหน...', n.name);
        await say(has('nak') ? 'นาคน้อยอยู่ในคลังแก๊ง ต้องพาเข้าทีมก่อนถึงจะพามาหาแม่ได้' : 'ลูกนาคพลัดหลงไปแถวลำน้ำพอง ลองไปตกปลาที่ริมพองดู ถ้าโชคดีจะเจอ');
        return;
      }
      const m = S().party[i];
      await G.ui.sayAll([`{shock}${m.name} ส่งเสียงร้องเล็กๆ แล้วเลื้อยออกไปหาแม่นาค`, 'แม่นาคก้มหัวลงมาแตะลูกเบาๆ น้ำตาเป็นประกายไหลลงหนอง']);
      await G.ui.sayAll(['{happy}ลูกแม่... ลูกแม่จริงๆ ด้วย ขอบใจเด็กๆ ที่ดูแลลูกแม่มาอย่างดี', 'ลูกแม่ดูมีความสุขกับพวกเจ้ามาก แม่ให้พวกเจ้าเลือก จะให้ลูกกลับมาอยู่บ้าน หรือไปผจญภัยกับพวกเจ้าต่อ'], n.name);
      const pick = await G.ui.ask('ให้นาคน้อยทำยังไงดี?', n.name, ['ให้น้องกลับไปอยู่กับแม่', 'ให้น้องอยู่กับแก๊งต่อ']);
      if (pick === 0) {
        if (S().party.length === 1) { await say('แต่ในทีมเหลือนาคน้อยคนเดียว... พาเพื่อนคนอื่นเข้าทีมก่อนแล้วค่อยมานะ'); return; }
        S().party.splice(i, 1);
        await G.ui.sayAll([`${m.name} หันมามองแก๊งเป็นครั้งสุดท้าย แล้วดำลงหนองไปกับแม่`, '{happy}"ขอบคุณที่ดูแลหนูนะ" เสียงเล็กๆ ดังขึ้นมาจากใต้น้ำ']);
        await say('แม่ขอให้เกล็ดนี้ไว้แทนคำขอบคุณ ใครถือไว้ ท่าธาตุน้ำจะแรงขึ้น', n.name);
      } else {
        F().naga_kept = true;
        await say(`${m.name} เลื้อยวนรอบแม่หนึ่งรอบ แล้วกลับมาอยู่ข้างแก๊งเหมือนเดิม`);
        await say('{happy}ลูกแม่เลือกพวกเจ้าแล้ว... แม่ฝากลูกด้วย รับเกล็ดนี้ไว้ ให้ลูกถือไว้ ท่าน้ำจะแรงขึ้น', n.name);
      }
      await give('naga_scale', 1);
      await fullHeal('แม่นาคพ่นละอองน้ำใสๆ ใส่ทุกคน ทุกคนฟื้นพลังเต็มที่!');
      await finishQuest('s_naga');
    },
    async ghost_back(n) { await say(n.id === 'ghost_back' ? '{happy}กองกอยได้กลับบ้านแล้ว! ขอบใจเด็กๆ นะ ทีนี้จะไม่ไปหลอกคนที่โรงพยาบาลอีกแล้ว' : '{happy}ต้นของข้าแตกหน่อใหม่แล้ว... อีกร้อยปีคงสูงเท่าเดิม ข้ารอได้', n.name); },
    async puta_shrine() {
      await say('ตูบไม้หลังเล็ก มีช้างม้าดินปั้นกับพวงมาลัยวางอยู่ ยกมือไหว้ปู่ตา...');
      if (F().forest_healed) { S().party.forEach((m) => { m.status = null; }); G.sfx('heal'); await say('รู้สึกอบอุ่นเหมือนมีคนลูบหัว ทุกคนหายจากอาการผิดปกติ'); }
    },
    async naga_pond() { await say(F().forest_healed ? 'หนองน้ำใสจนเห็นเกล็ดสีฟ้าทองสะท้อนแสงอยู่ใต้น้ำ' : 'ผิวน้ำนิ่งสนิท แต่มีฟองอากาศผุดขึ้นมาเป็นระยะ... เหมือนมีอะไรตัวใหญ่หายใจอยู่ใต้น้ำ'); },
    async tasi() {
      if (!F().starter_chosen) { await say('เด็กน้อย เถียงนาตาสีเอาไว้ฝากผีสางที่ชวนมาได้นะ', 'ตาสี'); return; }
      if (!F().catch_tutorial) {
        await G.ui.sayAll(['ได้ยินว่าตั้งแก๊งแล้วเหรอ ตาสอนชวนผีให้', 'เจอผีสางในนาข้าว ให้ตีจนมันเหลือแรงน้อยๆ',
          'แล้วเปิดกระเป๋า ถวายข้าวเหนียวปั้น ถ้ามันหลับหรือชาอยู่ยิ่งชวนง่าย', 'ทีมมีได้หกคน ที่เกินมาตาเลี้ยงไว้ให้ในไหในเถียงนานี่ เข้าไปจัดทีมได้ตลอด'], 'ตาสี');
        await give('rice_ball', 3);
        F().catch_tutorial = true;
      } else if (F().lunch_got && !F().lunch_done) {
        await say('ข้าวห่อจากแม่เติ้ลเหรอ! หอมไก่ย่างจัง ขอบใจหลายหลาน เอานี่ไปใช้ยามจำเป็น', 'ตาสี');
        await finishQuest('s_lunch');
      } else await say('สมาชิกที่ฝากไว้ตาดูแลอย่างดี เข้าไปในเถียงนาแล้วเปิดไหดูได้เลย', 'ตาสี');
    },
    async storage() { await G.ui.storageMenu(); G.refreshNpcs(); },
    async beedad() {
      if (!F().starter_chosen) { await say('ควายของลุงนอนขวางทางลงทุ่งแน่ะ เดี๋ยวค่อยไปจูงออก', 'พ่อบี'); return; }
      if (!F().field_open) {
        await say('จะลงทุ่งไปปราบผีเหรอ เก่งแท้ลูกหลานบ้านเรา! เดี๋ยวลุงไปจูงควายออกให้', 'พ่อบี');
        F().field_open = true; G.refreshNpcs(); G.sfx('level');
        await say('ทางลงทุ่งนาเปิดแล้ว!');
      } else if (F().boss1_done && !F().calf_asked) {
        await G.ui.sayAll(['ฝนตกแล้วดีใจจนลืมดูควาย... เจ้าทองลูกควายของลุงหลุดเชือกวิ่งเข้าทุ่งไปแล้ว!', 'หลานช่วยตามหาให้หน่อยได้ไหม มันชอบไปยืนแถวคันนาฝั่งขวา'], 'พ่อบี');
        await startQuest('s_calf');
      } else if (F().calf_asked && !F().calf_found) await say('เจ้าทองน่าจะอยู่แถวคันนาฝั่งขวาของทุ่ง ฝากด้วยนะหลาน', 'พ่อบี');
      else if (F().calf_found && !F().calf_done) {
        await say('เจ้าทอง! กลับมาแล้ว! ขอบใจหลายๆ เลยหลาน รับนี่ไปเป็นค่าเหนื่อย', 'พ่อบี');
        await finishQuest('s_calf'); G.refreshNpcs();
      } else if (F().calf_done && !S().bag.bike) {
        await say('เจ้าทองโตแล้ว ลุงไม่ได้ใช้จักรยานไปต้อนควายแล้ว หลานเอาไปปั่นเถอะ ไปไหนมาไหนจะได้ไว', 'พ่อบี');
        await give('bike', 1); await say('กด C เพื่อขึ้น/ลงจักรยาน ใช้ได้ในที่โล่ง');
      } else await say('ระวังผีโพงตอนกลางคืนนะ มันชอบออกมาตอนมืด', 'พ่อบี');
    },
    async calf() {
      await say('มอ~ ลูกควายเจ้าทองเดินมาดุนมือ แล้วยอมเดินตามกลับบ้าน');
      F().calf_found = true; G.refreshNpcs(); G.sfx('level');
      await say('พาเจ้าทองกลับไปหาพ่อบีที่บ้านกันเถอะ');
    },
    async buffalo() { await say('ควายนอนเคี้ยวเอื้องขวางทาง ไม่ยอมลุก... ลองไปถามพ่อบีที่บ้านดู'); },
    async bee_mom() { await say(has('bee') ? 'บีอยู่ในแก๊งเหรอ ฝากดูแลด้วยนะ เดี๋ยวมันลืมกินข้าว' : 'บีไปเล่นที่ศาลา ไม่รู้ไปไหนต่อ เด็กคนนี้!', 'แม่บี'); },
    async am_dad() {
      if (F().gym1_done && !F().goggles_given) {
        await say('ได้ข่าวว่าจะไปมหาลัยขอนแก่น พ่อเคยเรียนวิศวะที่นั่นนะ เอานี่ไป แว่นเซฟตี้ของพ่อสมัยเรียน', 'พ่อแอม');
        await give('goggles', 1); F().goggles_given = true;
        await say('ให้ใครถือไว้ก็ได้ ท่าพิเศษจะแรงขึ้น ไปเจอโรงช็อปแล้วจะรู้ว่าทำไมต้องใส่', 'พ่อแอม');
      } else await say('ร้านซ่อมมือถือพ่อแอม ซ่อมได้ทุกยี่ห้อ ยกเว้นยี่ห้อที่ผีสิง', 'พ่อแอม');
    },
    async am_pc() { await say(has('am') ? 'หน้าจอคอมพ์มีไฟล์ชื่อ "แผนพิชิตยิมทั้งสี่.xlsx" ...แอมเตรียมไว้ตั้งแต่เมื่อไหร่เนี่ย' : 'หน้าจอคอมพ์เปิดเกมจับมอนสเตอร์ค้างไว้'); },
    async tle_mom() {
      if (F().boss1_done && !F().lunch_got) {
        await say('ฝากเอาข้าวห่อไก่ย่างไปให้ตาสีที่เถียงนาหน่อยได้ไหมจ๊ะ แกเฝ้าผีให้ทั้งวันคงหิวแย่', 'แม่เติ้ล');
        await startQuest('s_lunch');
      }
      if (F().boss1_done && (await G.ui.ask('อยากให้แม่ทำอาหารอีสานให้ไหม? เอาวัตถุดิบที่ผีทำหล่นมาให้แม่สิ', 'แม่เติ้ล', ['ทำอาหาร', 'คุยเฉยๆ'])) === 0) { await SCRIPTS.cook_menu(); return; }
      if (F().boss1_done) { await say('ส้มตำแม่เติ้ลแซ่บที่สุดในหมู่บ้าน! วันนี้มีข้าวเหนียวหมูปิ้งด้วยนะ', 'แม่เติ้ล'); await G.ui.shop(['rice_pork', 'herb', 'herb_big'], 'แม่เติ้ล'); }
      else await say('ส้มตำปลาร้าต้องรอฝนตกก่อน มะละกอแห้งหมดแล้ว', 'แม่เติ้ล');
    },
    // ครัวแม่เติ้ล: วัตถุดิบจากผีป่า → อาหารบัฟ 150 ก้าว (ทีละอย่าง)
    async cook_menu() {
      const R = [
        ['แกงหน่อไม้', { bamboo_shoot: 2, snail: 1 }, 'exp', 'EXP ×1.5'], ['ก้อยไข่มดแดง', { red_ant_egg: 2, phak_wan: 1 }, 'shiny', 'เจอผีสีพิเศษ ×2'],
        ['หมกหอยขม', { snail: 2, bamboo_shoot: 1 }, 'lure', 'เจอผีบ่อยขึ้น ×1.5'], ['จิ้งหรีดทอด', { cricket: 2, phak_wan: 1 }, 'money', 'เงินรางวัล ×1.5'],
        ['ข้าวเหนียวแจ่วบอง', { bamboo_shoot: 1, red_ant_egg: 1, snail: 1, cricket: 1 }, 'feast', 'ฟื้นทีมเต็ม + สนิทกันมากขึ้น'],
      ];
      const I = G.DATA.items, has = (need) => Object.entries(need).every(([k, n]) => (S().bag[k] || 0) >= n);
      const i = await G.ui.choose(R.map(([nm, need, , fx]) => ({ label: nm, sub: fx, disabled: !has(need) })), { title: 'ครัวแม่เติ้ล', cls: 'bag',
        info: (k) => 'ใช้ ' + Object.entries(R[k][1]).map(([id, n]) => `${I[id].name} ×${n} (มี ${S().bag[id] || 0})`).join(' · ') + (R[k][2] !== 'feast' ? ' · ได้ผล 150 ก้าว' : '') });
      if (i < 0) return;
      const [nm, need, kind, fx] = R[i];
      for (const [k, n] of Object.entries(need)) S().bag[k] -= n;
      G.sfx('heal');
      if (kind === 'feast') { G.heal(); S().party.forEach((m) => G.addFriend(m, 8)); await say(`{happy}${nm}ร้อนๆ มาแล้ว! กินกันทั้งแก๊ง ทุกคนอิ่มแปล้ แข็งแรงเต็มที่ แล้วก็สนิทกันขึ้นอีก`, 'แม่เติ้ล'); return; }
      S().buff = { kind, steps: 150 };
      await say(`{happy}${nm}เสร็จแล้ว! กินแล้วไปลุยต่อ (${fx} อีก 150 ก้าว)`, 'แม่เติ้ล');
    },
    async trade(n) {   // แลกผีกับ NPC: ตัวที่ได้มา EXP ×1.5
      const T = { trade_tom: { want: 'kongkoi', give: 'krahang', lv: 12, name: 'เจ้าแหลม', flag: 'trade_tom', hi: 'อยากได้ผีกองกอยมาเลี้ยงจัง! เอาผีกระหังของต้อมไปแลกไหม? ต้อมตั้งชื่อว่าเจ้าแหลม' },
        trade_city: { want: 'phong', give: 'nangngueak', lv: 26, name: 'น้องเงือก', flag: 'trade_city', hi: 'พี่สะสมผีแสงไฟ ขาดแต่ผีโพง! แลกกับนางเงือกน้อยของพี่ไหม ชื่อน้องเงือก' } }[n.id];
      if (F()[T.flag]) { await say('เลี้ยงเจ้าตัวนั้นดีๆ นะ มันชอบคนใจดี', n.name); return; }
      const idx = S().party.findIndex((m) => m.sp === T.want);
      await say(T.hi, n.name);
      if (idx < 0) { await say(`(ต้องมี${G.DATA.species[T.want].name}อยู่ในทีม)`); return; }
      if (!(await G.ui.confirm(`แลก${S().party[idx].name}กับ${T.name}ไหม?`, n.name))) return;
      const got = G.makeMon(T.give, T.lv, { nature: 'random', name: T.name }); got.traded = true; got.friend = 120;
      S().party.splice(idx, 1, got); F()[T.flag] = true; G.state.dex[T.give] = 2; G.sfx('level');
      await say(`แลกกันแล้ว! ${T.name}มาอยู่กับแก๊ง (ผีที่ได้จากการแลกได้ EXP ×1.5)`);
    },
    async raid_den(o) {   // ลานผียักษ์: วันละแมพ บอสเลือดสองเท่า มีโล่ ชนะแล้วชวนได้
      const key = 'raid_' + G.gameDay();
      if (G.raidMap() !== S().map || F()[key]) { await say('ลานดินว่างเปล่า มีรอยเท้าใหญ่ๆ ทิ้งไว้... (ผียักษ์จะมาวันละที่ ดูแสงม่วงวนเหนือลาน)'); return; }
      const E = G.DATA.encounters[S().map] || [], sp0 = E.length ? E[Math.floor(G.rng() * E.length)].sp : 'pob';
      const evo = (G.DATA.species[sp0].evo || '').split(':')[0], sp = evo || sp0, lv = Math.min(100, Math.max(...S().party.map((m) => m.lv)) + 3);
      await G.ui.sayAll([`{shock}แสงม่วงพุ่งขึ้นจากลาน... ${G.DATA.species[sp].name}ตัวยักษ์ปรากฏตัว!`, 'ผียักษ์มีพลังเยอะกว่าปกติสองเท่า และจะตั้งโล่วิญญาณเมื่อเลือดลด']);
      if (!(await G.ui.confirm('สู้กับผียักษ์ไหม?'))) return;
      const boss = G.makeMon(sp, lv, { ivs: 25, nature: 'random' }); boss.stats.hp *= 2; boss.hp = boss.stats.hp;
      const r = await G.runBattle([boss], { kind: 'boss', trainerName: `${G.DATA.species[sp].name}ยักษ์`, trainerLook: G.DATA.species[sp].look, ai: 2, raid: true, money: 800 });
      if (r === 'lose') { await blackout(); return; }
      if (r !== 'win') return;
      F()[key] = true;
      const ings = Object.keys(G.DATA.items).filter((k) => G.DATA.items[k].kind === 'ingr');
      for (let k = 0; k < 3; k++) { const ig = ings[Math.floor(G.rng() * ings.length)]; S().bag[ig] = (S().bag[ig] || 0) + 1; }
      await say('ผียักษ์สลายเป็นละอองแสง ทิ้งวัตถุดิบไว้ 3 ชิ้น!');
      if (await G.ui.confirm(`${G.DATA.species[sp].name}ตัวจริงที่ซ่อนอยู่ข้างในเดินออกมา อยากเข้าแก๊งด้วย ชวนไหม?`)) {
        const m = G.makeMon(sp, Math.max(5, lv - 5), { nature: 'random' }); if (S().party.length < 6) S().party.push(m); else S().storage.push(m); G.state.dex[sp] = 2; G.sfx('level');
        await say(`${m.name}เข้าแก๊งแล้ว!${S().party.includes(m) ? '' : ' (ทีมเต็ม ไปรออยู่ในคลังแก๊ง)'}`);
      }
    },
    async ter_yai() {
      if (!F().yai_gift) { await say('เต๋ออออ! กลับมากินข้าว! ...อ้าว ไม่ใช่เต๋อ เอ้า เอาข้าวเหนียวไปกินแทนก็ได้', 'ยายเต๋อ'); await give('rice_ball', 3); F().yai_gift = true; }
      else await say('ถ้าเจอเต๋อ บอกมันด้วยว่าข้าวเย็นแล้ว!', 'ยายเต๋อ');
    },
    async sign(s) { await say(s.text); },
    async water() { await say('น้ำใสเย็น มีปลาตัวเล็กว่ายไปมา'); },
    async well() { await say('บ่อน้ำประจำหมู่บ้าน ตักน้ำดื่มแล้วสดชื่น'); },
    async repel_end() { await say('ฤทธิ์ข้าวสารเสกหมดแล้ว'); },
    async item(n) {
      F()[n.flag] = true; G.refreshNpcs();
      await give(n.item, 1);
    },
    async trainer(n) {
      if (F()[n.trainer.flag]) { await say(n.trainer.lose, n.trainer.name); return; }
      await trainerBattle(n);
    },
    async trainer_spot(n, dist) {
      G.sfx('alert'); n.alert = 40;
      await G.wait(400);
      const [dx, dy] = G.DIRS[n.dir];
      for (let i = 1; i < dist; i++) { n.x += dx; n.y += dy; await G.wait(140); }
      await trainerBattle(n);
    },
    async wild(sp, lv) {
      if (!F().tip_wild) {
        await G.tip('tip_wild', `<div class="choice-title">เจอผีสางครั้งแรก!</div><ul class="howto">
          <li>เลือก <b>สู้</b> แล้วเลือกท่า ดูช่องล่างว่าท่านั้นได้ผลกับผีตัวนี้ไหม</li>
          <li>อยากชวนเข้าแก๊ง: ตีจนหลอดพลังผีเหลือน้อยๆ แล้วเลือก <b>กระเป๋า</b> › ข้าวเหนียวปั้น</li>
          <li>ถ้าผีหลับหรือชาอยู่ ชวนง่ายขึ้นมาก · สู้ไม่ไหวเลือก <b>หนี</b> ได้</li></ul>`);
      }
      // ผีอ่อนกว่ามาก (และเคยชวนแล้ว): ไล่ไปได้เลยไม่ต้องเข้าฉากสู้ ทั้งแก๊งได้ EXP แบบ Let's Go
      const shiny = !G.isPerson(sp) && G.rng() < G.shinyOdds(sp, S().map);
      const lead = S().party.find((m) => m.hp > 0);
      if (!shiny && G.settings.quickWild !== false && lead && G.state.dex[sp] === 2 && lead.lv >= lv + 8 && !G.DATA.species[sp].kind.match(/eng|med/)) {
        const foe = G.DATA.species[sp].name;
        const i = await G.ui.ask(`${foe} Lv${lv} โผล่มา... แต่ดูกลัว${lead.name}จนตัวสั่น`, '', [`ไล่ไปเลย (ได้ EXP)`, 'สู้ตามปกติ'], { cls: 'small' });
        if (i === 0) {
          const easy = G.settings.easy !== false, gain = G.expGain({ sp, lv }, false) * (easy ? 3 : 1);
          G.sfx('hit'); await say(`${lead.name}ทำหน้าดุใส่ ${foe}หนีหายไปในพงหญ้า! ทั้งแก๊งได้ EXP`);
          for (const m of S().party) if (m.hp > 0 && (m === lead || easy)) await G.ui.giveExp(m, m === lead ? gain : Math.floor(gain / 2), true);
          return;
        }
      }
      const foeMon = G.spawn(sp, lv, { taken: takenNames() }); if (shiny) foeMon.shiny = true;
      const r = await G.runBattle([foeMon], { kind: 'wild' });
      if (r === 'lose') await blackout();
    },
    async follower_talk(m) {
      const sp = G.DATA.species[m.sp];
      if (m.sp === 'ungying') {
        if (G.state.map === 'kku_shop') await say('...พี่เฟรนด์อยู่ในนี้ใช่ไหม ใจเต้นแรงจัง', m.name);
        else await say(['ขอบใจนะที่ให้พี่มาด้วย พี่จะช่วยเต็มที่', 'น้ำปั่นร้านอิงอิง... เมื่อก่อนพี่เฟรนด์ชอบซื้อมาให้ทุกวัน', 'ตรงนี้ลมเย็นดีนะ เหมาะกับนั่งอ่านหนังสือ'][Math.floor(G.rng() * 3)], m.name);
      } else if (FOLLOW_LINES[m.sp]) await say(G.kidLine(m) || FOLLOW_LINES[m.sp][Math.floor(G.rng() * 3)], m.name);
      else if (sp.kind === 'med') await say(MED_LINES[Math.floor(G.rng() * MED_LINES.length)], m.name);
      else if (sp.kind === 'eng') await say(ENG_LINES[Math.floor(G.rng() * ENG_LINES.length)], m.name);
      else if (sp.kind === 'ghost') await say(`(${m.name}ลอยวนรอบตัวอย่างอารมณ์ดี ${m.hp < m.stats.hp / 2 ? 'แต่ดูเหนื่อยๆ นะ' : 'ดูแข็งแรงดี'})`);
      else await say(`${m.name} ยิ้มให้`);
    },
    // ---------- ทุ่งนา ----------
    async toad() {
      await G.ui.sayAll(['อ๊บ... อ๊บ...', 'ใครกล้ามากวนข้า! ปีนี้ไม่มีใครจุดบั้งไฟให้ข้าเลยสักลูก',
        'ข้าไม่ยอมลุกจากทางน้ำนี่หรอก จนกว่าจะมีคนเอาชนะข้าได้!'], 'คางคกเจ้าหนอง');
      const r = await G.runBattle([G.makeMon('toad', 8, { ivs: 20 })], { kind: 'boss', trainerName: 'คางคกเจ้าหนอง', trainerLook: 'toad', ai: 2, money: 200 });
      if (r !== 'win') { await blackout(); return; }
      await G.ui.sayAll(['อ๊บ! เด็กพวกนี้เก่งจริง...', 'ถ้าพวกเจ้าสัญญาว่าจะจุดบั้งไฟให้ข้า ข้าจะลุกให้น้ำไหลลงนา'], 'คางคกเจ้าหนอง');
      await say('สัญญา! ปีนี้หมู่บ้านเราจะจัดบุญบั้งไฟแน่นอน!', S().name);
      F().boss1_done = true; G.refreshNpcs();
      G.rainFor(120); G.sfx('level');
      await say('ฟ้าคำราม แล้วฝนก็เทลงมาเป็นครั้งแรกในรอบสามเดือน!');
      const k = await pickKid('member2_joined');
      await say('ทางคันนาข้ามหนองไปตลาดนัดตำบลเปิดแล้ว ได้ยินว่าแก๊งพี่ออสซี่คุมร้านราเมงที่นั่น...', k ? G.DATA.species[k].name : S().name);
    },
    // ---------- ตลาดนัด ยิม 1 ----------
    async vendor() { await say(F().gym1_done ? 'ตั้งแต่แก๊งพี่ออสซี่เลิกคุมตลาด ลูกชิ้นขายดีขึ้นเท่าตัว!' : 'ตลาดนัดตำบลคึกคักทุกวันเสาร์ แต่ช่วงนี้แก๊งพี่ออสซี่มาเดินคุม ใครก็ไม่กล้าเข้าร้านราเมง', 'พ่อค้าลูกชิ้น'); },
    async vendor2() {
      await say('หมูปิ้งร้อนๆ จ้า ผีสางชอบนัก!', 'แม่ค้าหมูปิ้ง');
      await G.ui.shop(['rice_pork', 'khaotommat', 'khanomkrok', 'plara', 'herb', 'herb_big', 'holy_water', 'kafae', 'yahom'], 'แม่ค้าหมูปิ้ง');
    },
    async curtain_wrong(ct) {
      G.sfx('bump');
      await say('ม่านผืนนี้พาเดินวนไปวนมา... รู้ตัวอีกทีก็กลับมาที่ทางเข้าแล้ว!');
      await G.fadeTo(() => G.loadMap(G.state.map, ct.tx, ct.ty, 'up'));
    },
    async cook() { await say(F().gym1_done ? 'น้ำซุปกระดูกหมูเคี่ยวสิบสองชั่วโมง กินแล้วหายเหนื่อย' : 'ลูกพี่ออสซี่ชอบราเมงน้ำซุปเข้มข้น ถ้าชนะเขาได้ เขาอาจเลี้ยงสักชาม', 'กุ๊กราเมง'); },
    async ossie() {
      if (F().gym1_done) { await say('ราเมงชามนี้พี่เลี้ยงเอง กินให้อร่อยนะน้อง', 'พี่ออสซี่'); await fullHeal('ทุกคนกินราเมงจนอิ่มแปล้ แข็งแรงเต็มที่!'); return; }
      await G.ui.sayAll(['ยินดีต้อนรับสู่ร้านราเมงลมทุ่ง... ฐานของแก๊งพี่เอง', 'ได้ยินว่าน้องปราบคางคกเจ้าหนองได้ เก่งใช้ได้',
        'แต่ลมกลางทุ่งของพี่ไม่เหมือนลมธรรมดานะ ถ้าอยากได้ตราผ้าโพก ต้องชนะพี่ให้ได้ก่อน!'], 'พี่ออสซี่');
      const team = [G.makeMon('krahang', 8, { ivs: 20 }), G.makeMon('krahang', 9, { ivs: 20 }), G.makeMon('ossie', 10, { ivs: 25 })];
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่ออสซี่', trainerLook: 'ossie', ai: 2, money: 500, bg: 'ramen' });
      if (r !== 'win') { await say('ยังอ่อนไปนะน้อง กลับไปฝึกแล้วค่อยมาใหม่', 'พี่ออสซี่'); await blackout(); return; }
      F().gym1_done = true; G.sfx('level');
      await G.ui.sayAll(['โอ้โห... แพ้เด็กจนได้', 'เอาไป ตราผ้าโพก หลักฐานว่าชนะยิมแรกแล้ว'], 'พี่ออสซี่');
      await G.ui.gotPopup({ sprite: 'badge:gym1', name: 'ตราผ้าโพก', head: 'ได้รับตรายิม', rar: 'l', tag: 'ตรายิม', desc: 'ชนะพี่ออสซี่ ยิมแรกแห่งตลาดนัด', auto: 3200 });
      await say('แล้วก็นี่ ท่าลับของพี่ สอนให้เพื่อนธาตุลมในแก๊งได้ทุกคน', 'พี่ออสซี่');
      await give('tm_wind_blade', 1);
      await pickKid('member3_joined');
      await G.ui.sayAll(['ต่อไปน้องต้องไปเจอพี่เฟรนด์ วิศวะเครื่องกลหัวไม้ที่ มข. ระวังไฟช็อตล่ะ ฮ่าๆ', 'แต่ก่อนไป กลับไปฉลองที่หมู่บ้านก่อนสิ ได้ยินว่าจะจุดบั้งไฟกันนี่'], 'พี่ออสซี่');
    },
    async driver() {
      if (!F().gym1_done) { await say('ลุงวิ่งรถไป มข. ทุกวัน แต่ช่วงนี้แก๊งร้านราเมงคุมตลาด ไม่มีใครกล้านั่งรถลุงเลย', 'ลุงสองแถว'); return; }
      if (!F().festival_done) { await say('ได้ข่าวว่าหมู่บ้านเอ็งจะจุดบั้งไฟฉลอง กลับไปงานบุญก่อน แล้วค่อยมานั่งรถลุง ลุงรอได้', 'ลุงสองแถว'); return; }
      await rideMenu('ลุงสองแถว', [['kku', 'มหาวิทยาลัยขอนแก่น', 5, 13, 'down']], 'จะไปไหนหลาน? ลุงพาไปฟรี เด็กเก่งแบบนี้ไม่คิดตังค์');
    },
    async driver2() {
      await rideMenu('ลุงสองแถว', [['market', 'ตลาดนัดตำบล', 21, 8, 'left']], 'จะไปไหนหลาน? ลุงพาไปส่ง');
    },
    // ---------- ด่านสุดท้าย: เมืองขอนแก่น ----------
    async _quest() { await G.ui.questLog(); },
    async line(n) { for (const l of n.lines || []) await say(l, n.name); },   // NPC/ประตู/วัตถุทั่วไป: พูดตาม lines
    async driver_city(n) {
      if (!F().gym3_done) { await say('ลุงวิ่งรถเข้าตัวเมืองขอนแก่น แต่ช่วงนี้รถเต็ม ไว้หลานจัดการเรื่องที่โรงพยาบาลเสร็จก่อนนะ', n.name); return; }
      await rideMenu(n.name, [['city', 'ตัวเมืองขอนแก่น', 7, 17, 'down']], 'จะไปไหนหลาน? ช่วงนี้คนเข้าเมืองไปดูแข่งเกมกันเต็มรถเลย');
    },
    async driver_city2(n) {
      await rideMenu(n.name, [['amphoe', 'ตัวอำเภอ (หอนาฬิกา)', 35, 16, 'down']], 'จะไปไหนหลาน? ลุงพาไปส่งได้ทุกที่ที่เคยไป');
    },
    // ================= ด่านสุดท้าย: เนื้อเรื่องในเมือง =================
    // ---------- หยก (เควสต์หลัก + เควสต์รองโดรน) ----------
    async yok(n) {
      if (!F().yok_met) {
        await say('{shock}อ้าว! เด็กพวกนี้... หน้าคุ้นๆ นะ', n.name);
        await say('ใช่แล้ว! รูปในเคสมือถือม่อนไง แก๊งเด็กบ้านนา! พี่ชื่อหยก เป็นคนพากย์เกม แล้วก็เป็นผู้จัดการทีมให้ม่อน', n.name);
        await say('ม่อน... พี่ม่อนไง FIEWXANDER! เด็กหมู่บ้านเดียวกับพวกเอ็ง ตอนนี้เป็นโปรเพลเยอร์เกมวาโลแลนด์อันดับหนึ่งของประเทศ', n.name);
        const ter = S().party.find((m) => m.sp === 'ter');
        if (ter) await say('{shock}พี่ม่อน!? คนที่ชอบทำหน้าโหดใส่ผมตลอดน่ะเหรอ!', ter.name);
        await say('ฮ่าๆ ใช่ คนนั้นแหละ พรุ่งนี้ม่อนต้องบินไปแข่งรายการโลก คืนนี้เลยมีศึก "ท้าชิง" ใครชนะลูกทีมในห้องซ้อมได้ ขึ้นเวทีสู้ม่อนได้เลย', n.name);
        await say('{happy}พี่ว่าม่อนอยากเจอพวกเอ็งที่สุด ...แต่มันไม่ยอมพูดหรอก ปากแข็ง เอานี่ไป บัตรผู้ท้าชิง', n.name);
        await give('challenger_pass', 1); F().yok_met = true; G.refreshNpcs();
        await say('สนามอยู่ฝั่งขวาบนของเมือง ประตูซ้ายในล็อบบี้คือห้องซ้อม เพื่อนๆ พี่ม่อนรออยู่ มีหลายคนที่พวกเอ็งรู้จักด้วยนะ', n.name);
        await say('อ้อ ถ้าว่างๆ ช่วยพี่หน่อย โดรนถ่ายคลิปพี่ตกบึงตรงนี้เมื่อปีก่อน ตอนนี้ยังเห็นไฟกะพริบอยู่ใต้กอบัวข้างศาลาเลย', n.name);
        if (await G.ui.confirm('ช่วยพี่หยกหาโดรนไหม? (ไปทำทีหลังก็ได้)', n.name)) await startQuest('s_drone');
        return;
      }
      if (F().drone_got && !F().drone_done) {
        await say('{happy}โดรนพี่! ยังเปิดติดด้วย... เดี๋ยวนะ ในเมมโมรียังมีคลิปตอนสามคนนั่งเล่นที่ศาลานี้อยู่เลย', n.name);
        await say('ม่อน ออส แล้วก็พี่ สมัยยังไม่มีใครรู้จักใคร... ขอบใจนะ เอาเสื้อทีมไปเป็นที่ระลึก', n.name);
        S().bag.drone = 0; await finishQuest('s_drone'); return;
      }
      if (!F().drone_asked) { if (await G.ui.confirm('ช่วยพี่หาโดรนที่ตกบึงหน่อยไหม? ติดอยู่ใต้กอบัวข้างศาลา', n.name)) await startQuest('s_drone'); return; }
      if (F().mon_done) { await say('{happy}พากย์จนเสียงแหบเลย! พรุ่งนี้เช้าเจอกันที่สนามบินนะ ไปส่งม่อนด้วยกัน', n.name); return; }
      await say(F().practice_clear ? 'ผ่านห้องซ้อมแล้วเหรอ! ขึ้นเวทีได้เลย พี่จะไปรอพากย์' : 'สนามอยู่ฝั่งขวาบน ประตูซ้ายในล็อบบี้คือห้องซ้อม สู้ๆ นะ!', n.name);
    },
    async drone_spot() {
      if (F().drone_got || F().drone_done) { await say('กอบัวไหวเบาๆ ไม่มีอะไรแล้ว'); return; }
      if (!F().drone_asked) { await say('ใต้กอบัวมีไฟสีแดงกะพริบ... อะไรน่ะ?'); return; }
      if (!S().bag.rod) { await say('โดรนติดอยู่ใต้กอบัวไกลเกินมือเอื้อม ถ้ามีเบ็ดของลุงเปลี่ยนที่ริมพองคงเกี่ยวขึ้นมาได้'); return; }
      await say('หย่อนเบ็ดเกี่ยวใบพัดโดรน... ดึง... ดึง...!');
      G.sfx('buy'); await say('{happy}ได้โดรนขึ้นมาแล้ว! ไฟยังกะพริบอยู่เลย');
      F().drone_got = true; await give('drone', 1);
    },
    // ---------- ห้องซ้อม: ลูกทีมพี่ม่อน 3 คน แล้วพี่โจ ----------
    async practice_check() {
      const left = ['tr_primmie', 'tr_killua', 'tr_bus'].filter((f) => !F()[f]).length;
      if (left) { await say(`เหลือลูกทีมพี่ม่อนอีก ${left} คน`); return; }
      if (F().practice3) return;
      F().practice3 = true; G.sfx('alert');
      await say('{shock}เสียงประกาศ: "ผู้ท้าชิงผ่านสามไซต์แล้ว! JOEKER โปรดไปที่แท่นสไปก์"');
    },
    async joe_pro(n) {
      if (F().practice_clear) { await say('ขึ้นเวทีไปเลย ประตูบนสุดของห้องนี้ ม่อนรออยู่', n.name); return; }
      if (!F().practice3) { await say('พี่ชื่อโจ เป็น IGL ทีมม่อน ผ่านพริมมี่ คิลัว บัสให้ได้ก่อนนะ แล้วค่อยมาหาพี่ที่แท่นสไปก์', n.name); return; }
      await say('{happy}มาจนได้! พี่ชื่อโจ ชื่อในเกม JOEKER เป็นคนวางแผนให้ม่อน... แล้วก็เป็นพี่ชายของโจ้ที่พวกเอ็งสู้ด้วยสามรอบนั่นแหละ', n.name);
      await say('ขอบใจที่ดูแลน้องจ๋าตอนพี่ไม่อยู่นะ แต่ในเกม พี่ไม่ออมมือ ควันพี่หนาที่สุดในประเทศ!', n.name);
      const team = [G.makeMon('brimlung', 28, { ivs: 20 }), G.makeMon('vaipa', 28, { ivs: 20 }), G.makeMon('ohmen', 29, { ivs: 22 })];
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่โจ (JOEKER)', trainerLook: 'joe_pro', ai: 2, money: 1500, bg: 'arena' });
      if (r !== 'win') { await say('เกือบแล้วๆ กลับไปพักแล้วมาใหม่นะ', n.name); await blackout(); return; }
      F().practice_clear = true; G.sfx('level');
      await say('{sad}...แพ้เด็กประถม แผนพี่ไม่พลาด แต่ข้อมือพี่มันไม่ไหวแล้วล่ะ', n.name);
      await say('ความลับนะ หมอบูมบอกว่าข้อมือพี่ต้องพักยาว รายการโลกพรุ่งนี้พี่ไปไม่ได้ ม่อนยังไม่รู้', n.name);
      await say('ช่วยพี่อย่างนึง ชนะม่อนให้ได้ ให้มันเห็นว่ามันมีคนหนุนหลังเยอะแค่ไหน มันจะได้ไปคนเดียวได้', n.name);
      await say('ประตูบนสุดของห้องนี้ขึ้นเวทีใหญ่ ไปเลย!', n.name);
      G.refreshNpcs();
    },
    // ---------- ศึกสุดท้าย: FIEWXANDER ----------
    async mon_final(n) {
      if (F().mon_done) return;
      const ter = S().party.find((m) => m.sp === 'ter');
      await say('{happy}แฟนๆ ทั้งสนามคะ! ศึกท้าชิงคืนนี้ ผู้ท้าชิงคือ... แก๊งเด็กบ้านนาจากหมู่บ้านโนนสะอาด!', 'หยก (พากย์)');
      await say('...มาจนได้นะ ไอ้พวกตัวเล็ก', n.name);
      await say('{happy}บี! แอม! เติ้ล! โตขึ้นเยอะเลย กินข้าวกันยัง', n.name);
      if (ter) {
        await say('{angry}...แล้วก็ เต๋อ', n.name);
        await say('{shock}ผมทำอะไรผิดครับ!?', ter.name);
        await say('งานบั้งไฟปีนั้น ข้ายืนถือดอกไม้รอน้ำฝนทั้งคืน แล้วเอ็งเต้นเซิ้งกับน้ำฝนแทนข้า! แถมเอาดอกไม้ข้าไปให้อีก!', n.name);
        await say('{shock}ตอนนั้นผมเจ็ดขวบเองนะพี่!', ter.name);
        await say('{angry}เจ็ดขวบก็แย่งได้!', n.name);
        await say('ฮ่าๆๆ ผู้ชมคะ FIEWXANDER มีปมกับเด็กเจ็ดขวบค่ะ!', 'หยก (พากย์)');
      }
      if (F().drone_done) await say('ม่อน! พี่ได้โดรนคืนแล้วนะ เด็กพวกนี้หาให้! ...แค่บอกเฉยๆ', 'หยก (พากย์)');
      await say('ไอ้ม่อน! แกจะแพ้เด็กที่ข้าแพ้มาแล้วเหรอวะ!', 'พี่ออสซี่ (อัฒจันทร์)');
      await say('พี่ม่อน ไม่ต้องออมมือนะครับ! ...เดี๋ยว พี่เชียร์ใครเนี่ย', 'พี่เฟรนด์ (อัฒจันทร์)');
      if (F().sign_done) await say('{happy}พี่ม่อนสู้ๆ! พี่แก๊งบ้านนาก็สู้ๆ! หนูเชียร์ทั้งสองฝั่ง!', 'น้องจ๋า (อัฒจันทร์)');
      await say('พรุ่งนี้ข้าต้องบินไปแข่งโลก ก่อนไปขอดูหน่อย ว่าแก๊งที่ข้าตั้งชื่อให้มันเก่งขึ้นแค่ไหน', n.name);
      await say('ไม่ต้องออมมือนะ ข้าไม่ออมแน่ เอซนี่แหละคือคำทักทาย!', n.name);
      const team = [G.makeMon('raysie', 27, { ivs: 18 }), G.makeMon('neeon', 27, { ivs: 18 }), G.makeMon('sagejae', 28, { ivs: 18 }),
        G.makeMon('renuna', 28, { ivs: 20 }), G.makeMon('ohmen', 29, { ivs: 20 }), G.makeMon('jettjung', 31, { ivs: 24 })];
      let teoSaid = false, lastSaid = false;
      const onSend = async (b) => {
        if (!teoSaid && b.me.sp === 'ter') { teoSaid = true; await G.ui.say('พี่ม่อน: "เต๋อ!!! คราวนี้ไม่มีน้ำฝนมาช่วยเอ็งแล้ว!"', null, { battle: true, auto: 1200 }); }
      };
      const onFoeSend = async (b) => {
        if (!lastSaid && b.foe.sp === 'jettjung') { lastSaid = true; await G.ui.say('หยก (พากย์): "เหลือตัวสุดท้าย เจ๊ดจัง ตัวเมนของ FIEWXANDER! คลัตช์ค่ะคุณผู้ชม!"', null, { battle: true, auto: 1400 }); }
      };
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'FIEWXANDER', trainerLook: 'mon', ai: 2, money: 3000, bg: 'arena', potions: 2, onSend, onFoeSend });
      if (r !== 'win') { await say('{happy}ยังไม่ถึงเวลาหรอก ไปพักก่อน แล้วมาใหม่ ข้ารอ', n.name); await blackout(); return; }
      F().mon_done = true; G.sfx('level');
      await say('{shock}ไม่อยากจะเชื่อค่ะ! แก๊งเด็กบ้านนา ชนะ FIEWXANDER!!!', 'หยก (พากย์)');
      await say('{sad}...แพ้แล้ว ฮ่า แพ้เด็กบ้านนา', n.name);
      await say('{happy}ดีแล้ว ทีนี้ข้าไปแข่งได้สบายใจ หมู่บ้านมีแก๊งที่เก่งที่สุดคอยดูแลแล้ว', n.name);
      await say('ออสกับโจรู้ใช่ไหมว่าข้าดีใจแค่ไหน... อย่าบอกใครนะ', n.name);
      await give('tm_blade_storm', 1);
      await say('ท่าลับ พายุมีดบิน ของเจ๊ดจัง สอนเพื่อนธาตุลมได้ทุกคน', n.name);
      await say('พรุ่งนี้เช้าข้าบินจากสนามบินขอนแก่น เดินตามถนนใหญ่ไปขวาสุดของเมืองนะ ...มาส่งด้วยล่ะ ไม่มาก็ไม่เป็นไร (มานะ)', n.name);
      await G.fadeTo(() => G.refreshNpcs());
    },
    // ---------- ฉากจบ: สนามบิน ----------
    async mon_air(n) {
      if (F().game_clear) { await say('ไปแล้วนะ! ดูถ่ายทอดสดด้วยล่ะ', n.name); return; }
      await say('มากันจริงๆ ด้วย... ทั้งแก๊ง ทั้งออส ทั้งเฟรนด์ ทั้งหยก', n.name);
      await say('ม่อน... ข้อมือพี่ไปไม่ไหวนะ รายการนี้แกต้องไปคนเดียว', 'พี่โจ (JOEKER)');
      await say('{shock}...โจ แกบอกข้าตอนนี้เนี่ยนะ!', n.name);
      await say('{happy}ไปเถอะ คราวนี้แกมีคนหนุนหลังเยอะกว่าพี่คนเดียวแล้ว', 'พี่โจ (JOEKER)');
      if (F().flower_done) {
        await say('ม่อน! รอเดี๋ยว!', 'พี่น้ำฝน');
        await say('{shock}น้ำฝน...?', n.name);
        await say('น้องเต๋อบอกพี่แล้ว ดอกไม้วันงานบั้งไฟ... เป็นของม่อนใช่ไหม', 'พี่น้ำฝน');
        await say('{sad}...อืม ข้า เอ่อ ผม... ใช่', n.name);
        await say('{happy}พี่เก็บไว้ในสมุดตลอดเลย ...กลับมาแล้วไปกินไส้กรอกที่ถนนคนเดินกันนะ', 'พี่น้ำฝน');
        await say('ไม่ต้องดู! เด็กๆ หันไปทางอื่น! ไม่ต้องดู!', 'หยก');
        await say('ลมพัดผมม่อนเปิดขึ้น... เห็นตาพี่ม่อนเป็นครั้งแรก ยิ้มกว้างที่สุดเท่าที่เคยเห็น');
      }
      if (F().sign_done) await say('{happy}พี่ม่อน! ลายเซ็นหนูแปะหัวเตียงแล้วนะ! ได้แชมป์มานะ!', 'น้องจ๋า');
      await say('ข้ามีอย่างนึงจะฝาก', n.name);
      if (!has('jettjung')) {
        await say('เจ๊ดจัง เอเจนต์ตัวเมนของข้า ไปแข่งรอบนี้ข้าต้องใช้ตัวใหม่ ฝากพวกเอ็งดูแลมันหน่อย', n.name);
        if (await G.ui.confirm('รับเจ๊ดจังเข้าแก๊งไหม?')) {
          const m = G.makeMon('jettjung', 30); recruit(m); G.sfx('level');
          await say(`เจ๊ดจังเข้าแก๊งแล้ว!${S().party.includes(m) ? '' : ' (ทีมเต็ม ไปรออยู่ในคลังแก๊ง)'}`);
        }
      }
      await say('{happy}ถ้าข้าได้แชมป์ จะตะโกนชื่อแก๊งเด็กบ้านนาบนเวทีโลก สัญญา!', n.name);
      F().game_clear = true; G.sfx('level');
      await G.fadeTo(() => G.refreshNpcs());
      await G.ui.panel(`<div class="intro"><b>แก๊งเด็กบ้านนา</b><br><br>พี่ม่อนบินไปแข่งรายการโลก<br>หนึ่งเดือนต่อมา ทีวีในร้านชำป้าสมร...<br><br>"FIEWXANDER คว้าแชมป์โลก!"<br>"ขอบคุณ... แก๊งเด็กบ้านนา!"<br><br><small>ขอบคุณที่เล่นจนจบ · ตัวละคร: บี แอม เติ้ล เต๋อ พี่ออสซี่ พี่เฟรนด์ พี่บูม หยก พี่โจ พี่ม่อน และทุกคนในเมืองขอนแก่น<br>เล่นต่อได้: ชวนผีและน้องๆ ให้ครบ ทำเควสต์รองที่เหลือ · ไปดอนปู่ตาเหนือหมู่บ้าน · ท้าศึกแชมป์อีสานที่ล็อบบี้สนาม</small></div>`);
    },
    // ---------- คนในล็อบบี้ ----------
    async friend_city(n) {
      if (F().mon_done) { await say('พี่ม่อนแพ้แล้วยังยิ้มอยู่เลย ไม่เคยเห็นเขาดีใจขนาดนี้', n.name); return; }
      await say('{happy}อ้าว น้องๆ! ตามมาถึงที่นี่เลยเหรอ', n.name);
      await say('สมัยพี่ปีหนึ่งโดนว้ากจนร้องไห้ พี่ม่อนเดินเข้ามาทำหน้าโหดใส่พี่ว้าก แล้วหันมายื่นน้ำเย็นให้พี่... ตั้งแต่นั้นพี่ก็เรียกเขาว่าพี่', n.name);
      if (inParty('ungying')) await say('...อุ๋งอิ๋งมาด้วยเหรอ ไม่เป็นไร วันนี้พี่อารมณ์ดี', n.name);
      await say('ใต้เสื้อช็อปพี่ใส่เสื้อทีมเฟี้ยวซานเดอร์นะ อย่าบอกใคร', n.name);
    },
    async boom_city(n) {
      await say('พี่มาเป็นหมอกายภาพให้ทีมม่อนช่วงแข่ง ม่อนเคยตอบพี่ว่า "บ้านนอกแต่ไม่แพ้" ...ประโยคนั้นทำให้พี่คิดได้หลายอย่าง', n.name);
      await fullHeal('พี่บูมตรวจทุกคน รักษาจนแข็งแรงเต็มที่!', n.name);
    },
    async john_city(n) {
      if (F().mon_done) { await say('{happy}ม่อนแพ้เด็กประถม! พี่ถ่ายคลิปไว้แล้ว จะเอาไปแซวทุกวัน', n.name); return; }
      await say('{happy}หวัดดีน้องๆ พี่จอนโอเซ่น! ห้องซ้อมอยู่ประตูซ้ายสุด มีพริมมี่ คิลัว บัส เฝ้าอยู่สามไซต์', n.name);
      await say('ทิปจากพี่: ทีมม่อนมีครบทุกธาตุ จัดทีมให้หลากหลาย แล้วก็... ถ้าเต๋อลงสนาม ม่อนจะใจร้อนจนพลาดบ่อยมาก ฮ่าๆ', n.name);
    },
    async ossie_city(n) {
      await say('มาถึงร้านนี้จนได้... ข้ากับไอ้ม่อนนั่งเครื่อง 07 กับ 08 ตั้งแต่ ป.6 หยกนั่งดูข้างหลังแล้วด่าทุกตา', n.name);
      await say('ข้าเคยฝันจะเป็นโปรด้วยกัน แต่ต้องกลับไปดูแลร้านราเมง เลยหันไปคุมตลาดแทน... ฮึ ตอนนั้นข้าโง่', n.name);
      await say('{happy}ไอ้ม่อนรออยู่ที่สนาม ข้าจะไปนั่งเชียร์พวกเอ็งนะ ไม่ใช่มัน!', n.name);
    },
    // ---------- เควสต์รอง: ลายเซ็นให้น้องจ๋า ----------
    async joe_kid(n) {
      if (F().sign_got && !F().sign_done) {
        await say('{shock}ลายเซ็นพี่ม่อนจริงๆ! "ถึงจ๋า หายไวๆ นะ" ...จ๋า! ดูนี่!', n.name);
        await say('{happy}กรี๊ด! ขอบคุณค่ะพี่แก๊งบ้านนา!', 'น้องจ๋า');
        await say('...ขอบใจนะ ไม่ใช่เพราะข้าแพ้พวกเอ็งสามรอบหรอกนะ แค่ขอบใจเฉยๆ', n.name);
        S().bag.autograph = 0; await finishQuest('s_sign'); return;
      }
      if (F().sign_done) { await say('พี่โจเป็นพี่ชายข้านะ เท่ไหมล่ะ! ...อย่าบอกว่าข้าพูดแบบนี้', n.name); return; }
      if (!F().sign_asked) {
        await say('เฮ้ย แก๊งบ้านนา! ข้าพาจ๋ามาดูแข่ง จ๋าอยากได้ลายเซ็นพี่ม่อนมาก แต่คิวยาวถึงถนน', n.name);
        await say('ได้ยินว่าตอนกลางคืนพี่ม่อนแอบไปนั่งร้านเน็ตหน้าตลาด ใส่ฮู้ดปิดหน้า... ข้าไม่กล้าเข้าไปขอ', n.name);
        if (await G.ui.confirm('ไปขอลายเซ็นให้น้องจ๋าไหม?', n.name)) await startQuest('s_sign');
        return;
      }
      await say('ร้านเน็ตหน้าตลาด ตอนกลางคืน 2 ทุ่มถึงตี 4 เครื่อง 07 นะ', n.name);
    },
    async mon_net(n) {
      if (F().sign_asked && !F().sign_got) {
        await say('...จำข้าได้ด้วยเหรอ ชู่ว อย่าเสียงดัง ข้าแอบมานั่งเครื่องเก่า คิดถึงที่นี่', 'ผู้ชายใส่ฮู้ด');
        await say('ลายเซ็นให้น้องจ๋าเหรอ ...น้องโจ ได้ เอาไป', 'พี่ม่อน');
        F().sign_got = true; await give('autograph', 1);
        if (inParty('ter')) await say('{angry}...แล้วเอ็งก็ไม่ต้องมองข้าแบบนั้น เต๋อ', 'พี่ม่อน');
        await say('อย่าบอกใครว่าเจอข้าที่นี่ เจอกันบนเวที', 'พี่ม่อน');
        return;
      }
      await say(F().yok_met ? '...ไว้เจอกันบนเวทีนะ ไอ้ตัวเล็ก' : '...ใครน่ะ ไปๆ ข้ากำลังคิดอะไรอยู่', 'ผู้ชายใส่ฮู้ด');
    },
    // ---------- เควสต์รอง: ดอกไม้วันนั้น ----------
    async namfon(n) {
      if (F().flower_done) { await say('{happy}ขอบใจนะน้องเต๋อ... พี่จะไปส่งเขาที่สนามบิน', n.name); return; }
      if (F().jasmine_got && S().bag.jasmine) {
        const ter = S().party.find((m) => m.sp === 'ter');
        await say('{shock}พวงมาลัยมะลิ... ให้พี่เหรอ', n.name);
        await say('พี่น้ำฝนครับ ดอกไม้วันงานบั้งไฟที่ผมเอาไปให้... ที่จริงพี่ม่อนเป็นคนถือมารอทั้งคืน ผมแค่ไปคว้ามา', ter ? ter.name : S().name);
        await say('{happy}...พี่รู้มานานแล้วล่ะ หยกเล่าให้ฟัง แต่อยากได้ยินจากปากใครสักคน ขอบใจนะ', n.name);
        S().bag.jasmine = 0; await finishQuest('s_flower'); return;
      }
      if (!F().flower_asked) {
        await say('{happy}อ้าว! น้องๆ บ้านโนนสะอาด! พี่ชื่อน้ำฝน เป็นพยาบาลประจำงานแข่ง มาซื้อน้ำตอนพักเวร', n.name);
        if (inParty('ter')) await say('น้องเต๋อที่เต้นเซิ้งกับพี่ตอนเจ็ดขวบใช่ไหม! โตขึ้นเยอะเลย ...วันนั้นน้องเอาดอกไม้มาให้พี่ด้วย พี่ยังสงสัยว่าใครฝากมา', n.name);
        else await say('ปีนั้นงานบั้งไฟ มีเด็กเอาดอกไม้มาให้พี่ บอกว่า "พี่ม่อนฝากมา" ...พี่ไม่แน่ใจว่าจริงไหม', n.name);
        if (await G.ui.confirm('ช่วยบอกความจริงเรื่องดอกไม้วันนั้นไหม? (ไปซื้อพวงมาลัยจากยายหอมที่ถนนคนเดินมาด้วย)')) await startQuest('s_flower');
        return;
      }
      await say('ไปไหนมาจ๊ะ หน้าตาจริงจังเชียว', n.name);
    },
    async yaihom_city(n) {
      if (F().flower_asked && !F().jasmine_got) {
        await say('{happy}อ้าว หลานๆ จากโรงพยาบาล! ยายขายพวงมาลัยหารายได้เสริม จะเอาไปให้ใครล่ะ', n.name);
        await say('ให้พี่น้ำฝนเหรอ ยายให้ฟรีเลย หนุ่มแจ็กเก็ตดำที่ช่วยยายถือของทุกอาทิตย์ก็ชอบมาดูพวงมาลัยมะลินี่แหละ', n.name);
        F().jasmine_got = true; await give('jasmine', 1); return;
      }
      await say('พวงมาลัยมะลิ ดาวเรือง ไหว้พระก็ได้ ให้คนพิเศษก็ดี', n.name);
    },
    // ---------- เควสต์รอง: ไส้กรอกสิบไม้ ----------
    async sausage_uncle(n) {
      if (!F().sausage_asked) {
        await say('ไส้กรอกอีสานเปรี้ยวกำลังดี! หลานช่วยลุงหน่อย ลูกค้าประจำห้อง 304 โรงแรมนักแข่งสั่งสิบไม้ทุกคืน แต่ลุงทิ้งร้านไม่ได้', n.name);
        if (await G.ui.confirm('ช่วยเอาไส้กรอกไปส่งโรงแรมไหม?', n.name)) { await startQuest('s_sausage'); await give('sausage', 1); }
        return;
      }
      await say(F().sausage_done ? '{happy}ลูกค้าห้อง 304 ฝากบอกว่า "อร่อยเหมือนเดิม" ขอบใจนะหลาน' : 'ส่งที่พนักงานโรงแรมนะ ฝากขึ้นห้อง 304', n.name);
      await G.ui.shop(['naem', 'meatball'], n.name);
    },
    // ---------- เควสต์รอง: รูปทีมเก่า ----------
    async photo(n) {
      F()[n.flag] = true; G.refreshNpcs(); G.sfx('buy');
      const got = [1, 2, 3, 4, 5].filter((i) => F()['photo' + i]).length;
      S().bag.old_photo = got;
      const cap = ['เด็กผมดำสามคนนั่งหน้าคอม ข้างหลังเขียนว่า "ม่อน ออส หยก ป.6"', 'หยกยืนเท้าเอว ชี้หน้าม่อนที่ทำหน้าเหวอ', 'ออสถือถ้วยรางวัลพลาสติก ม่อนยิ้มเห็นฟัน', 'สามคนนั่งศาลากลางน้ำบึงแก่นนคร กินลูกชิ้นไม้เดียวกัน', 'ม่อนอุ้มเด็กตัวเล็กสี่คนในงานบั้งไฟ... นี่มันแก๊งเราตอนเด็กนี่!'][got - 1];
      await say(`เจอรูปถ่ายเก่า! (${got}/5) ${cap}`);
      if (got >= 5) { F().photo_all = true; await say('ครบห้าใบแล้ว เอาไปคืนลุงเจ้าของร้านเน็ตกัน'); }
    },
    async netcafe_uncle(n) {
      if (F().photo_all && !F().photo_done) {
        await say('{happy}ครบเลย! รูปพวกนี้ลุงแปะไว้ข้างฝามายี่สิบปี ลมพัดปลิวไปหมดตอนเปิดประตู', n.name);
        await say('ใบสุดท้ายนี่... ม่อนอุ้มพวกเอ็งตอนเด็กๆ ไว้ ...มันรักพวกเอ็งมากนะ ปากแข็งเฉยๆ', n.name);
        S().bag.old_photo = 0; await finishQuest('s_photo'); return;
      }
      if (!F().photo_asked) {
        await say('ร้านนี้ลุงเปิดมายี่สิบปี มีเด็กสามคนมานั่งตั้งแต่ตัวเท่าเอ็ง คนหนึ่งเป็นโปร คนหนึ่งพากย์เกม อีกคนกลับไปขายราเมงบ้านนอก ฮ่าๆ', n.name);
        await say('รูปพวกมันที่ลุงแปะไว้ปลิวหายไปห้าใบ ไปตกทั่วเมืองเลย', n.name);
        if (await G.ui.confirm('ช่วยลุงตามหารูปเก่า 5 ใบไหม?', n.name)) await startQuest('s_photo');
        else await G.ui.shop(['mama_cup', 'soda', 'gamer_drink', 'popcorn'], n.name);
        return;
      }
      await say('มาม่ากับน้ำแดงไหม หาของเหนื่อยๆ', n.name);
      await G.ui.shop(['mama_cup', 'soda', 'gamer_drink', 'popcorn'], n.name);
    },
    // ---------- กิมมิคในเมือง ----------
    async fountain() {
      if (S().money < 10) { await say('น้ำพุพุ่งเป็นจังหวะเพลง ไฟเปลี่ยนสีม่วงฟ้า (ต้องมีเงิน 10 บาทถึงจะโยนเหรียญได้)'); return; }
      if (!(await G.ui.confirm('โยนเหรียญ 10 บาทอธิษฐานไหม?'))) return;
      S().money -= 10; G.sfx('tick');
      const r = G.rng();
      if (r < 0.25) await fullHeal('{happy}น้ำพุพ่นละอองเย็นๆ ทุกคนหายเหนื่อย!');
      else if (r < 0.45) { await say('{happy}เหรียญเด้งกลับมาพร้อมเหรียญคนอื่น!'); S().money += 50; await say('ได้เงิน 50 บาท'); }
      else if (r < 0.6) { await say('{happy}มีของลอยมาติดขอบอ่าง!'); await give(['soda', 'mama_cup', 'herb_big'][Math.floor(G.rng() * 3)], 1); }
      else if (r < 0.62) { await say('{shock}เหรียญกระดอนไปโดนหัวยาม! ยามหันมามองแล้วหัวเราะ'); }
      else await say(['อธิษฐานให้พี่ม่อนได้แชมป์!', 'อธิษฐานให้ฝนตกที่ทุ่งนาทุกปี', 'อธิษฐานขอหมูกระทะ...', 'เหรียญจมลงไปเงียบๆ'][Math.floor(G.rng() * 4)]);
    },
    async led_screen() {
      const lines = F().mon_done ? ['จอยักษ์ฉายคลิป "แก๊งเด็กบ้านนา ชนะ FIEWXANDER!" วนซ้ำ คนดูหน้าสนามปรบมือ'] : F().practice_clear ? ['ตัวหนังสือวิ่ง: "ผู้ท้าชิงผ่านห้องซ้อมแล้ว! คืนนี้ศึกท้าชิง FIEWXANDER"']
        : ['จอยักษ์ฉายไฮไลต์ FIEWXANDER ยิงหัวห้าคนติด', 'ตัวหนังสือวิ่ง: "พากย์โดย หยกJADE · เชียร์สด ณ สนามอีสปอร์ตขอนแก่น"'];
      for (const l of lines) await say(l);
    },
    async vending() { await say('ตู้กดน้ำ แสงไฟเรืองๆ ตอนกลางคืน'); await G.ui.shop(['soda', 'gamer_drink'], 'ตู้กดน้ำ'); },
    async hidden_item(h) {
      F()[G.hidFlag(h)] = true; G.sfx('buy');
      const where = { field: 'ในกอข้าว', phong: 'ในพงอ้อ', city: 'ใต้ม้านั่ง', donputa: 'ใต้กองใบไม้', kku: 'หลังพุ่มไม้' }[S().map] || 'ซุกอยู่ตรงนี้';
      await say(`เจอ${G.DATA.items[h.item].name}ซ่อนอยู่${where}!`); await give(h.item, 1);
      const left = (G.DATA.world.hidden || []).filter((k) => !F()[G.hidFlag(k)]).length;
      if (left && left % 5 === 0) await say(`(ยังมีของซ่อนอยู่ทั่วอีสานอีก ${left} ชิ้น สังเกตประกายวิบวับบนพื้นนะ)`);
    },
    // ---------- หลังจบเกม: ศึกแชมป์อีสาน (สี่หัวหน้าติดกัน) · หอท้าสู้ · พญาคันคาก ----------
    async champ_host(n) {
      if (!F().champ_intro) {
        await G.ui.sayAll(['{happy}ศึกแชมป์อีสาน! พี่ออสซี่ พี่เฟรนด์ พี่บูม และม่อน ตกลงกันแล้วว่าจะสู้กับน้องๆ อีกครั้ง แบบเต็มกำลัง',
          'สู้ติดกันสี่คน ระหว่างคู่พักใช้ยาในกระเป๋าได้ แต่ไม่มีพักฟื้นฟรีนะ', 'ทีมของทุกคนเลเวล 50 ขึ้นไป ผีในทีมก็เปลี่ยนร่างแล้วด้วย เตรียมตัวให้ดี'], n.name);
        F().champ_intro = true;
      }
      if (!(await G.ui.confirm(F().champ_done ? 'ท้าศึกแชมป์อีสานอีกรอบไหม?' : 'พร้อมเข้าศึกแชมป์อีสานไหม?', n.name))) return;
      const L = [
        ['พี่ออสซี่', 'ossie', () => [G.makeMon('krahang2', 50, { ivs: 26 }), G.makeMon('phong2', 50, { ivs: 26 }), G.makeMon('takhon2', 51, { ivs: 26 }), G.makeMon('ossie', 53, { ivs: 31 })], 'ramen', 'ดาบไม้ไผ่ของพี่ยังคมอยู่นะ!'],
        ['พี่เฟรนด์', 'friend', () => [G.makeMon('eng_elec', 52, { ivs: 26, name: 'น้องโวลต์', look: 'eng:eng_elec:1' }), G.makeMon('eng_mech', 52, { ivs: 26, name: 'น้องต้น', look: 'eng:eng_mech:0' }), G.makeMon('wheelchair2', 53, { ivs: 26 }), G.makeMon('friend', 55, { ivs: 31 })], 'kku_shop', 'เฟืองทุกตัวหมุนเต็มรอบแล้ว มาเลย!'],
        ['พี่บูม', 'boom', () => [G.makeMon('taehak2', 54, { ivs: 26 }), G.makeMon('pusom2', 54, { ivs: 26 }), G.makeMon('nurseghost2', 55, { ivs: 26 }), G.makeMon('boom', 57, { ivs: 31 })], 'clinic', 'ตรวจร่างกายเสร็จแล้ว พร้อมผ่าตัดใหญ่!'],
        ['พี่ม่อน', 'mon', () => [G.makeMon('raysie', 57, { ivs: 28 }), G.makeMon('neeon', 57, { ivs: 28 }), G.makeMon('sagejae', 58, { ivs: 28 }), G.makeMon('renuna', 58, { ivs: 28 }), G.makeMon('ohmen', 59, { ivs: 28 }), G.makeMon('jettjung', 61, { ivs: 31 })], 'arena', 'รอบนี้พี่ไม่ออมมือแล้วนะ GG ตั้งแต่ยังไม่เริ่ม!'],
      ];
      for (let i = 0; i < L.length; i++) {
        const [name, look, mk, bg, line] = L[i];
        await say(`{happy}${line}`, name);
        const r = await G.runBattle(mk(), { kind: 'master', trainerName: name, trainerLook: look, ai: 2, potions: i === 3 ? 2 : 1, money: 3000 + i * 1000, bg });
        if (r !== 'win') { G.heal(); await say(`${name}: เก่งขึ้นเยอะแล้ว แต่ยังไม่พอ! ฝึกมาใหม่นะ`, n.name); await say('(ทีมได้พักฟื้นที่ห้องพักนักแข่งแล้ว)'); return; }
        if (i < L.length - 1) {
          const c = await G.ui.ask(`ชนะ${name}แล้ว! คู่ต่อไป: ${L[i + 1][0]}`, n.name, ['สู้ต่อเลย', 'ฟื้นทีมด่วนก่อน (ใช้ยาในกระเป๋า)']);
          if (c === 1) await G.ui.quickHeal();
        }
      }
      G.sfx('level'); F().champ_done = true; G.refreshNpcs();
      for (const m of S().party) { m.ribbons = [...new Set([...(m.ribbons || []), 'champ'])]; G.addFriend(m, 30); }
      (S().hof = S().hof || []).push({ day: G.gameDay(), team: S().party.map((m) => ({ name: m.name, sp: m.sp, lv: m.lv, shiny: !!m.shiny })) });
      await G.ui.panel(`<div class="intro"><b>🏆 หอเกียรติยศ · แชมป์อีสาน</b><br><br>${S().party.map((m) => `<canvas width="16" height="16" data-sprite="${G.monLook(m)}" style="width:3em;height:3em;image-rendering:pixelated"></canvas> ${m.name} Lv${m.lv}`).join('<br>')}<br><br>ทุกคนในทีมได้ริบบิ้นแชมป์อีสาน</div>`);
      if (!S().bag.bangfai_mini) { await say('ม่อนยื่นบั้งไฟจิ๋วทองคำให้ "ตำนานว่าถ้าจุดที่หนองใหญ่ พญาคันคากจะขึ้นมาดู"', n.name); await give('bangfai_mini', 1); }
    },
    async tower_host(n) {
      await say(`หอท้าสู้วาโลแลนด์! สู้ติดกันไม่พัก ทุก 5 ชนะมีรางวัล สถิติสูงสุดของน้อง: ${S().towerBest || 0} ชนะติด`, n.name);
      if (!(await G.ui.confirm('เริ่มท้าสู้ไหม? (ทีมจะฟื้นเต็มก่อนแต่ละคู่)', n.name))) return;
      const POOL = ['phrai2', 'kongkoi2', 'pob2', 'krahang2', 'phong2', 'pret2', 'nangngueak2', 'takhian2', 'taehak2', 'krasue2', 'takhon2', 'pusom2', 'nurseghost2', 'wheelchair2', 'raysie', 'neeon', 'brimlung', 'vaipa', 'killjoy', 'sovanoi'];
      const NAMES = [['นักแข่งสายผี', 'henchman2'], ['หมอลำซิ่ง', 'vendor'], ['นักศึกษาวิศวะปีสี่', 'student1'], ['คุณครูนักสะสม', 'teacher'], ['ป้าแม่ค้าสายโหด', 'samorn'], ['สตรีมเมอร์สายวาโล', 'agent_jett'], ['ลุงคนขับสองแถว', 'driver'], ['พระธุดงค์ผ่านทาง', 'novice']];
      const RW = ['khao_lam', 'rosary', 'takrut', 'prajiad', 'kratib', 'termite_soil', 'new_battery', 'kite_string', 'pakhaoma', 'naga_scale'];
      const L = Math.max(50, ...S().party.map((m) => m.lv));
      let streak = 0;
      for (;;) {
        G.heal();
        const [tn, tl] = NAMES[Math.floor(G.rng() * NAMES.length)], lv = Math.min(100, L - 2 + Math.floor(streak / 5));
        const team = [0, 1, 2].map(() => G.makeMon(POOL[Math.floor(G.rng() * POOL.length)], lv + G.rng.int(0, 2), { ivs: Math.min(31, 18 + streak), nature: 'random' }));
        const r = await G.runBattle(team, { kind: 'trainer', trainerName: `${tn} (คู่ที่ ${streak + 1})`, trainerLook: tl, ai: 2, money: 300 });
        if (r !== 'win') break;
        streak++;
        if (streak % 5 === 0) { const it = RW[Math.floor(G.rng() * RW.length)]; await say(`ชนะติด ${streak} คู่! รางวัลจากหอ`, n.name); await give(it, 1); }
        if (streak === 20) for (const m of S().party) m.ribbons = [...new Set([...(m.ribbons || []), 'tower'])];
        if ((await G.ui.ask(`ชนะติด ${streak} คู่แล้ว!`, n.name, ['สู้ต่อ', 'พักก่อน (เก็บสถิติ)'])) === 1) break;
      }
      G.heal(); S().towerBest = Math.max(S().towerBest || 0, streak);
      await say(`จบรอบนี้ที่ ${streak} ชนะติด · สถิติสูงสุด ${S().towerBest}`, n.name);
    },
    async phaya(n) {
      if (F().phaya_day === G.gameDay()) { await say('ผิวหนองนิ่งสนิท... พญาคันคากคงกลับไปพักแล้ว พรุ่งนี้ค่อยมาใหม่'); return; }
      if (!S().bag.bangfai_mini) { await say('มีคางคกตัวใหญ่สวมมงกุฎทองนั่งนิ่งอยู่กลางหนอง... มันไม่สนใจเราเลย'); return; }
      await G.ui.sayAll(['จุดบั้งไฟจิ๋วทองคำ... ฟู่ววว ตูม!', '{shock}ฟ้าร้องครืนๆ น้ำในหนองกระเพื่อม พญาคันคากลืมตาขึ้นมา',
        'อ๊บ... เจ้าคือเด็กที่ชนะคางคกเจ้าหนองกับแชมป์ทั้งสี่สินะ ข้าคือพญาคันคาก ผู้ที่เคยรบชนะพญาแถนจนฟ้าส่งฝนให้แผ่นดินอีสาน', 'มาเถิด! ให้ข้าดูว่าใจเจ้าแข็งพอจะเดินเคียงข้างข้าไหม!'], n.name);
      G.markSeen('phayakhankak');
      const r = await G.runBattle([G.makeMon('phayakhankak', 60, { ivs: 31, nature: 'random' })], { kind: 'wild', ai: 2, bg: 'field' });
      if (r === 'recruit') { F().phaya_done = true; G.refreshNpcs(); await say('{happy}พญาคันคากยอมเดินทางไปกับแก๊งเด็กบ้านนาแล้ว! ฝนจะตกตามทางที่พวกเจ้าไป'); }
      else if (r === 'lose') await blackout();
      else { F().phaya_day = G.gameDay(); await say('พญาคันคากกระโดดกลับลงหนองไป... พรุ่งนี้ค่อยจุดบั้งไฟเรียกใหม่'); }
    },
    async amulet(n) {   // แผงเครื่องราง: ของถือ (ของลงธาตุขายหลังได้ตรายิม 2)
      await say(F().gym2_done ? 'ของดีทุกชิ้น ยายทำเองกับมือ ถือไว้ติดตัวสู้ผีสางได้สบาย' : 'ตะกรุด ผ้าประเจียด ลูกประคำ... ได้ตรายิมที่สองเมื่อไร ยายจะเอาของลงธาตุมาขายให้ด้วย', n.name);
      await G.ui.shop(['kratib', 'takrut', 'prajiad', 'rosary', 'everstone', 'yadong'].concat(F().gym2_done ? ['termite_soil', 'new_battery', 'kite_string', 'pakhaoma'] : []), n.name);
    },
    async meatball(n) { await say('ลูกชิ้นทอดไม้ละห้าบาท จิ้มแจ่วเผ็ดๆ ซื้อเยอะลดให้!', n.name); await G.ui.shop(['meatball', 'rice_pork', 'soda'], n.name); },
    // มินิเกม: ทายลูกศรให้ทัน (ตู้เกมอาเขต) / ยิงลูกโป่งตามสี (ซุ้มถนนคนเดิน)
    async arcade() {
      if (!(await G.ui.confirm('ตู้เกม "สายฟ้าแลบ" เหรียญละ 10 บาท กดปุ่มตามลูกศรให้ถูกสามรอบ เล่นไหม?'))) return;
      if (S().money < 10) { await say('เงินไม่พอ'); return; }
      S().money -= 10;
      const A = ['↑', '→', '↓', '←'];
      let ok = 0;
      for (let r = 0; r < 3; r++) {
        const t = Math.floor(G.rng() * 4), opts = A.map((a, i) => ({ a, i })).sort(() => G.rng() - 0.5);
        const k = await G.ui.choose(opts.map((o) => o.a), { title: `รอบ ${r + 1}/3 · กด ${A[t]} !`, cls: 'small', cancel: false });
        if (opts[k].i === t) { ok++; G.sfx('tick'); } else G.sfx('bump');
      }
      if (ok === 3) { await say('{happy}PERFECT! ตู้เกมคายรางวัลออกมา'); await give(G.rng() < 0.3 ? 'khao_ji' : 'mama_cup', 1); }
      else await say(`ได้ ${ok}/3 ...เกือบแล้ว!`);
    },
    async balloon(n) {
      if (!(await G.ui.confirm('ยิงลูกโป่ง 5 นัด 30 บาท ยิงตามสีที่ลุงบอก ถูกครบได้รางวัลใหญ่!', n.name))) return;
      if (S().money < 30) { await say('เงินไม่พอจ้า', n.name); return; }
      S().money -= 30;
      const C = ['แดง', 'เหลือง', 'ฟ้า', 'เขียว', 'ชมพู'];
      let ok = 0;
      for (let r = 0; r < 5; r++) {
        const pick = C.slice().sort(() => G.rng() - 0.5).slice(0, 4), t = pick[Math.floor(G.rng() * 4)];
        const k = await G.ui.choose(pick.map((c) => `ลูกโป่ง${c}`), { title: `นัดที่ ${r + 1}/5 · ยิงลูกโป่ง${t}!`, cls: 'small', cancel: false });
        if (pick[k] === t) { ok++; G.sfx('hit'); } else G.sfx('bump');
      }
      if (ok === 5 && !F().balloon_prize) { F().balloon_prize = true; await say('{happy}แม่นเหมือนนักแข่งเลย! เอาแว่นเล็งไปเลย', n.name); await give('aim_glasses', 1); }
      else if (ok >= 4) { await say('{happy}เก่งมาก! เอาตุ๊กตาไปปลอบใจ... เอ้ย ไข่ปิ้ง!', n.name); await give('egg_ping', 1); }
      else await say(`ยิงโดน ${ok}/5 นัด ลองใหม่นะ!`, n.name);
    },
    async cstore_shop(n) { await say('สวัสดีค่ะ ยินดีต้อนรับ รับถุงไหมคะ', n.name); await G.ui.shop(['sandwich', 'gamer_drink', 'soda', 'herb_big', 'saline', 'holy_water', 'yahom', 'yahom_big', 'kafae', 'namoy', 'magic_rice', 'rice_pork', 'coupon', 'sangkaya'], n.name); },
    async hotel_rest(n) {
      if (F().sausage_asked && !F().sausage_done) {
        await say('ไส้กรอกสิบไม้ส่งห้อง 304 เหรอคะ ห้องคุณม่อนน่ะค่ะ เขาสั่งทุกคืนเลย เดี๋ยวพี่เอาขึ้นไปให้นะคะ', n.name);
        S().bag.sausage = 0; await finishQuest('s_sausage');
      }
      await say('ยินดีต้อนรับโรงแรมนักแข่งค่ะ น้องๆ เป็นแขกของทีมใช่ไหม พักฟรีได้เลยค่ะ', n.name);
      await fullHeal('นอนหลับบนเตียงนุ่มๆ ทุกคนแข็งแรงเต็มที่!', n.name);
      if (await G.ui.confirm('จะบันทึกเกมไหม?')) { if (await G.ui.saveMenu()) await say('บันทึกเกมแล้ว'); }
    },
    async arena_merch(n) {
      await say(F().mon_done ? '{happy}ของที่ระลึกหมดเกลี้ยงตั้งแต่ข่าวว่าแก๊งเด็กบ้านนาชนะ FIEWXANDER! เหลือล็อตสุดท้ายนี่แหละ' : 'ของที่ระลึก FIEWXANDER ขายดีที่สุด เสื้อทีม หมวก ผ้าเชียร์ แท่งไฟ ป้ายไฟ ใส่เชียร์แล้วแรงขึ้นจริงนะ!', n.name);
      await G.ui.shop(['team_jersey', 'team_cap', 'omen_keychain', 'cheer_towel', 'lightstick', 'led_sign', 'popcorn', 'gamer_drink'], n.name);
    },
    async arena_drink(n) {
      await say('{happy}อ้าว! น้องๆ จากโรงอาหารวิศวะ! อิงอิงมาเปิดซุ้มที่สนามช่วงแข่ง ทีมเฟี้ยวซานเดอร์สั่งทุกวันเลย', n.name);
      await G.ui.shop(['mango_shake', 'melon_shake', 'thaitea_shake', 'ovaltine_shake'], n.name);
    },
    async songthaew() {
      // กลางคืนลุงคนขับไปนอน: ให้นั่งรอในรถจนตี 5 ลุงจะกลับมา
      const here = G.DATA.world.rides.filter((r) => r.map === S().map).map((r) => G.DATA.world.npcs.find((n) => n.id === r.npc)).filter(Boolean);
      if (!here.length || here.some((n) => G.hourIn(n.hours))) { await say('รถสองแถวสีฟ้าของลุง คุยกับลุงคนขับที่ยืนข้างรถเพื่อนั่งรถ'); return; }
      await say('ลุงคนขับกลับไปนอนแล้ว รถสองแถววิ่งตั้งแต่ตี 5 ถึง 4 ทุ่ม');
      if (!(await G.ui.confirm('นั่งงีบในรถรอจนเช้าไหม?'))) return;
      await G.fadeTo(() => {
        S().time = Math.floor((S().time - 300) / 1440 + 1) * 1440 + 300;   // ตี 5 ของวันถัดไป (หรือวันนี้ถ้ายังไม่ถึงตี 5)
        G.loadMap(S().map, S().x, S().y, S().dir);
      });
      await say('{happy}ตื่นมาตอนตี 5 ลุงสองแถวมาถึงพอดี! "อ้าว หลานนอนรอลุงทั้งคืนเลยเหรอ"');
    },
    // ---------- มข. ----------
    async guard() { await say(F().gym2_done ? 'สะพานเปิดแล้ว ข้ามลำน้ำพองไปถึงตัวอำเภอ โรงพยาบาลอยู่ติดวงเวียนหอนาฬิกา' : 'เด็กประถมมาเที่ยวมหาลัยเหรอ ระวังพี่ว้ากหน้าโรงช็อปนะ เสียงดังจนนกตกต้นไม้', 'ยามสมพงษ์'); },
    async gossip1() { await say('รู้ยัง อุ๋งอิ๋งเคยเป็นคนคุยของพี่เฟรนด์นะ! คุยกันจนทั้งคณะนึกว่าจะได้เป็นแฟนกันแล้ว แต่อุ๋งอิ๋งไปคบซ้อนกับเพื่อนสนิทของตัวเอง พี่เฟรนด์เลยเจ็บมาก ห้ามพูดชื่อนี้ใกล้โรงช็อปเด็ดขาด', 'พี่ปีสองแนท'); },
    async gossip2() { await say('อุ๋งอิ๋งทำผิดจริงแหละ แต่ตั้งแต่วันนั้นก็ไม่เคยแก้ตัวสักคำ นั่งเหม่อในห้องแล็บทุกวัน ...คนเราพลาดกันได้นะ', 'พี่ปีสองบุ๋ม'); },
    async dog() { G.sfx('alert'); await say('โฮ่ง! เจ้าน็อต หมาประจำคณะ กระดิกหางดีใจ'); },
    async freshy(n) {
      if (!F().freshy_gift) { await say('ผมหลงทางหาห้องเรียนไม่เจอ... เอ้า พี่ให้คูปองหมูกระทะ ขอบคุณที่ชี้ทาง ...ยังไม่ได้ชี้เลยนี่ ช่างเถอะ!', n.name); await give('coupon', 2); F().freshy_gift = true; }
      else await say('ตึกเรียนรวมอยู่ทางซ้ายบนใช่ไหมครับ... ใช่ไหม...', n.name);
    },
    async gear_statue() { await say('อนุสาวรีย์เฟืองยักษ์ สัญลักษณ์คณะวิศวะ ใต้ฐานสลักว่า "เฟืองทุกตัวสำคัญเท่ากัน"'); },
    async vending() {
      await say('ตู้กดน้ำ ยอดฮิตคือน้ำแดงโซดา');
      await G.ui.shop(['soda'], 'ตู้กดน้ำ');
    },
    async prof() {
      if (F().notes_found && !F().notes_done) {
        await say('สมุดโน้ตของครูนี่! เกือบไม่มีสอนพรุ่งนี้แล้ว ขอบใจมาก รับนี่ไป', 'อาจารย์สมศักดิ์');
        await finishQuest('s_notes'); return;
      }
      if (F().notes_asked && !F().notes_done) { await say('สมุดโน้ตปกสีน้ำตาล น่าจะลืมไว้ที่โต๊ะในโรงอาหาร', 'อาจารย์สมศักดิ์'); return; }
      if (!F().notes_asked) {
        await say('แย่แล้ว ครูลืมสมุดโน้ตไว้ที่โรงอาหารตอนกินข้าวเที่ยง ช่วยไปหามาให้ครูหน่อยได้ไหม', 'อาจารย์สมศักดิ์');
        await startQuest('s_notes'); return;
      }
      await G.ui.sayAll(['วิศวะมีหลายสาขานะ ดูจากสีเสื้อช็อปกับตราที่อกได้เลย', 'เครื่องกลเสื้อดำตราเฟือง โยธาสีอิฐตราสะพาน ไฟฟ้าสีกรมท่าตราสายฟ้า',
        'เคมีสีม่วงตราขวดแก้ว สิ่งแวดล้อมสีเขียวตราใบไม้ อุตสาหการสีเทาตรากราฟ', 'น้องๆ ปีหนึ่งชอบหนีเรียนไปเดินในหญ้ารก ถ้าเจอก็เลี้ยงหมูกระทะชวนเข้าแก๊งไปเลย ครูอนุญาต'], 'อาจารย์สมศักดิ์');
    },
    async notes() {
      F().notes_found = true; G.refreshNpcs(); G.sfx('buy');
      await say('เจอสมุดโน้ตปกสีน้ำตาล เขียนว่า "สมศักดิ์ — กลศาสตร์วิศวกรรม" เอาไปคืนอาจารย์ที่ตึกเรียนกัน');
    },
    async sleepy(n) { await say('ฟี้... สมการโมเมนตัม... ฟี้... ขอลอกการบ้านหน่อย... ฟี้...', n.name); },
    async eng_board() { await say('บนกระดานเต็มไปด้วยสูตรยาวเหยียด มุมล่างมีคนเขียนว่า "พี่เฟรนด์ใจร้าย" แล้วมีคนขีดฆ่าทิ้ง'); },
    async chem_shelf() { await say('ชั้นวางขวดสารเคมีเรียงเป็นระเบียบ ป้ายทุกขวดเขียนด้วยลายมือสวยๆ ของอุ๋งอิ๋ง'); },
    async ungying(n) {
      const leader = S().party[0] ? S().party[0].name : S().name;
      if (!F().lab_cleared) {
        if (!F().ungying_met) {
          F().ungying_met = true;
          await G.ui.sayAll(['{shock}แค่กๆ... เด็กประถม!? เข้ามาได้ยังไง ควันพิษเต็มห้องเลยนะ!', 'ตู้ดูดควันพังตั้งแต่เมื่อวาน มีผีโพงเข้าไปสิงในท่อ มันพ่นควันออกมาไม่หยุด',
            'พี่ชื่ออุ๋งอิ๋ง ผู้ช่วยสอนแล็บ... พี่ต้องอยู่เฝ้าห้องจนกว่าควันจะหาย ไม่งั้นมันจะลามไปทั้งตึก',
            'ไล่ควันต้องผสมสารสามขวดตามลำดับ สูตรเขียนไว้บนกระดาน พี่มองไม่เห็นเพราะควันบังตา น้องช่วยหน่อยได้ไหม'], n.name);
        } else await say('สูตรอยู่บนกระดานหน้าห้อง ผสมสามขวดตามลำดับนะ ผิดลำดับแล้วควันจะพุ่งหนักกว่าเดิม', n.name);
        return;
      }
      if (!F().gear_story) {
        await G.ui.sayAll(['ขอบใจมากนะน้องๆ ถ้าไม่มีพวกน้อง พี่คงต้องนั่งดมควันอยู่ทั้งคืน', 'ได้ยินว่าจะไปท้าพี่เฟรนด์ที่โรงช็อปเหรอ... ต้องมีใบรับรองจากพี่ใช่ไหม',
          '{sad}...พวกน้องคงได้ยินเรื่องพี่จากในโรงอาหารมาแล้วสินะ'], n.name);
        await say('พี่ขอเล่าเองดีกว่า ให้น้องได้ยินจากปากพี่', n.name);
        await G.flashback('ปีหนึ่ง · ร้านน้ำปั่นอิงอิง', [['มะม่วงหนึ่ง แตงโมหนึ่ง... ของเธอแตงโมใช่ไหม', 'เฟรนด์'], ['จำได้ด้วยเหรอ', 'อุ๋งอิ๋ง'], ['จำได้ทุกอย่างที่เธอชอบแหละ ...อย่าทำหน้าแบบนั้นสิ เขิน', 'เฟรนด์']]);
        await G.flashback('ปีหนึ่ง · คืนก่อนสอบกลศาสตร์ ที่โรงช็อป', [['นี่ ชิ้นงานกลึงชิ้นแรกในชีวิตเรา เฟืองตัวเล็กๆ ไม่สวยหรอก แต่หมุนได้จริงนะ', 'เฟรนด์'], ['ให้เราเหรอ...', 'อุ๋งอิ๋ง'], ['อือ ให้เธอ สอบพรุ่งนี้ผ่านแน่ เราติวให้จนเช้าเลย', 'เฟรนด์']]);
        await G.flashback('วันที่ฝนตก · หน้าตึกเรียนรวม', [['ระหว่างที่ยังคุยกับเฟรนด์อยู่ อุ๋งอิ๋งแอบไปคบซ้อนกับเพื่อนสนิทของตัวเอง', ''], ['เฟรนด์รู้เรื่องจากปากคนอื่น ไม่ใช่จากปากเธอ', ''], ['...ไม่ต้องอธิบายหรอก', 'เฟรนด์'], ['เขาเดินออกไปกลางฝน ส่วนเธอไม่ได้วิ่งตามไปด้วยซ้ำ', '']]);
        await G.ui.sayAll(['{sad}พี่ผิดเอง ไม่มีข้อแก้ตัวอะไรเลย เฟรนด์ดีกับพี่ทุกอย่าง แต่พี่เลือกทำร้ายเขา', 'ตั้งแต่วันนั้นพี่หลบหน้าเขามาตลอด ไม่เคยแม้แต่จะพูดขอโทษต่อหน้า',
          'พี่ไม่ได้ขอให้เขายกโทษให้นะ ไม่ได้หวังให้กลับไปเหมือนเดิมด้วย', 'พี่แค่อยากคืนเฟืองตัวนี้ แล้วพูดคำขอโทษให้เขาได้ยินสักครั้ง...'], n.name);
        const KID = { bee: 'ทำผิดแล้วกล้าขอโทษ แม่บอกว่าเป็นคนเก่งนะพี่!', am: 'ตามสถิติ... ไม่สิ เรื่องนี้ไม่ต้องใช้สถิติ พี่แค่ต้องกล้าครั้งเดียว', tle: 'ไปด้วยกันนะพี่ เดี๋ยวพวกเรายืนข้างๆ ให้', ter: 'งั้นไปเลย! ตอนนี้เลย! ไปเร็ว!' };
        const kid = S().party.find((m) => KID[m.sp]);
        if (kid) await say(KID[kid.sp], kid.name);
        await say('...ขอบใจนะ งั้นก่อนจะพาไป พี่ต้องดูก่อนว่าพวกน้องพร้อมเจอเฟรนด์จริงไหม สู้กับพี่หน่อย!', n.name);
        const r = await G.runBattle([G.makeMon('ungying', 15, { ivs: 20 })], { kind: 'trainer', trainerName: 'อุ๋งอิ๋ง', trainerLook: 'ungying', ai: 1, money: 0, bg: 'chemlab' });
        if (r !== 'win') { await say('ไม่เป็นไรนะ พักให้หายเหนื่อยแล้วค่อยกลับมา พี่รออยู่ตรงนี้', n.name); await blackout(); return; }
        await say('เก่งจริงๆ ด้วย... เฟรนด์คงชอบพวกน้องแน่ๆ เขาชอบคนที่ไม่ยอมแพ้', n.name);
        S().bag.safety_cert = 1; await G.ui.itemGet('safety_cert', 1);
        F().gear_story = true;
        const lv = Math.max(15, S().party.reduce((a, m) => Math.max(a, m.lv), 1) - 1);
        recruit(G.makeMon('ungying', lv, { ivs: 25 }));
        F().ungying_joined = true; G.refreshNpcs(); G.sfx('level');
        await say(`อุ๋งอิ๋งเข้าแก๊งแล้ว! พี่จะไปโรงช็อปด้วยกัน${S().party.some((m) => m.sp === 'ungying') ? '' : ' (ทีมเต็ม พี่ไปรอในคลังแก๊ง แต่จะตามไปที่โรงช็อปด้วย)'}`);
        await say(`พี่ว้ากหน้าโรงช็อปเห็นใบรับรองแล้วจะยอมสู้ด้วย ไปกันเถอะ ${leader}`, n.name);
        return;
      }
      await say('พี่รออยู่ตรงนี้นะ', n.name);
    },
    async shop_note(o) {   // บันทึกบนผนังห้องคัตเอาต์: อีกด้านของพี่เฟรนด์
      const NOTES = [['กระดาษโน้ตเก่าแปะผนัง ลายมือหวัดๆ:', '"ปีหนึ่ง วันแรกโดนว้ากจนร้องไห้หลังโรงช็อป มีรุ่นพี่ผมขาวยื่นน้ำเย็นให้ ไม่พูดอะไรเลย แค่นั่งเป็นเพื่อน"', '"ถ้าวันหนึ่งได้เป็นรุ่นพี่ จะไม่ปล่อยให้ใครร้องไห้คนเดียวแบบนั้น — F"'],
        ['ใบงานกลึงที่ได้เกรด C ติดหมุดไว้:', '"ชิ้นงานแรก: เฟืองฟันตรง 12 ซี่ — ฟันไม่เท่ากัน แต่หมุนได้"', 'มุมกระดาษมีลายมือเล็กๆ: "ให้คนสำคัญไปแล้ว"'],
        ['ป้ายกฎโรงช็อปที่พี่เฟรนด์เขียนเอง:', '"1. ใส่แว่นเซฟตี้ทุกครั้ง  2. ห้ามทำงานคนเดียวตอนดึก  3. ใครสอบตกมาหาพี่ ติวให้ฟรี"', '"4. เรื่องที่ผ่านไปแล้ว ...ก็ให้มันผ่านไป"']];
      await G.ui.sayAll(NOTES[o.arg] || NOTES[0]);
    },
    async lab_board() {
      if (F().lab_cleared) { await say('กระดาน: "ห้องแล็บปลอดภัยแล้ว ขอบคุณแก๊งเด็กบ้านนา — อุ๋ง"'); return; }
      await G.ui.sayAll(['กระดานไวท์บอร์ดเขียนด้วยลายมือสวยๆ:', '"สูตรไล่ควันจากตู้ดูดควัน: สีของท้องฟ้า → สีของดอกคูน → สีของพริกขี้หนู"', '"ห้ามสลับลำดับเด็ดขาด!"']);
    },
    async fume_hood() { await say(F().lab_cleared ? 'ตู้ดูดควันทำงานเงียบๆ อากาศในห้องสดชื่นแล้ว' : 'ตู้ดูดควันสั่นครืดๆ มีควันสีม่วงพวยพุ่งออกมา ข้างในมีแสงวูบวาบเหมือนตาผีจ้องอยู่!'); },
    async reagent(o) {
      const TH = { red: 'สีแดง', blue: 'สีฟ้า', yellow: 'สีเหลือง', green: 'สีเขียว', purple: 'สีม่วง' };
      if (F().lab_cleared) { await say(`ขวดสาร${TH[o.color]} วางเรียงเป็นระเบียบ ป้ายเขียนด้วยลายมือของอุ๋งอิ๋ง`); return; }
      if (!F().ungying_met) { await say('ควันหนาจนมองไม่เห็นป้าย ลองไปคุยกับพี่ที่ไอแค่กๆ อยู่หลังห้องก่อน'); return; }
      const W = G.world, ORDER = ['blue', 'yellow', 'red'];
      W.mix = W.mix || [];
      if (!(await G.ui.confirm(`เทสาร${TH[o.color]}ลงบีกเกอร์ไหม?`))) return;
      W.mix.push(o.color); G.sfx('slide');
      const k = W.mix.length - 1;
      if (W.mix[k] !== ORDER[k]) {
        W.mix = []; G.sfx('bump');
        await G.ui.sayAll(['{shock}ฟู่ววว! ควันสีม่วงพุ่งขึ้นมาเต็มหน้า!', 'ผิดลำดับ... ต้องเททิ้งแล้วเริ่มใหม่ (ดูสูตรบนกระดานอีกที)']);
        return;
      }
      if (W.mix.length < 3) { await say(`บีกเกอร์เปลี่ยนเป็น${W.mix.length === 1 ? 'สีฟ้าใส' : 'สีเขียวอ่อน'} ...ยังต้องใส่อีก ${3 - W.mix.length} ขวด`); return; }
      W.mix = [];
      await G.ui.sayAll(['บีกเกอร์เดือดปุดๆ เป็นฟองสีขาว ควันม่วงค่อยๆ ถูกดูดกลับเข้าตู้!', '{shock}แต่ตู้ดูดควันสั่นแรง... มีบางอย่างพุ่งออกมา!']);
      const foe = G.spawn('phong', 13, {}); foe.name = 'ผีโพงในตู้ดูดควัน';
      const r = await G.runBattle([foe], { kind: 'wild', bg: 'chemlab' });
      if (r === 'lose') { await blackout(); return; }
      F().lab_cleared = true; G.sfx('power'); G.refreshNpcs();
      await say('ควันพิษหายเกลี้ยง อากาศในห้องแล็บกลับมาใสสะอาด!');
    },
    // โรงอาหาร
    async ingying(n) {
      if (F().kku_arrived && !F().rumor_heard) {   // ข่าวลือ: เรื่องน้ำปั่นสองแก้ว
        await G.ui.sayAll(['ยินดีต้อนรับจ้า... อ้าว เด็กประถม! มาจากไหนกันเนี่ย', 'จะเข้าโรงช็อปเหรอ? พี่ว้ากไม่ให้เข้าหรอก เด็กต้องมีใบรับรองความปลอดภัยจากผู้ช่วยสอนแล็บก่อน',
          'ผู้ช่วยสอนแล็บเคมีปีนี้คือ...อุ๋งอิ๋ง', '{sad}เมื่อก่อนอุ๋งอิ๋งมาซื้อน้ำปั่นกับพี่เฟรนด์ทุกวันเลยนะ มะม่วงหนึ่ง แตงโมหนึ่ง สั่งเหมือนเดิมทุกวัน',
          'ตอนนี้ต่างคนต่างมาคนละเวลา ไม่เคยมาพร้อมกันอีกเลย', 'ช่วงนี้ได้ข่าวว่าห้องแล็บเคมีมีควันพิษพุ่งออกมาจากตู้ดูดควัน ไม่มีใครกล้าเข้าไป แต่อุ๋งอิ๋งยังอยู่ในนั้นคนเดียว...',
          'ห้องแล็บอยู่ในตึกเรียนรวมนะ ด้านขวาสุด ฝากดูอุ๋งอิ๋งให้หน่อยนะน้อง'], n.name);
        F().rumor_heard = true; G.refreshNpcs(); return;
      }
      const talk = ['ยินดีต้อนรับสู่ร้านน้ำปั่นอิงอิง! วันนี้มะม่วงหวานมากเลย', F().gym2_done ? 'พี่เฟรนด์แวะมาซื้อน้ำปั่นสองแก้ว... แก้วนึงไม่ใช่ของพี่เขาเองนะ อิอิ'
        : 'อุ๋งอิ๋งเหรอ? เดี๋ยวนี้ไม่มาซื้อน้ำปั่นเลย เมื่อก่อนมากับพี่เฟรนด์ทุกวัน'];
      await say(talk[Math.floor(G.rng() * 2)], n.name);
      await G.ui.shop(['mango_shake', 'melon_shake', 'thaitea_shake', 'ovaltine_shake'], n.name);
      await say('ขอบคุณค่า มาอุดหนุนอิงอิงอีกนะ!', n.name);
    },
    async blender() { await say('เครื่องปั่นของอิงอิงเสียงดังมาก แต่ปั่นน้ำแข็งละเอียดสุดในคณะ'); },
    async chicken(n) { await say('ข้าวมันไก่ไม่มีขาย ป้าขายยาแก้ปวดเมื่อยให้นักศึกษาสอบเสร็จ ฮ่าๆ', n.name); await G.ui.shop(['herb', 'herb_big', 'holy_water'], n.name); },
    async coop(n) {
      await say('สหกรณ์คณะ มีของเด็ดสำหรับนักสู้ ถุงมือช่างให้ใครถือก็ตีแรงขึ้น', n.name);
      await G.ui.shop(['coupon', 'rice_ball', 'rice_pork', 'magic_rice', 'gloves'], n.name);
    },
    async noodle(n) {
      if (await G.ui.confirm('ก๋วยเตี๋ยวต้มยำชามละ 50 บาท กินทั้งแก๊งหายเหนื่อยแน่นอน เอาไหม?', n.name)) {
        if (S().money < 50) { await say('เงินไม่พอนะหนู', n.name); return; }
        S().money -= 50; await fullHeal('ทุกคนซดน้ำซุปจนหมดชาม แข็งแรงเต็มที่!');
      }
    },
    async eater1(n) { await say('น้ำปั่นอิงอิงแก้วนี้แก้วที่สามของวัน... ไม่ได้ติดนะ แค่ชอบ', n.name); },
    async eater2(n) { await say('พี่เฟรนด์อะ ดูดุแต่ใจดีมาก ปีหนึ่งคนไหนสอบตกพี่สอนให้ฟรีหมด ยกเว้นเรื่องเดียวที่ห้ามพูดถึง', n.name); },
    // หมูกระทะ
    async mkowner(n) {
      const i = await G.ui.choose([{ label: 'ซื้อคูปองหมูกระทะ', sub: '120 บาท' }, { label: 'นั่งกินทั้งแก๊ง (ฟื้นพลัง)', sub: '100 บาท' }, 'ไม่เป็นไร'], { title: 'ร้านหมูกระทะลุงเฉลิม', cls: 'small' });
      if (i === 0) await G.ui.shop(['coupon'], n.name);
      else if (i === 1) {
        if (S().money < 100) { await say('เงินไม่พอนะหลาน', n.name); return; }
        S().money -= 100; await fullHeal('ย่างหมูกระทะกินกันทั้งแก๊งจนพุงกาง แข็งแรงเต็มที่!', n.name);
      } else await say('คูปองหมูกระทะ น้องวิศวะเห็นแล้วตามมาทุกคน ลุงรับประกัน', n.name);
    },
    async mkguest(n) { await say('หมูสามชั้นอีกจาน! ...จ่ายด้วยคูปองที่รุ่นพี่ให้มา', n.name); },
    // หอพัก
    async roommate(n) { await say('ห้องนี้ให้เด็กมานอนพักได้นะ คอมพ์มุมห้องเปิดคลังแก๊งได้ด้วย ใครเขียนโปรแกรมก็ไม่รู้', n.name); },
    // ---------- โรงช็อป ยิม 2 ----------
    async shop_door() { await say('พี่ว้ากยืนขวางประตูโรงช็อป ต้องชนะทั้งสองคนก่อนถึงจะเข้าได้'); },
    // ---------- ด่าน 3: ริมลำน้ำพอง ----------
    async joe3(n) {
      if (F().rival3_done) { await say('ไปโรงพยาบาลก่อนเลย ข้าตามไป', n.name); return; }
      n.alert = 30; G.sfx('alert');
      await say('หลบไป! ข้าต้องรีบไปโรงพยาบาล!', n.name);
      await say('...พวกแกอีกแล้วเหรอ! มาขวางทางข้าทำไม! ถ้าอยากผ่าน ต้องชนะข้าก่อน!', n.name);
      const foes = [G.makeMon(COUNTER3[S().starter], 23, { ivs: 18 }), G.makeMon('takhon', 22, { ivs: 18 })];
      const r = await G.runBattle(foes, { kind: 'trainer', trainerName: 'โจ้ แก๊งบ้านเหนือ', trainerLook: 'rival', money: 400 });
      if (r !== 'win') { await say('ข้าไม่มีเวลาเล่นกับพวกแกหรอก!', n.name); await blackout(); return; }
      F().rival3_done = true;
      await G.ui.sayAll(['...แพ้อีกแล้ว', 'น้องสาวข้า... น้องจ๋านอนโรงพยาบาลอยู่ โดนผีป่วนจนไข้ขึ้นทุกคืน',
        'ข้าเลยชวนผีมาเยอะๆ จะได้ปกป้องมัน แต่หมอบูมไม่ยอมตรวจให้ บอกว่าเด็กบ้านนอกป่วยเพราะสกปรกเอง'], n.name);
      await say('{angry}อะไรนะ! หมอพูดแบบนั้นได้ยังไง!', S().name);
      await say('ถ้าพวกแกจะไปหาหมอบูม... ช่วยถามทีว่าน้องข้าจะหายไหม แล้วถ้าผ่านตลาดเช้า ซื้อข้าวต้มไปให้น้องด้วยนะ มันชอบข้าวต้มหมูสับ', n.name);
      await startQuest('s_porridge');
      G.refreshNpcs();
    },
    async plian() {
      if (!F().worm_asked) {
        await G.ui.sayAll(['หลานมาจากไหนเนี่ย ข้ามสะพานมาจาก มข. เลยเหรอ', 'ลุงอยากตกปลาแต่ไส้เดือนหมดพอดี หลานช่วยหาไส้เดือนในพงอ้อให้ลุงสามตัวได้ไหม',
          'ได้ครบลุงจะให้เบ็ดไม้ไผ่คู่ใจ ตกปลาที่ปลายท่าน้ำได้ บางคนว่าเคยตกได้ลูกนาคด้วยนะ'], 'ลุงเปลี่ยน');
        await startQuest('s_worm'); return;
      }
      if (F().worms_all && !F().worm_done) { await say('ครบสามตัวเลย! เก่งแท้ รับเบ็ดของลุงไป ตกปลาที่ปลายท่าน้ำนะ', 'ลุงเปลี่ยน'); await finishQuest('s_worm'); return; }
      if (!F().worm_done) await say('ไส้เดือนชอบอยู่ในพงอ้อที่ดินชื้นๆ ลองเดินหาดูนะหลาน', 'ลุงเปลี่ยน');
      if (await G.ui.confirm('นั่งเรือลุงข้ามไปเกาะทรายกลางน้ำไหม?', 'ลุงเปลี่ยน')) await ride('phong', 2, 4, 'down', 'ลุงเปลี่ยนพายเรือข้ามไปเกาะทราย...');
    },
    async plian2() { if (await G.ui.confirm('กลับฝั่งไหมหลาน?', 'ลุงเปลี่ยน')) await ride('phong', 7, 15, 'down', 'พายเรือกลับฝั่ง...'); },
    async plian_hut() { await say('กระท่อมลุงเปลี่ยน ข้างในมีแหกับข้องวางเต็มไปหมด ลุงอยู่ที่ท่าน้ำ'); },
    async worm(n) {
      F()[n.flag] = true; G.refreshNpcs(); G.sfx('buy');
      const got = ['worm1', 'worm2', 'worm3'].filter((f) => F()[f]).length;
      await say(`จับไส้เดือนได้! (${got}/3)`);
      if (got >= 3) { F().worms_all = true; await say('ครบสามตัวแล้ว เอาไปให้ลุงเปลี่ยนที่ท่าน้ำกัน'); }
    },
    async fish() {
      if (!S().bag.rod) { await say('ปลาตัวเล็กว่ายวนอยู่ใต้ท่าน้ำ... ถ้ามีเบ็ดคงตกได้'); return; }
      await say('หย่อนเบ็ดลงลำน้ำพอง... รอ... รอ...');
      await G.wait(500);
      const h = Math.floor(S().time / 60) % 24, lucky = (h >= 4 && h < 7) || G.raining();
      const r = G.rng();
      if (r < 0.25) { await say(['ได้ปลาตะเพียนตัวเล็ก ปล่อยกลับไปก่อนนะ', 'ได้รองเท้าแตะข้างเดียว... ใครทำหล่นไว้เนี่ย', 'ปลากินเหยื่อไปหมดเลย!'][Math.floor(G.rng() * 3)]); return; }
      G.sfx('alert'); await say('อะไรบางอย่างกินเบ็ด! ดึงขึ้นมา!');
      const sp = G.rng() < (lucky ? 0.15 : 0.04) ? 'nak' : G.rng() < 0.75 ? 'nangngueak' : 'takhian';
      if (sp === 'nak') await say('{shock}งูทองเกล็ดฟ้าโผล่ขึ้นมาจากน้ำ... นาคน้อย!');
      const r2 = await G.runBattle([G.spawn(sp, sp === 'nak' ? 24 : G.rng.int(20, 23))], { kind: 'wild' });
      if (r2 === 'lose') await blackout();
    },
    async takhian_shrine() {
      if (!F().takhian_prayed) {
        F().takhian_prayed = true;
        await say('ไหว้ศาลนางตะเคียน วางพวงมาลัยดาวเรือง... ลมพัดใบตะเคียนดังซู่ซ่า เหมือนมีใครยิ้มให้');
        await fullHeal('ทุกคนรู้สึกสดชื่นขึ้นมา!');
      } else await say('ศาลนางตะเคียน มีชุดไทยแขวนไว้หลายชุด ใบตะเคียนร่วงลงมาเบาๆ');
    },
    async ruin() {
      if (!F().ruin_item) { F().ruin_item = true; await say('ใต้ฐานเจดีย์ร้างมีไหเล็กๆ ซ่อนอยู่... ข้างในมีของ!'); await give('holy_water', 2); await give('rice_pork', 3); }
      else await say('เจดีย์ร้างกลางลำน้ำ อิฐเก่าจนตะไคร่ขึ้นเขียว');
    },
    async farmer3() { await say(F().gym3_done ? 'ปีนี้ข้าวงามดี ตาแฮกคงพอใจที่หลานช่วยหมู่บ้านอื่นไว้' : 'นาริมพองมีผีตาแฮกเฝ้าอยู่ ใครเดินลุยนาไม่ขอก่อน แกจะออกมาเอาเรื่อง', 'ลุงทองดี'); },
    // ---------- ตัวอำเภอ ----------
    async monk3() {
      await G.ui.sayAll(['ลำน้ำพองนี้มีตำนานเล่ากันมานาน ว่าพญานาคแม่ลูกอ่อนเคยว่ายผ่าน แล้วลูกน้อยพลัดหลงไป',
        'แม่นาคเลยขึ้นไปหลับรอใต้ดอนศักดิ์สิทธิ์แห่งหนึ่ง ใครได้ยินเสียงร้องของลูกนาค แม่นาคจะตื่นขึ้นมา'], 'หลวงพ่อวัดริมน้ำ');
      if (F().gym3_done) await say('ได้ข่าวว่าหลานจะไปดอนปู่ตา... ดอนศักดิ์สิทธิ์ที่ว่า อาจจะใช่ที่นั่นก็ได้นะ', 'หลวงพ่อวัดริมน้ำ');
    },
    async temple3() { await say('สิมวัดริมน้ำปิดอยู่ หลวงพ่อนั่งอยู่ที่ลานหน้าวัด'); },
    async nurse_dorm() { await say(F().gym3_done ? 'มีเสียงหัวเราะจากข้างใน... "พี่บูมเปลี่ยนไปเยอะเลยนะช่วงนี้ ยิ้มเก่งขึ้น"' : 'เคาะประตูแล้วเงียบ... พยาบาลคงเข้าเวรอยู่ที่โรงพยาบาล'); },
    async house3() { await say('"ไม่ซื้อจ้า!" มีเสียงตะโกนออกมาจากในบ้าน'); },
    async townkid() { await say(G.isNight() ? 'ดึกแล้ว! เห็นแสงส้มๆ ลอยวนเสาไฟไหม กระสือแน่ๆ!' : 'ตอนกลางคืนจะมีแสงส้มๆ ลอยวนเสาไฟ แม่บอกว่ากระสือ ห้ามออกไปดู!', 'เด็กตัวอำเภอ'); },
    async clocktower() { await say(`หอนาฬิกาวงเวียน เข็มชี้ ${String(Math.floor(S().time / 60)).padStart(2, '0')}:${String(Math.floor(S().time % 60)).padStart(2, '0')} ตรงเป๊ะ`); },
    async ruin2() { await say('ซากเจดีย์เก่าหลังวัด ได้ยินเสียงไหกระทบกันแกร๊กๆ อยู่ใต้ดิน... ผีปู่โสมเฝ้าสมบัติอยู่แน่ๆ'); },
    async porridge(n) {
      if (F().porridge_asked && !F().porridge_got) {
        if (S().money < 40) { await say('ข้าวต้มถ้วยละ 40 บาทจ้า เงินไม่พอนะหนู', n.name); return; }
        if (!(await G.ui.confirm('ข้าวต้มหมูสับร้อนๆ ถ้วยละ 40 บาท ใส่ถุงไหมจ๊ะ?', n.name))) return;
        S().money -= 40; S().bag.porridge = 1; F().porridge_got = true; G.sfx('buy');
        await say('ได้รับ ข้าวต้มหมูสับ (เอาไปให้น้องจ๋าที่วอร์ดชั้น 2)'); return;
      }
      await say('ข้าวต้มหมูสับ ข้าวต้มปลา ขายถึงเก้าโมงเช้าเท่านั้นนะจ๊ะ', n.name);
    },
    async bread(n) { await say('ขนมปังสังขยาเตาถ่าน! น้องพยาบาลกับน้องหมอชอบที่สุด ยื่นให้ทีไรยอมมาด้วยทุกที', n.name); await G.ui.shop(['sangkaya', 'rice_ball'], n.name); },
    async hiatong(n) { await say('ร้านขายยาเฮียตง ยาดีราคาถูก ตั้งแต่รุ่นอากง!', n.name); await G.ui.shop(['saline', 'herb_big', 'holy_water', 'yahom', 'yahom_big', 'kafae', 'namoy', 'magic_rice', 'sangkaya'], n.name); },
    async card() { F().card_found = true; G.refreshNpcs(); G.sfx('buy'); await say('เจอใบนัดหมอตกอยู่ใต้แผงขายผัก เขียนว่า "นางหอม นัดตรวจความดัน"'); },
    // ---------- โรงพยาบาลอำเภอ ----------
    async reception(n) {
      if (!F().h_card) {
        await G.ui.sayAll(['มาหาหมอบูมเหรอจ๊ะ หมอสั่งไว้ว่าใครจะไปห้องหมอ ต้องทำตามขั้นตอนคนไข้ให้ครบ ไม่มีลัดคิว!',
          'นี่บัตรคิว ทำตามลำดับนะ: คัดกรอง (เส้นเขียว) → เจาะเลือด (เส้นฟ้า) → เอกซเรย์ (เส้นเหลือง) → ลิฟต์ขึ้นห้องยา (เส้นแดง) → ประตูหลังไปคลินิก (เส้นม่วง)',
          'เดินตามเส้นสีบนพื้นไป อย่าเดินมั่วนะ ป้าเห็นหมด'], n.name);
        F().h_card = true; G.sfx('buy'); await say('ได้รับบัตรคิว เบอร์ 113');
        return;
      }
      const next = !F().h_screen ? 'จุดคัดกรอง ตามเส้นเขียว' : !F().tr_needle ? 'ห้องเจาะเลือด ตามเส้นฟ้า' : !F().h_xray ? 'ห้องเอกซเรย์ ตามเส้นเหลือง'
        : !F().h_rx ? 'ลิฟต์ขึ้นชั้น 2 ตามเส้นแดง ไปห้องยา' : !F().gym3_done ? 'ประตูหลังไปคลินิกหมอบูม ตามเส้นม่วง' : null;
      await say(next ? `บัตรคิวเบอร์ 113 ใช่ไหมจ๊ะ ขั้นต่อไปคือ ${next}` : 'หมอบูมเปลี่ยนไปเยอะเลยนะ เมื่อเช้ายังยิ้มให้ป้าเลย', n.name);
    },
    async h_wrong(d) {
      const order = !F().h_card ? 'ไปทำบัตรคิวที่เวชระเบียนก่อน' : 'ดูบัตรคิวด้วยว่าขั้นไหนก่อน';
      G.sfx('bump');
      await say(`{angry}นี่${d.room}! ${d.to ? 'ยังไม่ถึงคิวหนู!' : 'ไม่ใช่ทางที่หนูต้องไป!'} ${order} กลับไปล็อบบี้เลยลูก`, 'ป้าพยาบาลหัวหน้า');
      await G.fadeTo(() => G.loadMap('hospital', 14, 14, 'up'));
    },
    async screen(n) {
      if (!F().h_card) { await say('ไปทำบัตรคิวที่เวชระเบียนก่อนนะคะ', n.name); return; }
      if (F().h_screen) { await say('คัดกรองเรียบร้อยแล้วค่ะ ต่อไปห้องเจาะเลือด เดินตามเส้นฟ้านะคะ', n.name); return; }
      const lead = S().party[0];
      await say(`มาค่ะ วัดความดันให้${lead.name}ก่อน... ปั๊มๆๆ... เรียบร้อย`, n.name);
      await say('ก่อนผ่าน ตอบคำถามพี่ข้อนึงนะ ความดันปกติของผู้ใหญ่ ประมาณเท่าไหร่คะ?', n.name);
      const i = await G.ui.choose(['200/150', '120/80', '50/20'], { cls: 'small' });
      if (i !== 1) { await say('ไม่ใช่ค่ะ! 200 นี่ความดันพุ่งแล้ว 50 ก็ต่ำจนเป็นลม ลองใหม่นะ', n.name); return; }
      F().h_screen = true; G.sfx('level');
      await say('{happy}ถูกต้อง! 120/80 ค่ะ เก่งมาก ต่อไปห้องเจาะเลือด เดินตามเส้นฟ้าไปเลย', n.name);
    },
    async bp_machine() { await say('เครื่องวัดความดันอัตโนมัติ ป้ายเขียนว่า "นั่งพัก 5 นาทีก่อนวัด ห้ามคุยกัน"'); },
    async headnurse(n) {
      await say(F().gym3_done ? 'หมอบูมขึ้นไปตรวจน้องจ๋าทุกเช้าเลยนะ ใครสอนให้ใจดีขึ้นเนี่ย' : 'โรงพยาบาลห้ามวิ่ง ห้ามส่งเสียงดัง! ...ใครเหนื่อยมาให้ป้าทำแผลได้นะ', n.name);
      await fullHeal('ป้าพยาบาลทำแผลให้ทุกคน กลับมาแข็งแรงเต็มที่!', n.name);
    },
    async patient1() { await say('รอคิวมาตั้งแต่ตีห้า... ได้ยินว่าหมอบูมเก่งที่สุด แต่ไม่ค่อยยิ้มให้คนบ้านนอกอย่างลุง', 'คนไข้รอคิว'); },
    async yaihom(n) {
      if (!F().card_asked) {
        if (!F().h_card) { await say('รอหมออยู่จ้ะหลาน', n.name); return; }
        await G.ui.sayAll(['หลานจ๋า ยายลืมใบนัดหมอไว้ที่ตลาดเช้า ไม่มีใบนัดเขาไม่ให้ตรวจ', 'ตลาดเปิดถึงเก้าโมงเท่านั้น หลานช่วยไปหาให้ยายหน่อยได้ไหม'], n.name);
        await startQuest('s_card'); return;
      }
      if (F().card_found && !F().card_done) { await say('ใบนัดยายนี่เอง! ขอบใจหลายๆ เลยหลาน', n.name); await finishQuest('s_card'); return; }
      await say(F().card_done ? 'หมอบอกความดันยายปกติแล้ว ดีใจจัง' : 'ใบนัดน่าจะตกอยู่แถวแผงผักในตลาดเช้านะ ไปก่อนเก้าโมง', n.name);
    },
    async xray_switch() {
      if (F().xray_on) { await say('ไฟเปิดอยู่แล้ว'); return; }
      F().xray_on = true; G.sfx('power');
      await say('สับสวิตช์... ครืน! ไฟห้องเอกซเรย์สว่างขึ้นแล้ว');
    },
    async xray_machine() { await say('เครื่องเอกซเรย์ตัวใหญ่ ป้ายเขียนว่า "ถอดของที่เป็นโลหะออกก่อนถ่าย"'); },
    async xraytech(n) {
      if (!F().xray_on) { await say('มืดตึ๊ดตื๋อเลย ฟิวส์ตัดอีกแล้ว! สวิตช์อยู่มุมขวาบน ช่วยไปสับให้ทีนะ', n.name); return; }
      if (F().h_xray) { await say('ฟิล์มเอกซเรย์อยู่ที่หมอบูมแล้ว ไปต่อได้เลย ขึ้นลิฟต์ตามเส้นแดง', n.name); return; }
      const lead = S().party[0];
      await say(`ขอบใจที่เปิดไฟให้นะ มา ถ่ายเอกซเรย์ให้${lead.name}ก่อน ยืนนิ่งๆ... แชะ!`, n.name);
      G.flash && await G.flash();
      const sp = G.DATA.species[lead.sp];
      await say(sp.kind === 'ghost' ? '{shock}ฟิล์มออกมาโล่งเลย... ผีเอกซเรย์ไม่ติดนี่หว่า!' : sp.kind === 'kid' ? 'กระดูกแข็งแรงดีมาก กินนมเยอะใช่ไหมเนี่ย' : 'ปอดใสปิ๊ง ไม่สูบบุหรี่ใช่ไหม ดีมาก', n.name);
      F().h_xray = true; G.sfx('level');
      await say('ฟิล์มพร้อมแล้ว ต่อไปขึ้นลิฟต์ไปห้องยาชั้น 2 ตามเส้นแดงนะ', n.name);
    },
    async bed() { await say('เตียงคนไข้มีล้อ เดินชนเพื่อดันได้ ถ้าดันจนติดมุม ให้ป้าแม่บ้านช่วยเข็นกลับที่เดิม'); },
    async cleaner(n) {
      if (await G.ui.confirm('เตียงเกะกะทางเดินเหรอหลาน ให้ป้าเข็นกลับที่เดิมไหม?', n.name)) {
        for (const id of ['bed1', 'bed2', 'bed3']) delete S().npcPos[id];
        await G.fadeTo(() => G.refreshNpcs()); await say('ป้าเข็นเตียงกลับที่เดิมให้แล้วจ้า', n.name);
      }
    },
    async sister(n) {
      if (F().sister_healed) { await say('{happy}หมอบูมบอกว่าจ๋าหายแล้ว! ผีที่มาหาตอนกลางคืนก็ไม่ใช่ผีร้าย มันแค่หนาว ไม่มีบ้านอยู่', n.name); return; }
      if (F().porridge_got && !F().porridge_done) {
        delete S().bag.porridge;
        await say('{happy}ข้าวต้มหมูสับ! พี่โจ้ฝากมาเหรอ... ขอบคุณนะ อร่อยที่สุดเลย', n.name);
        await finishQuest('s_porridge'); return;
      }
      await say('ไอ้แค่กๆ... ทุกคืนจะมีผีพยาบาลมายืนข้างเตียง ถามว่ากินยาหรือยัง จ๋ากลัวจนนอนไม่หลับ', n.name);
    },
    async joe_ward(n) { await say(F().sister_healed ? 'ขอบใจพวกแกมาก... คราวหน้าเจอกันในทุ่ง ข้าไม่ท้าสู้แล้ว จะชวนไปจับปลาแทน' : 'หมอบูมยังไม่ยอมมาตรวจน้องข้าเลย... ฝากด้วยนะ', n.name); },
    async pharm(n) {
      if (!F().tr_samlee) { await say('ห้องยาเข้าได้เฉพาะเจ้าหน้าที่นะครับ ต้องผ่านน้องสำลีก่อน', n.name); return; }
      if (!F().h_rx) {
        await say('ผ่านสำลีมาได้เหรอ ใช้ได้ๆ นี่ใบสั่งยา ยื่นที่ประตูหลังชั้น 1 แล้วจะเข้าคลินิกหมอบูมได้', n.name);
        F().h_rx = true; G.sfx('level'); await say('ได้รับใบสั่งยา! ลงลิฟต์ไปชั้น 1 แล้วเดินตามเส้นม่วงไปประตูหลัง');
        return;
      }
      await say('ห้องยาขายให้คนทั่วไปด้วยนะครับ', n.name); await G.ui.shop(['saline', 'herb_big', 'thaitea_shake'], n.name);
    },
    // ---------- คลินิกหมอบูม (ยิม 3) ----------
    async skeleton() { await say('โครงกระดูกจำลองในตู้ใส่หูฟังกับแว่นกันแดด ใครแกล้งแต่งให้เนี่ย'); },
    async boommom(n) { await say('{happy}ลูกแม่เป็นหมอแล้วก็ยังต้องให้เด็กบ้านนาสอนอีก ฮ่าๆ ขอบใจหลายๆ นะหลาน กินส้มตำก่อนไหม', n.name); },
    async boom(n) {
      if (F().gym3_done) {
        await say(F().sister_healed ? 'น้องจ๋าหายดีแล้ว ไข้ลดตั้งแต่เมื่อคืน... ขอบใจที่ทำให้พี่จำได้ว่าตัวเองมาจากไหน' : 'พี่จะขึ้นไปตรวจน้องจ๋าเดี๋ยวนี้แหละ', n.name);
        await say('ม่อน เพื่อนพี่กำลังแข่งเกมที่ตัวเมือง เขาเป็นเด็กหมู่บ้านน้องนะ นั่งสองแถวที่ตัวอำเภอเข้าไปดูสิ', n.name);
        return;
      }
      await G.ui.sayAll(['...อะไรเนี่ย เด็กบ้านนอกหลุดเข้ามาในคลินิกได้ยังไง', 'อินเทิร์นภูมิใจปล่อยเข้ามาเหรอ เดี๋ยวพี่ต้องคุยกับเขาหน่อย',
        'เด็กบ้านนาจะรู้อะไรเรื่องการรักษา กลับไปเลี้ยงควายเถอะ'], n.name);
      await say('{angry}พี่ไม่ยอมตรวจน้องจ๋า แล้วยังว่าเด็กบ้านนอกสกปรกอีก! ถ้าเราชนะ พี่ต้องไปตรวจน้องจ๋า!', S().name);
      await say('ฮึ... ได้ ถ้าชนะพี่ได้จริง พี่จะยอมทุกอย่าง แต่ก่อนสู้...', n.name);
      await say('หมอไม่สู้กับคนป่วย ขอตรวจร่างกายก่อน... อืม คนนี้ช้ำ คนนี้เหนื่อย เอ้า หายหมดแล้ว', n.name);
      G.heal(); G.sfx('heal'); await say('พี่บูมรักษาทุกคนจนแข็งแรงเต็มที่!');
      await say('ทีนี้แหละ พี่ไม่ออมมือแล้วนะ!', n.name);
      const team = [G.makeMon('taehak', 24, { ivs: 22 }), G.makeMon('pusom', 25, { ivs: 22 }), G.makeMon('boom', 26, { ivs: 25 })];
      let warned = false;
      const onSend = async (b) => { if (warned || G.DATA.species[b.me.sp].type !== 'electric') return; warned = true; await G.ui.say('พี่บูม: "ธาตุสายฟ้ามาสู้ธาตุดินเหรอ ไม่เรียนมาเลยสินะ"', null, { battle: true, auto: 1100 }); };
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่บูม', trainerLook: 'boom', ai: 2, money: 1200, bg: 'clinic', potions: 2, onSend });
      if (r !== 'win') { await say('เห็นไหมล่ะ กลับไปเลี้ยงควายเถอะ', n.name); await blackout(); return; }
      F().gym3_done = true; G.sfx('level');
      await G.ui.sayAll(['...แพ้เด็กบ้านนาเหรอ', 'พี่... พี่ก็เป็นเด็กบ้านนาเหมือนกัน แม่ขายส้มตำอยู่หน้าโรงเรียน กว่าจะได้เป็นหมอ ต้องอ่านหนังสือใต้ไฟถนนทุกคืน',
        'พอเข้าเมืองมา พี่อายที่ตัวเองมาจากบ้านนอก เลยทำเป็นดูถูกคนบ้านนอกไปด้วย... โง่จริงๆ'], n.name);
      await G.fadeTo(() => G.refreshNpcs());
      await say('{happy}บูม! แม่เอาส้มตำมาส่ง ได้ยินว่าลูกแพ้เด็กประถมเหรอ ฮ่าๆ', 'แม่พี่บูม');
      await say('แม่... ผมขอโทษนะครับ ที่ไม่เคยบอกใครว่าแม่ขายส้มตำ', n.name);
      await say('{happy}ไม่เป็นไรลูก แค่จำไว้ว่าเราเป็นหมอเพราะอยากช่วยคน ไม่ว่าคนจากไหน', 'แม่พี่บูม');
      await say('ครับแม่... เอาไป ตราหูฟัง', n.name);
      await G.ui.gotPopup({ sprite: 'badge:gym3', name: 'ตราหูฟัง', head: 'ได้รับตรายิม', rar: 'l', tag: 'ตรายิม', desc: 'ชนะพี่บูม หมอแห่งโรงพยาบาลอำเภอ', auto: 3200 });
      await say('แล้วก็ท่าลับ ทุบโคลนบำบัด สอนให้เพื่อนธาตุดินได้ทุกคน กับกระเป๋าปฐมพยาบาลของพี่ เดินทางไกลจะได้ไม่ต้องห่วง', n.name);
      await give('tm_mud_therapy', 1); await give('first_aid', 1);
      await say('พี่จะขึ้นไปตรวจน้องจ๋าเดี๋ยวนี้เลย', n.name);
      await G.fadeTo(() => { F().sister_healed = true; });
      await G.ui.sayAll(['ตรวจน้องจ๋าแล้ว ไม่ใช่โรคร้ายอะไร แค่ไข้หวัดกับนอนไม่พอ', 'แต่แปลก... ช่วงนี้ผีสางมาหาพี่เยอะผิดปกติ ทั้งผีพยาบาล ทั้งรถเข็น ทั้งผีจากริมพอง',
        'ตรวจดูแล้วไม่ใช่โรค มันเหมือนบ้านของพวกมันถูกรบกวน... ป่าแถวดอนปู่ตาโดนตัดหรือเปล่า', 'ผีมันหนีมาอยู่ใกล้คน เพราะไม่มีที่อยู่ ไปถามเฒ่าจ้ำที่หมู่บ้านน้องดู ตราหูฟังจะทำให้เข้าดอนปู่ตาได้'], n.name);
      if (!takenNames().has('น้องภูมิใจ') && !F().intern_joined) {
        await say('พี่บูมครับ... ผมขอตามเด็กพวกนี้ไปด้วยได้ไหม อยากไปดูว่าดอนปู่ตาเกิดอะไรขึ้น', 'น้องหมออินเทิร์นภูมิใจ');
        if (await G.ui.confirm('ให้น้องหมอภูมิใจเข้าแก๊งไหม?')) {
          const m = G.makeMon('med_doc', 22, { name: 'น้องภูมิใจ', look: 'eng:med_doc:0' }); recruit(m); F().intern_joined = true;
          G.sfx('level'); await say(`น้องภูมิใจเข้าแก๊งแล้ว!${S().party.includes(m) ? '' : ' (ทีมเต็ม ไปรออยู่ในคลังแก๊ง)'}`);
        }
      }
      await G.ui.panel(`<div class="intro"><b>จบบทที่ 3!</b><br><br>แก๊งของ ${S().name} ชนะพี่บูมที่คลินิกหลังโรงพยาบาลอำเภอ<br>ได้ตราหูฟังเป็นตราที่สาม และช่วยให้น้องจ๋าหายป่วย<br><br>ได้ข่าวว่าในตัวเมืองขอนแก่น มีโปรเพลเยอร์จากหมู่บ้านเรากำลังจะแข่ง...<br><br><small>บทสุดท้าย: นั่งสองแถวที่ตัวอำเภอเข้าตัวเมืองขอนแก่น</small></div>`);
    },
    async tutor(n) {
      await say(n.id === 'kru_kku' ? 'อาจารย์สอนวิชาต่อสู้เชิงวิศวกรรม จัดท่าใหม่ได้ฟรี ท่าพิเศษคิดค่าเรียนนิดหน่อย' : 'มาๆ ครูมวยบุญหลายสอนท่าให้ จัดท่าใหม่ฟรี ท่าพิเศษเก็บค่าครูนิดหน่อย ฮึบ!', n.name);
      await G.ui.tutor(n.name);
    },
    async lvshop(n) {
      await say('ข้าวจี่ ข้าวหลาม ไข่ปิ้ง ร้อนๆ จ้า! กินแล้วแข็งแรง เลเวลขึ้นไวทันใจ', n.name);
      await G.ui.shop(['egg_ping', 'khao_ji', 'khao_lam'], n.name);
    },
    async door_locked() { await say('ประตูปิดอยู่'); },
    async door_closed(d) { await say(d.closedText || 'ปิดแล้ว ไว้มาใหม่ตอนกลางวันนะ'); },
    async shop_hint() { await say('กระดานเขียนว่า: "คัตเอาต์ต่อมั่ว! สับตัวไหน ไฟดวงนั้นกับดวงข้างๆ จะสลับติด-ดับ ทำให้ไฟติดครบ 4 ดวง ประตูเหล็กจะเปิด"'); },
    async switch(o) {
      if (F().shop_gate) { await say('ไฟติดครบทั้งตึกแล้ว ไม่ต้องยุ่งกับคัตเอาต์อีก'); return; }
      const i = o.arg;
      F()['sw_' + i] = !F()['sw_' + i];
      for (const j of [i - 1, i, i + 1]) if (j >= 0 && j < 4) F()['lamp_' + j] = !F()['lamp_' + j];
      G.sfx('switch');
      const lit = [0, 1, 2, 3].map((j) => (F()['lamp_' + j] ? '●' : '○')).join(' ');
      if ([0, 1, 2, 3].every((j) => F()['lamp_' + j])) {
        F().shop_gate = true; G.sfx('power');
        await say(`ไฟ: ${lit}  ...ครืน! ไฟติดสว่างทั้งตึก ประตูเหล็กไปหาพี่เฟรนด์เปิดแล้ว!`);
      } else await say(`สับคัตเอาต์ตัวที่ ${i + 1} — ไฟ: ${lit}`);
    },
    async friend(n) {
      const ung = inParty('ungying'), ungAny = has('ungying');
      if (F().gym2_done) {
        if (!F().member4_joined) await pickKid('member4_joined');
        if (ung) await say('...ดูแลอุ๋งอิ๋งดีๆ ล่ะ ไม่ใช่ว่าพี่ห่วงหรอกนะ แค่... ช่างเถอะ ไปไกลๆ เลย', n.name);
        else await say('ไปเจอพี่บูมให้ได้นะ หมอนั่นตีแรงกว่าที่เห็นเยอะ', n.name);
        return;
      }
      await G.ui.sayAll(['เด็กประถมผ่านพี่ว้ากกับห้องคัตเอาต์มาได้เหรอ... ใช้ได้', 'พี่ชื่อเฟรนด์ วิศวะเครื่องกล หัวโจกโรงช็อปนี้',
        'ตราเฟืองไม่ได้แจกฟรีนะน้อง ต้องหมุนให้ทันเฟืองของพี่!'], n.name);
      let rage = null;
      if (ung) {
        await say('...เดี๋ยวนะ คนข้างหลังนั่น... อุ๋งอิ๋ง!?', n.name);
        await say('เฟรนด์... เราขอโทษ เรามาเพื่อ...', 'อุ๋งอิ๋ง');
        await say('ไม่ต้องพูด! ไม่อยากได้ยินอะไรทั้งนั้น! น้องพาคนนี้มาทำไม! สู้กันให้จบไปเลย!', n.name);
        rage = { sp: 'friend', st: { atk: 1, spa: 1 }, text: 'พี่เฟรนด์โมโหจนหน้าแดง! พลังโจมตีและพลังพิเศษเพิ่มขึ้น!' };
      }
      let shown = false;
      const onSend = async (b) => {
        if (shown || b.me.sp !== 'ungying') return;
        shown = true;
        await G.ui.say('พี่เฟรนด์: "เธอจะลงมาสู้กับเราเองเลยเหรอ!"', null, { battle: true, auto: 1100 });
      };
      const team = [G.makeMon('eng_elec', 16, { ivs: 20, name: 'น้องโวลต์', look: 'eng:eng_elec:1' }),
        G.makeMon('eng_mech', 17, { ivs: 20, name: 'น้องต้น', look: 'eng:eng_mech:0' }), G.makeMon('friend', 18, { ivs: 25 })];
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่เฟรนด์', trainerLook: 'friend', ai: 2, money: 800, bg: 'kku_shop', rage, onSend });
      if (r !== 'win') { await say('เฟืองยังหมุนไม่ทันนะน้อง ไปฝึกมาใหม่', n.name); await blackout(); return; }
      F().gym2_done = true; G.sfx('level');
      await G.ui.sayAll(['...แพ้เด็กประถมอีกคนแล้วสินะ ออสซี่หัวเราะพี่แน่', 'เอาไป ตราเฟือง'], n.name);
      await G.ui.gotPopup({ sprite: 'badge:gym2', name: 'ตราเฟือง', head: 'ได้รับตรายิม', rar: 'l', tag: 'ตรายิม', desc: 'ชนะพี่เฟรนด์ หัวโจกโรงช็อปวิศวะ', auto: 3200 });
      await say('แล้วก็ท่าลับของพี่ ช็อตวงจร สอนให้เพื่อนธาตุสายฟ้าได้ทุกคน', n.name);
      await give('tm_short_circuit', 1);
      await pickKid('member4_joined');
      if (ungAny) {   // ปิดเรื่องค้างใจ: ขอโทษต่อหน้า + คืนเฟืองตัวแรก
        await G.ui.sayAll([`${ung ? '' : '(อุ๋งอิ๋งเดินตามแก๊งเข้ามาในโรงช็อป) '}เฟรนด์... เราไม่ได้มาขอให้ยกโทษนะ`, 'วันนั้นเราผิดเอง เราทำร้ายเธอ แล้วยังหนีหน้ามาตลอด ไม่เคยพูดสักคำ',
          '{sad}เราขอโทษ... ขอโทษจริงๆ', 'แล้วก็... นี่ เฟืองตัวแรกของเธอ เราเก็บไว้ตลอด คิดว่าควรคืนเจ้าของ'], 'อุ๋งอิ๋ง');
        await say('......', n.name);
        const k = await G.ui.ask('พี่เฟรนด์มองเฟืองในมืออุ๋งอิ๋งอยู่นาน ไม่พูดอะไร... แก๊งจะพูดว่าอะไรดี?', '', ['"พี่เฟรนด์รับคืนไปเถอะครับ"', '"พี่อุ๋งเก็บไว้ก็ได้นะ"'], { cls: 'small', cancel: false });
        if (k === 0) {
          await G.ui.sayAll(['...อือ เอาคืนก็ได้ มันเป็นชิ้นงานแรกของเรา', 'คำขอโทษน่ะ ได้ยินแล้ว ...ขอบใจที่กล้ามาพูดต่อหน้า', 'ไปช่วยเด็กพวกนี้ให้ดีๆ ล่ะ แค่นั้นแหละ'], n.name);
          F().gear_returned = true;
        } else {
          await G.ui.sayAll(['เก็บไว้เถอะ มันเป็นของเธอไปแล้ว', 'คำขอโทษน่ะ ได้ยินแล้ว ...ขอบใจที่กล้ามาพูดต่อหน้า', 'เอาไว้ให้เด็กพวกนี้ใช้ เฟืองตัวนั้นเก็บไฟฟ้าได้ดีกว่าที่เห็นนะ'], n.name);
          await say('...ขอบใจนะเฟรนด์ งั้นพี่ฝากไว้กับแก๊งนี้แล้วกัน', 'อุ๋งอิ๋ง');
          await give('first_gear', 1); F().gear_kept = true;
        }
        F().friend_forgave = true;
      }
      await G.ui.sayAll(['ยามสะพานข้ามลำน้ำพองรู้จักพี่ บอกว่าพี่อนุญาต สะพานเปิดให้น้องแล้ว', 'ข้ามไปจะเจอทางไปโรงพยาบาลอำเภอ พี่บูมหมอหนุ่มรออยู่ที่คลินิกหลังโรงพยาบาล ระวังเข็มฉีดยาชาของมันด้วย'], n.name);
      if (ungAny) await G.fadeTo(() => G.loadMap('canteen', 3, 4, 'up'));   // ฉากปิด: ไปนั่งที่ร้านน้ำปั่นอิงอิง
      if (ungAny) await G.flashback('เย็นวันนั้น · ร้านน้ำปั่นอิงอิง', [['มะม่วงหนึ่ง... แตงโมหนึ่ง', 'เฟรนด์'], ['อิงอิงยิ้มกว้างจนตาหยี แต่ไม่พูดอะไรสักคำ', ''], ['พี่เฟรนด์วางแก้วแตงโมไว้ที่โต๊ะข้างๆ อุ๋งอิ๋ง แล้วนั่งลงอีกฝั่ง', ''], ['ไม่ได้กลับไปเป็นเหมือนเดิมหรอกนะ แต่... เป็นเพื่อนกันได้', 'เฟรนด์'], ['อือ เพื่อนกัน', 'อุ๋งอิ๋ง']]);
      await G.ui.panel(`<div class="intro"><b>จบบทที่ 2!</b><br><br>แก๊งของ ${S().name} ชนะพี่เฟรนด์ที่โรงช็อปวิศวะ มข.<br>ได้ตราเฟืองเป็นตราที่สอง${ungAny ? '<br>และช่วยให้อุ๋งอิ๋งได้ขอโทษพี่เฟรนด์ต่อหน้า' : ''}<br><br><small>เล่นต่อเพื่อชวนน้องวิศวะให้ครบทุกสาขาและทุกคน · ข้ามสะพานลำน้ำพองไปหาพี่บูมที่โรงพยาบาลอำเภอได้เลย</small></div>`);
    },
  };

  G.SCRIPTS = SCRIPTS;
  G.runScript = async function (name, ...args) {
    if (G.busy || !SCRIPTS[name]) return;
    G.busy = true;
    try { await SCRIPTS[name](...args); }
    catch (e) { console.error(e); await G.ui.say('เกิดข้อผิดพลาด: ' + e.message); }
    finally { G.busy = false; G.ui.skipping = false; }
    if (!name.startsWith('_') && G.autosave) G.autosave();   // จบเหตุการณ์/การต่อสู้แล้วบันทึกอัตโนมัติ
  };
})(window.G = window.G || {});
