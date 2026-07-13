const COLORS = [
  { color: "#ffffff", label: "White" },
  { color: "#111827", label: "Dark (gray-900)" },
] as const;

type Props = {
  color: string | undefined;
  onColorChange: (color: string) => void;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  enabled?: boolean;
};

export function HeadingStyleEditor({ color, onColorChange, visible, onVisibleChange, enabled = false }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {COLORS.map(({ color: c, label }) => {
          const isActive = (color ?? "#111827") === c;
          return (
            <button
              key={c}
              type="button"
              title={label}
              onClick={() => onColorChange(c)}
              className={`h-5 w-8 rounded border-2 transition-all ${
                isActive
                  ? "border-brand-green-dark ring-2 ring-brand-green-dark ring-offset-1"
                  : "border-gray-300 hover:border-gray-500"
              }`}
              style={{ backgroundColor: c }}
            />
          );
        })}
      </div>
      <label className={`flex shrink-0 items-center gap-1.5 ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
        <input
          type="checkbox"
          checked={enabled ? visible : true}
          disabled={!enabled}
          onChange={(e) => { if (enabled) onVisibleChange(e.target.checked); }}
          className="accent-brand-green-dark"
        />
        <span className="text-sm text-gray-700 whitespace-nowrap">Show the heading on the public page?</span>
      </label>
    </div>
  );
}
