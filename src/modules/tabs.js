// Accessible tabs (WAI-ARIA tabs pattern): arrow keys, Home and End move
// between tabs, only the selected tab is in the tab order.
import { $$ } from './util.js';

export function initTabs(tablist, onChange) {
  const tabs = $$('[role="tab"]', tablist);

  function select(tab, focus = false) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    if (onChange) onChange(tab);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  return { select, tabs };
}
