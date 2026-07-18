/* ============================================================
   PIER PRIVATE LINKS — pier-privatelinks-hidden.js
   Builds a "disguised" bookmark that looks like a normal link,
   but silently carries a locked-link fragment. A companion
   bookmarklet (self-contained, works on any site) reads that
   fragment and redirects to the real unlock page — or to a
   harmless decoy if there's nothing to unlock.
============================================================ */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(message) {
    var el = $('pl-toast');
    el.innerHTML = message;
    el.style.opacity = '1';
  }

  // Builds the bookmarklet href. Kept separate from any inline page script
  // since it must run standalone, in the context of whatever site the
  // disguised bookmark points to — it cannot depend on this page's JS.
  function buildBookmarklet(decoyUrl) {
    var decoy = JSON.stringify(decoyUrl);
    var body = [
      '(function(){',
      'try{',
      'var h=location.hash.slice(1).replace(/-/g,"+").replace(/_/g,"/");',
      'while(h.length%4)h+="=";',
      'var json=decodeURIComponent(escape(atob(h)));',
      'var p=JSON.parse(json);',
      'if(p.unencrypted){location.href=p.url;}',
      'else{location.href="https://piererra.pages.dev/tools/private-links/"+location.hash;}',
      '}catch(e){location.replace(' + decoy + ');}',
      '})();'
    ].join('');
    return 'javascript:' + body;
  }

  function refreshBookmarkletHref() {
    var decoyInput = $('pl-decoy-url');
    var decoy = 'https://gmail.com';
    try {
      var u = new URL(decoyInput.value);
      decoy = u.toString();
    } catch (e) { /* keep default */ }
    $('pl-decrypt-bookmark').setAttribute('href', buildBookmarklet(decoy));
  }

  function onHide() {
    var hiddenUrl;
    try {
      hiddenUrl = new URL($('pl-hidden-url').value);
    } catch (e) {
      toast('The hidden link is not valid — make sure it includes https://');
      return;
    }

    var bookmarkUrl;
    try {
      bookmarkUrl = new URL($('pl-bookmark-url').value);
    } catch (e) {
      toast('The disguise URL is not valid — make sure it includes https://');
      return;
    }

    var hash = hiddenUrl.hash.slice(1);
    try {
      PierPL.parseFragment(hash);
    } catch (e) {
      toast('The hidden link doesn\'t look like a valid Private Links URL. Create one on the main page first.');
      return;
    }

    bookmarkUrl.hash = hiddenUrl.hash;

    var output = $('pl-output');
    output.setAttribute('href', bookmarkUrl.toString());
    output.setAttribute('aria-disabled', 'false');
    output.textContent = $('pl-bookmark-title').value || 'Disguised bookmark';

    toast('Disguised bookmark created below — drag it to your bookmarks bar.');
    $('pl-output-block').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function randomDecoyLink() {
    try {
      var res = await fetch(
        'https://en.wikipedia.org/w/api.php?format=json&action=query' +
        '&generator=random&grnnamespace=0&prop=info&inprop=url&origin=*'
      );
      var data = await res.json();
      var pages = data.query.pages;
      var page = pages[Object.keys(pages)[0]];
      $('pl-bookmark-url').value = page.canonicalurl;
      $('pl-bookmark-title').value = page.title;
    } catch (e) {
      toast('Could not fetch a random page — check your connection.');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash) {
      $('pl-hidden-url').value = window.location.origin + '/tools/private-links/#' + window.location.hash.slice(1);
      history.replaceState(null, '', window.location.pathname);
    }

    refreshBookmarkletHref();

    $('pl-hide-btn').addEventListener('click', onHide);
    $('pl-random-btn').addEventListener('click', randomDecoyLink);
    $('pl-decoy-url').addEventListener('change', refreshBookmarkletHref);
  });
})();
