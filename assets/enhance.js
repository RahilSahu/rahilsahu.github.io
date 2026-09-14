/* =============================================================
   Rahil Sahu — enhance.js
   ADDITIVE LAYER. Does not modify or depend on main.js.
   Load it in <head> WITHOUT defer, so the boot class lands before
   first paint and the page never flashes ahead of the cover.

   With JS disabled, nothing here runs and the site is untouched.
   ============================================================= */

(function () {
  'use strict';

  /* ---------------- Config ---------------- */

  var CONFIG = {
    /* true = cover appears once per browser tab session.
       false = every load. */
    showOncePerSession: false,

    /* Auto-open after N ms without input. 0 disables. */
    autoOpenAfterMs: 0,

    /* Cover copy */
    reference: 'RS-APPSEC-2026-09',
    issued: 'September 2026',
    distribution: [
      'Hiring lead / engineering manager',
      'Head of security or CISO',
      'Procurement and vendor risk',
      'Anyone verifying scope before an engagement'
    ]
  };

  var root = document.documentElement;
  if (root.classList.contains('enh-on')) return;   /* never double-run */

  var mqReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = !!(mqReduce && mqReduce.matches);

  var supportsGlass = !!(window.CSS && CSS.supports && (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  ));

  var supportsWarp = !!(window.CSS && CSS.supports &&
    CSS.supports('backdrop-filter', 'url(#x)'));

  var seen = false;
  try {
    seen = CONFIG.showOncePerSession &&
      window.sessionStorage.getItem('enh-cover') === '1';
  } catch (e) { /* storage blocked — just show it */ }

  /* Boot class must land now, in <head>, ahead of first paint. */
  root.classList.add('enh-on');
  if (supportsWarp) root.classList.add('enh-warp');
  if (!seen) root.classList.add('enh-boot', 'enh-locked');

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* =============================================================
     1 · Ambient graphics
     ============================================================= */

  function buildAmbient() {
    var amb = el('div', 'enh-ambient');
    amb.setAttribute('aria-hidden', 'true');
    amb.appendChild(el('div', 'enh-grid'));
    amb.appendChild(el('div', 'enh-orb enh-orb-1'));
    amb.appendChild(el('div', 'enh-orb enh-orb-2'));
    amb.appendChild(el('div', 'enh-orb enh-orb-3'));
    document.body.appendChild(amb);

    var grain = el('div', 'enh-grain');
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);

    /* Grid drifts against the scroll — cheap depth, one property. */
    if (!reduced) {
      var grid = amb.querySelector('.enh-grid');
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          grid.style.translate = '0 ' + (window.scrollY * -0.04).toFixed(1) + 'px';
          ticking = false;
        });
      }, { passive: true });
    }
    return amb;
  }

  /* SVG filter used by backdrop-filter for real edge refraction. */
  function buildSvgDefs() {
    if (!supportsWarp) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'enh-svgdefs');
    svg.setAttribute('aria-hidden', 'true');

    var filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', 'enh-refract');
    filter.setAttribute('x', '-12%');
    filter.setAttribute('y', '-12%');
    filter.setAttribute('width', '124%');
    filter.setAttribute('height', '124%');

    var turb = document.createElementNS(ns, 'feTurbulence');
    turb.setAttribute('type', 'fractalNoise');
    turb.setAttribute('baseFrequency', '0.008 0.013');
    turb.setAttribute('numOctaves', '2');
    turb.setAttribute('seed', '7');
    turb.setAttribute('result', 'noise');

    var disp = document.createElementNS(ns, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'noise');
    disp.setAttribute('scale', '9');
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'G');

    filter.appendChild(turb);
    filter.appendChild(disp);
    svg.appendChild(filter);
    document.body.appendChild(svg);
  }

  /* =============================================================
     2 · Book cover with a page turn
     ============================================================= */

  function buildBook() {
    var book = el('div', 'enh-book enh-keep');
    book.id = 'enhBook';
    book.setAttribute('role', 'dialog');
    book.setAttribute('aria-modal', 'true');
    book.setAttribute('aria-label', 'Report cover — open to read the site');

    var skip = el('button', 'enh-skip', 'Skip');
    skip.type = 'button';

    var stage = el('div', 'enh-stage');
    var body = el('div', 'enh-body');

    /* --- page block behind the leaves --- */
    var block = el('div', 'enh-block');
    var bi = el('div', 'enh-block-inner');
    bi.appendChild(el('p', 'enh-block-kicker', 'Section 00'));
    bi.appendChild(el('p', 'enh-block-h', 'Engagement summary'));
    var rules = el('div', 'enh-rules');
    for (var r = 0; r < 5; r++) rules.appendChild(el('span'));
    bi.appendChild(rules);
    block.appendChild(bi);

    /* --- flyleaf (turns second, slightly behind) --- */
    var fly = el('div', 'enh-leaf enh-leaf-fly');
    fly.setAttribute('aria-hidden', 'true');
    fly.appendChild(el('div', 'enh-face enh-fly-front'));
    var flyBack = el('div', 'enh-face enh-face-back enh-fly-back');
    fly.appendChild(flyBack);

    /* --- hard cover (turns first) --- */
    var cover = el('div', 'enh-leaf enh-leaf-cover');

    var front = el('div', 'enh-face enh-cover');
    front.appendChild(el('div', 'enh-band', 'Confidential — for the named recipient'));
    front.appendChild(el('div', 'enh-foil'));
    front.appendChild(el('div', 'enh-monogram', '[rs]'));
    front.appendChild(el('p', 'enh-doctype', 'Security assessment report'));

    var h = el('h1', 'enh-name', 'Rahil Sahu');
    front.appendChild(h);
    front.appendChild(el('p', 'enh-role',
      'Application Security Engineer — VAPT, product security and security architecture review.'));

    var stamp = el('div', 'enh-stamp');
    stamp.setAttribute('aria-hidden', 'true');
    stamp.appendChild(el('span', null, 'Validated'));
    var b = document.createElement('b');
    b.textContent = '700+';
    stamp.appendChild(b);
    stamp.appendChild(el('span', null, 'findings'));
    front.appendChild(stamp);

    var meta = el('dl', 'enh-meta');
    [
      ['Ref', CONFIG.reference],
      ['Scope', 'Web · API · Mobile · Network · Cloud'],
      ['Issued', CONFIG.issued],
      ['Pages', '10 sections']
    ].forEach(function (row) {
      meta.appendChild(el('dt', null, row[0]));
      meta.appendChild(el('dd', null, row[1]));
    });
    front.appendChild(meta);

    var barcode = el('div', 'enh-barcode');
    barcode.setAttribute('aria-hidden', 'true');
    front.appendChild(barcode);

    /* inside of the cover, visible while it turns */
    var inside = el('div', 'enh-face enh-face-back enh-inside');
    inside.setAttribute('aria-hidden', 'true');
    inside.appendChild(el('h3', null, 'Distribution'));
    var ul = document.createElement('ul');
    CONFIG.distribution.forEach(function (d) { ul.appendChild(el('li', null, d)); });
    inside.appendChild(ul);

    cover.appendChild(front);
    cover.appendChild(inside);

    var spine = el('div', 'enh-spine');
    spine.setAttribute('aria-hidden', 'true');

    body.appendChild(block);
    body.appendChild(fly);
    body.appendChild(cover);
    body.appendChild(spine);
    stage.appendChild(body);

    var controls = el('div', 'enh-controls');
    var openBtn = el('button', 'enh-openbtn', 'Open the report');
    openBtn.type = 'button';
    controls.appendChild(openBtn);
    controls.appendChild(el('p', 'enh-hint', 'Tap the cover, or press Enter'));

    book.appendChild(skip);
    book.appendChild(stage);
    book.appendChild(controls);
    document.body.appendChild(book);

    return { book: book, stage: stage, openBtn: openBtn, skip: skip, front: front };
  }

  /* =============================================================
     3 · Opening sequence
     ============================================================= */

  function wireCover(parts, onDone) {
    var opened = false;
    var timer = null;

    function finish(instant) {
      root.classList.remove('enh-boot', 'enh-locked');
      root.classList.add('enh-reveal');
      parts.book.classList.add('enh-dismiss');

      window.setTimeout(function () {
        if (parts.book.parentNode) parts.book.parentNode.removeChild(parts.book);
        root.classList.remove('enh-reveal');
        if (typeof onDone === 'function') onDone();
      }, instant ? 160 : 1000);
    }

    function open() {
      if (opened) return;
      opened = true;
      if (timer) window.clearTimeout(timer);

      try {
        window.sessionStorage.setItem('enh-cover', '1');
      } catch (e) { /* ignore */ }

      document.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onGesture);
      window.removeEventListener('touchmove', onGesture);

      parts.book.classList.add('enh-open');
      /* Reveal the site just past the halfway point of the turn, so it
         appears from behind the cover rather than after it. */
      window.setTimeout(function () { finish(false); }, reduced ? 60 : 820);
    }

    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        open();
      } else if (e.key === 'Escape') {
        open();
      }
    }
    function onGesture() { open(); }

    parts.openBtn.addEventListener('click', open);
    parts.stage.addEventListener('click', open);
    parts.skip.addEventListener('click', function (e) {
      e.stopPropagation();
      opened = true;
      parts.book.classList.add('enh-open');
      finish(true);
    });

    document.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onGesture, { passive: true, once: true });
    window.addEventListener('touchmove', onGesture, { passive: true, once: true });

    if (CONFIG.autoOpenAfterMs > 0) {
      timer = window.setTimeout(open, CONFIG.autoOpenAfterMs);
    }

    /* Focus the control so keyboard users land somewhere sensible. */
    window.setTimeout(function () {
      try { parts.openBtn.focus({ preventScroll: true }); } catch (e) { parts.openBtn.focus(); }
    }, 320);
  }

  /* =============================================================
     4 · Glass interactions
     ============================================================= */

  var GLASS_CARDS =
    '.proj-card, .learn-card, .ai-card, .also-card, .cred, .ctf';

  function wirePointerSheen() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    document.addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest ? e.target.closest(GLASS_CARDS) : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  function wireSpotlight() {
    if (reduced) return;
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var spot = el('div', 'enh-spot');
    spot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spot);

    var x = 0, y = 0, cx = 0, cy = 0, running = false;

    function loop() {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      spot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(x - cx) > 0.4 || Math.abs(y - cy) > 0.4) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }

    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      root.classList.add('enh-pointer');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      root.classList.remove('enh-pointer');
    }, { passive: true });
  }

  function wireHeaderState() {
    var ticking = false;
    function update() {
      root.classList.toggle('enh-scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* =============================================================
     5 · Gel-in reveals
     ============================================================= */

  function wireGelReveals() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(
      '.proj-card, .learn-card, .ai-card, .also-card, .cred, .ctf, .metric, .timeline-item'
    );
    if (!targets.length) return;

    for (var i = 0; i < targets.length; i++) targets[i].classList.add('enh-gel');

    var heads = document.querySelectorAll('.section-title');
    for (var h = 0; h < heads.length; h++) heads[h].classList.add('enh-sweep');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, idx) {
        if (!e.isIntersecting) return;
        var delay = Math.min(idx * 70, 420);
        window.setTimeout(function () { e.target.classList.add('enh-in'); }, delay);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    for (var j = 0; j < targets.length; j++) io.observe(targets[j]);

    var hio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('enh-in');
        hio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    for (var k = 0; k < heads.length; k++) hio.observe(heads[k]);

    /* Safety net: never leave content hidden if an observer misfires. */
    window.setTimeout(function () {
      for (var n = 0; n < targets.length; n++) targets[n].classList.add('enh-in');
    }, 5000);
  }

  /* =============================================================
     6 · Replay the hero counters after the cover opens
     main.js counts up on load, which happens behind the cover. This
     runs them again so the numbers move when they are first seen.
     It waits out main.js's own 3s safety net first, so the two never
     fight over the same text node.
     ============================================================= */

  function replayCounters() {
    if (reduced) return;
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;

    var since = 0;
    try {
      since = performance.now();
    } catch (e) { since = 3400; }

    var wait = Math.max(0, 3300 - since);

    window.setTimeout(function () {
      for (var i = 0; i < els.length; i++) run(els[i], i * 90);
    }, wait);

    function run(node, delay) {
      var to = parseInt(node.getAttribute('data-count-to'), 10);
      if (!isFinite(to)) return;
      var plus = node.querySelector('.metric-plus');

      window.setTimeout(function () {
        node.textContent = '0';
        if (plus) node.appendChild(plus);
        var textNode = node.firstChild;
        var start = null;
        var dur = 1500;

        function step(t) {
          if (start === null) start = t;
          var p = Math.min(1, (t - start) / dur);
          var eased = 1 - Math.pow(1 - p, 4);
          textNode.nodeValue = String(Math.floor(to * eased));
          if (p < 1) requestAnimationFrame(step);
          else textNode.nodeValue = String(to);
        }
        requestAnimationFrame(step);
      }, delay);
    }
  }

  /* =============================================================
     7 · Boot
     ============================================================= */

  ready(function () {
    if (!supportsGlass) root.classList.remove('enh-warp');

    buildAmbient();
    buildSvgDefs();
    wireHeaderState();
    wirePointerSheen();

    function afterCover() {
      wireSpotlight();
      wireGelReveals();
      replayCounters();
    }

    if (seen) {
      afterCover();
      return;
    }

    var parts = buildBook();
    wireCover(parts, afterCover);
  });

  /* Respond live if the visitor flips their reduced-motion setting. */
  if (mqReduce && mqReduce.addEventListener) {
    mqReduce.addEventListener('change', function (e) { reduced = e.matches; });
  }
})();
