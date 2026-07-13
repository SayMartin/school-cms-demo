"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  onToken,
  resetKey = 0,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    function mount() {
      if (!containerRef.current) return;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }

    if (typeof window !== "undefined" && window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector("script[data-cf-turnstile]");
      if (!existing) {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.dataset.cfTurnstile = "1";
        script.onload = mount;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", mount);
      }
    }

    return () => {
      if (widgetId.current && typeof window !== "undefined" && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, resetKey, onToken]);

  return <div ref={containerRef} />;
}
