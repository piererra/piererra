/* ============================================================
   PIER PRIVATE LINKS — pier-privatelinks-bruteforce.js
   Educational proof-of-concept: tries every password in a
   given character set, shortest first, until one decrypts
   successfully. Unoptimized by design — this exists to
   demonstrate why long, random passwords matter.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(message) {
    var el = $('pl-toast');
    el.textContent = message;
    el.style.opacity = '1';
  }

  function onStart() {
    if (!('subtle' in window.crypto)) {
      toast('window.crypto.subtle is unavailable — reload over HTTPS.');
      return;
    }

    var urlText = $('pl-encrypted-url').value;
    var url;
    try {
      url = new URL(urlText);
    } catch (e) {
      toast('Enter a valid locked link, including https://');
      return;
    }

    var params;
    try {
      params = PierPL.parseFragment(url.hash.slice(1));
    } catch (e) {
      toast('That link appears corrupted or unsupported.');
      return;
    }

    var api = PierPL.versions[params.v];
    var encrypted = PierPL.b64.base64ToBinary(params.e);
    var salt = 's' in params ? PierPL.b64.base64ToBinary(params.s) : null;
    var iv = 'i' in params ? PierPL.b64.base64ToBinary(params.i) : null;

    var charset = $('pl-charset').value.split('');
    if (charset.length === 0) {
      toast('Charset cannot be empty.');
      return;
    }

    var progress = { tried: 0, total: 0, len: 0, overallTried: 0, done: false, startTime: performance.now() };

    async function tryLength(prefix, targetLen, curLen) {
      if (progress.done) return;
      if (curLen === targetLen) {
        progress.tried++;
        try {
          await api.decrypt(encrypted, prefix, salt, iv);
          $('pl-output').value = prefix;
          progress.done = true;
          toast('Password found!');
        } catch (e) { /* wrong password, keep trying */ }
        return;
      }
      for (var i = 0; i < charset.length && !progress.done; i++) {
        await tryLength(prefix + charset[i], targetLen, curLen + 1);
      }
    }

    function updateProgress() {
      if (progress.done) return;
      var elapsedMs = performance.now() - progress.startTime;
      var totalTried = progress.overallTried + progress.tried;
      var rate = Math.round(1000 * totalTried / elapsedMs);
      var pct = progress.total ? Math.round(1000 * progress.tried / progress.total) / 10 : 0;
      $('pl-progress').textContent =
        'Trying ' + progress.total + ' passwords of length ' + progress.len +
        ' — ' + pct + '% complete. ~' + rate + ' passwords/sec.';
    }

    (async function run() {
      for (var len = 0; !progress.done; len++) {
        progress.overallTried += progress.tried;
        progress.tried = 0;
        progress.total = Math.pow(charset.length, len);
        progress.len = len;
        updateProgress();
        await tryLength('', len, 0);
      }
    })();

    var interval = setInterval(function () {
      updateProgress();
      if (progress.done) clearInterval(interval);
    }, 2000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('pl-start-btn').addEventListener('click', onStart);
  });
})();
