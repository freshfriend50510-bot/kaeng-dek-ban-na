// สคริปต์เหตุการณ์และบทพูดทั้งหมด แก้บทพูดได้ที่ไฟล์นี้
(function (G) {
  'use strict';
  const say = (t, n) => G.ui.say(t, n);
  const S = () => G.state;
  const F = () => G.state.flags;
  const KIDS = ['bee', 'am', 'tle', 'ter'];
  const COUNTER = { bee: 'phrai', am: 'kongkoi', tle: 'krahang', ter: 'phong' }; // ผีธาตุที่ชนะทางเด็กแต่ละคน
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
  const ENG_LINES = ['อยากกินหมูกระทะอีกแล้วครับพี่', 'งานกลุ่มยังไม่เสร็จเลย... ช่างมันก่อน ไปลุย!', 'พี่เฟรนด์ดุแต่ใจดีนะ จริงๆ', 'ใส่เสื้อช็อปแล้วรู้สึกเท่ขึ้นสามเท่า', 'เดินตามน้องประถมแบบนี้ รุ่นพี่เห็นต้องโดนว้ากแน่'];

  G.markSeen = (sp) => { if (!G.state.dex[sp]) G.state.dex[sp] = 1; };
  G.heal = () => { for (const m of [...S().party, ...S().storage]) { m.hp = m.stats.hp; m.status = null; m.moves.forEach((s) => { s.pp = G.DATA.moves[s.id].pp; }); } };
  const give = async (id, n) => { S().bag[id] = (S().bag[id] || 0) + n; G.sfx('buy'); await say(`ได้รับ ${G.DATA.items[id].name}${G.DATA.items[id].kind === 'tm' ? '' : ' ×' + n}`); };
  const has = (sp) => [...S().party, ...S().storage].some((m) => m.sp === sp);
  const inParty = (sp) => S().party.some((m) => m.sp === sp);
  const recruit = (m) => { if (S().party.length < 6) S().party.push(m); else S().storage.push(m); G.state.dex[m.sp] = 2; };
  const takenNames = () => new Set([...S().party, ...S().storage].map((m) => m.name));
  // จุดฟื้นล่าสุด (หมดแรงแล้วไปตื่นที่นี่)
  const restHere = () => { S().lastHeal = { map: S().map, x: S().x, y: S().y, dir: S().dir }; };
  const fullHeal = async (text, name) => { G.heal(); G.sfx('heal'); restHere(); await say(text || 'ทุกคนกลับมาแข็งแรงเต็มที่!', name); };
  const ride = async (to, x, y, dir, text) => {
    await G.fadeTo(() => { G.showToast(text); });
    await G.wait(500);
    await G.fadeTo(() => G.loadMap(to, x, y, dir));
    await SCRIPTS.enter(to);
  };

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
    let team = tr.team;
    if (tr.dyn === 'rival2') team = [[COUNTER[S().starter], 9], ['pob', 8]];
    const taken = new Set();
    const foes = team.map(([sp, lv]) => { const m = G.spawn(sp, lv, { taken }); taken.add(m.name); return m; });
    await say(tr.intro, tr.name);
    const r = await G.runBattle(foes, { kind: 'trainer', trainerName: tr.name, trainerLook: n.look, money: tr.money });
    if (r === 'win') { F()[tr.flag] = true; await say(tr.lose, tr.name); G.refreshNpcs(); }
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
      G.rainFor(500);
      await say('บั้งไฟพุ่งทะลุเมฆ แล้วฝนก็โปรยลงมาเย็นฉ่ำทั้งหมู่บ้าน! ไกลๆ ได้ยินเสียงคางคกร้องอ๊บๆ อย่างพอใจ');
      G.music(G.world.def.music);
      const order = KIDS.indexOf(S().starter);
      const k = KIDS[(order + 2) % 4], sp = G.DATA.species[k];
      if (!has(k)) {
        await say(`${S().name}! เราดูมาตั้งนานแล้ว แก๊งนี้สนุกที่สุดในหมู่บ้าน ขอเข้าด้วยคนนะ!`, sp.name);
        const lead = S().party.reduce((a, m) => Math.max(a, m.lv), 1);
        recruit(G.makeMon(k, Math.max(10, lead - 1)));
        G.sfx('level');
        await say(`${sp.name} เข้าแก๊งแล้ว! ตอนนี้แก๊งมีเด็กบ้านนาสามคนแล้ว`);
        F().member3_joined = true;
      }
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
      if (F().boss1_done) stock.splice(1, 0, 'rice_pork');
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
    async novice() { await say('หลวงตาบอกว่าถ้าตั้งใจไหว้พระ จิตใจจะสงบ สู้ผีก็ไม่กลัว', 'เณรน้อย'); },
    async altar() { await say('ไหว้พระสามครั้ง... จิตใจสงบลง ทุกคนสดชื่นขึ้น'); G.state.party.forEach((m) => { m.status = null; }); G.sfx('heal'); },
    async jam() {
      if (F().gym3_done) await say('มีตราหูฟังแล้ว ปู่ตาอนุญาตให้เข้าแล้วล่ะ', 'เฒ่าจ้ำ');
      else await say('บ่ได้ดอกหลาน ปู่ตาบ่ให้เข้า ไว้มีบุญค่อยมา', 'เฒ่าจ้ำ');
    },
    async tasi() {
      if (!F().starter_chosen) { await say('เด็กน้อย เถียงนาตาสีเอาไว้ฝากผีสางที่ชวนมาได้นะ', 'ตาสี'); return; }
      if (!F().catch_tutorial) {
        await G.ui.sayAll(['ได้ยินว่าตั้งแก๊งแล้วเหรอ ตาสอนชวนผีให้', 'เจอผีสางในนาข้าว ให้ตีจนมันเหลือแรงน้อยๆ',
          'แล้วเปิดกระเป๋า ถวายข้าวเหนียวปั้น ถ้ามันหลับหรือชาอยู่ยิ่งชวนง่าย', 'ทีมมีได้หกคน ที่เกินมาตาเลี้ยงไว้ให้ในไหในเถียงนานี่ เข้าไปจัดทีมได้ตลอด'], 'ตาสี');
        await give('rice_ball', 3);
        F().catch_tutorial = true;
      } else await say('สมาชิกที่ฝากไว้ตาดูแลอย่างดี เข้าไปในเถียงนาแล้วเปิดไหดูได้เลย', 'ตาสี');
    },
    async storage() { await G.ui.storageMenu(); G.refreshNpcs(); },
    async beedad() {
      if (!F().starter_chosen) { await say('ควายของลุงนอนขวางทางลงทุ่งแน่ะ เดี๋ยวค่อยไปจูงออก', 'พ่อบี'); return; }
      if (!F().field_open) {
        await say('จะลงทุ่งไปปราบผีเหรอ เก่งแท้ลูกหลานบ้านเรา! เดี๋ยวลุงไปจูงควายออกให้', 'พ่อบี');
        F().field_open = true; G.refreshNpcs(); G.sfx('level');
        await say('ทางลงทุ่งนาเปิดแล้ว!');
      } else await say('ระวังผีโพงตอนกลางคืนนะ มันชอบออกมาตอนมืด', 'พ่อบี');
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
      if (F().boss1_done) { await say('ส้มตำแม่เติ้ลแซ่บที่สุดในหมู่บ้าน! วันนี้มีข้าวเหนียวหมูปิ้งด้วยนะ', 'แม่เติ้ล'); await G.ui.shop(['rice_pork', 'herb', 'herb_big'], 'แม่เติ้ล'); }
      else await say('ส้มตำปลาร้าต้องรอฝนตกก่อน มะละกอแห้งหมดแล้ว', 'แม่เติ้ล');
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
      const r = await G.runBattle([G.spawn(sp, lv, { taken: takenNames() })], { kind: 'wild' });
      if (r === 'lose') await blackout();
    },
    async follower_talk(m) {
      const sp = G.DATA.species[m.sp];
      if (m.sp === 'ungying') {
        if (G.state.map === 'kku_shop') await say('...พี่เฟรนด์อยู่ในนี้ใช่ไหม ใจเต้นแรงจัง', m.name);
        else await say(['ขอบใจนะที่ให้พี่มาด้วย พี่จะช่วยเต็มที่', 'น้ำปั่นร้านอิงอิง... เมื่อก่อนพี่เฟรนด์ชอบซื้อมาให้ทุกวัน', 'ตรงนี้ลมเย็นดีนะ เหมาะกับนั่งอ่านหนังสือ'][Math.floor(G.rng() * 3)], m.name);
      } else if (FOLLOW_LINES[m.sp]) await say(FOLLOW_LINES[m.sp][Math.floor(G.rng() * 3)], m.name);
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
      G.rainFor(400); G.sfx('level');
      await say('ฟ้าคำราม แล้วฝนก็เทลงมาเป็นครั้งแรกในรอบสามเดือน!');
      const order = KIDS.indexOf(S().starter);
      const k = KIDS[(order + 1) % 4], sp = G.DATA.species[k];
      await say(`${S().name}! เห็นนะว่าเก่งแค่ไหน ให้เราเข้าแก๊งด้วยคน!`, sp.name);
      recruit(G.makeMon(k, Math.max(6, S().party[0].lv - 1)));
      G.sfx('level');
      await say(`${sp.name} เข้าแก๊งแล้ว!`);
      F().member2_joined = true;
      await say('ทางคันนาข้ามหนองไปตลาดนัดตำบลเปิดแล้ว ได้ยินว่าแก๊งพี่ออสซี่คุมร้านราเมงที่นั่น...', sp.name);
    },
    // ---------- ตลาดนัด ยิม 1 ----------
    async vendor() { await say(F().gym1_done ? 'ตั้งแต่แก๊งพี่ออสซี่เลิกคุมตลาด ลูกชิ้นขายดีขึ้นเท่าตัว!' : 'ตลาดนัดตำบลคึกคักทุกวันเสาร์ แต่ช่วงนี้แก๊งพี่ออสซี่มาเดินคุม ใครก็ไม่กล้าเข้าร้านราเมง', 'พ่อค้าลูกชิ้น'); },
    async vendor2() {
      await say('หมูปิ้งร้อนๆ จ้า ผีสางชอบนัก!', 'แม่ค้าหมูปิ้ง');
      await G.ui.shop(['rice_pork', 'herb', 'herb_big', 'holy_water'], 'แม่ค้าหมูปิ้ง');
    },
    async curtain_wrong(ct) {
      G.sfx('bump');
      await say('ม่านผืนนี้พาเดินวนไปวนมา... รู้ตัวอีกทีก็กลับมาที่ทางเข้าแล้ว!');
      await G.fadeTo(() => G.loadMap(G.state.map, ct.tx, ct.ty, 'up'));
    },
    async cook() { await say(F().gym1_done ? 'น้ำซุปกระดูกหมูเคี่ยวสิบสองชั่วโมง กินแล้วหายเหนื่อย' : 'ม่านในร้านนี้ลูกพี่ให้แขวนไว้หลอกคน มีผืนเดียวที่ลมพัดไหว... ไม่ได้บอกนะ', 'กุ๊กราเมง'); },
    async ossie() {
      if (F().gym1_done) { await say('ราเมงชามนี้พี่เลี้ยงเอง กินให้อร่อยนะน้อง', 'พี่ออสซี่'); await fullHeal('ทุกคนกินราเมงจนอิ่มแปล้ แข็งแรงเต็มที่!'); return; }
      await G.ui.sayAll(['ยินดีต้อนรับสู่ร้านราเมงลมทุ่ง... ฐานของแก๊งพี่เอง', 'ได้ยินว่าน้องปราบคางคกเจ้าหนองได้ แถมเดินผ่านม่านลมมาถึงนี่ เก่งใช้ได้',
        'แต่ลมกลางทุ่งของพี่ไม่เหมือนลมธรรมดานะ ถ้าอยากได้ตราผ้าโพก ต้องชนะพี่ให้ได้ก่อน!'], 'พี่ออสซี่');
      const team = [G.makeMon('krahang', 8, { ivs: 20 }), G.makeMon('krahang', 9, { ivs: 20 }), G.makeMon('ossie', 10, { ivs: 25 })];
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่ออสซี่', trainerLook: 'ossie', ai: 2, money: 500, bg: 'ramen' });
      if (r !== 'win') { await say('ยังอ่อนไปนะน้อง กลับไปฝึกแล้วค่อยมาใหม่', 'พี่ออสซี่'); await blackout(); return; }
      F().gym1_done = true; G.sfx('level');
      await G.ui.sayAll(['โอ้โห... แพ้เด็กจนได้', 'เอาไป ตราผ้าโพก หลักฐานว่าชนะยิมแรกแล้ว'], 'พี่ออสซี่');
      await say('ได้รับ ตราผ้าโพก!');
      await say('แล้วก็นี่ ท่าลับของพี่ สอนให้เพื่อนธาตุลมในแก๊งได้ทุกคน', 'พี่ออสซี่');
      await give('tm_wind_blade', 1);
      await G.ui.sayAll(['ต่อไปน้องต้องไปเจอพี่เฟรนด์ วิศวะเครื่องกลหัวไม้ที่ มข. ระวังไฟช็อตล่ะ ฮ่าๆ', 'แต่ก่อนไป กลับไปฉลองที่หมู่บ้านก่อนสิ ได้ยินว่าจะจุดบั้งไฟกันนี่'], 'พี่ออสซี่');
    },
    async driver() {
      if (!F().gym1_done) { await say('ลุงวิ่งรถไป มข. ทุกวัน แต่ช่วงนี้แก๊งร้านราเมงคุมตลาด ไม่มีใครกล้านั่งรถลุงเลย', 'ลุงสองแถว'); return; }
      if (!F().festival_done) { await say('ได้ข่าวว่าหมู่บ้านเอ็งจะจุดบั้งไฟฉลอง กลับไปงานบุญก่อน แล้วค่อยมานั่งรถลุง ลุงรอได้', 'ลุงสองแถว'); return; }
      if (!(await G.ui.confirm('ไป มข. ไหมหลาน? ลุงพาไปฟรี เด็กเก่งแบบนี้ไม่คิดตังค์', 'ลุงสองแถว'))) return;
      await ride('kku', 5, 13, 'down', 'นั่งสองแถวไปมหาวิทยาลัยขอนแก่น...');
    },
    async driver2() {
      if (!(await G.ui.confirm('กลับตลาดนัดตำบลไหม? ลุงพาไปส่ง', 'ลุงสองแถว'))) return;
      await ride('market', 21, 8, 'left', 'นั่งสองแถวกลับตลาดนัดตำบล...');
    },
    async songthaew() { await say('รถสองแถวสีฟ้าของลุง คุยกับลุงคนขับเพื่อนั่งรถ'); },
    // ---------- มข. ----------
    async guard() { await say(F().gym2_done ? 'สะพานเปิดแล้ว ข้ามไปทางโรงพยาบาลอำเภอได้ แต่ทางยังไม่เสร็จนะ' : 'เด็กประถมมาเที่ยวมหาลัยเหรอ ระวังพี่ว้ากหน้าโรงช็อปนะ เสียงดังจนนกตกต้นไม้', 'ยามสมพงษ์'); },
    async gossip1() { await say('รู้ยัง พี่เฟรนด์กับอุ๋งอิ๋งเคยเป็นแฟนกันนะ! แต่อุ๋งอิ๋งไปนอกใจ พี่เฟรนด์เลยเกลียดมาก ห้ามพูดชื่อนี้ใกล้โรงช็อปเด็ดขาด', 'พี่ปีสองแนท'); },
    async gossip2() { await say('เห็นอุ๋งอิ๋งนั่งเหม่อในห้องแล็บเคมีทุกวันเลย สงสัยจะเสียใจเหมือนกันนะ', 'พี่ปีสองบุ๋ม'); },
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
      await G.ui.sayAll(['วิศวะมีหลายสาขานะ ดูจากสีเสื้อช็อปกับตราที่อกได้เลย', 'เครื่องกลเสื้อดำตราเฟือง โยธาสีอิฐตราสะพาน ไฟฟ้าสีกรมท่าตราสายฟ้า',
        'เคมีสีม่วงตราขวดแก้ว สิ่งแวดล้อมสีเขียวตราใบไม้ อุตสาหการสีเทาตรากราฟ', 'น้องๆ ปีหนึ่งชอบหนีเรียนไปเดินในหญ้ารก ถ้าเจอก็เลี้ยงหมูกระทะชวนเข้าแก๊งไปเลย ครูอนุญาต'], 'อาจารย์สมศักดิ์');
    },
    async sleepy(n) { await say('ฟี้... สมการโมเมนตัม... ฟี้... ขอลอกการบ้านหน่อย... ฟี้...', n.name); },
    async eng_board() { await say('บนกระดานเต็มไปด้วยสูตรยาวเหยียด มุมล่างมีคนเขียนว่า "พี่เฟรนด์ใจร้าย" แล้วมีคนขีดฆ่าทิ้ง'); },
    async chem_shelf() { await say('ชั้นวางขวดสารเคมีเรียงเป็นระเบียบ ป้ายทุกขวดเขียนด้วยลายมือสวยๆ ของอุ๋งอิ๋ง'); },
    async ungying(n) {
      if (!F().ungying_met) {
        F().ungying_met = true;
        await G.ui.sayAll(['อ้าว... เด็กประถม? มาทำอะไรในห้องแล็บ', 'ได้ยินว่าจะไปท้าพี่เฟรนด์ที่โรงช็อปเหรอ...',
          'พี่ชื่ออุ๋งอิ๋ง เรียนวิศวะเคมี พี่เคยเป็นแฟนพี่เฟรนด์... แล้วพี่ก็ทำไม่ดีกับเขา ไปคุยกับคนอื่นตอนที่ยังคบกันอยู่',
          'ตั้งแต่นั้นพี่เฟรนด์ก็ไม่ยอมมองหน้าพี่อีกเลย'], n.name);
      }
      await say('ถ้าพวกน้องชนะพี่ได้ พี่จะขอตามไปด้วย อยากไปขอโทษพี่เฟรนด์ต่อหน้า... ลองดูไหม?', n.name);
      if (!(await G.ui.confirm('สู้กับอุ๋งอิ๋งไหม?'))) { await say('ไม่เป็นไร พี่รออยู่ตรงนี้นะ', n.name); return; }
      const r = await G.runBattle([G.makeMon('ungying', 15, { ivs: 20 })], { kind: 'trainer', trainerName: 'อุ๋งอิ๋ง', trainerLook: 'ungying', ai: 1, money: 0 });
      if (r !== 'win') { await blackout(); return; }
      await say('เก่งจริงๆ ด้วย... ขอพี่เข้าแก๊งนะ พี่จะช่วยเต็มที่', n.name);
      if (!(await G.ui.confirm('ให้อุ๋งอิ๋งเข้าแก๊งไหม?'))) { await say('อืม... ถ้าเปลี่ยนใจกลับมาหาพี่ได้นะ', n.name); return; }
      const lv = Math.max(15, S().party.reduce((a, m) => Math.max(a, m.lv), 1) - 1);
      recruit(G.makeMon('ungying', lv, { ivs: 25 }));
      F().ungying_joined = true; G.refreshNpcs(); G.sfx('level');
      await say('อุ๋งอิ๋งเข้าแก๊งแล้ว! (พาไปเจอพี่เฟรนด์... จะเป็นยังไงนะ)');
    },
    // โรงอาหาร
    async ingying(n) {
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
    async door_locked() { await say('ประตูปิดอยู่'); },
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
      const ung = inParty('ungying');
      if (F().gym2_done) {
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
      await say('ได้รับ ตราเฟือง!');
      await say('แล้วก็ท่าลับของพี่ ช็อตวงจร สอนให้เพื่อนธาตุสายฟ้าได้ทุกคน', n.name);
      await give('tm_short_circuit', 1);
      if (ung) {
        await say('เฟรนด์... เราขอโทษจริงๆ นะ เรื่องวันนั้นเราผิดเอง', 'อุ๋งอิ๋ง');
        await say('......อือ ได้ยินแล้ว ไปช่วยเด็กพวกนี้ให้ดีๆ ล่ะ แค่นั้นแหละ', n.name);
        F().friend_forgave = true;
      }
      await G.ui.sayAll(['ยามสะพานข้ามลำน้ำพองรู้จักพี่ บอกว่าพี่อนุญาต สะพานเปิดให้น้องแล้ว', 'ข้ามไปจะเจอทางไปโรงพยาบาลอำเภอ พี่บูมหมอหนุ่มรออยู่ที่คลินิกหลังโรงพยาบาล ระวังเข็มฉีดยาชาของมันด้วย'], n.name);
      await G.ui.panel(`<div class="intro"><b>จบบทที่ 2!</b><br><br>แก๊งของ ${S().name} ชนะพี่เฟรนด์ที่โรงช็อปวิศวะ มข.<br>ได้ตราเฟืองเป็นตราที่สอง${ung ? '<br>และช่วยให้อุ๋งอิ๋งได้ขอโทษพี่เฟรนด์' : ''}<br><br><small>เล่นต่อเพื่อชวนน้องวิศวะให้ครบทุกสาขาและทุกคน · ยิม 3 ของพี่บูมมาในเวอร์ชันหน้า</small></div>`);
    },
  };

  G.SCRIPTS = SCRIPTS;
  G.runScript = async function (name, ...args) {
    if (G.busy || !SCRIPTS[name]) return;
    G.busy = true;
    try { await SCRIPTS[name](...args); }
    catch (e) { console.error(e); await G.ui.say('เกิดข้อผิดพลาด: ' + e.message); }
    finally { G.busy = false; }
  };
})(window.G = window.G || {});
