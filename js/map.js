/* ELYSIUM — fantasy world map (canvas).
 * 5 regions: Elysium Citadel (hub/safe), Whisperwood (woodcutting),
 * Frostpeak (mining), Sunken Coast (fishing), Ember Wastes (combat/boss).
 * Night-parchment style, pulsing markers, drifting particles.
 * Click/tap -> fills #map-name / #map-desc / #map-stats.
 * DPR capped at 2, resize handler, pauses when tab hidden. */
(function () {
  var canvas = document.getElementById('worldmap-canvas');
  if (!canvas) return;
  var ctx = null;
  try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var REGIONS = [
    {
      id: 'citadel',
      name: 'Elysium Citadel',
      desc: 'The last shining city of the old empire, ringed in warding runes. Traders, trainers, and the Grand Exchange plaza crowd its marble streets.',
      stats: { 'Level req': '1', 'Resources': 'Bank, shops, trainers', 'Danger': 'Safe' },
      color: '#d9a94f', // gold
      pos: { x: 0.50, y: 0.46 }, r: 0.16,
      blob: [[0.44, 0.40], [0.56, 0.38], [0.60, 0.50], [0.52, 0.58], [0.43, 0.54]]
    },
    {
      id: 'whisperwood',
      name: 'Whisperwood',
      desc: 'An ancient forest of silver-barked trees that murmur when the wind passes. Lumberjacks work its edges; few who enter deep return unchanged.',
      stats: { 'Level req': '1', 'Resources': 'Oak, willow, yew logs', 'Danger': 'Low' },
      color: '#7fd88f', // green
      pos: { x: 0.22, y: 0.60 }, r: 0.20,
      blob: [[0.10, 0.52], [0.24, 0.46], [0.34, 0.60], [0.26, 0.74], [0.12, 0.72]]
    },
    {
      id: 'frostpeak',
      name: 'Frostpeak',
      desc: 'Jagged white summits where mithril and runite veins sleep beneath the permafrost. The mountain does not forgive the careless.',
      stats: { 'Level req': '20', 'Resources': 'Coal, mithril, runite ore', 'Danger': 'Medium' },
      color: '#8fd8f8', // ice blue
      pos: { x: 0.76, y: 0.28 }, r: 0.18,
      blob: [[0.66, 0.18], [0.82, 0.16], [0.90, 0.32], [0.78, 0.44], [0.66, 0.36]]
    },
    {
      id: 'sunken',
      name: 'Sunken Coast',
      desc: 'Tidal flats and drowned ruins along a moonlit shore. Anglers pull silver from the surf while the wrecks below keep their secrets.',
      stats: { 'Level req': '10', 'Resources': 'Lobster, swordfish, shark', 'Danger': 'Low' },
      color: '#5fb8d4', // sea teal
      pos: { x: 0.30, y: 0.86 }, r: 0.17,
      blob: [[0.18, 0.80], [0.34, 0.78], [0.42, 0.90], [0.30, 0.98], [0.16, 0.94]]
    },
    {
      id: 'ember',
      name: 'Ember Wastes',
      desc: 'A scorched plain of black glass and rivers of slow fire. The Ashen King stirs beneath the crater — bring a war party or do not come.',
      stats: { 'Level req': '40', 'Resources': 'Boss drops, ash, obsidian', 'Danger': 'Extreme' },
      color: '#d64545', // blood red
      pos: { x: 0.74, y: 0.70 }, r: 0.19,
      blob: [[0.62, 0.62], [0.78, 0.58], [0.88, 0.72], [0.76, 0.86], [0.62, 0.80]]
    }
  ];

  var W = 0, H = 0, DPR = 1;
  var raf = 0, running = true, lastT = 0;
  var particles = [];
  var selected = null;
  var hover = null;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    // give the canvas a sane aspect if CSS gives it none
    if (rect.height < 10) { W = canvas.parentNode ? canvas.parentNode.clientWidth || 320 : 320; H = Math.round(W * 0.62); }
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function hexToRgb(h) {
    h = h.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  // spawn drifting ambient particles
  function seedParticles() {
    particles = [];
    var n = reduceMotion ? 0 : Math.min(90, Math.floor(W * H / 12000));
    for (var i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 8, vy: -4 - Math.random() * 10,
        r: 0.8 + Math.random() * 1.8,
        tw: Math.random() * Math.PI * 2
      });
    }
  }
  seedParticles();

  function regionAt(mx, my) {
    for (var i = REGIONS.length - 1; i >= 0; i--) {
      var r = REGIONS[i];
      var dx = mx - r.pos.x * W, dy = my - r.pos.y * H;
      if (dx * dx + dy * dy <= Math.pow(r.r * W, 2)) return r;
    }
    return null;
  }

  function showRegion(r) {
    selected = r;
    var nameEl = document.getElementById('map-name');
    var descEl = document.getElementById('map-desc');
    var statsEl = document.getElementById('map-stats');
    if (nameEl) nameEl.textContent = r.name;
    if (descEl) descEl.textContent = r.desc;
    if (statsEl) {
      statsEl.innerHTML = '';
      Object.keys(r.stats).forEach(function (k) {
        var dt = document.createElement('dt');
        dt.textContent = k;
        var dd = document.createElement('dd');
        dd.textContent = r.stats[k];
        statsEl.appendChild(dt);
        statsEl.appendChild(dd);
      });
    }
    var aside = document.getElementById('map-info');
    if (aside) aside.classList.add('selected');
  }

  function evtPos(e) {
    var rect = canvas.getBoundingClientRect();
    var p = e.touches && e.touches.length ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  }

  canvas.addEventListener('click', function (e) {
    var p = evtPos(e);
    var r = regionAt(p.x, p.y);
    if (r) showRegion(r);
  });
  canvas.addEventListener('touchstart', function (e) {
    var p = evtPos(e);
    var r = regionAt(p.x, p.y);
    if (r) { e.preventDefault(); showRegion(r); }
  }, { passive: false });
  canvas.addEventListener('mousemove', function (e) {
    var p = evtPos(e);
    hover = regionAt(p.x, p.y);
    canvas.style.cursor = hover ? 'pointer' : 'default';
  });

  function drawBlob(r) {
    ctx.beginPath();
    var pts = r.blob;
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0] * W, y = pts[i][1] * H;
      if (i === 0) ctx.moveTo(x, y);
      else {
        var prev = pts[i - 1];
        var cpx = (prev[0] + pts[i][0]) / 2 * W, cpy = (prev[1] + pts[i][1]) / 2 * H;
        ctx.quadraticCurveTo(prev[0] * W, prev[1] * H, cpx, cpy);
      }
    }
    ctx.closePath();
  }

  function frame(now) {
    if (!running) { raf = 0; return; }
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    var t = now / 1000;

    // night-parchment base
    var g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#0c1420');
    g.addColorStop(1, '#04070c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // faint grid of "chart lines"
    ctx.strokeStyle = 'rgba(143,216,248,0.05)';
    ctx.lineWidth = 1;
    var step = Math.max(36, W / 16);
    ctx.beginPath();
    for (var gx = 0; gx < W; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (var gy = 0; gy < H; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();

    // regions: glowing zones
    REGIONS.forEach(function (r) {
      var pulse = reduceMotion ? 0.5 : (0.5 + 0.5 * Math.sin(t * 2 + r.pos.x * 10));
      var active = (selected === r) || (hover === r);
      drawBlob(r);
      ctx.fillStyle = rgba(r.color, active ? 0.22 : 0.10 + 0.06 * pulse);
      ctx.fill();
      ctx.strokeStyle = rgba(r.color, active ? 0.9 : 0.45 + 0.25 * pulse);
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();

      // pulsing marker
      var mx = r.pos.x * W, my = r.pos.y * H;
      var pr = (reduceMotion ? 10 : 8 + 4 * pulse);
      ctx.beginPath();
      ctx.arc(mx, my, pr, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(r.color, 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(r.color, 0.95);
      ctx.fill();

      // label
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(233,241,246,' + (active ? 0.95 : 0.65) + ')';
      ctx.fillText(r.name, mx, my + r.r * W + 16);
    });

    // drifting particles
    ctx.fillStyle = 'rgba(143,216,248,0.5)';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.tw += dt * 2;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
      var a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(p.tw));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    } else {
      running = true;
      lastT = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }
  });

  // default select the Citadel so the panel isn't empty
  showRegion(REGIONS[0]);
  lastT = performance.now();
  raf = requestAnimationFrame(frame);
})();
