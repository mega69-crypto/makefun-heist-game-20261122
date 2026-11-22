// audio.js — WebAudio-synthesized sound for Midnight Vault: The Heist.
// No audio files: every sound is built from oscillators and filtered noise.
export function makeAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    humNodes: null,
    lastStep: 0,
  };

  function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio.ctx;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audio.ctx = new Ctor();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.5;
      audio.master.connect(audio.ctx.destination);
    } catch (err) {
      audio.ctx = null;
    }
    return audio.ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const ctx = ensure();
    if (!ctx || audio.muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, vol, filterFreq) {
    const ctx = ensure();
    if (!ctx || audio.muted) return;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    src.start();
  }

  audio.unlock = function () {
    ensure();
  };

  audio.toggleMute = function () {
    audio.muted = !audio.muted;
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
    return audio.muted;
  };

  // Soft footstep: a short low thud, timed by the caller to the stride.
  audio.footstep = function (sneaking) {
    noiseBurst(0.07, sneaking ? 0.05 : 0.12, sneaking ? 300 : 500);
  };

  // Coin clink: two bright metallic pings.
  audio.clink = function () {
    tone(2093, 0.12, 'sine', 0.22);
    tone(2637, 0.18, 'sine', 0.16, 0.05);
  };

  // Loot pickup: a small rising chime.
  audio.pickup = function () {
    tone(523, 0.12, 'triangle', 0.22);
    tone(659, 0.12, 'triangle', 0.22, 0.07);
    tone(784, 0.22, 'triangle', 0.24, 0.14);
  };

  // Alarm sting when the meter hits 100: a harsh rising saw.
  audio.alarm = function () {
    tone(220, 0.7, 'sawtooth', 0.16, 0, 440);
    tone(233, 0.7, 'sawtooth', 0.12, 0.05, 466);
  };

  // Panel success: a soft electronic blip pair.
  audio.panelDone = function () {
    tone(880, 0.1, 'square', 0.1);
    tone(1174, 0.16, 'square', 0.1, 0.09);
  };

  // Caught: a low descending thud.
  audio.caught = function () {
    tone(180, 0.5, 'sawtooth', 0.2, 0, 60);
    noiseBurst(0.3, 0.18, 240);
  };

  // Level complete: a short warm fanfare.
  audio.levelComplete = function () {
    tone(523, 0.14, 'triangle', 0.22);
    tone(659, 0.14, 'triangle', 0.22, 0.12);
    tone(784, 0.14, 'triangle', 0.22, 0.24);
    tone(1046, 0.3, 'triangle', 0.24, 0.36);
  };

  // Start/stop the quiet ambient hum (low drone + slow swell) while playing.
  audio.startHum = function () {
    const ctx = ensure();
    if (!ctx || audio.humNodes) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    const gain = ctx.createGain();
    gain.gain.value = audio.muted ? 0 : 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start();
    lfo.start();
    audio.humNodes = { osc, lfo, gain };
  };

  audio.stopHum = function () {
    if (!audio.humNodes) return;
    try {
      audio.humNodes.osc.stop();
      audio.humNodes.lfo.stop();
    } catch (err) {
      // Already stopped; nothing to do.
    }
    audio.humNodes = null;
  };

  return audio;
}
