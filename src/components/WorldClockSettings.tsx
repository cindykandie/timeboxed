import { StyleSheet, View } from 'react-native';
import { useSyncExternalStore } from 'react';

import { colors } from '../theme';
import { Text } from '../typography/Text';
import { cities } from '../worldClocks/cities';
import { worldClocksStore } from '../worldClocks/persistentStore';
import { TVButton } from './TVButton';

export function WorldClockSettings() {
  const { selected, error } = useSyncExternalStore(worldClocksStore.subscribe, worldClocksStore.getSnapshot, worldClocksStore.getSnapshot);
  return <View testID="world-clock-settings" style={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>World Clocks</Text>
    <View style={styles.grid}>{cities.map((city, index) => {
      const active = selected.includes(city.id);
      return <TVButton key={city.id} label={`${city.name} · ${city.country}`} selected={active} preferredFocus={index === 0}
        accessibilityLabel={`${active ? 'Remove' : 'Add'} ${city.name}`}
        onPress={() => active ? worldClocksStore.remove(city.id) : worldClocksStore.add(city.id)} style={styles.city} />;
    })}</View>
    {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  content: { gap: 16 }, title: { color: colors.buttercream, fontSize: 28, fontWeight: '500' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, city: { width: '48%' }, error: { color: colors.peach },
});
