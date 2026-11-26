/* Casino platform: sticky product tour, module tabs, status board and launch checklist. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  doc.classList.add('cpt-js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- Keep sticky offsets below the site header ---- */
  const header = $('.launch-header');
  const setTop = () => { if (header) doc.style.setProperty('--cpt-top', header.getBoundingClientRect().height + 'px'); };
  setTop(); addEventListener('resize', setTop);

  /* ---- Reveals ---- */
  const groups = ['.cpt-sec-head > *', '.cpt-mod-ui', '.cpt-rel-copy > *', '.cpt-uptime', '.cpt-status', '.cpt-sec-list > li',
    '.cpt-stack-copy > *', '.cpt-layers > li', '.cpt-check-side > *', '.cpt-cgroup', '.cpt-uselist > li', '.cpt-q', '.cpt-cta-in'];
  const els = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6));
    el.setAttribute('data-cpt-reveal', ''); els.push(el);
  }));
  const onShow = el => {
    el.classList.add('is-in');
    const c = el.querySelector('[data-cpt-count]');
    if (c) countUp(c);
  };
  const showAll = () => els.forEach(el => { if (!el.classList.contains('is-in')) onShow(el); });
  if (reduce || !hasIO) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { onShow(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(el => io.observe(el));
    setTimeout(showAll, 4000);
  }
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const to = parseFloat(el.dataset.cptCount), dec = Number(el.dataset.dec || 0);
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    const from = 90, t0 = performance.now(), dur = 1200;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = to.toFixed(dec); }, dur + 400);
  }

  /* ---- Tour: swap screens as steps reach the middle of the viewport ---- */
  const steps = $$('.cpt-step');
  const screens = $$('.cpt-screen');
  const navs = $$('.cpt-side [data-nav]');
  const num = $('[data-stop-num]'), name = $('[data-stop-name]'), bar = $('.cpt-progress-bar');
  let current = '';
  function activate(id) {
    if (id === current) return; current = id;
    const idx = steps.findIndex(s => s.dataset.step === id);
    steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === id));
    screens.forEach(s => s.classList.toggle('is-on', s.dataset.screen === id));
    navs.forEach(n => n.classList.toggle('is-on', n.dataset.nav === id));
    if (num) num.textContent = idx + 1;
    if (name) name.textContent = steps[idx].dataset.label;
    if (bar) bar.style.setProperty('--sp', ((idx + 1) / steps.length).toFixed(4));
  }
  if (steps.length) {
    activate(steps[0].dataset.step);
    let ticking = false;
    const pick = () => {
      ticking = false;
      // On narrow screens the device sits on top, so measure against the space below it.
      const stage = $('.cpt-stage');
      const narrow = matchMedia('(max-width:860px)').matches;
      const topEdge = narrow && stage ? stage.getBoundingClientRect().bottom : 0;
      const line = topEdge + (innerHeight - topEdge) * .45;
      let best = steps[0];
      steps.forEach(s => { if (s.getBoundingClientRect().top <= line) best = s; });
      activate(best.dataset.step);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }, { passive: true });
    addEventListener('resize', pick);
    pick();
  }
  // Route links: jump smoothly to a stop, accounting for the sticky header.
  $$('.cpt-route a').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    const narrow = matchMedia('(max-width:860px)').matches;
    const stage = $('.cpt-stage');
    const off = (header ? header.getBoundingClientRect().height : 0) + (narrow && stage ? stage.offsetHeight : 0) + 10;
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - off, behavior: reduce ? 'auto' : 'smooth' });
    activate(t.dataset.step);
    history.replaceState(null, '', a.getAttribute('href'));
  }));

  /* ---- Module tabs (vertical tablist with arrow-key support) ---- */
  const tabs = $$('.cpt-mtabs [role="tab"]');
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', e => {
      const k = e.key; let n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });

  /* ---- Launch checklist meter ---- */
  const boxes = $$('.cpt-citem input');
  const cnt = $('[data-check-count]'), tot = $('[data-check-total]'), msg = $('[data-check-msg]'), meter = $('.cpt-meter-bar');
  if (tot) tot.textContent = boxes.length;
  const messages = [[0, 'Nothing ticked yet. That is normal at the start.'], [1, 'A good start. We can plan around what is still open.'], [.5, 'More than halfway. Launch planning can start now.'], [.85, 'Nearly there. Time to talk about a launch date.'], [1.01, 'Everything ticked. You are ready for a soft launch.']];
  const updateMeter = () => {
    const n = boxes.filter(b => b.checked).length, p = boxes.length ? n / boxes.length : 0;
    cnt.textContent = n;
    meter.style.setProperty('--cp', p.toFixed(3));
    let m = messages[0][1];
    if (n > 0) m = messages[1][1];
    if (p >= .5) m = messages[2][1];
    if (p >= .85) m = messages[3][1];
    if (p === 1) m = messages[4][1];
    msg.textContent = m;
  };
  boxes.forEach(b => b.addEventListener('change', updateMeter));
  if (boxes.length) updateMeter();
})();
