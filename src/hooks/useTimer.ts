import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { watchTimer } from '../timer/store';
import { timerStore } from '../timer/session';

export function useTimer() {
  const state = useSyncExternalStore(timerStore.subscribe, timerStore.getSnapshot, timerStore.getSnapshot);

  useFocusEffect(useCallback(() => {
    let stop: (() => void) | undefined;
    const syncActivity = () => {
      stop?.();
      stop = undefined;
      if (AppState.currentState === 'active') stop = watchTimer(timerStore);
    };
    syncActivity();
    const subscription = AppState.addEventListener('change', syncActivity);
    return () => { subscription.remove(); stop?.(); };
  }, []));

  return { state, dispatch: timerStore.dispatch };
}
