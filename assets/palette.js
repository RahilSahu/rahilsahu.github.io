/* ============================================================
   Command palette — Ctrl/⌘+K site-wide navigation & actions.
   Standalone: no dependencies, safe to load on every page.
   ============================================================ */
(function () {
  'use strict';

  var EMAIL = 'rahilsahu2000@gmail.com';
  var isHome = /(^|\/)index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);

  function el(id) { return document.getElementById(id); }
  function go(hash) {
    if (isHome && el(hash.slice(1))) {
      el(hash.slice(1)).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      location.href = 'index.html' + hash;
    }
  }
  function clickIf(id) { var b = el(id); if (b) b.click(); return !!b; }
  function copyEmail() {
    var done = function () { showFlash('Email copied — talk soon.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(done, function () { fallbackCopy(); });
    } else { fallbackCopy(); }
    function fallbackCopy() {
      var t = document.createElement('textarea');
      t.value = EMAIL; t.className = 'clipboard-helper';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* noop */ }
      document.body.removeChild(t);
    }
  }
  function showFlash(msg) {
    var f = document.createElement('div');
    f.textContent = msg;
    f.setAttribute('role', 'status');
    f.className = 'palette-flash';
    document.body.appendChild(f);
    setTimeout(function () { f.classList.add('is-gone'); }, 1600);
    setTimeout(function () { f.remove(); }, 2100);
  }

  var sections = [
    ['practice', 'Practice areas'], ['experience', 'Experience'], ['projects', 'Projects'],
    ['toolchain', 'Toolchain'], ['credentials', 'Credentials'], ['playground', 'Playground'],
    ['learn', 'Learn'], ['ai-sec', 'AI & automation'], ['engagement', 'Contact']
  ];
  var commands = [];

  sections.forEach(function (s) {
    commands.push({
      kicker: 'go to', title: s[1],
      run: function () { go('#' + s[0]); }
    });
  });

  commands.push(
    { kicker: 'go to', title: 'Home', run: function () { location.href = 'index.html'; } },
    { kicker: 'go to', title: 'Security lab', run: function () { location.href = 'lab.html'; } },
    { kicker: 'go to', title: 'AI workflow automation', run: function () { location.href = 'automation.html'; } },
    { kicker: 'go to', title: 'Matrix terminal', run: function () { location.href = 'matrix.html'; } },
    { kicker: 'action', title: 'Copy email address', run: copyEmail },
    { kicker: 'action', title: 'Download résumé (PDF)', run: function () { location.href = 'resume.pdf'; } },
    { kicker: 'action', title: 'Back to top', run: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); } }
  );
  if (el('themeToggle')) {
    commands.push({ kicker: 'action', title: 'Toggle colour theme', run: function () { clickIf('themeToggle'); } });
  }
  if (el('fxToggle')) {
    commands.push({ kicker: 'action', title: 'Toggle matrix rain effect', run: function () { clickIf('fxToggle'); } });
  }

  /* ---- DOM ---- */
  var backdrop = document.createElement('div');
  backdrop.className = 'palette-backdrop';
  backdrop.innerHTML =
    '<div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">' +
      '<input class="palette-input" type="text" placeholder="Type a command or search…" ' +
        'aria-label="Command palette" autocomplete="off" spellcheck="false">' +
      '<ul class="palette-list" role="listbox" aria-label="Commands"></ul>' +
      '<div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>' +
      '<span><kbd>↵</kbd> run</span><span><kbd>esc</kbd> close</span></div>' +
    '</div>';
  document.body.appendChild(backdrop);

  var input = backdrop.querySelector('.palette-input');
  var list = backdrop.querySelector('.palette-list');
  var filtered = commands.slice();
  var activeIdx = 0;
  var isOpen = false;
  var lastFocus = null;

  function render() {
    list.innerHTML = '';
    if (!filtered.length) {
      var empty = document.createElement('li');
      empty.className = 'palette-empty';
      empty.textContent = 'No matching command.';
      list.appendChild(empty);
      return;
    }
    filtered.forEach(function (cmd, i) {
      var li = document.createElement('li');
      li.className = 'palette-item' + (i === activeIdx ? ' is-active' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
      var k = document.createElement('span');
      k.className = 'palette-kicker'; k.textContent = cmd.kicker;
      var t = document.createElement('span'); t.textContent = cmd.title;
      li.appendChild(k); li.appendChild(t);
      li.addEventListener('click', function () { run(i); });
      li.addEventListener('mousemove', function () {
        if (activeIdx !== i) { activeIdx = i; highlight(); }
      });
      list.appendChild(li);
    });
  }
  function highlight() {
    var items = list.querySelectorAll('.palette-item');
    items.forEach(function (li, i) {
      li.classList.toggle('is-active', i === activeIdx);
      li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
    });
    var active = items[activeIdx];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
  }
  function filter(q) {
    q = q.trim().toLowerCase();
    filtered = commands.filter(function (c) {
      return (c.kicker + ' ' + c.title).toLowerCase().indexOf(q) !== -1;
    });
    activeIdx = 0;
    render();
  }
  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    backdrop.classList.add('is-open');
    input.value = ''; filter('');
    setTimeout(function () { input.focus(); }, 30);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('is-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function run(i) {
    var cmd = filtered[i];
    close();
    if (cmd) { setTimeout(function () { cmd.run(); }, 60); }
  }

  input.addEventListener('input', function () { filter(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (filtered.length) { activeIdx = (activeIdx + 1) % filtered.length; highlight(); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (filtered.length) { activeIdx = (activeIdx - 1 + filtered.length) % filtered.length; highlight(); } }
    else if (e.key === 'Enter') { e.preventDefault(); run(activeIdx); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen ? close() : open(); }
    else if (e.key === 'Escape' && isOpen) { close(); }
  });

  render();
})();
