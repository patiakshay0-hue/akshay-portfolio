// Pure logic for the job-opportunity demo: no DOM, no network.
// The Lab, the Pipeline scroll act and scripts/test-logic.mjs all import this.
//
// Classification here is RULE BASED (keyword and regex evidence). It does not
// call a language model. That is stated in the UI wherever it matters.
import { RECORDS, SKILL_KEYWORDS, SOURCES, STAGES } from '../data/lab.js';

export const DOMAINS = [
  { id: 'ai-automation', label: 'AI Automation', weight: 40, keys: ['n8n', 'workflow automation', 'automation', 'webhook', 'workflows'] },
  { id: 'agentic-ai', label: 'Agentic AI', weight: 40, keys: ['agentic', 'tool-using', 'agents', 'agent'] },
  { id: 'ai-engineering', label: 'AI Engineering', weight: 36, keys: ['llm', 'prompt', 'generative ai', 'rag', 'embeddings'] },
  { id: 'machine-learning', label: 'Machine Learning', weight: 32, keys: ['machine learning', 'classification model', 'model training', 'scikit-learn', 'pytorch'] },
  { id: 'full-stack', label: 'Full-Stack Development', weight: 26, keys: ['full-stack', 'full stack'] },
  { id: 'web-dev', label: 'Web Development', weight: 22, keys: ['web developer', 'frontend', 'html', 'css', 'websites'] },
  { id: 'software-dev', label: 'Software Development', weight: 22, keys: ['software developer', 'software engineer', 'backend', 'engineering team'] },
  { id: 'data-analytics', label: 'Data Analytics', weight: 24, keys: ['data analyst', 'analytics', 'sql', 'dashboards'] },
  { id: 'business-analytics', label: 'Business Analytics', weight: 18, keys: ['business analyst', 'business analytics', 'kpi'] },
  { id: 'other-tech', label: 'Other Relevant Technology Roles', weight: 10, keys: ['qa engineer', 'devops', 'cloud engineer', 'support engineer'] },
];

export const LEVELS = {
  internship: { label: 'Internship', fit: 25 },
  entry: { label: 'Entry-Level / Fresher', fit: 25 },
  experienced: { label: 'Experienced', fit: 0 },
  all: { label: 'All Experience Levels', fit: 18 },
  unclear: { label: 'Unclear / Needs Review', fit: 8 },
};

const ABBREVIATIONS = [
  [/\bml\b/g, 'machine learning'],
  [/\bai\b/g, 'artificial intelligence'],
  [/\bjr\.?\b/g, 'junior'],
  [/\bsr\.?\b/g, 'senior'],
  [/\bpvt\.?\b|\bltd\.?\b|\bco\.?\b|\binc\.?\b|\bllc\b/g, ''],
];

export function cleanText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

