export const colors = {
  background: '#151821',
  surface: '#202530',
  surfaceSecondary: '#29303C',
  sage: '#A8BFA5',
  lavender: '#C5B4DD',
  dustyBlue: '#A9C5D8',
  peach: '#E8BBA9',
  buttercream: '#E8DDAF',
  text: '#EEECE8',
  muted: '#A4A7B0',
  border: '#3C4350',
  artworkInk: 'rgba(0, 0, 0, 0.92)',
};

export const utilityAccents = {
  timer: colors.sage,
  clock: colors.lavender,
  calculator: colors.dustyBlue,
  countdown: colors.peach,
  worldClocks: colors.buttercream,
};

export type UtilityAccent = keyof typeof utilityAccents;

export const motion = {
  focusDuration: 160,
  digitDuration: 180,
  screenDuration: 220,
  digitOpacity: 0.72,
  artworkDuration: 450,
};

export const dashboardTokens = {
  gap: 20,
  cardRadius: 18,
  cardHeight: 160,
  iconSize: 64,
  focusWidth: 2,
  clockSize: 80,
  titleSize: 22,
};

export const clockTokens = {
  standardSize: 128,
  ambientSize: 168,
  weekdaySize: 24,
  dateSize: 22,
};

export const artDashboardTokens = {
  safeMargin: '6%' as const,
  iconSize: 40,
  controlSize: 48,
  controlGap: 8,
  labelWidth: 164,
  labelGap: 16,
  labelSize: 20,
  clockSize: 54,
  dateSize: 18,
};

export const navigationTokens = {
  safeMargin: '6%' as const,
  idleMs: 10_000,
  controlSize: 48,
  compactIconSize: 30,
  focusedIconSize: 36,
  compactContainerSize: 36,
  focusedContainerSize: 44,
  rowPitch: 52,
  labelWidth: 148,
  labelGap: 12,
  labelSize: 20,
  railWidth: 208,
  contentGap: 24,
};
