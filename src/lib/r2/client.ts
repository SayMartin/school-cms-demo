import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getStorage(): R2Bucket | null {
  try {
    const { env } = getCloudflareContext();
    return (env.STORAGE as R2Bucket) ?? null;
  } catch {
    return null;
  }
}

export function mediaUrl(key: string): string {
  return `/api/media/${key}`;
}

export const PLACEHOLDER_BALL_IMAGE_KEY = "defaults/placeholder-ball.jpg";
export const DISH_FALLBACK_IMAGE_KEY = "defaults/dish-fallback.png";
