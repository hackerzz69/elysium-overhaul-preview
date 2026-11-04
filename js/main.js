/* ELYSIUM — global UI glue.
 * Mobile nav toggle (#nav-toggle), smooth anchor scroll with nav offset,
 * IntersectionObserver adding .in to .reveal, #member-count count-up
 * (2,400 -> 2481) on view, footer year. */
(function () {
  // --- Mobile nav toggle ---
  var navToggle = document.getElementById('nav-toggle');
  var siteNav = document.getElementById('site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close the menu when a link is tapped
    siteNav.addEventListener('click', function (e) {
      if (e.target.closest('a') && siteNav.classList.contains('nav-open')) {
        siteNav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Smooth anchor scrolling with fixed-nav offset ---
  function navOffset() {
    var nav = document.getElementById('site-nav');
    return nav ? nav.getBoundingClientRect().height : 0;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - navOffset() - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });

  // --- Reveal on scroll ---
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('in'); });
    }
  }

  // --- Member count count-up: 2400 -> 2481 when in view ---
  var memberEl = document.getElementById('member-count');
  if (memberEl) {
    var START = 2400, TARGET = 2481, DURATION = 1800;
    var counted = false;
    function fmt(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function countUp() {
      if (counted) return;
      counted = true;
      var t0 = performance.now();
      function step(now) {
        var p = Math.min(1, (now - t0) / DURATION);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        var val = Math.round(START + (TARGET - START) * eased);
        memberEl.textContent = fmt(val);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { countUp(); mio.disconnect(); }
      }, { threshold: 0.4 });
      mio.observe(memberEl);
    } else {
      countUp();
    }
  }

  // --- Footer year ---
  var yearEls = document.querySelectorAll('.footer-year, [data-year]');
  Array.prototype.forEach.call(yearEls, function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
