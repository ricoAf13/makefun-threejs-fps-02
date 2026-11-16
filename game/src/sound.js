// Vanguard Protocol - Procedural Web Audio API Sound Synthesizer
// Zero external audio files required: generates dynamic tactical soundscapes in real-time

let ctx = null;

function getAudioContext() {
  if (!ctx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export const SoundEngine = {
  playGunshot(type = 'rifle') {
    const ac = getAudioContext();
    if (!ac) return;

    const now = ac.currentTime;
    const dur = type === 'sniper' ? 0.35 : type === 'smg' ? 0.12 : 0.22;

    // Noise burst
    const bufferSize = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = ac.createBufferSource();
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'sniper' ? 800 : 2200, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + dur);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Punch oscillator
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(type === 'sniper' ? 180 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + dur * 0.5);

    const oscGain = ac.createGain();
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    osc.connect(oscGain);
    oscGain.connect(ac.destination);

    noise.start(now);
    osc.start(now);
    noise.stop(now + dur);
    osc.stop(now + dur);
  },

  playHitmarker(headshot = false) {
    const ac = getAudioContext();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(headshot ? 2400 : 1600, now);
    osc.frequency.exponentialRampToValueAtTime(headshot ? 3200 : 1200, now + 0.08);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(headshot ? 0.35 : 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  },

  playReload() {
    const ac = getAudioContext();
    if (!ac) return;
    const now = ac.currentTime;

    // Two mechanical latch clicks
    [0, 0.4, 0.9].forEach((delay, idx) => {
      const osc = ac.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600 + idx * 150, now + delay);
      osc.frequency.exponentialRampToValueAtTime(200, now + delay + 0.04);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.2, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.05);
    });
  },

  playBuy() {
    const ac = getAudioContext();
    if (!ac) return;
    const now = ac.currentTime;

    [440, 660, 880].forEach((freq, idx) => {
      const osc = ac.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.18, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.08);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.09);
    });
  },

  playRoundStart() {
    const ac = getAudioContext();
    if (!ac) return;
    const now = ac.currentTime;

    [220, 277.18, 329.63].forEach((f) => {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const filter = ac.createBiquadFilter();
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.5);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    });
  },

  playBombBeep(urgent = false) {
    const ac = getAudioContext();
    if (!ac) return;
    const now = ac.currentTime;

    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 1500 : 1000, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
};
