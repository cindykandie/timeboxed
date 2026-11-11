import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { watchWallTime } from '../time/wallTime';

export function useWallTime(enabled = true) {
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    return watchWallTime({ isActive: () => AppState.currentState === 'active', subscribe(change) {
      const subscription = AppState.addEventListener('change', change);
      return () => subscription.remove();
    } }, setNow);
  }, [enabled]));
  return now;
}
