/* Live RTP: observatory. Reveals, counters, bar scale toggle and an illustrative variance model. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.querySelector('.obs-page');
  if (!page) return;

  function fmt(v, dec) { return v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }

  /* Count a published figure up to its exact value, then restore the original text */
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = '1';
    var final = el.textContent, end = parseFloat(el.getAttribute('data-obs-count'));
    var dec = (el.getAttribute('data-obs-count').split('.')[1] || '').length;
    if (!end) return;
    var t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)), dec) + '%';
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    }
    requestAnimationFrame(step);
    setTimeout(function () { el.textContent = final; }, 3000);
  }

  /* Reveal on scroll, with a 4 second failsafe */
  function setupReveal() {
    var items = page.querySelectorAll('[data-obs-in], .obs-bars, .obs-gauges, .obs-radar');
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('obs-anim');
    function show(el) {
      el.classList.add(el.classList.contains('obs-radar') ? 'is-live' : 'is-in');
      el.querySelectorAll('[data-obs-count]').forEach(countUp);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add(el.classList.contains('obs-radar') ? 'is-live' : 'is-in'); }); }, 4000);
  }

  /* Log / linear toggle on the higher-returns bars */
  function setupScale() {
    var bars = page.querySelector('[data-obs-bars]');
    var note = page.querySelector('[data-obs-scale-note]');
    var btns = page.querySelectorAll('[data-obs-scale]');
    if (!bars || !btns.length) return;
    var NOTES = {
      log: 'Log scale: each step along the bar is ten times the last, so all five readings fit. The dashed line marks 100%.',
      lin: 'Linear scale: bar length is proportional to the figure. Wish of Luxury 2 fills the bar and the other four look small beside it.'
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-obs-scale');
        btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        bars.setAttribute('data-scale', mode);
        if (note) note.textContent = NOTES[mode];
      });
    });
  }

  /* Variance model: an imaginary 96% game. Illustration only. */
  var PAYS = [[0.20, 1.5], [0.06, 4], [0.01, 12], [0.002, 60], [0.0003, 600]];
  var MU = 0.96, VAR = (function () {
    var e2 = 0; PAYS.forEach(function (p) { e2 += p[0] * p[1] * p[1]; }); return e2 - MU * MU;
  })();
  var SESSIONS = 12, STEPS = 50, EXACT = 20000;
  var X0 = 60, XW = 112, Y0 = 310, YK = 1.4;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function payout(r) {
    var acc = 0;
    for (var i = 0; i < PAYS.length; i++) { acc += PAYS[i][0]; if (r < acc) return PAYS[i][1]; }
    return 0;
  }
  function normal(rand) {
    var u = 1 - rand(), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function runSession(seed) {
    var rand = rng(seed), out = [], n = 0, sum = 0;
    for (var k = 0; k <= STEPS; k++) {
      var target = Math.round(Math.pow(10, 1 + k / 10));
      if (target <= EXACT) {
        while (n < target) { sum += payout(rand()); n++; }
      } else {
        var m = target - n;
        sum += m * MU + Math.sqrt(m * VAR) * normal(rand);
        n = target;
      }
      out.push(sum / n * 100);
    }
    return out;
  }

  function setupSim() {
    var input = document.getElementById('obs-rounds');
    var svg = document.getElementById('obs-sim-svg');
    if (!input || !svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var linesG = document.getElementById('obs-sim-lines');
    var ptsG = document.getElementById('obs-sim-pts');
    var cursor = document.getElementById('obs-sim-cursor');
    var out = document.getElementById('obs-rounds-out');
    var minEl = document.getElementById('obs-min'), maxEl = document.getElementById('obs-max'), spEl = document.getElementById('obs-spread');
    var LABELS = ['10', '100', '1,000', '10,000', '100,000', '1,000,000'];
    var data = [], pts = [], seedBase = 2611;

    function y(v) { return Y0 - Math.min(Math.max(v, 0), 200) * YK; }
    function x(k) { return X0 + (k / 10) * XW; }

    function build() {
      data = [];
      for (var s = 0; s < SESSIONS; s++) data.push(runSession(seedBase * 97 + s * 7919));
      linesG.textContent = ''; ptsG.textContent = ''; pts = [];
      data.forEach(function (series, s) {
        var d = '';
        series.forEach(function (v, k) { d += (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(v).toFixed(1); });
        var p = document.createElementNS(ns, 'path');
        p.setAttribute('class', 'obs-sim-line'); p.setAttribute('d', d);
        p.style.animationDelay = (s * 50) + 'ms';
        linesG.appendChild(p);
        var c = document.createElementNS(ns, 'circle');
        c.setAttribute('class', 'obs-sim-pt'); c.setAttribute('r', 4); c.setAttribute('cx', 0); c.setAttribute('cy', 0);
        ptsG.appendChild(c); pts.push(c);
      });
      update();
    }

    function update() {
      var s = parseInt(input.value, 10), k = s * 10;
      var vals = data.map(function (series) { return series[k]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var spread = Math.max(hi - 96, 96 - lo);
      out.textContent = LABELS[s];
      input.setAttribute('aria-valuetext', LABELS[s] + ' rounds');
      input.style.setProperty('--fill', (s / 5 * 100) + '%');
      minEl.textContent = fmt(lo, 1) + '%';
      maxEl.textContent = fmt(hi, 1) + '%';
      spEl.textContent = 'Up to ' + fmt(spread, 1) + ' points away';
      cursor.style.translate = (x(k) - 284) + 'px 0';
      pts.forEach(function (c, i) { c.style.translate = x(k).toFixed(1) + 'px ' + y(vals[i]).toFixed(1) + 'px'; });
    }

    input.addEventListener('input', update);
    document.getElementById('obs-rerun').addEventListener('click', function () { seedBase += 1; build(); });
    build();
  }

  function init() { setupReveal(); setupScale(); setupSim(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
