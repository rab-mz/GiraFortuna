// Web Audio API sound engine - all sounds synthesized, no external files needed

let ctx = null;
let muted = false;
let bgMusicInterval = null;
let bgMusicGain = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function isMuted() {
  return muted;
}

function setMuted(val) {
  muted = val;
  if (val) stopBgMusic();
}

function toggleMute() {
  setMuted(!muted);
  return muted;
}

// --- Basic oscillator helper ---
function playTone(freq, type, duration, volume = 0.3, delay = 0) {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration + 0.05);
}

// --- Sound effects ---

function tick() {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.06);
}

function letterReveal() {
  if (muted) return;
  playTone(523, 'sine', 0.15, 0.25);
  playTone(659, 'sine', 0.15, 0.25, 0.08);
  playTone(784, 'sine', 0.2, 0.2, 0.16);
}

function winFanfare() {
  if (muted) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 'square', 0.25, 0.15, i * 0.15);
    playTone(freq * 1.5, 'sine', 0.25, 0.08, i * 0.15);
  });
  // Final chord
  playTone(1047, 'sine', 0.6, 0.2, 0.6);
  playTone(1319, 'sine', 0.6, 0.15, 0.6);
  playTone(1568, 'sine', 0.6, 0.1, 0.6);
}

function bankruptcy() {
  if (muted) return;
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    playTone(freq, 'sawtooth', 0.25, 0.15, i * 0.18);
  });
  playTone(100, 'sawtooth', 0.5, 0.12, 0.72);
}

function wrongAnswer() {
  if (muted) return;
  playTone(200, 'square', 0.3, 0.2);
  playTone(150, 'square', 0.4, 0.2, 0.15);
}

function passSound() {
  if (muted) return;
  playTone(440, 'sine', 0.15, 0.15);
  playTone(330, 'sine', 0.2, 0.15, 0.1);
}

function jollySound() {
  if (muted) return;
  const notes = [880, 1109, 1319, 1568, 1760];
  notes.forEach((freq, i) => {
    playTone(freq, 'sine', 0.2, 0.12, i * 0.08);
  });
  // Shimmer
  playTone(2093, 'sine', 0.4, 0.06, 0.4);
  playTone(2637, 'sine', 0.3, 0.04, 0.45);
}

function buttonClick() {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.06);
}

function spinStart() {
  if (muted) return;
  playTone(300, 'sine', 0.2, 0.15);
  playTone(450, 'sine', 0.2, 0.15, 0.1);
  playTone(600, 'sine', 0.15, 0.1, 0.2);
}

// --- Background music ---
// Simple repeating melodic pattern using oscillators

function startBgMusic() {
  if (muted || bgMusicInterval) return;
  const ac = getCtx();
  bgMusicGain = ac.createGain();
  bgMusicGain.gain.value = 0.04;
  bgMusicGain.connect(ac.destination);

  const melody = [
    262, 294, 330, 349, 330, 294, 262, 247,
    262, 294, 330, 392, 349, 330, 294, 262,
  ];
  let step = 0;

  bgMusicInterval = setInterval(() => {
    if (muted) {
      stopBgMusic();
      return;
    }
    const freq = melody[step % melody.length];
    const osc = ac.createOscillator();
    const noteGain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    noteGain.gain.setValueAtTime(0.04, ac.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    osc.connect(noteGain);
    noteGain.connect(bgMusicGain);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.4);
    step++;
  }, 400);
}

function stopBgMusic() {
  if (bgMusicInterval) {
    clearInterval(bgMusicInterval);
    bgMusicInterval = null;
  }
  bgMusicGain = null;
}

export const sound = {
  tick,
  letterReveal,
  winFanfare,
  bankruptcy,
  wrongAnswer,
  passSound,
  jollySound,
  buttonClick,
  spinStart,
  startBgMusic,
  stopBgMusic,
  isMuted,
  setMuted,
  toggleMute,
  getCtx,
};
