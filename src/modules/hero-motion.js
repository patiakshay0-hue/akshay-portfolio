// Hero motion: a canvas of data packets travelling along circuit-style routes.
// Decorative only (aria-hidden). Pauses offscreen, caps pixel density, and is
// not started at all under reduced motion.
import { $, RM } from './util.js';

const ACCENT = '198, 243, 107';
const INK = '243, 245, 239';

function makeRoutes(w, h) {
  const routes = [];
  const n = w < 700 ? 9 : 16;
  for (let i = 0; i < n; i += 1) {
    const horizontalFirst = Math.random() < 0.5;
    let x = Math.random() < 0.5 ? -20 : Math.random() * w;
    let y = x === -20 ? Math.random() * h : (Math.random() < 0.5 ? -20 : h + 20);
    const pts = [[x, y]];
    const legs = 3 + Math.floor(Math.random() * 3);
    let horiz = horizontalFirst;
    for (let k = 0; k < legs; k += 1) {
      if (horiz) x += (Math.random() * 0.3 + 0.12) * w * (x > w * 0.6 ? -1 : 1);
      else y += (Math.random() * 0.3 + 0.12) * h * (y > h * 0.6 ? -1 : 1);
      pts.push([x, y]);
      horiz = !horiz;
    }
    let len = 0;
    const segs = [];
    for (let k = 1; k < pts.length; k += 1) {
      const l = Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
      segs.push(l); len += l;
    }
    routes.push({ pts, segs, len, speed: 60 + Math.random() * 110, t: Math.random() * len, hot: Math.random() < 0.55 });
  }
  return routes;
}

function at(route, d) {
  let rest = ((d % route.len) + route.len) % route.len;
  for (let k = 0; k < route.segs.length; k += 1) {
    if (rest <= route.segs[k]) {
      const a = route.pts[k]; const b = route.pts[k + 1];
      const f = route.segs[k] ? rest / route.segs[k] : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    rest -= route.segs[k];
  }
  return route.pts[route.pts.length - 1];
}

export function initHeroMotion() {
  const canvas = $('#hero-canvas');
  const stage = $('.hero__stage');
  if (!canvas || !stage || RM) return;
  const ctx = canvas.getContext('2d');
  let w = 0; let h = 0; let routes = []; let raf = 0; let last = 0; let visible = true;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    w = stage.clientWidth; h = stage.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    routes = makeRoutes(w, h);
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    routes.forEach((r) => {
      ctx.strokeStyle = `rgba(${INK}, 0.07)`;
      ctx.beginPath();
      r.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
      r.t += r.speed * dt;
      const tail = r.hot ? 90 : 50;
      for (let s = 0; s < 14; s += 1) {
        const [x, y] = at(r, r.t - (s / 14) * tail);
        const a = (1 - s / 14) * (r.hot ? 0.95 : 0.4);
        ctx.fillStyle = `rgba(${r.hot ? ACCENT : INK}, ${a})`;
        const size = (r.hot ? 2.6 : 1.8) * (1 - s / 22);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      ctx.fillStyle = `rgba(${INK}, 0.14)`;
      r.pts.slice(1, -1).forEach((p) => ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4));
    });
    raf = requestAnimationFrame(frame);
  }

  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; start(); }, { rootMargin: '10% 0px' }).observe(stage);
  document.addEventListener('visibilitychange', start);
  // The engine gives the stage its height after mount, so size from observation.
  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (stage.clientWidth && stage.clientHeight) { resize(); start(); } }, 120);
  }).observe(stage);
}
