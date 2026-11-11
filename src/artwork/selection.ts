// Selection stays independent of rendering and accepts only registered entries.
// Future preferences/rotation can supply an ID without changing the dashboard.
export function selectArtwork<T extends { id: string }>(
  catalog: readonly T[], selectedId: unknown, fallbackId: string,
): T {
  const fallback = catalog.find((item) => item.id === fallbackId);
  if (!fallback) throw new Error('The artwork catalog must contain its configured default.');
  return catalog.find((item) => item.id === selectedId) ?? fallback;
}
