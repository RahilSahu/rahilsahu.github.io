/* Rahil Sahu — automation.html interactivity.
 * Shared patterns: theme toggle, veil, hamburger, back-to-top,
 * scroll reveal, pipe animation on view. CSP-safe: no inline JS anywhere. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle (auto -> light -> dark) */
  var THEME_KEY = 'rs.theme';
  var themeBtn = doc.getElementById('themeToggle');
  var THEMES = ['auto', 'light', 'dark'];
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeBtn) {
      var label = themeBtn.querySelector('.theme-toggle-label');
      if (label) label.textContent = t;
      themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    }
  }
  var stored = null;
  try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(stored && THEMES.indexOf(stored) >= 0 ? stored : 'auto');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') || 'auto';
      var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* Veil */
  (function veil() {
    if (reducedMotion) return;
    var lift = function () { doc.body.classList.add('is-loaded'); };
    if (doc.readyState === 'complete') { setTimeout(lift, 120); }
    else { window.addEventListener('load', function () { setTimeout(lift, 120); }); }
    setTimeout(lift, 2500);
  })();

  /* Hamburger */
  (function hamburger() {
    var btn = doc.getElementById('navToggle');
    var nav = doc.getElementById('primaryNav');
    if (!btn || !nav) return;
    function set(open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();

  /* Back to top */
  (function toTop() {
    var btn = doc.getElementById('toTop');
    if (!btn) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset || doc.documentElement.scrollTop;
      btn.classList.toggle('is-visible', y > 600);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    update();
  })();

  /* Scroll reveal with stagger */
  (function reveal() {
    var targets = doc.querySelectorAll('.pipe-card, .principles, .page-hero .wrap');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el, i) {
      el.classList.add('will-reveal');
      el.style.setProperty('--reveal-delay', ((i % 8) * 60) + 'ms');
      io.observe(el);
    });
  })();

  /* Pipe flow animation: only animate connectors while the card is in view */
  (function pipes() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-live', e.isIntersecting);
      });
    }, { threshold: 0.25 });
    doc.querySelectorAll('.pipe').forEach(function (p) { io.observe(p); });
  })();

  /* Smooth anchor scroll */
  (function smoothScroll() {
    if (reducedMotion) return;
    doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = doc.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.replaceState(null, '', id);
      });
    });
  })();

  /* Keyboard shortcuts: t theme, b top */
  (function shortcuts() {
    doc.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      var k = (e.key || '').toLowerCase();
      if (k === 't') { var tb = doc.getElementById('themeToggle'); if (tb) tb.click(); }
      else if (k === 'b') { var top = doc.getElementById('toTop'); if (top) top.click(); }
    });
  })();

  /* Footer year */
  var yr = doc.getElementById('year');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
