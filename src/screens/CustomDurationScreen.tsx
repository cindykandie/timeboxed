import { router } from 'expo-router';
import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { DurationStepper } from '../components/DurationStepper';
import { Screen } from '../components/Screen';
import { TVButton } from '../components/TVButton';
import { colors } from '../theme';
import { timerStore } from '../timer/session';
import { durationFromParts } from '../timer/timer';

export function CustomDurationScreen() {
  const state = useSyncExternalStore(timerStore.subscribe, timerStore.getSnapshot, timerStore.getSnapshot);
  const [hours, setHours] = useState(() => Math.floor(state.durationMs / 3_600_000));
  const [minutes, setMinutes] = useState(() => Math.floor((state.durationMs % 3_600_000) / 60_000));
  const [seconds, setSeconds] = useState(() => Math.floor((state.durationMs % 60_000) / 1000));
  const durationMs = durationFromParts(hours, minutes, seconds);
  const locked = state.status === 'running' || state.status === 'paused';

  return (
    <Screen compact>
      <Text accessibilityRole="header" style={styles.title}>Custom duration</Text>
      <View style={styles.steppers}>
        <DurationStepper label="Hours" value={hours} max={23} onChange={setHours} />
        <DurationStepper label="Minutes" value={minutes} max={59} onChange={setMinutes} />
        <DurationStepper label="Seconds" value={seconds} max={59} onChange={setSeconds} />
      </View>
      {(locked || durationMs === 0) && <Text accessibilityLiveRegion="polite" style={styles.hint}>
        {locked ? 'Reset the timer to change its duration.' : 'Choose at least 1 second.'}
      </Text>}
      <View style={styles.actions}>
        <TVButton label="Use duration" primary disabled={durationMs === 0 || locked} onPress={() => {
          timerStore.dispatch({ type: 'setDuration', durationMs });
          router.back();
        }} />
        <TVButton label="Cancel" preferredFocus onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '500', textAlign: 'center' },
  steppers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 32, marginTop: 20 },
  hint: { color: colors.muted, fontSize: 16, minHeight: 24, marginTop: 12, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 },
});
