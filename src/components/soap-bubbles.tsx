"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Splat = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  r: number;
};

type Bubble = {
  id: number;
  x: number;
  y: number;
  r: number;
  maxR: number;
  growRate: number;
  vx: number;
  targetVx: number;
  vy: number;
  phase: number;
  popping: boolean;
  popAge: number;
  splats: Splat[];
};

type WindStreak = {
  id: number;
  x: number;
  y: number;
  w: number;
  alpha: number;
  vx: number;
  curveDir: number;
};

type HitBubble = { id: number; x: number; y: number; r: number };

// ─── SVG Face ─────────────────────────────────────────────────────────────────
// ViewBox 0 0 140 120, rendered 74×63. Trumpet rotated -60° around (72,80).
// Bell center lands at SVG ≈ (123, -22) → used by getTrumpetTip().

const FACE   = "#f5c9a0";   // fair Scandinavian skin
const HAIR   = "#d4a843";   // golden blonde
const BROW   = "#7a4f20";   // warm brown brows
const EYE_W  = "rgba(255,255,255,0.92)";
const EYE_B  = "#4a88d0";   // Swedish blue iris
const PUP    = "#1a2848";
const BLUSH  = "rgba(228,110,100,0.22)";
const LIP    = "#d87070";
const GOLD   = "#d97706";
const GOLD_D = "#92400e";
const W_LEAF = "#3d8c30";
const W_PINK = "#f06880";
const W_YELL = "#f0c828";
const W_WHIT = "#fff5e8";

