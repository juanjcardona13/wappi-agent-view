export function plain(text: string): string {
  return text.replaceAll('**', '').replaceAll('`', '');
}

export function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}
