import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { Screen } from '../components/Screen';
import { TVButton } from '../components/TVButton';
import { FocusableItem } from '../components/FocusableItem';
import { ActionIcon } from '../components/ActionIcon';
import { displayedTimestamp } from '../clock/preferences';
import { useClockPreferences } from '../hooks/useClockPreferences';
import { useWallTime } from '../hooks/useWallTime';
import { colors } from '../theme';
import { cities, getCity } from '../worldClocks/cities';
import type { CityId } from '../worldClocks/cities';
import { createWorldClockReader } from '../worldClocks/format';
import { worldClocksStore } from '../worldClocks/persistentStore';

const readClocks = createWorldClockReader();
export function WorldClocksScreen() {
  const { selected, error } = useSyncExternalStore(worldClocksStore.subscribe, worldClocksStore.getSnapshot, worldClocksStore.getSnapshot);
  const [picking, setPicking] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<CityId | null>(null);
  const [restoreCity, setRestoreCity] = useState<CityId | null>(null);
  const add = useRef<View>(null);
  const cityRefs = useRef(new Map<CityId, View>());
  const systemNow = useWallTime(!picking && pendingRemove === null && selected.length > 0);
  const preferences = useClockPreferences();
  const { format } = preferences;
  const now = displayedTimestamp(preferences, systemNow);
  const available = cities.filter((city) => !selected.includes(city.id));
  const clocks = readClocks(selected.map(getCity), now, format);
  const closePicker = useCallback(() => setPicking(false), []);
  const cancelRemove = useCallback(() => { setRestoreCity(pendingRemove); setPendingRemove(null); }, [pendingRemove]);
  // Deleting the currently focused button must restore a real, visible target.
  useLayoutEffect(() => {
    if (picking || pendingRemove) return;
    if (restoreCity && cityRefs.current.has(restoreCity)) cityRefs.current.get(restoreCity)?.requestTVFocus();
    else if (available.length) add.current?.requestTVFocus();
  }, [selected, picking, pendingRemove, restoreCity, available.length]);
  return <Screen compact onBack={pendingRemove ? cancelRemove : picking ? closePicker : undefined}>
    <View testID={!picking && !pendingRemove ? 'world-clocks' : undefined}>
    <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>World Clocks</Text>
      {picking ? <TVButton label="Cancel" compact onPress={closePicker} />
        : !pendingRemove && <TVButton label="Add city" buttonRef={add} preferredFocus={restoreCity === null} compact disabled={available.length === 0}
          onPress={() => { setRestoreCity(null); setPicking(true); }} />}</View>
    {pendingRemove ? <View testID="world-remove-confirmation" style={styles.confirmation}>
      <Text style={styles.confirmTitle}>Remove {getCity(pendingRemove).name}?</Text>
      <View style={styles.confirmActions}>
        <TVButton label="Cancel" accessibilityLabel="Keep city" quiet preferredFocus onPress={cancelRemove} />
        <TVButton label="Remove" accessibilityLabel="Confirm remove city" icon="delete" quiet onPress={() => {
          if (worldClocksStore.remove(pendingRemove)) { setRestoreCity(null); setPendingRemove(null); }
        }} />
      </View>
    </View> : picking ? <View testID="city-picker" style={styles.picker}>
      {available.map((city, index) => <View key={city.id} style={styles.choice}>
        <TVButton label={`${city.name} · ${city.country}`} accessibilityLabel={`Add ${city.name}`} preferredFocus={index === 0}
          onPress={() => { if (worldClocksStore.add(city.id)) setPicking(false); }} />
      </View>)}
    </View> : <View style={styles.grid}>
      {clocks.map(({ city, clock, differentDate }, index) => <FocusableItem key={city.id} testID={`world-city-${city.id}`} style={styles.city}
        accent={colors.buttercream} accessibilityLabel={`Remove ${city.name}`} accessibilityHint="Select to remove city. Confirmation required."
        buttonRef={(node) => { if (node) cityRefs.current.set(selected[index], node); else cityRefs.current.delete(selected[index]); }}
        preferredFocus={restoreCity === city.id || (available.length === 0 && restoreCity === null && index === 0)}
        onPress={() => setPendingRemove(selected[index])}>
        {(focused) => <View style={styles.cityContent}>
          <View style={styles.cityHeader}><View style={styles.identity}><Text style={styles.name}>{city.name}</Text><Text style={styles.secondary}>{city.country}</Text></View>
            <View style={styles.contextAction}>{focused && <><ActionIcon name="delete" size={20} color={colors.peach} /><Text style={styles.removeLabel}>Remove</Text></>}</View>
          </View>
          <Text testID={`world-time-${city.id}`} style={styles.time} numberOfLines={1} adjustsFontSizeToFit>{clock?.time ?? 'Time unavailable'}</Text>
          <Text testID={`world-date-${city.id}`} style={styles.date}>{differentDate ?? ' '}</Text>
          <View style={styles.zoneSlot}>{focused && <Text testID={`world-zone-${city.id}`} style={styles.zone}>{city.timeZone}</Text>}</View>
        </View>}
      </FocusableItem>)}
    </View>}
    {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  </Screen>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { color: colors.buttercream, fontSize: 28, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 }, city: { width: '47%' }, cityContent: { gap: 3 },
  name: { color: colors.text, fontSize: 22, fontWeight: '500' }, secondary: { color: colors.muted, fontSize: 14 },
  time: { color: colors.text, fontSize: 48, fontWeight: '300', fontVariant: ['tabular-nums'] },
  date: { color: colors.buttercream, fontSize: 16, minHeight: 20 },
  cityHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' }, identity: { flex: 1 },
  contextAction: { width: 74, flexDirection: 'row', gap: 4, alignItems: 'center' }, removeLabel: { color: colors.peach, fontSize: 13 },
  zoneSlot: { minHeight: 18 }, zone: { color: colors.muted, fontSize: 13 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, choice: { width: '48%' },
  confirmation: { alignItems: 'center', gap: 24 }, confirmTitle: { color: colors.text, fontSize: 30 }, confirmActions: { flexDirection: 'row', gap: 16 },
  error: { color: colors.peach, fontSize: 16, marginTop: 16 },
});
