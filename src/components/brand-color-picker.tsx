"use client";

import { BRAND_COLORS } from "@/lib/brand-colors";

type Props = {
  value: string;
  onChange: (token: string) => void;
  label?: string;
  defaultToken?: string;
};

export function BrandColorPicker({
  value,
  onChange,
  label = "Choose color",
  defaultToken,
}: Props) {
  const isDefault = defaultToken !== undefined && value === defaultToken;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span>
          {label}
          {defaultToken && (
            <span className="ml-1">
              (optional — default:{" "}
              {BRAND_COLORS.find((c) => c.token === defaultToken)?.label ??
                defaultToken}
              )
            </span>
          )}
        </span>
        {defaultToken && !isDefault && (
          <button
            type="button"
            onClick={() => onChange(defaultToken)}
            className="text-gray-600 hover:text-gray-600 underline underline-offset-2 shrink-0"
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {BRAND_COLORS.map((c) => (
          <button
            key={c.token}
            type="button"
            title={c.token === defaultToken ? `${c.label} (standard)` : c.label}
            onClick={() => onChange(c.token)}
            className="h-10 w-10 rounded-full border-4 transition-all hover:scale-110"
            style={{
              backgroundColor: c.hex,
              borderColor: value === c.token ? "#4aad4a" : "transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}
