/* Players Hub: arcade lobby. Reveals, tabs, countdowns, marquee pause, tile glow. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.querySelector('.lob-page');
  if (!page) return;

  /* Reveal on scroll, with a 4 second failsafe */
  function setupReveal() {
    var items = page.querySelectorAll('[data-lob-in], .lob-timeline');
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('lob-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add(e.target.classList.contains('lob-timeline') ? 'is-line' : 'is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add(el.classList.contains('lob-timeline') ? 'is-line' : 'is-in'); });
    }, 4000);
    /* hero XP bar fills once the page has settled */
    var hero = page.querySelector('.lob-hero');
    setTimeout(function () { if (hero) hero.classList.add('lob-ready'); }, 60);
  }

  /* Count up the illustrative XP figure */
  function setupCount() {
    var els = page.querySelectorAll('[data-lob-count]');
    if (reduce) return;
    els.forEach(function (el) {
      var end = parseInt(el.getAttribute('data-lob-count'), 10), t0 = null, dur = 1600;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('en-GB');
        if (p < 1) requestAnimationFrame(step); else el.textContent = end.toLocaleString('en-GB');
      }
      el.textContent = '0';
      setTimeout(function () { requestAnimationFrame(step); }, 500);
      setTimeout(function () { el.textContent = end.toLocaleString('en-GB'); }, 4000);
    });
  }

  /* Tabs (quests / daily reward / XP) */
  function setupTabs() {
    var tabs = Array.prototype.slice.call(page.querySelectorAll('.lob-tabs [role=tab]'));
    if (!tabs.length) return;
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }

  /* Days until each release date (from the game pages) */
  function setupCountdowns() {
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    page.querySelectorAll('[data-lob-release]').forEach(function (el) {
      var p = el.getAttribute('data-lob-release').split('-');
      var d = Date.UTC(+p[0], +p[1] - 1, +p[2]);
      var days = Math.round((d - today) / 86400000);
            if (days > 1) el.textContent = 'In ' + days.toLocaleString('en-GB') + ' days';
      else if (days === 1) el.textContent = 'Tomorrow';
      else if (days === 0) el.textContent = 'Out today';
      else el.textContent = 'Released';
    });
  }

  /* Marquee pause */
  function setupMarquee() {
    var wrap = page.querySelector('[data-lob-marquee]');
    var btn = page.querySelector('[data-lob-pause]');
    if (!wrap || !btn) return;
    if (reduce) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.querySelector('.lob-pause-text').textContent = paused ? 'Play' : 'Pause';
      wrap.classList.toggle('is-paused', paused);
    });
  }

  /* Tile glow follows the pointer */
  function setupGlow() {
    if (reduce) return;
    page.querySelectorAll('.lob-tile a').forEach(function (a) {
      a.addEventListener('pointermove', function (e) {
        var r = a.getBoundingClientRect();
        a.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        a.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  function init() { setupReveal(); setupCount(); setupTabs(); setupCountdowns(); setupMarquee(); setupGlow(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
