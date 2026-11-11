export const fontFamilies = ['satoshi', 'clash-display', 'cabinet-grotesk', 'system'] as const;
export type FontFamily = typeof fontFamilies[number];
export const familyLabels: Record<FontFamily, string> = {
  system: 'System', satoshi: 'Satoshi', 'clash-display': 'Clash Display', 'cabinet-grotesk': 'Cabinet Grotesk',
};
export const fontNames: Record<Exclude<FontFamily, 'system'>, string> = {
  satoshi: 'TimeBoxed Satoshi', 'clash-display': 'TimeBoxed Clash Display', 'cabinet-grotesk': 'TimeBoxed Cabinet Grotesk',
};
export function parseFontFamily(value: unknown): FontFamily | null {
  return fontFamilies.find((family) => family === value) ?? null;
}
