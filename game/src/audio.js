// audio.js — all sound is synthesized with WebAudio. No audio files.
// One clear job: tiny bleeps and sizzles that answer every action at once.

export class KitchenAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  // Must be called from a user gesture at least once; safe to call anytime.
  ensure() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch (e) { /* sound is decoration; never break the game */ }
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  noiseBurst(dur = 0.12, vol = 0.08, filterFreq = 1800) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(filt);
      filt.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t0);
    } catch (e) { /* ignore */ }
  }

  playPickup() { this.tone(520, 0.07, 'triangle', 0.1); this.tone(780, 0.08, 'triangle', 0.08, 0.05); }
  playPutDown() { this.tone(340, 0.07, 'triangle', 0.1); this.tone(240, 0.09, 'triangle', 0.08, 0.05); }
  playChop() { this.noiseBurst(0.09, 0.16, 900); this.tone(180, 0.05, 'square', 0.05); }
  playChopped() { this.tone(660, 0.08, 'triangle', 0.1); this.tone(880, 0.12, 'triangle', 0.1, 0.07); }
  playSizzle() { this.noiseBurst(0.25, 0.07, 3200); }
  playGrillDone() { this.tone(440, 0.1, 'sine', 0.1); this.tone(660, 0.14, 'sine', 0.1, 0.09); }
  playServe() {
    this.tone(880, 0.12, 'sine', 0.12);
    this.tone(1174, 0.16, 'sine', 0.12, 0.1);
    this.tone(1568, 0.22, 'sine', 0.1, 0.2);
  }
  playCoin() { this.tone(1320, 0.07, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.06); }
  playError() { this.tone(160, 0.22, 'sawtooth', 0.09, 0, 110); }
  playTick() { this.tone(980, 0.05, 'square', 0.05); }
  playRush() {
    this.tone(392, 0.12, 'triangle', 0.12);
    this.tone(523, 0.12, 'triangle', 0.12, 0.11);
    this.tone(659, 0.2, 'triangle', 0.12, 0.22);
  }
  playGameOver() {
    [523, 392, 330, 262].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, i * 0.18));
  }
}
