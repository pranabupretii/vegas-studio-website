/* Custom games: hero ink-in, storyboard scroller, before/after slider, customisation picker, reveals. */
(() => {
  'use strict';
  const page = document.querySelector('.sk-page');
  if (!page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canIO = 'IntersectionObserver' in window;

  /* ---------- timeline rows (stack overlapping stages) ---------- */
  document.querySelectorAll('.sk-bar-wrap').forEach(wrap => {
    const bars = [...wrap.querySelectorAll('.sk-seg-bar')];
    const rowsEnd = [];
    bars.forEach((b, i) => {
      const s = parseFloat(b.style.getPropertyValue('--s')), e = parseFloat(b.style.getPropertyValue('--e'));
      let r = rowsEnd.findIndex(end => end <= s);
      if (r < 0) { r = rowsEnd.length; rowsEnd.push(e); } else rowsEnd[r] = e;
      b.style.setProperty('--r', r);
      b.style.setProperty('--i', i);
    });
    wrap.style.setProperty('--rows', Math.max(rowsEnd.length, 1));
  });

  /* ---------- reveals ---------- */
  const idx = (sel, child) => document.querySelectorAll(sel).forEach(p => [...p.querySelectorAll(child)].forEach((el, i) => el.style.setProperty('--i', Math.min(i, 8))));
  idx('.sk-compare-table', '.sk-ct-row');
  idx('.sk-frames', '.sk-frame');
  idx('.sk-credits', 'div');
  const targets = [...document.querySelectorAll('.sk-hero-art,.sk-compare-table,.sk-frames,.sk-credits,.sk-ruler,.sk-slider')];
  const show = el => {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    if (el.classList.contains('sk-slider') && !reduced) { el.classList.add('is-hint'); }
  };
  if (!reduced && canIO) {
    page.classList.add('sk-anim');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(el => io.observe(el));
    setTimeout(() => targets.forEach(show), 4000); // failsafe
  } else targets.forEach(show);

  /* ---------- storyboard scroller ---------- */
  const board = document.querySelector('[data-board]');
  if (board) {
    const bar = document.querySelector('[data-board-bar]');
    const btns = [...document.querySelectorAll('[data-story-step]')];
    const update = () => {
      const max = board.scrollWidth - board.clientWidth;
      const vis = board.clientWidth / board.scrollWidth;
      const p = max > 0 ? board.scrollLeft / max : 1;
      bar.style.scale = `${Math.min(1, vis + (1 - vis) * p)} 1`;
      btns[0].disabled = board.scrollLeft <= 2;
      btns[1].disabled = board.scrollLeft >= max - 2;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const f = board.querySelector('.sk-frame');
      const w = f ? f.getBoundingClientRect().width + 28 : 360;
      board.scrollBy({ left: Number(b.dataset.storyStep) * w, behavior: reduced ? 'auto' : 'smooth' });
    }));
    board.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* ---------- before / after ---------- */
  const slider = document.querySelector('[data-compare]');
  if (slider) {
    const range = slider.querySelector('[data-compare-range]');
    const set = v => slider.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => { set(range.value); slider.classList.remove('is-hint'); });
    set(range.value);
    const imgs = [...slider.querySelectorAll('[data-compare-img]')];
    document.querySelectorAll('[data-compare-src]').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('[data-compare-src]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      imgs.forEach(img => { img.src = btn.dataset.compareSrc; });
      imgs[0].alt = `${btn.textContent} game screen in full colour`;
      range.value = 50; set(50);
    }));
  }

  /* ---------- customisation picker ---------- */
  const machine = document.querySelector('[data-machine]');
  if (machine) {
    const reels = machine.querySelector('[data-reels]');
    const nameOut = machine.querySelector('[data-machine-name]');
    const nameIn = document.querySelector('[data-sk-name]');
    const status = document.querySelector('[data-machine-status]');
    const sets = {
      classic: { label: 'Classic fruits', syms: ['seven', 'cherry', 'bell', 'lemon', 'bar'] },
      gems: { label: 'Gems', syms: ['diamond', 'hex', 'round', 'emerald', 'tri'] },
      myth: { label: 'Myth and magic', syms: ['crown', 'moon', 'star', 'potion', 'eye'] }
    };
    const layout = [0, 1, 2, 1, 3, 4, 0, 3, 2, 1, 2, 4, 1, 0, 3]; // 5 x 3, row by row
    let setKey = 'classic', themeName = 'Studio pink', statusT = null;
    const render = animate => {
      const syms = sets[setKey].syms;
      reels.innerHTML = '';
      layout.forEach((k, i) => {
        const cell = document.createElement('span');
        cell.className = `sk-cell c${k}` + (animate ? ' is-new' : '');
        cell.style.setProperty('--col', i % 5);
        cell.style.setProperty('--row', Math.floor(i / 5));
        cell.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#sym-${syms[k]}"></use></svg>`;
        reels.appendChild(cell);
      });
    };
    const say = () => {
      clearTimeout(statusT);
      statusT = setTimeout(() => {
        const n = (nameIn.value || '').trim() || 'Your game';
        status.textContent = `Preview: ${sets[setKey].label} in ${themeName}, named ${n}.`;
      }, 350);
    };
    document.querySelectorAll('input[name="sk-theme"]').forEach(r => r.addEventListener('change', () => {
      machine.style.setProperty('--theme', r.value);
      themeName = r.dataset.name;
      say();
    }));
    document.querySelectorAll('input[name="sk-set"]').forEach(r => r.addEventListener('change', () => {
      setKey = r.value; render(!reduced); say();
    }));
    nameIn.addEventListener('input', () => {
      nameOut.textContent = (nameIn.value || '').trim() || 'Your game';
      say();
    });
    render(false);
  }
})();
