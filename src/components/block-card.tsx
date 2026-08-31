"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type Props = {
  label: string;
  summary?: string;
  summaryColor?: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function BlockCard({
  label,
  summary,
  summaryColor,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex gap-2">
      {/* Move buttons */}
      <div className="flex flex-col gap-0.5 pt-2">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded p-1 text-gray-600 hover:text-gray-700 disabled:opacity-25 transition-colors"
          title="Flytta upp"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded p-1 text-gray-600 hover:text-gray-700 disabled:opacity-25 transition-colors"
          title="Flytta ned"
        >
          ▼
        </button>
      </div>

      {/* Card */}
      <div className="flex-1 overflow-hidden rounded-lg border border-gray-200">
        {/* Header — toggle */}
        <div className="flex items-center gap-2 bg-brand-pink-dark px-3 py-2 text-white select-none">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex flex-1 items-center gap-2 text-left min-w-0"
          >
            <svg
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-in-out ${open ? "rotate-90" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="rounded bg-white/90 px-2 py-0.5 text-sm font-medium text-gray-800">
              {label}
            </span>
            {summary && (
              <span
                className="ml-4 truncate min-w-0"
                style={summaryColor ? { color: summaryColor } : undefined}
              >
                {summary}
              </span>
            )}
          </button>
          {onDelete && <ConfirmDeleteButton onConfirm={onDelete} locked={false} />}
        </div>

        {/* Collapsible content */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 bg-white p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
