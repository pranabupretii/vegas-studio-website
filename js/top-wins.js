/* Top wins: highlight reel. Reveals, film-strip pause, podium view toggle, counters. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.querySelector('.reel-page');
  if (!page) return;

  function format(v, kind) {
    var n = Math.round(v).toLocaleString('en-GB');
    return kind === 'usd' ? '$' + n : n + '×';
  }

  /* Count a published figure up, always finishing on the original text */
  function countUp(el) {
    if (reduce) return;
    var final = el.getAttribute('data-final') || el.textContent;
    el.setAttribute('data-final', final);
    var end = parseFloat(el.getAttribute('data-reel-count')), kind = el.getAttribute('data-reel-fmt');
    var t0 = null, dur = 1300, id = (el._reelRun = (el._reelRun || 0) + 1);
    function step(t) {
      if (id !== el._reelRun) return;
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = format(end * (1 - Math.pow(1 - p, 3)), kind);
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    }
    requestAnimationFrame(step);
    setTimeout(function () { if (id === el._reelRun) el.textContent = final; }, 3000);
  }

  function setupReveal() {
    var items = page.querySelectorAll('[data-reel-in], .reel-view, .reel-feature');
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('reel-anim');
    function show(el) {
      if (el.classList.contains('reel-view')) el.classList.add('is-up');
      else el.classList.add('is-in');
      if (!el.hidden) el.querySelectorAll('[data-reel-count]').forEach(countUp);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add(el.classList.contains('reel-view') ? 'is-up' : 'is-in'); });
    }, 4000);
  }

  /* Monetary / bet multiplier toggle */
  function setupToggle() {
    var btns = page.querySelectorAll('[data-reel-view]');
    var panels = page.querySelectorAll('[data-reel-panel]');
    var status = page.querySelector('[data-reel-status]');
    if (!btns.length || !panels.length) return;
    function select(view, announce) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-reel-view') === view ? 'true' : 'false'); });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-reel-panel') === view;
        p.hidden = !on;
        if (on && announce) {
          p.classList.add('is-up'); p.classList.remove('is-switch'); void p.offsetWidth; p.classList.add('is-switch');
          p.querySelectorAll('[data-reel-count]').forEach(countUp);
        }
      });
      if (announce && status) status.textContent = view === 'money' ? 'Showing the monetary view.' : 'Showing the bet multiplier view.';
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { select(b.getAttribute('data-reel-view'), true); });
    });
    select('money', false);
  }

  /* Film strip pause */
  function setupTicker() {
    var film = page.querySelector('[data-reel-ticker]');
    var btn = page.querySelector('[data-reel-pause]');
    if (!film || !btn) return;
    if (reduce) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.querySelector('.reel-pause-text').textContent = paused ? 'Play' : 'Pause';
      film.classList.toggle('is-paused', paused);
    });
  }

  function init() { setupToggle(); setupReveal(); setupTicker(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
