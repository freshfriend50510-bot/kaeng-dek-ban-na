// เสียงทั้งหมดสร้างด้วย Web Audio ไม่ต้องมีไฟล์เสียง (เพลงสเกลเพนทาโทนิกแบบลายแคน)
(function (G) {
  'use strict';
  let ac = null, master = null, seqTimer = null, current = null;
  const ensure = () => {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); master = ac.createGain(); master.gain.value = 0.18; master.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };
  const note = (freq, t, dur, type = 'square', vol = 0.5) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const SFX = {
    tick: [[84, 0, 0.04, 'square', 0.25]], bump: [[40, 0, 0.08, 'triangle', 0.6]],
    attack: [[60, 0, 0.06, 'sawtooth', 0.4], [52, 0.05, 0.08, 'sawtooth', 0.4]],
    hit: [[45, 0, 0.1, 'square', 0.5]], super: [[50, 0, 0.08, 'square', 0.5], [62, 0.07, 0.12, 'square', 0.5]],
    status: [[72, 0, 0.08, 'triangle', 0.4], [79, 0.08, 0.1, 'triangle', 0.4]],
    faint: [[67, 0, 0.12, 'triangle', 0.5], [60, 0.12, 0.12, 'triangle', 0.5], [52, 0.24, 0.3, 'triangle', 0.5]],
    send: [[72, 0, 0.06, 'square', 0.3], [79, 0.06, 0.08, 'square', 0.3]],
    heal: [[72, 0, 0.1, 'triangle', 0.4], [76, 0.1, 0.1, 'triangle', 0.4], [79, 0.2, 0.1, 'triangle', 0.4], [84, 0.3, 0.25, 'triangle', 0.4]],
    level: [[72, 0, 0.08, 'square', 0.35], [76, 0.08, 0.08, 'square', 0.35], [79, 0.16, 0.08, 'square', 0.35], [84, 0.24, 0.3, 'square', 0.35]],
    buy: [[84, 0, 0.06, 'square', 0.3], [91, 0.06, 0.12, 'square', 0.3]],
    wobble: [[60, 0, 0.1, 'triangle', 0.4], [60, 0.4, 0.1, 'triangle', 0.4], [60, 0.8, 0.1, 'triangle', 0.4]],
    alert: [[88, 0, 0.08, 'square', 0.35], [88, 0.1, 0.08, 'square', 0.35]],
    door: [[55, 0, 0.05, 'triangle', 0.5], [62, 0.05, 0.08, 'triangle', 0.4]],
    slide: [[76, 0, 0.12, 'sine', 0.35], [70, 0.1, 0.16, 'sine', 0.3]],
    switch: [[48, 0, 0.04, 'square', 0.5], [84, 0.04, 0.05, 'square', 0.3]],
    power: [[60, 0, 0.1, 'sawtooth', 0.3], [67, 0.1, 0.1, 'sawtooth', 0.3], [72, 0.2, 0.1, 'sawtooth', 0.3], [79, 0.3, 0.3, 'square', 0.35]],
    rocket: [[48, 0, 0.3, 'sawtooth', 0.25], [55, 0.25, 0.3, 'sawtooth', 0.25], [62, 0.5, 0.3, 'sawtooth', 0.25], [74, 0.75, 0.5, 'square', 0.3], [86, 1.2, 0.4, 'triangle', 0.4]],
  };
  G.sfx = function (id) {
    if (!G.settings.sound || !ensure() || !SFX[id]) return;
    const t = ac.currentTime;
    for (const [n, d, dur, type, v] of SFX[id]) note(hz(n), t + d, dur, type, v);
  };

  // เพลง: [โน้ตทำนอง (0 = เงียบ)], ความเร็ว, เสียงเบสโดรนแบบแคน
  const P = [0, 2, 4, 7, 9, 12, 14, 16];
  // ทำนอง: ตัวเลข = ตำแหน่งในสเกล, -1 = เงียบ; เพลงยาว 2 ท่อน (A/B) แล้วพักก่อนวนใหม่
  const A = (...x) => x;
  const SONGS = {
    village: { bpm: 100, root: 62, drone: [50, 57], gap: 24, mel: A(
      4, -1, 4, 3, 2, -1, 1, 2, 0, -1, -1, -1, 2, 3, 4, -1, 5, -1, 4, 3, 2, 3, 2, 1, 0, -1, -1, -1, -1, -1, -1, -1,
      2, -1, 2, 3, 4, -1, 3, 2, 1, -1, 0, 1, 2, -1, -1, -1, 4, 5, 6, -1, 5, 4, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1,
      5, -1, 5, 6, 7, -1, 6, 5, 4, -1, -1, -1, 3, 4, 5, -1, 4, 3, 2, -1, 3, -1, 2, 1, 2, -1, -1, -1, -1, -1, -1, -1,
      4, -1, 3, 2, 1, -1, 2, 3, 4, -1, 2, -1, 1, -1, 0, -1, 1, 2, 1, 0, -1, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1) },
    field: { bpm: 92, root: 57, drone: [45, 52], gap: 32, mel: A(
      0, -1, 2, 3, 4, -1, -1, -1, 3, 2, 3, -1, 1, -1, -1, -1, 4, -1, 5, 6, 5, -1, 4, -1, 3, -1, 2, -1, -1, -1, -1, -1,
      2, 3, 4, -1, 2, -1, 1, -1, 0, -1, 1, 2, 1, -1, -1, -1, 0, -1, -1, -1, 2, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1,
      5, -1, 6, 7, 6, -1, 5, -1, 4, -1, 5, -1, 3, -1, -1, -1, 2, 3, 4, -1, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1, -1, -1) },
    battle: { bpm: 150, root: 57, drone: [45, 52], gap: 0, mel: A(
      0, 0, 4, 0, 3, 0, 4, 5, 0, 0, 4, 0, 6, 5, 4, 3, 0, 0, 4, 0, 3, 0, 4, 5, 7, 6, 5, 4, 3, 2, 1, 0,
      2, -1, 2, 3, 4, -1, 4, 5, 6, -1, 5, 4, 3, -1, 2, -1, 4, -1, 4, 5, 6, -1, 7, 6, 5, 4, 3, 2, 1, -1, 0, -1) },
    campus: { bpm: 116, root: 60, drone: [48, 55], gap: 16, mel: A(
      0, -1, 2, 4, 5, -1, 4, 2, 4, -1, -1, -1, 2, 4, 5, 7, 5, -1, 4, -1, 2, -1, 4, 5, 4, -1, -1, -1, -1, -1, -1, -1,
      5, -1, 5, 6, 7, -1, 6, 5, 4, -1, 2, -1, 4, -1, -1, -1, 2, 2, 4, -1, 5, -1, 4, 2, 1, -1, 2, -1, 0, -1, -1, -1,
      7, -1, 6, 5, 6, -1, 5, 4, 5, -1, 4, 2, 4, -1, -1, -1, 2, 4, 5, -1, 4, 2, 1, -1, 2, -1, 1, -1, 0, -1, -1, -1) },
    // ด่าน 3: ริมพอง (ช้า ลอยๆ ลายสายน้ำ), ตัวอำเภอ (สบายๆ ลายพิณ), โรงพยาบาล (นุ่ม ช้า มีจังหวะติ๊งเรียกคิว)
    river: { bpm: 84, root: 57, drone: [45, 52], gap: 24, mel: A(
      2, -1, 3, 4, -1, -1, 4, -1, 5, 4, 3, -1, 2, -1, -1, -1, 0, -1, 1, 2, -1, -1, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1,
      4, -1, 5, 6, -1, -1, 5, -1, 4, -1, 3, -1, 4, -1, -1, -1, 2, -1, 3, 4, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1, -1, -1) },
    town: { bpm: 112, root: 62, drone: [50, 57], gap: 16, mel: A(
      0, 2, 4, -1, 4, 2, 4, 5, 4, -1, 2, -1, 0, -1, -1, -1, 2, 4, 5, -1, 5, 4, 5, 7, 5, -1, 4, -1, 2, -1, -1, -1,
      7, -1, 5, 4, 5, -1, 4, 2, 4, -1, 2, 0, 2, -1, -1, -1, 0, 2, 4, -1, 2, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1) },
    // ด่านสุดท้าย: เมืองขอนแก่น (ป๊อปเมืองกลางคืน), สนามอีสปอร์ต (เร้าใจ จังหวะอีดีเอ็ม)
    city: { bpm: 120, root: 60, drone: [48, 55], gap: 8, mel: A(
      4, -1, 4, 5, 7, -1, 5, 4, 2, -1, 4, -1, 5, -1, -1, -1, 4, -1, 4, 5, 7, -1, 9 - 2, 6, 5, -1, 4, -1, 2, -1, -1, -1,
      0, -1, 2, 4, 5, -1, 4, 2, 4, -1, 5, 6, 7, -1, -1, -1, 6, 5, 4, -1, 5, 4, 2, -1, 1, -1, 2, -1, 0, -1, -1, -1) },
    arena: { bpm: 136, root: 57, drone: [45, 52], gap: 0, mel: A(
      0, -1, 0, 3, -1, 4, -1, 3, 0, -1, 0, 3, -1, 5, 4, -1, 0, -1, 0, 3, -1, 4, -1, 5, 7, -1, 6, -1, 5, -1, 4, -1,
      3, -1, 3, 4, -1, 5, -1, 4, 3, -1, 2, 1, -1, 2, 3, -1, 4, 4, 5, -1, 6, 6, 7, -1, 7, -1, -1, -1, 0, -1, -1, -1) },
    hospital: { bpm: 76, root: 67, drone: [55], gap: 32, mel: A(
      7, -1, -1, 4, -1, -1, -1, -1, 5, -1, 4, -1, 2, -1, -1, -1, 4, -1, -1, 2, -1, -1, -1, -1, 3, -1, 2, -1, 0, -1, -1, -1,
      2, -1, 4, -1, 5, -1, 7, -1, 6, -1, 5, -1, 4, -1, -1, -1, 5, -1, 4, -1, 2, -1, 1, -1, 0, -1, -1, -1, -1, -1, -1, -1) },
    boss: { bpm: 158, root: 55, drone: [43, 50], gap: 0, mel: A(
      0, 3, 0, 4, 0, 5, 4, 3, 0, 3, 0, 4, 6, 5, 4, 3, 7, 6, 5, 4, 5, 4, 3, 2, 3, 2, 1, 0, 1, 2, 3, 4,
      7, -1, 7, 6, 5, -1, 4, 5, 6, -1, 5, 4, 3, -1, 4, 3, 2, -1, 3, 2, 1, -1, 2, 1, 0, -1, 0, -1, -1, -1) },
  };
  G.music = function (id) {
    if (current === id) return;
    current = id;
    clearInterval(seqTimer);
    if (!G.settings.sound || G.settings.music === false || !id || !ensure()) return;
    const s = SONGS[id]; if (!s) return;
    const step = 60 / s.bpm / 2;
    let i = 0, nextT = ac.currentTime + 0.05;
    seqTimer = setInterval(() => {
      if (!G.settings.sound || G.settings.music === false) { clearInterval(seqTimer); return; }
      while (nextT < ac.currentTime + 0.25) {
        const len = s.mel.length + s.gap, k = i % len, playing = k < s.mel.length;
        if (playing) {
          const m = s.mel[k];
          if (m >= 0) note(hz(s.root + P[m]), nextT, step * 1.6, 'square', 0.13);
          if (k % 8 === 0) for (const d of s.drone) note(hz(d), nextT, step * 8, 'sawtooth', 0.045);
          if (k % 2 === 0) note(hz(s.root - 24 + (k % 4 === 0 ? 0 : 7)), nextT, step * 0.8, 'triangle', 0.16);
        }
        i++; nextT += step;
      }
    }, 60);
  };
  let unlocked = false;
  // เบราว์เซอร์ยอมให้เล่นเสียงหลังผู้เล่นกดปุ่มครั้งแรก เรียกครั้งเดียวพอ (เดิมเรียกทุกครั้งที่กด เพลงเลยเริ่มใหม่ตลอด)
  G.unlockAudio = () => { if (unlocked) return; unlocked = true; ensure(); const c = current; current = null; G.music(c); };
  G.restartMusic = () => { const c = current; current = null; G.music(c); };

  // ---------- เสียงบรรยากาศ: จิ้งหรีด กบ นก ลมทุ่ง ฝน (สุ่มตามแผนที่ ช่วงเวลา และฝน) ----------
  let noiseBuf = null, rainSrc = null, rainGain = null;
  const noise = () => {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = ac.createBufferSource(); src.buffer = noiseBuf; return src;
  };
  const sweep = (f0, f1, t, dur, type, vol) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  };
  const AMB = {
    cricket: (t) => { for (let i = 0; i < 3; i++) sweep(4300, 4100, t + i * 0.07, 0.045, 'sine', 0.05); },
    frog: (t) => { const f = 95 + Math.random() * 40; for (let i = 0; i < 2; i++) sweep(f * 1.4, f, t + i * 0.16, 0.12, 'square', 0.06); },
    bird: (t) => { const f = 1800 + Math.random() * 900; sweep(f, f * 1.5, t, 0.09, 'sine', 0.05); sweep(f * 1.2, f * 0.9, t + 0.13, 0.08, 'sine', 0.04); },
    wind: (t) => {
      const src = noise(), fl = ac.createBiquadFilter(), g = ac.createGain();
      fl.type = 'bandpass'; fl.frequency.setValueAtTime(380, t); fl.frequency.linearRampToValueAtTime(700, t + 1.2); fl.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.9); g.gain.linearRampToValueAtTime(0.0001, t + 2.4);
      src.connect(fl); fl.connect(g); g.connect(master); src.start(t); src.stop(t + 2.5);
    },
  };
  const setRain = (on) => {
    if (on && !rainSrc) {
      rainSrc = noise(); rainSrc.loop = true;
      const fl = ac.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 1400;
      rainGain = ac.createGain(); rainGain.gain.setValueAtTime(0.0001, ac.currentTime); rainGain.gain.linearRampToValueAtTime(0.07, ac.currentTime + 1.5);
      rainSrc.connect(fl); fl.connect(rainGain); rainGain.connect(master); rainSrc.start();
    } else if (!on && rainSrc) {
      const s = rainSrc; rainGain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 1); setTimeout(() => s.stop(), 1100); rainSrc = null;
    }
  };
  setInterval(() => {
    if (!unlocked || !ac) return;
    const S = G.state, W = G.world;
    const on = G.settings.sound && G.settings.ambient !== false && S && W && W.def && !W.def.indoor && (G.scene === 'world' || G.scene === 'battle');
    setRain(!!(on && G.raining()));
    if (!on || G.scene !== 'world') return;
    const p = G.period(), t = ac.currentTime, wet = G.raining(), rural = W.map !== 'kku', r = Math.random();
    if (p === 'night' && !wet && r < 0.22) AMB.cricket(t);
    else if ((p === 'night' || wet) && rural && r < 0.3) AMB.frog(t);
    else if (p === 'morning' && !wet && r < 0.06) AMB.bird(t);
    else if (W.map === 'field' && (p === 'day' || p === 'evening') && r < 0.012) AMB.wind(t);
  }, 300);
})(window.G = window.G || {});
