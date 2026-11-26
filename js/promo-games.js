/* Promo games: demo prize wheel, mystery pick, themes carousel, reveals. All demos are illustrative. */
(() => {
  'use strict';
  const page = document.querySelector('.pl-page');
  if (!page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canIO = 'IntersectionObserver' in window;

  /* ---------- reveals ---------- */
  const rv = [];
  const mark = (sel, each) => document.querySelectorAll(sel).forEach(p => {
    [...p.querySelectorAll(each)].forEach((el, i) => { el.style.setProperty('--i', i); });
  });
  mark('.pl-tickets', '.pl-ticket');
  mark('.pl-week', 'b.pl-dot');
  document.querySelectorAll('.pl-freq li, .pl-theme, .pl-center-head, .pl-split-head').forEach(el => el.classList.add('pl-rv'));
  document.querySelectorAll('.pl-freq').forEach(p => [...p.children].forEach((el, i) => el.style.setProperty('--i', i)));
  document.querySelectorAll('.pl-car-track').forEach(p => [...p.children].forEach((el, i) => el.style.setProperty('--i', Math.min(i, 3))));
  rv.push(...document.querySelectorAll('.pl-tickets,.pl-week,.pl-panel,.pl-rv'));
  const show = el => el.classList.add('is-in');
  if (!reduced && canIO) {
    page.classList.add('pl-anim');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(el => io.observe(el));
    setTimeout(() => rv.forEach(show), 4000); // failsafe
  } else rv.forEach(show);

  /* ---------- wheel rim bulbs ---------- */
  const rim = document.querySelector('[data-rim]');
  const bulbs = [];
  if (rim) {
    const ns = 'http://www.w3.org/2000/svg';
    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', 170); ring.setAttribute('cy', 170); ring.setAttribute('r', 162); ring.setAttribute('class', 'ring');
    rim.appendChild(ring);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (170 + 162 * Math.cos(a)).toFixed(1));
      c.setAttribute('cy', (170 + 162 * Math.sin(a)).toFixed(1));
      c.setAttribute('r', 4.2); c.setAttribute('class', 'bulb');
      rim.appendChild(c); bulbs.push(c);
    }
  }
  let chase = null, step = 0;
  const startChase = fast => {
    if (reduced || !bulbs.length) return;
    clearInterval(chase);
    chase = setInterval(() => { step++; bulbs.forEach((b, i) => b.classList.toggle('off', (i + step) % 2 === 0)); }, fast ? 90 : 600);
  };
  startChase(false);

  /* ---------- wheel demo ---------- */
  const disc = document.querySelector('[data-wheel]');
  const spinBtn = document.querySelector('[data-spin]');
  const resultBox = document.querySelector('[data-wheel-result]');
  const resetBtn = document.querySelector('[data-wheel-reset]');
  const leftEl = document.querySelector('[data-spins-left]');
  const prizes = [
    { t: '10 free spins', d: 'In a live game, the spins would be added to a chosen slot.' },
    { t: '50 points', d: 'Points would go to the player’s loyalty balance.' },
    { t: 'Mystery box', d: 'The player would open a mystery pick next.' },
    { t: 'Try again tomorrow', d: 'The wheel resets at midnight.', miss: true },
    { t: '5 free spins', d: 'In a live game, the spins would be added to a chosen slot.' },
    { t: 'Bonus game', d: 'A short bonus round would start next.' },
    { t: '100 points', d: 'Points would go to the player’s loyalty balance.' },
    { t: 'Double points', d: 'Points earned for the rest of the day would count twice.' }
  ];
  const weights = [10, 22, 8, 20, 14, 6, 12, 8]; // illustrative odds
  let rot = 0, spinsLeft = 3, spinning = false;
  const pick = () => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
    return 0;
  };
  const setResult = (label, text, win) => {
    resultBox.querySelector('.pl-result-label').textContent = label;
    resultBox.querySelector('.pl-result-text').textContent = text;
    resultBox.classList.toggle('is-win', !!win);
  };
  if (disc && spinBtn) {
    spinBtn.addEventListener('click', () => {
      if (spinning || spinsLeft <= 0) return;
      spinning = true; spinBtn.disabled = true;
      const i = pick();
      const centre = i * 45 + 22.5;
      const jitter = (Math.random() - 0.5) * 30;
      const current = ((rot % 360) + 360) % 360;
      let delta = (360 - centre + jitter - current + 720) % 360;
      rot += 360 * 5 + delta;
      setResult('Spinning', 'Round and round…', false);
      disc.parentElement.classList.remove('is-landed');
      startChase(true);
      disc.style.rotate = rot + 'deg';
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        spinning = false; spinsLeft--;
        leftEl.textContent = spinsLeft;
        const p = prizes[i];
        setResult(p.miss ? 'No prize this time' : 'You landed on', p.t + '. ' + p.d, !p.miss);
        disc.parentElement.classList.add('is-landed');
        startChase(false);
        if (spinsLeft > 0) spinBtn.disabled = false;
        else {
          spinBtn.textContent = 'Come back tomorrow';
          setTimeout(() => setResult('That was the last demo spin', 'In a live game, players come back tomorrow for the next one.', false), reduced ? 0 : 2600);
          resetBtn.hidden = false;
        }
      };
      disc.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, reduced ? 50 : 4900); // fallback if transitionend does not fire
    });
    resetBtn.addEventListener('click', () => {
      spinsLeft = 3; leftEl.textContent = spinsLeft;
      spinBtn.disabled = false; spinBtn.textContent = 'Spin the wheel';
      resetBtn.hidden = true;
      setResult('Result', 'Press spin to see where it lands.', false);
      spinBtn.focus();
    });
  }

  /* ---------- mystery pick ---------- */
  const giftWrap = document.querySelector('[data-gifts]');
  if (giftWrap) {
    const boxes = [...giftWrap.querySelectorAll('.pl-box')];
    const status = document.querySelector('[data-gift-status]');
    const again = document.querySelector('[data-gift-again]');
    const pool = [
      ['20 free spins', 'on a featured slot'], ['75 points', 'for your loyalty level'], ['Bonus round', 'played straight away'],
      ['10 free spins', 'on a new release'], ['Double points', 'for the rest of the day'], ['Surprise skin', 'a new look for your wheel']
    ];
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let deal = [];
    const reset = () => {
      deal = shuffle(pool.slice()).slice(0, 3);
      boxes.forEach((b, k) => {
        b.classList.remove('is-open', 'is-picked', 'is-other');
        const btn = b.querySelector('button'); btn.disabled = false;
        b.querySelector('.pl-box-prize b').textContent = deal[k][0];
        b.querySelector('.pl-box-prize span').textContent = deal[k][1];
      });
      giftWrap.classList.remove('is-done');
      status.textContent = 'Choose one of the three boxes.';
      again.hidden = true;
    };
    reset();
    boxes.forEach((b, k) => b.querySelector('button').addEventListener('click', () => {
      if (giftWrap.classList.contains('is-done')) return;
      giftWrap.classList.add('is-done');
      boxes.forEach(x => { x.querySelector('button').disabled = true; });
      b.classList.add('is-open', 'is-picked');
      status.textContent = `You picked box ${k + 1}: ${deal[k][0]}, ${deal[k][1]}.`;
      setTimeout(() => {
        boxes.forEach((x, j) => { if (j !== k) x.classList.add('is-open', 'is-other'); });
        const others = deal.filter((_, j) => j !== k).map(d => d[0]).join(' and ');
        status.textContent = `You picked box ${k + 1}: ${deal[k][0]}. The other boxes held ${others}.`;
        again.hidden = false;
      }, reduced ? 0 : 900);
    }));
    again.addEventListener('click', () => { reset(); boxes[0].querySelector('button').focus(); });
  }

  /* ---------- themes carousel ---------- */
  const car = document.querySelector('[data-carousel]');
  if (car) {
    const bar = document.querySelector('[data-car-bar]');
    const btns = [...document.querySelectorAll('[data-car]')];
    const update = () => {
      const max = car.scrollWidth - car.clientWidth;
      const vis = car.clientWidth / car.scrollWidth;
      const p = max > 0 ? car.scrollLeft / max : 1;
      bar.style.scale = `${Math.min(1, vis + (1 - vis) * p)} 1`;
      btns[0].disabled = car.scrollLeft <= 2;
      btns[1].disabled = car.scrollLeft >= max - 2;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const card = car.querySelector('.pl-theme');
      const stepW = card ? card.getBoundingClientRect().width + 24 : car.clientWidth;
      car.scrollBy({ left: Number(b.dataset.car) * stepW, behavior: reduced ? 'auto' : 'smooth' });
    }));
    car.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }
})();
