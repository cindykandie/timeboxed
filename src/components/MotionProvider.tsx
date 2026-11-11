import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReduceMotion = createContext(true);

export function MotionProvider({ children }: PropsWithChildren) {
  // Keep motion off until the device preference is known.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted && !changed) setReduced(value);
    }).catch(() => { /* Keep the accessible default if the platform cannot answer. */ });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return <ReduceMotion.Provider value={reduced}>{children}</ReduceMotion.Provider>;
}

export const useReducedMotion = () => useContext(ReduceMotion);
