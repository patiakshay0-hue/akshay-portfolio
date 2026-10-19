// Small shared helpers. No framework, no dependencies.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** Reads the engine's published act progress (0..1) from the act element. */
export function readProgress(actEl) {
  return parseFloat(actEl.style.getPropertyValue('--sc-p')) || 0;
}

/**
 * Calls cb(p) whenever the act's progress changes, but only while the act is
 * near the viewport. One rAF loop per watched act, parked when it is offscreen.
 */
export function watchProgress(actEl, cb) {
  let live = false;
  let raf = 0;
  let last = -1;
  const loop = () => {
    const p = readProgress(actEl);
    if (p !== last) { last = p; cb(p); }
    raf = live ? requestAnimationFrame(loop) : 0;
  };
  const io = new IntersectionObserver((entries) => {
    live = entries[0].isIntersecting;
    if (live && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '60% 0px' });
  io.observe(actEl);
  cb(readProgress(actEl));
}

let toastTimer = 0;
export function toast(message, ms = 2400) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/** Copies text to the clipboard, with a textarea fallback for older browsers. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
}

export function pct(n, max) {
  return Math.max(0, Math.min(1, n / max));
}

/** Score-breakdown bars shared by the pipeline act, the Lab and the case study. */
export function barsHtml(score) {
  const rows = score.parts.map((p) => `
    <li>
      <span>${esc(p.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="--w:${pct(p.points, p.max)}"></span></span>
      <span class="bar-pts">${p.points}/${p.max}</span>
      <span class="bar-note">${esc(p.note)}</span>
    </li>`).join('');
  return `<ul class="bars">${rows}
    <li class="total"><span>Total</span><span class="bar-track"><span class="bar-fill" style="--w:${pct(score.total, 100)}"></span></span><span class="bar-pts">${score.total}/100</span></li></ul>`;
}
