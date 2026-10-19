# Akshay Patil: AI Automation & Software Portfolio

A scroll-driven portfolio built on the [ScrollCraft](https://github.com/nateherkai/scroll-craft) engine, with a working
automation simulator (the **Automation Lab**) and a scroll-driven **Pipeline** scene. Plain HTML, CSS and JavaScript,
bundled with Vite. No framework, no backend, no API keys.

The creative brief and design decisions are in [BRIEF.md](BRIEF.md).

## Quick start

Prerequisites: Node.js 18 or newer (developed on Node 24) and npm.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves `dist/` at http://127.0.0.1:4173 |
| `npm test` | 17 unit checks for the pipeline, news-grouping and lead logic |
| `npm run verify -- --url http://127.0.0.1:4173` | Browser verification in 7 viewport modes, screenshots into `lab/` |

`npm run verify` needs Google Chrome. It looks in `C:/Program Files/Google/Chrome/Application/chrome.exe`; set
`SCROLLCRAFT_CHROME` to override.

## Configuration (do this before publishing)

Everything personal lives in three data files. Nothing is hard-coded in the markup.

1. **`src/data/site.config.js`**: email, GitHub, LinkedIn and résumé. They start **empty**, and any empty value is hidden
   from the page. The contact section shows "Direct contact links will appear here once they are configured" until you
   fill at least one in. Putting a file in `public/` (for example `public/resume.pdf`) and setting `resume: 'resume.pdf'`
   enables the résumé link. Setting `email` also enables the "Email This Inquiry" button and a Copy button.
2. **`src/data/projects.js`**: every project, its **status** (`implemented`, `prototype`, `concept`), links and details.
   The statuses shipped here are conservative first drafts. **Confirm each against your real code**, and add `links.repo`
   and `links.demo` only for URLs that exist (empty links are hidden).
3. **`src/data/skills.js`**: the capabilities ledger. `hands-on` shows a filled dot, `learning` a hollow dot. `evidence`
   lists the project ids that substantiate a skill. Remove anything you cannot back up.

Other edits: replace `public/img/akshay.jpg` (720 x 960) for a different portrait, and edit the About copy in `index.html`.

## Project structure

```
index.html                 All section markup and ScrollCraft data-sc-* attributes
BRIEF.md                   Creative brief, feeling curve, honesty contract
public/engine/             ScrollCraft engine, copied UNMODIFIED (scrollcraft.js, scrollcraft.css)
public/img/akshay.jpg      About portrait
src/main.js                Entry: renders dynamic sections, then mounts the engine
src/data/
  site.config.js           Contact details and URLs (central config)
  projects.js              Project content and statuses
  skills.js                Capabilities ledger
  lab.js                   Fictional sample records, pipeline stages, default filters
src/modules/
  pipeline-logic.js        PURE logic: normalize, dedupe, classify, score, filter, format (unit tested)
  news.js, leads.js        PURE logic for the news-grouping and lead-processing examples (unit tested)
  lab.js                   The Automation Lab UI and run scheduler
  climax.js                The scroll-driven Pipeline scene
  hero.js, nav.js          Hero depth and animation, navigation
  explorer.js, products.js Project explorer, detail dialog, product builds and skills ledger
  case.js, contact.js      Case study tabs, contact and inquiry form
  tabs.js, util.js         Shared helpers
src/styles/                Design tokens and per-area stylesheets (imported by main.css)
scripts/test-logic.mjs     Unit tests (npm test)
scripts/verify.mjs         Browser verification (npm run verify)
```

## ScrollCraft integration

- The engine files in `public/engine/` are byte-identical to the ones in the ScrollCraft repository
  (`plugins/nateherk-design/skills/scroll-craft/engine/`). They are never edited; all custom behavior lives in `src/`.
- `index.html` loads the engine CSS first, then the site CSS, then the engine script. `src/main.js` calls
  `ScrollCraft.mount(document.body)` after the dynamic sections are rendered, and asks the engine to re-measure with
  `layout()` when page height changes.
- Devices used: `pin` (hero, Pipeline), `parallax` (four hero planes), `pan` (How I work), `reveal` (portrait, closing
  line, wordmark), `in` and `stagger` (section entrances), `drift`, plus the engine's pointer-safe conventions.
- The Pipeline scene reads the act's published `--sc-p` and exposes its painted state through `data-sc-verify-state`, as
  the verification guide asks for custom fixed state.
- **Reduced motion:** the hero and Pipeline become ordinary stacked sections (no pinned scroll space, no cues) and the
  Pipeline gets a Previous/Next stepper. The process rail uses the engine's own scroll-region fallback.
- Not used, by choice: scrub video, worldflight and image sequences. There is no footage, and the page is a tool-led
  argument. `ffmpeg` is therefore not required.

## Production build and deployment

```bash
npm run build
```

`dist/` is a static site with relative paths (`base: './'`), so it works from any folder or sub-path. Deploy it to any
static host:

- **Netlify / Cloudflare Pages / Vercel**: build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: publish the contents of `dist/` (for example with `gh-pages` or an Actions workflow).
- **Any server**: copy `dist/` to the web root.

Serve it over **http(s)**. Opening `dist/index.html` straight from the file system will not work because browsers block
module scripts on `file://`.

## What is simulated

The Automation Lab and the Pipeline scene run **real rule-based logic** (`src/modules/pipeline-logic.js`) on **fictional
sample records**. They never contact a job site, n8n, a language model or Telegram, and the page says so wherever it
matters. The classification is keyword-and-regex evidence, not an AI model.

## Verification

`npm test` runs the unit checks. `npm run verify` drives Chrome through desktop (1440x900), laptop (1280x720), tablet,
phone (390x844), compact phone (360x640) and reduced motion (desktop and phone): screenshots at several scroll positions
of every scene, layout checks (overflow, broken images, links, console errors, failed requests), and functional checks of
the navigation, every Lab control, case-study tabs, project filters, the detail dialog, the inquiry form and the mobile
menu. ScrollCraft's own `shoot.mjs` harness is also supported; run it from this folder so it finds `playwright-core`.
