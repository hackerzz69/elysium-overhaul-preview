/* ELYSIUM — simulated hiscores.
 * 10 fantasy player names, random base XP. Every 2.5s random players gain XP,
 * re-sort, re-render tbody#hiscore-body rows (rank, name, level = f(xp), xp).
 * Flash rank changes. Pauses when tab hidden. */
(function () {
  var tbody = document.getElementById('hiscore-body');
  if (!tbody) return;

  var NAMES = [
    'Aldric Stormblade',
    'Seraphina Dawn',
    'Kaelith Shadowmere',
    'Morwen Nightwhisper',
    'Thalor Ironfist',
    'Lyra Moonweaver',
    'Dain Oakenshield',
    'Zephyra Swiftwind',
    'Corvus Darkbane',
    'Elara Frostborn'
  ];

  function levelFor(xp) {
    // OSRS-style-ish curve: level 99 at 13,034,431 xp, simplified
    return Math.max(1, Math.min(99, Math.floor(Math.cbrt(xp / 13)) + 1));
  }

  var players = NAMES.map(function (n) {
    return {
      name: n,
      xp: 200000 + Math.floor(Math.random() * 9500000),
      rank: 0
    };
  });

  function fmt(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function render(first) {
    players.sort(function (a, b) { return b.xp - a.xp; });
    tbody.innerHTML = '';
    players.forEach(function (p, i) {
      var newRank = i + 1;
      var moved = !first && p.rank !== 0 && p.rank !== newRank;
      var dir = p.rank > newRank ? 'up' : (p.rank < newRank ? 'down' : '');
      p.rank = newRank;
      var tr = document.createElement('tr');
      if (moved) tr.className = 'rank-flash ' + dir;
      var tdRank = document.createElement('td');
      tdRank.textContent = newRank;
      var tdName = document.createElement('td');
      tdName.textContent = p.name;
      var tdLvl = document.createElement('td');
      tdLvl.textContent = levelFor(p.xp);
      var tdXp = document.createElement('td');
      tdXp.textContent = fmt(p.xp);
      tr.appendChild(tdRank);
      tr.appendChild(tdName);
      tr.appendChild(tdLvl);
      tr.appendChild(tdXp);
      tbody.appendChild(tr);
    });
  }

  var timer = null;
  function tick() {
    // 2–4 random players gain a chunk of XP
    var n = 2 + Math.floor(Math.random() * 3);
    var picked = [];
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * players.length);
      if (picked.indexOf(idx) === -1) {
        picked.push(idx);
        players[idx].xp += 500 + Math.floor(Math.random() * 45000);
      }
    }
    render(false);
  }

  function start() {
    if (!timer) timer = setInterval(function () {
      if (!document.hidden) tick();
    }, 2500);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  render(true);
  start();
})();
