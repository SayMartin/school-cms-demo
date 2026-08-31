"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { SchoolRainbow } from "@/components/school-rainbow";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RadialNavNode {
  id: string;
  /** Display label – use \u00AD for soft-hyphen hints */
  label: string;
  color: string;
  light?: string;
  dark?: string;
  textColor?: string;
  /**
   * If set, clicking this leaf node navigates to this URL via Next.js router.
   * Mutually exclusive with onSelect (href takes precedence if both are set).
   */
  href?: string;
  /**
   * If set, clicking the center circle of a sub-wheel where this node is the
   * parent navigates here (e.g. an overview page for this category).
   */
  overviewHref?: string;
  /**
   * If set (and no href), clicking this leaf fires the callback.
   * Bubbles up to the RadialNav onSelect prop when not overridden per-node.
   */
  onSelect?: (node: RadialNavNode) => void;
  children?: RadialNavNode[];
  /**
   * Optional: mount an entirely separate RadialNavNode[] tree when this node is
   * the active root (e.g. a sub-page gets its own wheel).
   */
  subTree?: RadialNavNode[];
}

export interface RadialNavProps {
  /** The root-level navigation items */
  tree: RadialNavNode[];
  /** Controlled open state — managed by the parent (PublicLayout) */
  isOpen: boolean;
  /** Called when RadialNav wants to close itself (leaf navigation, etc.) */
  onClose: () => void;
  /** Fallback onSelect for leaf nodes that have neither href nor their own onSelect */
  onSelect?: (node: RadialNavNode) => void;
  /** Accent color for the root center circle */
  defaultColor?: string;
}

// ─── Breadcrumb URL helper ────────────────────────────────────────────────────

