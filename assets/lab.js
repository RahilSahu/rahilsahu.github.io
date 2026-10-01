/* ============================================================
   Security lab — five client-side tools. No network, no storage.
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function setOut(id, html, isErr) {
    var o = $(id);
    o.classList.toggle('is-err', !!isErr);
    o.innerHTML = html;
  }

  /* ---------- 1 · Password strength ---------- */
  var pwIn = $('lab-pw-in');
  if (pwIn) {
    pwIn.addEventListener('input', function () {
      var pw = pwIn.value;
      var out = $('lab-pw-out');
      if (!pw) { out.textContent = ''; return; }
      var pool = 0, hasUni = false;
      if (/[a-z]/.test(pw)) pool += 26;
      if (/[A-Z]/.test(pw)) pool += 26;
      if (/[0-9]/.test(pw)) pool += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) {
        var uni = /[^\x00-\x7F]/.test(pw);
        hasUni = uni;
        pool += uni ? 1000 : 32;
      }
      var entropy = pw.length * Math.log2(pool || 1);
      var verdict, cls;
      if (entropy < 28) { verdict = 'very weak'; cls = 'bad'; }
      else if (entropy < 40) { verdict = 'weak'; cls = 'bad'; }
      else if (entropy < 60) { verdict = 'fair'; cls = 'warn'; }
      else if (entropy < 80) { verdict = 'strong'; cls = 'ok'; }
      else { verdict = 'excellent'; cls = 'ok'; }
      var secs = Math.pow(2, entropy - 1) / 1e10; // illustrative: 10B guesses/sec
      setOut('lab-pw-out',
        'Entropy <strong>' + entropy.toFixed(1) + ' bits</strong> — <span class="' + cls + '">' + verdict + '</span><br>' +
        '<span class="lab-muted">Illustrative offline crack time: ' + esc(humanTime(secs)) + '</span>' +
        (hasUni ? '<br><span class="lab-muted">Unicode widens the pool; support varies by system.</span>' : ''));
    });
  }
  function humanTime(s) {
    if (!isFinite(s)) return 'heat death of the universe';
    var units = [[31557600, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds']];
    for (var i = 0; i < units.length; i++) {
      if (s >= units[i][0]) {
        var v = s / units[i][0];
        return (v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + units[i][1];
      }
    }
    return 'instantly';
  }

  /* ---------- 2 · Hash generator ---------- */
  var hashGo = $('lab-hash-go');
  if (hashGo) {
    hashGo.addEventListener('click', function () {
      var text = $('lab-hash-in').value;
      var algo = $('lab-hash-algo').value;
      if (!text) { setOut('lab-hash-out', 'Enter some text first.', true); return; }
      if (!window.crypto || !crypto.subtle) { setOut('lab-hash-out', 'Web Crypto unavailable in this browser.', true); return; }
      setOut('lab-hash-out', 'hashing…');
      crypto.subtle.digest(algo, new TextEncoder().encode(text)).then(function (buf) {
        var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
        setOut('lab-hash-out', esc(algo) + '<br>' + esc(hex));
      }).catch(function () { setOut('lab-hash-out', 'Hashing failed.', true); });
    });
  }

  /* ---------- 3 · Base64 codec ---------- */
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(b64.replace(/\s+/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  var b64Enc = $('lab-b64-enc'), b64Dec = $('lab-b64-dec');
  if (b64Enc) {
    b64Enc.addEventListener('click', function () {
      var v = $('lab-b64-in').value;
      if (!v) { setOut('lab-b64-out', 'Enter some text first.', true); return; }
      try { setOut('lab-b64-out', esc(b64encode(v))); }
      catch (e) { setOut('lab-b64-out', 'Encoding failed.', true); }
    });
    b64Dec.addEventListener('click', function () {
      var v = $('lab-b64-in').value;
      if (!v) { setOut('lab-b64-out', 'Enter some base64 first.', true); return; }
      try { setOut('lab-b64-out', esc(b64decode(v))); }
      catch (e) { setOut('lab-b64-out', 'Invalid base64 input.', true); }
    });
  }

  /* ---------- 4 · JWT inspector ---------- */
  var jwtGo = $('lab-jwt-go');
  if (jwtGo) {
    jwtGo.addEventListener('click', function () {
      var t = $('lab-jwt-in').value.trim();
      if (!t) { setOut('lab-jwt-out', 'Paste a token first.', true); return; }
      var parts = t.split('.');
      if (parts.length !== 3) { setOut('lab-jwt-out', 'Not a JWT — expected three base64url segments.', true); return; }
      try {
        var header = JSON.parse(b64decode(urlToB64(parts[0])));
        var payload = JSON.parse(b64decode(urlToB64(parts[1])));
        var out = 'header:\n' + JSON.stringify(header, null, 2) +
          '\n\npayload:\n' + JSON.stringify(payload, null, 2) +
          '\n\nsignature: ' + parts[2].slice(0, 16) + '… (shown, not verified)';
        var pre = $('lab-jwt-out');
        pre.classList.remove('is-err');
        pre.textContent = out;
      } catch (e) { setOut('lab-jwt-out', 'Could not decode — check the token format.', true); }
    });
  }
  function urlToB64(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return s;
  }

  /* ---------- 5 · Subnet calculator ---------- */
  var cidrGo = $('lab-cidr-go');
  if (cidrGo) {
    var runCidr = function () {
      var v = $('lab-cidr-in').value.trim();
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec(v);
      if (!m) { setOut('lab-cidr-out', 'Use the form 192.168.1.10/24', true); return; }
      var oct = m.slice(1, 5).map(Number);
      var prefix = Number(m[5]);
      if (oct.some(function (o) { return o > 255; }) || prefix > 32) {
        setOut('lab-cidr-out', 'Octets must be 0–255 and prefix 0–32.', true); return;
      }
      var ip = ((oct[0] << 24) | (oct[1] << 16) | (oct[2] << 8) | oct[3]) >>> 0;
      var mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
      var net = (ip & mask) >>> 0;
      var bcast = (net | (~mask >>> 0)) >>> 0;
      var lines = [
        'network:   ' + fmt(net) + '/' + prefix,
        'broadcast: ' + fmt(bcast)
      ];
      if (prefix === 32) {
        lines.push('usable:    ' + fmt(net) + ' (single host)');
      } else if (prefix === 31) {
        lines.push('usable:    ' + fmt(net) + ' – ' + fmt(bcast) + ' (2 hosts, RFC 3021)');
      } else {
        var count = Math.pow(2, 32 - prefix) - 2;
        lines.push('usable:    ' + fmt(net + 1) + ' – ' + fmt(bcast - 1));
        lines.push('hosts:     ' + count.toLocaleString('en-US'));
      }
      setOut('lab-cidr-out', esc(lines.join('\n')).replace(/\n/g, '<br>'));
    };
    cidrGo.addEventListener('click', runCidr);
    $('lab-cidr-in').addEventListener('keydown', function (e) { if (e.key === 'Enter') runCidr(); });
  }
  function fmt(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
})();
