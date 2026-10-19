// Hero: real sample counts in the console, a looping packet, pointer depth.
// The console is decorative (aria-hidden); the headline is plain semantic HTML.
import { DEFAULT_SETTINGS } from '../data/lab.js';
import { runAll } from './pipeline-logic.js';
import { $, $$, FINE_POINTER, RM } from './util.js';

export function initHero() {
  const stage = $('.hero__stage');
  if (!stage) return;

  // Numbers shown in the console come from the same code the Lab runs.
  const { state } = runAll(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const s = state.summary;
  $('#hero-stat').textContent = `sample run: ${s.collected} collected, ${s.selected} selected`;
  $('#hl-norm').textContent = `${s.collected} records`;
  $('#hl-dup').textContent = `${s.duplicates} removed`;

  const nodes = ['.cn--trigger', '.cn--src', '.cn--ai', '.cn--if', '.cn--out', '.cn--note'].map((q) => $(q, stage));
  const edges = $$('.con__edges .e', stage);

  if (RM) {
    nodes.forEach((n) => n.classList.add('is-done'));
    return;
  }

  // ----- looping packet through the six nodes
  const canvas = $('.con__canvas', stage);
  const packet = $('#hero-packet');
  let step = 0;
  let timer = 0;
  let visible = true;

  const center = (node) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    return [
      (parseFloat(node.style.left) / 100 + 0.11) * w,
      (parseFloat(node.style.top) / 100 + 0.0833) * h,
    ];
  };

  function render() {
    nodes.forEach((n, i) => {
      n.classList.toggle('is-on', i === step);
      n.classList.toggle('is-done', i < step);
    });
    edges.forEach((e, i) => e.classList.toggle('on', i === step - 1));
    if (step < nodes.length - 1) {
      const [ax, ay] = center(nodes[step]);
      const [bx, by] = center(nodes[step + 1]);
      packet.style.opacity = '1';
      packet.animate(
        [{ transform: `translate(${ax}px, ${ay}px)` }, { transform: `translate(${bx}px, ${by}px)` }],
        { duration: 900, fill: 'forwards', easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    } else {
      packet.style.opacity = '0';
    }
  }

  function tick() {
    if (!visible || document.hidden) return;
    step = (step + 1) % (nodes.length + 1);
    if (step === nodes.length) {
      nodes.forEach((n) => { n.classList.remove('is-on'); n.classList.add('is-done'); });
      edges.forEach((e) => e.classList.remove('on'));
      packet.style.opacity = '0';
      return;
    }
    render();
  }

  render();
  timer = setInterval(tick, 1100);
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { rootMargin: '20% 0px' }).observe(stage);
  addEventListener('pagehide', () => clearInterval(timer));

  // ----- pointer depth (desktop only). Layers use the independent `translate`
  // property, so this never fights the engine's scroll-driven `transform`.
  if (FINE_POINTER) {
    let tx = 0; let ty = 0; let cx = 0; let cy = 0; let raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stage.style.setProperty('--mx', cx.toFixed(3));
      stage.style.setProperty('--my', cy.toFixed(3));
      raf = (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(loop) : 0;
    };
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }
}
