/* Game aggregation: lobby configurator, provider wall, diagram and timeline. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  doc.classList.add('gx-js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('en-GB');

  /* ---- Scroll reveals with stagger ---- */
  const groups = ['.gx-wall-head > *', '.gx-connect-head > *', '.gx-compare-col', '.gx-own-head > *', '.gx-own-card',
    '.gx-office-copy > h2', '.gx-office-lede', '.gx-office-list > li', '.gx-office-panel', '.gx-options-head > *', '.gx-table-wrap',
    '.gx-rollout-head > *', '.gx-timeline > li', '.gx-faq-side', '.gx-q', '.gx-cta-box', '.gx-d-hub', '.gx-d-node'];
  const revealEls = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6));
    el.setAttribute('data-gx-reveal', '');
    revealEls.push(el);
  }));
  const showAll = () => revealEls.forEach(el => el.classList.add('is-in'));
  if (reduce || !hasIO) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealEls.forEach(el => io.observe(el));
    setTimeout(showAll, 4000);
  }

  /* ---- Count-up helper ---- */
  function countTo(el, to, dur = 600) {
    const from = parseInt((el.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
    // Failsafe for throttled tabs: make sure the final value lands.
    setTimeout(() => { el.textContent = fmt(to); }, dur + 400);
  }

  /* ---- Lobby configurator ---- */
  const toggles = $$('.gx-toggle');
  const out = k => $(`[data-out="${k}"]`);
  const empty = $('.gx-empty');
  function bump(el) { if (reduce || !el) return; el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
  function update(changed) {
    const on = toggles.filter(t => t.getAttribute('aria-pressed') === 'true');
    const titles = on.reduce((s, t) => s + Number(t.dataset.titles), 0);
    const provs = new Set(on.flatMap(t => t.dataset.providers.split('|')));
    const tEl = out('titles'), pEl = out('providers'), cEl = out('cats');
    countTo(tEl, titles); countTo(pEl, provs.size); cEl.textContent = on.length;
    [tEl, pEl, cEl].forEach(bump);
    const names = on.map(t => t.querySelector('b').textContent);
    const picked = out('picked');
    if (picked) picked.textContent = names.length ? names.join(', ') : 'nothing yet';
    empty.hidden = on.length > 0;
    toggles.forEach(t => {
      const id = t.dataset.cat, isOn = t.getAttribute('aria-pressed') === 'true';
      const row = $(`.gx-row[data-row="${id}"]`), tab = $(`.gx-lobby-tabs [data-tab="${id}"]`);
      if (tab) tab.classList.toggle('is-off', !isOn);
      if (!row) return;
      if (isOn && row.hidden) {
        row.hidden = false; row.classList.remove('is-leaving');
        if (!reduce && changed === t) $$('.gx-tile', row).forEach((tile, i) => {
          tile.style.setProperty('--t', i); tile.classList.remove('is-pop'); void tile.offsetWidth; tile.classList.add('is-pop');
        });
      } else if (!isOn && !row.hidden) {
        if (reduce) { row.hidden = true; return; }
        row.classList.add('is-leaving');
        setTimeout(() => { if (t.getAttribute('aria-pressed') !== 'true') row.hidden = true; row.classList.remove('is-leaving'); }, 340);
      }
    });
  }
  toggles.forEach(t => t.addEventListener('click', () => {
    t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'));
    update(t);
  }));

  /* ---- Provider wall: duplicate each track once for a continuous loop ---- */
  $$('.gx-marquee-track').forEach(track => {
    [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  });

  /* ---- Diagram: run wire pulses only while visible; count up the comparison ---- */
  const connect = $('.gx-connect');
  const counters = $$('[data-gx-count]');
  const runCounters = () => counters.forEach(el => { if (!el.dataset.done) { el.dataset.done = '1'; el.textContent = '0'; countTo(el, Number(el.dataset.gxCount), 900); } });
  if (connect && hasIO) {
    new IntersectionObserver(es => es.forEach(e => {
      connect.classList.toggle('is-live', e.isIntersecting);
      if (e.isIntersecting) runCounters();
    }), { threshold: .15 }).observe(connect);
  } else if (connect) { connect.classList.add('is-live'); }

  /* ---- House content scroller buttons ---- */
  const track = $('.gx-own-track');
  $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    const card = track.querySelector('.gx-own-card');
    const dx = (card ? card.getBoundingClientRect().width + 20 : 300) * Number(b.dataset.scroll);
    track.scrollBy({ left: dx, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---- Rollout timeline progress tied to scroll ---- */
  const tl = $('.gx-timeline');
  if (tl) {
    const items = $$('li', tl);
    let ticking = false;
    const paint = () => {
      ticking = false;
      const r = tl.getBoundingClientRect(), vh = innerHeight;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .35)));
      tl.style.setProperty('--p', p.toFixed(3));
      items.forEach((li, i) => li.classList.toggle('is-reached', p >= (i + .5) / items.length || p === 1));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener('resize', paint);
    paint();
  }
})();
