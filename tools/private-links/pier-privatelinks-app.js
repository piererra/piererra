/* ============================================================
   PIER PRIVATE LINKS — pier-privatelinks-app.js
   Handles both modes of the main page:
     - No URL fragment  -> show the "create a locked link" form
     - URL fragment present -> show the password prompt and
       redirect to the original URL on success
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(el, message, kind) {
    el.textContent = message;
    el.className = 'pier-pl-toast' + (kind ? ' pier-pl-toast--' + kind : '');
    el.style.opacity = '1';
  }

  function highlightAndSelect(el) {
    el.focus();
    el.select();
    if (el.setSelectionRange) el.setSelectionRange(0, el.value.length + 1);
    return el;
  }

  /* ---------------------------------------------------------
     CREATE MODE
  --------------------------------------------------------- */
  function initCreate() {
    var section = $('pl-create');
    section.hidden = false;

    var toastEl = $('pl-create-toast');

    function validate() {
      var urlInput = $('pl-url');
      try {
        var u = new URL(urlInput.value);
        if (!(u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'magnet:')) {
          toast(toastEl, 'Only http(s) and magnet links are allowed.', 'err');
          return false;
        }
      } catch (e) {
        toast(toastEl, 'Enter a valid URL, including https://', 'err');
        return false;
      }

      var pass = $('pl-password').value;
      var confirm = $('pl-confirm-password').value;
      if (pass.length === 0) {
        toast(toastEl, 'Enter a password.', 'err');
        return false;
      }
      if (pass !== confirm) {
        toast(toastEl, 'Passwords do not match.', 'err');
        return false;
      }
      return true;
    }

    async function generateFragment(url, password, hint, useRandomSalt, useRandomIv) {
      var api = PierPL.versions[PierPL.LATEST_VERSION];
      var salt = useRandomSalt ? await api.randomSalt() : null;
      var iv = useRandomIv ? await api.randomIv() : null;
      var encrypted = await api.encrypt(url, password, salt, iv);

      var output = {
        v: PierPL.LATEST_VERSION,
        e: PierPL.b64.binaryToBase64(new Uint8Array(encrypted))
      };
      if (hint) output.h = hint;
      if (useRandomSalt) output.s = PierPL.b64.binaryToBase64(salt);
      if (useRandomIv) output.i = PierPL.b64.binaryToBase64(iv);

      return PierPL.b64.encode(JSON.stringify(output));
    }

    $('pl-encrypt-btn').addEventListener('click', async function () {
      if (!validate()) return;

      var url = $('pl-url').value;
      var password = $('pl-password').value;
      var hint = $('pl-hint').value;
      var useRandomIv = $('pl-iv-random').checked;
      var useRandomSalt = $('pl-salt-random').checked;

      var fragment = await generateFragment(url, password, hint, useRandomSalt, useRandomIv);
      var base = window.location.origin + window.location.pathname;
      var output = base + '#' + fragment;

      $('pl-output').value = output;
      $('pl-output-block').hidden = false;
      $('pl-open-link').href = output;
      $('pl-hidden-link').href = 'hidden/#' + fragment;

      highlightAndSelect($('pl-output'));
      toast(toastEl, 'Locked link generated below.', 'ok');

      $('pl-output-block').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('pl-copy-btn').addEventListener('click', function () {
      var out = highlightAndSelect($('pl-output'));
      try {
        document.execCommand('copy');
        toast(toastEl, 'Copied ' + out.value.length + ' characters.', 'ok');
      } catch (e) {
        toast(toastEl, 'Copy failed — select and copy manually.', 'err');
      }
      out.blur();
    });

    $('pl-iv-random').addEventListener('click', function (e) {
      if (!e.target.checked) {
        var ok = confirm(
          'Only disable initialization vector randomization if you know what ' +
          'you are doing. Disabling this weakens the security of your locked ' +
          'link, and only saves a handful of characters.\n\nPress Cancel unless ' +
          'you are sure.'
        );
        e.target.checked = !ok;
      }
    });
  }

  /* ---------------------------------------------------------
     UNLOCK MODE
  --------------------------------------------------------- */
  function initUnlock() {
    var section = $('pl-unlock');
    section.hidden = false;

    var hash = window.location.hash.slice(1);
    var params;
    try {
      params = PierPL.parseFragment(hash);
    } catch (e) {
      showUnlockError('This link appears corrupted or uses an unsupported format.');
      return;
    }

    if (params.h) {
      $('pl-unlock-hint').textContent = 'Hint: ' + params.h;
      $('pl-unlock-hint').hidden = false;
    }

    var passwordInput = $('pl-unlock-password');
    passwordInput.focus();
    passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') $('pl-unlock-btn').click();
    });

    $('pl-unlock-btn').addEventListener('click', async function () {
      var password = passwordInput.value;
      var url;
      try {
        url = await PierPL.decryptParams(params, password);
      } catch (e) {
        showUnlockError('Incorrect password.', hash);
        return;
      }

      if (!PierPL.isSafeUrl(url)) {
        showUnlockError('The decrypted destination is not a valid http(s)/magnet link, so redirecting was blocked.');
        return;
      }

      // Use .href (not .replace) so bookmarked hidden links do not leak
      // their unlocked destination in browser history/tab icon caching.
      window.location.href = url;
    });
  }

  function showUnlockError(message, hash) {
    $('pl-unlock-form').hidden = true;
    var errBox = $('pl-unlock-error');
    errBox.hidden = false;
    $('pl-unlock-error-text').textContent = message;

    if (hash) {
      $('pl-unlock-decrypt-link').href = 'decrypt/#' + hash;
      $('pl-unlock-hidden-link').href = 'hidden/#' + hash;
      $('pl-unlock-error-links').hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash) {
      initUnlock();
    } else {
      initCreate();
    }
  });
})();
