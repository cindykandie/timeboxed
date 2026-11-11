import type { ClockFormat } from './localClock.ts';

export type TimeSource = 'automatic' | 'manual';
export type ManualClockReference = { clockTimestamp: number; systemTimestamp: number };
export type PreferenceStorage = { read: () => string | null; write: (value: string) => void };
export type ClockPreferenceState = {
  format: ClockFormat;
  source: TimeSource;
  manual: ManualClockReference | null;
  error: 'load' | 'save' | null;
};

const defaults: ClockPreferenceState = { format: '24h', source: 'automatic', manual: null, error: null };
const validReference = (value: unknown): value is ManualClockReference => typeof value === 'object' && value !== null
  && 'clockTimestamp' in value && typeof value.clockTimestamp === 'number' && Number.isFinite(value.clockTimestamp)
  && 'systemTimestamp' in value && typeof value.systemTimestamp === 'number' && Number.isFinite(value.systemTimestamp);

export function displayedTimestamp(state: Pick<ClockPreferenceState, 'source' | 'manual'>, systemNow: number) {
  return state.source === 'manual' && state.manual
    ? state.manual.clockTimestamp + Math.max(0, systemNow - state.manual.systemTimestamp)
    : systemNow;
}

export function createClockPreferences(storage: PreferenceStorage, now = Date.now) {
  let state = defaults;
  const listeners = new Set<() => void>();
  try {
    const raw = storage.read();
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      if (typeof saved !== 'object' || saved === null || !('version' in saved) || !('format' in saved)
        || (saved.format !== '12h' && saved.format !== '24h')) throw new Error();
      if (saved.version === 1) state = { ...defaults, format: saved.format };
      else if (saved.version === 2 && 'source' in saved && (saved.source === 'automatic' || saved.source === 'manual')
        && 'manual' in saved && (saved.manual === null || validReference(saved.manual))
        && !(saved.source === 'manual' && saved.manual === null)) {
        state = { format: saved.format, source: saved.source, manual: saved.manual, error: null };
      } else throw new Error();
    }
  } catch { state = { ...defaults, error: 'load' }; }

  const publish = (next: ClockPreferenceState) => { state = next; listeners.forEach((listener) => listener()); };
  const commit = (next: Omit<ClockPreferenceState, 'error'>) => {
    let error: ClockPreferenceState['error'] = null;
    try { storage.write(JSON.stringify({ version: 2, format: next.format, source: next.source, manual: next.manual })); }
    catch { error = 'save'; }
    publish({ ...next, error });
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setFormat(format: ClockFormat) {
      if (format === state.format && !state.error) return;
      commit({ format, source: state.source, manual: state.manual });
    },
    setSource(source: TimeSource) {
      if (source === state.source && !state.error) return;
      const systemNow = now();
      const manual = source === 'manual' && state.manual === null
        ? { clockTimestamp: systemNow, systemTimestamp: systemNow } : state.manual;
      commit({ format: state.format, source, manual });
    },
    setManualTime(clockTimestamp: number) {
      if (!Number.isFinite(clockTimestamp)) return false;
      commit({ format: state.format, source: 'manual', manual: { clockTimestamp, systemTimestamp: now() } });
      return state.error !== 'save';
    },
  };
}
