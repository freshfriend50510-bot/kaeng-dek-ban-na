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

  G.markSeen = (sp) => { if (!G.state.dex[sp]) G.state.dex[sp] = 1; };
  G.heal = () => { for (const m of [...S().party, ...S().storage]) { m.hp = m.stats.hp; m.status = null; m.moves.forEach((s) => { s.pp = G.DATA.moves[s.id].pp; }); } };
  const give = async (id, n) => { S().bag[id] = (S().bag[id] || 0) + n; G.sfx('buy'); await say(`ได้รับ ${G.DATA.items[id].name} ×${n}`); };
  const npc = (id) => G.world.npcs.find((n) => n.id === id);

  async function blackout() {
    await say('ทุกคนหมดแรง... ฟ้ามืดลงต่อหน้าต่อตา');
    const lost = Math.floor(S().money * 0.1);
    S().money -= lost;
    G.heal();
    await G.fadeTo(() => G.loadMap('village', 4, 11, 'down'));
    await say(`ตื่นมาที่บ้าน แม่ทำกับข้าวรอไว้ ทุกคนกลับมาแข็งแรง${lost ? ` (ทำเงินหล่นหาย ${lost} บาท)` : ''}`, 'แม่');
  }

  async function trainerBattle(n) {
    const tr = n.trainer;
    const team = tr.team.map(([sp, lv]) => G.makeMon(sp, lv));
    await say(tr.intro, tr.name);
    const r = await G.runBattle(team, { kind: 'trainer', trainerName: tr.name, trainerLook: n.look, money: tr.money });
    if (r === 'win') { F()[tr.flag] = true; await say(tr.lose, tr.name); }
    else await blackout();
  }

  const SCRIPTS = {
    async intro() {
      await G.ui.panel(`<div class="intro"><b>แก๊งเด็กบ้านนา</b><br><br>ปีนี้ฝนไม่ตกมาสามเดือนแล้ว<br>ทุ่งนาหลังหมู่บ้านแห้งผาก และผีสางก็ออกมาป่วนกันทุกคืน<br><br><small>ลูกศร/WASD เดิน · Z หรือ Space คุย/ตกลง · X ยกเลิก (กดค้าง = วิ่ง) · Enter เมนู</small></div>`);
      const name = await G.askName();
      S().name = name;
      await say(`${name}! ตื่นได้แล้วลูก ผู้ใหญ่บ้านเรียกเด็กๆ ไปที่ศาลากลางบ้านแน่ะ`, 'แม่');
      await say('ศาลาอยู่ทางขวามือ เดินไปตามทางดินแดงนะลูก', 'แม่');
      F().intro_done = true;
      await G.tip('tip_controls', G.HOWTO);
    },
    async mom() {
      if (!F().starter_chosen) await say('รีบไปศาลากลางบ้านเถอะลูก ผู้ใหญ่บ้านรออยู่', 'แม่');
      else { await say('เหนื่อยก็เข้าบ้านมาพักนะลูก แม่ทำส้มตำรอไว้', 'แม่'); }
    },
    async door_home() {
      await say('กลับมาบ้านแล้ว แม่จัดข้าวเหนียวกับไก่ย่างให้กินจนอิ่ม', 'แม่');
      G.heal(); G.sfx('heal');
      await say('ทุกคนกลับมาแข็งแรงเต็มที่!');
      if (await G.ui.confirm('จะบันทึกเกมไหม?')) { G.save(); await say('บันทึกเกมแล้ว'); }
    },
    async elder() {
      if (F().starter_chosen) {
        if (!F().boss1_done) await say('ได้ยินว่าคางคกตัวใหญ่ไปนั่งขวางทางน้ำที่หนองใหญ่ในทุ่ง ฝนถึงได้ไม่ตก ฝากด้วยนะ', 'ผู้ใหญ่บ้านสมบัติ');
        else await say('ฝนตกแล้ว! ขอบใจหลายๆ เลย ทางไปตลาดนัดตำบลเปิดแล้วนะ ระวังแก๊งนักเลงด้วย', 'ผู้ใหญ่บ้านสมบัติ');
        return;
      }
      await G.ui.sayAll(['มาแล้วเหรอ เข้ามาๆ', 'ฝนไม่ตกมาสามเดือน นาแห้งหมด แถมผีสางยังออกมาป่วนทุ่งทุกคืน',
        'ผู้ใหญ่อย่างเราสู้ผีไม่ไหวหรอก ผีสางมันไม่กลัวผู้ใหญ่ มันกลัวเด็กซนๆ',
        'เลยอยากให้เจ้าตั้งแก๊งเด็กไปจัดการ เด็กสี่คนนี้อาสามาแล้ว', 'เลือกมาหนึ่งคนเป็นคู่หู ที่เหลือเดี๋ยวก็ตามไปช่วยเอง'], 'ผู้ใหญ่บ้านสมบัติ');
      for (;;) {
        const i = await G.ui.choose(KIDS.map((k) => ({ label: G.DATA.species[k].name, sub: G.TYPE_TH[G.DATA.species[k].type] })),
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
          await say(`${sp.name} เข้าแก๊งแล้ว!`);
          break;
        }
      }
      await say('ไปหาป้านวลที่ศาลา อสม. ถ้าเหนื่อย และแวะร้านป้าสมรด้วยนะ ป้าเขามีของจะให้', 'ผู้ใหญ่บ้านสมบัติ');
      G.refreshNpcs();
      await SCRIPTS.rival();
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
      if (r === 'win') await say('เชอะ! ฟลุคแหละ คราวหน้าไม่ยอมแน่!', 'โจ้ แก๊งบ้านเหนือ');
      else { await say('ฮ่าๆ แก๊งบ้านใต้ก็แค่นี้! ไปฝึกมาใหม่นะ!', 'โจ้ แก๊งบ้านเหนือ'); G.heal(); await say('(ป้านวลวิ่งมาช่วยทายาให้ทุกคน)'); }
      G.refreshNpcs();
    },
    async samorn() {
      if (F().starter_chosen && !F().gift_rice) {
        await say('อ้าว ได้ข่าวว่าตั้งแก๊งแล้วนี่ เอานี่ไป ข้าวเหนียวปั้น ไว้ถวายผีสางให้มันเชื่อง', 'ป้าสมร');
        await give('rice_ball', 5); F().gift_rice = true;
        await say('ผีสางมันก็หิวเหมือนคนนั่นแหละ ตีให้มันอ่อนแรงก่อน แล้วค่อยยื่นข้าวให้ มันจะยอมตามมา', 'ป้าสมร');
      } else await say('อยากได้อะไรก็เข้ามาในร้านเลยนะหลาน', 'ป้าสมร');
    },
    async door_shop() {
      await say('ร้านชำป้าสมร มีอะไรให้ช่วยจ๊ะ', 'ป้าสมร');
      const stock = ['rice_ball', 'herb', 'holy_water', 'magic_rice'];
      if (F().boss1_done) stock.splice(1, 0, 'rice_pork');
      await G.ui.shop(stock, 'ป้าสมร');
      await say('ขอบใจหลายจ้า', 'ป้าสมร');
    },
    async nual() { await say('ใครเจ็บใครเหนื่อยเข้ามาในศาลาได้เลยจ้ะ ป้ารักษาฟรี', 'ป้านวล อสม.'); },
    async door_osm() {
      await say('มาๆ ป้าทายาหม่องให้ แป๊บเดียวหาย', 'ป้านวล อสม.');
      G.heal(); G.sfx('heal');
      await say('ทุกคนกลับมาแข็งแรงเต็มที่!', 'ป้านวล อสม.');
    },
    async teacher() {
      await G.ui.sayAll(['ครูสอนเรื่องธาตุให้ฟังนะ', 'น้ำชนะดิน ดินชนะสายฟ้า สายฟ้าชนะลม และลมชนะน้ำ วนเป็นวงกลม',
        'ตีถูกธาตุแรงเป็นสองเท่า ตีผิดธาตุเหลือครึ่งเดียว ส่วนธาตุปกติไม่แพ้ไม่ชนะใคร',
        'ถ้าใช้ท่าธาตุเดียวกับตัวเอง ยังแรงขึ้นอีกครึ่งเท่าด้วยนะ'], 'ครูบุญมี');
    },
    async door_school() { await say('วันนี้วันเสาร์ โรงเรียนปิด แต่ครูบุญมียืนอยู่หน้าโรงเรียน'); },
    async monk() {
      await G.ui.sayAll(['สมัยก่อนมีพญาคางคกผู้รบชนะพญาแถน จนพญาแถนสัญญาว่าจะส่งฝนมาทุกปี',
        'ชาวบ้านจึงจุดบั้งไฟขึ้นฟ้าเตือนพญาแถนทุกต้นฤดูฝน', 'ปีนี้ไม่มีใครจุดบั้งไฟ ได้ยินว่าคางคกที่หนองใหญ่เลยงอนนั่งขวางทางน้ำ',
        'ถ้าไปเจอ ลองคุยดีๆ ก่อนนะหลาน'], 'หลวงตา');
      F().legend_heard = true;
    },
    async door_temple() { await say('ในสิมเงียบสงบ มีกลิ่นธูปจางๆ'); },
    async jam() {
      if (F().gym3_done) await say('มีตราหูฟังแล้ว ปู่ตาอนุญาตให้เข้าแล้วล่ะ', 'เฒ่าจ้ำ');
      else await say('บ่ได้ดอกหลาน ปู่ตาบ่ให้เข้า ไว้มีบุญค่อยมา', 'เฒ่าจ้ำ');
    },
    async tasi() {
      if (!F().starter_chosen) { await say('เด็กน้อย เถียงนาตาสีเอาไว้ฝากผีสางที่ชวนมาได้นะ', 'ตาสี'); return; }
      if (!F().catch_tutorial) {
        await G.ui.sayAll(['ได้ยินว่าตั้งแก๊งแล้วเหรอ ตาสอนชวนผีให้', 'เจอผีสางในนาข้าว ให้ตีจนมันเหลือแรงน้อยๆ',
          'แล้วเปิดกระเป๋า ถวายข้าวเหนียวปั้น ถ้ามันหลับหรือชาอยู่ยิ่งชวนง่าย', 'ทีมมีได้หกตัว ที่เกินมาตาเลี้ยงไว้ให้ที่เถียงนานี่'], 'ตาสี');
        await give('rice_ball', 3);
        F().catch_tutorial = true;
      } else await say('ผีที่ฝากไว้ตาดูแลอย่างดี ไม่ต้องห่วง', 'ตาสี');
    },
    async door_tiang() {
      const st = S().storage, pt = S().party;
      const i = await G.ui.choose(['ฝากผีสางไว้', 'รับผีสางกลับ', 'ไม่เป็นไร'], { title: `เถียงนาตาสี (ฝากไว้ ${st.length} ตัว)`, cls: 'small' });
      if (i === 0) {
        if (pt.length <= 1) { await say('ต้องมีอย่างน้อยหนึ่งตัวในทีม', 'ตาสี'); return; }
        const k = await G.ui.partyMenu({ pick: true, title: 'ฝากใคร?' });
        if (k < 0) return;
        if (G.DATA.species[pt[k].sp].kind === 'kid') { await say('เพื่อนในแก๊งฝากไว้ไม่ได้หรอก!', 'ตาสี'); return; }
        st.push(...pt.splice(k, 1)); await say('ตาจะเลี้ยงไว้อย่างดี', 'ตาสี');
      } else if (i === 1) {
        if (!st.length) { await say('ยังไม่มีผีฝากไว้เลย', 'ตาสี'); return; }
        if (pt.length >= 6) { await say('ทีมเต็มแล้ว ฝากตัวอื่นก่อน', 'ตาสี'); return; }
        const k = await G.ui.choose(st.map((m) => ({ label: m.name, sub: 'Lv' + m.lv })), { title: 'รับใครกลับ?' });
        if (k < 0) return;
        pt.push(...st.splice(k, 1)); await say('ไปช่วยแก๊งต่อนะ', 'ตาสี');
      }
      G.refreshNpcs();
    },
    async beedad() {
      if (!F().starter_chosen) { await say('ควายของลุงนอนขวางทางลงทุ่งแน่ะ เดี๋ยวค่อยไปจูงออก', 'พ่อบี'); return; }
      if (!F().field_open) {
        await say('จะลงทุ่งไปปราบผีเหรอ เก่งแท้ลูกหลานบ้านเรา! เดี๋ยวลุงไปจูงควายออกให้', 'พ่อบี');
        F().field_open = true; G.refreshNpcs(); G.sfx('level');
        await say('ทางลงทุ่งนาเปิดแล้ว!');
      } else await say('ระวังผีโพงตอนกลางคืนนะ มันชอบออกมาตอนมืด', 'พ่อบี');
    },
    async buffalo() { await say('ควายนอนเคี้ยวเอื้องขวางทาง ไม่ยอมลุก... ลองไปถามพ่อบีที่บ้านดู'); },
    async door_bee() { await say('บ้านบี ใต้ถุนมีควายผูกไว้ กลิ่นฟางหอมๆ'); },
    async door_am() { await say('บ้านแอม ข้างในเต็มไปด้วยหนังสือกับเศษอะไหล่วิทยุ'); },
    async door_tle() { await say('บ้านเติ้ล ได้กลิ่นส้มตำปลาร้าลอยมาแรงมาก'); },
    async door_ter() { await say('บ้านเต๋อ ยายตะโกนเรียกเต๋อให้กลับมากินข้าวเสียงดังลั่น'); },
    async sign(s) { await say(s.text); },
    async water() { await say('น้ำในหนองใสเย็น มีปลาตัวเล็กว่ายไปมา'); },
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
      const r = await G.runBattle([G.makeMon(sp, lv)], { kind: 'wild' });
      if (r === 'lose') await blackout();
    },
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
      const m = G.makeMon(k, Math.max(6, S().party[0].lv - 1));
      if (S().party.length < 6) S().party.push(m); else S().storage.push(m);
      G.sfx('level');
      await say(`${sp.name} เข้าแก๊งแล้ว!`);
      F().member2_joined = true;
      await say('ทางคันนาข้ามหนองไปตลาดนัดตำบลเปิดแล้ว ได้ยินว่าแก๊งพี่ออสซี่คุมร้านราเมงที่นั่น...', sp.name);
    },
    async vendor() { await say('ตลาดนัดตำบลคึกคักทุกวันเสาร์ แต่ช่วงนี้แก๊งพี่ออสซี่มาเดินคุม ใครก็ไม่กล้าเข้าร้านราเมง', 'พ่อค้าลูกชิ้น'); },
    async vendor2() {
      await say('หมูปิ้งร้อนๆ จ้า ผีสางชอบนัก!', 'แม่ค้าหมูปิ้ง');
      await G.ui.shop(['rice_pork', 'herb', 'herb_big', 'holy_water'], 'แม่ค้าหมูปิ้ง');
    },
    async door_ramen() {
      if (F().gym1_done) { await say('ราเมงชามนี้พี่เลี้ยงเอง กินให้อร่อยนะน้อง', 'พี่ออสซี่'); G.heal(); await say('ทุกคนกินราเมงจนอิ่มแปล้ แข็งแรงเต็มที่!'); return; }
      await G.ui.sayAll(['ยินดีต้อนรับสู่ร้านราเมงลมทุ่ง... ฐานของแก๊งพี่เอง', 'ได้ยินว่าน้องปราบคางคกเจ้าหนองได้ เก่งใช้ได้',
        'แต่ลมกลางทุ่งของพี่ไม่เหมือนลมธรรมดานะ ถ้าอยากได้ตราผ้าโพก ต้องชนะพี่ให้ได้ก่อน!'], 'พี่ออสซี่');
      const team = [G.makeMon('krahang', 8, { ivs: 20 }), G.makeMon('krahang', 9, { ivs: 20 }), G.makeMon('ossie', 10, { ivs: 25 })];
      const r = await G.runBattle(team, { kind: 'master', trainerName: 'พี่ออสซี่', trainerLook: 'ossie', ai: 2, money: 500, bg: 'market' });
      if (r !== 'win') { await say('ยังอ่อนไปนะน้อง กลับไปฝึกแล้วค่อยมาใหม่', 'พี่ออสซี่'); await blackout(); return; }
      F().gym1_done = true; G.sfx('level');
      await G.ui.sayAll(['โอ้โห... แพ้เด็กจนได้', 'เอาไป ตราผ้าโพก หลักฐานว่าชนะยิมแรกแล้ว'], 'พี่ออสซี่');
      await say('ได้รับ ตราผ้าโพก!');
      await say('ต่อไปน้องต้องไปเจอพี่เฟรนด์ วิศวะหัวไม้ที่ขอนแก่น ระวังไฟช็อตล่ะ ฮ่าๆ', 'พี่ออสซี่');
      await G.ui.panel(`<div class="intro"><b>จบเวอร์ชันแรกแล้ว!</b><br><br>แก๊งของ ${S().name} พาฝนกลับมาที่บ้านโนนสะอาด<br>และชนะยิมแรกของพี่ออสซี่ได้สำเร็จ<br><br><small>เล่นต่อเพื่อชวนผีสางให้ครบสมุด หรือรอยิม 2 ของพี่เฟรนด์ในเวอร์ชันหน้า</small></div>`);
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
