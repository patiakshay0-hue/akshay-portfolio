// The Pipeline act: scroll position is the execution clock of one real record.
// Every value on the panel is computed by pipeline-logic.js, not hard-coded.
import { DEFAULT_SETTINGS, STAGES } from '../data/lab.js';
import { LEVELS, createRun, sourceName } from './pipeline-logic.js';
import { $, RM, barsHtml, esc, watchProgress } from './util.js';

const IDLE_UNTIL = 0.06;   // authored silence: nothing is lit for the first 6%
const RUN_SPAN = 0.8;      // progress 0.06..0.86 runs the nine stages
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function precompute() {
  const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  const run = createRun(settings);
  const counts = [];
  const logs = [];
  for (let i = 0; i < run.total; i += 1) {
    const res = run.step(i);
    counts.push(res.counts);
    logs.push(res.logs.map((l, j) => ({ ...l, t: `t+${((i * 1.15) + j * 0.06).toFixed(1)}s` })));
  }
  const top = run.state.messages[0];
  const rec = run.state.recs.find((r) => r.id === top.id);
  return { run, state: run.state, counts, logs, rec, message: top.text };
}

function row(k, v, cls = '') {
  return `<div class="pp__row"><span class="pp__k">${esc(k)}</span><span class="pp__v ${cls}">${esc(v)}</span></div>`;
}

function viewFor(i, d) {
  const { rec, state } = d;
  const raw = rec.raw;
  const n = rec.norm;
  const days = `${raw.postedDaysAgo} day${raw.postedDaysAgo === 1 ? '' : 's'} ago`;
  switch (i) {
    case 0:
      return [
        '<p class="pp__head">Run started</p>',
        row('Run id', state.runId, 'mono'),
        row('Trigger', 'Schedule (simulated clock tick)'),
        row('Waiting', `${state.recs.length} postings across 3 sample sources`),
        row('Settings', `min score ${DEFAULT_SETTINGS.minScore}, Remote or India only`),
      ].join('');
    case 1:
      return [
        `<p class="pp__head">Raw posting from ${esc(sourceName(raw.source))}</p>`,
        row('Title', raw.title),
        row('Company', raw.company),
        row('Location', raw.location),
        row('Posted', days),
        row('Text', raw.description, 'dim'),
      ].join('');
    case 2:
      return [
        '<p class="pp__head">Normalized record</p>',
        row('Title', raw.title === n.title ? n.title : `${raw.title}  →  ${n.title}`),
        row('Company', raw.company === n.company ? n.company : `${raw.company}  →  ${n.company}`),
        row('Work mode', n.mode, 'ok'),
        row('Place', n.place),
        row('Link', n.link, 'dim'),
      ].join('');
    case 3: {
      const dups = state.recs.filter((r) => r.status === 'duplicate');
      return [
        '<p class="pp__head">Duplicate check</p>',
        row('Key', rec.dedupeKey, 'mono'),
        row('This record', 'Unique. Kept.', 'ok'),
        row('In this batch', dups.length ? `${dups.length} duplicate removed: ${dups.map((r) => `${r.id} (${r.raw.title}) matched ${r.reason.match(/of (r\d+)/)[1]}`).join('; ')}` : 'No duplicates', 'dim'),
        row('How', 'Abbreviations are expanded (ML = machine learning) before the key is built.', 'dim'),
      ].join('');
    }
    case 4:
      return [
        '<p class="pp__head">Role classification (rule based)</p>',
        row('Domain', rec.domain.label, 'ok'),
        row('Evidence', rec.domainEvidence.join(', '), 'mono'),
        row('Upgrade', 'A language-model classifier is proposed. This demo uses keyword rules.', 'dim'),
      ].join('');
    case 5:
      return [
        '<p class="pp__head">Experience level (independent field)</p>',
        row('Level', LEVELS[rec.level].label, 'ok'),
        row('Evidence', rec.levelEvidence.join(', '), 'mono'),
        row('Result', `${rec.domain.label}  +  ${LEVELS[rec.level].label}`),
        row('If unsure', 'Unclear / Needs Review. Never guessed.', 'dim'),
      ].join('');
    case 6:
      return [
        '<p class="pp__head">Transparent relevance score</p>',
        barsHtml(rec.score),
        row('Decision', rec.reason, rec.decision.keep ? 'ok' : 'warn'),
      ].join('');
    case 7: {
      const rank = state.messages.findIndex((m) => m.id === rec.id) + 1;
      return [
        '<p class="pp__head">Notification prepared</p>',
        row('Selected', `${state.messages.length} of ${state.recs.length} postings passed the filters`),
        row('This record', `Ranked #${rank} by score`),
        row('Fields', 'Title, organization, category, level, location, source, link placeholder, reason'),
      ].join('');
    }
    case 8:
      return [
        '<p class="pp__head">Telegram step: dry run</p>',
        row('Status', 'Message previewed. Nothing was sent.', 'warn'),
        row('Why', 'The public demo never calls the Telegram API or any other service.', 'dim'),
      ].join('');
    default: {
      const s = state.summary;
      return [
        '<p class="pp__head">Run complete</p>',
        row('Collected', `${s.collected} postings`),
        row('Duplicates', `${s.duplicates} removed`),
        row('Filtered', `${s.filtered} skipped, each with a recorded reason`),
        row('Selected', `${s.selected} alerts prepared`, 'ok'),
        row('Next', 'Open the Automation Lab below to run it yourself and change the filters.', 'dim'),
      ].join('');
    }
  }
}

