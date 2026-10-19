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
    nursecap: { 0: '.....WWWWWW.....', 1: '......WRRW......' },   // หมวกพยาบาลกาชาด
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
    // หยก: แคสเตอร์ผู้จัดการทีม สาวสวยผมยาวน้ำตาลเข้ม แจ็กเก็ตทีมสีขาว
    yok: { hair: 'long', H: '#4a2e24', S: C.skinFair, C: '#f4f4f4', P: '#2a2a33', extra: ['grin'], patch: ['narrow'], Q: '#f2a0b0' },
    // เอเจนต์พาโรดี้เกม "วาโลแลนด์" (ทีมพี่ม่อนและลูกทีม) จับแค่จุดเด่น สีผม ทรง ชุด
    agent_raze: { hair: 'bandana', B: '#f28c28', W: '#f4f4ec', H: '#3a2a20', S: C.skinTan, C: '#f2c43a', P: '#3b3b3b', extra: ['grin'] },
    agent_neon: { hair: 'tied', H: '#3fa8ff', S: C.skinMid, C: '#f2d24b', P: '#1d1d24', extra: ['grin'] },
    agent_sage: { hair: 'long', H: '#16121a', S: C.skinFair, C: '#eef4f2', P: '#2f8f86', extra: [], patch: ['narrow'], Q: '#f2a0b0' },
    agent_reyna: { hair: 'long', H: '#7a2ad0', S: C.skinTan, C: '#3a1a50', P: '#1d1d24', K: '#e05ad0', extra: [] },
    agent_omen: { hair: 'bald', H: '#1d2340', S: '#1d2340', K: '#5fe0f0', M: '#1d2340', C: '#1d2340', P: '#14182a', extra: ['robe'] },
    agent_jett: { hair: 'topknot', H: '#e8ecf0', S: C.skinFair, C: '#f4f4ec', P: '#2a3a6a', extra: [], patch: ['narrow'], Q: '#f2a0b0' },
    agent_brim: { hair: 'cap', B: '#3f5a3a', H: '#4a3a30', S: C.skinTan, C: '#4f6b3a', P: '#2a2a2a', extra: [], patch: ['mustache'] },
    agent_viper: { hair: 'long', H: '#16121a', S: C.skinFair, C: '#3fa04a', P: '#1d3a24', extra: [] },
    agent_phoenix: { hair: 'spiky', H: '#2a1d18', S: C.skinTan, C: '#f4f4ec', P: '#f28c28', extra: ['grin'] },
    agent_sova: { hair: 'cap', B: '#2f5fa0', H: '#e8ecf0', S: C.skinFair, C: '#3a6ab0', P: '#2a2a33', extra: [] },
    agent_breach: { hair: 'short', H: '#e8712a', S: C.skinMid, C: '#5f6873', P: '#3a3f48', extra: [], patch: ['mustache'] },
    agent_killjoy: { hair: 'cap', B: '#f2d24b', H: '#3a2a20', S: C.skinMid, C: '#f2d24b', P: '#3a5a3a', extra: ['glasses'] },
    agent_chamber: { hair: 'neat', H: '#2a2018', S: C.skinFair, C: '#1d1d24', P: '#1d1d24', extra: ['glasses'], patch: ['tie'], a: '#c9a45a' },
    // ตัวละครด่านสุดท้าย
    joe_pro: { hair: 'short', H: '#7a2a2a', S: C.skinMid, C: '#1d1d24', P: '#2a2a33', extra: ['grin'], patch: ['brows'] },
    namfon: { hair: 'tied', H: '#2a1d18', S: C.skinFair, C: '#f4f4f4', P: '#f4f4f4', extra: [], patch: ['nursecap', 'narrow'], Q: '#f2a0b0', W: '#f4f4f4', R: '#d9455a' },
    ingying: { hair: 'tied', H: C.hairBrown, S: C.skinMid, C: '#f2a0c0', P: '#4a3b5a', extra: ['grin'], patch: ['apron'], A: '#e86a9a' },
    // คนวิศวะ: เสื้อช็อปตามสาขา (ดู SHOP) + ตราที่อก
    // พี่เฟรนด์: หนุ่มหล่อวิศวะเครื่องกล ผมทรงทูบล็อกปัดข้าง คิ้วเข้ม ตาคม ยิ้มมุมปาก เสื้อช็อปดำพับแขน ตราเฟืองทองที่อกและหลัง สร้อยเฟือง
    friend: {
      pal: { H: '#14121a', h: '#4a4660', S: '#f6d3b2', s: '#d9a983', K: '#140e16', j: '#6a4630', m: '#c47e70', u: '#2c2a36', E: '#3a2622', W: '#ffffff',
        C: '#1d1d24', c: '#3a3a46', Y: '#e8bf4a', y: '#c4c9d2', P: '#2a2f42', F: '#f0eee6' },
      rows: [
        '.....HHHHHH.....',
        '...HHHHHHHHHH...',
        '..HHhhhhhhHHHH..',
        '..HHhhHHHHHHHH..',
        '..HHHHHSSSSSHH..',
        '..uSEESSSSEESu..',
        '..uSSSSSSSSSSu..',
        '..uSSKjSSjKSSu..',
        '...SSSSSSSSSS...',
        '....sSSmmSSs....',
        '.....sSSSSs.....',
        '...CCCcYYcCCC...',
        '..SCCCCCCCYYCS..',
        '..SCCCCCCCCCCS..',
        '....PPPPPPPP....',
        '....FF....FF....'],
      up: [
        '.....HHHHHH.....',
        '...HHHHHHHHHH...',
        '..HHHHHhHHHHHH..',
        '..HHHHhHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '...HHHHHHHHHH...',
        '.....sSSSSs.....',
        '...CCCCYYCCCC...',
        '..SCCCYccYCCCS..',
        '..SCCCCYYCCCCS..',
        '....PPPPPPPP....',
        '....FF....FF....'],
      side: [
        '.....HHHHHH.....',
        '....HHHHHHHHH...',
        '...HHHhhhhHHHH..',
        '...HHHHHHhhHHHH.',
        '...HHHHHHHHHSH..',
        '...HHHHSSSSEES..',
        '...HHHHSSSSSSS..',
        '...HHHSSSSSjKS..',
        '....HHSSSSSSSSS.',
        '.....HSSSSSSmS..',
        '......sSSSSs....',
        '.....CCcYcC.....',
        '....CCCCCCCYC...',
        '....CCCCCCCC....',
        '.....PPPPPP.....',
        '......FF.FF.....'] },
    // อุ๋งอิ๋ง: สาวหมวยผิวขาว ผมยาวตรงดำเงา หน้าม้า กิ๊บโบว์ชมพู ชุดนักศึกษา (เสื้อขาว เข็มตรา เข็มขัด กระโปรงดำ)
    ungying: {
      pal: { H: '#16121a', h: '#3a3046', S: '#fde9dd', K: '#1e1218', j: '#6a4048', Q: '#f7a3b4', m: '#ec7f95', W: '#ffffff', w: '#d9e0ee',
        Y: '#e8c04a', B: '#26262e', b: '#e8c04a', P: '#1e1e2c', F: '#121216', R: '#f06a96', r: '#c94a78' },
      rows: [
        '.....HHHHHH.....',
        '....HHHHHHHHRr..',
        '...HHHHHHHHHRR..',
        '..HHHhHHHHHHHH..',
        '..HHHhHHHHHHHH..',
        '..HSSSHSSSHSSH..',
        '..HSKKSSSSKKSH..',
        '..HSKjSSSSjKSH..',
        '..HQSSSmmSSSQH..',
        '..HHH.SSSS.HHH..',
        '..HHwWWWWWWwHH..',
        '..HSWWWYwWWWSH..',
        '...SWWWWWWWWS...',
        '....BBBbBBBB....',
        '....PPPPPPPP....',
        '.....FF..FF.....'],
      up: [
        '.....HHHHHH.....',
        '....HHHHHHHHRr..',
        '...HHHHHHHHHRR..',
        '..HHHHHhHHHHHH..',
        '..HHHHHhHHHHHH..',
        '..HHHHHHhHHHHH..',
        '..HHHHHHhHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..SHHHHHHHHHHS..',
        '...SWWWWWWWWS...',
        '....BBBBBBBB....',
        '....PPPPPPPP....',
        '.....FF..FF.....'],
      side: [
        '.....HHHHHH.....',
        '...rRHHHHHHHH...',
        '...RRHHHHHHHHH..',
        '...HHHHHhHHHHH..',
        '...HHHHHHhHHHH..',
        '...HHHHHSSHSSS..',
        '...HHHHSSSKKSS..',
        '...HHHHSSSKjSS..',
        '...HHHHSSQSSmS..',
        '...HHHHH.SSS....',
        '...HHHHWWWWW....',
        '....HHWWWWWW....',
        '.....WWWWWWW....',
        '.....BBBBBb.....',
        '.....PPPPPP.....',
        '......FF.FF.....'] },
    // ลูกทีมพี่ม่อน (โปรเพลเยอร์ตัวจริง วาดตามรูปอ้างอิง เสื้อทีมสีคล้ายแต่ไม่ใส่โลโก้จริง)
    // พริมมี่: ผมดำหนาแสกกลาง หน้ากลมผิวขาว เสื้อทีมดำลายเฉียงแดงขาวม่วง
    primmie: { pal: { H: '#16141c', h: '#3a3646', S: '#f8dcc4', s: '#dcb092', K: '#1b1218', M: '#c98478', C: '#17171d', R: '#d9304a', W: '#f4f4f4', V: '#6a3aa0', P: '#22242e', F: '#111114' }, rows: [
      '................',
      '.....HHHHHH.....',
      '...HHHHHHHHHH...',
      '..HHHHHhhHHHHH..',
      '..HHHHSSSSHHHH..',
      '..HHSSSSSSSSHH..',
      '..HSSKSSSSKSSH..',
      '..HSSSSSSSSSSH..',
      '...SSSSSSSSSS...',
      '....sSSMMSSs....',
      '.....sSSSSs.....',
      '...CRCCCCCCCC...',
      '..SRWCCCCCCCCS..',
      '..SCRVCCCCCCCS..',
      '....PPPPPPPP....',
      '....FF....FF....'] },
    // คิลัว: ผมดำสั้นหน้าม้าแหลม หน้าเรียว เสื้อทีมดำแถบขาวที่ไหล่ กอดอก
    killua: { pal: { H: '#141218', h: '#34303c', S: '#e9c4a0', s: '#c99c78', K: '#1b1218', M: '#b57a6a', C: '#16161c', W: '#f0f0f0', P: '#22242e', F: '#111114' }, rows: [
      '................',
      '.....H.HH.H.....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHHHHHHHHHHH..',
      '..HSHSHHSHSHSH..',
      '..HSSKSSSSKSSH..',
      '...SSSSSSSSSS...',
      '....SSSSSSSS....',
      '.....SSMMSS.....',
      '......sSSs......',
      '...CWCCCCCCWC...',
      '..CWCSSSSSSCWC..',
      '..CWCCSSSSCCWC..',
      '....PPPPPPPP....',
      '....FF....FF....'] },
    // ซุปเปอร์บัส: ตัวใหญ่ ผมดำปัดข้าง หนวดบาง ชูนิ้ว เสื้อทีมดำคอวีเหลือง แขนส้ม
    bus: { pal: { H: '#18141a', h: '#3a3440', S: '#e2b48c', s: '#c0906a', K: '#1b1218', M: '#a8685c', u: '#8a6450', C: '#18181e', Y: '#f2c43a', O: '#f07a22', P: '#22242e', F: '#111114' }, rows: [
      '................',
      '....HHHHHHH.....',
      '...HHHHHHHHHH...',
      '..HHHHHHHHHHHH..',
      '..HHSSSHHHHHHH..',
      '..HSSSSSSSHHSH..',
      '..SSSKSSSSKSSS.S',
      '..SSSSSSSSSSSS.S',
      '..SSSuuSSuuSSS.S',
      '...SSSSMMSSSS.SS',
      '....sSSSSSSs.SS.',
      '..OCCYYYYYYCCOS.',
      '.OOCCCYYCCCCCOO.',
      '.SCCCCCCCCCCCCS.',
      '...PPPPPPPPPP...',
      '....FF....FF....'] },
    // จอนโอเซ่น: ผมน้ำตาลเข้มปัดข้างพองๆ หนวดบาง ยิ้มเก่ง เสื้อทีมเทาเข้มตราส้ม รอยสักแขน
    john: { pal: { H: '#3a2a22', h: '#5a4234', S: '#ecc8a6', s: '#cc9f7c', K: '#1b1218', M: '#b0685e', u: '#9a7058', C: '#2c2e36', c: '#454852', O: '#f08a2a', t: '#4a5060', P: '#22242e', F: '#111114' }, rows: [
      '................',
      '.....hhhhh......',
      '...hhHHHHHhh....',
      '..hHHHHHHHHHh...',
      '..HHHHHHHHHHHH..',
      '..HSSSSHHHHHSH..',
      '..HSSKSSSSKSSH..',
      '..HSSSSSSSSSSH..',
      '...SSuuSSuuSS...',
      '....SSMMMMSS....',
      '.....sSSSSs.....',
      '...CCcCCCCcCC...',
      '..SCCCCCCOOCCS..',
      '..tCCCCCCCCCCS..',
      '....PPPPPPPP....',
      '....FF....FF....'] },
    // พี่ม่อน (FIEWXANDER): โปรเพลเยอร์ หนุ่มหล่อลุคแบดบอย ผมขาวเงินยุ่งไฮไลต์ดำ หมวกดำขอบขาว ผมม้ายาวปิดตา มีแสงตาเหลืองลอดเส้นผม โค้ตดำยาวกระดุมขาว เชิ้ตขาว เนกไทดำ ก้มกดมือถือ
    mon: {
      pal: { H: '#e9ebf2', h: '#9aa1b6', k: '#1b1b24', B: '#1a1d2b', b: '#2f3650', W: '#f4f4f4', S: '#f6d6b8', s: '#d9ab86', E: '#2a2630', K: '#16121c', g: '#ffe25a',
        m: '#b97a6e', C: '#141a2a', c: '#283150', O: '#f4f4f4', T: '#f4f4f4', t: '#101014', D: '#23262f', d: '#7fd0ff', P: '#131624', F: '#0b0b10' },
      rows: [
        '....WWWWWWWW....',
        '...BBBBBBBBBB...',
        '..BBbbBBBBBBBB..',
        '..HHHHhHHHHHHH..',
        '.HHhHHHHHHHkHHH.',
        '.HhHHHHHHHHkhhH.',
        '..HHhHHhHHkHHH..',
        '..HShgHSSHgkSH..',
        '...SSSSSSSSSS...',
        '....sSSmmSSs....',
        '...CCTTttTTCC...',
        '..CCOTTttTTOCC..',
        '..CSDDCttCCOCC..',
        '..CSddCCCCCOCC..',
        '...CCPPPPPPCC...',
        '....FF....FF....'],
      up: [
        '....WWWWWWWW....',
        '...BBBBBBBBBB...',
        '..BBBBBBbBBBBB..',
        '..HHHHHHHHHHHH..',
        '.HHhHHHHHHHkHHH.',
        '.HHhHHHHHHHkhHH.',
        '..HHhHHhHHkHHH..',
        '..HHhHHHHHkHHH..',
        '...HHHHHHHHHH...',
        '....hsSSSSsh....',
        '...CCCCCCCCCC...',
        '..CCCCcCCcCCCC..',
        '..CSCCCCCCCCSC..',
        '..CCCCCCCCCCCC..',
        '...CCPPPPPPCC...',
        '....FF....FF....'],
      // ผมปิดตา: เปลี่ยนแสงตาตามอารมณ์แทน (ปากยังเปลี่ยนตาม moodRows)
      moods: { happy: { 7: '..HShKHSSHKhSH..' }, angry: { 6: '..HHhkHhHkkHHH..', 7: '..HSggHSSHggSH..' }, tired: { 7: '..HShhHSSHhhSH..' } },
      side: [
        '.....WWWWWWW....',
        '....BBBBBBBBBB..',
        '...BBBBBBBbBBBB.',
        '...HHHhHHHHHHH..',
        '..HHhHHHHHkHHHH.',
        '..HHHHHHHHHHHH..',
        '...HHHHHkHHhHH..',
        '...HHhHSSSHgHS..',
        '....HHSSSSSSSSS.',
        '.....hSSSSSSmS..',
        '......sSSSSs....',
        '.....CCTTtC.....',
        '....CCCCOCSDd...',
        '....CCCCOCCC....',
        '....CCCPPPCC....',
        '......FF.FF.....'] },
    // พี่บูม: หมอหนุ่มหล่อสไตล์เกาหลี ผมหน้าม้าปัดข้างนุ่มๆ ผิวขาวใส เสื้อกาวน์ขาวคลุมเสื้อยืดสีเขียวหัวเป็ด หูฟังสีเงินคล้องคอ
    boom: {
      pal: { H: '#2a1d18', h: '#5a4438', S: '#fbe0c8', s: '#e8bfa0', K: '#1b1218', j: '#5a3a2a', m: '#d48f86', E: '#3a2622', W: '#f6f6f2', w: '#d4dae2',
        T: '#2f8f86', y: '#b8c0cc', P: '#2a3042', F: '#3a2a22' },
      rows: [
        '.....HHHHHH.....',
        '...HHHHHHHHHH...',
        '..HHHhhhHHHHHH..',
        '..HHHHHhhHHHHH..',
        '..HHHHHHHHHSHH..',
        '..HSEESSSSEESH..',
        '..HSSSSSSSSSSH..',
        '..HSSKjSSjKSSH..',
        '...SSSSSSSSSS...',
        '....sSSmmSSs....',
        '.....sSSSSs.....',
        '..WWWwTTTTwWWW..',
        '..WWWyTTTTyWWW..',
        '..SWWWTyyTWWWS..',
        '...WPPPPPPPPW...',
        '....FF....FF....'],
      up: [
        '.....HHHHHH.....',
        '...HHHHHHHHHH...',
        '..HHHHHhHHHHHH..',
        '..HHHHhHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '...HHHHHHHHHH...',
        '.....sSSSSs.....',
        '..WWWWWWWWWWWW..',
        '..WWWWWWWWWWWW..',
        '..SWWWWWWWWWWS..',
        '...WPPPPPPPPW...',
        '....FF....FF....'],
      side: [
        '.....HHHHHH.....',
        '....HHHHHHHHH...',
        '...HHHhhhHHHHH..',
        '...HHHHHHhhHHHH.',
        '...HHHHHHHHHHH..',
        '...HHHHSSSSEES..',
        '...HHHHSSSSSSS..',
        '...HHHSSSSSjKS..',
        '....HHSSSSSSSSS.',
        '.....HSSSSSSmS..',
        '......sSSSSs....',
        '.....WWwTTy.....',
        '....WWWWWTy.....',
        '....WWWWWWT.....',
        '.....WPPPPW.....',
        '......FF.FF.....'] },
    // ครูมวยสอนท่า (มงคลแดงคาดหัว กางเกงมวยแดง) และยายขายข้าวจี่
    kru: { hair: 'buzz', H: C.hairGray, S: C.skinTan, C: '#2f3d6b', P: '#c5482b', extra: ['grin', 'shorts'], patch: ['headband'], W: '#c5482b' },
    khaoji: { hair: 'tied', H: C.hairGray, S: C.skinOld, C: '#e8913a', P: '#4a3b2f', extra: ['grin'], patch: ['apron'], A: '#8a5a34' },
    // คนในโรงพยาบาลและตัวอำเภอ
    receptionist: { hair: 'tied', H: C.hairBlack, S: C.skinMid, C: '#8ab8d8', P: '#2f3d6b', extra: ['glasses'] },
    headnurse: { hair: 'bob', H: C.hairGray, S: C.skinMid, C: '#f4f4ec', P: '#f4f4ec', F: '#f4f4ec', extra: ['glasses'], patch: ['nursecap'], R: '#d9455a' },
    nurse: { hair: 'long', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#f4f4ec', F: '#f4f4ec', extra: [], patch: ['nursecap'], R: '#d9455a' },
    xraytech: { hair: 'short', H: C.hairBlack, S: C.skinMid, C: '#4a6a8a', P: '#4a6a8a', extra: [] },
    pharmacist: { hair: 'neat', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#3b3b3b', extra: ['glasses'] },
    hiatong: { hair: 'buzz', H: C.hairGray, S: C.skinFair, C: '#c5482b', P: '#3b3b3b', extra: ['grin'] },
    yaihom: { hair: 'tied', H: C.hairGray, S: C.skinOld, C: '#8a3f6b', P: '#4a3b2f', extra: ['robe'] },
    plian: { hair: 'cap', B: '#d9b25a', H: C.hairGray, S: C.skinTan, C: '#2f3d6b', P: '#2f3d6b', extra: ['grin', 'shorts', 'barefoot'] },
    sister: { hair: 'bob', H: C.hairBrown, S: C.skinTan, C: '#9fd8f0', P: '#9fd8f0', extra: [] },
    boommom: { hair: 'tied', H: C.hairBlack, S: C.skinTan, C: '#e9b949', P: '#4a3b2f', extra: ['grin'], patch: ['apron'], A: '#d9455a' },
    breadlady: { hair: 'tied', H: C.hairBrown, S: C.skinMid, C: '#f2a0c0', P: '#3d3260', extra: ['grin'], patch: ['apron'], A: '#f4f4ec' },
    fisher: { hair: 'buzz', H: C.hairBlack, S: C.skinTan, C: '#5a7a4a', P: '#2f3d6b', extra: ['shorts', 'barefoot'] },
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
    med_nurse: { C: '#f4f4ec', E: '#d9455a', mark: ['.X.', 'XXX', '.X.'] },  // กาชาด (ชุดพยาบาล)
    med_doc: { C: '#f4f4ec', E: '#2f8f86', mark: ['X.X', '.X.', '.X.'] },    // คทาหมอ (เสื้อกาวน์)
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
    // ด่าน 3: ผีริมลำน้ำพอง ตัวอำเภอ และโรงพยาบาล + เตียงคนไข้ (ดันได้)
    nangngueak: { pal: { G: '#3fae9a', g: '#2a7a6e', S: '#f2d2b6', K: '#1b1414', M: '#d9758a', W: '#f4e8d8', T: '#6fb8d8', t: '#4a8ab0', F: '#c8ecf8' }, rows: [
      '......GGGG......', '....GGGGGGGG....', '...GGGgGGGGGG...', '...GGSSSSSSGG...', '..GGSKSSSSKSGG..', '..GGSSSSSSSSGG..', '..GgGSSMMSSGgG..', '..GG.SSSSSS.GG..',
      '..Gg.SWWWWS.gG..', '..G..SSSSSS..G..', '.....TTTTTT.....', '......TTtTT.....', '.......TTtT.....', '........TTT.....', '.......FFTFF....', '......FF...FF...'] },
    takhian: { pal: { H: '#1e2a1e', L: '#6cc04a', S: '#e8c8a4', K: '#1b1414', M: '#b8485a', C: '#3f8a4a', c: '#2a6a36', Y: '#e2b84a', W: '#d8f0d8' }, rows: [
      '.....HHHHHH.....', '...LHHHHHHHHL...', '..LHHHHHHHHHHL..', '..HHSSSSSSSSHH..', '..HHSKKSSKKSHH..', '..HHSSSSSSSSHH..', '..HHHSSMMSSHHH..', '..HHH.SSSS.HHH..',
      '..HHYCCCCCCYHH..', '..HHSCcCCcCSHH..', '..HH.CCCCCC.HH..', '..H..CCccCC..H..', '.....CCCCCC.....', '.....WCCCCW.....', '......WWWW......', '.......WW.......'] },
    taehak: { pal: { N: '#d9b25a', n: '#a8823a', S: '#c08a62', K: '#1b1414', M: '#7a2e2a', W: '#e8e2d0', C: '#2f3d6b', P: '#24305e', Y: '#d9b25a', h: '#8a6440', y: '#b8bcc4' }, rows: [
      '......NNNN......', '....NNNNNNNN....', '..NNnnnnnnnnNN..', '.....SSSSSS.....', '.....SKSSKS.....', '.....SSSSSS.....', '.....SWMMWS..yy.', '......WWWW...yh.',
      '....CCCCCCCC.h..', '...CCCCCCCCCSh..', '..YCCCCCCCCC.h..', '..Y.CCCCCCCC.h..', '....YPPPPPPY.h..', '.....PP..PP.....', '.....YY..YY.....', '................'] },
    krasue: { pal: { H: '#1b1414', S: '#f4d8c0', K: '#1b1414', R: '#d9455a', O: '#f2c84b', Y: '#fff2a8', o: '#e8913a' }, rows: [
      '................', '.....YYYYYY.....', '....YHHHHHHY....', '...YHHHHHHHHY...', '...YHSSSSSSHY...', '...YHSKSSKSHY...', '...YHSSSSSSHY...', '....YSSRRSSY....',
      '.....YSSSSY.....', '......OYYO......', '......OYYo......', '.....O.YY.o.....', '.....o.Yo..O....', '....O...O...o...', '....o...o....O..', '...........o....'] },
    nak: { pal: { B: '#2f6fb0', b: '#5fa8e0', Y: '#e8bf4a', K: '#1b1414', W: '#ffffff', R: '#d9455a', L: '#c8ecf8' }, rows: [
      '....Y.Y.Y.......', '....YYYYY.......', '...BBBBBBB......', '..BBKWBBKWB.....', '..BBBBBBBBB.....', '...BLLLLLB.R....', '....BBBBB.R.....', '.....BbBB.......',
      '......BbBB......', '.......BbBB.....', '........BbBB....', '.......BbBB.....', '.....BBbBB......', '...BBbbBB.......', '..BBBBBB........', '.BB.............'] },
    takhon: { pal: { R: '#d9455a', Y: '#f2d24b', G: '#4f9a5a', B: '#3a6ab0', W: '#f4f4ec', K: '#1b1414', N: '#e8913a', P: '#8a3f6b', S: '#c08a62', w: '#8a6440' }, rows: [
      '...Y..RRRR..Y...', '...YYRRRRRRYY...', '....RWWRRWWR....', '....RWKRRKWR....', '....RRRNNRRR....', '....YRRNNRRY....', '....YYRNNRYY....', '.....GGNNGG.....',
      '....BBGGGGRR....', '...BBBGGGRRRw...', '..SBBYYGGRRRSw..', '....PPYYBBPP.w..', '....PPPPBBPP.w..', '....GG....YY....', '....GG....YY....', '...KKK....KKK...'] },
    pusom: { pal: { S: '#c08a62', K: '#1b1414', W: '#f4f4ec', w: '#cfcfc8', C: '#e8e2d0', c: '#b8b0a0', Y: '#e2b84a', y: '#a8823a' }, rows: [
      '................', '......SSSS......', '....wSSSSSSw....', '....wSKSSKSw....', '....wSSSSSSw....', '.....WWWWWW.....', '....WWWWWWWW....', '...CWWWWWWWWC...',
      '..CCCWWWWWWCCC..', '..CSSYYYYYYSSC..', '..CCYYyYYyYYCC..', '..CCYYYYYYYYCC..', '..CCcYYYYYYcCC..', '.cCCCCyyyyCCCCc.', '.cccCCCCCCCCccc.', '................'] },
    nurseghost: { pal: { W: '#eef4f8', w: '#c8d8e4', R: '#d9455a', H: '#7a7a8a', S: '#dfe8ee', K: '#2a3a4a', M: '#8a9aa8', B: '#9fd8f0', b: '#5fb8e0' }, rows: [
      '......WWWW......', '.....WWRRWW.....', '....HWWWWWWH....', '....HSSSSSSH..BB', '....HSKSSKSH..BB', '....HSSSSSSH..b.', '.....SSMMSS...b.', '.....wSSSSw...b.',
      '....WWWWWWWW..b.', '...WWWWRWWWWSSb.', '...WWWWWWWWW....', '....WWWWWWWW....', '....wWWWWWWw....', '.....wWWWWw.....', '......wWWw......', '.......ww.......'] },
    wheelchair: { pal: { M: '#9aa3ae', m: '#5f6873', B: '#8a3f6b', b: '#a85a8a', W: '#ffffff', K: '#1b1414', G: '#6cf06c', g: '#3a9a3a' }, rows: [
      '................', '..MM............', '..MM............', '..MBBBBBBB......', '..MBbBBBbB......', '..MBWKBWKB......', '..MBBBBBBBM.....', '..MBBBBBBBMMMM..',
      '..MMMMMMMMM..M..', '..M.....M....M..', '.GGGG..M.....M..', 'GgmmgG.MMMMMMM..', 'GmMMmG......gGg.', 'GgmmgG......GmG.', '.GGGG.......gGg.', '................'] },
    bed: { pal: { M: '#9aa3ae', W: '#f4f4ec', B: '#5fb8e0', b: '#4a90c0', K: '#3a3f48' }, rows: [
      '................', '.MMMMMMMMMMMMMM.', '.MWWWWWWWWWWWWM.', '.MWWWWWWWWWWWWM.', '.MBBBBBBBBBBBBM.', '.MBbBBBBBBBBBBM.', '.MBBBBBBBBBBBBM.', '.MBBBBBBBBBBbBM.',
      '.MBBBBBBBBBBBBM.', '.MBBBBbBBBBBBBM.', '.MBBBBBBBBBBBBM.', '.MMMMMMMMMMMMMM.', '..K..........K..', '..K..........K..', '.KKK........KKK.', '................'] },
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
    const base = { hair: e.hair, H: i % 3 === 2 ? C.hairBrown : C.hairBlack, S: SKIN[e.skin] || C.skinMid, shop: branch };
    if (branch === 'med_nurse') return { ...base, P: '#f4f4ec', F: '#f4f4ec', R: '#d9455a', extra: e.glasses ? ['glasses'] : [], patch: ['nursecap'] };
    if (branch === 'med_doc') return { ...base, P: i % 2 ? '#3b4a6b' : '#2a2a33', N: '#9aa3ae', extra: ['stethoscope', ...(e.glasses ? ['glasses'] : [])] };
    const extra = ['shop']; if (e.glasses) extra.push('glasses');
    return { ...base, P: i % 2 ? '#3b4a6b' : '#2a2a33', extra };
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
    const lk = LOOKS[id] || LOOKS.player;
    if (lk.rows) return { rows: lk.rows, pal: lk.pal, human: true, hairKey: 'H', views: { up: lk.up, side: lk.side }, moods: lk.moods };
    return buildHuman(lk);
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

  // ไอคอนไอเท็มและตรายิม 16×16 วาดด้วยโค้ด ("item:<id>" / "badge:<gym1..4>")
  function drawIcon(id) {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    const R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const O = (col, x, y, rx, ry) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    const K = '#2a1d18';
    const cup = (liq, top) => { R(K, 4, 4, 8, 11); R('#e8f4f8', 5, 5, 6, 9); R(liq, 5, 7, 6, 7); R(top || liq, 5, 6, 6, 1); R('#c5482b', 9, 1, 1, 6); R('#f4f4ec', 6, 8, 1, 4); };
    const [kind, key] = id.split(':');
    if (kind === 'type') {   // สัญลักษณ์ธาตุ (ดูได้โดยไม่ต้องพึ่งสี)
      const W = '#fff8e0', P = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill(); };
      if (key === 'water') { P([[8, 1], [13, 9], [3, 9]], K); O(K, 8, 10, 5.5, 5); P([[8, 2.5], [12, 9], [4, 9]], W); O(W, 8, 10, 4.5, 4); O('#7cc6de', 6.5, 10, 1.2, 2); }
      else if (key === 'earth') { P([[0, 15], [6, 3], [9, 8], [11, 6], [16, 15]], K); P([[1.5, 14], [6, 5], [9, 10], [11, 8], [14.5, 14]], W); P([[4.5, 8], [6, 5], [7.5, 8]], '#b06a3e'); }
      else if (key === 'electric') { P([[10, 0], [2, 9], [7, 9], [5, 16], [14, 6], [9, 6], [12, 0]], K); P([[10, 1.5], [3.8, 8.2], [8.2, 8.2], [6.5, 13.5], [12.5, 6.8], [8, 6.8], [10.8, 1.5]], W); }
      else if (key === 'wind') { g.strokeStyle = K; g.lineWidth = 3.2; const sw = () => { g.beginPath(); g.moveTo(1, 6); g.lineTo(10, 6); g.arc(10, 3.8, 2.2, Math.PI / 2, -Math.PI * 0.9, true); g.moveTo(1, 10); g.lineTo(12, 10); g.arc(12, 12.2, 2.2, -Math.PI / 2, Math.PI * 0.9); g.stroke(); }; sw(); g.strokeStyle = W; g.lineWidth = 1.4; sw(); }
      else { const st = (r, col) => { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r; pts.push([8 + Math.cos(a) * rr, 8.5 + Math.sin(a) * rr]); } P(pts, col); }; st(7.5, K); st(6, W); }
      return c;
    }
    if (kind === 'badge') {
      O('#18203f', 8, 8, 7.5, 7.5); O(key === 'gym1' ? '#c5482b' : key === 'gym2' ? '#d9b25a' : key === 'gym3' ? '#5fb8e0' : '#6cc04a', 8, 8, 6.5, 6.5);
      if (key === 'gym1') { R('#f4f4ec', 3, 6, 10, 3); R('#c5482b', 5, 7, 2, 1); R('#c5482b', 9, 7, 2, 1); R('#f4f4ec', 11, 9, 2, 4); }
      else if (key === 'gym2') { for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; R('#8a6a24', 7 + Math.round(Math.cos(a) * 5), 7 + Math.round(Math.sin(a) * 5), 2, 2); } O('#8a6a24', 8, 8, 4, 4); O('#d9b25a', 8, 8, 2, 2); }
      else if (key === 'gym3') { g.strokeStyle = '#18203f'; g.lineWidth = 1.5; g.beginPath(); g.arc(8, 6, 3.5, 0, Math.PI); g.stroke(); R('#18203f', 7, 9, 2, 3); O('#f4f4ec', 8, 12, 2, 2); }
      else { R('#8a6440', 4, 11, 2, 2); R('#8a6440', 6, 9, 2, 2); R('#8a6440', 8, 7, 2, 2); R('#8a6440', 10, 5, 2, 2); R('#5a3a22', 11, 4, 2, 2); }
      return c;
    }
    switch (key) {
      case 'rice_ball': O(K, 8, 9, 6.5, 5.5); O('#f4f4ec', 8, 9, 5.5, 4.5); R('#e0dccf', 5, 11, 6, 1); R('#ffffff', 5, 6, 2, 1); break;
      case 'rice_pork': R('#8a6440', 2, 13, 13, 1); O('#f4f4ec', 5, 9, 3.5, 3); O('#a8592f', 11, 8, 3.5, 3); R('#7a3a1e', 9, 7, 4, 1); R('#d9783e', 10, 9, 2, 1); break;
      case 'coupon': R(K, 1, 4, 14, 9); R('#f2a0c0', 2, 5, 12, 7); R('#c5482b', 2, 7, 12, 2); R('#f4f4ec', 4, 7, 4, 1); R('#18203f', 10, 5, 1, 7); break;
      case 'herb': R(K, 4, 4, 8, 10); R('#6cc04a', 5, 6, 6, 7); R('#c5482b', 4, 3, 8, 2); R('#f4f4ec', 6, 8, 4, 2); break;
      case 'herb_big': O(K, 8, 10, 6.5, 5); O('#a8592f', 8, 10, 5.5, 4); R('#7a3a1e', 4, 5, 8, 2); R('#cfd6dc', 6, 1, 1, 3); R('#cfd6dc', 9, 2, 1, 3); break;
      case 'soda': R(K, 6, 1, 4, 3); R(K, 5, 4, 6, 11); R('#d9455a', 6, 5, 4, 9); R('#f4f4ec', 6, 8, 4, 2); R('#ffffff', 7, 5, 1, 3); break;
      case 'mango_shake': cup('#f2a03a', '#ffd84a'); break;
      case 'melon_shake': cup('#e8506a', '#ff8aa0'); break;
      case 'thaitea_shake': cup('#e8913a', '#f4f4ec'); break;
      case 'ovaltine_shake': cup('#6b4a2f', '#a8744a'); O('#8a5a34', 8, 4, 4, 2.5); break;
      case 'holy_water': O(K, 8, 10, 7, 4.5); O('#b8bcc4', 8, 10, 6, 3.5); O('#7cc6de', 8, 9, 4.5, 2); R('#f4f4ec', 6, 8, 2, 1); R('#d9b25a', 7, 2, 2, 4); break;
      case 'magic_rice': O(K, 8, 10, 6, 5); O('#e8dcc0', 8, 10, 5, 4); R('#c5482b', 5, 4, 6, 2); R('#f4f4ec', 6, 8, 1, 1); R('#f4f4ec', 9, 10, 1, 1); R('#f4f4ec', 7, 12, 1, 1); break;
      case 'yantra': R(K, 2, 2, 12, 12); R('#f4f4ec', 3, 3, 10, 10); g.strokeStyle = '#c5482b'; g.lineWidth = 1; g.strokeRect(4.5, 4.5, 7, 7); R('#c5482b', 7, 6, 2, 4); R('#c5482b', 6, 7, 4, 1); break;
      case 'gloves': R(K, 4, 3, 9, 11); R('#d9a04a', 5, 4, 7, 9); R('#a8742a', 5, 11, 7, 2); R(K, 7, 4, 1, 4); R(K, 9, 4, 1, 4); R('#d9a04a', 2, 7, 3, 3); break;
      case 'goggles': R(K, 1, 5, 14, 7); R('#f2d24b', 2, 6, 12, 5); O('#5fb8e0', 5, 8.5, 2.5, 2); O('#5fb8e0', 11, 8.5, 2.5, 2); R('#18203f', 7, 8, 2, 1); break;
      // ของที่ระลึกสนามอีสปอร์ต และของกินในเมือง
      case 'team_jersey': R(K, 2, 3, 12, 11); R('#1d1d24', 3, 4, 10, 9); R('#7a2ad0', 1, 4, 3, 5); R('#7a2ad0', 12, 4, 3, 5); R('#e8ecf0', 6, 4, 4, 2); R('#b04ae8', 7, 8, 2, 2); break;
      case 'team_cap': O(K, 8, 9, 6.5, 4.5); O('#1d1d24', 8, 9, 5.5, 3.5); R(K, 2, 10, 13, 3); R('#7a2ad0', 3, 11, 11, 1); R('#e8ecf0', 7, 7, 3, 2); break;
      case 'omen_keychain': O(K, 8, 4, 2.5, 2.5); O('#c9a45a', 8, 4, 1.5, 1.5); R('#c9a45a', 7.5, 6, 1, 2); O(K, 8, 11, 5, 4.5); O('#1d2340', 8, 11, 4, 3.5); R('#5fe0f0', 6, 10, 1, 1); R('#5fe0f0', 9, 10, 1, 1); break;
      case 'cheer_towel': R(K, 1, 4, 14, 8); R('#7a2ad0', 2, 5, 12, 6); R('#f4f4ec', 3, 7, 10, 2); R('#ff4fb0', 2, 5, 2, 6); R('#ff4fb0', 12, 5, 2, 6); break;
      case 'lightstick': R(K, 6, 9, 4, 6); R('#3a3f48', 7, 10, 2, 4); O(K, 8, 5, 4, 4.5); O('#5fe0f0', 8, 5, 3, 3.5); O('#ffffff', 7, 4, 1, 1); break;
      case 'led_sign': R(K, 1, 3, 14, 10); R('#0c0d14', 2, 4, 12, 8); R('#ff4fb0', 3, 6, 2, 4); R('#5fe0f0', 6, 6, 2, 4); R('#f2d24b', 9, 6, 2, 4); R('#b06aff', 12, 6, 1, 4); break;
      case 'popcorn': R(K, 3, 7, 10, 8); R('#d9455a', 4, 8, 8, 6); R('#f4f4ec', 6, 8, 1, 6); R('#f4f4ec', 9, 8, 1, 6); O('#f2d24b', 5, 6, 2, 2); O('#fff2c0', 8, 5, 2.5, 2); O('#f2d24b', 11, 6, 2, 2); break;
      case 'gamer_drink': R(K, 5, 2, 6, 13); R('#2a2a33', 6, 3, 4, 11); R('#4fe07a', 6, 5, 4, 2); R('#4fe07a', 7, 8, 2, 4); R('#b8bcc4', 6, 2, 4, 1); break;
      case 'meatball': R('#8a6440', 7, 1, 1, 14); for (const yy of [4, 8, 12]) { O(K, 7.5, yy, 3, 2.5); O('#b0703a', 7.5, yy, 2.2, 1.8); } break;
      case 'naem': R('#8a6440', 2, 13, 12, 1); for (const xx of [4, 8, 12]) { O(K, xx, 9, 2.4, 3.6); O('#c5482b', xx, 9, 1.6, 2.8); R('#f4f4ec', xx - 1, 8, 1, 1); } break;
      case 'sandwich': g.fillStyle = K; g.beginPath(); g.moveTo(2, 13); g.lineTo(14, 13); g.lineTo(8, 3); g.fill(); g.fillStyle = '#e8c88a'; g.beginPath(); g.moveTo(3.5, 12); g.lineTo(12.5, 12); g.lineTo(8, 4.5); g.fill(); R('#6cc04a', 4, 10, 8, 1); R('#f2a0b0', 5, 9, 6, 1); break;
      case 'mama_cup': R(K, 3, 4, 10, 11); R('#f4f4ec', 4, 5, 8, 9); R('#d9455a', 4, 8, 8, 3); R('#f2d24b', 6, 9, 4, 1); R('#c9c0b0', 4, 4, 8, 1); break;
      default: {   // ท่าลับ: ม้วนคัมภีร์สีตามธาตุ
        const it = G.DATA && G.DATA.items[key];
        const col = { wind: '#4f9a5a', electric: '#f2d24b', earth: '#b06a3e', water: '#3a7fb0', normal: '#8a8270' }[it && it.for] || '#8a8270';
        R(K, 2, 3, 12, 10); R('#efe6d0', 3, 4, 10, 8); R(col, 3, 6, 10, 4); R('#8a6440', 1, 3, 2, 10); R('#8a6440', 13, 3, 2, 10); R('#f4f4ec', 5, 7, 6, 1);
      }
    }
    return c;
  }
  const cache = {};
  G.sprite = function (id) {
    if (!cache[id]) {
      if (/^(item|badge|type):/.test(id)) cache[id] = drawIcon(id);
      else { const d = defFor(id); cache[id] = paint(d, d.rows); }
    }
    return cache[id];
  };

  // ภาพเดิน 4 ทิศ × 3 เฟรม (0 ยืน, 1 ก้าวซ้าย, 2 ก้าวขวา) สร้างจากภาพหน้าตรง
  const FACE = 'SKMGQEWa';
  function liftFoot(rows, which) {
    const r15 = rows[15].split(''), r14 = rows[14].split('');
    const runs = []; let s = -1;
    for (let i = 0; i <= 16; i++) { const on = i < 16 && r15[i] !== '.'; if (on && s < 0) s = i; if (!on && s >= 0) { runs.push([s, i]); s = -1; } }
    const run = runs[which]; if (!run) return;
    for (let i = run[0]; i < run[1]; i++) { r14[i] = r15[i]; r15[i] = '.'; }
    rows[14] = r14.join(''); rows[15] = r15.join('');
  }
  // ท่าหันข้าง (หันขวา): ใช้ผมด้านบนจากภาพหน้าตรง แล้ววาดหน้า ลำตัว ขา แบบด้านข้าง
  function sideRows(f, frame) {
    const at = (y, x) => f[y][x];
    const leg = 'SC'.includes(at(14, 4)) ? at(14, 4) : 'P', foot = at(15, 4) === 'S' ? 'S' : 'F';
    const pants = at(13, 5) === '.' ? 'P' : at(13, 5);
    const wide = at(10, 2) !== '.';
    const glasses = f[5].includes('G'), narrow = !f[5].includes('K') && f[6].includes('K');
    const longHair = f[4][2] === 'H' || f[5][2] === 'H';
    const blush = f[7].includes('Q');
    const sh = (r) => '.' + r.slice(0, 15);
    const rows = [sh(f[0]), sh(f[1]), sh(f[2]), sh(f[3])];
    rows.push('....HHHSSSSSS...');
    rows.push(glasses ? '....HHSSSGGGG...' : narrow ? '....HHSSSSSSS...' : '....HHSSSSKSS...');
    rows.push(glasses ? '....HHSSSGKGSS..' : narrow ? '....HHSSSSKKSS..' : '....HHSSSSKSSS..');
    rows.push(blush ? '.....HSSSQSMS...' : '.....HSSSSSMS...');
    rows.push('......SSSSSS....');
    if (longHair) for (const y of [7, 8, 9]) { const r = rows[y] ? rows[y].split('') : '................'.split(''); r[4] = 'H'; r[5] = 'H'; rows[y] = r.join(''); }
    const arm = frame === 1 ? 9 : frame === 2 ? 6 : 7;   // แกว่งแขน
    const body = (y, from, to) => { const r = '................'.split(''); for (let i = from; i <= to; i++) r[i] = 'C'; if (y >= 11) r[arm] = 'S'; return r.join(''); };
    rows[9] = longHair ? (() => { const r = body(9, 5, 10).split(''); r[4] = 'H'; return r.join(''); })() : body(9, 5, 10);
    rows[10] = body(10, wide ? 4 : 5, wide ? 11 : 11);
    rows[11] = body(11, wide ? 4 : 5, 11);
    rows[12] = body(12, wide ? 4 : 5, 11);
    rows[13] = '......' + pants.repeat(5) + '.....';
    if (frame === 0) { rows[14] = '.......' + leg.repeat(3) + '......'; rows[15] = '.......' + foot.repeat(4) + '.....'; }
    else if (frame === 1) { rows[14] = '.....' + leg.repeat(2) + '...' + leg.repeat(2) + '....'; rows[15] = '....' + foot.repeat(2) + '.....' + foot.repeat(2) + '...'; }
    else { rows[14] = '......' + leg.repeat(2) + '.' + leg.repeat(2) + '.....'; rows[15] = '......' + foot.repeat(2) + '.' + foot.repeat(2) + '.....'; }
    return rows;
  }
  const actorCache = {};
  G.actorSprite = function (id, dir, frame) {
    const key = `${id}|${dir}|${frame}`;
    if (actorCache[key]) return actorCache[key];
    const def = defFor(id);
    let c;
    if (!def.human) c = G.sprite(id);
    else {
      const at = id.indexOf('@');
      const front = at > 0 ? defFor(id.slice(0, at)).rows : def.rows;   // ภาพก่อนแปะของประจำตัว
      let rows;
      if (def.views && (def.views.side || def.views.up) && dir !== 'down') {   // วาดเองทุกทิศ
        if (dir === 'up') { rows = def.views.up.slice(); if (frame) liftFoot(rows, frame - 1); }
        else {
          rows = def.views.side.slice();
          const arm = frame === 1 ? 10 : frame === 2 ? 7 : 9;
          for (const y of [11, 12]) { const r = rows[y].split(''); r[arm] = 'S'; rows[y] = r.join(''); }
          if (frame === 1) rows[15] = '.....FF...FF....'; else if (frame === 2) rows[15] = '.......FFF......';
        }
      } else if (dir === 'left' || dir === 'right') rows = sideRows(front, frame);
      else {
        rows = front.slice();
        if (dir === 'up') {   // หันหลัง: หน้ากลายเป็นผม ตราที่อกหายไป
          for (let y = 4; y <= 7; y++) rows[y] = rows[y].split('').map((ch) => (FACE.includes(ch) && ch !== 'a' ? def.hairKey : ch)).join('');
          for (let y = 9; y <= 11; y++) rows[y] = rows[y].replace(/[EYa]/g, 'C');
        }
        if (frame) liftFoot(rows, frame - 1);
      }
      if (at > 0) patch(rows, STAGE[id]);
      c = paint(def, rows);
    }
    if (dir === 'left') {
      const f = document.createElement('canvas'); f.width = f.height = 16;
      const x = f.getContext('2d'); x.translate(16, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = f;
    }
    actorCache[key] = c;
    return c;
  };

  // ---------- อารมณ์บนหน้า (ใช้กับรูปหน้าในกล่องข้อความ และท่านั่งหอบ) ----------
  // happy = ตายิ้ม ^ ^ ปากกว้าง, angry = คิ้วขมวด ปากเม้ม, shock = ปากอ้า, tired = ตาปรือ
  // ตัวละครที่วาดเองบางตัวมีหน้าเฉพาะอารมณ์ (moods: {อารมณ์: {แถว: '...'}}) ทับหลัง moodRows
  function faceRows(def, mood) {
    const rows = moodRows(def.rows, mood), p = def.moods && def.moods[mood];
    return p ? rows.map((r, y) => p[y] || r) : rows;
  }
  function moodRows(rows, mood) {
    if (!mood || mood === 'normal') return rows;
    const r = rows.map((x) => x.split(''));
    const at = (y, x) => (r[y] && r[y][x]) || '.';
    const set = (y, x, ch, only) => { if (r[y] && x >= 0 && x < 16 && (!only || only.includes(r[y][x]))) r[y][x] = ch; };
    const mouth = []; let my = 99;
    for (let y = 6; y <= 9; y++) for (let x = 0; x < 16; x++) if ('Mm'.includes(r[y][x])) { mouth.push([y, x]); my = Math.min(my, y); }
    const eyes = [[], []];
    for (let y = 5; y < Math.min(9, my); y++) for (let x = 2; x < 14; x++) if ('Kj'.includes(r[y][x]) && /[SQ]/.test(at(y, x - 1) + at(y, x + 1) + at(y - 1, x) + at(y + 1, x))) eyes[x < 8 ? 0 : 1].push([y, x]);
    for (const e of eyes) {
      if (!e.length) continue;
      const xs = e.map((p) => p[1]), ys = e.map((p) => p[0]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), left = x0 < 8;
      if (mood === 'happy' || mood === 'tired') {
        for (const [y, x] of e) r[y][x] = 'S';
        if (mood === 'happy') { for (let x = x0; x <= x1; x++) set(y0, x, 'K'); set(y0 + 1, x0 - 1, 'K', 'S'); set(y0 + 1, x1 + 1, 'K', 'S'); }
        else for (let x = x0; x <= Math.max(x1, x0 + 1); x++) set(y1, x, 'K', 'SKj');
      } else if (mood === 'angry') {
        const inner = left ? x1 + 1 : x0 - 1;
        for (let x = x0; x <= x1; x++) set(y0 - 1, x, 'K', 'SH');
        set(y0 - 1, inner, 'K', 'S'); set(y0, inner, 'K', 'S');
      }
    }
    if (mouth.length) {
      const xs = mouth.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      if (mood === 'happy') { set(my, x0 - 1, 'M', 'S'); set(my, x1 + 1, 'M', 'S'); for (let x = x0; x <= x1; x++) set(my, x, 'W'); }
      else if (mood === 'angry') for (const [y, x] of mouth) r[y][x] = 'K';
      else if (mood === 'shock') for (const [y, x] of mouth) { set(y + 1, x, 'M', 'S'); r[y][x] = 'K'; }
    }
    return r.map((x) => x.join(''));
  }
  const portraitCache = {};
  // รูปหน้าครึ่งตัว (ตัดเอาหัวถึงอก) ของตัวละครแบบคน, ผี/สัตว์ใช้ทั้งตัว
  G.portrait = function (id, mood) {
    const key = id + '|' + (mood || 'normal');
    if (portraitCache[key]) return portraitCache[key];
    const def = defFor(id);
    const c = document.createElement('canvas'); c.width = def.human ? 12 : 16; c.height = def.human ? 12 : 16;
    if (def.human) c.getContext('2d').drawImage(paint({ ...def, pal: { W: '#ffffff', ...def.pal } }, faceRows(def, mood)), -2, 0);   // ซูมเฉพาะหัวถึงไหล่
    else c.getContext('2d').drawImage(G.sprite(id), 0, 0);
    return (portraitCache[key] = c);
  };
  // ท่านั่งหอบตอนหมดแรง: ตัวทรุดลง ขาเหยียดไปข้างหน้า ตาปรือ (ผี/สัตว์คืน null = จางหายไปแทน)
  const sitCache = {};
  G.sitSprite = function (id) {
    if (id in sitCache) return sitCache[id];
    const def = defFor(id);
    if (!def.human) return (sitCache[id] = null);
    const f = faceRows(def, 'tired');
    const pants = (f[13].match(/[^.]/) || ['P'])[0], foot = (f[15].match(/[^.]/) || ['F'])[0];
    const rows = ['................', '................', ...f.slice(0, 13)];   // ทรุดลง 2 ช่อง
    rows[14] = rows[14].replace(/^(\.\.)\./, '$1' + pants).replace(/\.(\.\.)$/, pants + '$1');   // หัวเข่า
    rows.push('.' + foot + pants.repeat(12) + foot + '.');                                    // ขาเหยียดไปข้างหน้า
    return (sitCache[id] = paint(def, rows));
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
