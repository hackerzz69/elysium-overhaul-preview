/* ELYSIUM — class select.
 * 3 classes: Warrior (melee, blood red), Ranger (ranged, ice blue),
 * Mage (magic, gold). Click .class-card -> active, render into
 * #class-name / #class-desc / #class-abilities; canvas #class-canvas draws
 * an animated silhouette: dark robed figure + class-colored aura particles
 * + floating weapon glyph. rAF loop, paused offscreen. */
(function () {
  var canvas = document.getElementById('class-canvas');
  var cards = document.querySelectorAll('.class-card');
  if (!canvas || !cards.length) return;

  var CLASSES = {
    melee: {
      name: 'Warrior',
      icon: '⚔️',
      tagline: 'The blade that holds the line.',
      desc: 'Forged in the Ember Wastes and tempered in war, the Warrior is the immovable shield of Elysium. Where others fall back, the Warrior steps forward — greatsword first.',
      color: '#d64545',
      colorName: 'blood red',
      abilities: [
        'Crimson Cleave — a sweeping arc that bleeds every foe in reach.',
        'Bulwark Stance — become immovable; damage taken halved for 8 seconds.',
        'Warlord’s Roar — rally allies, raising attack speed for 20 seconds.'
      ],
      glyph: '⚔'
    },
    ranged: {
      name: 'Ranger',
      icon: '🏹',
      tagline: 'Death arrives before the sound.',
      desc: 'Silent as snowfall in the Frostpeak, the Ranger strikes from the treeline and is gone before the arrow lands. No quarry escapes; no trail goes cold.',
      color: '#8fd8f8',
      colorName: 'ice blue',
      abilities: [
        'Frostbite Volley — arrows that slow and chill the target.',
        'Eagle Eye — reveal hidden enemies and strike weak points for 12 seconds.',
        'Snare Trap — root pursuers in place while you reposition.'
      ],
      glyph: '➶'
    },
    magic: {
      name: 'Mage',
      icon: '🔮',
      tagline: 'Reality is merely a suggestion.',
      desc: 'Keeper of the Citadel’s sealed archives, the Mage bends the leylines to their will. Fire, storm, and time itself answer when a Mage calls.',
      color: '#d9a94f',
      colorName: 'gold',
      abilities: [
        'Solar Flare — call down a searing pillar of light.',
        'Arcane Aegis — a shimmering ward that absorbs the next heavy blow.',
        'Time Dilation — slow the world around you for 6 seconds.'
      ],
      glyph: '✦'
    }
  };

  var nameEl = document.getElementById('class-name');
  var descEl = document.getElementById('class-desc');
  var abilEl = document.getElementById('class-abilities');

  var ctx = null;
  try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }

  var active = 'melee';
  var W = 0, H = 0, DPR = 1;
  var raf = 0, running = true, visible = true;
  var aura = [];
  var glyphBob = 0;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height || W * 0.9));
    if (rect.height < 10) H = Math.round(W * 0.9);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.height = H + 'px';
    if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function hexRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgba(h, a) {
    var c = hexRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function seedAura() {
    aura = [];
    var n = reduceMotion ? 0 : 46;
    for (var i = 0; i < n; i++) {
      aura.push({
        ang: Math.random() * Math.PI * 2,
        rad: 30 + Math.random() * 70,
        speed: (0.2 + Math.random() * 0.6) * (Math.random() < 0.5 ? 1 : -1),
        r: 1 + Math.random() * 2.4,
        tw: Math.random() * Math.PI * 2
      });
    }
  }
  seedAura();

  function select(id) {
    if (!CLASSES[id]) return;
    active = id;
    var c = CLASSES[id];
    Array.prototype.forEach.call(cards, function (card) {
      card.classList.toggle('active', card.getAttribute('data-class') === id);
    });
    if (nameEl) nameEl.textContent = c.icon + ' ' + c.name;
    if (descEl) {
      descEl.innerHTML = '';
      var tag = document.createElement('p');
      tag.className = 'class-tagline';
      tag.textContent = c.tagline;
      var p = document.createElement('p');
      p.textContent = c.desc;
      descEl.appendChild(tag);
      descEl.appendChild(p);
    }
    if (abilEl) {
      abilEl.innerHTML = '';
      c.abilities.forEach(function (a) {
        var li = document.createElement('li');
        li.textContent = a;
        abilEl.appendChild(li);
      });
    }
    seedAura();
  }

  Array.prototype.forEach.call(cards, function (card) {
    card.addEventListener('click', function () {
      select(card.getAttribute('data-class'));
    });
  });

  // --- silhouette drawing: hooded robed figure ---
  function drawFigure(cx, baseY, s, color, t) {
    var sway = reduceMotion ? 0 : Math.sin(t * 1.4) * 3;
    ctx.save();
    ctx.translate(cx + sway, baseY);
    ctx.scale(s, s);
    ctx.fillStyle = '#0a0f16';
    ctx.strokeStyle = rgba(color, 0.55);
    ctx.lineWidth = 1.5;

    // robe (tapered cloak)
    ctx.beginPath();
    ctx.moveTo(-34, 40);      // hem left
    ctx.quadraticCurveTo(-26, -20, -14, -52); // left shoulder
    ctx.quadraticCurveTo(0, -64, 14, -52);    // hood crown
    ctx.quadraticCurveTo(26, -20, 34, 40);    // hem right
    ctx.quadraticCurveTo(0, 52, -34, 40);     // hem
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // hood opening (dark face)
    ctx.beginPath();
    ctx.ellipse(0, -38, 10, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#02040a';
    ctx.fill();

    // glowing eyes
    ctx.fillStyle = rgba(color, 0.95);
    ctx.beginPath(); ctx.arc(-4, -40, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -40, 1.8, 0, Math.PI * 2); ctx.fill();

    // arms folded across chest
    ctx.strokeStyle = '#0a0f16';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, -12); ctx.quadraticCurveTo(0, -4, 18, -16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, -10); ctx.quadraticCurveTo(2, 2, -16, -2);
    ctx.stroke();

    // trim glow along hem
    ctx.strokeStyle = rgba(color, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-30, 36); ctx.quadraticCurveTo(0, 47, 30, 36);
    ctx.stroke();

    ctx.restore();
  }

  function frame(now) {
    if (!running || !visible) { raf = 0; return; }
    var t = now / 1000;
    var dt = 1 / 60;

    ctx.clearRect(0, 0, W, H);
    var c = CLASSES[active];

    // vignette backdrop
    var g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, rgba(c.color, 0.10));
    g.addColorStop(1, 'rgba(4,7,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, baseY = H * 0.72;
    var s = Math.min(W, H) / 170;

    // aura particles orbiting
    aura.forEach(function (p) {
      if (!reduceMotion) { p.ang += p.speed * dt; p.tw += dt * 3; }
      var px = cx + Math.cos(p.ang) * p.rad * s;
      var py = baseY - 30 * s + Math.sin(p.ang) * p.rad * 0.7 * s;
      var a = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(p.tw));
      ctx.fillStyle = rgba(c.color, a);
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground glow ring
    ctx.strokeStyle = rgba(c.color, 0.4);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 4, 46 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawFigure(cx, baseY, s, c.color, t);

    // floating weapon glyph above
    glyphBob = reduceMotion ? 0 : Math.sin(t * 2) * 6;
    var gy = baseY - 120 * s + glyphBob;
    ctx.font = '700 ' + Math.round(34 * s) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = rgba(c.color, 0.9);
    ctx.shadowBlur = 16;
    ctx.fillStyle = rgba(c.color, 0.95);
    ctx.fillText(c.glyph, cx + 52 * s, gy);
    ctx.shadowBlur = 0;

    raf = requestAnimationFrame(frame);
  }

  function loop() {
    if (!raf && running && visible && ctx) raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    loop();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      loop();
    }, { threshold: 0.05 }).observe(canvas);
  }

  select('melee');
  loop();
})();
