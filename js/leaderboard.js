/* Leaderboard: podium rise, counters, reveals and the sortable/filterable snapshot table. */
(() => {
  const root = document.querySelector('.lb-page');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  document.documentElement.classList.add('lb-js');
  if (!reduce) root.classList.add('lb-anim');

  /* ---- Counters ---- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = Number(el.dataset.lbTo);
    if (reduce) { el.textContent = fmt(to); return; }
    const dur = 1100, t0 = performance.now();
    el.textContent = '0';
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = fmt(to); }, dur + 400); // throttled-tab failsafe
  }

  /* ---- Reveals ---- */
  const groups = ['.lb-hero-copy > *', '.lb-stats > li', '.lb-head > *', '.lb-board', '.lb-earn-card', '.lb-track',
    '.lb-week', '.lb-you-card', '.lb-rule-list > li', '.lb-next-box', '.lb-more', '.lb-care-inner'];
  const els = [];
  groups.forEach(sel => $$(sel, root).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 6));
    el.setAttribute('data-lb-reveal', '');
    els.push(el);
  }));
  $$('.lb-days li', root).forEach((li, i) => li.style.setProperty('--k', i));
  const podium = $('.lb-podium', root);
  const onIn = el => {
    el.classList.add('is-in');
    $$('.lb-count', el).forEach(countUp);
  };
  const showAll = () => {
    els.forEach(onIn);
    if (podium) { podium.classList.add('is-up'); $$('.lb-count', podium).forEach(countUp); }
    $$('.lb-count', root).forEach(countUp);
  };
  if (reduce || !hasIO) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target === podium) { podium.classList.add('is-up'); setTimeout(() => $$('.lb-count', podium).forEach(countUp), 700); }
      else onIn(e.target);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(el => io.observe(el));
    if (podium) io.observe(podium);
    setTimeout(showAll, 4000);
  }

  /* ---- Table: sort + filter ---- */
  const table = $('.lb-table', root);
  if (!table) return;
  const tbody = table.tBodies[0];
  const rows = $$('tr[data-rank]', tbody);
  const emptyRow = $('.lb-empty-row', tbody);
  const out = $('#lb-result');
  const input = $('#lb-filter');
  const chips = $$('.lb-chip', root);
  const sortBtns = $$('.lb-sort', table);
  const state = { key: 'rank', dir: 1, q: '', minStreak: 0 };
  const defaults = { rank: 1, xp: -1, streak: -1 };

  function render(animate) {
    const sorted = rows.slice().sort((a, b) => {
      const d = (Number(a.dataset[state.key]) - Number(b.dataset[state.key])) * state.dir;
      return d || Number(a.dataset.rank) - Number(b.dataset.rank);
    });
    let shown = 0;
    sorted.forEach(r => {
      const ok = r.dataset.alias.includes(state.q) && Number(r.dataset.streak) >= state.minStreak;
      r.hidden = !ok;
      if (ok) shown++;
      tbody.insertBefore(r, emptyRow);
      if (ok && animate && !reduce) { r.classList.add('is-moving'); requestAnimationFrame(() => requestAnimationFrame(() => r.classList.remove('is-moving'))); setTimeout(() => r.classList.remove('is-moving'), 500); }
    });
    emptyRow.hidden = shown > 0;
    out.textContent = `Showing ${shown} of ${rows.length} accounts`;
    sortBtns.forEach(b => {
      const th = b.closest('th');
      th.setAttribute('aria-sort', b.dataset.lbKey === state.key ? (state.dir === 1 ? 'ascending' : 'descending') : 'none');
    });
  }
  sortBtns.forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.lbKey;
    if (state.key === k) state.dir *= -1; else { state.key = k; state.dir = defaults[k]; }
    render(true);
  }));
  input.addEventListener('input', () => { state.q = input.value.trim().toLowerCase(); render(false); });
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    state.minStreak = Number(c.dataset.lbStreak);
    render(true);
  }));
})();
