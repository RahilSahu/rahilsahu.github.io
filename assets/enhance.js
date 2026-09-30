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
     2 · Book cover with a Duo-style unfold
     ============================================================= */

  function buildBook() {
    var book = el('div', 'enh-book enh-keep');
    book.id = 'enhBook';
    book.setAttribute('role', 'dialog');
    book.setAttribute('aria-modal', 'true');
    book.setAttribute('aria-label', 'Report cover - open to read the site');

    var skip = el('button', 'enh-skip', 'Skip');
    skip.type = 'button';

    var stage = el('div', 'enh-stage');
    var body = el('div', 'enh-body');

    /* Front face: warm ivory paper report cover */
    var front = el('div', 'enh-face enh-cover');
    front.appendChild(el('div', 'enh-band', 'Confidential - for the named recipient'));
    front.appendChild(el('div', 'enh-foil'));
    front.appendChild(el('div', 'enh-monogram', '[rs]'));
    front.appendChild(el('p', 'enh-doctype', 'Security assessment report'));
    front.appendChild(el('h1', 'enh-name', 'Rahil Sahu'));
    front.appendChild(el('p', 'enh-role',
      'Application Security Engineer · VAPT, product security and security architecture review.'));

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

    /* Inside face: glimpsed as the halves swing open */
    var inside = el('div', 'enh-face enh-face-back enh-inside');
    inside.setAttribute('aria-hidden', 'true');
    inside.appendChild(el('h3', null, 'Distribution'));
    var ul = document.createElement('ul');
    CONFIG.distribution.forEach(function (d) { ul.appendChild(el('li', null, d)); });
    inside.appendChild(ul);

    body.appendChild(front);
    body.appendChild(inside);
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

    return { book: book, stage: stage, body: body, openBtn: openBtn, skip: skip };
  }

  /* =============================================================
     3 · Opening sequence (Duo unfold)
     ============================================================= */

  function wireCover(parts, onDone) {
    var opened = false;
    var timer = null;
    /* One continuous motion: decisive start, soft landing. */
    var EASE = 'cubic-bezier(.3,.8,.3,1)';
    var DUR = 1200; /* ms for the unfold */

    function finish() {
      root.classList.remove('enh-boot', 'enh-locked', 'enh-unfolding');
      root.classList.add('enh-reveal');
      var ov = document.querySelector('.enh-unfold');
      if (parts.book.parentNode) parts.book.parentNode.removeChild(parts.book);
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
      /* Let the sheet-in settle fully before dropping the reveal class. */
      window.setTimeout(function () {
        root.classList.remove('enh-reveal');
        if (typeof onDone === 'function') onDone();
      }, 950);
    }

    /* iPhone Duo-style unfold: the cover splits at its vertical hinge and
       both halves swing open in 3D while blurring away; the backdrop lets
       go at the same time so the site is revealed from behind the opening
       cover. transform / filter / opacity only — no layout properties. */
    function unfold() {
      var rect = parts.body.getBoundingClientRect();
      var W = rect.width, H = rect.height, L = rect.left, T = rect.top;
      if (!(W > 0 && H > 0)) { fadeOut(); return; }

      var ov = el('div', 'enh-unfold');
      ov.setAttribute('aria-hidden', 'true');

      function half(side) {
        var h = el('div', 'enh-half enh-half-' + side);
        h.style.left = (side === 'l' ? L : L + W / 2) + 'px';
        h.style.top = T + 'px';
        h.style.width = (W / 2) + 'px';
        h.style.height = H + 'px';
        var inner = el('div', 'enh-half-inner');
        inner.style.width = W + 'px';
        inner.style.height = H + 'px';
        if (side === 'r') inner.style.marginLeft = (-W / 2) + 'px';
        inner.appendChild(parts.body.cloneNode(true));
        h.appendChild(inner);
        ov.appendChild(h);
        return h;
      }

      var left = half('l');
      var right = half('r');

      /* Glass hinge-glow: a blurred white/gold seam that flares as the
         halves part, then lets go. */
      var hinge = el('div', 'enh-hinge');
      hinge.style.left = (L + W / 2 - 2) + 'px';
      hinge.style.top = T + 'px';
      hinge.style.height = H + 'px';
      ov.appendChild(hinge);

      document.body.appendChild(ov);
      /* Hide the original so the clones take over seamlessly. The site
         itself becomes visible now so it is revealed from behind the
         opening cover as the backdrop fades. */
      parts.body.style.visibility = 'hidden';
      root.classList.add('enh-unfolding');
      /* The site settles into place behind the opening cover, timed so it
         has landed by the moment the backdrop lets go. */
      root.classList.add('enh-reveal');
      /* One read so everything is laid out before the first frame. */
      void ov.offsetWidth;

      var aL = left.animate([
        { transform: 'rotateY(0deg)', filter: 'blur(0px)', opacity: 1 },
        { transform: 'rotateY(-150deg)', filter: 'blur(10px)', opacity: 1, offset: 0.7 },
        { transform: 'rotateY(-150deg)', filter: 'blur(10px)', opacity: 0 }
      ], { duration: DUR, easing: EASE, fill: 'forwards' });

      var aR = right.animate([
        { transform: 'rotateY(0deg)', filter: 'blur(0px)', opacity: 1 },
        { transform: 'rotateY(150deg)', filter: 'blur(10px)', opacity: 1, offset: 0.7 },
        { transform: 'rotateY(150deg)', filter: 'blur(10px)', opacity: 0 }
      ], { duration: DUR, easing: EASE, fill: 'forwards' });

      var aH = hinge.animate([
        { opacity: 0, transform: 'scaleY(0.94)' },
        { opacity: 0.9, transform: 'scaleY(1.02)', offset: 0.35 },
        { opacity: 0, transform: 'scaleY(1.06)' }
      ], { duration: DUR, easing: 'ease-out', fill: 'forwards' });

      /* The backdrop fades during the swing so the site appears from
         behind the opening cover, not after it. */
      var aB = parts.book.animate(
        { opacity: [1, 0] },
        { duration: Math.round(DUR * 0.85), easing: 'ease-out', fill: 'forwards' }
      );

      Promise.all([aL.finished, aR.finished, aH.finished, aB.finished])
        .then(finish, finish);
    }

    /* Reduced motion (and Skip): a plain 250ms fade, no 3D. */
    function fadeOut() {
      var a = parts.book.animate(
        { opacity: [1, 0] },
        { duration: 250, easing: 'ease-out', fill: 'forwards' }
      );
      a.finished.then(finish, finish);
    }

    function teardown() {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onGesture);
      window.removeEventListener('touchmove', onGesture);
      try {
        window.sessionStorage.setItem('enh-cover', '1');
      } catch (e) { /* ignore */ }
    }

    function open() {
      if (opened) return;
      opened = true;
      if (timer) window.clearTimeout(timer);
      teardown();
      if (reduced) fadeOut();
      else unfold();
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
      if (opened) return;
      opened = true;
      if (timer) window.clearTimeout(timer);
      teardown();
      fadeOut();
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

  /* While the user scrolls, mark <html> so CSS can freeze the ambient
     orb drift (see html.enh-scrolling .enh-orb). The mark is lifted
     ~160ms after the last scroll event; the drift resumes where it
     paused. Passive + timeout only: no layout work per event. */
  function wireScrollIdle() {
    var idle = null;
    window.addEventListener('scroll', function () {
      root.classList.add('enh-scrolling');
      if (idle) clearTimeout(idle);
      idle = setTimeout(function () {
        root.classList.remove('enh-scrolling');
        idle = null;
      }, 160);
    }, { passive: true });
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
    wireScrollIdle();
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
