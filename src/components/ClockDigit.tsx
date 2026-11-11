import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { colors, dashboardTokens, motion } from '../theme';
import { useTypographyStyle } from '../typography/context';

export const ClockDigit = memo(function ClockDigit({ value, secondary, animate, size = dashboardTokens.clockSize, shadowed = false }: {
  value: string;
  secondary: boolean;
  animate: boolean;
  size?: number;
  shadowed?: boolean;
}) {
  const typography = useTypographyStyle();
  const [opacity] = useState(() => new Animated.Value(1));
  const previous = useRef(value);

  useEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    opacity.stopAnimation();
    if (!animate || !changed) {
      opacity.setValue(1);
      return;
    }
    // The new digit is readable immediately; just ease its ink to full opacity.
    opacity.setValue(motion.digitOpacity);
    const animation = Animated.timing(opacity, {
      toValue: 1, duration: motion.digitDuration, easing: Easing.out(Easing.quad),
      useNativeDriver: true, isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, opacity, value]);

  return (
    <Animated.Text accessible={false} numberOfLines={1} adjustsFontSizeToFit
      style={[styles.digit, typography, secondary && styles.secondary, shadowed && styles.shadowed,
        { opacity, fontSize: size, lineHeight: size * 1.1 }]}>{value}</Animated.Text>
  );
});

const styles = StyleSheet.create({
  digit: { color: colors.text,
    fontWeight: '300', fontVariant: ['tabular-nums'], flexShrink: 1 },
  secondary: { color: colors.muted },
  shadowed: { textShadowColor: colors.artworkInk, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
