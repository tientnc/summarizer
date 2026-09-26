import type { Item } from "./types";

export async function summarizePublic(items: Item[], topic: string) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY is missing");

  const model = process.env.GOOGLE_AI_MODEL || "gemma-4-26b-a4b-it";
  const sources = items.map((item, index) =>
    `[${index + 1}] ${item.title}\n${item.text}`
  ).join("\n\n");
  const prompt = `Topic: ${topic}\n\nSummarize these public sources. Write one headline and three short bullets: facts, reactions, uncertainty. Use only supplied text.\n\n${sources}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
        }),
        signal: controller.signal
      }
    );
    if (!response.ok) throw new Error(`AI Studio returned ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();
    if (!text) throw new Error("AI Studio returned no summary");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

