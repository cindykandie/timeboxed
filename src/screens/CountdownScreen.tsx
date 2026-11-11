import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { countdownStore } from '../countdown/persistentStore';
import { localFields, remainingLabel, targetTimestamp } from '../countdown/model';
import type { CountdownEvent, LocalTarget } from '../countdown/model';
import { NumberField } from '../components/NumberField';
import { RemoteNameEditor } from '../components/RemoteNameEditor';
import { Screen } from '../components/Screen';
import { TVButton } from '../components/TVButton';
import { ActionIcon } from '../components/ActionIcon';
import { FocusableItem } from '../components/FocusableItem';
import { useClockPreferences } from '../hooks/useClockPreferences';
import { useWallTime } from '../hooks/useWallTime';
import { colors } from '../theme';

type Mode = 'list' | 'editor' | 'name' | 'detail' | 'actions' | 'delete';
const limits = { year: [1970, 9999], month: [1, 12], day: [1, 31], hour: [0, 23], minute: [0, 59] } as const;
export function CountdownScreen() {
  const { events, error } = useSyncExternalStore(countdownStore.subscribe, countdownStore.getSnapshot, countdownStore.getSnapshot);
  const [mode, setMode] = useState<Mode>('list');
  const [selectedId, setSelectedId] = useState<string>();
  const [name, setName] = useState('My event');
  const [fields, setFields] = useState(() => localFields(Date.now() + 86400000));
  const [validation, setValidation] = useState<string | null>(null);
  const [detailFocus, setDetailFocus] = useState<'list' | 'actions'>('list');
  const { format } = useClockPreferences();
  const now = useWallTime(events.length > 0 && (mode === 'list' || mode === 'detail'));
  const selected = events.find((item) => item.id === selectedId);
  const onBack = useCallback(() => setMode(mode === 'name' ? 'editor' : mode === 'delete' || mode === 'actions' ? 'detail' : 'list'), [mode]);
  const edit = (event?: CountdownEvent) => {
    setSelectedId(event?.id); setName(event?.name ?? 'My event');
    setFields(localFields(event?.targetAt ?? Date.now() + 86400000)); setValidation(null); setMode('editor');
  };
  const save = () => {
    try {
      if (!name.trim()) throw new Error('Enter an event name.');
      const target = targetTimestamp(fields, Date.now());
      if (countdownStore.save(name, target, selectedId)) { setValidation(null); setMode('list'); }
    } catch (cause) { setValidation(cause instanceof Error ? cause.message : 'Check the event details.'); }
  };
  const { locale, timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: format === '12h' ? 'h12' : 'h23' }), [format, locale, timeZone]);
  const field = (key: keyof LocalTarget) => <NumberField key={key} label={key === 'hour' ? 'Hour (24h)' : key[0].toUpperCase() + key.slice(1)}
    value={fields[key]} min={limits[key][0]} max={limits[key][1]} onChange={(value) => setFields((previous) => ({ ...previous, [key]: value }))} />;
  return <Screen compact onBack={mode === 'list' ? undefined : onBack}>
    <View testID={mode === 'list' ? 'countdown-list' : undefined}>
    <View style={[styles.header, mode === 'list' && events.length === 0 && styles.emptyHeader]}>
      {mode === 'detail' ? <TVButton label="All countdowns" compact quiet preferredFocus={detailFocus === 'list'} onPress={() => setMode('list')} />
        : <Text accessibilityRole="header" style={styles.title}>Countdown</Text>}
      {mode === 'list' && <TVButton label="New countdown" preferredFocus compact onPress={() => edit()} />}
      {mode === 'detail' && <TVButton label="" icon="more" quiet compact accessibilityLabel="Countdown actions" style={styles.menuButton}
        preferredFocus={detailFocus === 'actions'} onPress={() => { setDetailFocus('actions'); setMode('actions'); }} />}</View>
    {mode === 'list' && <View style={styles.list}>
      {events.map((event) => <FocusableItem key={event.id} accent={colors.peach} testID={`countdown-event-${event.id}`}
        accessibilityLabel={`Open ${event.name}`} accessibilityHint="Select to view countdown and event actions"
        onPress={() => { setSelectedId(event.id); setDetailFocus('list'); setMode('detail'); }}>
        {(focused) => <View style={styles.entry}>
          <View style={styles.entryText}><Text style={styles.entryName}>{event.name}</Text>
            <Text style={styles.entryTime}>{remainingLabel(event.targetAt, now)}</Text>
            <Text style={styles.secondary}>{date.format(event.targetAt)}</Text></View>
          <View style={styles.openIcon}>{focused && <ActionIcon name="open" color={colors.peach} />}</View>
        </View>}
      </FocusableItem>)}
    </View>}
    {mode === 'name' && <RemoteNameEditor value={name} onChange={setName} onDone={() => setMode('editor')} />}
    {mode === 'editor' && <View testID="countdown-editor" style={styles.editor}>
      <TVButton label={name || 'Event name'} accessibilityLabel="Edit event name" preferredFocus onPress={() => setMode('name')} />
      <View style={styles.row}>{(['year', 'month', 'day'] as const).map(field)}</View>
      <View style={styles.row}>{(['hour', 'minute'] as const).map(field)}</View>
      <Text style={styles.secondary}>Device local time · {Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>
      <View style={styles.row}><TVButton label="Save countdown" primary onPress={save} /><TVButton label="Cancel" onPress={() => setMode('list')} /></View>
      {validation && <Text accessibilityLiveRegion="polite" style={styles.error}>{validation}</Text>}
    </View>}
    {mode === 'detail' && selected && <View testID="countdown-detail" style={styles.detail}>
      <Text style={styles.event}>{selected.name}</Text>
      <Text testID="countdown-remaining" style={styles.remaining} adjustsFontSizeToFit numberOfLines={1}>{remainingLabel(selected.targetAt, now)}</Text>
      <Text testID="countdown-target" style={styles.date}>{date.format(selected.targetAt)}</Text>
    </View>}
    {mode === 'actions' && selected && <View testID="countdown-actions" style={styles.detail}>
      <Text style={styles.event}>{selected.name}</Text>
      <View style={styles.row}><TVButton label="Edit" icon="edit" quiet compact accessibilityLabel="Edit countdown" preferredFocus onPress={() => edit(selected)} />
        <TVButton label="Delete" icon="delete" quiet compact accessibilityLabel="Delete countdown" onPress={() => setMode('delete')} />
        <TVButton label="Cancel" quiet compact accessibilityLabel="Close countdown actions" onPress={() => setMode('detail')} /></View>
    </View>}
    {mode === 'delete' && selected && <View testID="countdown-delete" style={styles.detail}>
      <Text style={styles.event}>Delete {selected.name}?</Text><Text style={styles.secondary}>This cannot be undone.</Text>
      <View style={styles.row}><TVButton label="Keep countdown" preferredFocus onPress={() => setMode('detail')} />
        <TVButton label="Delete permanently" onPress={() => { if (countdownStore.remove(selected.id)) setMode('list'); }} /></View>
    </View>}
    {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: colors.peach, fontSize: 28, fontWeight: '500' }, list: { gap: 12 }, emptyHeader: { flexDirection: 'column', gap: 24, marginBottom: 0 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 16 }, entryText: { flex: 1, gap: 4 }, openIcon: { width: 24 },
  entryName: { color: colors.text, fontSize: 22 }, entryTime: { color: colors.peach, fontSize: 28, fontVariant: ['tabular-nums'] },
  menuButton: { width: 52, paddingHorizontal: 0 },
  editor: { gap: 16 }, row: { flexDirection: 'row', gap: 16 }, secondary: { color: colors.muted, fontSize: 16 },
  detail: { alignItems: 'center', gap: 20 }, event: { color: colors.text, fontSize: 32 }, remaining: { color: colors.peach, fontSize: 48, fontVariant: ['tabular-nums'] },
  date: { color: colors.muted, fontSize: 18, marginBottom: 16 }, error: { color: colors.peach, fontSize: 16, marginTop: 12 },
});
