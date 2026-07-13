"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/button";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  label?: string;
  message?: string;
  confirmLabel?: string;
  triggerVariant?: "danger" | "warning" | "outline";
  locked?: boolean;
}

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Yes, delete",
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDeleteButton({
  onConfirm,
  loading = false,
  label = "Delete ›",
  message = "Are you sure you want to delete this? This cannot be undone.",
  confirmLabel,
  triggerVariant = "danger",
  locked = true,
}: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(false);
    await onConfirm();
  }

  const modal = confirming ? (
    <ConfirmModal
      message={message}
      onConfirm={handleConfirm}
      onCancel={() => setConfirming(false)}
      confirmLabel={confirmLabel}
    />
  ) : null;

  if (loading) {
    return (
      <Button variant="danger" size="sm" disabled>
        Deleting…
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        disabled={locked}
        title={locked ? "Disabled in the public demo" : undefined}
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
      {modal}
    </>
  );
}
