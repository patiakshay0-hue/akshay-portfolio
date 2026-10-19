// Browser verification: screenshots, layout checks and functional checks.
//
//   npm run dev            (or: npm run build && npm run preview)
//   npm run verify -- --url http://127.0.0.1:5173
//
// Uses the installed Chrome through playwright-core. Writes PNGs and a JSON
// report to ./lab. Exit code 1 if any check fails.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const URL_ = arg('url', 'http://127.0.0.1:5173');
const OUT = arg('out', 'lab');
const CHROME = process.env.SCROLLCRAFT_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const only = arg('only', '');

const report = { url: URL_, startedAt: new Date().toISOString(), modes: {}, checks: [] };
let failures = 0;
const check = (mode, name, ok, detail = '') => {
  report.checks.push({ mode, name, ok, detail });
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  [${mode}] ${name}${detail ? ' :: ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MODES = {
  desktop: { viewport: { width: 1440, height: 900 } },
  laptop: { viewport: { width: 1280, height: 720 } },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  compact: { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true },
  reduced: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  'reduced-mobile': { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' },
};

async function newPage(browser, mode) {
  const opts = { ...MODES[mode], permissions: ['clipboard-read', 'clipboard-write'] };
  const ctx = await browser.newContext(opts);
  // Never let a page capture the pointer, even in automation.
  await ctx.addInitScript(() => {
    Element.prototype.requestPointerLock = () => {};
    Element.prototype.setPointerCapture = () => {};
  });
  const page = await ctx.newPage();
  const problems = { console: [], page: [], failed: [], bad: [] };
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.console.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.page.push(String(e)));
  page.on('requestfailed', (r) => problems.failed.push(`${r.url()} ${r.failure() && r.failure().errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.bad.push(`${r.status()} ${r.url()}`); });
  return { ctx, page, problems };
}

const scrollTo = async (page, y) => {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await sleep(420);
};

async function sectionY(page, sel, p = 0) {
  return page.evaluate(([s, prog]) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    const top = r.top + scrollY;
    const act = el.hasAttribute('data-sc-act') && el.getAttribute('data-sc-act') !== 'flow';
    if (act) return top + Math.max(el.offsetHeight - innerHeight, 1) * prog;
    return top + (el.offsetHeight - innerHeight) * prog;
  }, [sel, p]);
}

const SECTIONS = ['#top', '#build', '#pipeline', '#automations', '#case-study', '#work', '#products', '#skills', '#about', '#process', '#contact'];

async function shootAll(page, mode) {
  const dir = `${OUT}/${mode}`;
  mkdirSync(dir, { recursive: true });
  const states = [];
  let n = 0;
  const shot = async (label) => {
    n += 1;
    await page.screenshot({ path: `${dir}/${String(n).padStart(2, '0')}-${label}.png` });
  };
  for (const sel of SECTIONS) {
    const exists = await page.$(sel);
    if (!exists) { check(mode, `section ${sel} exists`, false); continue; }
    const pinned = await page.evaluate((s) => {
      const el = document.querySelector(s);
      return el.hasAttribute('data-sc-act') && el.getAttribute('data-sc-act') !== 'flow';
    }, sel);
    const steps = pinned ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1];
    for (const p of steps) {
      const y = await sectionY(page, sel, p);
      await scrollTo(page, y);
      if (sel === '#pipeline') {
        states.push(await page.getAttribute('#pipe-stage', 'data-sc-verify-state'));
      }
      await shot(`${sel.slice(1)}-p${Math.round(p * 100)}`);
    }
  }
  return states;
}

async function layoutChecks(page, mode, problems) {
  await scrollTo(page, 0);
  const over = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  check(mode, 'no horizontal overflow', over.sw <= over.iw + 1, `scrollWidth ${over.sw} vs ${over.iw}`);
  const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
  check(mode, 'no broken images', broken.length === 0, broken.join(','));
  const nav = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="#"]')).map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
  check(mode, 'every in-page link has a target', nav.length === 0, nav.join(','));
  check(mode, 'no console errors or warnings', problems.console.length === 0, problems.console.slice(0, 3).join(' | '));
  check(mode, 'no page errors', problems.page.length === 0, problems.page.slice(0, 3).join(' | '));
  check(mode, 'no failed or 4xx requests', problems.failed.length + problems.bad.length === 0, [...problems.failed, ...problems.bad].slice(0, 3).join(' | '));
  const overflowing = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('h1,h2,h3,p,li,button,a').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > innerWidth + 2 || r.left < -2) && getComputedStyle(el).position !== 'fixed' && !el.closest('.process__rail,.hero__console,.hero__log,.tablewrap,.pd,.pipe__stage,.tabs')) out.push(`${el.tagName}.${el.className}:${Math.round(r.left)}..${Math.round(r.right)}`);
    });
    return out.slice(0, 5);
  });
  check(mode, 'no text element pokes outside the viewport', overflowing.length === 0, overflowing.join(' | '));
  const rail = await page.evaluate(() => { const r = document.querySelector('.process__rail'); return r ? r.scrollWidth - innerWidth : 0; });
  if (!mode.startsWith('reduced')) check(mode, 'process rail overflows by at least half a viewport', rail > (await page.evaluate(() => innerWidth)) * 0.5, `overflow ${rail}px`);
}

async function hero(page, mode) {
  await scrollTo(page, 0);
  const h = await page.evaluate(() => {
    const t = document.querySelector('#hero-title');
    const r = t.getBoundingClientRect();
    const cs = getComputedStyle(document.querySelector('.hero__copy'));
    return { top: r.top, bottom: r.bottom, h: r.height, op: parseFloat(cs.opacity), lines: t.querySelectorAll('.ln').length };
  });
  check(mode, 'hero headline fully visible on load', h.op > 0.95 && h.top >= 0 && h.bottom <= (await page.evaluate(() => innerHeight)), JSON.stringify(h));
  const cta = await page.evaluate(() => {
    const a = [...document.querySelectorAll('.hero__cta a')].map((x) => { const r = x.getBoundingClientRect(); return [x.textContent.trim(), r.bottom <= innerHeight && r.top >= 0]; });
    return a;
  });
  check(mode, 'both hero CTAs visible without scrolling', cta.length === 2 && cta.every((c) => c[1]), JSON.stringify(cta));
}

async function functional(page, mode) {
  // ---- navigation targets
  for (const [nav, target] of [['work', '#work'], ['automations', '#automations'], ['about', '#about'], ['contact', '#contact']]) {
    await scrollTo(page, 0);
    const mobile = MODES[mode].isMobile || MODES[mode].viewport.width <= 860;
    if (mobile) { await page.click('#menu-toggle'); await sleep(150); await page.click(`#menu a[data-nav="${nav}"]`); }
    else await page.click(`.bar__nav a[data-nav="${nav}"]`);
    await sleep(1400);
    const top = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, target);
    check(mode, `nav "${nav}" scrolls to its section`, top > -200 && top < 420, `top ${Math.round(top)}`);
    const active = await page.evaluate((n) => { const a = document.querySelector(`.bar__nav a[data-nav="${n}"]`); return a && a.getAttribute('aria-current'); }, nav);
    if (!mobile) check(mode, `nav "${nav}" shows active state`, active === 'true', String(active));
  }

  // ---- lab: run, pause, resume, reset, log, inspect
  await page.evaluate(() => document.querySelector('#automations').scrollIntoView());
  await sleep(500);
  await page.click('#lab-run');
  await sleep(900);
  const mid = await page.textContent('#lab-status');
  check(mode, 'run starts and reports a stage', /Stage \d of 9/.test(mid), mid);
  await page.click('#lab-pause');
  const pausedLabel = await page.textContent('#lab-pause');
  const stageBefore = await page.textContent('#lab-status');
  await sleep(2000);
  const stageAfter = await page.textContent('#lab-status');
  check(mode, 'pause holds the run and the button becomes Resume', pausedLabel === 'Resume' && stageBefore === stageAfter, `${pausedLabel} | ${stageBefore} | ${stageAfter}`);
  await page.click('#lab-pause');
  await page.waitForFunction(() => /Run complete/.test(document.querySelector('#lab-status').textContent), null, { timeout: 25000 });
  check(mode, 'resume finishes the run', true);
  const summary = await page.textContent('#lab-status');
  check(mode, 'completed run says nothing was sent', /Nothing was sent to Telegram/.test(summary));
  const recs = await page.$$eval('.rec__st', (els) => els.map((e) => e.dataset.s));
  check(mode, 'records show selected, filtered and duplicate', ['selected', 'filtered', 'duplicate'].every((s) => recs.includes(s)), recs.join(','));
  await page.click('#lab-log-btn');
  const logTab = await page.getAttribute('#tab-log', 'aria-selected');
  const logLines = await page.$$eval('#lab-log li', (l) => l.length);
  check(mode, 'View Execution Log opens the log with entries', logTab === 'true' && logLines >= 12, `${logLines} lines`);
  check(mode, 'telegram preview appears and is labelled not sent', await page.isVisible('#lab-tg') && /not sent/.test(await page.textContent('#lab-tg')));
  await page.click('#lab-inspect-btn');
  check(mode, 'Inspect Workflow opens the inspector', (await page.getAttribute('#tab-inspect', 'aria-selected')) === 'true' && (await page.getAttribute('#lab-inspect-btn', 'aria-pressed')) === 'true');
  await page.click('#lab-nodes li:nth-child(4) .node');
  const insp = await page.textContent('#lab-inspect');
  check(mode, 'selecting a node shows its details and sample output', /Duplicate Detection/.test(insp) && /duplicatesRemoved/.test(insp));
  await page.click('#lab-reset');
  check(mode, 'reset returns to idle', /Idle/.test(await page.textContent('#lab-status')) && (await page.$$eval('.node.is-done', (n) => n.length)) === 0);
  // filters change the outcome
  await page.click('#lab-inspect-btn');
  await page.selectOption('#f-score', '90');
  await page.click('#lab-run');
  await page.waitForFunction(() => /Run complete/.test(document.querySelector('#lab-status').textContent), null, { timeout: 25000 });
  const strict = await page.textContent('#lab-status');
  check(mode, 'a stricter filter changes the result', /: [0-2] selected/.test(strict), strict);
  await page.click('#lab-reset');
  await page.selectOption('#f-score', '60');
  await page.check('#f-timeout');
  await page.click('#lab-run');
  await page.waitForFunction(() => /Run complete/.test(document.querySelector('#lab-status').textContent), null, { timeout: 25000 });
  await page.click('#lab-log-btn');
  const timeoutLog = await page.textContent('#lab-log');
  check(mode, 'source-timeout simulation logs a warning and the run continues', /timed out/.test(timeoutLog) && /failed/.test(await page.textContent('#lab-status')));
  await page.click('#lab-reset');
  await page.uncheck('#f-timeout');

  // ---- case study tabs (keyboard)
  await page.evaluate(() => document.querySelector('#case-tabs').scrollIntoView());
  await page.focus('#ct-overview');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  check(mode, 'case-study tabs move with the arrow keys', (await page.getAttribute('#ct-stages', 'aria-selected')) === 'true' && (await page.isVisible('#cp-stages')));
  await page.click('#ct-sample');
  check(mode, 'sample tab shows generated JSON', /Lattice Flow/.test(await page.textContent('#sample-in')));
  await page.click('#ct-status');
  check(mode, 'status tab distinguishes prototype and proposed', /Prototype/.test(await page.textContent('#cp-status')) && /Proposed/.test(await page.textContent('#cp-status')));

  // ---- project explorer
  await page.evaluate(() => document.querySelector('#work-filters').scrollIntoView());
  const total = await page.$$eval('#work-grid .tile', (t) => t.length);
  check(mode, 'explorer lists all projects', total === 9, `${total}`);
  const counts = {};
  for (const c of ['automation', 'ai', 'software', 'data', 'all']) {
    await page.click(`[data-cat="${c}"]`);
    counts[c] = await page.$$eval('#work-grid .tile', (t) => t.length);
  }
  check(mode, 'each filter changes the visible projects', counts.automation < counts.all && counts.software < counts.all && counts.ai > 0 && counts.data > 0, JSON.stringify(counts));
  check(mode, 'active filter is exposed with aria-pressed', (await page.getAttribute('[data-cat="all"]', 'aria-pressed')) === 'true');
  // empty state: temporarily filter to nothing via a synthetic event
  await page.evaluate(() => { document.querySelector('#work-grid').innerHTML = ''; document.querySelector('#work-grid').hidden = true; document.querySelector('#work-empty').hidden = false; });
  check(mode, 'empty state is meaningful', /No projects in this category/.test(await page.textContent('#work-empty')));
  await page.click('#work-reset');
  check(mode, 'empty state recovers via Show all projects', (await page.$$eval('#work-grid .tile', (t) => t.length)) === 9);

  // ---- dialog: open, content, esc, focus restore
  const opener = page.locator('[data-open="news-grouping"]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#project-dialog[open]');
  const dlg = await page.textContent('#pd-body');
  check(mode, 'detail view has all required sections', ['Overview', 'Problem', 'Solution', 'Workflow', 'Technology stack', 'Challenges and learnings', 'Links'].every((s) => dlg.includes(s)));
  check(mode, 'detail view shows an honest status note', /Concept/.test(dlg) && /not a neural embedding/.test(dlg));
  const g1 = await page.$$eval('#ng-g .ng__g', (g) => g.length);
  await page.fill('#ng-t', '0.55');
  await page.dispatchEvent('#ng-t', 'input');
  const g2 = await page.$$eval('#ng-g .ng__g', (g) => g.length);
  check(mode, 'news-grouping slider regroups headlines', g2 > g1, `${g1} -> ${g2}`);
  await page.keyboard.press('Escape');
  await sleep(200);
  check(mode, 'Escape closes the dialog', !(await page.$('#project-dialog[open]')));
  check(mode, 'focus returns to the opener', await page.evaluate(() => document.activeElement && document.activeElement.dataset.open === 'news-grouping'));

  // ---- contact form
  await page.evaluate(() => document.querySelector('#inquiry').scrollIntoView({ block: 'center' }));
  await page.click('#q-copy');
  check(mode, 'empty inquiry shows a validation error', await page.isVisible('#q-err') && (await page.getAttribute('#q-what', 'aria-invalid')) === 'true');
  await page.fill('#q-what', 'Automate our weekly lead sorting.');
  await page.fill('#q-name', 'Test Visitor');
  await page.check('#q-types input[value="Website designing and development"]');
  await page.click('#q-copy');
  await sleep(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check(mode, 'Copy Inquiry includes message, name and every selected order type', /Automate our weekly lead sorting/.test(clip) && /Test Visitor/.test(clip) && /Website designing and development, Automation development|Automation development, Website designing and development/.test(clip), clip.slice(0, 90));
  const links = await page.$$eval('#contact-links a', (a) => a.map((x) => x.getAttribute('href')));
  check(mode, 'configured email and phone appear as real links; unset ones stay hidden', links.includes('mailto:akshaypradippatil818@gmail.com') && links.includes('tel:8454813220') && links.length === 2, links.join(','));
  await page.uncheck('#q-types input[value="Automation development"]');
  await page.uncheck('#q-types input[value="Website designing and development"]');
  await page.click('#q-send');
  check(mode, 'sending with no order type selected is rejected', (await page.textContent('#q-err')).includes('at least one type'));
}

async function mobileMenu(page, mode) {
  await scrollTo(page, 0);
  await page.click('#menu-toggle');
  check(mode, 'mobile menu opens', await page.isVisible('#menu') && (await page.getAttribute('#menu-toggle', 'aria-expanded')) === 'true');
  await page.keyboard.press('Escape');
  check(mode, 'Escape closes the mobile menu', !(await page.isVisible('#menu')));
}

async function keyboard(page, mode) {
  await page.goto(URL_, { waitUntil: 'load' });
  await sleep(600);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement.className);
  check(mode, 'first Tab stop is the skip link', /skip/.test(first), first);
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 || s.boxShadow !== 'none'; });
  check(mode, 'focus is visibly indicated', ring);
}

