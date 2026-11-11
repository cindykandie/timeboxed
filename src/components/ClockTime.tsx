import { useIsFocused } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import type { LocalClock } from '../clock/localClock';
import { colors, dashboardTokens } from '../theme';
import { ClockDigit } from './ClockDigit';
import { useReducedMotion } from './MotionProvider';

export function ClockTime({ clock, size = dashboardTokens.clockSize, testID, shadowed = false }: {
  clock: LocalClock; size?: number; testID: string; shadowed?: boolean;
}) {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  return (
    <View testID={testID} accessible accessibilityLabel={`Local time ${clock.time}`} style={styles.time}>
      <View style={styles.digits}>
        {Array.from(clock.digits).map((digit, index) => (
          <ClockDigit key={index} value={digit} secondary={index >= clock.digits.length - 3}
            size={size} shadowed={shadowed} animate={!reduced && focused} />
        ))}
      </View>
      {!!clock.dayPeriod && <Text style={[styles.period, shadowed && styles.shadowed, { fontSize: size * 0.28 }]}>{clock.dayPeriod}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  time: { flexDirection: 'row', direction: 'ltr', maxWidth: '100%', alignItems: 'baseline', gap: 12 },
  digits: { flexDirection: 'row', flexShrink: 1 },
  period: { color: colors.lavender, fontWeight: '400' },
  shadowed: { textShadowColor: colors.artworkInk, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
