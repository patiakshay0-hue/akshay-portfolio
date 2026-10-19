// Navigation: auto-hiding bar, active-section indication, mobile menu.
import { $, $$ } from './util.js';

// Which nav item each page section belongs to (nav order follows the brief,
// page order differs slightly, so this maps section ids to nav ids).
const SECTION_TO_NAV = [
  ['top', null],
  ['build', null],
  ['pipeline', 'automations'],
  ['automations', 'automations'],
  ['case-study', 'automations'],
  ['work', 'work'],
  ['products', 'work'],
  ['skills', 'work'],
  ['about', 'about'],
  ['process', 'about'],
  ['contact', 'contact'],
];

export function initNav() {
  const bar = $('#bar');
  const toggle = $('#menu-toggle');
  const menu = $('#menu');
  const navLinks = $$('[data-nav]');
  let lastY = scrollY;
  let ticking = false;

  function setActive(id) {
    navLinks.forEach((a) => {
      if (a.dataset.nav === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function update() {
    ticking = false;
    const y = scrollY;
    bar.classList.toggle('is-solid', y > 24);
    const menuOpen = !menu.hidden;
    // Hide while scrolling down past the first screen, show on any upward move.
    if (!menuOpen) {
      if (y > lastY + 6 && y > innerHeight * 0.6) bar.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 80) bar.classList.remove('is-hidden');
    }
    lastY = y;

    const probe = innerHeight * 0.4;
    let current = null;
    SECTION_TO_NAV.forEach(([sid, nav]) => {
      const el = document.getElementById(sid);
      if (el && el.getBoundingClientRect().top <= probe) current = nav;
    });
    setActive(current);
  }

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  // The bar must be reachable by keyboard even while auto-hidden.
  bar.addEventListener('focusin', () => bar.classList.remove('is-hidden'));

  // ----- mobile menu
  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.bar__menu-label', toggle).textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) bar.classList.remove('is-hidden');
  }
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Links that carry a project filter tell the explorer which one to apply.
  $$('a[data-filter]').forEach((a) => {
    a.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('pf:filter', { detail: a.dataset.filter }));
    });
  });
}
