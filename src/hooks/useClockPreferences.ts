import { useSyncExternalStore } from 'react';

import { clockPreferences } from '../clock/preferenceStore';

export function useClockPreferences() {
  const state = useSyncExternalStore(clockPreferences.subscribe, clockPreferences.getSnapshot, clockPreferences.getSnapshot);
  return { ...state, setFormat: clockPreferences.setFormat, setSource: clockPreferences.setSource,
    setManualTime: clockPreferences.setManualTime };
}
