// Product builds and the skills ledger. Both read from the data files.
import { STATUS, getProject, projects } from '../data/projects.js';
import { skillGroups } from '../data/skills.js';
import { $, esc } from './util.js';

export function initProducts() {
  const host = $('#products-list');
  if (!host) return;
  const items = projects.filter((p) => p.product);
  host.innerHTML = items.map((p) => {
    const demo = [];
    if (p.links.repo) demo.push(`<a class="btn btn--ghost btn--sm" href="${esc(p.links.repo)}" target="_blank" rel="noopener noreferrer">Repository</a>`);
    if (p.links.demo) demo.push(`<a class="btn btn--ghost btn--sm" href="${esc(p.links.demo)}" target="_blank" rel="noopener noreferrer">Live demo</a>`);
    const none = (!p.links.repo && !p.links.demo)
      ? '<p class="prod__none">Repository: none published. Live demo: none published. Screenshots: none published.</p>' : '';
    return `<article class="prod">
      <div><span class="pill pill--${p.status}">${STATUS[p.status].label}</span><h3>${esc(p.title)}</h3></div>
      <div class="prod__mid">
        <div><h4>Problem</h4><p>${esc(p.problem)}</p></div>
        <div><h4>Solution</h4><p>${esc(p.solution)}</p></div>
      </div>
      <div class="prod__side">
        <div><h4>Stack</h4><p>${esc(p.stack.join(', '))}</p></div>
        ${p.features ? `<div><h4>Key features</h4><p>${esc(p.features.join(', '))}</p></div>` : ''}
        ${none}
        <div class="prod__links">${demo.join('')}<button class="btn btn--accent btn--sm" type="button" data-open="${p.id}">Open details</button></div>
      </div>
    </article>`;
  }).join('');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) window.dispatchEvent(new CustomEvent('pf:open', { detail: { id: b.dataset.open, from: b } }));
  });
}

export function initSkills() {
  const host = $('#skills-ledger');
  if (!host) return;
  host.innerHTML = skillGroups.map((g) => {
    const ids = new Set();
    g.skills.forEach((s) => s.evidence.forEach((id) => ids.add(id)));
    const ev = [...ids].map((id) => getProject(id)).filter(Boolean)
      .map((p) => `<button type="button" data-open="${p.id}">${esc(p.title)}</button>`).join(', ');
    return `<div class="srow">
      <h3>${esc(g.title)}</h3>
      <ul class="srow__list">${g.skills.map((s) => `<li class="${s.level === 'learning' ? 'learning' : ''}"><span class="sr">${s.level === 'learning' ? 'Learning: ' : 'Hands-on: '}</span>${esc(s.name)}</li>`).join('')}</ul>
      <p class="srow__ev">${ev ? `Shown in: ${ev}` : ''}</p>
    </div>`;
  }).join('');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) window.dispatchEvent(new CustomEvent('pf:open', { detail: { id: b.dataset.open, from: b } }));
  });
}
