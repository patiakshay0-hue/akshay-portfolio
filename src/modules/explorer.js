// Project explorer: category filters, varied tiles and an accessible detail dialog.
import { CATEGORIES, STATUS, getProject, projects } from '../data/projects.js';
import { STAGES } from '../data/lab.js';
import { processLeads } from './leads.js';
import { HEADLINES, cluster } from './news.js';
import { $, $$, esc } from './util.js';

const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
const TILE_CLASS = { workflow: 'tile--feature', cluster: 'tile--wide', doc: 'tile--wide', site: 'tile--plain' };

// ------------------------------------------------------------- tile artwork --
function workflowArt() {
  const xs = [26, 196, 366];
  const rows = [30, 92, 154];
  let nodes = ''; let lines = '';
  STAGES.forEach((s, i) => {
    const row = Math.floor(i / 3);
    const col = row % 2 === 0 ? i % 3 : 2 - (i % 3);
    const x = xs[col]; const y = rows[row];
    nodes += `<rect x="${x}" y="${y}" width="128" height="38" rx="4" fill="none" stroke="currentColor" opacity=".75"/><text x="${x + 10}" y="${y + 23}" font-size="11" fill="currentColor" font-family="monospace">${esc(s.short)}</text>`;
    if (i < 8) {
      const nrow = Math.floor((i + 1) / 3);
      const ncol = nrow % 2 === 0 ? (i + 1) % 3 : 2 - ((i + 1) % 3);
      if (nrow === row) {
        const dir = ncol > col ? 1 : -1;
        lines += `<path class="acc" d="M${dir > 0 ? x + 128 : x} ${y + 19}H${dir > 0 ? xs[ncol] : xs[ncol] + 128}" fill="none" stroke-width="1.5" stroke-dasharray="3 4"/>`;
      } else {
        lines += `<path class="acc" d="M${x + 64} ${y + 38}V${rows[nrow]}" fill="none" stroke-width="1.5" stroke-dasharray="3 4"/>`;
      }
    }
  });
  return `<svg viewBox="0 0 520 200" aria-hidden="true" focusable="false">${lines}${nodes}</svg>`;
}

const ART = {
  workflow: workflowArt,
  cluster: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" opacity=".5" stroke-dasharray="3 4"><ellipse cx="70" cy="60" rx="52" ry="36"/><ellipse cx="200" cy="50" rx="46" ry="30"/><ellipse cx="240" cy="112" rx="50" ry="26"/></g><g fill="currentColor"><circle cx="48" cy="52" r="4"/><circle cx="76" cy="70" r="4"/><circle cx="90" cy="46" r="4"/><circle cx="186" cy="44" r="4"/><circle cx="212" cy="58" r="4"/><circle cx="224" cy="40" r="4"/><circle cx="224" cy="110" r="4"/><circle cx="254" cy="120" r="4"/></g><circle cx="120" cy="124" r="4" class="acc" fill="currentColor"/></svg>`,
  doc: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" opacity=".7"><rect x="40" y="18" width="86" height="112" rx="3"/><rect x="52" y="10" width="86" height="112" rx="3" fill="var(--sc-surface)"/></g><g stroke="currentColor" opacity=".55"><path d="M64 34h58M64 48h44M64 62h58M64 76h36"/></g><path class="acc" d="M64 90h58" stroke-width="2"/><path class="acc" d="M150 60h56" stroke-width="1.5" stroke-dasharray="3 4" fill="none"/><g fill="none" stroke="currentColor" opacity=".8"><rect x="210" y="40" width="70" height="40" rx="4"/></g><path class="acc" d="M222 54h46M222 66h30" stroke-width="2"/></svg>`,
  leads: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" opacity=".7"><rect x="20" y="22" width="110" height="20" rx="3"/><rect x="20" y="50" width="110" height="20" rx="3"/><rect x="20" y="78" width="110" height="20" rx="3"/></g><path class="acc" d="M136 60h40M176 60l-8-6M176 60l-8 6M176 60V30h40M176 60h40M176 60v32h40" fill="none" stroke-width="1.5"/><g fill="none" stroke="currentColor" opacity=".8"><rect x="220" y="20" width="80" height="20" rx="3"/><rect x="220" y="50" width="80" height="20" rx="3"/><rect x="220" y="82" width="80" height="20" rx="3"/></g></svg>`,
  agent: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" opacity=".8"><circle cx="60" cy="75" r="22"/><rect x="132" y="30" width="56" height="30" rx="4"/><rect x="132" y="90" width="56" height="30" rx="4"/><path d="M262 75l-22-22 22-22 22 22z" transform="translate(-4 22)"/></g><path class="acc" d="M82 75h24l26-30M82 75h24l26 30M188 45h30l12 16M188 105h30l12-16" fill="none" stroke-width="1.5" stroke-dasharray="3 4"/></svg>`,
  voice: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="currentColor" opacity=".8">${[14, 30, 52, 76, 44, 92, 60, 30, 70, 42, 20, 36, 18].map((h, i) => `<rect x="${40 + i * 18}" y="${75 - h / 2}" width="6" height="${h}" rx="3"/>`).join('')}</g><circle class="acc" cx="30" cy="75" r="6" fill="currentColor"/></svg>`,
  study: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" opacity=".75"><rect x="40" y="76" width="130" height="22" rx="3"/><rect x="52" y="52" width="118" height="22" rx="3"/><rect x="34" y="28" width="136" height="22" rx="3"/><rect x="198" y="40" width="82" height="48" rx="8"/></g><path class="acc" d="M214 56h50M214 68h32" stroke-width="2"/></svg>`,
  data: () => `<svg viewBox="0 0 320 150" aria-hidden="true" focusable="false"><g fill="currentColor" opacity=".55"><rect x="44" y="70" width="26" height="60"/><rect x="84" y="50" width="26" height="80"/><rect x="124" y="84" width="26" height="46"/></g><g fill="currentColor"><rect class="acc" x="176" y="40" width="26" height="90" stroke="none"/><rect class="acc" x="216" y="30" width="26" height="100" stroke="none"/><rect class="acc" x="256" y="46" width="26" height="84" stroke="none"/></g></svg>`,
  site: () => '',
};

