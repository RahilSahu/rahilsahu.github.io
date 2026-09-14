/* =============================================================
   Rahil Sahu — contact.js
   ADDITIVE. Makes #engagementForm actually deliver mail.

   Load AFTER main.js. main.js validates on submit; this runs next,
   sees the form passed validation, cancels the mailto: navigation and
   posts to your endpoint instead.

   With JS disabled the form still falls back to the mailto: action
   already in the markup, so nothing regresses.

   ---------------------------------------------------------------
   SETUP — pick ONE provider below and fill in PROVIDER.
   ---------------------------------------------------------------

   A · Web3Forms  (fastest — no account, free, ~2 minutes)
       1. Go to web3forms.com, enter rahilsahu2000@gmail.com
       2. They email you an access key. Paste it into `key` below.
       3. Set mode to 'web3forms'.
       4. CSP: add https://api.web3forms.com to connect-src.

   B · Formspree  (free tier, 50 submissions/month)
       1. Create a form at formspree.io, copy the form ID.
       2. Set mode to 'formspree', url to https://formspree.io/f/YOUR_ID
       3. CSP: add https://formspree.io to connect-src.

   C · Your own Cloudflare Worker  (no third party holds the data)
       See contact-worker.js. Set mode to 'worker' and url to the
       Worker URL. CSP: add that origin to connect-src.
   ============================================================= */

(function () {
  'use strict';

  var PROVIDER = {
    mode: 'web3forms',                     /* 'web3forms' | 'formspree' | 'worker' */
    key:  '6101c342-91c6-40d1-8430-a9251d0bbce7',  /* Web3Forms access key — public by design */
    url:  '',                              /* Formspree / Worker only */
    to:   'rahilsahu2000@gmail.com'        /* used for the failure fallback link */
  };

  /* Reject anything submitted faster than a human could type it. */
  var MIN_FILL_MS = 3000;
  /* One submission per minute from the same browser. */
  var COOLDOWN_MS = 60000;

  var doc = document;
  var form = doc.getElementById('engagementForm');
  if (!form) return;

  var note = doc.getElementById('formNote');
  var button = form.querySelector('button[type="submit"]');
  var loadedAt = Date.now();
  var sending = false;

  function say(msg, kind) {
    if (!note) return;
    note.textContent = msg;
    note.classList.remove('is-ok', 'is-err');
    if (kind) note.classList.add(kind);
  }

  function busy(on, label) {
    sending = on;
    if (!button) return;
    button.disabled = on;
    if (on) {
      button.setAttribute('data-label', button.textContent);
      button.textContent = label || 'Sending…';
    } else {
      var prev = button.getAttribute('data-label');
      if (prev) button.textContent = prev;
      button.removeAttribute('data-label');
    }
  }

  function val(sel) {
    var n = form.querySelector(sel);
    return n ? String(n.value || '').trim() : '';
  }

  function configured() {
    if (PROVIDER.mode === 'web3forms') {
      return PROVIDER.key && PROVIDER.key.indexOf('PASTE_') !== 0;
    }
    return !!PROVIDER.url;
  }

  function cooling() {
    try {
      var last = parseInt(window.localStorage.getItem('rs-contact-last'), 10);
      if (isFinite(last) && Date.now() - last < COOLDOWN_MS) {
        return Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
      }
    } catch (e) { /* storage blocked — allow */ }
    return 0;
  }

  function stampSent() {
    try { window.localStorage.setItem('rs-contact-last', String(Date.now())); }
    catch (e) { /* ignore */ }
  }

  /* A prefilled mail link, so a failed POST never loses the lead. */
  function fallbackLink(payload) {
    if (!note) return;
    var subject = 'Engagement enquiry — ' + payload.scope;
    var body =
      'Name: ' + payload.name + '\n' +
      'Email: ' + payload.email + '\n' +
      'Organisation: ' + (payload.organisation || '—') + '\n' +
      'Scope: ' + payload.scope + '\n\n' +
      payload.message;

    var a = doc.createElement('a');
    a.href = 'mailto:' + PROVIDER.to +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    a.textContent = 'send it by email instead';
    a.className = 'form-fallback';

    note.textContent = 'That didn\u2019t go through. You can ';
    note.appendChild(a);
    note.appendChild(doc.createTextNode('.'));
    note.classList.remove('is-ok');
    note.classList.add('is-err');
  }

  function buildRequest(p) {
    var subject = 'Engagement enquiry — ' + p.scope + ' — ' + p.name;

    if (PROVIDER.mode === 'formspree') {
      return {
        url: PROVIDER.url,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: {
          name: p.name,
          email: p.email,
          organisation: p.organisation,
          scope: p.scope,
          message: p.message,
          _subject: subject,
          _replyto: p.email
        }
      };
    }

    if (PROVIDER.mode === 'worker') {
      return {
        url: PROVIDER.url,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: p
      };
    }

    /* Web3Forms */
    return {
      url: 'https://api.web3forms.com/submit',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: {
        access_key: PROVIDER.key,
        subject: subject,
        from_name: 'rahilsahu.github.io',
        name: p.name,
        email: p.email,
        replyto: p.email,
        organisation: p.organisation || '—',
        scope: p.scope,
        message: p.message,
        botcheck: ''
      }
    };
  }

  form.addEventListener('submit', function (ev) {
    /* main.js already rejected it — leave its message on screen. */
    if (ev.defaultPrevented) return;

    ev.preventDefault();
    if (sending) return;

    /* Honeypot: pretend it worked, send nothing. */
    var hp = form.querySelector('input[name="website"]');
    if (hp && hp.value) {
      say('Thanks — your brief is in. I\u2019ll reply within 48 hours.', 'is-ok');
      form.reset();
      return;
    }

    if (Date.now() - loadedAt < MIN_FILL_MS) {
      say('Hold on a moment, then send again.', 'is-err');
      return;
    }

    var left = cooling();
    if (left) {
      say('Already sent. Try again in ' + left + 's, or email me directly.', 'is-err');
      return;
    }

    var payload = {
      name: val('#f-name'),
      email: val('#f-email'),
      organisation: val('#f-org'),
      scope: val('#f-scope'),
      message: val('#f-msg'),
      page: 'rahilsahu.github.io'
    };

    if (!configured()) {
      say('Form endpoint isn\u2019t configured yet.', 'is-err');
      fallbackLink(payload);
      return;
    }

    var req = buildRequest(payload);
    busy(true);
    say('Sending your brief…', null);

    var timeout = window.setTimeout(function () {
      if (sending) { busy(false); fallbackLink(payload); }
    }, 15000);

    fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body)
    })
      .then(function (res) {
        return res.json().catch(function () { return { success: res.ok }; });
      })
      .then(function (data) {
        window.clearTimeout(timeout);
        busy(false);
        var ok = data && (data.success === true || data.ok === true || !data.errors);
        if (!ok) throw new Error('rejected');
        stampSent();
        say('Thanks — your brief is in. I\u2019ll reply within 48 hours.', 'is-ok');
        form.reset();
        loadedAt = Date.now();
      })
      .catch(function () {
        window.clearTimeout(timeout);
        busy(false);
        fallbackLink(payload);
      });
  });
})();
