/* Events: agenda filters, rolling months and meeting picker */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = null;

  function setupReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    root.classList.add('ag-anim');
    var items = document.querySelectorAll('main [data-in], main .ag-month');
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      document.querySelectorAll('main [data-in], main .ag-month').forEach(function (el) { el.classList.add('is-in'); });
    }, 4000);
  }

  /* Agenda: start at the current month, show six, filter by track */
  function setupAgenda() {
    var list = document.getElementById('ag-months');
    if (!list) return;
    var every = list.querySelector('.ag-month--every');
    var months = Array.prototype.slice.call(list.querySelectorAll('.ag-month:not(.ag-month--every)'));
    var now = new Date().getMonth();
    if (every) list.appendChild(every);
    months.sort(function (a, b) {
      var ia = (parseInt(a.getAttribute('data-month'), 10) - now + 12) % 12;
      var ib = (parseInt(b.getAttribute('data-month'), 10) - now + 12) % 12;
      return ia - ib;
    });
    months.forEach(function (m, i) {
      list.appendChild(m);
      if (i === 0) m.classList.add('is-now');
      if (i >= 6) { m.hidden = true; m.setAttribute('data-later', ''); }
    });

    var more = document.getElementById('ag-more');
    var expanded = false;
    if (more) {
      more.hidden = false;
      more.addEventListener('click', function () {
        expanded = !expanded;
        months.forEach(function (m) { if (m.hasAttribute('data-later')) m.hidden = !expanded; });
        more.setAttribute('aria-expanded', String(expanded));
        more.textContent = expanded ? 'Show the next six months only' : 'Show the full year';
        if (expanded) months.forEach(function (m) { m.classList.add('is-in'); });
      });
    }

    var buttons = document.querySelectorAll('.ag-filter');
    var status = document.getElementById('ag-filter-status');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        (every ? [every] : []).concat(months).forEach(function (m) {
          var rows = m.querySelectorAll('.ag-row');
          var visible = 0;
          rows.forEach(function (r) {
            var ok = f === 'all' || r.getAttribute('data-track') === f;
            r.hidden = !ok;
            if (ok) visible++;
          });
          m.classList.toggle('is-empty', visible === 0);
          if (!m.hidden) shown += visible;
        });
        if (status) status.textContent = (f === 'all' ? 'Showing all sessions' : 'Showing ' + btn.textContent.trim() + ' sessions') + ', ' + shown + ' in view.';
      });
    });
  }

  /* Meeting picker */
  var TYPES = {
    demo: {
      label: 'Product demo', dur: '30 minutes', mode: 'Video call',
      who: 'A producer and an account manager',
      prep: ['The markets you operate in and any certification you need', 'Games, themes or mechanics you want to see first', 'How your lobby is set up today and what performs well'],
      leave: ['Demo links for the games you liked', 'Specification sheets with RTP configurations', 'A clear next step on commercial terms'],
      cta: 'Ask for a product demo'
    },
    integration: {
      label: 'Integration walkthrough', dur: '45 minutes', mode: 'Video call with screen share',
      who: 'An integration engineer and a project lead',
      prep: ['The platform or aggregator you run on', 'Your wallet model and any existing provider integrations', 'A target launch window and your technical contact'],
      leave: ['An outline of the integration documentation', 'Steps to request test environment access', 'A draft timeline with owners on both sides'],
      cta: 'Ask for an integration walkthrough'
    },
    partnership: {
      label: 'Partnership conversation', dur: '60 minutes', mode: 'Video call or in person',
      who: 'A business development lead',
      prep: ['The kind of partnership you have in mind: affiliate, media, distribution or co-development', 'Your audience or markets, in a sentence or two', 'What a good first six months would look like for you'],
      leave: ['A proposed working model', 'A list of the materials we can provide', 'A named contact for next steps'],
      cta: 'Ask for a partnership conversation'
    }
  };

  function setupPicker() {
    var choices = document.querySelectorAll('.ag-choice');
    var detail = document.getElementById('ag-detail');
    if (!choices.length || !detail) return;
    var el = {
      type: document.getElementById('ag-d-type'), dur: document.getElementById('ag-d-dur'),
      mode: document.getElementById('ag-d-mode'), who: document.getElementById('ag-d-who'),
      prep: document.getElementById('ag-d-prep'), leave: document.getElementById('ag-d-leave'),
      cta: document.getElementById('ag-d-cta')
    };
    function list(ul, items) {
      ul.innerHTML = '';
      items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    }
    function render(key) {
      var d = TYPES[key];
      el.type.textContent = d.label; el.dur.textContent = d.dur; el.mode.textContent = d.mode; el.who.textContent = d.who;
      list(el.prep, d.prep); list(el.leave, d.leave); el.cta.textContent = d.cta;
    }
    var t;
    choices.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-type');
        choices.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        if (reduce) { render(key); return; }
        detail.classList.add('is-swapping');
        clearTimeout(t);
        t = setTimeout(function () { render(key); detail.classList.remove('is-swapping'); }, 220);
      });
    });
  }

  function init() { setupAgenda(); setupReveal(); setupPicker(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
