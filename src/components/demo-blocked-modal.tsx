"use client";

import { createPortal } from "react-dom";
import { Button } from "@/components/button";

// Shown when a public form is deliberately inert in the portfolio demo. The
// matching API route is blocked by demoLockCheck() regardless of this dialog —
// this is the explanation, not the protection.
export function DemoBlockedModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">{children}</div>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
