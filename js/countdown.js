/* ELYSIUM — launch countdown.
 * Ticks every 1s into #cd-days/#cd-hours/#cd-mins/#cd-secs.
 * Past date -> "LAUNCHED". Vanilla JS, zero dependencies. */
const LAUNCH_DATE = new Date('2026-12-05T18:00:00Z');
(function () {
  var elDays = document.getElementById('cd-days');
  var elHours = document.getElementById('cd-hours');
  var elMins = document.getElementById('cd-mins');
  var elSecs = document.getElementById('cd-secs');
  if (!elDays || !elHours || !elMins || !elSecs) return;

  var launched = false;
  var timer = null;

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function setNum(el, val) {
    var num = el.querySelector ? el.querySelector('.cd-num') : null;
    var text = String(val);
    if (num) num.textContent = text;
    else el.textContent = text;
  }

  function showLaunched() {
    launched = true;
    if (timer) { clearInterval(timer); timer = null; }
    var cd = document.getElementById('countdown');
    if (!cd) return;
    if (!cd.querySelector('.cd-launched')) {
      var banner = document.createElement('div');
      banner.className = 'cd-launched';
      banner.textContent = 'LAUNCHED';
      cd.appendChild(banner);
      var boxes = cd.querySelectorAll('.cd-box');
      for (var i = 0; i < boxes.length; i++) boxes[i].style.display = 'none';
    }
    var label = cd.querySelector('.cd-label, .countdown-label');
    if (label) label.textContent = 'THE REALM IS OPEN';
  }

  function tick() {
    var diff = LAUNCH_DATE.getTime() - Date.now();
    if (diff <= 0) { showLaunched(); return; }
    var totalSecs = Math.floor(diff / 1000);
    var days = Math.floor(totalSecs / 86400);
    var hours = Math.floor((totalSecs % 86400) / 3600);
    var mins = Math.floor((totalSecs % 3600) / 60);
    var secs = totalSecs % 60;
    setNum(elDays, days);
    setNum(elHours, pad(hours));
    setNum(elMins, pad(mins));
    setNum(elSecs, pad(secs));
  }

  tick();
  if (!launched) {
    timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !launched) tick(); // resync after sleep
    });
  }
})();
