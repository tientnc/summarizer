import type { Item } from "./types";

const clean = (value: string) => value
  .replace(/<!\[CDATA\[|\]\]>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/\s+/g, " ")
  .trim();

const tag = (xml: string, name: string) =>
  clean(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "");

export async function fetchNews(query: string, limit: number): Promise<Item[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error("News search failed");
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit).map(match => ({
    title: tag(match[1], "title"),
    text: tag(match[1], "description"),
    source: "news",
    url: tag(match[1], "link")
  }));
}

async function caption(videoId: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=en&fmt=json3`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) return "";
    const data = await response.json();
    return (data.events || []).flatMap((event: { segs?: { utf8?: string }[] }) =>
      event.segs?.map(segment => segment.utf8 || "") || []
    ).join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

export async function fetchYoutube(query: string, limit: number): Promise<Item[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is missing");
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.search = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(limit),
    q: query,
    key
  }).toString();
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`YouTube returned ${response.status}`);
  const data = await response.json();
  return Promise.all((data.items || []).map(async (item: {
    id: { videoId: string };
    snippet: { title: string; description: string };
  }) => {
    const transcript = await caption(item.id.videoId);
    return {
      title: clean(item.snippet.title),
      text: transcript || item.snippet.description,
      source: "youtube" as const,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    };
  }));
}
