import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { CountdownDisplay } from '../components/CountdownDisplay';
import { Screen } from '../components/Screen';
import { TimerControlButton } from '../components/TimerControlButton';
import { TVButton } from '../components/TVButton';
import { useTimer } from '../hooks/useTimer';
import { timerPreferences } from '../timer/preferenceStore';
import { timerPresetAccessibilityLabel, timerPresetLabel } from '../timer/preferences';

export function TimerScreen() {
  const { state, dispatch } = useTimer();
  const { presets } = useSyncExternalStore(timerPreferences.subscribe, timerPreferences.getSnapshot, timerPreferences.getSnapshot);
  const locked = state.status === 'running' || state.status === 'paused';
  const primaryAction = state.status === 'running' ? 'pause' : state.status === 'paused' ? 'resume' : 'start';
  const primaryLabel = state.status === 'running' ? 'Pause' : state.status === 'paused' ? 'Resume'
    : state.status === 'completed' ? 'Start again' : 'Start';
  const customSelected = !presets.includes(state.durationMs);

  return (
    <Screen>
      <CountdownDisplay state={state} />
      <View style={styles.actions}>
        <TimerControlButton accessibilityLabel={primaryLabel} icon={state.status === 'running' ? 'pause' : 'play'}
          primary preferredFocus onPress={() => dispatch({ type: primaryAction })} />
        <TimerControlButton accessibilityLabel="Reset" icon="reset" onPress={() => dispatch({ type: 'reset' })} />
      </View>
      <View style={styles.durations}>
        <View style={styles.presets}>
          {presets.map((durationMs, index) => (
            <TVButton key={index} label={timerPresetLabel(durationMs)} compact disabled={locked} style={styles.preset}
              accessibilityLabel={timerPresetAccessibilityLabel(durationMs)} selected={state.durationMs === durationMs}
              onPress={() => dispatch({ type: 'setDuration', durationMs })} />
          ))}
          <TVButton label="Custom" compact disabled={locked} selected={customSelected} style={styles.preset}
            onPress={() => router.push('/custom')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  durations: { alignItems: 'center', marginTop: 32 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  preset: { width: '23%' },
});
