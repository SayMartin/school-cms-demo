"use client";

import { Button } from "@/components/button";

type Props = {
  isDirty: boolean;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
  children?: React.ReactNode;
};

export function StudioSaveBar({
  isDirty,
  saving,
  error,
  onSave,
  onDiscard,
  children,
}: Props) {
  const isSaved = !error && !saving && !isDirty;

  const bgClass = error
    ? "border-b border-red-200 bg-red-50"
    : saving || isDirty
      ? "border-b border-amber-200 bg-amber-50"
      : "border-b border-green-200 bg-green-50";

  return (
    <div className="sticky top-25.25 z-30 -mx-4">
      <div className={`${bgClass} px-4 py-2`}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: status text */}
          {error ? (
            <span className="text-red-700 truncate">{error}</span>
          ) : saving ? (
            <span className="text-amber-800">Saving…</span>
          ) : isDirty ? (
            <span className="flex items-center gap-2 text-amber-800">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-2 text-green-700">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              All changes saved
            </span>
          )}

          {/* Right: buttons — always rendered to keep height stable */}
          <div className={`flex items-center gap-2 ${isSaved ? "invisible" : ""}`}>
            {error ? (
              <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={saving}>
                Try again
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDiscard}
                  disabled={saving}
                  className={saving ? "invisible" : ""}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
