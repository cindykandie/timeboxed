import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { DigitalClockDisplay } from '../components/DigitalClockDisplay';
import { Screen } from '../components/Screen';
import { TVButton } from '../components/TVButton';
import { useClockPreferences } from '../hooks/useClockPreferences';
import { colors } from '../theme';

export function ClockScreen() {
  const { format, error, setFormat } = useClockPreferences();
  return (
    <Screen compact>
      <DigitalClockDisplay />
      <View testID="clock-controls" style={styles.settings}>
        <View style={styles.segmented}>
          <TVButton label="12h" accessibilityLabel="12-hour" compact quiet style={styles.segment} selected={format === '12h'} onPress={() => setFormat('12h')} />
          <TVButton label="24h" accessibilityLabel="24-hour" compact quiet style={styles.segment} selected={format === '24h'} onPress={() => setFormat('24h')} />
        </View>
        <TVButton label="" accessibilityLabel="Enter ambient mode" icon="ambient" iconSize={28}
          quiet compact preferredFocus style={styles.ambient} onPress={() => router.push('/clock-ambient')} />
      </View>
      {error && <Text accessibilityLiveRegion="polite" style={styles.hint}>{error === 'load'
        ? 'Saved format could not be loaded. Choose a format to save it again.'
        : error === 'save' ? 'Format could not be saved. This choice will last for this session.'
          : ''}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  settings: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 3, gap: 2 },
  segment: { minWidth: 72 },
  ambient: { width: 58, paddingHorizontal: 0 },
  hint: { color: colors.muted, fontSize: 14, minHeight: 24, marginTop: 18, textAlign: 'center' },
});
