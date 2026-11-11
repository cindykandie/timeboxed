import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { useLocalClock } from '../hooks/useLocalClock';
import { useClockPreferences } from '../hooks/useClockPreferences';
import { artDashboardTokens, colors } from '../theme';
import { ClockTime } from './ClockTime';

export function DashboardClock() {
  const { format, source, manual } = useClockPreferences();
  const clock = useLocalClock(format, source, manual);
  return (
    <View testID="dashboard-clock-block" style={styles.container}>
      <ClockTime clock={clock} testID="dashboard-clock" size={artDashboardTokens.clockSize} shadowed />
      <Text testID="dashboard-date" style={styles.date}>{clock.date}</Text>
      {source === 'manual' && <Text testID="dashboard-clock-manual" style={styles.manual}>Manual</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', gap: 4 },
  date: { color: colors.text, fontSize: artDashboardTokens.dateSize,
    textShadowColor: colors.artworkInk, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  manual: { color: colors.peach, fontSize: 13, textShadowColor: colors.artworkInk,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
