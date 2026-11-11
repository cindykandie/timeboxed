import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { manualDateTime, manualTimestamp } from '../clock/manualTime';
import { displayedTimestamp } from '../clock/preferences';
import { useClockPreferences } from '../hooks/useClockPreferences';
import { colors } from '../theme';
import { Text } from '../typography/Text';
import { TVButton } from './TVButton';
import { ValueStepper } from './ValueStepper';

export function ClockSettings() {
  const preferences = useClockPreferences();
  const [draft, setDraft] = useState(() => manualDateTime(displayedTimestamp(preferences, Date.now())));
  const [message, setMessage] = useState('');
  const set = (key: keyof typeof draft, value: number) => setDraft((current) => ({ ...current, [key]: value }));
  const days = new Date(draft.year, draft.month, 0).getDate();
  const twelveHour = preferences.format === '12h';
  const period = draft.hour >= 12 ? 'PM' : 'AM';
  const shownHour = twelveHour ? (draft.hour % 12 || 12) : draft.hour;
  const changeHour = (hour: number) => set('hour', twelveHour ? (hour % 12) + (period === 'PM' ? 12 : 0) : hour);
  return <View testID="clock-settings" style={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>Clock</Text>
    <Text style={styles.label}>Time source</Text>
    <View style={styles.row}>
      <TVButton label="Automatic" selected={preferences.source === 'automatic'} preferredFocus={preferences.source === 'automatic'} onPress={() => preferences.setSource('automatic')} />
      <TVButton label="Manual" selected={preferences.source === 'manual'} preferredFocus={preferences.source === 'manual'} onPress={() => preferences.setSource('manual')} />
    </View>
    <Text style={styles.label}>Format</Text>
    <View style={styles.row}>
      <TVButton label="12h" accessibilityLabel="12-hour" selected={preferences.format === '12h'} onPress={() => preferences.setFormat('12h')} />
      <TVButton label="24h" accessibilityLabel="24-hour" selected={preferences.format === '24h'} onPress={() => preferences.setFormat('24h')} />
    </View>
    {preferences.source === 'manual' && <>
      <View style={styles.steppers}>
        <ValueStepper label="Year" value={draft.year} min={1970} max={9999} pad={4} onChange={(value) => set('year', value)} />
        <ValueStepper label="Month" value={draft.month} min={1} max={12} onChange={(value) => set('month', value)} />
        <ValueStepper label="Day" value={Math.min(draft.day, days)} min={1} max={days} onChange={(value) => set('day', value)} />
        <ValueStepper label="Hour" value={shownHour} min={twelveHour ? 1 : 0} max={twelveHour ? 12 : 23} onChange={changeHour} />
        <ValueStepper label="Minute" value={draft.minute} min={0} max={59} onChange={(value) => set('minute', value)} />
        {twelveHour && <TVButton label={period} accessibilityLabel={`Time period ${period}`} selected onPress={() => set('hour', (draft.hour + 12) % 24)} />}
      </View>
      <TVButton label="Save manual time" primary style={styles.save} onPress={() => {
        try {
          const value = manualTimestamp({ ...draft, day: Math.min(draft.day, days) });
          setMessage(preferences.setManualTime(value) ? 'Saved' : 'Could not save');
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Enter a valid date and time.'); }
      }} />
    </>}
    <Text style={styles.detail}>Device timezone · {Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 14 }, title: { color: colors.lavender, fontSize: 28, fontWeight: '500' },
  label: { color: colors.muted, fontSize: 16 }, row: { flexDirection: 'row', gap: 10 },
  steppers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  detail: { color: colors.muted, fontSize: 15 }, message: { color: colors.peach, fontSize: 15 },
  save: { width: 260, alignSelf: 'flex-start' },
});
