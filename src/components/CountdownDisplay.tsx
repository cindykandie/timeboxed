import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { colors } from '../theme';
import { formatCountdown } from '../timer/timer';
import type { TimerState } from '../timer/timer';

export function CountdownDisplay({ state }: { state: TimerState }) {
  const completed = state.status === 'completed';
  return (
    <View style={styles.container}>
      <Text accessibilityLabel={`${formatCountdown(state.remainingMs)} remaining`}
        style={[styles.time, completed && styles.completed]} adjustsFontSizeToFit numberOfLines={1}>
        {formatCountdown(state.remainingMs)}
      </Text>
      <Text accessibilityLiveRegion="polite" style={[styles.message, completed && styles.completed]}>
        {completed ? 'Complete' : state.status === 'paused' ? 'Paused' : ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 24, width: '100%' },
  time: { color: colors.text, fontSize: 112, lineHeight: 132, fontWeight: '400',
    fontVariant: ['tabular-nums'], textAlign: 'center', width: '100%' },
  message: { color: colors.muted, fontSize: 16, textAlign: 'center', minHeight: 22 },
  completed: { color: colors.sage },
});
