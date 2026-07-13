import { mediaUrl } from "@/lib/r2/client";

export function HeroVideo() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover object-center"
    >
      <source src={mediaUrl("videos/hero_original_2.mp4")} type="video/mp4" />
    </video>
  );
}
