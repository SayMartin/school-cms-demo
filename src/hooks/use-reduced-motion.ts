"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "school-cms-reduced-motion";
const CHANGE_EVENT = "school-cms-reduced-motion-change";

export function useReducedMotion() {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const handleChange = (e: Event) => {
      setReduced((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);

  const toggle = useCallback(() => {
    setReduced((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(
        new CustomEvent<boolean>(CHANGE_EVENT, { detail: next }),
      );
      return next;
    });
  }, []);

  return { reduced, toggle };
}
