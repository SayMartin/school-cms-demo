interface SchoolRainbowProps {
  width?: number | string;
  height?: number | string;
  /** Animation duration in seconds. Default 4. */
  speed?: number;
  className?: string;
}

export function SchoolRainbow({
  width = 400,
  height = 220,
  speed = 4,
  className,
}: SchoolRainbowProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        WebkitMaskImage: "url('/images/stories-transparent.png')",
        maskImage: "url('/images/stories-transparent.png')",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        background:
          "linear-gradient(120deg, #ff0000, #ff8800, #ffff00, #00cc00, #0088ff, #8800ff, #ff0088, #ff0000)",
        backgroundSize: "200% 100%",
        animation: `brand-rainbow ${speed}s linear infinite`,
      }}
    />
  );
}
