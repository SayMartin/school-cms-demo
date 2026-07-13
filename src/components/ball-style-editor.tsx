import Image from "next/image";
import { mediaUrl, PLACEHOLDER_BALL_IMAGE_KEY } from "@/lib/r2/client";

type Props = {
  value: "color" | "image";
  onChange: (value: "color" | "image") => void;
  colorHex?: string;
  imageSrc?: string;
};

export function BallStyleEditor({
  value,
  onChange,
  colorHex = "#cbcbff",
  imageSrc,
}: Props) {
  const effectiveImageSrc = imageSrc ?? mediaUrl(PLACEHOLDER_BALL_IMAGE_KEY);

  return (
    <div className="flex items-end gap-8">
      <BallOption
        label="Color ball"
        isSelected={value === "color"}
        onClick={() => onChange("color")}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colorHex }}
        />
      </BallOption>

      <BallOption
        label="Image ball"
        isSelected={value === "image"}
        onClick={() => onChange("image")}
      >
        <Image
          src={effectiveImageSrc}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
        <div
          className="absolute left-0 right-0"
          style={{ top: "62%", height: "22%", backgroundColor: colorHex }}
        />
      </BallOption>
    </div>
  );
}

function BallOption({
  label,
  isSelected,
  onClick,
  children,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2.0"
    >
      <div
        className={`relative h-40 w-40 rounded-full overflow-hidden border-2 transition-all ${
          isSelected
            ? "border-brand-green-dark ring-2 ring-brand-green-dark ring-offset-2"
            : "border-gray-200 hover:border-gray-400"
        }`}
      >
        {children}
      </div>
      <span
        className={`text-sm font-medium transition-colors ${isSelected ? "text-brand-green-dark" : "text-gray-600"}`}
      >
        {label}
      </span>
    </button>
  );
}
