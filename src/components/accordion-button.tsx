"use client";

import { useState } from "react";

type Props = {
  label: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  triggerClassName?: string;
  children: React.ReactNode;
};

export function AccordionButton({
  label,
  closeLabel,
  defaultOpen = false,
  triggerClassName = "text-base hover:text-gray-700 underline underline-offset-2 transition-colors",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="w-full">
      <button onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {open ? (closeLabel ?? label) : label}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
