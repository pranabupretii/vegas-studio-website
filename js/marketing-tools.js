/* Marketing tools: campaign planner filter, tool tabs with live previews, scroll reveals. */
(() => {
  'use strict';
  const page = document.querySelector('.cy-page');
  if (!page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canIO = 'IntersectionObserver' in window;

  /* ---------- staggered reveals ---------- */
  const setIdx = (parent, sel) => [...parent.querySelectorAll(sel)].forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('.cy-months').forEach(p => setIdx(p, '.cy-month'));
  document.querySelectorAll('.cy-recipe-grid').forEach(p => setIdx(p, '.cy-recipe'));
  document.querySelectorAll('.cy-gantt').forEach(p => setIdx(p, '.cy-g-bar'));
  document.querySelectorAll('.cy-rule-list').forEach(p => setIdx(p, 'li'));
  document.querySelectorAll('.cy-yb-row b').forEach((b, i) => b.style.setProperty('--d', 120 + (i % 5) * 90 + Math.floor(i / 5) * 40));

  const revealTargets = [...document.querySelectorAll('.cy-yearbar,.cy-months,.cy-recipe-grid,.cy-gantt,.cy-report,.cy-rule-list')];
  const onReveal = el => {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    if (el.classList.contains('cy-report')) runCounters(el);
  };
  if (!reduced && canIO) {
    page.classList.add('cy-anim');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { onReveal(e.target); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach(el => io.observe(el));
    setTimeout(() => revealTargets.forEach(onReveal), 4000); // failsafe
  } else {
    revealTargets.forEach(onReveal);
  }

  /* ---------- counters ---------- */
  function runCounters(scope) {
    scope.querySelectorAll('[data-cy-count]').forEach(el => {
      const end = parseFloat(el.dataset.cyCount);
      const dec = Number(el.dataset.dec || 0);
      const fmt = v => v.toFixed(dec);
      if (reduced) { el.textContent = fmt(end); return; }
      const t0 = performance.now(), dur = 1300;
      const step = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end);
      };
      requestAnimationFrame(step);
      setTimeout(() => { el.textContent = fmt(end); }, dur + 400); // hidden-tab safety
    });
  }

  /* ---------- planner filter ---------- */
  const months = document.querySelector('.cy-months');
  const status = document.querySelector('[data-cy-status]');
  const names = { fs: 'free spins', tn: 'tournament', ch: 'challenge', jp: 'jackpot' };
  document.querySelectorAll('[data-cy-filter]').forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.cyFilter;
    document.querySelectorAll('[data-cy-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    const chips = [...months.querySelectorAll('.cy-chip')];
    let n = 0;
    chips.forEach(c => { const m = f === 'all' || c.dataset.t === f; c.classList.toggle('is-match', m); if (m) n++; });
    months.classList.toggle('is-filtered', f !== 'all');
    status.textContent = f === 'all' ? `Showing all ${chips.length} campaigns.` : `Highlighting ${n} ${names[f]} campaigns across the year.`;
  }));

  /* ---------- live previews ---------- */
  const previews = {};
  let toolsVisible = false, active = 'fs';

  // Free spins
  previews.fs = (() => {
    const dotsWrap = document.querySelector('[data-fs-dots]');
    const left = document.querySelector('[data-fs-left]');
    const nEl = document.querySelector('[data-fs-n]');
    const tot = document.querySelector('[data-fs-total]');
    if (!dotsWrap) return null;
    const dots = [];
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('i');
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      d.style.transform = `translate(${Math.cos(a) * 52}px, ${Math.sin(a) * 52}px)`;
      dotsWrap.appendChild(d); dots.push(d);
    }
    const wins = [0, 12, 0, 40, 8, 0, 0, 25, 150, 10];
    let i = 0, total = 0, timer = null;
    const render = () => {
      dots.forEach((d, k) => d.classList.toggle('is-used', k < i));
      left.textContent = 10 - i; nEl.textContent = i; tot.textContent = total;
    };
    const tick = () => {
      if (i >= 10) { i = 0; total = 0; render(); timer = setTimeout(tick, 900); return; }
      total += wins[i]; i++; render();
      timer = setTimeout(tick, i >= 10 ? 2600 : 1000);
    };
    return {
      start() { if (!timer) timer = setTimeout(tick, 500); },
      stop() { clearTimeout(timer); timer = null; },
      still() { i = 4; total = 60; render(); }
    };
  })();

  // Tournament
  previews.tn = (() => {
    const board = document.querySelector('[data-tn-board]');
    const clock = document.querySelector('[data-tn-clock]');
    if (!board) return null;
    const players = [
      { n: 'Sta***88', s: 4120 }, { n: 'Jun***07', s: 3985 }, { n: 'You', s: 3610, you: true },
      { n: 'Mar***42', s: 3440 }, { n: 'Kel***19', s: 3205 }
    ];
    players.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="r"></span><span class="n"></span><span class="s"></span>';
      li.querySelector('.n').textContent = p.n;
      if (p.you) li.classList.add('is-you');
      board.appendChild(li); p.el = li; p.rank = -1;
    });
    let secs = 2 * 3600 + 14 * 60 + 9, timer = null, clockT = null;
    const render = () => {
      const sorted = [...players].sort((a, b) => b.s - a.s);
      sorted.forEach((p, r) => {
        p.el.classList.toggle('is-up', p.rank !== -1 && r < p.rank);
        p.rank = r;
        p.el.style.translate = `0 ${r * 52}px`;
        p.el.querySelector('.r').textContent = '#' + (r + 1);
        p.el.querySelector('.s').textContent = p.s.toLocaleString('en-GB');
      });
    };
    render();
    const tick = () => {
      const p = players[Math.floor(Math.random() * players.length)];
      p.s += 80 + Math.floor(Math.random() * 420);
      render();
      timer = setTimeout(tick, 1400);
    };
    const tickClock = () => {
      secs = secs > 0 ? secs - 1 : 2 * 3600;
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor(secs % 3600 / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      clock.textContent = `${h}:${m}:${s}`;
    };
    return {
      start() { if (!timer) { timer = setTimeout(tick, 600); clockT = setInterval(tickClock, 1000); } },
      stop() { clearTimeout(timer); clearInterval(clockT); timer = null; },
      still() { render(); }
    };
  })();

  // Challenges
  previews.ch = (() => {
    const items = [...document.querySelectorAll('[data-ch-list] li')];
    if (!items.length) return null;
    const targets = [20, 3, 2];
    let prog = [0, 0, 0], timer = null;
    const render = () => items.forEach((li, k) => {
      li.querySelector('[data-ch-count]').textContent = `${prog[k]}/${targets[k]}`;
      li.querySelector('.cy-m-fill').style.scale = `${prog[k] / targets[k]} 1`;
      li.classList.toggle('is-done', prog[k] >= targets[k]);
    });
    const tick = () => {
      const open = prog.map((v, k) => v < targets[k] ? k : -1).filter(k => k >= 0);
      if (!open.length) { prog = [0, 0, 0]; render(); timer = setTimeout(tick, 900); return; }
      const k = open[0] === 0 && Math.random() < .7 ? 0 : open[Math.floor(Math.random() * open.length)];
      prog[k] = Math.min(targets[k], prog[k] + (k === 0 ? 2 + Math.floor(Math.random() * 3) : 1));
      render();
      const done = prog.every((v, j) => v >= targets[j]);
      timer = setTimeout(tick, done ? 2800 : 700);
    };
    render();
    return {
      start() { if (!timer) timer = setTimeout(tick, 500); },
      stop() { clearTimeout(timer); timer = null; },
      still() { prog = [14, 2, 1]; render(); }
    };
  })();

  // Jackpots
  previews.jp = (() => {
    const els = [...document.querySelectorAll('[data-jp]')];
    if (!els.length) return null;
    const vals = els.map(e => parseFloat(e.dataset.jp));
    const fmt = v => v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let timer = null;
    const tick = () => {
      els.forEach((e, k) => { vals[k] += parseFloat(e.dataset.jpRate) * (0.3 + Math.random()); e.textContent = fmt(vals[k]); });
    };
    return {
      start() { if (!timer) timer = setInterval(tick, 140); },
      stop() { clearInterval(timer); timer = null; },
      still() { els.forEach((e, k) => { e.textContent = fmt(vals[k]); }); }
    };
  })();

  const syncPreviews = () => {
    Object.entries(previews).forEach(([k, p]) => {
      if (!p) return;
      if (reduced) { p.still(); return; }
      if (k === active && toolsVisible && !document.hidden) p.start(); else p.stop();
    });
  };

  /* ---------- tabs ---------- */
  const tabs = [...document.querySelectorAll('[data-cy-tab]')];
  const choose = (tab, focus) => {
    active = tab.dataset.cyTab;
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-in', on);
    });
    if (focus) tab.focus();
    syncPreviews();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => choose(tab));
    tab.addEventListener('keydown', e => {
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); choose(tabs[n], true); }
    });
  });

  const toolsSection = document.querySelector('.cy-tools');
  if (toolsSection && canIO) {
    new IntersectionObserver(es => es.forEach(e => { toolsVisible = e.isIntersecting; syncPreviews(); }), { threshold: 0.1 }).observe(toolsSection);
  } else { toolsVisible = true; }
  document.addEventListener('visibilitychange', syncPreviews);
  syncPreviews();
})();
