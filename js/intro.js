/* ELYSIUM — intro cinematic.
 * Rune circle draws (arc progress) -> "ELYSIUM" letters materialize with
 * particle bursts -> zoom-fade dive. Total <= 6s. #intro-skip ends it.
 * sessionStorage 'elysium_intro_seen' skips on later visits. Canvas failure
 * skips instantly. On done: body.classList.add('intro-done'). */
(function () {
  var introEl = document.getElementById('intro');
  var canvas = document.getElementById('intro-canvas');
  if (!introEl || !canvas) return;

  // Session skip: already seen -> hide immediately, no animation.
  try {
    if (sessionStorage.getItem('elysium_intro_seen') === '1') {
      finish(true);
      return;
    }
  } catch (e) { /* ignore */ }

  var ctx = null;
  try {
    ctx = canvas.getContext('2d');
  } catch (e) { ctx = null; }
  if (!ctx) { finish(true); return; }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Layout / timing ---
  var W = 0, H = 0, DPR = 1;
  var T_DRAW = reduceMotion ? 0 : 1400;   // rune circle draw
  var T_LETTER = reduceMotion ? 0 : 320;  // per letter
  var T_DIVE = reduceMotion ? 0 : 1200;   // zoom-fade
  var LETTERS = 'ELYSIUM'.split('');
  var total = T_DRAW + LETTERS.length * T_LETTER + T_DIVE + 500;
  if (total > 6000) { /* clamp */ total = 6000; }
  var start = performance.now();
  var finished = false;
  var raf = 0;
  var particles = [];
  var burstPerLetter = 26;

  var skipBtn = document.getElementById('intro-skip');
  if (skipBtn) skipBtn.addEventListener('click', function () { finish(false); });

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function spawnBurst(x, y, color) {
    for (var i = 0; i < burstPerLetter; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 40 + Math.random() * 160;
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 0.5 + Math.random() * 0.7,
        r: 1 + Math.random() * 2.5,
        color: color
      });
    }
  }

  function finish(instant) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    try { sessionStorage.setItem('elysium_intro_seen', '1'); } catch (e) { /* ignore */ }
    document.body.classList.add('intro-done');
    if (instant && introEl.parentNode) {
      // leave hiding to CSS (body.intro-done #intro { display:none })
    }
  }

  function drawCircle(t) {
    var cx = W / 2, cy = H / 2;
    var R = Math.min(W, H) * 0.32;
    var p = Math.min(1, t / Math.max(T_DRAW, 1));
    // outer ring
    ctx.strokeStyle = 'rgba(143,216,248,' + (0.25 + 0.55 * p) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    // inner ring (counter-rotating rune marks)
    ctx.strokeStyle = 'rgba(217,169,79,' + (0.2 + 0.4 * p) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.78, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
    // rune ticks around the outer ring
    if (p > 0.05) {
      ctx.fillStyle = 'rgba(143,216,248,0.7)';
      var n = 24, drawn = Math.floor(n * p);
      for (var i = 0; i < drawn; i++) {
        var a = (i / n) * Math.PI * 2 - Math.PI / 2;
        var x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        ctx.fillRect(-1, -6, 2, 12);
        ctx.restore();
      }
    }
  }

  function letterPositions() {
    ctx.font = '900 ' + Math.round(Math.min(W, H) * 0.09) + 'px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var cx = W / 2, cy = H / 2;
    var widths = LETTERS.map(function (ch) { return ctx.measureText(ch).width; });
    var gap = 8;
    var totalW = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (LETTERS.length - 1);
    var x = cx - totalW / 2;
    return widths.map(function (w) {
      var px = x + w / 2;
      x += w + gap;
      return { x: px, y: cy };
    });
  }

  function frame(now) {
    if (finished) return;
    var t = now - start;
    if (t >= total) { finish(false); return; }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, 0, W, H);

    // Dive phase transform: scale + fade
    var diveStart = T_DRAW + LETTERS.length * T_LETTER;
    var dp = t > diveStart ? Math.min(1, (t - diveStart) / Math.max(T_DIVE, 1)) : 0;
    var scale = 1 + dp * 2.2;
    var alpha = 1 - dp;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    ctx.globalAlpha = alpha;

    drawCircle(Math.min(t, T_DRAW));

    // letters
    var pos = letterPositions();
    for (var i = 0; i < LETTERS.length; i++) {
      var lt = T_DRAW + i * T_LETTER;
      var lp = (t - lt) / Math.max(T_LETTER, 1);
      if (lp <= 0) continue;
      var lpC = Math.min(1, lp);
      var la = Math.min(1, lpC * 2.5);
      var rise = (1 - Math.min(1, lpC * 2)) * 18;
      ctx.fillStyle = 'rgba(233,241,246,' + la + ')';
      ctx.shadowColor = 'rgba(143,216,248,0.8)';
      ctx.shadowBlur = 18 * la;
      ctx.fillText(LETTERS[i], pos[i].x, pos[i].y - rise);
      ctx.shadowBlur = 0;
      // burst at the moment the letter pops in
      if (!pos[i].burst && lpC >= 1) {
        pos[i].burst = true;
        spawnBurst(pos[i].x, pos[i].y, '143,216,248');
      }
    }

    // particles
    var dt = 1 / 60;
    for (var j = particles.length - 1; j >= 0; j--) {
      var pt = particles[j];
      pt.life += dt;
      if (pt.life >= pt.max) { particles.splice(j, 1); continue; }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.98; pt.vy *= 0.98;
      var pa = 1 - pt.life / pt.max;
      ctx.fillStyle = 'rgba(' + pt.color + ',' + pa.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !finished && !raf) {
      start = performance.now(); // restart cleanly rather than jump
      raf = requestAnimationFrame(frame);
    }
  });

  if (reduceMotion) { finish(true); return; }
  raf = requestAnimationFrame(frame);
})();
