/* Players games: featured rotation, shelf rails, filter/search/sort grid, favourites (localStorage) and reveals. */
(() => {
  const root = document.querySelector('.pg-page');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  document.documentElement.classList.add('pg-js');
  if (!reduce) root.classList.add('pg-anim');

  /* ---- Reveals ---- */
  const groups = ['.pg-hero-copy > *', '.pg-head > *', '.pg-shelf', '.pg-soon-card', '.pg-tools', '.pg-chips', '.pg-favs-box', '.pg-learn-card', '.pg-table-wrap', '.pg-more-card', '.pg-care-inner'];
  const els = [];
  groups.forEach(sel => $$(sel).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
    el.style.setProperty('--i', Math.min(Math.max(sibs.indexOf(el), 0), 6));
    el.setAttribute('data-pg-reveal', '');
    els.push(el);
  }));
  $$('.pg-rail').forEach(r => $$('.pg-cover', r).forEach((c, i) => c.style.setProperty('--k', i)));
  const showAll = () => els.forEach(el => el.classList.add('is-in'));
  if (reduce || !('IntersectionObserver' in window)) showAll();
  else {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .06 });
    els.forEach(el => io.observe(el));
    setTimeout(showAll, 4000);
  }

  /* ---- Featured carousel ---- */
  const feature = $('.pg-feature');
  if (feature) {
    const slides = $$('.pg-slide', feature), dots = $$('.pg-dot', feature), banners = $$('.pg-hero-banner');
    const pauseBtn = $('.pg-pause', feature);
    const DUR = 6000;
    feature.style.setProperty('--dur', DUR + 'ms');
    let cur = 0, timer = null, userPaused = reduce, hoverPaused = false;
    const go = (n, manual) => {
      cur = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        const on = i === cur;
        s.classList.toggle('is-on', on);
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        $$('a', s).forEach(a => { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
      });
      dots.forEach((d, i) => { d.setAttribute('aria-current', String(i === cur)); const i2 = d.querySelector('i'); i2.style.animation = 'none'; void i2.offsetWidth; i2.style.animation = ''; });
      banners.forEach((b, i) => b.classList.toggle('is-on', i === cur));
      feature.querySelector('.pg-feature-stage').setAttribute('aria-live', manual ? 'polite' : 'off');
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      const paused = userPaused || hoverPaused;
      feature.classList.toggle('is-paused', paused);
      if (!paused) timer = setTimeout(() => go(cur + 1, false), DUR);
    };
    $$('[data-slide]', feature).forEach(b => b.addEventListener('click', () => go(cur + Number(b.dataset.slide), true)));
    dots.forEach(d => d.addEventListener('click', () => go(Number(d.dataset.dot), true)));
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play rotation' : 'Pause rotation');
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', String(userPaused));
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play rotation' : 'Pause rotation');
      schedule();
    });
    feature.addEventListener('mouseenter', () => { hoverPaused = true; schedule(); });
    feature.addEventListener('mouseleave', () => { hoverPaused = false; schedule(); });
    feature.addEventListener('focusin', () => { hoverPaused = true; schedule(); });
    feature.addEventListener('focusout', e => { if (!feature.contains(e.relatedTarget)) { hoverPaused = false; schedule(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else schedule(); });
    schedule();
  }

  /* ---- Shelf rails ---- */
  $$('.pg-shelf').forEach(shelf => {
    const rail = $('.pg-rail', shelf), btns = $$('.pg-rail-btn', shelf);
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      btns[0].disabled = rail.scrollLeft <= 2;
      btns[1].disabled = rail.scrollLeft >= max;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      rail.scrollBy({ left: rail.clientWidth * .8 * Number(b.dataset.rail), behavior: reduce ? 'auto' : 'smooth' });
    }));
    rail.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  });

  /* ---- Coming soon: days left (static date stays if this fails) ---- */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  $$('[data-until]').forEach(el => {
    const [y, m, d] = el.dataset.until.split('-').map(Number);
    const days = Math.round((new Date(y, m - 1, d) - today) / 864e5);
    if (days > 1) el.textContent = `Planned in ${days.toLocaleString('en-GB')} days`;
    else if (days === 1) el.textContent = 'Planned for tomorrow';
    else if (days === 0) el.textContent = 'Planned for today';
  });

  /* ---- Favourites ---- */
  const KEY = 'vs-players-favourites';
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(favs)) favs = []; } catch { favs = []; }
  const info = {};
  $$('.pg-cover').forEach(c => {
    const a = c.querySelector('a');
    info[a.getAttribute('href')] = { name: c.querySelector('b').textContent, cover: c.querySelector('img').getAttribute('src') };
  });
  favs = favs.filter(h => info[h]);
  const favList = $('.pg-favs-list'), favCount = $('.pg-fav-count'), clearFavs = $('.pg-clear-favs');
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch { /* storage blocked: favourites last for this visit only */ } };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function paintFavs() {
    $$('.pg-fav').forEach(b => {
      const on = favs.includes(b.dataset.fav);
      b.setAttribute('aria-pressed', String(on));
      const name = info[b.dataset.fav] ? info[b.dataset.fav].name : 'game';
      b.setAttribute('aria-label', on ? `Remove ${name} from favourites` : `Save ${name} to favourites`);
    });
    favCount.textContent = favs.length;
    clearFavs.hidden = favs.length === 0;
    favList.innerHTML = favs.map(h => `<li><a href="${esc(h)}"><img src="${esc(info[h].cover)}" alt="" loading="lazy"><b>${esc(info[h].name)}</b></a><button type="button" class="pg-fav" data-fav="${esc(h)}" aria-pressed="true" aria-label="Remove ${esc(info[h].name)} from favourites"><svg class="pg-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg></button></li>`).join('');
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('.pg-fav');
    if (!b) return;
    e.preventDefault();
    const h = b.dataset.fav;
    favs = favs.includes(h) ? favs.filter(x => x !== h) : [...favs, h];
    save();
    const inFavList = favList.contains(b);
    paintFavs();
    if (!reduce && !inFavList) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); }
    if (mood === 'fav') apply(false);
  });
  clearFavs.addEventListener('click', () => { favs = []; save(); paintFavs(); if (mood === 'fav') apply(false); });

  /* ---- Grid: filter, search, sort ---- */
  const grid = $('.pg-grid');
  const cards = $$('.pg-card', grid);
  const input = $('#pg-q'), sortSel = $('#pg-sort'), countEl = $('#pg-count'), empty = $('.pg-empty');
  const chips = $$('.pg-chip');
  let mood = 'all';
  const sorters = {
    featured: (a, b) => a.dataset.order - b.dataset.order,
    az: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
    rtp: (a, b) => (b.dataset.rtp - a.dataset.rtp) || (a.dataset.order - b.dataset.order),
    rel: (a, b) => (b.dataset.rel || '').localeCompare(a.dataset.rel || '') || (a.dataset.order - b.dataset.order)
  };
  function apply(animate = true) {
    const q = input.value.trim().toLowerCase().replace(/[’]/g, "'");
    cards.slice().sort(sorters[sortSel.value]).forEach(c => grid.appendChild(c));
    let n = 0;
    $$('.pg-card', grid).forEach(c => {
      const okMood = mood === 'all' || (mood === 'soon' ? c.dataset.up === '1' : mood === 'fav' ? favs.includes(c.dataset.href) : c.dataset.mood === mood);
      const ok = okMood && (!q || c.dataset.name.includes(q));
      c.hidden = !ok;
      c.classList.remove('is-in-anim');
      if (ok) {
        c.style.setProperty('--k', Math.min(n, 12));
        if (animate && !reduce) { void c.offsetWidth; c.classList.add('is-in-anim'); }
        n++;
      }
    });
    empty.hidden = n > 0;
    $('.pg-empty-msg').textContent = mood === 'fav' && !q ? 'You have not saved any favourites yet. Tap the heart on a game to add it.' : 'No games match. Try another mood or clear the search.';
    const label = chips.find(c => c.dataset.mood === mood).firstChild.textContent.trim() || 'Favourites';
    countEl.textContent = n === cards.length ? `Showing all ${n} games` : `Showing ${n} of ${cards.length} games${mood !== 'all' ? ' · ' + (mood === 'fav' ? 'Favourites' : label) : ''}`;
  }
  chips.forEach(c => c.addEventListener('click', () => {
    mood = c.dataset.mood;
    chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    apply();
  }));
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => apply(), 140); });
  sortSel.addEventListener('change', () => apply());
  $('.pg-reset').addEventListener('click', () => { input.value = ''; mood = 'all'; chips.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.mood === 'all'))); apply(); });

  paintFavs();
})();