export function normalizeKey(s) {
  let t = cleanText(s).toLowerCase().replace(/\([^)]*\)/g, ' ');
  ABBREVIATIONS.forEach(([re, to]) => { t = t.replace(re, to); });
  return t.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function workMode(location) {
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export function normalizeRecord(raw) {
  const loc = cleanText(raw.location);
  const mode = workMode(loc);
  const place = cleanText(loc.replace(/\(.*?\)/g, '').replace(/remote,?/i, '')).replace(/^,\s*/, '') || 'Not stated';
  const inIndia = /india/i.test(loc);
  return {
    title: cleanText(raw.title).replace(/\s*\(remote\)\s*/i, ' ').trim(),
    company: cleanText(raw.company).replace(/\b(pvt\.?|ltd\.?)\b/gi, '').replace(/\s+/g, ' ').trim(),
    mode,
    place,
    country: inIndia ? 'India' : place.split(',').pop().trim(),
    postedDaysAgo: raw.postedDaysAgo,
    link: '[application link placeholder]',
  };
}

export function dedupeKey(norm) {
  return `${normalizeKey(norm.company)}|${normalizeKey(norm.title)}`;
}

/** Returns { domain, evidence[] } or { domain: null, evidence: [] }. */
export function classifyDomain(norm, description) {
  const title = norm.title.toLowerCase();
  const body = description.toLowerCase();
  let best = null;
  DOMAINS.forEach((d) => {
    const hits = [];
    let strength = 0;
    d.keys.forEach((k) => {
      if (title.includes(k)) { hits.push(`title: "${k}"`); strength += 2; }
      else if (body.includes(k)) { hits.push(`text: "${k}"`); strength += 1; }
    });
    if (!hits.length) return;
    if (!best || strength > best.strength || (strength === best.strength && d.weight > best.d.weight)) {
      best = { d, hits, strength };
    }
  });
  if (!best) return { domain: null, evidence: [] };
  return { domain: best.d, evidence: best.hits.slice(0, 3) };
}

const RE_INTERN = /\bintern(ship)?\b/;
const RE_ENTRY = /\b(fresher|freshers|fresh graduates?|entry[- ]level|junior|trainee|recent graduates?)\b|\b0\s*[-–]\s*[12]\s*years?\b/;
const RE_SENIOR = /\b(senior|lead|principal|staff)\b|\b[3-9]\+?\s*years?\b|\b[3-9]\s*[-–]\s*\d+\s*years?\b/;
const RE_ALL = /all experience levels|any experience level|all levels/;

/** Experience level is independent of domain. Returns { level, evidence[] }. */
export function classifyLevel(norm, description) {
  const text = `${norm.title} ${description}`.toLowerCase();
  const quote = (re) => { const m = text.match(re); return m ? `"${m[0].trim()}"` : ''; };
  const intern = RE_INTERN.test(text);
  const entry = RE_ENTRY.test(text);
  const senior = RE_SENIOR.test(text);

  if (intern && !senior) return { level: 'internship', evidence: [quote(RE_INTERN)] };
  if (entry && !senior) return { level: 'entry', evidence: [quote(RE_ENTRY)] };
  if (senior && !intern && !entry) return { level: 'experienced', evidence: [quote(RE_SENIOR)] };
  if (RE_ALL.test(text)) return { level: 'all', evidence: [quote(RE_ALL)] };
  if ((intern || entry) && senior) return { level: 'unclear', evidence: ['conflicting signals (junior and senior wording)'] };
  return { level: 'unclear', evidence: ['no experience requirement stated'] };
}

/** Transparent relevance score. Every point is listed. */
export function scoreRecord(rec) {
  const parts = [];
  parts.push({ label: 'Domain match', points: rec.domain ? rec.domain.weight : 0, max: 40, note: rec.domain ? rec.domain.label : 'no relevant domain' });
  parts.push({ label: 'Experience fit', points: rec.level ? LEVELS[rec.level].fit : 0, max: 25, note: rec.level ? LEVELS[rec.level].label : '' });

  const text = `${rec.norm.title} ${rec.raw.description}`.toLowerCase();
  const seen = SKILL_KEYWORDS.filter((k) => text.includes(k));
  parts.push({ label: 'Skill keywords', points: Math.min(seen.length * 3, 15), max: 15, note: seen.length ? seen.join(', ') : 'none found' });

  let loc = 0; let locNote = 'outside preferred regions';
  if (rec.norm.mode === 'Remote') { loc = 10; locNote = 'remote'; }
  else if (rec.norm.country === 'India') { loc = 6; locNote = `${rec.norm.mode.toLowerCase()} in India`; }
  parts.push({ label: 'Location', points: loc, max: 10, note: locNote });

  const d = rec.norm.postedDaysAgo;
  parts.push({ label: 'Freshness', points: d <= 3 ? 10 : d <= 7 ? 5 : 0, max: 10, note: `${d} day${d === 1 ? '' : 's'} ago` });

  const total = Math.min(100, parts.reduce((a, p) => a + p.points, 0));
  return { total, parts };
}

/** Decide keep / skip for a scored record. Returns { keep, reason }. */
export function applyFilters(rec, settings) {
  if (!rec.domain) return { keep: false, reason: 'No relevant technology domain found.' };
  if (settings.remoteOrIndiaOnly && rec.norm.mode !== 'Remote' && rec.norm.country !== 'India') {
    return { keep: false, reason: `Location filter: on-site in ${rec.norm.country}, outside Remote or India.` };
  }
  if (!settings.levels[rec.level]) {
    return { keep: false, reason: `Experience filter: "${LEVELS[rec.level].label}" is switched off.` };
  }
  if (rec.score.total < settings.minScore) {
    return { keep: false, reason: `Score ${rec.score.total} is below the minimum of ${settings.minScore}.` };
  }
  return { keep: true, reason: `Score ${rec.score.total} clears the minimum of ${settings.minScore}; ${LEVELS[rec.level].label} is allowed.` };
}

export function matchingReason(rec) {
  const skill = rec.score.parts.find((p) => p.label === 'Skill keywords');
  const bits = [`${rec.domain.label} role`, LEVELS[rec.level].label.toLowerCase()];
  if (skill && skill.note !== 'none found') bits.push(`skills: ${skill.note}`);
  if (rec.norm.mode === 'Remote') bits.push('remote');
  return bits.join(' · ');
}

export function sourceName(id) {
  return (SOURCES.find((s) => s.id === id) || { name: 'Unknown source' }).name;
}

export function formatTelegram(rec) {
  const where = rec.norm.mode === 'Remote' ? `Remote (${rec.norm.country})` : `${rec.norm.place} (${rec.norm.mode})`;
  return [
    `🔎 ${rec.norm.title}`,
    `🏢 ${rec.norm.company}`,
    `🏷 ${rec.domain.label} · ${LEVELS[rec.level].label}`,
    `📍 ${where}`,
    `📡 Source: ${sourceName(rec.raw.source)}`,
    `🔗 ${rec.norm.link}`,
    `✅ Why: ${matchingReason(rec)}`,
    `Score ${rec.score.total}/100`,
  ].join('\n');
}

// ---------------------------------------------------------------- the run ----

let runCounter = 0;

/**
 * Creates a run. Call run.step(i) for i = 0..8 in order. Each step mutates the
 * per-record state and returns { logs: [{level, text}], counts: {in, out} }.
 */
export function createRun(settings, records = RECORDS) {
  runCounter += 1;
  const runId = `demo-${String(runCounter).padStart(3, '0')}`;
  const recs = records.map((raw) => ({
    id: raw.id, raw, norm: null, status: 'queued', reason: '', domain: null,
    domainEvidence: [], level: null, levelEvidence: [], score: null, decision: null,
  }));
  const alive = () => recs.filter((r) => r.status === 'active' || r.status === 'selected');
  const state = { runId, recs, messages: [], summary: null };

  const steps = [
    function trigger() {
      return { logs: [
        { level: 'info', text: `Schedule trigger fired (simulated). Run ${runId}.` },
        { level: 'info', text: `Settings: min score ${settings.minScore}, Remote or India only: ${settings.remoteOrIndiaOnly ? 'on' : 'off'}.` },
      ], counts: { in: 0, out: records.length } };
    },
    function sources() {
      const logs = [];
      SOURCES.forEach((s) => {
        const mine = recs.filter((r) => r.raw.source === s.id);
        if (settings.simulateSourceTimeout && s.id === 'C') {
          logs.push({ level: 'warn', text: `${s.name}: request timed out (simulated). Retry 1/2 failed.` });
          logs.push({ level: 'warn', text: `${s.name}: retry 2/2 failed. Marked as failed, run continues with 2 of 3 sources.` });
          mine.forEach((r) => { r.status = 'failed'; r.reason = `${s.name} timed out (simulated), so this record was never collected.`; });
        } else {
          mine.forEach((r) => { r.status = 'active'; });
          logs.push({ level: 'info', text: `${s.name}: collected ${mine.length} posting${mine.length === 1 ? '' : 's'}.` });
        }
      });
      return { logs, counts: { in: records.length, out: alive().length } };
    },
    function normalize() {
      const before = alive().length;
      alive().forEach((r) => { r.norm = normalizeRecord(r.raw); });
      return { logs: [{ level: 'info', text: `Normalized ${before} records: titles, organizations, work mode, locations and dates.` }], counts: { in: before, out: before } };
    },
    function dedupe() {
      const seen = new Map();
      const logs = [];
      const before = alive().length;
      alive().forEach((r) => {
        const key = dedupeKey(r.norm);
        r.dedupeKey = key;
        if (seen.has(key)) {
          const first = seen.get(key);
          r.status = 'duplicate';
          r.reason = `Duplicate of ${first.id} (${first.norm.title}, ${first.norm.company}). Same normalized key: "${key}".`;
          logs.push({ level: 'skip', text: `${r.id} dropped: duplicate of ${first.id}.` });
        } else {
          seen.set(key, r);
        }
      });
      if (!logs.length) logs.push({ level: 'info', text: 'No duplicates found.' });
      return { logs, counts: { in: before, out: alive().length } };
    },
    function domain() {
      const before = alive().length;
      let none = 0;
      alive().forEach((r) => {
        const c = classifyDomain(r.norm, r.raw.description);
        r.domain = c.domain; r.domainEvidence = c.evidence;
        if (!c.domain) none += 1;
      });
      const logs = [{ level: 'info', text: `Classified ${before} records by domain (rule-based keyword evidence).` }];
      if (none) logs.push({ level: 'warn', text: `${none} record${none === 1 ? '' : 's'} had no relevant technology domain.` });
      return { logs, counts: { in: before, out: before } };
    },
    function level() {
      const before = alive().length;
      let unclear = 0;
      alive().forEach((r) => {
        const c = classifyLevel(r.norm, r.raw.description);
        r.level = c.level; r.levelEvidence = c.evidence;
        if (c.level === 'unclear') unclear += 1;
      });
      const logs = [{ level: 'info', text: 'Extracted experience requirements from the text, independent of domain.' }];
      if (unclear) logs.push({ level: 'warn', text: `${unclear} record${unclear === 1 ? '' : 's'} marked "Unclear / Needs Review" because the text gave no clear evidence.` });
      return { logs, counts: { in: before, out: before } };
    },
    function score() {
      const before = alive().length;
      const logs = [];
      alive().forEach((r) => {
        r.score = scoreRecord(r);
        r.decision = applyFilters(r, settings);
        r.reason = r.decision.reason;
        if (r.decision.keep) { r.status = 'selected'; }
        else { r.status = 'filtered'; logs.push({ level: 'skip', text: `${r.id} filtered: ${r.decision.reason}` }); }
      });
      const kept = recs.filter((r) => r.status === 'selected').length;
      logs.unshift({ level: 'info', text: `Scored ${before} records and applied filters: ${kept} selected.` });
      return { logs, counts: { in: before, out: kept } };
    },
    function prepare() {
      const picked = recs.filter((r) => r.status === 'selected').sort((a, b) => b.score.total - a.score.total);
      state.messages = picked.map((r) => ({ id: r.id, text: formatTelegram(r) }));
      return { logs: [{ level: 'info', text: `Formatted ${picked.length} message${picked.length === 1 ? '' : 's'}, ranked by score.` }], counts: { in: picked.length, out: picked.length } };
    },
    function telegram() {
      const n = state.messages.length;
      state.summary = {
        collected: recs.filter((r) => r.status !== 'failed' && r.status !== 'queued').length,
        failed: recs.filter((r) => r.status === 'failed').length,
        duplicates: recs.filter((r) => r.status === 'duplicate').length,
        filtered: recs.filter((r) => r.status === 'filtered').length,
        selected: n,
      };
      return { logs: [
        { level: 'info', text: `DRY RUN: ${n} message${n === 1 ? '' : 's'} ready. Nothing was sent to Telegram.` },
        { level: 'info', text: `Run complete: ${state.summary.selected} selected, ${state.summary.filtered} filtered, ${state.summary.duplicates} duplicate, ${state.summary.failed} failed.` },
      ], counts: { in: n, out: n } };
    },
  ];

  return {
    state,
    stages: STAGES,
    total: steps.length,
    step(i) { return steps[i](); },
  };
}

/** Runs every step and returns the final state. Used by tests and the scroll act. */
export function runAll(settings, records = RECORDS) {
  const run = createRun(settings, records);
  const log = [];
  for (let i = 0; i < run.total; i += 1) log.push(...run.step(i).logs);
  return { state: run.state, log };
}
