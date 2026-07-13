"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Utensils } from "lucide-react";

export function MenuFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/restaurant"
      aria-label="Veckomenyn"
      className={`print:hidden fixed left-3 md:left-12 top-1/2 z-50 flex h-12 w-12 md:h-18 md:w-18 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-green-dark bg-brand-green shadow-lg transition-all duration-200 hover:bg-brand-green-dark hover:text-white ${
        visible
          ? "opacity-100 translate-y-[-50%]"
          : "opacity-0 translate-y-[calc(-50%+1rem)] pointer-events-none"
      }`}
    >
      <Utensils className="h-5 w-5 md:h-6 md:w-6" />
    </Link>
  );
}
