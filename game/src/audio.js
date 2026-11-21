// Hushlight sound: tiny WebAudio synth, no audio files. Everything is a short
// oscillator or filtered-noise blip made at run time. The context is created
// lazily on the first user gesture, as browsers require; until then every
// call is a no-op. Guard footsteps get quieter with distance, so your ears
// work as a second set of eyes — that is a stealth mechanic, not decoration.

var HushAudio = (function () {
  var ctx = null;
  var master = null;
  var lastStepAt = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freqFrom, freqTo, seconds, volume, type) {
    if (!ensure()) return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), t + seconds);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  // A footstep: one soft filtered tick. `nearness` is 0..1 (1 = on top of you).
  function step(nearness, pitch) {
    if (!ctx) return;
    var now = performance.now();
    if (now - lastStepAt < 45) return; // never stack ticks into a buzz
    lastStepAt = now;
    var volume = 0.015 + 0.11 * Math.max(0, Math.min(1, nearness));
    tone(pitch || 190, 120, 0.07, volume, 'triangle');
  }

  function playerStep(sneaking) {
    if (!ctx) return;
    tone(sneaking ? 150 : 210, 110, 0.05, sneaking ? 0.012 : 0.03, 'triangle');
  }

  function pickup() {
    tone(660, 660, 0.09, 0.12, 'sine');
    setTimeout(function () { tone(990, 990, 0.14, 0.12, 'sine'); }, 80);
  }

  function caught() {
    tone(320, 70, 0.5, 0.22, 'sawtooth');
  }

  function levelClear() {
    tone(523, 523, 0.1, 0.12, 'sine');
    setTimeout(function () { tone(659, 659, 0.1, 0.12, 'sine'); }, 95);
    setTimeout(function () { tone(784, 784, 0.2, 0.12, 'sine'); }, 190);
  }

  function gameWon() {
    tone(523, 523, 0.12, 0.12, 'sine');
    setTimeout(function () { tone(659, 659, 0.12, 0.12, 'sine'); }, 110);
    setTimeout(function () { tone(784, 784, 0.12, 0.12, 'sine'); }, 220);
    setTimeout(function () { tone(1046, 1046, 0.3, 0.12, 'sine'); }, 330);
  }

  return {
    unlock: ensure,
    step: step,
    playerStep: playerStep,
    pickup: pickup,
    caught: caught,
    levelClear: levelClear,
    gameWon: gameWon,
  };
})();
