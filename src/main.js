// Entry point. Renders the dynamic sections, then mounts the (unmodified)
// ScrollCraft engine so it measures the final layout.
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';

import { initCase } from './modules/case.js';
import { initClimax } from './modules/climax.js';
import { initContact } from './modules/contact.js';
import { initExplorer } from './modules/explorer.js';
import { initHero } from './modules/hero.js';
import { initHeroMotion } from './modules/hero-motion.js';
import { initLab } from './modules/lab.js';
import { initNav } from './modules/nav.js';
import { initProducts, initSkills } from './modules/products.js';

function boot() {
  // Starts the one-time hero entrance once fonts are ready (or after a short cap).
  const ready = () => document.documentElement.classList.add('js-ready');
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(ready);
  else ready();
  initNav();
  initHero();
  initHeroMotion();
  initClimax();
  initLab();
  initCase();
  initExplorer();
  initProducts();
  initSkills();
  initContact();

  const sc = window.ScrollCraft ? window.ScrollCraft.mount(document.body) : null;

  // Dynamic content (tabs, filters, the dialog, the Lab's records) changes page
  // height, so ask the engine to re-measure its acts after layout settles.
  if (sc) {
    let raf = 0;
    const relayout = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => sc.layout());
    };
    new ResizeObserver(relayout).observe(document.body);
    window.addEventListener('load', relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  } else {
    console.warn('[portfolio] ScrollCraft engine not found; scroll effects are disabled.');
  }

  // Honour a hash link that pointed at content rendered by this script.
  const hash = location.hash;
  if (hash && !hash.startsWith('#project=')) {
    const target = document.querySelector(hash);
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  }
}

boot();