export function findBreadcrumbsFromUrl(
  tree: RadialNavNode[],
  pathname: string,
): RadialNavNode[] {
  function findExact(nodes: RadialNavNode[], ancestors: RadialNavNode[]): RadialNavNode[] {
    for (const node of nodes) {
      const path = [...ancestors, node];
      if (node.href === pathname || node.overviewHref === pathname) return path;
      if (node.children?.length) {
        const found = findExact(node.children, path);
        if (found.length) return found;
      }
      if (node.subTree?.length) {
        const found = findExact(node.subTree, path);
        if (found.length) return found;
      }
    }
    return [];
  }

  const exact = findExact(tree, []);
  if (exact.length) return exact;

  // Prefix match for sub-pages not explicitly in tree (e.g. /summer-courses/[slug])
  let best: { path: RadialNavNode[]; len: number } = { path: [], len: 0 };
  function findPrefix(nodes: RadialNavNode[], ancestors: RadialNavNode[]) {
    for (const node of nodes) {
      const path = [...ancestors, node];
      const url = node.href ?? node.overviewHref;
      if (url && url !== "/" && pathname.startsWith(url + "/")) {
        if (url.length > best.len) best = { path, len: url.length };
      }
      if (node.children?.length) findPrefix(node.children, path);
      if (node.subTree?.length) findPrefix(node.subTree, path);
    }
  }
  findPrefix(tree, []);
  return best.path;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const START_ANGLE = -Math.PI / 2;

/** Per-depth rendering config */
const DEPTH_CFG = [
  {
    size: 360,
    shrunk: 240,
    vb: 260,
    cx: 130,
    cy: 130,
    rOut: 122,
    rIn: 46,
    fontSize: 10.5,
    centerR: 46,
  },
  {
    size: 360,
    shrunk: 240,
    vb: 260,
    cx: 130,
    cy: 130,
    rOut: 122,
    rIn: 46,
    fontSize: 10.5,
    centerR: 46,
  },
  {
    size: 330,
    shrunk: 210,
    vb: 170,
    cx: 85,
    cy: 85,
    rOut: 77,
    rIn: 26,
    fontSize: 7,
    centerR: 25,
  },
  {
    size: 270,
    shrunk: 180,
    vb: 140,
    cx: 70,
    cy: 70,
    rOut: 62,
    rIn: 21,
    fontSize: 6.5,
    centerR: 20,
  },
] as const;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function makeSlicePath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  index: number,
  total: number,
): string {
  const step = (2 * Math.PI) / total;
  const a0 = START_ANGLE + index * step;
  const a1 = a0 + step;
  const la = step > Math.PI ? 1 : 0;
  const o0 = polar(cx, cy, rOut, a0),
    o1 = polar(cx, cy, rOut, a1);
  const i0 = polar(cx, cy, rIn, a0),
    i1 = polar(cx, cy, rIn, a1);
  return [
    `M${i0.x.toFixed(2)} ${i0.y.toFixed(2)}`,
    `L${o0.x.toFixed(2)} ${o0.y.toFixed(2)}`,
    `A${rOut} ${rOut} 0 ${la} 1 ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `L${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A${rIn} ${rIn} 0 ${la} 0 ${i0.x.toFixed(2)} ${i0.y.toFixed(2)}Z`,
  ].join(" ");
}

/** Outer-rim midpoint of slice i (in SVG viewBox units) */
function rimPoint(
  cx: number,
  cy: number,
  rOut: number,
  index: number,
  total: number,
) {
  const step = (2 * Math.PI) / total;
  const a = START_ANGLE + (index + 0.5) * step;
  return { x: cx + rOut * Math.cos(a), y: cy + rOut * Math.sin(a) };
}

// ─── Sub-component: one wheel SVG ─────────────────────────────────────────────

interface TartaSvgProps {
  nodes: RadialNavNode[];
  depth: number;
  activeId: string | null;
  /** px size (may animate down from DEPTH_CFG[depth].size to .shrunk) */
  sizePx: number;
  centerColor: string;
  centerDark: string;
  filterId: string;
  onSlice: (node: RadialNavNode, index: number) => void;
  onCenter: () => void;
  /** false → pointer-events:none on the SVG (blocks all child clicks immediately) */
  interactive?: boolean;
}

const TartaSvg = React.memo(function TartaSvg({
  nodes,
  depth,
  activeId,
  sizePx,
  centerColor,
  centerDark,
  filterId,
  onSlice,
  onCenter,
  interactive = true,
}: TartaSvgProps) {
  const cfg = DEPTH_CFG[Math.min(depth, DEPTH_CFG.length - 1)];
  const { vb, cx, cy, rOut, rIn, fontSize, centerR } = cfg;
  const total = nodes.length;

  const slices = useMemo(
    () =>
      nodes.map((node, i) => {
        const step = (2 * Math.PI) / total;
        const a = START_ANGLE + (i + 0.5) * step;
        const lr = (rOut + rIn) / 2;
        const lx = cx + lr * Math.cos(a);
        const ly = cy + lr * Math.sin(a);
        const words = node.label.replace(/\u00AD/g, " ").split(" ");
        const lineH = fontSize * 1.25;
        return { node, i, lx, ly, words, lineH };
      }),
    [nodes, total, cx, cy, rOut, rIn, fontSize],
  );

  const hasActive = activeId !== null;

  return (
    <svg
      viewBox={`0 0 ${vb} ${vb}`}
      width={sizePx}
      height={sizePx}
      style={{
        overflow: "visible",
        display: "block",
        transition:
          "width 0.45s cubic-bezier(0.4,0,0.2,1), height 0.45s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id={filterId}>
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation={Math.max(1, 2.5 - depth * 0.4)}
            floodOpacity="0.14"
          />
        </filter>
      </defs>

      {/* Slices */}
      {slices.map(({ node, i, lx, ly, words, lineH }) => {
        const isActive = node.id === activeId;
        const isDimmed = hasActive && !isActive;
        return (
          <g key={node.id}>
            <path
              d={makeSlicePath(cx, cy, rOut, rIn, i, total)}
              fill={node.color}
              stroke="#fff"
              strokeWidth={isActive ? 4.5 : 2}
              style={{
                filter: `url(#${filterId})`,
                cursor: "pointer",
                opacity: isDimmed ? 0.35 : 1,
                transition: "opacity 0.25s, stroke-width 0.15s, filter 0.15s",
                pointerEvents: interactive ? "all" : "none",
                ...(isActive
                  ? {
                      filter: `url(#${filterId}) drop-shadow(0 0 7px rgba(255,255,255,0.85))`,
                      strokeWidth: 4.5,
                    }
                  : {}),
              }}
              onClick={() => onSlice(node, i)}
            />
            {/* Horizontal labels */}
            {words.map((w, wi) => (
              <text
                key={wi}
                x={lx}
                y={parseFloat(
                  (ly + (wi - (words.length - 1) / 2) * lineH).toFixed(4),
                )}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight="800"
                fill={node.textColor ?? node.dark ?? "#333"}
                letterSpacing="0.04em"
                style={{ pointerEvents: "none", textTransform: "uppercase" }}
              >
                {w}
              </text>
            ))}
          </g>
        );
      })}

      {/* Center circle */}
      {depth === 0 ? (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={centerR}
            fill="#F6C68F"
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
          />
          <foreignObject
            x={cx - centerR}
            y={cy - centerR}
            width={centerR * 2}
            height={centerR * 2}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
              <SchoolRainbow width="100%" height="100%" speed={6} />
            </div>
          </foreignObject>
          <circle
            cx={cx}
            cy={cy}
            r={centerR}
            fill="transparent"
            style={{ cursor: "pointer", pointerEvents: interactive ? "all" : "none" }}
            onClick={onCenter}
          />
        </>
      ) : (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={centerR}
            fill={centerColor || "#fff"}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1.5}
            style={{ cursor: "pointer", transition: "fill 0.2s", pointerEvents: interactive ? "all" : "none" }}
            onClick={onCenter}
          />
          <text
            x={cx}
            y={cy - fontSize * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="900"
            fill={centerDark}
            letterSpacing="0.05em"
            style={{ pointerEvents: "none", textTransform: "uppercase" }}
          >
            Visa
          </text>
          <text
            x={cx}
            y={cy + fontSize * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={fontSize}
            fontWeight="900"
            fill={centerDark}
            letterSpacing="0.05em"
            style={{ pointerEvents: "none", textTransform: "uppercase" }}
          >
            alla
          </text>
        </>
      )}
    </svg>
  );
});