export function initClimax() {
  const act = $('#pipeline');
  const stageEl = $('#pipe-stage');
  const track = $('#pipe-track');
  const panel = $('#pipe-panel');
  const tg = $('#pipe-tg');
  const trace = $('#pipe-trace');
  if (!act || !track) return;

  const d = precompute();

  // ----- build the track
  const lis = STAGES.map((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="pipe__dot"></span><span class="pipe__lab">${esc(s.short)}</span><span class="pipe__cnt"></span>`;
    li.setAttribute('aria-label', `Stage ${i + 1}: ${s.title}`);
    track.appendChild(li);
    return li;
  });
  const packet = document.createElement('span');
  packet.className = 'pipe__packet';
  packet.setAttribute('aria-hidden', 'true');
  track.appendChild(packet);
  $('#pipe-tg-msg').textContent = d.message;

  let shown = -2;

  function show(idx) {
    if (idx === shown) return;
    shown = idx;
    lis.forEach((li, i) => {
      li.classList.toggle('is-done', i < idx);
      li.classList.toggle('is-now', i === idx);
      const c = $('.pipe__cnt', li);
      c.textContent = i < idx ? (i === 0 ? 'start' : `${d.counts[i].in}→${d.counts[i].out}`) : '';
    });
    const stage = STAGES[idx];
    $('#pipe-count').textContent = idx < 0 ? 'Stage 0 of 9' : idx > 8 ? 'Run complete' : `Stage ${idx + 1} of 9`;
    $('#pipe-stage-title').textContent = idx < 0 ? 'Ready' : idx > 8 ? 'Alert prepared' : stage.title;
    $('#pipe-stage-blurb').textContent = idx < 0
      ? (RM ? 'The workflow is idle. Use Next stage to step through the run.' : 'The workflow is idle. Scroll to start the run.')
      : idx > 8 ? 'Every stage ran on the same fictional posting. The numbers above came from the same code the Automation Lab uses.'
        : stage.blurb;
    panel.innerHTML = idx < 0
      ? '<p class="pp__head">Waiting for the trigger</p><div class="pp__row"><span class="pp__k">Queue</span><span class="pp__v dim">9 fictional postings are waiting in 3 sample sources.</span></div>'
      : viewFor(Math.min(idx, 9), d);
    panel.classList.remove('is-in');
    void panel.offsetWidth;
    panel.classList.add('is-in');
    tg.classList.toggle('is-on', idx >= 7);
    tg.setAttribute('aria-hidden', idx >= 7 ? 'false' : 'true');

    // The run trace: every log line the run has produced so far, from real logic.
    const lines = d.logs.slice(0, Math.max(0, Math.min(idx + 1, 9))).flat();
    trace.innerHTML = lines.length
      ? lines.map((l) => `<li data-l="${l.level}"><span class="t">${l.t}</span><span class="lv">${l.level}</span><span class="tx">${esc(l.text)}</span></li>`).join('')
      : '<li><span class="empty-log">Waiting for the trigger.</span></li>';
  }

  function apply(pipeP) {
    stageEl.style.setProperty('--pipe-p', pipeP.toFixed(4));
    const w = track.clientWidth;
    packet.style.transform = `translateX(${(pipeP * (w - 12)).toFixed(1)}px)`;
    packet.style.opacity = pipeP > 0 && pipeP < 1 ? '1' : '0';
  }

  function fromScroll(p) {
    const pipeP = clamp01((p - IDLE_UNTIL) / RUN_SPAN);
    let idx;
    if (p < IDLE_UNTIL) idx = -1;
    else if (pipeP >= 1) idx = 9;
    else idx = Math.min(8, Math.floor(pipeP * 9));
    apply(pipeP);
    show(idx);
    // The harness reads this to confirm that the painted state advances.
    stageEl.setAttribute('data-sc-verify-state', `${idx}:${Math.round(pipeP * 24)}`);
    if (idx === 9) stageEl.setAttribute('data-sc-verify-hold', 'true');
    else stageEl.removeAttribute('data-sc-verify-hold');
  }

  if (RM) {
    // No pinned scroll under reduced motion: a stepper replaces the scroll clock.
    let idx = 9;
    const set = (v) => {
      idx = Math.max(-1, Math.min(9, v));
      apply(idx < 0 ? 0 : idx >= 9 ? 1 : (idx + 0.5) / 9);
      packet.style.opacity = '0';
      show(idx);
    };
    $('#pipe-rm').hidden = false;
    $('#pipe-prev').addEventListener('click', () => set(idx - 1));
    $('#pipe-next').addEventListener('click', () => set(idx + 1));
    set(9);
    return;
  }

  watchProgress(act, fromScroll);
}
