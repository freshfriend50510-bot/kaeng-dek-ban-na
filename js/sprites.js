// พิกเซลอาร์ตเขียนเป็นตัวอักษร 16×16 แก้รูปได้ที่นี่โดยตรง (อักษร = สีในพาเลต, จุด = โปร่งใส)
(function (G) {
  'use strict';
  const C = {
    skinTan: '#a8693f', skinFair: '#f2d2b6', skinMid: '#d9a57b', skinOld: '#c08a62', skinPale: '#f9e2d0',
    hairBlack: '#2a1d18', hairGray: '#9a958c', hairBrown: '#5a3a22', hairDye: '#d9b25a',
    eye: '#1b1414', mouth: '#7a2e2a', shoe: '#3b2a22',
  };
  const SKIN = { fair: C.skinFair, mid: C.skinMid, tan: C.skinTan };

  // แม่แบบคน: H ผม S ผิว K ตา M ปาก C เสื้อ P กางเกง F รองเท้า
  const HUMAN = [
    '................',
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HSSSSSSSSH...',
    '...SSKSSSSKSS...',
    '...SSKSSSSKSS...',
    '....SSSMMSSS....',
    '.....SSSSSS.....',
    '....CCCCCCCC....',
    '...CCCCCCCCCC...',
    '...SCCCCCCCCS...',
    '...SCCCCCCCCS...',
    '....PPPPPPPP....',
    '....PP....PP....',
    '....FF....FF....',
  ];
  // ทรงผม: แทนทั้งแถว
  const HAIR = {
    short: null,
    curly: { 1: '....H.HHHH.H....', 2: '...HHHHHHHHHH...', 3: '..HHHHHHHHHHHH..' },
    spiky: { 0: '...H..H..H..H...', 1: '...HH.HHHH.HH...', 2: '..HHHHHHHHHHHH..' },
    neat: { 3: '...HHHHHHHHHHH..', 4: '...HSSSSSSSSHH..' },
    long: { 4: '..HHSSSSSSSSHH..', 5: '..HSSKSSSSKSSH..', 6: '..HSSKSSSSKSSH..', 7: '..HHSSSMMSSSHH..', 8: '..HH.SSSSSS.HH..' },
    tied: { 0: '......HHHH......', 4: '..HHSSSSSSSSHH..', 7: '..HHSSSMMSSSHH..' },
    bald: { 1: '................', 2: '.....SSSSSS.....', 3: '....SSSSSSSS....', 4: '...SSSSSSSSSS...' },
    buzz: { 1: '................', 2: '.....HHHHHH.....', 3: '....HHHHHHHH....' },
    topknot: { 0: '.......HH.......', 1: '.....HHHHHH.....' },
    bandana: { 1: '.....BBBBBB.....', 2: '....BBBBBBBB....', 3: '...BBBWBBBBBB...' },
    cap: { 1: '.....BBBBBB.....', 2: '....BBBBBBBB....', 3: '...BBBBBBBBBBB..' },
    bob: { 1: '....HHHHHHHH....', 2: '...HHHHHHHHHH...', 3: '..HHHHHHHHHHHH..', 4: '..HHHHHHHHHHHH..',
      5: '..HSSKSSSSKSSH..', 6: '..HSSKSSSSKSSH..', 7: '..HSSSSMMSSSSH..', 8: '..HH.SSSSSS.HH..' },
  };
  // ส่วนประกอบที่แทนทั้งแถว
  const OVERLAY = {
    glasses: { 5: '...GGGGSSGGGG...', 6: '...GKKGGGGKKG...' },
    chubby: { 8: '....SSSSSSSS....', 9: '...CCCCCCCCCC...', 10: '..CCCCCCCCCCCC..', 11: '..SCCCCCCCCCCS..', 12: '..SCCCCCCCCCCS..', 13: '...PPPPPPPPPP...' },
    grin: { 7: '....SMWWWWMS....' },
    robe: { 9: '...CCCCCCCCCC...', 10: '..CCCCCCCCCCCC..', 11: '..CCCCCCCCCCCC..', 12: '..SCCCCCCCCCCS..', 13: '...CCCCCCCCCC...', 14: '...CCCCCCCCCC...' },
    sword: { 9: '....CCCCCCCC.N..', 10: '...CCCCCCCCCCN..', 11: '...SCCCCCCCCSN..', 12: '...SCCCCCCCCN...' },
    stick: { 8: '.....SSSSSS..N..', 9: '....CCCCCCCC.N..', 10: '...CCCCCCCCCCN..', 11: '...SCCCCCCCCSN..' },
    barefoot: { 15: '....SS....SS....' },
    shorts: { 14: '....SS....SS....' },
    stethoscope: { 9: '....CNCCCCNC....', 10: '...CCNCCCCNCC...', 11: '...SCCNNNNCCS...' },
    shop: { 11: '...CCCCCCCCCC...' },                 // เสื้อช็อปแขนยาว
    shout: { 7: '....SSSKKSSS....' },
  };
  // แต่งทับทีละจุด ('.' = คงของเดิม)
  const PATCH = {
    narrow: { 5: '.....S....S.....', 6: '....KK....KK....', 7: '....Q......Q....' },   // ตาตี่สาวหมวย แก้มชมพู
    brows: { 4: '....KK....KK....' },
    mustache: { 7: '....KKKKKKKK....' },
    tie: { 9: '.......aa.......', 10: '.......aa.......', 11: '.......a........' },
    gearneck: { 9: '.......YY.......', 10: '.......YY.......' },
    wrench: { 4: '.............yy.', 5: '............yyy.', 6: '............y...', 7: '...........y....', 8: '..........y.....' },
    apron: { 10: '....AAAAAAAA....', 11: '....AAAAAAAA....', 12: '....AAAAAAAA....', 13: '....AAAAAAAA....' },
    megaphone: { 9: '.zz.............', 10: 'zzzr............', 11: '.zz.............' },
    headband: { 3: '...WWWWWWWWWW...' },
  };
  // ของประจำตัวเด็กขั้น 2 และ 3 (อักษรเล็ก = สีในพาเลต ACC)
  const ACC = {
    t: '#d9b25a', T: '#a8823a', r: '#c5482b', w: '#8a6440', i: '#b8bcc4', b: '#c5482b', k: '#2a2a2a', g: '#9aa0a8',
    o: '#f28c28', O: '#f4f4ec', s: '#c9ced6', e: '#5fb8e0', p: '#e86a9a', y: '#f2d24b', q: '#c5482b', Q: '#f4f4ec', f: '#f2a03a',
  };
  const STAGE = {
    'bee@2': { 0: '.....tttttt.....', 1: '..tttrrrrrrttt..', 2: '...ttttttttttt..', 6: '..............i.', 7: '.............iw.', 8: '.............w..', 9: '.............w..', 10: '.............w..', 11: '.............w..' },
    'bee@3': { 0: '.....tttttt.....', 1: '..tttrrrrrrttt..', 2: '...ttttttttttt..', 8: 'wwwwwwwwwwwwwwww', 9: 'TT............TT', 10: 'TT............TT', 12: '....qQqQqQqQ....' },
    'am@2': { 11: '.............kk.', 12: '............bbbb', 13: '............bbbb', 14: '............bbbb' },
    'am@3': { 9: '.............gg.', 10: '............ggee', 11: '............gggg', 12: '............g..g', 13: '............gggg', 14: '............g..g' },
    'tle@2': { 12: '..oOoOoOoOoOoO..', 13: '..OoOoOoOoOoOo..' },
    'tle@3': { 12: '..oOoOoOoOoOoO..', 13: '.ssssssssssssss.', 14: '.ssssssssssssss.', 15: '..ssssssssssss..' },
    'ter@2': { 0: '............y...', 1: '...........yyy..', 2: '..........yyyyy.', 3: '...........yyy..', 4: '............y...', 5: '.............p..', 6: '............p...', 7: '.............p..' },
    'ter@3': { 1: '.............r..', 2: '............rrr.', 3: '............sss.', 4: '............sss.', 5: '............sss.', 6: '............sss.', 7: '............sss.', 8: '............sss.', 9: '............sss.', 10: '............sss.', 11: '.............f..', 12: '............fyf.' },
  };
  const LOOKS = {
    player: { hair: 'spiky', H: C.hairBlack, S: C.skinMid, C: '#2f3d6b', P: '#3b3b3b', extra: ['grin'] },
    bee: { hair: 'curly', H: C.hairBlack, S: C.skinTan, C: '#c5482b', P: '#6b5040', extra: ['grin', 'shorts', 'barefoot'] },
    am: { hair: 'neat', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#2c3e70', extra: ['glasses'] },
    tle: { hair: 'short', H: C.hairBrown, S: C.skinMid, C: '#e9b949', P: '#4d6b3a', extra: ['chubby'] },
    ter: { hair: 'spiky', H: C.hairDye, S: C.skinMid, C: '#67a356', P: '#2a2a2a', extra: ['grin', 'shorts'] },
    mom: { hair: 'tied', H: C.hairBlack, S: C.skinMid, C: '#8a3f6b', P: '#3d3260', extra: ['robe'] },
    elder: { hair: 'short', H: C.hairGray, S: C.skinOld, C: '#d8c9a3', P: '#4a3b2f', extra: [] },
    samorn: { hair: 'tied', H: C.hairBlack, S: C.skinMid, C: '#3f7f8a', P: '#5a2f2a', extra: ['robe'] },
    nual: { hair: 'long', H: C.hairBlack, S: C.skinMid, C: '#eef2f2', P: '#2f6b5a', extra: [] },
    teacher: { hair: 'neat', H: C.hairBlack, S: C.skinFair, C: '#d8b25a', P: '#3b3b3b', extra: ['glasses'] },
    monk: { hair: 'bald', H: C.skinOld, S: C.skinOld, C: '#d9822b', P: '#d9822b', extra: ['robe'] },
    novice: { hair: 'bald', H: C.skinMid, S: C.skinMid, C: '#e8913a', P: '#e8913a', extra: ['robe'] },
    jam: { hair: 'bald', H: C.skinOld, S: C.skinOld, C: '#f2efe4', P: '#f2efe4', extra: ['robe', 'stick'] },
    tasi: { hair: 'short', H: C.hairGray, S: C.skinTan, C: '#2f3d6b', P: '#2f3d6b', extra: ['shorts', 'barefoot'] },
    beedad: { hair: 'short', H: C.hairBlack, S: C.skinTan, C: '#b5502f', P: '#2f3d6b', extra: ['barefoot'] },
    beemom: { hair: 'tied', H: C.hairBlack, S: C.skinTan, C: '#b5502f', P: '#4a3b2f', extra: ['robe'] },
    amdad: { hair: 'neat', H: C.hairBlack, S: C.skinFair, C: '#6b8fa8', P: '#3b3b3b', extra: ['glasses'] },
    tlemom: { hair: 'tied', H: C.hairBrown, S: C.skinMid, C: '#e9b949', P: '#8a3f3f', extra: ['chubby'], patch: ['apron'], A: '#d9455a' },
    teryai: { hair: 'topknot', H: C.hairGray, S: C.skinOld, C: '#67a356', P: '#3d3260', extra: ['robe'] },
    rival: { hair: 'spiky', H: C.hairBrown, S: C.skinTan, C: '#2a2a2a', P: '#7a2e2a', extra: ['grin'] },
    student1: { hair: 'short', H: C.hairBlack, S: C.skinMid, C: '#f4f4ec', P: '#3b2a5a', extra: [] },
    student2: { hair: 'long', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#3b2a5a', extra: [] },
    henchman: { hair: 'bandana', B: '#2b2b6b', W: '#f4f4ec', H: C.hairBlack, S: C.skinMid, C: '#1f1f2e', P: '#3b3b3b', extra: [] },
    henchman2: { hair: 'spiky', H: C.hairDye, S: C.skinMid, C: '#1f1f2e', P: '#3b3b3b', extra: ['grin'] },
    ossie: { hair: 'bandana', B: '#c5482b', W: '#f4f4ec', H: C.hairDye, S: C.skinFair, C: '#2b3f8a', P: '#1d1d24', N: '#d9b25a', extra: ['sword'] },
    vendor: { hair: 'topknot', H: C.hairBlack, S: C.skinMid, C: '#c5482b', P: '#2f3d6b', extra: ['robe'] },
    cook: { hair: 'short', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#3b3b3b', extra: [], patch: ['headband'], W: '#c5482b' },
    driver: { hair: 'cap', B: '#2f6b5a', H: C.hairGray, S: C.skinTan, C: '#b5502f', P: '#3b3b3b', extra: ['grin'] },
    guard: { hair: 'cap', B: '#24305e', H: C.hairBlack, S: C.skinMid, C: '#3a4a7a', P: '#24305e', extra: [], patch: ['brows'] },
    prof: { hair: 'neat', H: C.hairGray, S: C.skinFair, C: '#f4f4ec', P: '#3b3b3b', extra: ['glasses'], patch: ['tie'], a: '#8a2a2a' },
    coop: { hair: 'cap', B: '#3f7f4a', H: C.hairBlack, S: C.skinMid, C: '#3f7f4a', P: '#3b3b3b', extra: ['grin'] },
    mkowner: { hair: 'buzz', H: C.hairGray, S: C.skinTan, C: '#c5482b', P: '#3b3b3b', extra: ['grin'], patch: ['apron'], A: '#f4f4ec' },
    ingying: { hair: 'tied', H: C.hairBrown, S: C.skinMid, C: '#f2a0c0', P: '#4a3b5a', extra: ['grin'], patch: ['apron'], A: '#e86a9a' },
    // คนวิศวะ: เสื้อช็อปตามสาขา (ดู SHOP) + ตราที่อก
    friend: { hair: 'neat', H: C.hairBlack, S: C.skinMid, shop: 'eng_mech', P: '#2a2a33', extra: ['shop'], patch: ['brows', 'gearneck', 'wrench'], Y: '#d9b25a', y: '#b8bcc4' },
    ungying: { hair: 'bob', H: '#1a1414', S: C.skinPale, shop: 'eng_chem', P: '#2a2a33', extra: ['shop'], patch: ['narrow'], Q: '#f2a0a8', M: '#d9455a' },
    wak1: { hair: 'buzz', H: C.hairBlack, S: C.skinTan, shop: 'eng_civil', P: '#2a2a33', extra: ['shop'], patch: ['brows', 'mustache'] },
    wak2: { hair: 'spiky', H: C.hairBlack, S: C.skinMid, shop: 'eng_elec', P: '#2a2a33', extra: ['shop', 'shout'], patch: ['brows', 'megaphone'], z: '#f4f4ec', r: '#c5482b' },
  };
  // สีเสื้อช็อปและตรา 3×3 ของแต่ละสาขา (X = จุดตรา)
  const SHOP = {
    eng_mech: { C: '#232329', E: '#d9b25a', mark: ['XXX', 'X.X', 'XXX'] },   // เฟือง
    eng_civil: { C: '#9a4a2f', E: '#efe6d0', mark: ['XXX', 'X.X', 'X.X'] },  // สะพาน
    eng_elec: { C: '#22306b', E: '#f2d24b', mark: ['.XX', '.X.', 'XX.'] },   // สายฟ้า
    eng_chem: { C: '#6b3f8a', E: '#c8f0ff', mark: ['.X.', '.X.', 'XXX'] },   // ขวดแก้ว
    eng_env: { C: '#2f7a4a', E: '#c8ec8a', mark: ['.XX', 'XXX', 'XX.'] },    // ใบไม้
    eng_ie: { C: '#6f7480', E: '#ffb84a', mark: ['..X', '.XX', 'XXX'] },     // กราฟแท่ง
  };

  // ผีสาง คางคก ควาย หมา ไอเท็ม: วาดเองทั้งตัว
  const CUSTOM = {
    phrai: { pal: { B: '#7cc6de', L: '#d8f3fa', K: '#123848', W: '#ffffff', M: '#2a6b80' }, rows: [
      '................', '......BBBB......', '....BBBBBBBB....', '...BBLLBBBBBB...', '..BBLLBBBBBBBB..', '..BBBKKBBKKBBB..', '..BBBKWBBKWBBB..', '..BBBBBBBBBBBB..',
      '..BBBBBMMBBBBB..', '..BBBBBBBBBBBB..', '...BBBBBBBBBB...', '...BBBBBBBBBB...', '....BB.BB.BB....', '....B..B..B.....', '................', '................'] },
    kongkoi: { pal: { N: '#6b4a2f', S: '#c89a6a', K: '#1b1414', M: '#7a2e2a' }, rows: [
      '................', '.....NNNNNN.....', '....NNNNNNNN....', '...NNSSSSSSNN...', '...NSKKSSKKSN...', '...NSSSSSSSSN...', '...NNSMMMMSNN...', '....NNNNNNNN....',
      '...NNNNNNNNNN...', '..NNNNNNNNNNNN..', '..N.NNNNNNNN.N..', '....NNNNNNNN....', '.......NN.......', '.......NN.......', '......NNNN......', '................'] },
    pob: { pal: { G: '#9fbf7a', D: '#5f7f43', K: '#1b1414', R: '#d9455a', W: '#ffffff' }, rows: [
      '................', '................', '.....GGGGGG.....', '....GGGGGGGG....', '...GGGGGGGGGG...', '...GKWGGGGKWG...', '...GKKGGGGKKG...', '...GGGGGGGGGG...',
      '...GGDDDDDDGG...', '...GGGDRRDGGG...', '..GGGGGRRGGGGG..', '..GGGGGGGGGGGG..', '..DGGGGGGGGGGD..', '...GGG....GGG...', '...DD......DD...', '................'] },
    krahang: { pal: { Y: '#d9b25a', y: '#a8823a', S: '#c08a62', K: '#1b1414', C: '#3b2a22', N: '#8a6a4a' }, rows: [
      '................', '......SSSS......', '.....SKSSKS.....', '.....SSSSSS.....', 'YYYY..SSSS..YYYY', 'YyyYY.CCCC.YYyyY', 'YyyyYYCCCCYYyyyY', 'YyyyyYCCCCYyyyyY',
      'YyyyYYCCCCYYyyyY', 'YyyYY.CCCC.YYyyY', 'YYYY..CCCC..YYYY', '.......NN.......', '.......NN.......', '.......NN.......', '.......NNN......', '........NN......'] },
    phong: { pal: { Y: '#fff2a8', O: '#f2c84b', R: '#e8913a', K: '#5a3a0a' }, rows: [
      '................', '.......YY.......', '.....YYOOYY.....', '....YOOOOOOY....', '...YOOYYYYOOY...', '...YOYKYYKYOY...', '..YOOYKYYKYOOY..', '..YOOYYYYYYOOY..',
      '..YOOYKKKKYOOY..', '...YOOYYYYOOY...', '...YOOOOOOOOY...', '....YRRRRRRY....', '.....YR..RY.....', '......R..R......', '.......RR.......', '................'] },
    pret: { pal: { D: '#5a5a6e', L: '#8a8aa0', K: '#ffffff', M: '#1b1414' }, rows: [
      '......LLLL......', '.....LDDDDL.....', '.....DKDDKD.....', '.....DDMMDD.....', '......DDDD......', '......DDDD......', '.....LDDDDL.....', '....LDDDDDDL....',
      '...LL.DDDD.LL...', '..LL..DDDD..LL..', '......DDDD......', '......DDDD......', '......DDDD......', '......D..D......', '......D..D......', '.....DD..DD.....'] },
    toad: { pal: { G: '#7f8f4a', D: '#4f5a2a', Y: '#e9d98a', K: '#1b1414', W: '#ffffff', R: '#b5502f' }, rows: [
      '................', '................', '....GG....GG....', '...GKWG..GKWG...', '...GKKGGGGKKG...', '..GGGGGGGGGGGG..', '.GGDGGGGGGGGDGG.', '.GGGGRRRRRRGGGG.',
      'GGGGGGGGGGGGGGGG', 'GDGGYYYYYYYYGGDG', 'GGGYYYYYYYYYYGGG', 'GGGYYYYYYYYYYGGG', '.GGGYYYYYYYYGGG.', '.DDGGGGGGGGGGDD.', 'DDD..DD..DD..DDD', '................'] },
    buffalo: { pal: { B: '#4a4a52', D: '#2a2a30', H: '#d8d0c0', K: '#ffffff', P: '#c99a9a' }, rows: [
      '................', '.HH..........HH.', '..HH........HH..', '...HBBBBBBBBH...', '...BBBBBBBBBB...', '...BKBBBBBBKB...', '...BBBBBBBBBB...', '....BBPPPPBB....',
      '....BBPDDPBB....', '...BBBBBBBBBB...', '..BBBBBBBBBBBB..', '..BBBBBBBBBBBB..', '..BBBBBBBBBBBB..', '..DD.DD..DD.DD..', '..DD.DD..DD.DD..', '................'] },
    dog: { pal: { B: '#b07a44', D: '#7a5030', W: '#f2e2c4', K: '#1b1414', R: '#c5482b' }, rows: [
      '................', '................', '...DD......DD...', '...DBD....DBD...', '...DBBBBBBBBD...', '...BBBBBBBBBB...', '...BKBBBBBBKB...', '...BBBWWWWBBB...',
      '....BBWKKWBB....', '.....BWWWWB.....', '....RRRRRRRR....', '....BBBBBBBB....', '...BBWBBBBWBB...', '...BBWBBBBWBB..D', '...DD.DD.DD.DDD.', '................'] },
    item: { pal: { W: '#f4f4ec', R: '#c5482b', K: '#2a1d18' }, rows: [
      '................', '................', '................', '................', '................', '......KKKK......', '.....KWWWWK.....', '....KWWRRWWK....',
      '....KWRRRRWK....', '....KWWRRWWK....', '.....KWWWWK.....', '......KKKK......', '................', '................', '................', '................'] },
  };

  const apply = (rows, ov) => { if (ov) for (const k in ov) rows[k] = ov[k]; };
  const patch = (rows, ov) => {
    if (!ov) return;
    for (const k in ov) { const r = rows[k].split(''); for (let i = 0; i < 16; i++) if (ov[k][i] !== '.') r[i] = ov[k][i]; rows[k] = r.join(''); }
  };
  function buildHuman(look) {
    const rows = HUMAN.slice();
    apply(rows, HAIR[look.hair]);
    for (const e of look.extra || []) apply(rows, OVERLAY[e]);
    const pal = { K: C.eye, M: C.mouth, F: C.shoe, G: '#1b1414', W: '#f4f4ec', N: '#6b5040', ...look };
    if (look.shop) {   // ตราที่อกซ้ายของตัวละคร (ขวาของจอ)
      const sh = SHOP[look.shop];
      pal.C = sh.C; pal.E = sh.E;
      sh.mark.forEach((m, i) => { const r = rows[9 + i].split(''); for (let j = 0; j < 3; j++) if (m[j] === 'X') r[8 + j] = 'E'; rows[9 + i] = r.join(''); });
    }
    for (const p of look.patch || []) patch(rows, PATCH[p]);
    return { rows, pal, human: true, hairKey: look.hair === 'bandana' || look.hair === 'cap' ? 'B' : look.hair === 'bald' ? 'S' : 'H' };
  }
  // หน้าตาน้องวิศวะแต่ละคน: "eng:<สาขา>:<ลำดับในรายชื่อ>"
  function engLook(branch, i) {
    const e = ((G.DATA && G.DATA.engNames[branch]) || [])[i] || { sex: 'm', hair: 'short', skin: 'mid', glasses: false };
    const extra = ['shop']; if (e.glasses) extra.push('glasses');
    return { hair: e.hair, H: i % 3 === 2 ? C.hairBrown : C.hairBlack, S: SKIN[e.skin] || C.skinMid, shop: branch, P: i % 2 ? '#3b4a6b' : '#2a2a33', extra };
  }
  function defFor(id) {
    if (CUSTOM[id]) return { ...CUSTOM[id], human: false };
    const at = id.indexOf('@');
    if (at > 0) {   // เด็กขั้นเติบโต: วาดตัวเดิมแล้วแปะของประจำตัว
      const base = defFor(id.slice(0, at));
      const rows = base.rows.slice(); patch(rows, STAGE[id]);
      return { ...base, rows, pal: { ...ACC, ...base.pal } };
    }
    if (id.startsWith('eng:')) { const [, br, i] = id.split(':'); return buildHuman(engLook(br, +i)); }
    if (SHOP[id]) return buildHuman(engLook(id, 0));
    return buildHuman(LOOKS[id] || LOOKS.player);
  }
  function paint(def, rows) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const x = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let i = 0; i < 16; i++) {
        const ch = row[i];
        if (ch === '.' || !def.pal[ch]) continue;
        x.fillStyle = def.pal[ch]; x.fillRect(i, y, 1, 1);
      }
    });
    return c;
  }

  const cache = {};
  G.sprite = function (id) {
    if (!cache[id]) { const d = defFor(id); cache[id] = paint(d, d.rows); }
    return cache[id];
  };

  // ภาพเดิน 4 ทิศ × 3 เฟรม (0 ยืน, 1 ก้าวซ้าย, 2 ก้าวขวา) สร้างจากภาพหน้าตรง
  const FACE = 'SKMGQEa';
  function liftFoot(rows, which) {
    const r15 = rows[15].split(''), r14 = rows[14].split('');
    const runs = []; let s = -1;
    for (let i = 0; i <= 16; i++) { const on = i < 16 && r15[i] !== '.'; if (on && s < 0) s = i; if (!on && s >= 0) { runs.push([s, i]); s = -1; } }
    const run = runs[which]; if (!run) return;
    for (let i = run[0]; i < run[1]; i++) { r14[i] = r15[i]; r15[i] = '.'; }
    rows[14] = r14.join(''); rows[15] = r15.join('');
  }
  const actorCache = {};
  G.actorSprite = function (id, dir, frame) {
    const key = `${id}|${dir}|${frame}`;
    if (actorCache[key]) return actorCache[key];
    const def = defFor(id);
    let c;
    if (!def.human) c = G.sprite(id);
    else {
      const rows = def.rows.slice();
      const hk = def.hairKey;
      if (dir === 'up') {   // หันหลัง: หน้ากลายเป็นผม ตราที่อกหายไป
        for (let y = 4; y <= 7; y++) rows[y] = rows[y].split('').map((ch) => (FACE.includes(ch) && ch !== 'a' ? hk : ch)).join('');
        for (let y = 9; y <= 11; y++) rows[y] = rows[y].replace(/[EYa]/g, 'C');
      } else if (dir === 'left' || dir === 'right') {   // ด้านข้าง (วาดหันขวา แล้วกลับภาพถ้าหันซ้าย)
        for (let y = 4; y <= 7; y++) {
          const r = rows[y].split('');
          for (let i = 0; i < 8; i++) if ('KMGQ'.includes(r[i])) r[i] = 'S';
          if (r[3] !== '.') r[3] = hk; if (y < 7 && r[4] === 'S') r[4] = hk;
          rows[y] = r.join('');
        }
        const r7 = rows[7].split(''); if (r7[8] === 'M') { r7[8] = 'S'; r7[10] = 'M'; } rows[7] = r7.join('');
        for (let y = 9; y <= 11; y++) rows[y] = rows[y].replace(/[E]/g, 'C');
      }
      if (frame) liftFoot(rows, frame - 1);
      c = paint(def, rows);
    }
    if (dir === 'left') {
      const f = document.createElement('canvas'); f.width = f.height = 16;
      const x = f.getContext('2d'); x.translate(16, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = f;
    }
    actorCache[key] = c;
    return c;
  };

  // หน้าตาที่ใช้วาดสมาชิกแก๊ง: น้องวิศวะแต่ละคนหน้าไม่ซ้ำ เด็กเปลี่ยนชุดตามขั้นเติบโต
  G.monLook = function (m) {
    if (m.look) return m.look;
    const sp = G.DATA.species[m.sp];
    if (sp.kind === 'kid' && G.growthStage(m.lv) > 1) return `${sp.look}@${G.growthStage(m.lv)}`;
    return sp.look;
  };
  G.lookColor = (id) => (LOOKS[id] ? LOOKS[id].C : '#888');
  G._spriteDefs = { HUMAN, HAIR, OVERLAY, LOOKS, CUSTOM, SHOP };
})(window.G = window.G || {});