// ─── Mini-wheel toggle button ─────────────────────────────────────────────────

interface MiniRadialNavProps {
  nodes: RadialNavNode[];
  activeId: string | null;
  isOpen: boolean;
  onClick: () => void;
  size?: number;
}

export function MiniRadialNav({ nodes, activeId, isOpen, onClick, size = 72 }: MiniRadialNavProps) {
  const vb = 32;
  const cx = 16,
    cy = 16,
    rOut = 14,
    rIn = 5;

  const total = nodes.length;
  return (
    <button
      onClick={onClick}
      title={isOpen ? "Close navigation" : "Open navigation"}
      style={{
        display: "block",
        lineHeight: 0,
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        width={size}
        height={size}
        style={{ display: "block" }}
      >
        {nodes.map((node, i) => (
          <path
            key={node.id}
            d={makeSlicePath(cx, cy, rOut, rIn, i, total)}
            fill={node.color}
            stroke={node.id === activeId ? "#F6C68F" : "#fff"}
            strokeWidth={node.id === activeId ? 0.8 : 0.4}
            style={{ opacity: node.id === activeId ? 1 : isOpen ? 0.85 : 1 }}
          />
        ))}
        <circle cx={cx} cy={cy} r={4.5} fill="#fff" />
        <foreignObject x={cx - 4.5} y={cy - 4.5} width={9} height={9}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <SchoolRainbow width="100%" height="100%" speed={4} />
          </div>
        </foreignObject>
      </svg>
    </button>
  );
}

// ─── Stack frame ─────────────────────────────────────────────────────────────

interface StackFrame {
  /** The parent node whose children this wheel shows */
  parentNode: RadialNavNode;
  nodes: RadialNavNode[];
  depth: number;
  activeChildId: string | null;
  /** Index of the active child in nodes[] */
  activeChildIndex: number | null;
  /** Whether this wheel is shrunk (a child is active) */
  shrunk: boolean;
  /** transform-origin for the child wheel born from this one */
  childOrigin: { x: number; y: number } | null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RadialNav({
  tree,
  isOpen,
  onClose,
  onSelect,
  defaultColor = "#1f5a78",
}: RadialNavProps) {
  const router = useRouter();

  const rootFrame = useCallback((): StackFrame => ({
    parentNode: { id: "__root__", label: "", color: defaultColor, children: tree },
    nodes: tree,
    depth: 0,
    activeChildId: null,
    activeChildIndex: null,
    shrunk: false,
    childOrigin: null,
  }), [tree, defaultColor]);

  // Stack of wheels — pre-populated with root frame
  const [stack, setStack] = useState<StackFrame[]>(() => [rootFrame()]);

  // Animated child wheel: null = not visible, 'entering' | 'visible' | 'leaving'
  type AnimState = "entering" | "visible" | "leaving";
  const [childAnims, setChildAnims] = useState<AnimState[]>([]);

  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset stack when panel closes (after fade-out delay)
  useEffect(() => {
    if (!isOpen) {
      resetTimer.current = setTimeout(() => {
        setStack([rootFrame()]);
        setChildAnims([]);
        resetTimer.current = null;
      }, 350);
    } else {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
    }
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [isOpen, rootFrame]);

  // ── Slice click ─────────────────────────────────────────────────────────────
  const handleSliceClick = useCallback(
    (frameIndex: number, node: RadialNavNode, sliceIndex: number) => {
      const frame = stack[frameIndex];

      // If a sub-wheel is already open from this frame, close it on any click
      if (stack.length > frameIndex + 1) {
        setStack((prev) => {
          const next = prev.slice(0, frameIndex + 1);
          next[frameIndex] = {
            ...next[frameIndex],
            activeChildId: null,
            activeChildIndex: null,
            shrunk: false,
            childOrigin: null,
          };
          return next;
        });
        setChildAnims((prev) => prev.slice(0, frameIndex));
        return;
      }

      // Toggle off
      if (frame.activeChildId === node.id) {
        // Pop everything above this frame and deactivate
        setStack((prev) => {
          const next = prev.slice(0, frameIndex + 1);
          next[frameIndex] = {
            ...next[frameIndex],
            activeChildId: null,
            activeChildIndex: null,
            shrunk: false,
            childOrigin: null,
          };
          return next;
        });
        setChildAnims((prev) => prev.slice(0, frameIndex));
        return;
      }

      // Leaf node handling
      const hasChildren =
        (node.children?.length ?? 0) > 0 || (node.subTree?.length ?? 0) > 0;
      if (!hasChildren) {
        if (node.href) {
          setStack((prev) => {
            const next = prev.slice(0, frameIndex + 1);
            next[frameIndex] = {
              ...next[frameIndex],
              activeChildId: node.id,
              activeChildIndex: sliceIndex,
            };
            return next;
          });
          setChildAnims((prev) => prev.slice(0, frameIndex));
          router.push(node.href);
          return;
        }
        const handler = node.onSelect ?? onSelect;
        if (handler) handler(node);
        // Update active in this frame, pop deeper
        setStack((prev) => {
          const next = prev.slice(0, frameIndex + 1);
          next[frameIndex] = {
            ...next[frameIndex],
            activeChildId: node.id,
            activeChildIndex: sliceIndex,
            shrunk: false,
          };
          return next;
        });
        setChildAnims((prev) => prev.slice(0, frameIndex));
        return;
      }

      // Has children with a hub page → navigate directly, skip sub-wheel
      if (node.overviewHref) {
        setStack((prev) => {
          const next = prev.slice(0, frameIndex + 1);
          next[frameIndex] = {
            ...next[frameIndex],
            activeChildId: node.id,
            activeChildIndex: sliceIndex,
          };
          return next;
        });
        setChildAnims((prev) => prev.slice(0, frameIndex));
        router.push(node.overviewHref);
        return;
      }

      // Has children but already at sub-wheel depth → navigate to href if available
      if (frame.depth > 0) {
        if (node.href) {
          setStack((prev) => {
            const next = prev.slice(0, frameIndex + 1);
            next[frameIndex] = {
              ...next[frameIndex],
              activeChildId: node.id,
              activeChildIndex: sliceIndex,
            };
            return next;
          });
          setChildAnims((prev) => prev.slice(0, frameIndex));
          router.push(node.href);
        }
        return;
      }

      // Has children at root depth → spawn sub-wheel
      const cfg = DEPTH_CFG[Math.min(frame.depth, DEPTH_CFG.length - 1)];
      const rim = rimPoint(
        cfg.cx,
        cfg.cy,
        cfg.rOut,
        sliceIndex,
        frame.nodes.length,
      );
      // rim is in SVG viewBox units; convert to rendered px
      const scale = cfg.size / cfg.vb;
      const childOrigin = { x: rim.x * scale, y: rim.y * scale };

      const childNodes = node.subTree ?? node.children ?? [];

      const newFrame: StackFrame = {
        parentNode: node,
        nodes: childNodes,
        depth: frame.depth + 1,
        activeChildId: null,
        activeChildIndex: null,
        shrunk: false,
        childOrigin: null,
      };

      setStack((prev) => {
        const next = prev.slice(0, frameIndex + 1);
        next[frameIndex] = {
          ...next[frameIndex],
          activeChildId: node.id,
          activeChildIndex: sliceIndex,
          shrunk: true,
          childOrigin,
        };
        return [...next, newFrame];
      });
      setChildAnims((prev) => {
        const next = prev.slice(0, frameIndex + 1);
        return [...next, "entering" as AnimState];
      });

      // entering → visible after one frame
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setChildAnims((prev) => {
            const next = [...prev];
            next[frameIndex] = "visible";
            return next;
          });
        }),
      );
    },
    [stack, router, onSelect],
  );

  // ── Center click ───────────────────────────────────────────────────────────
  const handleCenter = useCallback(
    (frameIndex: number) => {
      if (frameIndex === 0) {
        router.push("/participant-stories");
        return;
      }
      // Navigate to overview page if defined on the parent node
      const overviewHref = stack[frameIndex].parentNode.overviewHref;
      if (overviewHref) {
        router.push(overviewHref);
        return;
      }
      // Otherwise pop this frame
      setStack((prev) => {
        const next = prev.slice(0, frameIndex);
        next[frameIndex - 1] = {
          ...next[frameIndex - 1],
          activeChildId: null,
          activeChildIndex: null,
          shrunk: false,
          childOrigin: null,
        };
        return next;
      });
      setChildAnims((prev) => prev.slice(0, frameIndex - 1));
    },
    [stack, router],
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Backdrop — closes wheel when clicking outside ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-39"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* ── Wheel — floating, top-right corner, does not affect page layout ── */}
      <div
        className="fixed z-40 flex items-start gap-3"
        style={{
          top: "100px",
          right: "14px",
          transformOrigin: "top right",
          transform: `scale(${isOpen ? 1 : 0.9})`,
          opacity: isOpen ? 0.9 : 0,
          visibility: isOpen ? "visible" : "hidden",
          transition: isOpen
            ? "opacity 0.8s ease-out, transform 0.9s ease-out, visibility 0s linear 0s"
            : "opacity 0.4s ease-out, transform 0.45s ease-out, visibility 0s linear 0.4s",
          willChange: "opacity, transform",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <div className="flex items-start gap-3">
          {stack.map((frame, fi) => {
            const cfg = DEPTH_CFG[Math.min(frame.depth, DEPTH_CFG.length - 1)];
            const hasDeeperFrame = fi < stack.length - 1;
            const currentSize = hasDeeperFrame
              ? fi === 0 ? Math.round(cfg.size / 3) : cfg.shrunk
              : cfg.size;

            const animState: AnimState | undefined =
              fi > 0 ? childAnims[fi - 1] : "visible";
            const parentFrame = fi > 0 ? stack[fi - 1] : null;
            const origin = parentFrame?.childOrigin;
            const transformOrigin = origin
              ? `${origin.x}px ${origin.y}px`
              : "center center";
            const isEntering = animState === "entering";
            const isVisible = animState === "visible" || fi === 0;

            return (
              <div
                key={frame.parentNode.id + "-" + fi}
                className="flex flex-col items-center flex-shrink-0"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "scale(1)" : "scale(0)",
                  transformOrigin,
                  transition: isEntering
                    ? "none"
                    : "opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.34,1.35,0.64,1)",
                  pointerEvents: "none",
                }}
              >
                <TartaSvg
                  nodes={frame.nodes}
                  depth={frame.depth}
                  activeId={frame.activeChildId}
                  sizePx={currentSize}
                  centerColor={
                    fi === 0 ? "#fff" : (frame.parentNode.light ?? "#fff")
                  }
                  centerDark={
                    fi === 0 ? defaultColor : (frame.parentNode.dark ?? "#333")
                  }
                  filterId={`sf-${fi}`}
                  onSlice={(node, idx) => handleSliceClick(fi, node, idx)}
                  onCenter={() => handleCenter(fi)}
                  interactive={isOpen}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
