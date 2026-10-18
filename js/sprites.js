// พิกเซลอาร์ตเขียนเป็นตัวอักษร 16×16 แก้รูปได้ที่นี่โดยตรง (อักษร = สีในพาเลต, จุด = โปร่งใส)
(function (G) {
  'use strict';
  const C = {
    skinTan: '#a8693f', skinFair: '#f2d2b6', skinMid: '#d9a57b', skinOld: '#c08a62',
    hairBlack: '#2a1d18', hairGray: '#9a958c', hairBrown: '#5a3a22', hairDye: '#d9b25a',
    eye: '#1b1414', mouth: '#7a2e2a', shoe: '#3b2a22',
  };

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
  const HAIR = {
    short: null,
    curly: { 1: '....H.HHHH.H....', 2: '...HHHHHHHHHH...', 3: '..HHHHHHHHHHHH..' },
    spiky: { 0: '...H..H..H..H...', 1: '...HH.HHHH.HH...', 2: '..HHHHHHHHHHHH..' },
    neat: { 3: '...HHHHHHHHHHH..', 4: '...HSSSSSSSSHH..' },
    long: { 4: '..HHSSSSSSSSHH..', 5: '..HSSKSSSSKSSH..', 6: '..HSSKSSSSKSSH..', 7: '..HHSSSMMSSSHH..', 8: '..HH.SSSSSS.HH..' },
    tied: { 0: '......HHHH......', 4: '..HHSSSSSSSSHH..', 7: '..HHSSSMMSSSHH..' },
    bald: { 1: '................', 2: '.....SSSSSS.....', 3: '....SSSSSSSS....', 4: '...SSSSSSSSSS...' },
    topknot: { 0: '.......HH.......', 1: '.....HHHHHH.....' },
    bandana: { 1: '.....BBBBBB.....', 2: '....BBBBBBBB....', 3: '...BBBWBBBBBB...' },
  };
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
    jam: { hair: 'bald', H: C.skinOld, S: C.skinOld, C: '#f2efe4', P: '#f2efe4', extra: ['robe', 'stick'] },
    tasi: { hair: 'short', H: C.hairGray, S: C.skinTan, C: '#2f3d6b', P: '#2f3d6b', extra: ['shorts', 'barefoot'] },
    beedad: { hair: 'short', H: C.hairBlack, S: C.skinTan, C: '#b5502f', P: '#2f3d6b', extra: ['barefoot'] },
    rival: { hair: 'spiky', H: C.hairBrown, S: C.skinTan, C: '#2a2a2a', P: '#7a2e2a', extra: ['grin'] },
    student1: { hair: 'short', H: C.hairBlack, S: C.skinMid, C: '#f4f4ec', P: '#3b2a5a', extra: [] },
    student2: { hair: 'long', H: C.hairBlack, S: C.skinFair, C: '#f4f4ec', P: '#3b2a5a', extra: [] },
    henchman: { hair: 'bandana', B: '#2b2b6b', W: '#f4f4ec', H: C.hairBlack, S: C.skinMid, C: '#1f1f2e', P: '#3b3b3b', extra: [] },
    henchman2: { hair: 'spiky', H: C.hairDye, S: C.skinMid, C: '#1f1f2e', P: '#3b3b3b', extra: ['grin'] },
    ossie: { hair: 'bandana', B: '#c5482b', W: '#f4f4ec', H: C.hairDye, S: C.skinFair, C: '#2b3f8a', P: '#1d1d24', N: '#d9b25a', extra: ['sword'] },
    vendor: { hair: 'topknot', H: C.hairBlack, S: C.skinMid, C: '#c5482b', P: '#2f3d6b', extra: ['robe'] },
  };

  // ผีสาง คางคก ควาย ไอเท็ม: วาดเองทั้งตัว
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
    item: { pal: { W: '#f4f4ec', R: '#c5482b', K: '#2a1d18' }, rows: [
      '................', '................', '................', '................', '................', '......KKKK......', '.....KWWWWK.....', '....KWWRRWWK....',
      '....KWRRRRWK....', '....KWWRRWWK....', '.....KWWWWK.....', '......KKKK......', '................', '................', '................', '................'] },
  };

  function buildHuman(look) {
    const rows = HUMAN.slice();
    const apply = (ov) => { if (ov) for (const k in ov) rows[k] = ov[k]; };
    apply(HAIR[look.hair]);
    for (const e of look.extra) apply(OVERLAY[e]);
    const pal = { K: C.eye, M: C.mouth, F: C.shoe, G: '#1b1414', W: '#f4f4ec', N: '#6b5040', ...look };
    return { rows, pal };
  }

  const cache = {};
  G.sprite = function (id) {
    if (cache[id]) return cache[id];
    const def = CUSTOM[id] || buildHuman(LOOKS[id] || LOOKS.player);
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const x = c.getContext('2d');
    def.rows.forEach((row, y) => {
      for (let i = 0; i < 16; i++) {
        const ch = row[i];
        if (ch === '.' || !def.pal[ch]) continue;
        x.fillStyle = def.pal[ch]; x.fillRect(i, y, 1, 1);
      }
    });
    cache[id] = c;
    return c;
  };
  G.lookColor = (id) => (LOOKS[id] ? LOOKS[id].C : '#888');
  G._spriteDefs = { HUMAN, HAIR, OVERLAY, LOOKS, CUSTOM };
})(window.G = window.G || {});