function artFor(kind) {
  const fn = ART[kind];
  return fn ? fn() : '';
}

// -------------------------------------------------------------------- tiles --
function tileHtml(p) {
  const art = artFor(p.visual);
  const cls = ['tile', TILE_CLASS[p.visual] || ''].join(' ').trim();
  const cats = p.categories.map((c) => CAT_LABEL[c]).join(' · ');
  return `<article class="${cls}" data-id="${p.id}">
    ${art ? `<div class="tile__art">${art}</div>` : ''}
    <div class="tile__body">
      <div class="tile__meta"><span class="pill pill--${p.status}">${STATUS[p.status].label}</span><span class="tile__cats">${esc(cats)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
      <button class="tile__open" type="button" data-open="${p.id}" aria-label="Open case study: ${esc(p.title)}">Open case study <span aria-hidden="true">→</span></button>
    </div>
  </article>`;
}

// ------------------------------------------------------------------- dialog --
let dialog; let opener = null;

function listHtml(items) {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function linksHtml(p) {
  const bits = [];
  if (p.links.repo) bits.push(`<a class="btn btn--ghost btn--sm" href="${esc(p.links.repo)}" target="_blank" rel="noopener noreferrer">Repository</a>`);
  if (p.links.demo) bits.push(`<a class="btn btn--ghost btn--sm" href="${esc(p.links.demo)}" target="_blank" rel="noopener noreferrer">Live demo</a>`);
  if (p.labLink) bits.push('<a class="btn btn--accent btn--sm" href="#automations" data-close>Run the simulation</a>');
  return bits.length ? `<div class="pd__link">${bits.join('')}</div>` : '';
}

function newsDemoHtml() {
  return `<div class="pd__extra" id="ng">
    <h3>Working illustration: TF-IDF and cosine similarity</h3>
    <div class="ng__ctl"><label for="ng-t">Similarity threshold</label><input id="ng-t" type="range" min="0.1" max="0.6" step="0.05" value="0.25"><output id="ng-o" for="ng-t">0.25</output></div>
    <div class="ng__groups" id="ng-g"></div>
  </div>`;
}

function leadDemoHtml() {
  const rows = processLeads().map((l) => `<tr>
    <td>${esc(l.id)}</td>
    <td>${esc(l.raw.name.trim())}<br>${esc(l.raw.email)}</td>
    <td>${esc(l.name)}<br>${esc(l.email)}</td>
    <td class="${l.status === 'routed' ? 'ok' : 'warn'}">${esc(l.status)}<br>${esc(l.note)}</td>
    <td>${esc(l.category)}</td><td>${esc(l.route)}</td></tr>`).join('');
  return `<div class="pd__extra"><h3>Worked example on fictional leads</h3>
    <div class="tablewrap"><table class="tbl ld"><caption class="sr">Sample leads before and after processing</caption>
    <thead><tr><th scope="col">Lead</th><th scope="col">Raw input</th><th scope="col">Normalized</th><th scope="col">Result</th><th scope="col">Category</th><th scope="col">Route</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

function section(title, inner) {
  return `<section class="pd__sec"><h3>${esc(title)}</h3><div>${inner}</div></section>`;
}

function projectHtml(p) {
  const s = STATUS[p.status];
  const parts = [
    `<p class="tile__meta"><span class="pill pill--${p.status}">${s.label}</span><span class="tile__cats">${esc(p.categories.map((c) => CAT_LABEL[c]).join(' · '))}</span></p>`,
    `<h2 id="pd-title">${esc(p.title)}</h2>`,
    `<p class="pd__sum">${esc(p.summary)}</p>`,
    `<p class="pd__note"><b>${s.label}.</b> ${esc(p.statusNote)}</p>`,
    section('Overview', `<p>${esc(p.summary)}</p>${p.users ? `<p><b>For:</b> ${esc(p.users)}</p>` : ''}`),
    section('Problem', `<p>${esc(p.problem)}</p>`),
    section('Solution', `<p>${esc(p.solution)}</p>`),
    section('Workflow', `<ul class="pd__flow">${p.workflow.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`),
  ];
  if (p.explainer) parts.push(section('How it works', p.explainer.map((t) => `<p>${esc(t)}</p>`).join('')));
  if (p.features) parts.push(section('Key features', listHtml(p.features)));
  parts.push(section('Technology stack', `<p class="chips">${p.stack.map((t) => `<span>${esc(t)}</span>`).join('')}</p>`));
  if (p.proposed) parts.push(section('Proposed next', listHtml(p.proposed)));
  parts.push(section('Challenges and learnings', listHtml(p.challenges)));
  const links = linksHtml(p);
  parts.push(section('Links', links || '<p class="pd__none">No public repository or live demo is linked yet.</p>'));
  if (p.extra === 'news-demo') parts.push(newsDemoHtml());
  if (p.extra === 'lead-sample') parts.push(leadDemoHtml());
  return parts.join('');
}

function wireNewsDemo() {
  const range = $('#ng-t'); const out = $('#ng-o'); const target = $('#ng-g');
  if (!range) return;
  const render = () => {
    const t = Number(range.value);
    out.textContent = t.toFixed(2);
    const groups = cluster(HEADLINES, t);
    target.innerHTML = groups.map((g, i) => {
      const single = g.length === 1;
      return `<div class="ng__g ${single ? 'ng__g--single' : ''}"><h4>${single ? 'Unmatched' : `Topic ${i + 1} (${g.length})`}</h4><ul>${g.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>`;
    }).join('');
  };
  range.addEventListener('input', render);
  render();
}

export function openProject(id, from) {
  const p = getProject(id);
  if (!p) return;
  opener = from || document.activeElement;
  $('#pd-body').innerHTML = projectHtml(p);
  wireNewsDemo();
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  history.replaceState(null, '', `#project=${p.id}`);
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

// ------------------------------------------------------------------ explorer --
export function initExplorer() {
  dialog = $('#project-dialog');
  const filtersEl = $('#work-filters');
  const grid = $('#work-grid');
  const empty = $('#work-empty');
  const count = $('#work-count');
  let active = 'all';

  function render() {
    filtersEl.innerHTML = CATEGORIES.map((c) => {
      const n = c.id === 'all' ? projects.length : projects.filter((p) => p.categories.includes(c.id)).length;
      return `<button class="filter" type="button" data-cat="${c.id}" aria-pressed="${c.id === active}">${esc(c.label)} <small>${n}</small></button>`;
    }).join('');
    const list = active === 'all' ? projects : projects.filter((p) => p.categories.includes(active));
    grid.innerHTML = list.map(tileHtml).join('');
    grid.hidden = list.length === 0;
    empty.hidden = list.length !== 0;
    count.textContent = `${list.length} project${list.length === 1 ? '' : 's'} shown in ${CAT_LABEL[active]}.`;
  }

  function setFilter(id) {
    if (!CAT_LABEL[id]) return;
    active = id;
    render();
  }

  filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    setFilter(b.dataset.cat);
    $(`[data-cat="${active}"]`, filtersEl).focus();
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openProject(b.dataset.open, b);
  });
  $('#work-reset').addEventListener('click', () => { setFilter('all'); $('[data-cat="all"]', filtersEl).focus(); });
  window.addEventListener('pf:filter', (e) => setFilter(e.detail));
  window.addEventListener('pf:open', (e) => openProject(e.detail.id, e.detail.from));

  // ----- dialog wiring
  $('#pd-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();          // backdrop click
    if (e.target.closest('[data-close]')) closeDialog();
  });
  dialog.addEventListener('close', () => {
    if (location.hash.startsWith('#project=')) history.replaceState(null, '', location.pathname + location.search);
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });

  render();

  // Deep link, e.g. index.html#project=job-hunter
  const m = location.hash.match(/^#project=(.+)$/);
  if (m && getProject(m[1])) requestAnimationFrame(() => openProject(m[1], null));
}
