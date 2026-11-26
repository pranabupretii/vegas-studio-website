/* FAQ help centre: live search with highlighting, topic chips, tile jumps, open/close all, reveals. */
(() => {
  const root = document.querySelector('.hc-page');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  document.documentElement.classList.add('hc-js');
  if (!reduce) root.classList.add('hc-anim');

  /* ---- Reveals ---- */
  const groups = ['.hc-hero-copy > *', '.hc-tiles > li', '.hc-side', '.hc-group', '.hc-head > *', '.hc-terms > li', '.hc-route', '.hc-care-box'];
  const els = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--i', Math.min(sibs.indexOf(el), 6));
    el.setAttribute('data-hc-reveal', '');
    els.push(el);
  }));
  const showAll = () => els.forEach(el => el.classList.add('is-in'));
  if (reduce || !('IntersectionObserver' in window)) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    els.forEach(el => io.observe(el));
    setTimeout(showAll, 4000);
  }

  /* ---- Search + filter ---- */
  const input = $('#hc-q');
  const form = $('.hc-search');
  const clear = $('.hc-clear');
  const status = $('#hc-status');
  const chips = $$('.hc-chip');
  const items = $$('.hc-q').map(d => {
    const qEl = $('.hc-q-text', d);
    return { d, qEl, q: qEl.textContent, hay: (qEl.textContent + ' ' + $('.hc-a', d).textContent).toLowerCase() };
  });
  const groupsEl = $$('.hc-group');
  const empty = $('.hc-empty');
  const total = items.length;
  let cat = 'all';
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => s.toLowerCase().replace(/[’']/g, "'").trim();

  function highlight(it, term) {
    if (!term) { it.qEl.textContent = it.q; return; }
    const i = it.q.toLowerCase().indexOf(term);
    if (i < 0) { it.qEl.textContent = it.q; return; }
    it.qEl.innerHTML = esc(it.q.slice(0, i)) + '<mark>' + esc(it.q.slice(i, i + term.length)) + '</mark>' + esc(it.q.slice(i + term.length));
  }

  function apply() {
    const term = norm(input.value);
    const words = term.split(/\s+/).filter(Boolean);
    let shown = 0;
    items.forEach(it => {
      const okCat = cat === 'all' || it.d.dataset.hcC === cat;
      const okTerm = !words.length || words.every(w => it.hay.replace(/[’]/g, "'").includes(w));
      const ok = okCat && okTerm;
      const was = !it.d.hidden;
      it.d.hidden = !ok;
      if (ok) {
        shown++;
        if (!was && !reduce) { it.d.classList.remove('is-pop'); void it.d.offsetWidth; it.d.classList.add('is-pop'); }
      }
      highlight(it, ok ? term : '');
    });
    groupsEl.forEach(g => { g.hidden = !$$('.hc-q', g).some(d => !d.hidden); });
    empty.hidden = shown > 0;
    $('.hc-empty-term').textContent = input.value.trim();
    clear.hidden = !input.value;
    const topic = cat === 'all' ? '' : ' in ' + chips.find(c => c.dataset.hcCat === cat).firstChild.textContent.trim();
    status.textContent = !words.length && cat === 'all' ? `Showing all ${total} answers`
      : shown === 0 ? `No answers found${topic}` : `Showing ${shown} of ${total} answers${topic}`;
    // With a focused search and few matches, open them so the answer is visible straight away.
    if (words.length && shown > 0 && shown <= 2) items.forEach(it => { if (!it.d.hidden) it.d.open = true; });
  }
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 120); });
  form.addEventListener('submit', e => { e.preventDefault(); apply(); $('#hc-answers').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  clear.addEventListener('click', () => { input.value = ''; apply(); input.focus(); });
  $('.hc-reset').addEventListener('click', () => { input.value = ''; setCat('all'); input.focus(); });

  function setCat(c) {
    cat = c;
    chips.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.hcCat === c)));
    apply();
  }
  chips.forEach(c => c.addEventListener('click', () => setCat(c.dataset.hcCat)));

  $$('[data-hc-term]').forEach(b => b.addEventListener('click', () => {
    input.value = b.dataset.hcTerm;
    setCat('all');
    $('#hc-answers').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  $$('[data-hc-jump]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    input.value = '';
    setCat(a.dataset.hcJump);
    $('#hc-answers').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));
  $$('[data-hc-all]').forEach(b => b.addEventListener('click', () => {
    const open = b.dataset.hcAll === 'open';
    items.forEach(it => { if (!it.d.hidden) it.d.open = open; });
  }));

  /* ---- Deep links: #q-... opens that answer, #hc-cat-... filters ---- */
  const h = location.hash.slice(1);
  if (h) {
    const q = document.getElementById(h);
    if (q && q.classList.contains('hc-q')) q.open = true;
    const m = h.match(/^hc-cat-(\w+)$/);
    if (m && chips.some(c => c.dataset.hcCat === m[1])) setCat(m[1]);
  }
})();
