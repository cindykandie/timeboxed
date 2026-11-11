import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { useClockPreferences } from '../hooks/useClockPreferences';
import { useLocalClock } from '../hooks/useLocalClock';
import { clockTokens, colors } from '../theme';
import { ClockTime } from './ClockTime';

// One focused clock subscription per display. Standard and ambient are separate
// routes, so the hidden screen's lifecycle effect stops its interval.
export function DigitalClockDisplay({ ambient = false }: { ambient?: boolean }) {
  const { format, source, manual } = useClockPreferences();
  const clock = useLocalClock(format, source, manual);
  return (
    <View style={styles.display}>
      <Text testID="clock-weekday" style={[styles.weekday, ambient && styles.ambientWeekday]}>{clock.weekday}</Text>
      <ClockTime clock={clock} testID="clock-time" size={ambient ? clockTokens.ambientSize : clockTokens.standardSize} />
      <Text testID="clock-date" style={styles.date}>{clock.calendarDate}</Text>
      <Text testID="clock-timezone" accessibilityLabel={`Local timezone ${clock.timeZone}`} style={styles.zone}>{clock.timeZone}</Text>
      {source === 'manual' && <Text testID="clock-manual" style={styles.manual}>Manual</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  display: { width: '100%', alignItems: 'center', marginVertical: 24 },
  weekday: { color: colors.lavender, fontSize: clockTokens.weekdaySize, marginBottom: 8 },
  ambientWeekday: { color: colors.muted },
  date: { color: colors.text, fontSize: clockTokens.dateSize, marginTop: 12 },
  zone: { color: colors.muted, fontSize: 16, marginTop: 10 },
  manual: { color: colors.peach, fontSize: 14, marginTop: 8 },
});
