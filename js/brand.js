/* Brand guidelines: copy-to-clipboard swatches, type tester, colour token download, chapter scrollspy, reveals. */
(function () {
  'use strict';
  var page = document.querySelector('.bd-page');
  if (!page) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal */
  var items = Array.prototype.slice.call(page.querySelectorAll('[data-bd-reveal]'));
  if (!reduce && 'IntersectionObserver' in window && items.length) {
    page.classList.add('bd-anim');
    var counts = new Map();
    items.forEach(function (el) {
      var key = el.parentElement;
      var n = counts.get(key) || 0;
      el.style.setProperty('--bd-d', Math.min(n, 7) * 0.06 + 's');
      counts.set(key, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
  }

  /* Clipboard helper with fallback */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  function announce(el, msg) {
    if (!el) return;
    el.textContent = '';
    setTimeout(function () { el.textContent = msg; }, 30);
  }

  /* Swatches */
  var copyStatus = document.getElementById('bd-copy-status');
  Array.prototype.forEach.call(page.querySelectorAll('.bd-swatch'), function (btn) {
    var name = btn.querySelector('b') ? btn.querySelector('b').textContent : '';
    var hex = btn.getAttribute('data-hex');
    var label = btn.querySelector('.bd-swatch-copy');
    btn.setAttribute('aria-label', name + ', ' + hex + '. Copy hex value');
    var timer;
    btn.addEventListener('click', function () {
      copyText(hex).then(function () {
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        announce(copyStatus, name + ' ' + hex + ' copied to clipboard');
      }, function () {
        if (label) label.textContent = hex;
        announce(copyStatus, 'Could not copy automatically. The hex value is ' + hex);
      });
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove('is-copied');
        if (label) label.textContent = 'Copy';
      }, 1800);
    });
  });

  /* Type tester + weight */
  var input = document.getElementById('bd-try');
  var out = document.getElementById('bd-try-out');
  if (input && out) {
    input.addEventListener('input', function () {
      out.textContent = input.value.trim() || 'Fresh reels for Friday night';
    });
  }
  var weightBtns = Array.prototype.slice.call(page.querySelectorAll('[data-bd-weight]'));
  weightBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      weightBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      page.style.setProperty('--bd-w', b.getAttribute('data-bd-weight'));
    });
  });

  /* Colour tokens */
  function tokens() {
    var lines = [':root {', '  /* Vegas Studio brand colours */'];
    Array.prototype.forEach.call(page.querySelectorAll('.bd-swatch'), function (btn) {
      var name = (btn.querySelector('b').textContent || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      lines.push('  --vs-' + name + ': ' + btn.getAttribute('data-hex') + ';');
    });
    lines.push('}');
    return lines.join('\n') + '\n';
  }
  var tokenStatus = document.getElementById('bd-token-status');
  Array.prototype.forEach.call(page.querySelectorAll('[data-bd-tokens]'), function (btn) {
    btn.addEventListener('click', function () {
      var css = tokens();
      if (btn.getAttribute('data-bd-tokens') === 'download') {
        var blob = new Blob([css], { type: 'text/css' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'vegas-studio-colours.css';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        announce(tokenStatus, 'Colour tokens file downloaded');
      } else {
        copyText(css).then(function () {
          var old = btn.textContent;
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = old; }, 1800);
          announce(tokenStatus, 'Colour tokens copied to clipboard');
        }, function () { announce(tokenStatus, 'Could not copy automatically. Use the download instead.'); });
      }
    });
  });

  /* Scrollspy for the chapter rail */
  var links = Array.prototype.slice.call(page.querySelectorAll('[data-bd-spy]'));
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var link = map[e.target.id];
        if (!link || link === current) return;
        if (current) { current.classList.remove('is-current'); current.removeAttribute('aria-current'); }
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'true');
        current = link;
        var rail = link.closest('ol');
        if (rail && rail.parentElement.scrollWidth > rail.parentElement.clientWidth) {
          rail.parentElement.scrollTo({ left: link.offsetLeft - 24, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }
})();
