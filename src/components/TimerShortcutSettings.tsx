import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { timerPreferences } from '../timer/preferenceStore';
import { timerPresetLabel } from '../timer/preferences';
import { durationFromParts } from '../timer/timer';
import { Text } from '../typography/Text';
import { DurationStepper } from './DurationStepper';
import { TVButton } from './TVButton';

export function TimerShortcutSettings({ editing, onEdit, preferredIndex }: { editing: number | null; onEdit: (index: number | null) => void; preferredIndex: number }) {
  const { presets, error } = useSyncExternalStore(timerPreferences.subscribe, timerPreferences.getSnapshot, timerPreferences.getSnapshot);
  return <View testID="timer-shortcut-settings" style={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>Timer shortcuts</Text>
    {editing === null ? <>
      {presets.map((duration, index) => <TVButton key={index} label={`${index + 1} · ${timerPresetLabel(duration)}`}
        accessibilityLabel={`Edit shortcut ${index + 1}`} quiet preferredFocus={index === preferredIndex} onPress={() => onEdit(index)} />)}
      <Text style={styles.note}>The first shortcut is used on startup.</Text>
    </> : <ShortcutEditor key={editing} index={editing} duration={presets[editing]} onDone={() => onEdit(null)} />}
    {error && <Text accessibilityLiveRegion="polite" style={styles.note}>{error === 'load'
      ? 'Saved shortcuts could not be loaded. Save a shortcut to repair them.'
      : 'Shortcuts could not be saved. Please try again.'}</Text>}
  </View>;
}
function ShortcutEditor({ index, duration, onDone }: { index: number; duration: number; onDone: () => void }) {
  const [hours, setHours] = useState(Math.floor(duration / 3_600_000));
  const [minutes, setMinutes] = useState(Math.floor(duration % 3_600_000 / 60_000));
  const [seconds, setSeconds] = useState(Math.floor(duration % 60_000 / 1000));
  const durationMs = durationFromParts(hours, minutes, seconds);
  return <View testID="timer-shortcut-editor" style={styles.content}>
    <Text style={styles.note}>Shortcut {index + 1}</Text>
    <View style={styles.steppers}>
      <DurationStepper label="Hours" value={hours} max={23} onChange={setHours} />
      <DurationStepper label="Minutes" value={minutes} max={59} onChange={setMinutes} />
      <DurationStepper label="Seconds" value={seconds} max={59} onChange={setSeconds} />
    </View>
    {durationMs === 0 && <Text accessibilityLiveRegion="polite" style={styles.note}>Choose at least 1 second.</Text>}
    <View style={styles.actions}>
      <TVButton label="Save" accessibilityLabel="Save shortcut" primary disabled={durationMs === 0}
        onPress={() => { if (timerPreferences.setPreset(index, durationMs)) onDone(); }} />
      <TVButton label="Cancel" preferredFocus onPress={onDone} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  content: { gap: 16 }, title: { color: colors.text, fontSize: 28, fontWeight: '500' }, note: { color: colors.muted, fontSize: 16 },
  steppers: { flexDirection: 'row', justifyContent: 'center', gap: 16 }, actions: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
});
