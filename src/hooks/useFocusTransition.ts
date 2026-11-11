import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useReducedMotion } from '../components/MotionProvider';
import { motion } from '../theme';

export function useFocusTransition(focused: boolean) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  useEffect(() => {
    progress.stopAnimation();
    if (reduced) {
      progress.setValue(focused ? 1 : 0);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: focused ? 1 : 0, duration: motion.focusDuration,
      easing: Easing.out(Easing.quad), useNativeDriver: true, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, progress, reduced]);
  return progress;
}
