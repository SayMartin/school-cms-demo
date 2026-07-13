"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.style.overflow === "hidden");
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label="Scrolla till toppen"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`print:hidden fixed bottom-40 right-3 md:right-12 z-50 flex h-12 w-12 md:h-18 md:w-18 items-center justify-center rounded-full border-2 border-brand-green-dark bg-brand-green shadow-lg transition-all duration-200 hover:bg-brand-green-dark hover:text-white ${
        visible && !modalOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
    </button>
  );
}
