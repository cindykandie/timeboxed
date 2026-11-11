import type { TextStorage } from '../storage/document.ts';
import { parseFontFamily } from './model.ts';
import type { FontFamily } from './model.ts';

type PreferenceState = { family: FontFamily; error: 'load' | 'save' | null };

// The same synchronous, validated document preference pattern as Clock.
export function createTypographyPreferences(storage: TextStorage) {
  let state: PreferenceState = { family: 'satoshi', error: null };
  const listeners = new Set<() => void>();
  try {
    const raw = storage.read();
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      const family = typeof saved === 'object' && saved !== null && 'version' in saved && saved.version === 1
        && 'family' in saved ? parseFontFamily(saved.family) : null;
      state = family ? { family, error: null } : { ...state, error: 'load' };
    }
  } catch { state = { ...state, error: 'load' }; }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setFamily(family: FontFamily) {
      if (family === state.family && !state.error) return;
      let error: PreferenceState['error'] = null;
      try { storage.write(JSON.stringify({ version: 1, family })); }
      catch { error = 'save'; }
      state = { family, error };
      listeners.forEach((listener) => listener());
    },
  };
}
