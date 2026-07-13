interface SchoolDiscoProps {
  width?: number | string;
  height?: number | string;
  /** Animation duration in seconds. Default 4. */
  speed?: number;
  className?: string;
}

export function SchoolDisco({
  width = 400,
  height = 220,
  speed = 4,
  className,
}: SchoolDiscoProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        WebkitMaskImage: "url('/images/stories-transparent.png')",
        maskImage: "url('/images/stories-transparent.png')",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    >
      {/* Dark base */}
      <div style={{ position: "absolute", inset: 0, background: "#111" }} />

      {/* Silver mirror tiles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(135deg, #e8e8e8 25%, #888 25%, #888 50%, #c8c8c8 50%, #c8c8c8 75%, #a0a0a0 75%)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Tile grout lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 8px)",
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 8px)",
          ].join(","),
          backgroundSize: "8px 8px",
        }}
      />

      {/* Rotating colour beams — clockwise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "conic-gradient(from 0deg, transparent 0%, rgba(255,50,50,0.95) 5%, transparent 10%, rgba(50,50,255,0.95) 35%, transparent 42%, rgba(50,220,50,0.9) 68%, transparent 74%, rgba(255,210,40,0.95) 93%, transparent 100%)",
          animation: `disco-spin ${speed * 0.6}s linear infinite`,
          mixBlendMode: "screen",
        }}
      />

      {/* Rotating colour beams — counter-clockwise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "conic-gradient(from 60deg, transparent 0%, rgba(255,50,220,0.9) 7%, transparent 14%, rgba(50,230,230,0.85) 54%, transparent 62%)",
          animation: `disco-spin ${speed * 0.9}s linear infinite reverse`,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
