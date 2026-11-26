/* Affiliate management: commission calculator, tier highlight, reveals and onboarding progress. */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  doc.classList.add('pe-js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = n => '€' + Math.round(n).toLocaleString('en-GB');

  /* ---- Hero statement prints in ---- */
  const hero = $('.pe-hero');
  $$('.pe-slip-lines div').forEach((d, i) => d.style.setProperty('--l', i));
  if (hero) requestAnimationFrame(() => hero.classList.add('is-in'));
  setTimeout(() => hero && hero.classList.add('is-in'), 300);

  /* ---- Reveals ---- */
  const groups = ['.pe-calc-head > *', '.pe-calc-box', '.pe-sec-head > *', '.pe-sec-head--row > div > *', '.pe-models-copy > *', '.pe-split',
    '.pe-tier', '.pe-w', '.pe-path > li', '.pe-checks', '.pe-onboard-side > *', '.pe-flow > li', '.pe-cal', '.pe-month-notes > li', '.pe-q', '.pe-cta-in'];
  const els = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    if (el.hasAttribute('data-pe-reveal')) return;
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--d', Math.min(Math.max(sibs.indexOf(el), 0), 6));
    el.setAttribute('data-pe-reveal', ''); els.push(el);
  }));
  const onShow = el => {
    el.classList.add('is-in');
    $$('[data-pe-count]', el).forEach(countUp);
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
    const to = Number(el.dataset.peCount);
    if (reduce) { el.textContent = to.toLocaleString('en-GB'); return; }
    const t0 = performance.now(), dur = 1100;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e).toLocaleString('en-GB');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = to.toLocaleString('en-GB'); }, dur + 400);
  }

  /* ---- Commission calculator (illustrative) ---- */
  const TIERS = [{ name: 'Starter', min: 0, rate: .25 }, { name: 'Rising', min: 20, rate: .30 }, { name: 'Established', min: 50, rate: .35 }, { name: 'Premier', min: 150, rate: .40 }];
  const CPA = 90, HY_RATE = .20, HY_CPA = 40, RETAIN = .70, MONTHS = 12;
  const pIn = $('#pe-players'), rIn = $('#pe-revenue');
  const pOut = $('#pe-players-out'), rOut = $('#pe-revenue-out');
  const out = k => $(`[data-out="${k}"]`);
  const bars = $$('.pe-bar');
  const terms = $('[data-terms]');
  const tierEls = $$('.pe-tier');
  const tierFor = n => TIERS.reduce((t, x) => (n >= x.min ? x : t), TIERS[0]);
  const fill = input => input.style.setProperty('--fill', ((input.value - input.min) / (input.max - input.min) * 100) + '%');

  function calc() {
    if (!pIn || !rIn) return;
    const n = Number(pIn.value), r = Number(rIn.value);
    const model = ($('input[name="pe-model"]:checked') || {}).value || 'rs';
    const tier = tierFor(n);
    pOut.textContent = n; rOut.textContent = eur(r);
    fill(pIn); fill(rIn);
    let active = 0, totalRev = 0, totalCom = 0;
    const monthly = [];
    for (let m = 0; m < MONTHS; m++) {
      active = active * RETAIN + n;
      const rev = active * r;
      let com = 0;
      if (model === 'rs') com = rev * tier.rate;
      if (model === 'cpa') com = n * CPA;
      if (model === 'hy') com = rev * HY_RATE + n * HY_CPA;
      monthly.push(com); totalRev += rev; totalCom += com;
    }
    const max = Math.max(...monthly, 1);
    bars.forEach((b, i) => b.style.setProperty('--h', Math.max(.03, monthly[i] / max).toFixed(3)));
    out('total').textContent = eur(totalCom);
    out('m12').textContent = eur(monthly[MONTHS - 1]);
    out('rev').textContent = eur(totalRev);
    out('keep').textContent = eur(totalRev - totalCom);
    out('pct').textContent = (totalRev ? (totalCom / totalRev * 100) : 0).toFixed(1) + '%';
    out('cpp').textContent = eur(totalCom / (n * MONTHS));
    const pill = out('tier');
    pill.textContent = tier.name + ' tier';
    pill.classList.toggle('is-hidden', model !== 'rs');
    if (model === 'rs') terms.innerHTML = `Revenue share at <b>${Math.round(tier.rate * 100)}%</b>, set by the ${tier.name} tier at ${n} players a month.`;
    if (model === 'cpa') terms.innerHTML = `<b>€${CPA}</b> per qualifying first-time depositor, paid once.`;
    if (model === 'hy') terms.innerHTML = `<b>${HY_RATE * 100}%</b> revenue share plus <b>€${HY_CPA}</b> per qualifying player.`;
    tierEls.forEach((t, i) => t.classList.toggle('is-current', TIERS[i] === tier));
    const chart = $('[data-chart-label]');
    if (chart) chart.setAttribute('aria-label', `Monthly partner earnings rise from ${eur(monthly[0])} in month 1 to ${eur(monthly[MONTHS - 1])} in month 12`);
  }
  [pIn, rIn].forEach(i => i && i.addEventListener('input', calc));
  $$('input[name="pe-model"]').forEach(i => i.addEventListener('change', calc));
  calc();

  /* ---- Onboarding line fills as you scroll ---- */
  const flow = $('.pe-flow');
  if (flow) {
    const items = $$('li', flow);
    let ticking = false;
    const paint = () => {
      ticking = false;
      const r = flow.getBoundingClientRect(), vh = innerHeight;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (vh * .6 - r.top) / r.height));
      flow.style.setProperty('--fp', p.toFixed(3));
      items.forEach((li, i) => li.classList.toggle('is-reached', p >= i / items.length + .02 || p === 1));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    addEventListener('resize', paint);
    paint();
  }
})();
