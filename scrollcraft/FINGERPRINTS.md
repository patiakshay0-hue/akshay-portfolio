# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| akshay-portfolio | Act-based scenes with one live surface (Automation Lab); not a pure Live surface because the brief required a nav bar, hero and CTA | Auto-hiding minimal bar: wordmark, 4 links with active underline, one CTA; full-screen menu on phones | Pinned, four-plane parallax (grid, wiring, workflow console, foreground log) with desktop pointer depth; no video | pin > flow > pin (peak, 5.6vh) > flow > flow > flow > flow > flow > flow > pan > flow; 11 sections, 26.2vh desktop | Flow section: connecting line wipe, inquiry composer that copies (mailto only when configured), giant wordmark footer | Scroll is the run: scroll position is the execution clock of one real record through nine stages of real rule-based code, with a live run trace | Premium dark technical (graphite, lime, mono instrumentation); no photography except the About portrait | Vite, 5173 dev / 4173 preview |

*Shares with other builds: a fixed minimal top bar, a pinned hero, and a pan act. It does not use scrub video, worldflight or a spotlight/magnet close.*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

Nothing is taken yet.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
