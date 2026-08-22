/**
 * JPDOC: oEmbed の author_url からチャンネルURLを安全に取り出す。
 */
/** YouTube channel URL from oEmbed author_url. Safe on server and client. */

export function sanitizeYoutubeChannelUrl(raw: unknown): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      host !== "youtube.com" &&
      host !== "m.youtube.com" &&
      host !== "youtu.be" &&
      host !== "music.youtube.com"
    ) {
      return "";
    }
    u.protocol = "https:";
    u.hash = "";
    return u.toString().slice(0, 240);
  } catch {
    return "";
  }
}

export async function resolveYoutubeChannel(
  videoId: string,
): Promise<{ url: string; name: string } | null> {
  const id = String(videoId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
  if (id.length < 6) return null;
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
    const res = await fetch(oembed, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      author_url?: string;
      author_name?: string;
    };
    const url = sanitizeYoutubeChannelUrl(data.author_url);
    if (!url) return null;
    return {
      url,
      name: String(data.author_name || "").trim().slice(0, 80),
    };
  } catch {
    return null;
  }
}
