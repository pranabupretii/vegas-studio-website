/* Careers page: teams explorer tabs + scroll reveals. */
(function () {
  'use strict';
  var page = document.querySelector('.cr-page');
  if (!page) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll reveal with stagger, 4s failsafe */
  var items = Array.prototype.slice.call(page.querySelectorAll('[data-cr-reveal]'));
  if (!reduce && 'IntersectionObserver' in window && items.length) {
    page.classList.add('cr-anim');
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.parentElement;
      var n = groups.get(parent) || 0;
      el.style.setProperty('--cr-d', Math.min(n, 6) * 0.08 + 's');
      groups.set(parent, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
  }

  /* Teams explorer */
  var tablist = page.querySelector('.cr-tablist');
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (!panel) return;
      if (on) {
        panel.hidden = false;
        if (!reduce) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      } else {
        panel.hidden = true;
        panel.classList.remove('is-entering');
      }
    });
    if (focus) tab.focus();
    if (tab.scrollIntoView && tablist.scrollWidth > tablist.clientWidth) {
      tablist.scrollTo({ left: tab.offsetLeft - 14, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });
})();
