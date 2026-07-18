/* ============================================================
   PIER PRIVATE LINKS — pier-privatelinks-decrypt.js
   Lets someone paste a locked link and see the decrypted
   destination without ever being redirected there.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(message, kind) {
    var el = $('pl-toast');
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

  async function onDecrypt() {
    var urlText = $('pl-encrypted-url').value;
    var url;
    try {
      url = new URL(urlText);
    } catch (e) {
      toast('Enter a valid locked link, including https://', 'err');
      return;
    }

    var params;
    try {
      params = PierPL.parseFragment(url.hash.slice(1));
    } catch (e) {
      toast('That link appears corrupted or unsupported.', 'err');
      return;
    }

    var password = $('pl-password').value;
    var decrypted;
    try {
      decrypted = await PierPL.decryptParams(params, password);
    } catch (e) {
      toast('Incorrect password.', 'err');
      return;
    }

    $('pl-output-block').hidden = false;
    $('pl-output').value = decrypted;
    $('pl-open-link').href = decrypted;
    toast('Decrypted successfully.', 'ok');
    highlightAndSelect($('pl-output'));
  }

  function onCopy() {
    var out = highlightAndSelect($('pl-output'));
    try {
      document.execCommand('copy');
      toast('Copied ' + out.value.length + ' characters.', 'ok');
    } catch (e) {
      toast('Copy failed — select and copy manually.', 'err');
    }
    out.blur();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash) {
      $('pl-encrypted-url').value = window.location.origin + '/tools/private-links/#' + window.location.hash.slice(1);
    }

    $('pl-decrypt-btn').addEventListener('click', onDecrypt);
    $('pl-copy-btn').addEventListener('click', onCopy);
  });
})();
