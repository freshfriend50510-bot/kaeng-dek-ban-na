// ความสำเร็จ: เงื่อนไขอ่านจากเซฟ (S.stats นับจากการต่อสู้) ปลดแล้วเด้งแจ้งเตือน ได้เงินตามระดับ เก็บใน S.ach[id] = วันในเกม
// ไม่มีภารกิจรายวัน (เกมออฟไลน์) และ "มีอะไรใหม่" = หน้าบันทึกการอัปเดต
(function (G) {
  'use strict';
  const S = () => G.state, F = () => G.state.flags, st = (k) => (G.state.stats || {})[k] || 0;
  const dexN = () => Object.keys(G.DATA.species).filter((k) => S().dex[k] === 2).length;
  const all = () => [...S().party, ...S().storage];
  const evoTargets = () => new Set(Object.values(G.DATA.species).map((s) => (s.evo || '').split(':')[0]).filter(Boolean));
  const hasItem = (id) => (S().bag[id] || 0) > 0 || all().some((m) => m.held === id);
  // [id, ชื่อ, คำอธิบาย, ระดับ (1 ทองแดง 2 เงิน 3 ทอง), เงื่อนไข, ความคืบหน้า [ตอนนี้, เป้า] (ถ้ามี)]
  const A = [
    ['first_win', 'ชนะครั้งแรก', 'ชนะการต่อสู้ครั้งแรก', 1, () => st('wins') >= 1, () => [st('wins'), 1]],
    ['win50', 'นักสู้ทุ่งนา', 'ชนะการต่อสู้ 50 ครั้ง', 2, () => st('wins') >= 50, () => [st('wins'), 50]],
    ['win300', 'ตำนานแห่งอีสาน', 'ชนะการต่อสู้ 300 ครั้ง', 3, () => st('wins') >= 300, () => [st('wins'), 300]],
    ['recruit1', 'เพื่อนใหม่คนแรก', 'ชวนใครสักคนเข้าแก๊งสำเร็จ', 1, () => st('recruits') >= 1 || dexN() >= 2, null],
    ['dex15', 'นักสำรวจผี', 'ชวนเข้าแก๊งได้ 15 ชนิด', 2, () => dexN() >= 15, () => [dexN(), 15]],
    ['dex40', 'นักวิจัยภาคสนาม', 'ชวนเข้าแก๊งได้ 40 ชนิด', 3, () => dexN() >= 40, () => [dexN(), 40]],
    ['research10', 'ทุนวิจัยเต็มกระเป๋า', 'ศึกษาครบ ★★★ 10 ชนิดในสมุดบันทึก', 2, () => Object.keys(G.DATA.species).filter((k) => G.researchStars(k) >= 3).length >= 10, () => [Object.keys(G.DATA.species).filter((k) => G.researchStars(k) >= 3).length, 10]],
    ['shiny1', 'สีไม่เหมือนใคร', 'ชวนผีสีพิเศษ ✨ เข้าแก๊ง', 3, () => Object.keys(S().shinyDex || {}).length >= 1, null],
    ['evolve1', 'โตขึ้นอีกขั้น', 'มีสมาชิกเปลี่ยนร่างแล้ว', 1, () => { const t = evoTargets(); return all().some((m) => t.has(m.sp)); }, null],
    ['crit25', 'ตีเข้าจุด', 'ตีคริติคอลใส่ศัตรู 25 ครั้ง', 1, () => st('crits') >= 25, () => [st('crits'), 25]],
    ['super50', 'รู้จุดอ่อน', 'ใช้ท่าที่ได้ผลดีมาก 50 ครั้ง', 2, () => st('supers') >= 50, () => [st('supers'), 50]],
    ['ult1', 'เกจหมอลำเต็มหลอด', 'ใช้ท่าไม้ตายครั้งแรก', 1, () => st('ults') >= 1, null],
    ['ult20', 'หมอลำซิ่ง', 'ใช้ท่าไม้ตาย 20 ครั้ง', 2, () => st('ults') >= 20, () => [st('ults'), 20]],
    ['boss1', 'ฝนมาแล้ว', 'ปราบคางคกยักษ์ ทำให้ฝนกลับมาตก', 1, () => !!F().boss1_done, null],
    ['gym1', 'ตราผ้าโพก', 'ชนะพี่ออสซี่ที่ร้านราเมง', 1, () => !!F().gym1_done, null],
    ['gym2', 'ตราเฟือง', 'ชนะพี่เฟรนด์ที่โรงช็อป', 2, () => !!F().gym2_done, null],
    ['gym3', 'ตราหูฟัง', 'ชนะพี่บูมที่คลินิก', 2, () => !!F().gym3_done, null],
    ['clear', 'จบการเดินทาง', 'ชนะพี่ม่อนแล้วไปส่งที่สนามบิน', 3, () => !!F().game_clear, null],
    ['champ', 'แชมป์อีสาน', 'ชนะศึกแชมป์ 4 หัวหน้าติดกัน', 3, () => !!F().champ_done, null],
    ['tower20', 'หอคอยไม่มีพัก', 'ชนะหอท้าสู้ติดกัน 20 ครั้ง', 3, () => (S().towerBest || 0) >= 20, () => [S().towerBest || 0, 20]],
    ['raid3', 'ล่าผียักษ์', 'ชนะศึกผียักษ์ที่ลานผี 3 ครั้ง', 2, () => st('raids') >= 3, () => [st('raids'), 3]],
    ['legend', 'ตำนานพญาคันคาก', 'ชวนพญาคันคากเข้าแก๊ง', 3, () => S().dex.phayakhankak === 2, null],
    ['forest', 'ผู้พิทักษ์ดอนปู่ตา', 'ไล่คนตัดไม้จนป่าฟื้น', 2, () => !!F().forest_healed, null],
    ['naga', 'สายใยแม่ลูก', 'พานาคน้อยไปพบแม่นาค', 2, () => !!F().naga_done, null],
    ['sides', 'ใจดีทั้งอำเภอ', 'ทำเควสต์รองครบทุกอัน', 3, () => G.DATA.quests.filter((q) => q.kind === 'side').every((q) => G.questState(q) === 'done'), () => { const q = G.DATA.quests.filter((k) => k.kind === 'side'); return [q.filter((k) => G.questState(k) === 'done').length, q.length]; }],
    ['hidden10', 'ตาไว', 'เก็บของที่ซ่อนอยู่ได้ 10 ชิ้น', 1, () => Object.keys(F()).filter((k) => k.startsWith('hid_')).length >= 10, () => [Object.keys(F()).filter((k) => k.startsWith('hid_')).length, 10]],
    ['team6', 'แก๊งครบหก', 'มีสมาชิกในทีมครบ 6 คน', 1, () => S().party.length >= 6, null],
    ['lv50', 'โตเป็นผู้ใหญ่', 'มีสมาชิก Lv 50', 2, () => all().some((m) => m.lv >= 50), null],
    ['lv100', 'สุดทางเลเวล', 'มีสมาชิก Lv 100', 3, () => all().some((m) => m.lv >= 100), null],
    ['bestie', 'เพื่อนตาย', 'ความสนิทเต็ม ♥♥♥♥♥ กับสมาชิกคนใดคนหนึ่ง', 2, () => all().some((m) => G.hearts(m) >= 5), null],
    ['trade', 'แลกใจ', 'แลกสมาชิกกับคนในเกม', 1, () => all().some((m) => m.traded), null],
    ['rich', 'เศรษฐีบ้านนา', 'มีเงินติดตัว 20,000 บาท', 2, () => S().money >= 20000, () => [S().money, 20000]],
    ['walker', 'เดินทั่วอีสาน', 'เดินครบ 20,000 ก้าว', 2, () => (S().steps || 0) >= 20000, () => [S().steps || 0, 20000]],
    ['explorer', 'ไปมาทุกที่', 'ไปถึงทุกพื้นที่กลางแจ้ง', 2, () => { const o = Object.keys(G.DATA.world.maps).filter((k) => !G.DATA.world.maps[k].indoor); return o.every((k) => (S().visited || {})[k]); },
      () => { const o = Object.keys(G.DATA.world.maps).filter((k) => !G.DATA.world.maps[k].indoor); return [o.filter((k) => (S().visited || {})[k]).length, o.length]; }],
  ];
  const PRIZE = [0, 100, 500, 2000], TIER = ['', '🥉', '🥈', '🥇'];
  G.ACH = A;
  // นับสถิติจากการต่อสู้ (เรียกจาก battleui.js)
  G.stat = (k, n = 1) => { const s = (S().stats = S().stats || {}); s[k] = (s[k] || 0) + n; };
  let busy = false;
  G.checkAch = function () {
    if (!G.state || busy) return;
    busy = true;
    try {
      const got = (S().ach = S().ach || {});
      for (const [id, name, , tier, ok] of A) {
        if (got[id]) continue;
        let pass = false; try { pass = ok(); } catch (e) { pass = false; }
        if (!pass) continue;
        got[id] = (G.gameDay ? G.gameDay() : 0) + 1; S().money += PRIZE[tier];
        G.showToast(`${TIER[tier]} ความสำเร็จ: ${name} (+${PRIZE[tier]} บาท)`); if (G.sfx) G.sfx('level');
      }
    } finally { busy = false; }
  };
  G.ui.achCount = () => `${Object.keys(S().ach || {}).length}/${A.length}`;
  G.ui.achievements = function () {
    const got = S().ach || {};
    const rows = A.map(([id, name, desc, tier, , prog]) => {
      const on = !!got[id], p = !on && prog ? prog() : null;
      return `<div class="ach ${on ? 'on' : ''} t${tier}"><i>${on ? TIER[tier] : '🔒'}</i><div><b>${name}</b><small>${desc}${on ? ` · ได้แล้ว (วันที่ ${got[id]})` : ` · รางวัล ${PRIZE[tier]} บาท`}</small>${p ? `<div class="ach-bar"><u style="width:${Math.min(100, (p[0] / p[1]) * 100)}%"></u><span>${Math.min(p[0], p[1]).toLocaleString()}/${p[1].toLocaleString()}</span></div>` : ''}</div></div>`;
    }).join('');
    return G.ui.panel(`<div class="choice-title">🏆 ความสำเร็จ ${G.ui.achCount()}</div><div class="ach-grid">${rows}</div><div class="hint">↑ ↓ เลื่อน · Z/X ปิด</div>`, 'ach-sheet');
  };

  // ---------- มีอะไรใหม่ (บันทึกการอัปเดต) ----------
  G.PATCH = [
    ['ล่าสุด', ['ฉากหลังตอนสู้ใหม่ทุกสถานที่ เปลี่ยนตามเช้า เย็น กลางคืน และฝน', 'เมนูหลักแบบไอคอน ตั้งค่าแบ่งหมวด กระเป๋ามีความหายากและป้ายของใหม่', 'หน้าข้อมูลสมาชิกมีกราฟค่าพลังหกเหลี่ยม', 'ตัวเลขดาเมจเด้งและหลอดพลังจาง', 'ความสำเร็จ 34 อย่าง พร้อมรางวัลเงิน', 'ไอคอนไอเทมใหม่ทุกชิ้น', 'โหมดสีสำหรับคนตาบอดสี']],
    ['ระบบโปเกมอน', ['นิสัย ความสามารถติดตัว ของถือใหม่', 'เปลี่ยนร่าง ผีสีพิเศษ ชวนต่อเนื่อง ผีระบาดรายวัน', 'ท่าไม้ตาย (เกจหมอลำ) ความสนิท ไฟลวก', 'บ้านรับเลี้ยง จักรยาน ตารางธาตุ', 'หลังจบเกม: ศึกแชมป์อีสาน หอท้าสู้ พญาคันคาก ลานผียักษ์ แลกผี ครัวแม่เติ้ล']],
    ['ดอนปู่ตา', ['ป่าศักดิ์สิทธิ์เหนือหมู่บ้าน ไล่คนตัดไม้ ฟื้นป่า', 'พานาคน้อยไปหาแม่นาค']],
  ];
  G.ui.whatsNew = () => G.ui.panel(`<div class="choice-title">📰 มีอะไรใหม่</div>${G.PATCH.map(([h, l]) => `<div class="pn"><b>${h}</b><ul>${l.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}<div class="hint">Z/X ปิด</div>`, 'pn-sheet');
})(window.G = window.G || {});
