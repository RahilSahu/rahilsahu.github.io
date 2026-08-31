/* Rahil Sahu — portfolio interactivity.
 * CSP-safe: no eval, no innerHTML from user input, no external requests. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- 1. Theme toggle (auto -> light -> dark) -------------------- */
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
      /* When theme changes, matrix rain must repaint with the new palette */
      if (window.__rsMatrix) window.__rsMatrix.repaint();
    });
  }

  /* -------------------- 2. Matrix rain (canvas, GPU-friendly, opt-out) -------------------- */
  var FX_KEY = 'rs.fx';
  var fxBtn = doc.getElementById('fxToggle');
  var canvas = doc.getElementById('matrixCanvas');
  var fxEnabled = true;
  try {
    var savedFx = localStorage.getItem(FX_KEY);
    if (savedFx === 'off') fxEnabled = false;
  } catch (e) {}
  if (reducedMotion) fxEnabled = false;

  function setFxState(on) {
    fxEnabled = on;
    if (canvas) canvas.style.opacity = on ? '' : '0';
    if (fxBtn) {
      fxBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = fxBtn.querySelector('.fx-label');
      if (label) label.textContent = on ? 'fx' : 'off';
    }
    if (on && window.__rsMatrix) window.__rsMatrix.start();
    else if (window.__rsMatrix) window.__rsMatrix.stop();
  }

  (function matrix() {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var cols = 0, drops = [], fontSize = 14, w = 0, h = 0, running = false, rafId = 0, lastFrame = 0;
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789#$%&*+-<=>?@[]{}';
    var accent = '#F87171';

    function readAccent() {
      var cs = getComputedStyle(root);
      accent = (cs.getPropertyValue('--matrix-accent') || cs.getPropertyValue('--accent') || '#F87171').trim();
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = fontSize + "px 'JetBrains Mono', ui-monospace, Menlo, monospace";
      cols = Math.ceil(w / fontSize);
      drops = new Array(cols);
      for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
      readAccent();
    }

    function frame(t) {
      if (!running) return;
      if (t - lastFrame < 55) { rafId = requestAnimationFrame(frame); return; }
      lastFrame = t;
      /* Fade previous frame — dark theme uses dark fade, light uses light fade */
      var isDark = root.getAttribute('data-theme') === 'dark' ||
        (root.getAttribute('data-theme') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      ctx.fillStyle = isDark ? 'rgba(11,15,20,0.10)' : 'rgba(240,238,231,0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = accent;
      for (var i = 0; i < cols; i++) {
        var ch = chars.charAt(Math.floor(Math.random() * chars.length));
        var x = i * fontSize;
        var y = drops[i] * fontSize;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      rafId = requestAnimationFrame(frame);
    }

    window.__rsMatrix = {
      start: function () { if (running) return; running = true; lastFrame = 0; rafId = requestAnimationFrame(frame); },
      stop: function () { running = false; if (rafId) cancelAnimationFrame(rafId); ctx.clearRect(0, 0, w, h); },
      repaint: function () { readAccent(); if (running) { ctx.clearRect(0, 0, w, h); } }
    };

    resize();
    window.addEventListener('resize', function () { resize(); }, { passive: true });
    setFxState(fxEnabled);
  })();

  if (fxBtn) {
    fxBtn.addEventListener('click', function () {
      var next = !fxEnabled;
      setFxState(next);
      try { localStorage.setItem(FX_KEY, next ? 'on' : 'off'); } catch (e) {}
    });
    /* Reflect initial state on the button */
    fxBtn.setAttribute('aria-pressed', fxEnabled ? 'true' : 'false');
    var lbl = fxBtn.querySelector('.fx-label');
    if (lbl) lbl.textContent = fxEnabled ? 'fx' : 'off';
  }

  /* -------------------- 3. Scroll reveal (fade + slide in) -------------------- */
  (function reveal() {
    if (reducedMotion || !('IntersectionObserver' in window)) {
      var all = doc.querySelectorAll('.section, .hero, .cred, .also-card, .tool, .ctf, .learn-card, .ai-card');
      for (var i = 0; i < all.length; i++) all[i].classList.add('is-revealed');
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
    var targets = doc.querySelectorAll('.section, .hero, .cred, .also-card, .tool, .ctf, .learn-card, .ai-card');
    for (var j = 0; j < targets.length; j++) {
      targets[j].classList.add('will-reveal');
      io.observe(targets[j]);
    }
  })();

  /* -------------------- 4. Metric count-up on view -------------------- */
  (function countUp() {
    var els = doc.querySelectorAll('[data-count-to]');
    if (!els.length) return;

    function setFinal(el) {
      var to = parseInt(el.getAttribute('data-count-to'), 10);
      var plus = el.querySelector('.metric-plus');
      el.textContent = String(to);
      if (plus) el.appendChild(plus);
    }

    if (reducedMotion) {
      for (var i = 0; i < els.length; i++) setFinal(els[i]);
      return;
    }

    function animate(el) {
      var to = parseInt(el.getAttribute('data-count-to'), 10);
      var plus = el.querySelector('.metric-plus');
      el.textContent = '0';
      if (plus) el.appendChild(plus);
      var textNode = el.firstChild;
      var start = performance.now();
      var dur = 1400;
      function step(t) {
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        textNode.nodeValue = String(Math.floor(to * eased));
        if (p < 1) requestAnimationFrame(step);
        else textNode.nodeValue = String(to);
      }
      requestAnimationFrame(step);
    }

    var kicked = [];
    function kickAlreadyVisible() {
      for (var i = 0; i < els.length; i++) {
        if (kicked.indexOf(els[i]) !== -1) continue;
        var r = els[i].getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
          kicked.push(els[i]);
          animate(els[i]);
        }
      }
    }

    /* Kick immediately after a paint so above-fold metrics animate on load */
    requestAnimationFrame(function () {
      setTimeout(kickAlreadyVisible, 60);
    });

    /* Backup for below-fold + slow browsers: observer, and a safety net timeout */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && kicked.indexOf(e.target) === -1) {
            kicked.push(e.target);
            animate(e.target);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.15 });
      els.forEach(function (el) { io.observe(el); });
    }

    /* Safety net: if for any reason animation never runs on a metric within
       3 seconds, force the final value so users don't see stale zeros. */
    setTimeout(function () {
      els.forEach(function (el) {
        if (kicked.indexOf(el) === -1) {
          setFinal(el);
        } else {
          /* Ensure ended state — some browsers throttle rAF in background tabs */
          var to = parseInt(el.getAttribute('data-count-to'), 10);
          if (el.firstChild && el.firstChild.nodeValue !== String(to)) {
            setFinal(el);
          }
        }
      });
    }, 3000);
  })();

  /* -------------------- 5. Terminal typing effect (hero) -------------------- */
  (function typeTerminal() {
    var el = doc.getElementById('terminalBody');
    if (!el || reducedMotion) return;
    /* Cache HTML, blank the element, then restore progressively.
     * We don't type char-by-char (breaks span coloring) — we reveal HTML tokens. */
    var full = el.innerHTML;
    var chunks = full.split('\n');
    el.innerHTML = '';
    var i = 0;
    function next() {
      if (i >= chunks.length) { el.classList.add('is-done'); return; }
      el.innerHTML += (i > 0 ? '\n' : '') + chunks[i];
      i++;
      setTimeout(next, 90 + Math.random() * 60);
    }
    setTimeout(next, 320);
  })();

  /* -------------------- 6. Terminal copy button -------------------- */
  (function copyTerm() {
    var btn = doc.getElementById('terminalCopy');
    var body = doc.getElementById('terminalBody');
    if (!btn || !body) return;
    btn.addEventListener('click', function () {
      var text = body.textContent || '';
      var done = function () { btn.textContent = 'copied'; setTimeout(function () { btn.textContent = 'copy'; }, 1400); };
      var fail = function () { btn.textContent = 'error'; setTimeout(function () { btn.textContent = 'copy'; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          try {
            var ta = doc.createElement('textarea'); ta.value = text; doc.body.appendChild(ta);
            ta.select(); doc.execCommand('copy'); doc.body.removeChild(ta); done();
          } catch (e) { fail(); }
        });
      } else {
        try {
          var ta2 = doc.createElement('textarea'); ta2.value = text; doc.body.appendChild(ta2);
          ta2.select(); doc.execCommand('copy'); doc.body.removeChild(ta2); done();
        } catch (e2) { fail(); }
      }
    });
  })();

  /* -------------------- 7. Toolchain filter -------------------- */
  (function toolFilter() {
    var buttons = doc.querySelectorAll('.tool-filter');
    var grid = doc.getElementById('toolGrid');
    if (!buttons.length || !grid) return;
    var items = grid.querySelectorAll('.tool');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        items.forEach(function (it) {
          if (f === 'all') { it.classList.remove('is-hidden'); return; }
          var cats = (it.getAttribute('data-cats') || '').split(/\s+/);
          if (cats.indexOf(f) !== -1) it.classList.remove('is-hidden');
          else it.classList.add('is-hidden');
        });
      });
    });
  })();

  /* -------------------- 8. Nav highlight on scroll -------------------- */
  (function navHighlight() {
    var links = doc.querySelectorAll('.site-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var t = doc.getElementById(id);
      if (t) map[id] = a;
    });
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var id = e.target.id;
        if (!map[id]) return;
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-current'); });
          map[id].classList.add('is-current');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { io3.observe(doc.getElementById(id)); });
  })();

  /* -------------------- 9. Contact form (client-side validate) -------------------- */
  (function form() {
    var f = doc.getElementById('engagementForm');
    if (!f) return;
    var note = doc.getElementById('formNote');
    f.addEventListener('submit', function (ev) {
      var hp = f.querySelector('input[name="website"]');
      if (hp && hp.value) { ev.preventDefault(); return; }
      var name = f.querySelector('#f-name').value.trim();
      var email = f.querySelector('#f-email').value.trim();
      var scope = f.querySelector('#f-scope').value.trim();
      var msg = f.querySelector('#f-msg').value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailOk || !scope || msg.length < 15) {
        ev.preventDefault();
        if (note) {
          note.textContent = 'Please add name, a valid email, scope, a brief (min 15 chars).';
          note.classList.remove('is-ok'); note.classList.add('is-err');
        }
        return;
      }
      if (note) {
        note.textContent = 'Opening your mail client…';
        note.classList.remove('is-err'); note.classList.add('is-ok');
      }
    });
  })();

  /* -------------------- 10. CTF challenges (all client-side, read-only) -------------------- */
  (function ctf() {
    var HINTS = {
      xss: 'The regex is case-sensitive and only removes exact strings. Event handlers besides onerror/onload exist.',
      flag: 'Right-click the card → Inspect. HTML comments are visible in the Elements panel but not on the page.',
      jwt: 'A JWT is three base64url segments joined by dots. The middle segment is the payload — decode it.',
      cipher: 'Reverse the operations in reverse order: first undo ROT13, then base64-decode twice.'
    };

    function setResult(target, msg, ok) {
      var el = doc.querySelector('[data-result="' + target + '"]');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('is-ok', 'is-err');
      el.classList.add(ok ? 'is-ok' : 'is-err');
    }

    /* Challenge 1: XSS payload check.
     * Uses DOMParser to see if the payload — after passing the sanitiser — contains
     * an element with an event handler that isn't in the blocklist, OR a javascript: href.
     * We do not execute the payload; DOMParser returns an inert document. */
    function checkXss(payload) {
      var sanitised = payload
        .replace(/<script>/gi, '')
        .replace(/onerror=/gi, '')
        .replace(/onload=/gi, '')
        .replace(/javascript:/gi, '');
      var parser = new DOMParser();
      var pdoc = parser.parseFromString('<div>' + sanitised + '</div>', 'text/html');
      var els = pdoc.querySelectorAll('*');
      var triggered = false;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var attrs = el.attributes;
        for (var j = 0; j < attrs.length; j++) {
          var name = attrs[j].name.toLowerCase();
          var val = attrs[j].value;
          if (name.indexOf('on') === 0 && val) { triggered = true; break; }
          if ((name === 'href' || name === 'src' || name === 'action' || name === 'formaction')
              && /^\s*javascript:/i.test(val)) { triggered = true; break; }
        }
        if (triggered) break;
      }
      return triggered;
    }

    function base64urlDecode(str) {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      try { return atob(str); } catch (e) { return null; }
    }

    function rot13(s) {
      return s.replace(/[a-zA-Z]/g, function (c) {
        var base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
      });
    }

    /* Submit handlers */
    doc.querySelectorAll('.ctf-submit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-target');
        var input = doc.getElementById('ctf-' + target + '-in');
        if (!input) return;
        var val = input.value.trim();
        if (!val) { setResult(target, 'Empty submission.', false); return; }

        if (target === 'xss') {
          var wins = checkXss(val);
          setResult(target,
            wins ? '✓ Bypass accepted. Your payload survived the filter and would execute.' :
                   '✗ Blocked or no handler present. Try event attributes not in the blocklist, or a javascript: URL that beats the case-insensitive regex.',
            wins);
        }
        else if (target === 'flag') {
          var expected = doc.querySelector('[data-challenge="flag"]').getAttribute('data-hidden-flag');
          var ok = val === expected;
          setResult(target,
            ok ? '✓ Correct. That flag lived in an HTML comment inside the card.' :
                 '✗ Not the flag. Format is FLAG{...}. Open DevTools → Elements and scan this card.',
            ok);
        }
        else if (target === 'jwt') {
          var ok2 = /^guest$/i.test(val);
          setResult(target,
            ok2 ? '✓ Right. Payload was {"sub":"rahil","role":"guest","exp":1793456789}. Real-world follow-up: try alg=none.' :
                  '✗ Decode the middle segment (between the dots) as base64url. It is a JSON object.',
            ok2);
        }
        else if (target === 'cipher') {
          /* Expected flag: FLAG{tri4ge-3ncoding-l4y3rs} */
          var expectedC = 'FLAG{tri4ge-3ncoding-l4y3rs}';
          var ok3 = val === expectedC;
          setResult(target,
            ok3 ? '✓ Recovered. Chain was rot13 → base64 → base64.' :
                  '✗ Not quite. In the console: atob(atob(rot13(cipher))). Or use CyberChef.',
            ok3);
        }
      });
    });

    /* Hint buttons */
    doc.querySelectorAll('.ctf-hint').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-target');
        setResult(target, 'Hint: ' + HINTS[target], true);
      });
    });

    /* Enter key submits */
    doc.querySelectorAll('.ctf-input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var id = inp.id.replace('ctf-', '').replace('-in', '');
          var b = doc.querySelector('.ctf-submit[data-target="' + id + '"]');
          if (b) b.click();
        }
      });
    });
  })();

  /* -------------------- 12. Scroll progress bar -------------------- */
  (function scrollProgress() {
    var bar = doc.getElementById('scrollProgress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = doc.documentElement;
      var scrolled = h.scrollTop || doc.body.scrollTop;
      var max = (h.scrollHeight - h.clientHeight) || 1;
      var pct = Math.min(100, Math.max(0, (scrolled / max) * 100));
      bar.style.transform = 'scaleX(' + (pct / 100) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  /* -------------------- 13. Glitch effect on section titles when they enter view -------------------- */
  (function glitchTitles() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var titles = doc.querySelectorAll('.section-title, .hero-title');
    var chars = '!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function scramble(el) {
      var final = el.getAttribute('data-final') || el.textContent;
      if (!el.getAttribute('data-final')) el.setAttribute('data-final', final);
      var length = final.length;
      var start = performance.now();
      var dur = 650;
      function step(t) {
        var p = Math.min(1, (t - start) / dur);
        var revealCount = Math.floor(length * p);
        var out = '';
        for (var i = 0; i < length; i++) {
          if (i < revealCount || final.charAt(i) === ' ' || final.charAt(i) === '\n') {
            out += final.charAt(i);
          } else {
            out += chars.charAt(Math.floor(Math.random() * chars.length));
          }
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = final;
      }
      requestAnimationFrame(step);
    }
    var seen = [];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && seen.indexOf(e.target) === -1) {
          seen.push(e.target);
          scramble(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5, rootMargin: '-10% 0px' });
    titles.forEach(function (el) {
      /* Skip hero-title (it uses accent bar + fade instead) and titles with mixed HTML */
      if (el.classList.contains('hero-title')) return;
      if (el.children.length > 0) return;
      io.observe(el);
    });
  })();

  /* -------------------- 14. Particle network canvas (AI × Security section) -------------------- */
  (function particles() {
    var canvas = doc.getElementById('particlesCanvas');
    if (!canvas || !canvas.getContext || reducedMotion) return;
    var ctx = canvas.getContext('2d');
    var section = canvas.parentElement;
    var particles = [], running = false, rafId = 0;
    var w = 0, h = 0, dpr = 1;
    var accent = '#B91C1C';
    var COUNT_DESKTOP = 60, COUNT_MOBILE = 30, MAX_DIST = 130;

    function readAccent() {
      var cs = getComputedStyle(root);
      accent = (cs.getPropertyValue('--accent') || '#B91C1C').trim();
    }

    function resize() {
      if (!section) return;
      var rect = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = w < 700 ? COUNT_MOBILE : COUNT_DESKTOP;
      while (particles.length < target) particles.push(newParticle());
      while (particles.length > target) particles.pop();
    }

    function newParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1 + Math.random() * 1.5
      };
    }

    function hexToRgb(hex) {
      var m = hex.replace('#','').match(/../g);
      if (!m) return '185,28,28';
      return parseInt(m[0],16)+','+parseInt(m[1],16)+','+parseInt(m[2],16);
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var rgb = hexToRgb(accent);
      /* Update + draw particles */
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = 'rgba(' + rgb + ',0.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      /* Draw connecting lines */
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d = Math.sqrt(dx*dx + dy*dy);
          if (d < MAX_DIST) {
            var op = (1 - d / MAX_DIST) * 0.35;
            ctx.strokeStyle = 'rgba(' + rgb + ',' + op + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    /* Only run when section is in view (perf) */
    var inView = false;
    function start() { if (running) return; running = true; readAccent(); resize(); rafId = requestAnimationFrame(frame); }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); ctx && ctx.clearRect(0, 0, w, h); }

    if ('IntersectionObserver' in window && section) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { inView = true; start(); }
          else { inView = false; stop(); }
        });
      }, { threshold: 0.05 });
      io.observe(section);
    } else {
      start();
    }

    window.addEventListener('resize', function () { if (running) resize(); }, { passive: true });
  })();

  /* -------------------- 15. 3D tilt on credential cards -------------------- */
  (function tilt() {
    if (reducedMotion) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return; /* no tilt on touch */
    var cards = doc.querySelectorAll('.cred, .ai-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rx = (-y * 5).toFixed(2);
        var ry = (x * 5).toFixed(2);
        card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  })();

  /* -------------------- 16. Mouse-tracked glow on Learn cards -------------------- */
  (function learnGlow() {
    if (reducedMotion) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    var cards = doc.querySelectorAll('.learn-card');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--gx', x + '%');
        card.style.setProperty('--gy', y + '%');
      });
    });
  })();

  /* -------------------- 17. TOOLCHAIN — matrix-shuffle tool names on hover -------------------- */
  (function toolShuffle() {
    if (reducedMotion) return;
    var names = doc.querySelectorAll('#toolGrid .tool-name');
    if (!names.length) return;
    var CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌABCDEFGHIJKLMNOP0123456789#$%&*+-';
    names.forEach(function (el) {
      var original = el.textContent;
      var timer = null;
      el.addEventListener('mouseenter', function () {
        if (timer) return;
        var frames = 0;
        var maxFrames = 14;
        timer = setInterval(function () {
          frames++;
          if (frames >= maxFrames) {
            clearInterval(timer); timer = null;
            el.textContent = original;
            return;
          }
          var out = '';
          for (var i = 0; i < original.length; i++) {
            var ch = original[i];
            var revealAt = Math.floor((i / original.length) * maxFrames);
            if (frames >= revealAt + Math.floor(Math.random() * 3)) {
              out += ch;
            } else if (ch === ' ') {
              out += ' ';
            } else {
              out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
            }
          }
          el.textContent = out;
        }, 40);
      });
      el.addEventListener('mouseleave', function () {
        if (timer) { clearInterval(timer); timer = null; }
        el.textContent = original;
      });
    });
  })();

  /* -------------------- 18. PRACTICE — scanning line sweep across the matrix -------------------- */
  (function matrixScan() {
    if (reducedMotion) return;
    var wrap = doc.querySelector('.matrix-wrap');
    if (!wrap) return;
    var scan = doc.createElement('div');
    scan.className = 'matrix-scan';
    scan.setAttribute('aria-hidden', 'true');
    wrap.appendChild(scan);
    /* Trigger scan when the matrix comes into view */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            scan.classList.add('is-scanning');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.3 });
      io.observe(wrap);
    } else {
      scan.classList.add('is-scanning');
    }
  })();

  /* -------------------- 19. CREDENTIALS — shine sweep on scroll into view -------------------- */
  (function credShine() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    var cards = doc.querySelectorAll('.cred');
    if (!cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          /* stagger the shine across the row */
          var idx = Array.prototype.indexOf.call(cards, e.target);
          setTimeout(function () { e.target.classList.add('is-shining'); }, idx * 150);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    cards.forEach(function (c) { io.observe(c); });
  })();

  /* -------------------- 20. HERO title — subtle glitch on hover -------------------- */
  (function heroGlitch() {
    if (reducedMotion) return;
    var t = doc.querySelector('.hero-title');
    if (!t) return;
    t.addEventListener('mouseenter', function () {
      t.classList.add('is-glitching');
      setTimeout(function () { t.classList.remove('is-glitching'); }, 550);
    });
  })();

  /* -------------------- 21. Smooth scroll for anchor nav -------------------- */
  (function smoothScroll() {
    if (reducedMotion) return;
    var links = doc.querySelectorAll('a[href^="#"]');
    links.forEach(function (a) {
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

  /* -------------------- 22. Magnetic hover on primary buttons -------------------- */
  (function magnetic() {
    if (reducedMotion) return;
    var buttons = doc.querySelectorAll('.btn-primary');
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  })();

  /* -------------------- 23. Footer year -------------------- */
  var yr = doc.getElementById('year');
  if (yr) yr.textContent = String(new Date().getFullYear());

})();
