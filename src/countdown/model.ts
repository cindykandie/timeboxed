export type CountdownEvent = { id: string; name: string; targetAt: number; createdAt: number };
export type LocalTarget = { year: number; month: number; day: number; hour: number; minute: number };

export function localFields(timestamp: number): LocalTarget {
  const date = new Date(timestamp);
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes() };
}

// Round-trip local calendar fields: Date normally silently normalizes Feb 30
// and nonexistent daylight-saving times. Reject those instead.
export function targetTimestamp(fields: LocalTarget, now: number): number {
  const { year, month, day, hour, minute } = fields;
  if (![year, month, day, hour, minute].every(Number.isInteger) || year < 1970 || year > 9999
    || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Enter a valid date and time.');
  }
  const timestamp = new Date(year, month - 1, day, hour, minute).getTime();
  const actual = localFields(timestamp);
  if (Object.keys(fields).some((key) => fields[key as keyof LocalTarget] !== actual[key as keyof LocalTarget])) {
    throw new Error('This date or local time does not exist.');
  }
  if (timestamp <= now) throw new Error('Choose a future date and time.');
  return timestamp;
}

export function remainingParts(targetAt: number, now: number) {
  const total = Math.max(0, Math.ceil((targetAt - now) / 1000));
  return { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60, seconds: total % 60, completed: total === 0 };
}
export function remainingLabel(targetAt: number, now: number) {
  const value = remainingParts(targetAt, now);
  return value.completed ? 'Event started' : `${value.days}d  ${String(value.hours).padStart(2, '0')}h  ${String(value.minutes).padStart(2, '0')}m  ${String(value.seconds).padStart(2, '0')}s`;
}
export function validEvent(value: unknown): value is CountdownEvent {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Partial<CountdownEvent>;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 100
    && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 40
    && typeof item.targetAt === 'number' && Number.isFinite(new Date(item.targetAt).getTime())
    && typeof item.createdAt === 'number' && Number.isFinite(new Date(item.createdAt).getTime());
}
