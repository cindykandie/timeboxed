import type { TextStorage } from '../storage/document.ts';
import { MAX_DURATION_MS, PRESET_MINUTES } from './timer.ts';

export type TimerPresets = readonly [number, number, number];
export const defaultTimerPresets: TimerPresets = [PRESET_MINUTES[0] * 60_000, PRESET_MINUTES[1] * 60_000, PRESET_MINUTES[2] * 60_000];
const validDuration = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)
  && value >= 1000 && value <= MAX_DURATION_MS && value % 1000 === 0;

export function timerPresetLabel(durationMs: number) {
  if (durationMs % 60_000 === 0) return `${durationMs / 60_000} min`;
  const total = durationMs / 1000;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const seconds = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
export function timerPresetAccessibilityLabel(durationMs: number) {
  if (durationMs % 60_000 === 0) return `${durationMs / 60_000} ${durationMs === 60_000 ? 'minute' : 'minutes'}`;
  const total = durationMs / 1000;
  const parts: [number, string][] = [[Math.floor(total / 3600), 'hour'], [Math.floor(total % 3600 / 60), 'minute'], [total % 60, 'second']];
  return parts.filter(([value]) => value > 0).map(([value, unit]) => `${value} ${unit}${value === 1 ? '' : 's'}`).join(' ');
}

type State = { presets: TimerPresets; error: 'load' | 'save' | null };
export function createTimerPreferences(storage: TextStorage) {
  let state: State = { presets: defaultTimerPresets, error: null };
  const listeners = new Set<() => void>();
  try {
    const raw = storage.read();
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      if (typeof saved === 'object' && saved !== null && 'version' in saved && saved.version === 1 && 'presets' in saved
        && Array.isArray(saved.presets) && saved.presets.length === 3 && saved.presets.every(validDuration)) {
        state = { presets: [saved.presets[0], saved.presets[1], saved.presets[2]], error: null };
      } else state = { ...state, error: 'load' };
    }
  } catch { state = { ...state, error: 'load' }; }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setPreset(index: number, durationMs: number) {
      if (!Number.isInteger(index) || index < 0 || index > 2 || !validDuration(durationMs)) return false;
      if (state.presets[index] === durationMs && !state.error) return true;
      const presets: [number, number, number] = [...state.presets];
      presets[index] = durationMs;
      try { storage.write(JSON.stringify({ version: 1, presets })); state = { presets, error: null }; }
      catch { state = { ...state, error: 'save' }; }
      listeners.forEach((listener) => listener());
      return state.error === null;
    },
  };
}
export type TimerPreferences = ReturnType<typeof createTimerPreferences>;
