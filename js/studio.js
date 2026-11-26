/* About us: editorial reveals, scroll-driven chapters, count-up */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-st-count'), 10);
    if (reduce || !target) { el.textContent = target; return; }
    var start = null, dur = 1100;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = target;
    }
    requestAnimationFrame(step);
    /* failsafe if rAF is throttled */
    setTimeout(function () { el.textContent = target; }, dur + 400);
  }

  function setupReveal() {
    if (reduce || !hasIO) return;
    root.classList.add('st-anim');
    var items = document.querySelectorAll('main [data-in], main .st-tile');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        e.target.querySelectorAll('[data-st-count]').forEach(countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); root.classList.add('st-done'); }, 4000);
  }

  function setupChapters() {
    var chapters = document.querySelectorAll('.st-chapter');
    var imgs = document.querySelectorAll('.st-stage-img');
    var num = document.getElementById('st-stage-num');
    var name = document.getElementById('st-stage-name');
    var bar = document.getElementById('st-stage-bar');
    if (!chapters.length || !hasIO) return;
    root.classList.add('st-chap');
    function activate(i) {
      chapters.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); });
      if (num) num.textContent = ('0' + (i + 1)).slice(-2);
      if (name) name.textContent = chapters[i].getAttribute('data-name');
      if (bar) bar.style.scale = ((i + 1) / chapters.length) + ' 1';
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) activate(parseInt(e.target.getAttribute('data-ch'), 10));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    chapters.forEach(function (c) { io.observe(c); });
  }

  function init() { setupReveal(); setupChapters(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
