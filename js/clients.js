// For operators: launch-kit bento interactions.
(() => {
 'use strict';
 const page = document.querySelector('.op-page');
 if (!page) return;
 const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

 // Scroll reveals: bento tiles, then cards in later sections.
 const rvSel = ['.op-shelf-grid > li', '.op-box-list > li', '.op-sol-grid > li', '.op-timeline > li', '.op-faq-list > details', '.op-cta-grid > *', '.op-head', '.op-table-scroll'];
 const tiles = [...page.querySelectorAll('[data-op-tile]')];
 const rv = [];
 rvSel.forEach(sel => page.querySelectorAll(sel).forEach(el => {
  const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
  el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6));
  el.setAttribute('data-op-rv', '');
  rv.push(el);
 }));
 tiles.forEach((t, i) => t.style.setProperty('--d', i));
 const timeline = page.querySelector('.op-timeline');
 const all = [...tiles, ...rv, timeline].filter(Boolean);
 if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('op-js');
  const io = new IntersectionObserver(es => es.forEach(e => {
   if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
  all.forEach(el => io.observe(el));
  // Failsafe: never leave anything hidden.
  setTimeout(() => all.forEach(el => el.classList.add('is-in')), 4000);
 } else {
  all.forEach(el => el.classList.add('is-in'));
 }

 // Day-one checklist.
 const checks = [...page.querySelectorAll('.op-checklist button')];
 const done = page.querySelector('[data-op-done]');
 const bar = page.querySelector('[data-op-bar]');
 const sync = () => {
  const n = checks.filter(b => b.getAttribute('aria-pressed') === 'true').length;
  if (done) done.textContent = n;
  if (bar) bar.style.transform = 'scaleX(' + (n / checks.length) + ')';
 };
 checks.forEach(b => b.addEventListener('click', () => {
  b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  sync();
 }));

 // Games shelf filter.
 const filters = [...page.querySelectorAll('[data-op-filter]')];
 const shelf = [...page.querySelectorAll('.op-shelf-grid > li')];
 filters.forEach(f => f.addEventListener('click', () => {
  const v = f.dataset.opFilter;
  filters.forEach(x => x.setAttribute('aria-pressed', String(x === f)));
  shelf.forEach(li => { li.hidden = v !== 'all' && li.dataset.type !== v; if (!li.hidden) li.classList.add('is-in'); });
 }));

 // Platforms marquee: duplicate the list for a seamless loop.
 const mq = page.querySelector('[data-op-marquee]');
 const mqBtn = page.querySelector('[data-op-marquee-toggle]');
 if (mq) {
  const track = mq.querySelector('.op-marquee-track');
  [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.append(c); });
  if (mqBtn) mqBtn.addEventListener('click', () => {
   const paused = mq.classList.toggle('is-paused');
   mqBtn.setAttribute('aria-pressed', String(paused));
   mqBtn.querySelector('span').textContent = paused ? 'Play' : 'Pause';
   mqBtn.querySelector('path').setAttribute('d', paused ? 'M8 5l11 7-11 7z' : 'M9 6v12M15 6v12');
  });
 }

 // Quotes carousel.
 const car = page.querySelector('[data-op-carousel]');
 if (car) {
  const slides = [...car.querySelectorAll('.op-slide')];
  const dots = [...car.querySelectorAll('.op-dots button')];
  const playBtn = page.querySelector('[data-op-play]');
  let i = 0, timer = null, userPaused = reduce, hover = false;
  const show = n => {
   i = (n + slides.length) % slides.length;
   slides.forEach((s, k) => { s.hidden = k !== i; s.classList.toggle('is-active', k === i); });
   dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { stop(); if (!userPaused && !hover) timer = setInterval(() => show(i + 1), 7000); };
  page.querySelector('[data-op-prev]').addEventListener('click', () => { show(i - 1); start(); });
  page.querySelector('[data-op-next]').addEventListener('click', () => { show(i + 1); start(); });
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); start(); }));
  const zone = car.closest('.op-quotes-inner');
  zone.addEventListener('mouseenter', () => { hover = true; stop(); });
  zone.addEventListener('mouseleave', () => { hover = false; start(); });
  zone.addEventListener('focusin', () => { hover = true; stop(); });
  zone.addEventListener('focusout', e => { if (!zone.contains(e.relatedTarget)) { hover = false; start(); } });
  const syncPlay = () => {
   playBtn.setAttribute('aria-pressed', String(userPaused));
   playBtn.setAttribute('aria-label', userPaused ? 'Start automatic rotation' : 'Pause automatic rotation');
   playBtn.querySelector('path').setAttribute('d', userPaused ? 'M8 5l11 7-11 7z' : 'M9 6v12M15 6v12');
  };
  if (playBtn) playBtn.addEventListener('click', () => { userPaused = !userPaused; syncPlay(); start(); });
  if (playBtn) syncPlay();
  show(0); start();
 }
})();
