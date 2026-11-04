/* Elysium — hero canvas: drifting ice particles + aurora glows.
   Vanilla, no dependencies. Guards if canvas missing. */
(function () {
  'use strict';
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx;
  try { ctx = canvas.getContext('2d'); } catch (e) { return; }
  if (!ctx) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var W = 0, H = 0, DPR = 1, running = false, raf = 0, t = 0;
  var P = [];
  var COUNT = 90;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawn(init) {
    return {
      x: Math.random() * W,
      y: init ? Math.random() * H : H + 10,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.15 + Math.random() * 0.55,
      vx: (Math.random() - 0.5) * 0.25,
      tw: Math.random() * Math.PI * 2,
      ts: 0.008 + Math.random() * 0.03,
      hue: Math.random() < 0.75 ? '143,216,248' : '217,169,79'
    };
  }

  function frame() {
    if (!running) return;
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Aurora glows — two slow-drifting radial gradients
    var g1x = W * (0.28 + 0.08 * Math.sin(t * 0.21));
    var g1 = ctx.createRadialGradient(g1x, H * 0.32, 0, g1x, H * 0.32, Math.max(W, H) * 0.45);
    g1.addColorStop(0, 'rgba(80,160,210,0.10)');
    g1.addColorStop(1, 'rgba(80,160,210,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    var g2x = W * (0.74 + 0.07 * Math.cos(t * 0.17));
    var g2 = ctx.createRadialGradient(g2x, H * 0.62, 0, g2x, H * 0.62, Math.max(W, H) * 0.4);
    g2.addColorStop(0, 'rgba(120,90,200,0.07)');
    g2.addColorStop(1, 'rgba(120,90,200,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Particles
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      p.y -= p.vy; p.x += p.vx + 0.12 * Math.sin(t * 0.8 + p.tw);
      p.tw += p.ts;
      if (p.y < -12) { P[i] = spawn(false); continue; }
      var a = 0.25 + 0.55 * Math.abs(Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.hue + ',' + a.toFixed(3) + ')';
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || !W) return;
    running = true;
    frame();
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  for (var i = 0; i < COUNT; i++) P.push(spawn(true));
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // Start once visible (hero may sit under the intro overlay)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
    }, { threshold: 0.05 });
    io.observe(canvas);
  } else {
    start();
  }
})();
