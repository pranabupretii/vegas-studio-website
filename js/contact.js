/* Contact concierge: enquiry router, desk ticket, copyable outlines, checklist meter, desk hours status, reveals. */
(function () {
  'use strict';
  var page = document.querySelector('.ct-page');
  if (!page) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || page).querySelectorAll(sel)); };

  /* Reveal */
  var items = $$('[data-ct-reveal], .ct-picker');
  if (!reduce && 'IntersectionObserver' in window && items.length) {
    page.classList.add('ct-anim');
    var counts = new Map();
    items.forEach(function (el) {
      var key = el.parentElement;
      var n = counts.get(key) || 0;
      el.style.setProperty('--ct-d', Math.min(n, 6) * 0.08 + 's');
      counts.set(key, n + 1);
    });
    $$('.ct-choice').forEach(function (c, i) { c.style.setProperty('--ct-d', i * 0.06 + 's'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
  }

  /* Router */
  var choices = $$('.ct-choice');
  var panels = $$('[data-route-panel]');
  var status = document.getElementById('ct-route-status');
  var ticket = page.querySelector('.ct-ticket');
  var tWho = document.getElementById('ct-ticket-who');
  var tWhere = document.getElementById('ct-ticket-where');
  var tNo = document.getElementById('ct-ticket-no');
  var ticketTimer;

  function select(route, opts) {
    opts = opts || {};
    var chosen = null;
    choices.forEach(function (c, i) {
      var on = c.getAttribute('data-route') === route;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.tabIndex = on ? 0 : -1;
      if (on) { chosen = c; if (tNo) tNo.textContent = ('0' + (i + 1)).slice(-2); }
    });
    if (!chosen) return;
    var panel = null;
    panels.forEach(function (p) {
      var on = p.getAttribute('data-route-panel') === route;
      p.hidden = !on;
      p.classList.remove('is-entering');
      if (on) {
        panel = p;
        if (!reduce && !opts.silent) { void p.offsetWidth; p.classList.add('is-entering'); }
      }
    });
    if (opts.focus) chosen.focus();
    if (panel) {
      var who = panel.getAttribute('data-who');
      var where = panel.getAttribute('data-where');
      if (ticket && tWho && tWhere) {
        clearTimeout(ticketTimer);
        if (reduce || opts.silent) { tWho.textContent = who; tWhere.textContent = where; }
        else {
          ticket.classList.add('is-changing');
          ticketTimer = setTimeout(function () {
            tWho.textContent = who; tWhere.textContent = where;
            ticket.classList.remove('is-changing');
          }, 220);
        }
      }
      if (status && !opts.silent) {
        var h = panel.querySelector('h3');
        status.textContent = 'Showing route: ' + where + '. ' + (h ? h.textContent : '');
      }
    }
  }

  choices.forEach(function (c, i) {
    c.addEventListener('click', function () {
      select(c.getAttribute('data-route'));
      if (history.replaceState) history.replaceState(null, '', '#' + c.getAttribute('data-route'));
    });
    c.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = choices[(i + 1) % choices.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = choices[(i - 1 + choices.length) % choices.length];
      else if (e.key === 'Home') next = choices[0];
      else if (e.key === 'End') next = choices[choices.length - 1];
      if (next) { e.preventDefault(); select(next.getAttribute('data-route'), { focus: true }); }
    });
  });

  function routeFromHash() {
    var h = (location.hash || '').replace('#', '');
    return choices.some(function (c) { return c.getAttribute('data-route') === h; }) ? h : null;
  }
  var initial = routeFromHash();
  select(initial || 'operator', { silent: true });
  if (initial) {
    var router = document.getElementById('contact-options');
    if (router) setTimeout(function () { router.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, 60);
  }
  window.addEventListener('hashchange', function () {
    var r = routeFromHash();
    if (r) select(r);
  });

  /* Copyable outlines */
  var outlines = {
    operator: 'Subject: Operator enquiry from [brand]\n\nWho we are: [company, brand, your role]\nMarkets: [where you operate]\nWhat we need: [games / aggregation / casino platform / custom games]\nCurrent platform or aggregator: [name or none]\nGames we are interested in: [titles]\nTarget launch: [date]\nBest time for a call: [days and times, time zone]\n',
    affiliate: 'Subject: Affiliate enquiry from [site]\n\nSite or channel: [URL]\nAudience: [who reads or watches]\nMarkets: [where your traffic comes from]\nGames to feature: [titles]\nAssets needed: [banners / screenshots / game sheets]\n',
    press: 'Subject: Press request from [publication]\n\nPublication or channel: [name and link]\nStory angle: [one or two sentences]\nQuestions: [list]\nDeadline: [date and time, time zone]\nNeeded: [game art / screenshots / interview]\n',
    careers: 'Subject: Open application for [team]\n\nTeam: [game art / game math / engineering / product / marketing / partner support]\nAbout me: [two or three sentences]\nWork samples: [portfolio, code, model or writing links]\nBased in: [city, country]\nAvailable from: [date]\n',
    players: 'Subject: Feedback about [game name]\n\nGame: [name]\nCasino where you played: [name]\nDevice and browser: [for example, Android phone, Chrome]\nWhat happened: [short description]\nWhen: [date and time, time zone]\n\nPlease do not include passwords, card numbers or ID documents.\n',
    other: 'Subject: Enquiry from [name or organisation]\n\nWho I am: [name, organisation]\nWhat I need: [one or two sentences]\nDates that matter: [if any]\n'
  };
  var copyStatus = document.getElementById('ct-copy-status');
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }
  $$('.ct-template').forEach(function (btn) {
    var original = btn.textContent;
    var timer;
    btn.addEventListener('click', function () {
      var text = outlines[btn.getAttribute('data-template')] || outlines.other;
      copyText(text).then(function () {
        btn.classList.add('is-copied');
        btn.textContent = 'Copied. Paste it into the enquiry form';
        if (copyStatus) { copyStatus.textContent = ''; setTimeout(function () { copyStatus.textContent = 'Outline copied to clipboard. Paste it into the enquiry form and fill in the brackets.'; }, 30); }
      }, function () {
        if (copyStatus) copyStatus.textContent = 'Could not copy automatically.';
      });
      clearTimeout(timer);
      timer = setTimeout(function () { btn.classList.remove('is-copied'); btn.textContent = original; }, 2600);
    });
  });

  /* Checklist meter */
  var boxes = $$('.ct-checklist input[type="checkbox"]');
  var fill = document.getElementById('ct-meter-fill');
  var meterText = document.getElementById('ct-meter-text');
  function updateMeter() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    if (fill) fill.style.scale = (boxes.length ? done / boxes.length : 0) + ' 1';
    if (meterText) {
      meterText.textContent = done === boxes.length ? 'All ' + done + ' ready. You are good to write.' : done + ' of ' + boxes.length + ' ready';
      meterText.classList.toggle('is-done', done === boxes.length);
    }
  }
  boxes.forEach(function (b) { b.addEventListener('change', updateMeter); });
  updateMeter();

  /* Desk status from sample hours: Mon-Fri 09:00-17:30 UTC */
  var deskStatus = document.getElementById('ct-desk-status');
  var deskText = document.getElementById('ct-desk-status-text');
  if (deskStatus && deskText) {
    var now = new Date();
    var day = now.getUTCDay();
    var mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    var open = day >= 1 && day <= 5 && mins >= 540 && mins < 1050;
    deskStatus.classList.add(open ? 'is-open' : 'is-closed');
    deskText.textContent = open
      ? 'The desk is open now. Hours: Monday to Friday, 09:00 to 17:30 UTC'
      : 'The desk is closed now. We reply from 09:00 UTC on the next working day';
    if (!open) {
      $$('.ct-dep-status').forEach(function (s) {
        if (!s.classList.contains('ct-dep-status--portal')) { s.textContent = 'Next working day'; s.style.color = '#F5B81C'; }
      });
    }
  }
})();