async function run() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const modes = (only ? only.split(',') : Object.keys(MODES));
  for (const mode of modes) {
    console.log(`\n== ${mode} ==`);
    // Old screenshots must never be mistaken for current ones.
    rmSync(`${OUT}/${mode}`, { recursive: true, force: true });
    const { ctx, page, problems } = await newPage(browser, mode);
    try {
      await page.goto(URL_, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await sleep(900);
      await hero(page, mode);
      const states = await shootAll(page, mode);
      const uniq = new Set(states).size;
      if (!mode.startsWith('reduced')) check(mode, 'pipeline painted state advances across the act', uniq >= 4, `${uniq} distinct states: ${states.join(' ')}`);
      await layoutChecks(page, mode, problems);
      if (mode === 'desktop' || mode === 'mobile' || mode === 'reduced') await functional(page, mode);
      if (MODES[mode].viewport.width <= 860 && !mode.startsWith('reduced')) { await scrollTo(page, 0); await mobileMenu(page, mode); }
      if (mode === 'desktop') await keyboard(page, mode);
      report.modes[mode] = { problems };
    } catch (err) {
      check(mode, 'run completed without a script error', false, String(err).slice(0, 300));
      await page.screenshot({ path: `${OUT}/${mode}-ERROR.png` }).catch(() => {});
    }
    await ctx.close();
  }
  await browser.close();
  report.failures = failures;
  report.finishedAt = new Date().toISOString();
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(`\n${report.checks.length - failures} passed, ${failures} failed. Report: ${OUT}/report.json`);
  process.exit(failures ? 1 : 0);
}

run();
