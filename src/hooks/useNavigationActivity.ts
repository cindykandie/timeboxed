import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState, BackHandler, TVEventHandler } from 'react-native';

import { createNavigationActivity } from '../navigation/activity';

const remoteInputs = new Set(['up', 'down', 'left', 'right', 'longUp', 'longDown', 'longLeft', 'longRight', 'select', 'longSelect', 'playPause', 'menu']);

export function useNavigationActivity(dashboard: boolean, onBack?: () => void) {
  const [active, setActive] = useState(true);
  const activity = useRef<ReturnType<typeof createNavigationActivity> | null>(null);
  const interact = useCallback(() => activity.current?.interact(), []);
  useFocusEffect(useCallback(() => {
    const timer = createNavigationActivity(setActive);
    activity.current = timer;
    const sync = () => AppState.currentState === 'active' ? timer.interact() : timer.pause();
    sync();
    const remote = TVEventHandler.addListener((event) => {
      if (remoteInputs.has(event.eventType) && AppState.currentState === 'active') timer.interact();
    });
    const appState = AppState.addEventListener('change', sync);
    const back = dashboard ? undefined : BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) onBack(); else router.dismissTo('/');
      return true;
    });
    return () => {
      timer.dispose();
      activity.current = null;
      remote?.remove();
      appState.remove();
      back?.remove();
    };
  }, [dashboard, onBack]));
  return { active, interact };
}
