"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "forward" | "backward";
type Phase = "idle" | "exit" | "enter";
type AnimState = { phase: Phase; direction: Direction };

const EXIT_MS = 200;
const ENTER_MS = 340;

export function MenuDisplay({
  weekKey,
  children,
}: {
  weekKey: string;
  children: React.ReactNode;
}) {
  const [displayed, setDisplayed] = useState<React.ReactNode>(children);
  const [anim, setAnim] = useState<AnimState>({
    phase: "idle",
    direction: "forward",
  });
  const prevKey = useRef(weekKey);

  useEffect(() => {
    if (prevKey.current === weekKey) return;
    const direction: Direction =
      weekKey > prevKey.current ? "forward" : "backward";
    prevKey.current = weekKey;
    setAnim({ phase: "exit", direction });

    const t1 = setTimeout(() => {
      setDisplayed(children);
      setAnim((a) => ({ ...a, phase: "enter" }));
    }, EXIT_MS);

    const t2 = setTimeout(() => {
      setAnim((a) => ({ ...a, phase: "idle" }));
    }, EXIT_MS + ENTER_MS);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [weekKey, children]);

  let animClass = "";
  if (anim.phase === "exit") {
    animClass =
      anim.direction === "forward" ? "menu-exit-left" : "menu-exit-right";
  } else if (anim.phase === "enter") {
    animClass =
      anim.direction === "forward" ? "menu-enter-right" : "menu-enter-left";
  }

  return (
    <div style={{ overflow: "hidden" }}>
      <div className={animClass}>{displayed}</div>
    </div>
  );
}
