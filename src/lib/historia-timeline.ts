import type { SlideshowImage } from "@/lib/blocks";

export type TimelineEntry = {
  id: string;
  year: number;
  text: string;
  images: SlideshowImage[];
};

export function parseTimeline(raw: string): TimelineEntry[] {
  try {
    return JSON.parse(raw) as TimelineEntry[];
  } catch {
    return [];
  }
}
