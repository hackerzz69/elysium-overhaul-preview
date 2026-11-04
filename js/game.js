/* ELYSIUM — "Taste of Elysium" idle clicker demo.
 * State in localStorage 'elysium_demo_v1': {wood, ore, fish, xp, level}.
 * Actions grant resource + XP; xpNeed = Math.floor(20 * level**1.5).
 * Level-up: log + flash. Auto-gather buttons created inside #auto-row
 * (if present): #auto-wood unlocks at lvl 3, #auto-ore at lvl 5,
 * 1 resource per 2s when on. Log keeps last 6. #game-reset clears. */
(function () {
  var gameEl = document.getElementById('game');
  if (!gameEl) return;

  var STORE_KEY = 'elysium_demo_v1';
  var LOG_MAX = 6;
  var AUTO_MS = 2000;

  var defaults = { wood: 0, ore: 0, fish: 0, xp: 0, level: 1 };

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return Object.assign({}, defaults);
      var s = JSON.parse(raw);
      var out = Object.assign({}, defaults);
      ['wood', 'ore', 'fish', 'xp', 'level'].forEach(function (k) {
        var v = parseInt(s[k], 10);
        out[k] = isNaN(v) || v < 0 ? defaults[k] : v;
      });
      if (out.level < 1) out.level = 1;
      return out;
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  var state = load();

  function xpNeed() {
    return Math.floor(20 * Math.pow(state.level, 1.5));
  }

  var auto = { wood: false, ore: false };

  // ---- DOM refs ----
  var elLevel = document.getElementById('game-level');
  var elXpFill = document.getElementById('xp-fill');
  var elLog = document.getElementById('game-log');
  var resNums = {
    wood: document.querySelector('#res-wood .res-num'),
    ore: document.querySelector('#res-ore .res-num'),
    fish: document.querySelector('#res-fish .res-num')
  };
  var autoRow = document.getElementById('auto-row');
  var btnAutoWood = null, btnAutoOre = null;

  function log(msg) {
    if (!elLog) return;
    var li = document.createElement('li');
    li.textContent = msg;
    elLog.insertBefore(li, elLog.firstChild);
    while (elLog.children.length > LOG_MAX) {
      elLog.removeChild(elLog.lastChild);
    }
  }

  function render() {
    if (elLevel) elLevel.textContent = 'Level ' + state.level;
    if (elXpFill) {
      var pct = Math.min(100, Math.round((state.xp / xpNeed()) * 100));
      elXpFill.style.width = pct + '%';
    }
    if (resNums.wood) resNums.wood.textContent = state.wood;
    if (resNums.ore) resNums.ore.textContent = state.ore;
    if (resNums.fish) resNums.fish.textContent = state.fish;
    renderAutoButtons();
  }

  function checkLevelUp() {
    var leveled = false;
    while (state.xp >= xpNeed()) {
      state.xp -= xpNeed();
      state.level += 1;
      leveled = true;
      log('⬆ Level up! You are now level ' + state.level + '.');
      if (state.level === 3) log('🪓 You can now hire a Lumberjack (auto-gather wood).');
      if (state.level === 5) log('⛏️ You can now hire a Miner (auto-gather ore).');
    }
    if (leveled) {
      gameEl.classList.remove('level-flash');
      void gameEl.offsetWidth; // restart CSS animation
      gameEl.classList.add('level-flash');
    }
  }

  // +1 per-click bonus per level: each click grants 1 + (level-1) resource
  function gain(res, label) {
    var amt = 1 + (state.level - 1);
    state[res] += amt;
    state.xp += 1;
    checkLevelUp();
    save();
    render();
  }

  // ---- auto-gather buttons ----
  function makeAutoButton(id, label, key) {
    var b = document.createElement('button');
    b.type = 'button';
    b.id = id;
    b.className = 'btn btn-auto';
    b.setAttribute('aria-pressed', 'false');
    b.textContent = label + ': OFF';
    b.addEventListener('click', function () {
      auto[key] = !auto[key];
      b.setAttribute('aria-pressed', auto[key] ? 'true' : 'false');
      b.textContent = label + ': ' + (auto[key] ? 'ON' : 'OFF');
      b.classList.toggle('on', auto[key]);
      log((auto[key] ? 'Hired ' : 'Dismissed ') + label.toLowerCase() + '.');
    });
    return b;
  }

  function renderAutoButtons() {
    if (!autoRow) return; // Worker A may omit the container; skip gracefully
    if (!btnAutoWood && state.level >= 3) {
      btnAutoWood = makeAutoButton('auto-wood', '🪓 Lumberjack', 'wood');
      autoRow.appendChild(btnAutoWood);
      log('🪓 Lumberjack available for hire.');
    }
    if (!btnAutoOre && state.level >= 5) {
      btnAutoOre = makeAutoButton('auto-ore', '⛏️ Miner', 'ore');
      autoRow.appendChild(btnAutoOre);
      log('⛏️ Miner available for hire.');
    }
  }

  setInterval(function () {
    if (document.hidden) return; // don't farm while the tab is hidden
    var changed = false;
    if (auto.wood) { state.wood += 1; state.xp += 1; changed = true; }
    if (auto.ore) { state.ore += 1; state.xp += 1; changed = true; }
    if (changed) {
      checkLevelUp();
      save();
      render();
    }
  }, AUTO_MS);

  // ---- wire actions ----
  var chop = document.getElementById('act-chop');
  var mine = document.getElementById('act-mine');
  var fish = document.getElementById('act-fish');
  if (chop) chop.addEventListener('click', function () { gain('wood', 'wood'); });
  if (mine) mine.addEventListener('click', function () { gain('ore', 'ore'); });
  if (fish) fish.addEventListener('click', function () { gain('fish', 'fish'); });

  var reset = document.getElementById('game-reset');
  if (reset) reset.addEventListener('click', function () {
    state = Object.assign({}, defaults);
    auto.wood = false; auto.ore = false;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    if (elLog) elLog.innerHTML = '';
    if (autoRow) autoRow.innerHTML = '';
    btnAutoWood = null; btnAutoOre = null;
    log('Progress reset. The realm forgets.');
    render();
  });

  // ---- init ----
  render();
  if (elLog && elLog.children.length === 0) {
    log('Welcome to Elysium. Chop, mine, or fish to begin.');
  }

  // expose for debugging
  window.ElyDemo = {
    state: function () { return Object.assign({}, state); },
    reset: function () { if (reset) reset.click(); }
  };
})();
