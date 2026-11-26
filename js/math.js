/* Math collaboration: the lab. Illustration only, not a real game model. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll with a 4 second failsafe */
  function setupReveal() {
    var items = document.querySelectorAll('main [data-in]');
    if (!items.length) return;
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('lab-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); root.classList.add('lab-done'); }, 4000);
  }

  /* Explorer */
  var VOL = ['Low', 'Medium-low', 'Medium', 'High', 'Very high'];
  var HIT = [45, 38, 31, 24, 17];
  var MAX = [500, 1500, 5000, 10000, 50000];
  var FEEL = [
    'Frequent small wins. The balance moves slowly, which suits long sessions on a modest budget.',
    'Steady returns with the odd bigger hit. Good for players who like to settle in.',
    'A balance of regular wins and features that can lift a session.',
    'Quieter stretches between wins. Features carry most of the return.',
    'Long dry runs are normal. A small share of spins pays most of the return.'
  ];
  /* Share of winning spins per band, in percent */
  var SHAPE = [
    [38, 32, 20, 8, 1.8, 0.2],
    [42, 26, 18, 10, 3.4, 0.6],
    [46, 22, 16, 11, 4, 1],
    [50, 18, 14, 11, 5.5, 1.5],
    [54, 15, 12, 10, 6.5, 2.5]
  ];
  var BANDS = ['Under 1×', '1–2×', '2–5×', '5–20×', '20–100×', '100×+'];

  var X0 = 40, X1 = 585, BASE = 250, TOP = 40, N = BANDS.length;
  var SLOT = (X1 - X0) / N, BW = SLOT * 0.56;

  function fmt(n) { return n.toLocaleString('en-GB'); }

  function model(rtp, v) {
    var i = v - 1;
    var hit = Math.max(8, Math.min(60, HIT[i] + (rtp - 94) * 0.6));
    var shares = SHAPE[i].map(function (s, k) { return s * (1 + (rtp - 94) * 0.025 * (k - 2.5) / 2.5); });
    var sum = shares.reduce(function (a, b) { return a + b; }, 0);
    var wins = Math.round(hit * 10);
    var counts = shares.map(function (s) { return Math.max(0, Math.round(s / sum * wins)); });
    return { hit: hit, wins: wins, counts: counts, max: MAX[i], feel: FEEL[i], vol: VOL[i] };
  }

  function setupExplorer() {
    var rtp = document.getElementById('lab-rtp');
    var vol = document.getElementById('lab-vol');
    var svg = document.getElementById('lab-svg');
    if (!rtp || !vol || !svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var barsG = document.getElementById('lab-bars');
    var labelsG = document.getElementById('lab-labels');
    var curve = document.getElementById('lab-curve');
    var bars = [], vals = [];

    BANDS.forEach(function (b, k) {
      var x = X0 + SLOT * k + (SLOT - BW) / 2;
      var bg = document.createElementNS(ns, 'rect');
      bg.setAttribute('class', 'lab-bar-bg');
      bg.setAttribute('x', x); bg.setAttribute('y', TOP);
      bg.setAttribute('width', BW); bg.setAttribute('height', BASE - TOP); bg.setAttribute('rx', 4);
      barsG.appendChild(bg);
    });
    BANDS.forEach(function (b, k) {
      var x = X0 + SLOT * k + (SLOT - BW) / 2;
      var r = document.createElementNS(ns, 'rect');
      r.setAttribute('class', k > 3 ? 'lab-bar lab-bar--rare' : 'lab-bar');
      r.setAttribute('x', x); r.setAttribute('y', TOP);
      r.setAttribute('width', BW); r.setAttribute('height', BASE - TOP); r.setAttribute('rx', 4);
      r.style.scale = '1 0';
      barsG.appendChild(r); bars.push(r);
      var t = document.createElementNS(ns, 'text');
      t.setAttribute('class', 'lab-val');
      t.setAttribute('x', x + BW / 2);
      barsG.appendChild(t); vals.push(t);
      var l = document.createElementNS(ns, 'text');
      l.setAttribute('x', x + BW / 2); l.setAttribute('y', BASE + 24);
      l.textContent = b;
      labelsG.appendChild(l);
    });

    var out = {
      rtp: document.getElementById('lab-rtp-out'), vol: document.getElementById('lab-vol-out'),
      hit: document.getElementById('lab-hit'), hitNote: document.getElementById('lab-hit-note'),
      max: document.getElementById('lab-max'), back: document.getElementById('lab-back'),
      feel: document.getElementById('lab-feel'), nowin: document.getElementById('lab-nowin')
    };
    var fadeT;

    function fill(input) {
      var p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--fill', p + '%');
    }

    function update() {
      var r = parseFloat(rtp.value), v = parseInt(vol.value, 10);
      var m = model(r, v);
      out.rtp.textContent = r.toFixed(1) + '%';
      rtp.setAttribute('aria-valuetext', r.toFixed(1) + ' percent');
      out.vol.textContent = m.vol;
      vol.setAttribute('aria-valuetext', m.vol);
      fill(rtp); fill(vol);
      out.hit.textContent = Math.round(m.hit) + '%';
      out.hitNote.textContent = 'about 1 spin in ' + (100 / m.hit).toFixed(1).replace(/\.0$/, '') + ' pays something';
      out.max.textContent = fmt(m.max) + '×';
      out.back.textContent = r.toFixed(1);
      out.feel.textContent = m.feel;
      out.nowin.textContent = fmt(1000 - m.wins);

      /* square-root scale so the rare bands stay visible */
      var top = Math.sqrt(260);
      var pts = [];
      m.counts.forEach(function (c, k) {
        var s = Math.min(1, Math.sqrt(c) / top);
        bars[k].style.scale = '1 ' + s.toFixed(4);
        var y = BASE - (BASE - TOP) * s;
        vals[k].setAttribute('y', Math.max(TOP - 6, y - 8));
        vals[k].textContent = c;
        pts.push([X0 + SLOT * k + SLOT / 2, y - 22]);
      });
      var d = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ' C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      if (reduce) { curve.setAttribute('d', d); return; }
      curve.classList.add('is-fading');
      clearTimeout(fadeT);
      fadeT = setTimeout(function () { curve.setAttribute('d', d); curve.classList.remove('is-fading'); }, 260);
    }

    rtp.addEventListener('input', update);
    vol.addEventListener('input', update);
    update();

    document.querySelectorAll('.lab-load').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rtp.value = Math.min(98, parseFloat(btn.getAttribute('data-rtp')));
        vol.value = btn.getAttribute('data-vol');
        update();
        var sec = document.getElementById('lab-explorer');
        sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        out.feel.textContent = btn.getAttribute('data-name') + ' loaded. Its published max win is ' + btn.getAttribute('data-max') + '×; the other readouts here stay illustrative. ' + out.feel.textContent;
        setTimeout(function () { rtp.focus({ preventScroll: true }); }, reduce ? 0 : 500);
      });
    });
  }

  /* Checklist progress */
  function setupChecklist() {
    var boxes = document.querySelectorAll('.lab-checklist input[type=checkbox]');
    var bar = document.getElementById('lab-progress-bar');
    var text = document.getElementById('lab-progress-text');
    if (!boxes.length || !bar || !text) return;
    function upd() {
      var n = 0;
      boxes.forEach(function (b) { if (b.checked) n++; });
      bar.style.scale = (n / boxes.length) + ' 1';
      text.textContent = n === boxes.length ? 'All ' + n + ' ready. Time to get in touch.' : n + ' of ' + boxes.length + ' ready';
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); });
    upd();
  }

  function init() { setupReveal(); setupExplorer(); setupChecklist(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
