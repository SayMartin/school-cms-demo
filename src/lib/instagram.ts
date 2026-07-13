export type InstagramPost = {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
};

export async function fetchInstagramPosts(
  token: string,
  count = 5,
): Promise<InstagramPost[]> {
  const url =
    `https://graph.instagram.com/me/media` +
    `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` +
    `&limit=${count}&access_token=${token}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: InstagramPost[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}
