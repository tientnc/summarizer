import { NextResponse } from "next/server";
import { summarizePublic } from "@/lib/ai";
import { fetchNews, fetchYoutube } from "@/lib/sources";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = body.source;
    if (!["news", "youtube", "cross"].includes(source)) {
      return NextResponse.json({ error: "Email is blocked from external AI" }, { status: 400 });
    }
    const query = String(body.query || "").trim().slice(0, 200);
    const limit = Math.min(Math.max(Number(body.limit) || 3, 1), 5);
    if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

    const news = source === "youtube" ? [] : await fetchNews(query, limit);
    const videos = source === "news" ? [] : await fetchYoutube(query, limit);
    const items = [...news, ...videos];
    if (!items.length) return NextResponse.json({ error: "No sources found" }, { status: 404 });
    const summary = await summarizePublic(items, query);
    return NextResponse.json({ summary, items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
