/* ELYSIUM — lore parallax.
 * On scroll, translate each .lore-bg at 0.3x via rAF (passive scroll listener). */
(function () {
  var layers = document.querySelectorAll('.lore-bg');
  if (!layers.length) return;

  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    Array.prototype.forEach.call(layers, function (el) {
      var rect = el.parentNode.getBoundingClientRect();
      // only animate while the chapter is near the viewport
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      var chapterTop = rect.top + window.pageYOffset;
      var y = (window.pageYOffset - chapterTop) * 0.3;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) request();
  });

  update();
})();
