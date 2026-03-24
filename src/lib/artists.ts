export function splitArtists(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function artistMatches(trackArtist: string, targetArtist: string): boolean {
  const target = targetArtist.trim().toLowerCase();
  if (!target) return false;
  return splitArtists(trackArtist).some((a) => a.toLowerCase() === target);
}
