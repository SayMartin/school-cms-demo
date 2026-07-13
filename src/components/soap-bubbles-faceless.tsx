"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Splat = {
  x: number; y: number;
  vx: number; vy: number;
  color: string; alpha: number; r: number;
};

type BubbleBg = {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  baseSpeed: number;
  rStart: number;
  rEnd: number;
  phase: number;
  bouncesTotal: number;
  bouncesDone: number;
  traveled: number;
  targetDist: number;
  popping: boolean;
  popAge: number;
  popX: number; popY: number; popR: number;
  splats: Splat[];
};

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  phase: number, t: number,
  alpha = 1,
) {
  const hue = ((t * 40 + phase * 360) % 360 + 360) % 360;
  ctx.save();
  ctx.globalAlpha = alpha;

  const radGrad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  radGrad.addColorStop(0,    `hsla(${hue}, 70%, 80%, 0.04)`);
  radGrad.addColorStop(0.65, `hsla(${(hue + 120) % 360}, 80%, 70%, 0.10)`);
  radGrad.addColorStop(0.88, `hsla(${(hue + 240) % 360}, 90%, 65%, 0.28)`);
  radGrad.addColorStop(1,    `hsla(${hue}, 80%, 60%, 0.50)`);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = radGrad;
  ctx.fill();

  // rotating shimmer band
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const angle = t * 0.9 + phase * Math.PI * 2;
  const shimmer = ctx.createLinearGradient(
    x + Math.cos(angle) * r, y + Math.sin(angle) * r,
    x - Math.cos(angle) * r, y - Math.sin(angle) * r,
  );
  shimmer.addColorStop(0,   `hsla(${hue}, 100%, 75%, 0)`);
  shimmer.addColorStop(0.3, `hsla(${(hue +  60) % 360}, 100%, 75%, 0.18)`);
  shimmer.addColorStop(0.6, `hsla(${(hue + 120) % 360}, 100%, 75%, 0.18)`);
  shimmer.addColorStop(1,   `hsla(${(hue + 180) % 360}, 100%, 75%, 0)`);
  ctx.fillStyle = shimmer;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  // top-left highlight
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const hi = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.35, 0,
    x - r * 0.3, y - r * 0.35, r * 0.45,
  );
  hi.addColorStop(0, "rgba(255,255,255,0.62)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  // rim
  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 60%, 88%, 0.38)`;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}

function spawnSplats(x: number, y: number, r: number): Splat[] {
  const count = 8 + Math.floor(Math.random() * 6);
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 0.6 + Math.random() * (r * 0.04);
    const hue   = Math.floor(Math.random() * 360);
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: `hsla(${hue}, 85%, 68%, 1)`,
      alpha: 0.8,
      r: 4 + Math.random() * 6,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

let nextId = 0;

// Spawn zone: side margins outside max-w-7xl content area (1280 px).
// On narrow viewports, fall back to a fixed edge strip.
const CONTENT_W = 1280;
const EDGE_FALLBACK = 80;

export function SoapBubblesBg({ className }: { className?: string } = {}) {
  const canvasRef      = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef     = useRef<BubbleBg[]>([]);
  const rafRef         = useRef<number | null>(null);
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staggerTimers  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const navHRef        = useRef(64);
  const pathname       = usePathname();
  const { reduced }    = useReducedMotion();
  const reducedRef     = useRef(reduced);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) navHRef.current = header.getBoundingClientRect().bottom;
  }, []);

  useEffect(() => {
    function onResize() {
      const c = canvasRef.current;
      if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const spawnBatch = useCallback(() => {
    const navH = navHRef.current;
    const W    = window.innerWidth;
    const H    = window.innerHeight;

    // One shared spawn point per batch — random position in side margin
    const marginW  = Math.max(EDGE_FALLBACK, (W - CONTENT_W) / 2);
    const fromLeft = Math.random() < 0.5;
    const sx = fromLeft
      ? Math.random() * marginW
      : W - Math.random() * marginW;
    const sy = navH + Math.random() * (H - navH);

    const avgDim    = (W + H) / 2;
    const n         = 3 + Math.floor(Math.random() * 6);
    const baseAngle = fromLeft ? 0 : Math.PI;

    // Stagger bubbles over ~2 seconds from the shared spawn point
    staggerTimers.current = Array.from({ length: n }, (_, i) => {
      const delay = i === 0 ? 0 : Math.random() * 2000;
      return setTimeout(() => {
        const rStart = 15 + Math.random() * 85;
        const rEnd   = 60 + Math.random() * 165;

        const dirAngle     = baseAngle + (Math.random() - 0.5) * (Math.PI / 2);
        const bouncesTotal = 1 + Math.floor(Math.random() * 5);
        const targetDist   = bouncesTotal * avgDim * 0.65;

        bubblesRef.current.push({
          id: nextId++,
          x: sx, y: sy,
          vx: Math.cos(dirAngle),
          vy: Math.sin(dirAngle),
          baseSpeed: 1.4 + Math.random() * 0.8,
          rStart, rEnd,
          phase: Math.random(),
          bouncesTotal, bouncesDone: 0,
          traveled: 0,
          targetDist,
          popping: false, popAge: 0,
          popX: 0, popY: 0, popR: 0,
          splats: [],
        });
      }, delay);
    });
  }, []);

  // One batch per page navigation — 1–4 s random delay. Skip when reduced motion is on.
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    staggerTimers.current.forEach(clearTimeout);
    staggerTimers.current = [];
    bubblesRef.current = [];

    if (reduced) return;

    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      spawnBatch();
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      staggerTimers.current.forEach(clearTimeout);
      staggerTimers.current = [];
    };
  }, [pathname, spawnBatch, reduced]);

  // Animation loop — no auto-respawn; next bubble waits for page navigation
  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (reducedRef.current) {
        bubblesRef.current = [];
        return;
      }
      const t    = Date.now() / 1000;
      const navH = navHRef.current;
      const W    = canvas.width;
      const H    = canvas.height;
      const dead: number[] = [];

      for (const b of bubblesRef.current) {
        if (b.popping) {
          b.popAge++;
          const fadeAlpha = Math.max(0, 1 - b.popAge / 24);
          if (fadeAlpha > 0) {
            drawBubble(ctx, b.popX, b.popY, b.popR + b.popAge * 3, b.phase, t, fadeAlpha * 0.5);
          }
          for (const s of b.splats) {
            s.x += s.vx; s.y += s.vy;
            s.alpha -= 0.022;
            if (s.alpha > 0) {
              ctx.save();
              ctx.globalAlpha = s.alpha;
              ctx.beginPath();
              ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
              ctx.fillStyle = s.color;
              ctx.fill();
              ctx.restore();
            }
          }
          b.splats = b.splats.filter(s => s.alpha > 0);
          if (b.popAge >= 24 && b.splats.length === 0) dead.push(b.id);
          continue;
        }

        const progress   = Math.min(1, b.traveled / b.targetDist);
        const r          = b.rStart + (b.rEnd - b.rStart) * progress;
        const frameSpeed = b.baseSpeed * (b.rStart / r);

        let nx = b.x + b.vx * frameSpeed;
        let ny = b.y + b.vy * frameSpeed;

        let hitX = false, hitY = false;
        if (nx - r <= 0)    { b.vx =  Math.abs(b.vx); nx = r;       hitX = true; }
        if (nx + r >= W)    { b.vx = -Math.abs(b.vx); nx = W - r;   hitX = true; }
        if (ny - r <= navH) { b.vy =  Math.abs(b.vy); ny = navH + r; hitY = true; }
        if (ny + r >= H)    { b.vy = -Math.abs(b.vy); ny = H - r;    hitY = true; }

        if (hitX || hitY) {
          b.bouncesDone++;
          if (b.bouncesDone >= b.bouncesTotal) {
            b.popX = nx; b.popY = ny; b.popR = r;
            b.popping = true; b.popAge = 0;
            b.splats = spawnSplats(nx, ny, r);
            continue;
          }
        }

        b.x = nx;
        b.y = ny;
        b.traveled += frameSpeed;
        drawBubble(ctx, b.x, b.y, r, b.phase, t);
      }

      if (dead.length > 0) {
        bubblesRef.current = bubblesRef.current.filter(b => !dead.includes(b.id));
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "fixed inset-0 z-0 pointer-events-none"}
    />
  );
}
