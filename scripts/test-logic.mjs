// Unit checks for the demo logic. Run with: npm test
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, RECORDS } from '../src/data/lab.js';
import { classifyDomain, classifyLevel, dedupeKey, normalizeRecord, runAll } from '../src/modules/pipeline-logic.js';

let passed = 0;
const t = (name, fn) => { fn(); passed += 1; console.log(`  ok  ${name}`); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const byId = (state, id) => state.recs.find((r) => r.id === id);

t('abbreviations collapse to the same dedupe key', () => {
  const a = normalizeRecord(RECORDS[0]);
  const b = normalizeRecord(RECORDS[1]);
  assert.equal(dedupeKey(a), dedupeKey(b));
});

t('domain and experience level are independent fields', () => {
  const norm = normalizeRecord(RECORDS[0]);
  const d = classifyDomain(norm, RECORDS[0].description);
  const l = classifyLevel(norm, RECORDS[0].description);
  assert.equal(d.domain.label, 'Machine Learning');
  assert.equal(l.level, 'internship');
});

t('a senior software job is not classed entry-level', () => {
  const norm = normalizeRecord(RECORDS[3]);
  assert.equal(classifyLevel(norm, RECORDS[3].description).level, 'experienced');
});

t('missing evidence yields Unclear / Needs Review, not an invented level', () => {
  const norm = normalizeRecord(RECORDS[6]);
  assert.equal(classifyLevel(norm, RECORDS[6].description).level, 'unclear');
});

const { state, log } = runAll(clone(DEFAULT_SETTINGS));

t('default run: the duplicate is removed', () => {
  assert.equal(byId(state, 'r2').status, 'duplicate');
  assert.equal(byId(state, 'r1').status, 'selected');
});

t('default run: senior role is filtered by the experience filter', () => {
  const r = byId(state, 'r4');
  assert.equal(r.status, 'filtered');
  assert.match(r.reason, /Experience filter/);
});

t('default run: irrelevant marketing role is filtered with a reason', () => {
  assert.equal(byId(state, 'r8').status, 'filtered');
  assert.match(byId(state, 'r8').reason, /No relevant technology domain/);
});

t('default run: on-site overseas role is filtered by location', () => {
  assert.match(byId(state, 'r9').reason, /Location filter/);
});

t('default run: automation and agentic roles are selected and ranked', () => {
  assert.equal(byId(state, 'r3').status, 'selected');
  assert.equal(byId(state, 'r5').status, 'selected');
  assert.ok(state.messages.length >= 3);
  const scores = state.messages.map((m) => byId(state, m.id).score.total);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

t('scores are explained and bounded', () => {
  state.recs.filter((r) => r.score).forEach((r) => {
    assert.ok(r.score.total >= 0 && r.score.total <= 100);
    assert.equal(r.score.parts.length, 5);
  });
});

t('telegram preview carries every required field', () => {
  const text = state.messages.find((m) => m.id === 'r3').text;
  ['Junior AI Automation Developer', 'Lattice Flow Co.', 'AI Automation', 'Entry-Level', 'Pune', 'Source:', 'placeholder', 'Why:'].forEach((s) => assert.ok(text.includes(s), s));
});

t('the log says nothing was sent', () => {
  assert.ok(log.some((l) => /Nothing was sent to Telegram/.test(l.text)));
});

t('source timeout simulation drops Source C and keeps running', () => {
  const s = { ...clone(DEFAULT_SETTINGS), simulateSourceTimeout: true };
  const out = runAll(s);
  assert.equal(byId(out.state, 'r9').status, 'failed');
  assert.ok(out.state.messages.length >= 3);
  assert.ok(out.log.some((l) => l.level === 'warn' && /timed out/.test(l.text)));
});

t('raising the minimum score filters more records', () => {
  const s = { ...clone(DEFAULT_SETTINGS), minScore: 95 };
  const out = runAll(s);
  assert.ok(out.state.messages.length < state.messages.length);
});

// ---- news grouping (TF-IDF + cosine) and lead processing
const { HEADLINES, cluster } = await import('../src/modules/news.js');
const { processLeads } = await import('../src/modules/leads.js');

t('news: related headlines group together at the default threshold', () => {
  const groups = cluster(HEADLINES, 0.25);
  const find = (s) => groups.find((g) => g.some((h) => h.includes(s)));
  assert.ok(find('Central bank holds').some((h) => h.includes('Interest rates unchanged')));
  assert.ok(find('City council approves').some((h) => h.includes('green light')));
  assert.ok(find('Local team wins').some((h) => h.includes('championship win')));
  assert.notEqual(find('Central bank holds'), find('City council approves'));
});

t('news: a very high threshold splits stories, a very low one merges them', () => {
  assert.ok(cluster(HEADLINES, 0.95).length > cluster(HEADLINES, 0.25).length);
  assert.ok(cluster(HEADLINES, 0.0).length < cluster(HEADLINES, 0.25).length);
});

t('leads: normalizes, flags invalid email, merges duplicates, routes by category', () => {
  const out = processLeads();
  const by = (id) => out.find((l) => l.id === id);
  assert.equal(by('L1').name, 'Priya Shah');
  assert.equal(by('L1').email, 'priya.shah@example.com');
  assert.equal(by('L1').category, 'Automation');
  assert.equal(by('L2').category, 'Software');
  assert.equal(by('L3').status, 'duplicate');
  assert.equal(by('L4').status, 'review');
  assert.equal(by('L5').category, 'Opportunity');
});

console.log(`\n${passed} checks passed`);
