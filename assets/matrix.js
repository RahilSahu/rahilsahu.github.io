/* Rahil Sahu — matrix.html: layered digital rain + interactive terminal.
 * CSP-safe: zero inline JS on the page, no eval, no external requests. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle (shared key with the rest of the site) */
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

  /* -------------------- 1. Layered digital rain -------------------- */
  var canvas = doc.getElementById('mxRain');
  var rain = { start: function () {}, stop: function () {} };
  if (canvas && canvas.getContext && !reducedMotion) {
    (function () {
      var ctx = canvas.getContext('2d');
      var w = 0, h = 0, dpr = 1, running = false, rafId = 0, lastFrame = 0;
      var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789$#%&*+-<=>?@[]{}';
      /* Three depth layers: far (small, slow, dim), mid, near (large, fast, bright) */
      var layers = [
        { size: 11, speed: 0.35, alpha: 0.30, cols: 0, drops: [] },
        { size: 16, speed: 0.65, alpha: 0.55, cols: 0, drops: [] },
        { size: 24, speed: 1.0,  alpha: 0.90, cols: 0, drops: [] }
      ];
      var mx = 0, my = 0; /* mouse parallax target */
      var ox = 0, oy = 0; /* eased offset */

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5); /* perf cap */
        w = doc.documentElement.clientWidth || window.innerWidth;
        h = doc.documentElement.clientHeight || window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        layers.forEach(function (L) {
          L.cols = Math.ceil(w / L.size) + 1;
          L.drops = new Array(L.cols);
          for (var i = 0; i < L.cols; i++) {
            L.drops[i] = (L.drops[i] === undefined ? Math.random() * -60 : L.drops[i]);
          }
        });
      }

      function frame(t) {
        if (!running) return;
        if (t - lastFrame < 50) { rafId = requestAnimationFrame(frame); return; }
        lastFrame = t;
        /* Parallax easing */
        ox += (mx - ox) * 0.05;
        oy += (my - oy) * 0.05;
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(0, 0, w, h);
        layers.forEach(function (L, li) {
          ctx.font = L.size + "px ui-monospace, Menlo, monospace";
          ctx.fillStyle = 'rgba(88,196,122,' + L.alpha + ')';
          var shift = (li + 1) * 6;
          for (var i = 0; i < L.cols; i++) {
            var ch = chars.charAt(Math.floor(Math.random() * chars.length));
            var x = i * L.size + ox * shift;
            var y = L.drops[i] * L.size + oy * shift;
            ctx.fillText(ch, x, y);
            if (y > h + L.size && Math.random() > 0.976) L.drops[i] = 0;
            L.drops[i] += L.speed;
          }
        });
        rafId = requestAnimationFrame(frame);
      }

      doc.addEventListener('mousemove', function (e) {
        mx = (e.clientX / w - 0.5) * 2;
        my = (e.clientY / h - 0.5) * 2;
      }, { passive: true });

      rain = {
        start: function () { if (running) return; running = true; lastFrame = 0; rafId = requestAnimationFrame(frame); },
        stop: function () { running = false; if (rafId) cancelAnimationFrame(rafId); }
      };
      resize();
      window.addEventListener('resize', function () { resize(); }, { passive: true });
      /* Pause when the tab is hidden (perf + battery) */
      doc.addEventListener('visibilitychange', function () {
        if (doc.hidden) rain.stop();
        else rain.start();
      });
      /* The rain is the room: start it behind the entry gate so the
         visitor sees the universe before they step into it. */
      rain.start();
    })();
  }

  /* -------------------- 2. Terminal -------------------- */
  var out = doc.getElementById('mxOut');
  var input = doc.getElementById('mxIn');
  var gate = doc.getElementById('mxGate');
  var gateOpen = false;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function print(html) {
    var div = doc.createElement('div');
    div.innerHTML = html; /* html is built from static strings only */
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function typed(text, done) {
    if (reducedMotion) { print(esc(text)); if (done) done(); return; }
    var div = doc.createElement('div');
    out.appendChild(div);
    var i = 0;
    function step() {
      i += 2;
      div.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(step, 12);
      else { out.scrollTop = out.scrollHeight; if (done) done(); }
    }
    step();
  }

  var COMMANDS = {
    help: 'available commands:\n  help        this list\n  whoami      who runs this site\n  skills      capability summary\n  projects    what was built in the lab\n  automation  the AI workflow pipeline page\n  contact     how to reach a human\n  clear       wipe the terminal',
    whoami: 'Rahil Sahu — Application Security Engineer, Indore, India.\n4+ years of VAPT and product security. Sole security owner of a RegTech SaaS.\n700+ validated findings. CEH Practical.',
    skills: 'VAPT (web / API / mobile / network) · OWASP Top 10 · security architecture review\nSecure SDLC (SAST / DAST / SCA) · Wazuh SIEM · Cloudflare WAF\nSentinelOne EDR/CSPM · DefectDojo · Azure / AWS · GoPhish phishing sims',
    projects: 'StudyFree GPT · Bulk URL Checker · Malicious File Generator\nRLO Filename Spoof Generator · File Size Inflator\nAd Blocker Extension · Meeting Attendance Recorder\nFull write-ups on the home page: /#projects',
    automation: 'TPRM questionnaires · VAPT recon pipelines · DevSecOps in CI\nemail triage + drafting · social media content pipeline · phishing ops\nEvery pipeline ends at a human review gate. See: automation.html',
    contact: 'rahilsahu2000@gmail.com\nlinkedin.com/in/rahilsahu · github.com/RahilSahu\nResponse within ~48h (IST business days).'
  };

  function run(cmd) {
    print('<span class="mx-prompt">neo@construct:~$</span> ' + esc(cmd));
    var c = cmd.trim().toLowerCase();
    if (!c) return;
    if (c === 'clear') { out.innerHTML = ''; return; }
    if (COMMANDS[c]) {
      if (c === 'automation') typed(COMMANDS[c] + '\n(redirecting you to the pipeline page…)', function () {
        window.location.href = 'automation.html';
      });
      else typed(COMMANDS[c]);
    } else {
      typed('command not found: ' + c + ' — try "help"');
    }
  }

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var v = input.value;
        input.value = '';
        run(v);
      }
    });
  }

  /* -------------------- 3. Entry gate -------------------- */
  var jackin = doc.getElementById('mxJackin');
  function enter() {
    if (gateOpen) return;
    gateOpen = true;
    if (gate) gate.classList.add('is-open');
    rain.start();
    if (input) {
      input.disabled = false;
      setTimeout(function () { input.focus({ preventScroll: true }); }, 650);
    }
    typed('Knock, knock. The construct is loading…');
    setTimeout(function () { typed('Type "help" to begin.'); }, 900);
  }
  if (jackin) jackin.addEventListener('click', enter);
  /* Keyboard-accessible entry without a click */
  doc.addEventListener('keydown', function (e) {
    if (!gateOpen && e.key === 'Enter' && doc.activeElement === jackin) enter();
  });
})();
