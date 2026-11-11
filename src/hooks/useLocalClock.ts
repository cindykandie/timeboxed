import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { createClockReader, watchActiveClock } from '../clock/localClock';
import type { ClockFormat } from '../clock/localClock';
import { displayedTimestamp } from '../clock/preferences';
import type { ManualClockReference, TimeSource } from '../clock/preferences';

const readClock = createClockReader();

export function useLocalClock(format: ClockFormat = '24h', source: TimeSource = 'automatic', manual: ManualClockReference | null = null) {
  const read = useCallback(() => readClock(displayedTimestamp({ source, manual }, Date.now()), format), [format, source, manual]);
  const [clock, setClock] = useState(read);

  useFocusEffect(useCallback(() => {
    return watchActiveClock({
      isActive: () => AppState.currentState === 'active',
      subscribe: (change) => {
        const subscription = AppState.addEventListener('change', change);
        return () => subscription.remove();
      },
    }, setClock, read);
  }, [read]));

  return clock;
}
