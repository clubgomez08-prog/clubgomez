const COLORES = [
  "#B8E351",
  "#CCFF00",
  "#FFD84A",
  "#FFFFFF",
  "#FF6B6B",
  "#FF8BD2",
  "#6EE7F9",
];

/**
 * Confeti a pantalla completa. El canvas se destruye solo.
 */
export function lanzarConfeti() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const pieces = [];
  const count = w < 600 ? 90 : 140;
  const cx = w / 2;
  const cy = h * 0.22;

  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 6 + Math.random() * 11;
    pieces.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 5 + Math.random() * 7,
      h: 7 + Math.random() * 9,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORES[i % COLORES.length],
      life: 1,
    });
  }

  let raf = 0;
  const started = performance.now();

  function tick(now) {
    const t = (now - started) / 1000;
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of pieces) {
      p.vy += 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.992;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - t / 2.1);
      if (p.life <= 0) continue;
      alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive && t < 2.3) {
      raf = window.requestAnimationFrame(tick);
    } else {
      window.cancelAnimationFrame(raf);
      canvas.remove();
    }
  }

  raf = window.requestAnimationFrame(tick);
}
