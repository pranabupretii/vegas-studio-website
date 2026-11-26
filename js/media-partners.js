// Media partners: newsroom interactions.
(() => {
 'use strict';
 const page = document.querySelector('.nr-page');
 if (!page) return;
 const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

 // Scroll reveals, rule-line draws and the lead image settle.
 const sel = ['.nr-list > li', '.nr-notes', '.nr-glance', '.nr-kit-grid > article', '.nr-sheet > li', '.nr-columns > article', '.nr-usage-list > li', '.nr-card', '.nr-contact-side', '.nr-faq-list > details', '.nr-table-wrap'];
 const els = [];
 sel.forEach(s => page.querySelectorAll(s).forEach(el => {
  const sibs = [...el.parentElement.children].filter(c => c.matches(s));
  el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6));
  el.setAttribute('data-nr-rv', '');
  els.push(el);
 }));
 const extra = [...page.querySelectorAll('.nr-rule-head, .nr-lead-fig')];
 const all = els.concat(extra);
 if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('nr-js');
  const io = new IntersectionObserver(es => es.forEach(e => {
   if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
  all.forEach(el => io.observe(el));
  setTimeout(() => all.forEach(el => el.classList.add('is-in')), 4000);
 } else {
  all.forEach(el => el.classList.add('is-in'));
 }

 // Ticker: duplicate items for a seamless loop, plus a pause button.
 const ticker = page.querySelector('[data-nr-ticker]');
 if (ticker) {
  const track = ticker.querySelector('.nr-ticker-track');
  [...track.children].forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.append(c); });
  const btn = ticker.querySelector('[data-nr-ticker-toggle]');
  btn.addEventListener('click', () => {
   const p = ticker.classList.toggle('is-paused');
   btn.setAttribute('aria-pressed', String(p));
   btn.textContent = p ? 'Play' : 'Pause';
  });
 }

 // News list: label items as coming up or released from today's date, and filter.
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const items = [...page.querySelectorAll('.nr-list > li[data-date]')];
 items.forEach(li => {
  const [y, m, d] = li.dataset.date.split('-').map(Number);
  const coming = new Date(y, m - 1, d) > today;
  li.classList.toggle('is-coming', coming);
  li.dataset.state = coming ? 'coming' : 'out';
  const label = li.querySelector('[data-nr-state]');
  if (label) label.textContent = coming ? 'Coming up' : 'Released';
 });
 const filters = [...page.querySelectorAll('[data-nr-filter]')];
 filters.forEach(f => f.addEventListener('click', () => {
  const v = f.dataset.nrFilter;
  filters.forEach(x => x.setAttribute('aria-pressed', String(x === f)));
  items.forEach(li => { li.hidden = v !== 'all' && li.dataset.state !== v; if (!li.hidden) li.classList.add('is-in'); });
 }));

 // Fact sheet: copy confirmed (catalogue) rows as plain text.
 const copyBtn = page.querySelector('[data-nr-copy]');
 const msg = page.querySelector('.nr-copy-msg');
 if (copyBtn) copyBtn.addEventListener('click', async () => {
  const text = 'Vegas Studio fact sheet\n' + [...page.querySelectorAll('tr[data-nr-fact]')]
   .map(tr => tr.querySelector('th').textContent.trim() + ': ' + tr.querySelector('td').textContent.trim()).join('\n');
  try {
   await navigator.clipboard.writeText(text);
   msg.textContent = 'Copied to your clipboard.';
  } catch (e) {
   msg.textContent = 'Copy is not available here. Select the table text instead.';
  }
  setTimeout(() => { msg.textContent = ''; }, 4000);
 });
})();
