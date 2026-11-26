// Affiliates: creator toolkit interactions.
(() => {
 'use strict';
 const page = document.querySelector('.cr-page');
 if (!page) return;
 const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

 // Scroll reveals with a stagger and a failsafe.
 const sel = ['.cr-masonry > li', '.cr-wall > li', '.cr-path > li', '.cr-board', '.cr-rules-intro', '.cr-faq-grid > details', '.cr-head', '.cr-next', '.cr-tabs', '.cr-cta-card'];
 const els = [];
 sel.forEach(s => page.querySelectorAll(s).forEach(el => {
  const sibs = [...el.parentElement.children].filter(c => c.matches(s));
  el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6));
  el.setAttribute('data-cr-rv', '');
  els.push(el);
 }));
 const fan = page.querySelector('.cr-fan');
 if (fan) els.push(fan);
 if (!reduce && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('cr-js');
  const io = new IntersectionObserver(es => es.forEach(e => {
   if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
  els.forEach(el => io.observe(el));
  setTimeout(() => els.forEach(el => el.classList.add('is-in')), 4000);
 } else {
  els.forEach(el => el.classList.add('is-in'));
 }

 // Asset gallery filter.
 const chips = [...page.querySelectorAll('[data-cr-filter]')];
 const tiles = [...page.querySelectorAll('.cr-masonry > li')];
 chips.forEach(c => c.addEventListener('click', () => {
  const v = c.dataset.crFilter;
  chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
  tiles.forEach(t => { t.hidden = v !== 'all' && t.dataset.kind !== v; if (!t.hidden) t.classList.add('is-in'); });
 }));

 // Release calendar: status labels, current month and countdown from today's date.
 const today = new Date(); today.setHours(0, 0, 0, 0);
 const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
 const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
 const rels = [...page.querySelectorAll('.cr-rel[data-date]')];
 let next = null;
 rels.forEach(r => {
  const d = parse(r.dataset.date);
  const coming = d > today;
  r.classList.toggle('is-coming', coming);
  r.querySelector('.cr-status').textContent = coming ? 'Coming' : 'Out now';
  if (coming && (!next || d < next.d)) next = { d, r };
 });
 const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
 page.querySelectorAll('.cr-month').forEach(m => {
  const t = m.querySelector('.cr-mname').textContent.trim().split(' ');
  if (t.length === 2 && months.indexOf(t[0]) === today.getMonth() && Number(t[1]) === today.getFullYear()) m.classList.add('is-now');
 });
 const box = page.querySelector('[data-cr-next]');
 if (box) {
  if (next) {
   const days = Math.round((next.d - today) / 86400000);
   box.querySelector('.cr-next-name').textContent = next.r.querySelector('b').textContent;
   box.querySelector('.cr-next-date').textContent = fmt(next.d);
   box.querySelector('.cr-next-count').innerHTML = '<b>' + days + '</b> ' + (days === 1 ? 'day' : 'days') + ' to go';
  } else {
   box.hidden = true;
  }
 }

 // Content-format tabs (roving tabindex, arrow keys).
 const tabs = [...page.querySelectorAll('.cr-tablist [role="tab"]')];
 const choose = tab => tabs.forEach(t => {
  const on = t === tab;
  t.setAttribute('aria-selected', String(on));
  t.tabIndex = on ? 0 : -1;
  document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
 });
 tabs.forEach((t, i) => {
  t.addEventListener('click', () => choose(t));
  t.addEventListener('keydown', e => {
   let n = i;
   if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
   else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
   else if (e.key === 'Home') n = 0;
   else if (e.key === 'End') n = tabs.length - 1;
   else return;
   e.preventDefault(); choose(tabs[n]); tabs[n].focus();
  });
 });
})();
