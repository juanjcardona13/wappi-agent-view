export function wordCount(text: string): number {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return 0;
  return trimmed.split(' ').length;
}

export function clipWords(text: string, max: number): string {
  return text
    .replace(/[«»“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, max)
    .join(' ');
}
