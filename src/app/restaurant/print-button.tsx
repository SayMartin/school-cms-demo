"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/button";

export function PrintButton() {
  return (
    <Button
      variant="outline-green"
      onClick={() => window.print()}
      className="print:hidden"
      aria-label="Print menu"
      title="Print menu"
    >
      <Printer size={18} />
    </Button>
  );
}
