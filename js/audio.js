/* ELYSIUM — ambient audio (Web Audio: filtered noise + slow LFO wind/magic hum)
 * Default OFF. toggle() wired to #audio-toggle, persisted in localStorage 'elysium_audio'.
 * Vanilla JS, zero dependencies. */
(function () {
  if (!document.getElementById('audio-toggle')) return;

  var STORE_KEY = 'elysium_audio';

  var ctx = null;
  var master = null;
  var noiseNode = null;
  var noiseFilter = null;
  var humOsc = null;
  var humGain = null;
  var lfoOsc = null;
  var lfoGain = null;
  var enabled = false;

  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    master = ctx.createGain();
    master.gain.value = 0.0; // faded in on enable
    master.connect(ctx.destination);

    // --- Wind: looped noise buffer through a lowpass with slow LFO on cutoff ---
    var bufLen = ctx.sampleRate * 4;
    var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buf;
    noiseNode.loop = true;

    noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 320;
    noiseFilter.Q.value = 0.8;

    var noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.35;

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noiseNode.start();

    // Slow LFO -> filter cutoff (breathing wind)
    lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 0.07;
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfoOsc.connect(lfoGain);
    lfoGain.connect(noiseFilter.frequency);
    lfoOsc.start();

    // --- Magic hum: low sine + detuned fifth, very quiet ---
    humGain = ctx.createGain();
    humGain.gain.value = 0.06;
    humGain.connect(master);

    humOsc = ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.value = 110;
    var humOsc2 = ctx.createOscillator();
    humOsc2.type = 'sine';
    humOsc2.frequency.value = 164.81; // E3 — a fifth above A2
    humOsc.connect(humGain);
    humOsc2.connect(humGain);
    humOsc.start();
    humOsc2.start();

    // Slow amplitude LFO on the hum
    var humLfo = ctx.createOscillator();
    humLfo.type = 'sine';
    humLfo.frequency.value = 0.11;
    var humLfoGain = ctx.createGain();
    humLfoGain.gain.value = 0.03;
    humLfo.connect(humLfoGain);
    humLfoGain.connect(humGain.gain);
    humLfo.start();
  }

  function fadeTo(target, done) {
    if (!ctx) return;
    var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(target, t + 1.2);
    if (done) {
      setTimeout(done, 1300);
    }
  }

  function setButton(on) {
    var btn = document.getElementById('audio-toggle');
    if (!btn) return;
    btn.textContent = on ? '🔊' : '🔇';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function enable() {
    try {
      if (!ctx) buildGraph();
      if (ctx.state === 'suspended') ctx.resume();
      enabled = true;
      fadeTo(0.5);
      setButton(true);
      try { localStorage.setItem(STORE_KEY, '1'); } catch (e) { /* private mode */ }
    } catch (e) {
      enabled = false; // no Web Audio — stay silent
    }
  }

  function disable() {
    enabled = false;
    if (ctx) fadeTo(0.0);
    setButton(false);
    try { localStorage.setItem(STORE_KEY, '0'); } catch (e) { /* private mode */ }
  }

  function toggle() {
    if (enabled) disable();
    else enable();
  }

  window.ElyAudio = {
    toggle: toggle,
    enable: enable,
    disable: disable,
    isOn: function () { return enabled; }
  };

  // Wire the header button. Default OFF (autoplay policy + spec).
  var btn = document.getElementById('audio-toggle');
  btn.addEventListener('click', function () { window.ElyAudio.toggle(); });

  // Restore persisted preference visually, but stay silent until user toggles
  // (browsers block autoplay; honoring the flag silently would break policy).
  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved === '1') setButton(false); // remain OFF visually too until a user gesture
  } catch (e) { /* ignore */ }
})();
