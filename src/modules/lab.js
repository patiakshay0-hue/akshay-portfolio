// The Automation Lab: an interactive simulation of the job-opportunity workflow.
//
// Honest by construction: every step runs the real rule-based logic in
// pipeline-logic.js on fictional sample records. It never touches the network.
import { DEFAULT_SETTINGS, RECORDS, STAGES } from '../data/lab.js';
import { LEVELS, createRun, sourceName } from './pipeline-logic.js';
import { initTabs } from './tabs.js';
import { $, $$, barsHtml, esc } from './util.js';

const STAGE_MS = 1150;      // simulated time shown per stage in the log
const PHASE_A = 650;        // wall time with the node highlighted as running
const PHASE_B = 500;        // wall time after the node completes

const STATUS_LABEL = {
  queued: 'queued', active: 'in run', selected: 'selected', filtered: 'filtered',
  duplicate: 'duplicate', failed: 'failed',
};

export function initLab() {
  const root = $('#automations');
  if (!root) return;

  const els = {
    run: $('#lab-run'), pause: $('#lab-pause'), reset: $('#lab-reset'),
    logBtn: $('#lab-log-btn'), inspectBtn: $('#lab-inspect-btn'),
    status: $('#lab-status'), canvas: $('#lab-canvas'), edges: $('#lab-edges'), nodes: $('#lab-nodes'),
    recs: $('#lab-recs'), why: $('#lab-why'), log: $('#lab-log'),
    tg: $('#lab-tg'), tgMsg: $('#lab-tg-msg'), inspect: $('#lab-inspect'),
    filters: $('#lab-filters'),
  };

  const tabs = initTabs($('#lab-tabs'));
  const tabBy = (id) => tabs.tabs.find((t) => t.id === id);

  const S = {
    run: null, done: -1, active: -1, running: false, paused: false,
    pending: null, timer: 0, logs: [], selNode: -1, selRec: null, inspect: false, settings: null,
  };

  // ------------------------------------------------------------------ nodes --
  const nodeEls = STAGES.map((s, i) => {
    const li = document.createElement('li');
    li.dataset.i = String(i + 1);
    li.innerHTML = `<button class="node" type="button" aria-pressed="false">
        <span class="node__bar" aria-hidden="true"></span>
        <span class="node__t">${esc(s.title)}</span>
        <span class="node__s">idle</span>
      </button>`;
    const btn = $('.node', li);
    btn.addEventListener('click', () => selectNode(i, true));
    els.nodes.appendChild(li);
    return btn;
  });

  function nodeLabel(i) {
    const st = $('.node__s', nodeEls[i]).textContent;
    nodeEls[i].setAttribute('aria-label', `${STAGES[i].title}, stage ${i + 1}. Status: ${st}.`);
  }
  nodeEls.forEach((_, i) => nodeLabel(i));

  // ------------------------------------------------------------------ edges --
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function drawEdges() {
    const box = els.canvas.getBoundingClientRect();
    els.edges.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    els.edges.innerHTML = `<defs><marker id="lab-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke" stroke="none"/></marker></defs>`;
    const r = nodeEls.map((n) => {
      const b = n.getBoundingClientRect();
      return { l: b.left - box.left, r: b.right - box.left, t: b.top - box.top, b: b.bottom - box.top, cx: b.left - box.left + b.width / 2, cy: b.top - box.top + b.height / 2 };
    });
    for (let i = 0; i < r.length - 1; i += 1) {
      const a = r[i]; const b = r[i + 1];
      let d;
      if (Math.abs(a.cy - b.cy) < 12) {
        const dir = b.cx > a.cx ? 1 : -1;
        const x1 = dir > 0 ? a.r : a.l; const x2 = dir > 0 ? b.l : b.r;
        d = `M${x1} ${a.cy}H${x2}`;
      } else {
        d = `M${a.cx} ${a.b}V${b.t}`;
      }
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('marker-end', 'url(#lab-arr)');
      p.dataset.e = String(i);
      els.edges.appendChild(p);
    }
    paintEdges();
  }
  function paintEdges() {
    $$('path', els.edges).forEach((p) => {
      const i = Number(p.dataset.e);
      p.classList.toggle('on', S.active === i + 1);
      p.classList.toggle('done', S.done >= i + 1);
    });
  }
  new ResizeObserver(() => drawEdges()).observe(els.canvas);

  // ------------------------------------------------------------- selection --
  function selectNode(i, openTab) {
    S.selNode = i;
    nodeEls.forEach((n, k) => {
      n.classList.toggle('is-selected', k === i);
      n.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
    renderInspect();
    if (openTab) tabs.select(tabBy('tab-inspect'));
  }

  function sampleFor(i) {
    if (!S.run || S.done < i) return null;
    const st = S.run.state;
    const live = st.recs.filter((r) => r.norm);
    const first = live[0];
    const sel = st.recs.find((r) => r.status === 'selected');
    switch (i) {
      case 0: return { runId: st.runId, trigger: 'schedule (simulated)' };
      case 1: return st.recs.map((r) => ({ id: r.id, source: sourceName(r.raw.source), title: r.raw.title, status: r.status === 'failed' ? 'failed' : 'collected' }));
      case 2: return first ? { id: first.id, ...first.norm } : null;
      case 3: return { duplicatesRemoved: st.recs.filter((r) => r.status === 'duplicate').map((r) => ({ id: r.id, reason: r.reason })) };
      case 4: return sel ? { id: sel.id, domain: sel.domain && sel.domain.label, evidence: sel.domainEvidence } : null;
      case 5: return sel ? { id: sel.id, level: LEVELS[sel.level].label, evidence: sel.levelEvidence } : null;
      case 6: return sel ? { id: sel.id, total: sel.score.total, breakdown: sel.score.parts.map((p) => `${p.label}: ${p.points}/${p.max}`), decision: sel.reason } : null;
      case 7: return st.messages[0] ? st.messages[0].text : null;
      default: return { dryRun: true, sent: false, messages: st.messages.length };
    }
  }

  function renderInspect() {
    const i = S.selNode;
    if (i < 0) {
      els.inspect.innerHTML = '<p>Select a node in the diagram to inspect what it does, what goes in and what comes out. After a run it also shows sample output from that stage.</p>';
      return;
    }
    const s = STAGES[i];
    const sample = sampleFor(i);
    const counts = S.run && S.counts && S.counts[i] ? `${S.counts[i].in} in, ${S.counts[i].out} out` : 'not run yet';
    let sampleHtml = '<p>Run the demo to see sample output from this stage.</p>';
    if (sample !== null) {
      const text = typeof sample === 'string' ? sample : JSON.stringify(sample, null, 2);
      sampleHtml = `<pre class="code">${esc(text)}</pre>`;
    }
    els.inspect.innerHTML = `
      <h4>${esc(s.title)}</h4>
      <p>${esc(s.blurb)}</p>
      <dl><dt>Input</dt><dd>${esc(s.input)}</dd><dt>Output</dt><dd>${esc(s.output)}</dd><dt>Last run</dt><dd>${esc(counts)}</dd></dl>
      ${sampleHtml}`;
  }

  // --------------------------------------------------------------- records --
  function recView() {
    return S.run ? S.run.state.recs : RECORDS.map((raw) => ({ id: raw.id, raw, status: 'queued' }));
  }

  function renderRecs() {
    const list = recView();
    els.recs.innerHTML = '';
    list.forEach((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rec';
      b.setAttribute('aria-pressed', S.selRec === r.id ? 'true' : 'false');
      const t = r.norm ? r.norm.title : r.raw.title;
      const c = r.norm ? r.norm.company : r.raw.company;
      b.innerHTML = `<span class="rec__id">${esc(r.id)}</span>
        <span class="rec__t">${esc(t)}<small>${esc(c)} · ${esc(sourceName(r.raw.source))}</small></span>
        <span class="rec__st" data-s="${r.status}">${STATUS_LABEL[r.status]}</span>`;
      b.addEventListener('click', () => { S.selRec = r.id; renderRecs(); renderWhy(); });
      els.recs.appendChild(b);
    });
  }

  function renderWhy() {
    const r = recView().find((x) => x.id === S.selRec);
    if (!r) {
      els.why.innerHTML = '<p>Select a record to see how it is classified, scored and decided. Run the demo first to see the full reasoning.</p>';
      return;
    }
    const out = [`<h4>${esc(r.raw.title)}</h4>`, `<p>${esc(r.raw.company)} · ${esc(r.raw.location)} · posted ${r.raw.postedDaysAgo} day${r.raw.postedDaysAgo === 1 ? '' : 's'} ago</p>`,
      `<p>${esc(r.raw.description)}</p>`];
    if (S.run && S.done >= 4 && r.domain) {
      out.push(`<p><b>Domain:</b> <span class="tag">${esc(r.domain.label)}</span> evidence: ${esc(r.domainEvidence.join(', '))}</p>`);
    } else if (S.run && S.done >= 4 && r.status !== 'failed' && r.status !== 'duplicate') {
      out.push('<p><b>Domain:</b> none found in the title or text.</p>');
    }
    if (S.run && S.done >= 5 && r.level) {
      out.push(`<p><b>Experience:</b> <span class="tag">${esc(LEVELS[r.level].label)}</span> evidence: ${esc(r.levelEvidence.join(', '))}</p>`);
    }
    if (S.run && S.done >= 6 && r.score) out.push(barsHtml(r.score));
    if (S.run && r.reason && ['selected', 'filtered', 'duplicate', 'failed'].includes(r.status)) {
      const kind = r.status === 'selected' ? 'keep' : 'skip';
      const label = r.status === 'selected' ? 'Why it matched' : r.status === 'duplicate' ? 'Why it was removed' : r.status === 'failed' ? 'What happened' : 'Why it was filtered out';
      if (r.status === 'duplicate' || r.status === 'failed' || S.done >= 6) {
        out.push(`<p class="why__reason ${kind}"><b>${label}:</b> ${esc(r.reason)}</p>`);
      }
    }
    els.why.innerHTML = out.join('');
  }

  // ------------------------------------------------------------------- log --
  function renderLog() {
    if (!S.logs.length) {
      els.log.innerHTML = '<li><span class="empty-log">The execution log is empty. Run the demo to fill it.</span></li>';
      return;
    }
    els.log.innerHTML = S.logs.map((l) => `<li data-l="${l.level}"><span class="t">${l.t}</span><span class="lv">${l.level}</span><span class="tx">${esc(l.text)}</span></li>`).join('');
  }

  // ---------------------------------------------------------------- status --
  function setStatus(text) { els.status.textContent = text; }

  function paintNodes() {
    nodeEls.forEach((n, i) => {
      const done = S.done >= i;
      const active = S.active === i;
      n.classList.toggle('is-done', done && !active);
      n.classList.toggle('is-active', active);
      const st = $('.node__s', n);
      if (active) st.textContent = 'running';
      else if (done) st.textContent = S.counts && S.counts[i] ? (i === 0 ? 'fired' : `${S.counts[i].in} → ${S.counts[i].out}`) : 'done';
      else st.textContent = 'idle';
      nodeLabel(i);
    });
    paintEdges();
  }

  function syncButtons() {
    els.run.disabled = S.running;
    els.run.textContent = S.done >= STAGES.length - 1 ? 'Run Again' : 'Run Demo';
    els.pause.disabled = !S.running;
    els.pause.textContent = S.paused ? 'Resume' : 'Pause';
    els.pause.setAttribute('aria-pressed', S.paused ? 'true' : 'false');
    $$('input, select', els.filters).forEach((c) => { c.disabled = S.running; });
  }

  // ------------------------------------------------------------- scheduler --
  function schedule(fn, delay) {
    S.pending = { fn, delay, startedAt: performance.now() };
    S.timer = setTimeout(() => { S.pending = null; fn(); }, delay);
  }

  function beginStage(i) {
    S.active = i;
    paintNodes();
    setStatus(`Stage ${i + 1} of ${STAGES.length}: ${STAGES[i].title} is running.`);
    schedule(() => completeStage(i), PHASE_A);
  }

  function completeStage(i) {
    const res = S.run.step(i);
    S.counts = S.counts || [];
    S.counts[i] = res.counts;
    res.logs.forEach((l, j) => {
      S.logs.push({ ...l, t: `t+${((i * STAGE_MS + j * 60) / 1000).toFixed(1)}s` });
    });
    S.done = i;
    S.active = -1;
    paintNodes();
    renderRecs();
    renderWhy();
    renderLog();
    renderInspect();
    els.log.parentElement.scrollTop = els.log.parentElement.scrollHeight;

    if (i === STAGES.length - 1) {
      S.running = false;
      const st = S.run.state;
      if (st.messages[0]) {
        els.tgMsg.textContent = st.messages[0].text;
        els.tg.hidden = false;
        if (!S.selRec) S.selRec = st.messages[0].id;
        renderRecs(); renderWhy();
      }
      const sm = st.summary;
      setStatus(`Run complete (simulated): ${sm.selected} selected, ${sm.filtered} filtered, ${sm.duplicates} duplicate, ${sm.failed} failed. Nothing was sent to Telegram.`);
      syncButtons();
      return;
    }
    schedule(() => beginStage(i + 1), PHASE_B);
  }

  // --------------------------------------------------------------- actions --
  function readSettings() {
    const levels = { all: true, internship: false, entry: false, unclear: false, experienced: false };
    $$('[data-level]', els.filters).forEach((c) => { levels[c.dataset.level] = c.checked; });
    return {
      minScore: Number($('#f-score').value),
      levels,
      remoteOrIndiaOnly: $('#f-region').checked,
      simulateSourceTimeout: $('#f-timeout').checked,
    };
  }

  function reset(announce = true) {
    clearTimeout(S.timer);
    Object.assign(S, { run: null, done: -1, active: -1, running: false, paused: false, pending: null, logs: [], counts: [], selRec: null });
    els.tg.hidden = true;
    paintNodes(); renderRecs(); renderWhy(); renderLog(); renderInspect(); syncButtons();
    if (announce) {
      els.filters.open = true;
      setStatus('Reset. Idle. Press Run Demo to start a simulated run.');
    }
  }

  els.run.addEventListener('click', () => {
    reset(false);
    S.settings = readSettings();
    S.run = createRun(S.settings);
    S.running = true;
    S.logs = [];
    renderRecs(); renderWhy(); renderLog(); syncButtons();
    els.filters.open = false;
    beginStage(0);
    els.pause.focus();
  });

  els.pause.addEventListener('click', () => {
    if (!S.running) return;
    if (!S.paused) {
      S.paused = true;
      clearTimeout(S.timer);
      if (S.pending) S.pending.delay = Math.max(40, S.pending.delay - (performance.now() - S.pending.startedAt));
      setStatus('Paused. Press Resume to continue, or Reset to start over.');
    } else {
      S.paused = false;
      if (S.pending) schedule(S.pending.fn, S.pending.delay);
      setStatus(S.active >= 0 ? `Resumed. Stage ${S.active + 1} of ${STAGES.length}: ${STAGES[S.active].title} is running.` : 'Resumed.');
    }
    syncButtons();
  });

  els.reset.addEventListener('click', () => { reset(true); els.run.focus(); });

  els.logBtn.addEventListener('click', () => {
    tabs.select(tabBy('tab-log'), true);
    $('#panel-log').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  els.inspectBtn.addEventListener('click', () => {
    S.inspect = !S.inspect;
    els.inspectBtn.setAttribute('aria-pressed', S.inspect ? 'true' : 'false');
    if (S.inspect) {
      selectNode(S.selNode < 0 ? 0 : S.selNode, false);
      tabs.select(tabBy('tab-inspect'));
      setStatus('Inspect mode: select any node to see what it does and what flows through it.');
    } else {
      tabs.select(tabBy('tab-records'));
      setStatus(S.running ? 'Running.' : 'Inspect mode off.');
    }
  });

  // initial paint
  paintNodes();
  renderRecs();
  renderWhy();
  renderLog();
  renderInspect();
  syncButtons();
  drawEdges();

  // Defaults come from the data file so a changed default is reflected in the UI.
  $('#f-score').value = String(DEFAULT_SETTINGS.minScore);
}