function FaceSvg({
  blowing,
  svgRef,
  onClick,
}: {
  blowing: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onClick: () => void;
}) {
  const ease = "0.28s cubic-bezier(0.4,0,0.2,1)";
  const spring = "0.32s cubic-bezier(0.34,1.56,0.64,1)";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 140 120"
      width={74}
      height={63}
      onClick={onClick}
      style={{ cursor: "pointer", userSelect: "none", overflow: "visible" }}
      aria-label="Click to blow soap bubbles"
      role="button"
    >
      {/* ── Hair (behind face, frames silhouette) ── */}
      <circle cx="60" cy="64" r="57" fill={HAIR} />

      {/* ── Cheeks (animated puffing, skin color) ── */}
      <ellipse
        cx="11"
        cy="76"
        rx="22"
        ry="19"
        fill={FACE}
        style={{
          transformOrigin: "11px 76px",
          transform: blowing ? "scale(1)" : "scale(0.12)",
          transition: `transform ${spring}`,
        }}
      />
      <ellipse
        cx="109"
        cy="76"
        rx="19"
        ry="17"
        fill={FACE}
        style={{
          transformOrigin: "109px 76px",
          transform: blowing ? "scale(1)" : "scale(0.12)",
          transition: `transform ${spring}`,
        }}
      />

      {/* ── Face ── */}
      <circle cx="60" cy="64" r="52" fill={FACE} />

      {/* ── Blush ── */}
      <ellipse cx="34" cy="72" rx="12" ry="8" fill={BLUSH} />
      <ellipse cx="86" cy="72" rx="12" ry="8" fill={BLUSH} />

      {/* ── Eyebrows (arched, feminine) ── */}
      <path
        d="M 30 34 Q 41 27 52 33"
        stroke={BROW}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{
          transformOrigin: "41px 31px",
          transform: blowing ? "rotate(-20deg)" : "rotate(0deg)",
          transition: `transform ${ease}`,
        }}
      />
      <path
        d="M 68 33 Q 79 27 90 34"
        stroke={BROW}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        style={{
          transformOrigin: "79px 31px",
          transform: blowing ? "rotate(20deg)" : "rotate(0deg)",
          transition: `transform ${ease}`,
        }}
      />

      {/* ── Eyes: whites → blue iris → pupil; squint when blowing ── */}
      <ellipse cx="41" cy="51" rx="8.5" ry="8.5" fill={EYE_W}
        style={{ transformOrigin: "41px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />
      <circle cx="41" cy="52" r="5" fill={EYE_B}
        style={{ transformOrigin: "41px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />
      <circle cx="41" cy="52" r="2.8" fill={PUP}
        style={{ transformOrigin: "41px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />

      <ellipse cx="79" cy="51" rx="8.5" ry="8.5" fill={EYE_W}
        style={{ transformOrigin: "79px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />
      <circle cx="79" cy="52" r="5" fill={EYE_B}
        style={{ transformOrigin: "79px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />
      <circle cx="79" cy="52" r="2.8" fill={PUP}
        style={{ transformOrigin: "79px 51px", transform: blowing ? "scaleY(0.15)" : "scaleY(1)", transition: `transform ${ease}` }} />

      {/* ── Nose ── */}
      <ellipse cx="60" cy="67" rx="4" ry="3" fill="rgba(180,90,70,0.18)" />

      {/* ── Mouth: smile at rest → pursed when blowing ── */}
      <path
        d="M 44 79 Q 54 88 64 79"
        stroke={LIP}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        style={{ opacity: blowing ? 0 : 0.9, transition: "opacity 0.2s ease" }}
      />
      <ellipse
        cx="54"
        cy="80"
        rx="7"
        ry="5"
        stroke={LIP}
        strokeWidth="2.5"
        fill={LIP}
        fillOpacity="0.25"
        style={{ opacity: blowing ? 0.85 : 0, transition: "opacity 0.2s ease" }}
      />

      {/* ── Flower wreath / blomsterkrans ── */}
      {/* Green arc across top of head */}
      <path d="M 15 30 Q 60 4 105 30" stroke={W_LEAF} strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* 7 flowers along arc: outer circle = petals, inner = center */}
      <circle cx="15"  cy="30" r="5.5" fill={W_PINK} /><circle cx="15"  cy="30" r="2.5" fill={W_YELL} />
      <circle cx="33"  cy="22" r="5.5" fill={W_WHIT} /><circle cx="33"  cy="22" r="2.5" fill={W_PINK} />
      <circle cx="51"  cy="18" r="5.5" fill={W_PINK} /><circle cx="51"  cy="18" r="2.5" fill={W_YELL} />
      <circle cx="60"  cy="17" r="5.5" fill={W_WHIT} /><circle cx="60"  cy="17" r="2.5" fill={W_PINK} />
      <circle cx="69"  cy="18" r="5.5" fill={W_PINK} /><circle cx="69"  cy="18" r="2.5" fill={W_YELL} />
      <circle cx="87"  cy="22" r="5.5" fill={W_WHIT} /><circle cx="87"  cy="22" r="2.5" fill={W_PINK} />
      <circle cx="105" cy="30" r="5.5" fill={W_PINK} /><circle cx="105" cy="30" r="2.5" fill={W_YELL} />

      {/* ── Trumpet — rotated group, mouthpiece at corner of mouth ── */}
      {/* Rotation: -60° around (72, 80). Bell ends up at SVG ≈ (122, -11). */}
      <g transform="rotate(-60, 72, 80)">
        {/* Mouthpiece cup */}
        <ellipse cx="68" cy="80" rx="5" ry="11" fill={GOLD_D} />
        <rect x="68" y="71" width="13" height="18" rx="3" fill={GOLD_D} />

        {/* Lead pipe */}
        <rect x="81" y="74" width="20" height="12" rx="2" fill={GOLD} />

        {/* Valve section body */}
        <rect x="101" y="70" width="46" height="20" rx="4" fill={GOLD} />
        {/* Valve pistons (protrude "down" in group = lower-right after rotation) */}
        <rect x="107" y="89" width="11" height="18" rx="4" fill={GOLD_D} />
        <rect x="121" y="89" width="11" height="18" rx="4" fill={GOLD_D} />
        <rect x="135" y="89" width="11" height="18" rx="4" fill={GOLD_D} />
        {/* Piston caps */}
        <rect x="107" y="103" width="11" height="6" rx="3" fill="#f0c000" />
        <rect x="121" y="103" width="11" height="6" rx="3" fill="#f0c000" />
        <rect x="135" y="103" width="11" height="6" rx="3" fill="#f0c000" />

        {/* Bell pipe — flares from valve section to bell */}
        <path
          d="M 147 72 C 156 70,163 65,173 57 L 173 103 C 163 95,156 90,147 88 Z"
          fill={GOLD}
        />
        {/* Bell rim — the wide circular opening */}
        <ellipse cx="174" cy="80" rx="7" ry="24" fill="#f0c000" />
        <ellipse cx="174" cy="80" rx="4" ry="18" fill={GOLD} opacity="0.55" />
      </g>
    </svg>
  );
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function drawBubble(
  ctx: CanvasRenderingContext2D,
  b: Bubble,
  t: number,
  alpha = 1,
) {
  const { x, y, r, phase } = b;
  const hue = ((t * 60 + phase * 360) % 360 + 360) % 360;

  ctx.save();
  ctx.globalAlpha = alpha;

  const radGrad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  radGrad.addColorStop(0, `hsla(${hue}, 70%, 80%, 0.05)`);
  radGrad.addColorStop(0.65, `hsla(${(hue + 120) % 360}, 80%, 70%, 0.12)`);
  radGrad.addColorStop(0.88, `hsla(${(hue + 240) % 360}, 90%, 65%, 0.32)`);
  radGrad.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.55)`);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = radGrad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const angle = t * 1.5 + phase * Math.PI * 2;
  const shimmerGrad = ctx.createLinearGradient(
    x + Math.cos(angle) * r, y + Math.sin(angle) * r,
    x - Math.cos(angle) * r, y - Math.sin(angle) * r,
  );
  shimmerGrad.addColorStop(0, `hsla(${hue}, 100%, 75%, 0)`);
  shimmerGrad.addColorStop(0.3, `hsla(${(hue + 60) % 360}, 100%, 75%, 0.22)`);
  shimmerGrad.addColorStop(0.6, `hsla(${(hue + 120) % 360}, 100%, 75%, 0.22)`);
  shimmerGrad.addColorStop(1, `hsla(${(hue + 180) % 360}, 100%, 75%, 0)`);
  ctx.fillStyle = shimmerGrad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  const hiGrad = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.35, 0,
    x - r * 0.3, y - r * 0.35, r * 0.45,
  );
  hiGrad.addColorStop(0, "rgba(255,255,255,0.75)");
  hiGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hiGrad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 60%, 88%, 0.45)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawSplat(ctx: CanvasRenderingContext2D, s: Splat) {
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fillStyle = s.color;
  ctx.fill();
  ctx.restore();
}

function drawWindStreak(ctx: CanvasRenderingContext2D, s: WindStreak) {
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.bezierCurveTo(
    s.x + s.w * 0.25, s.y + s.curveDir * -9,
    s.x + s.w * 0.75, s.y + s.curveDir * 7,
    s.x + s.w, s.y,
  );
  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

function spawnSplats(x: number, y: number, r: number): Splat[] {
  const count = 7 + Math.floor(Math.random() * 5);
  const splats: Splat[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 1.5 + Math.random() * (r * 0.12);
    const hue = Math.floor(Math.random() * 360);
    splats.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color: `hsla(${hue}, 90%, 70%, 1)`,
      alpha: 0.9,
      r: 2 + Math.random() * 3,
    });
  }
  return splats;
}

// Wind streaks start from the left viewport edge and sweep across at 40% screen height
function spawnWindStreaks(): WindStreak[] {
  const midY = window.innerHeight * 0.4;
  return Array.from({ length: 6 }, (_, i) => ({
    id: nextId++,
    x: 5 + Math.random() * 30,
    y: midY + (i - 2.5) * 22 + (Math.random() - 0.5) * 10,
    w: 260 + Math.random() * 120,
    alpha: 0.7 + Math.random() * 0.25,
    vx: 1 + Math.random() * 1.5,
    curveDir: i % 2 === 0 ? 1 : -1,
  }));
}

// ─── Main component ───────────────────────────────────────────────────────────

let nextId = 0;

export function SoapBubbles({ className = "fixed bottom-28 left-3 md:left-12 z-40 select-none" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const windRef = useRef<WindStreak[]>([]);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const frameRef = useRef(0);
  const navbarHeightRef = useRef(64);

  const [blowing, setBlowing] = useState(false);
  const [hitBubbles, setHitBubbles] = useState<HitBubble[]>([]);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) navbarHeightRef.current = header.getBoundingClientRect().bottom;
  }, []);

  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() / 1000;
      const navH = navbarHeightRef.current;

      // Wind
      windRef.current = windRef.current.filter((s) => s.alpha > 0);
      for (const s of windRef.current) {
        s.x += s.vx;
        s.alpha -= 0.004;
        if (s.alpha > 0) drawWindStreak(ctx, s);
      }

      // Bubbles
      const toRemove: number[] = [];
      for (const b of bubblesRef.current) {
        if (!b.popping) {
          b.vx += (b.targetVx - b.vx) * 0.06;
          b.y += b.vy;
          b.x += b.vx;
          b.r = Math.min(b.maxR, b.r + b.growRate);
          if (b.y - b.r <= navH) {
            b.popping = true;
            b.popAge = 0;
            b.splats = spawnSplats(b.x, b.y, b.r);
          }
        } else {
          b.popAge++;
          if (b.popAge <= 6) b.r += 2.5;
          const alpha = Math.max(0, 1 - b.popAge / 16);
          if (b.popAge >= 16) {
            toRemove.push(b.id);
          } else {
            drawBubble(ctx, b, t, alpha);
          }
          for (const s of b.splats) {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.28;
            s.alpha -= 0.055;
            if (s.alpha > 0) drawSplat(ctx, s);
          }
          b.splats = b.splats.filter((s) => s.alpha > 0);
          continue;
        }
        drawBubble(ctx, b, t);
      }

      if (toRemove.length > 0) {
        bubblesRef.current = bubblesRef.current.filter(
          (b) => !toRemove.includes(b.id),
        );
      }

      frameRef.current++;
      if (frameRef.current % 4 === 0) {
        setHitBubbles(
          bubblesRef.current
            .filter((b) => !b.popping)
            .map((b) => ({ id: b.id, x: b.x, y: b.y, r: b.r })),
        );
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Bell center after rotate(-60°, 72, 80): SVG ≈ (123, -22)
  const getTrumpetTip = useCallback((): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 120, y: 100 };
    const rect = svg.getBoundingClientRect();
    return {
      x: rect.left + 123 * (rect.width / 140),
      y: rect.top + (-22) * (rect.height / 120),
    };
  }, []);

  const spawnBubble = useCallback(() => {
    const { x, y } = getTrumpetTip();
    bubblesRef.current = [
      ...bubblesRef.current,
      {
        id: nextId++,
        x: x + (Math.random() - 0.5) * 5,
        y,
        r: 7,
        maxR: 55 + Math.random() * 40,
        growRate: 0.13 + Math.random() * 0.07,
        vx: 0,
        targetVx: 0,
        vy: -(1.3 + Math.random() * 0.4),
        phase: Math.random(),
        popping: false,
        popAge: 0,
        splats: [],
      },
    ];
  }, [getTrumpetTip]);

  const handleClick = useCallback(() => {
    if (blowing) return;
    setBlowing(true);

    const count = 3 + Math.floor(Math.random() * 6); // 3–8 bubbles
    spawnBubble();
    for (let i = 1; i < count; i++) {
      const delay = Math.round(200 + (i * 900) / count + (Math.random() - 0.5) * 140);
      setTimeout(() => spawnBubble(), delay);
    }
    setTimeout(() => {
      windRef.current = [...windRef.current, ...spawnWindStreaks()];
      for (const b of bubblesRef.current) {
        if (!b.popping) b.targetVx = 1.6 + Math.random() * 1.6;
      }
    }, 1800);
    const t4 = setTimeout(() => setBlowing(false), 1400);
    return () => clearTimeout(t4);
  }, [blowing, spawnBubble]);

  const popBubble = useCallback((id: number) => {
    const bubble = bubblesRef.current.find((b) => b.id === id);
    if (!bubble || bubble.popping) return;
    bubble.popping = true;
    bubble.popAge = 0;
    bubble.splats = spawnSplats(bubble.x, bubble.y, bubble.r);
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />

      <div className="fixed inset-0 z-41 pointer-events-none">
        {hitBubbles.map((b) => (
          <div
            key={b.id}
            onClick={() => popBubble(b.id)}
            style={{
              position: "absolute",
              left: b.x - b.r,
              top: b.y - b.r,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          />
        ))}
      </div>

      <div className={className}>
        <FaceSvg blowing={blowing} svgRef={svgRef} onClick={handleClick} />
      </div>
    </>
  );
}
