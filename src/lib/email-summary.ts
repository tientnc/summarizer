export function summarizeEmailLocally(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(value => value.trim()) || [];
  if (sentences.length <= 2) return sentences.join(" ");
  const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  const stop = new Set(["the", "and", "for", "that", "this", "with", "from", "your", "you", "are", "was", "have", "has"]);
  const frequency = new Map<string, number>();
  words.filter(word => !stop.has(word)).forEach(word => frequency.set(word, (frequency.get(word) || 0) + 1));
  return sentences.map((sentence, index) => ({ sentence, index, score: (sentence.toLowerCase().match(/[a-z]{3,}/g) || []).reduce((sum, word) => sum + (frequency.get(word) || 0), 0) }))
    .sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.index - b.index).map(item => item.sentence).join(" ");
}
