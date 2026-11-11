import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { colors } from '../theme';
import { TVButton } from './TVButton';

export function NumberField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (value: number) => void;
}) {
  const change = (step: number) => onChange(value + step > max ? min : value + step < min ? max : value + step);
  return <View style={styles.root}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}>
      <TVButton label="−" compact accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={() => change(-1)} style={styles.button} />
      <Text accessibilityLabel={`${label} ${value}`} style={styles.value}>{String(value).padStart(2, '0')}</Text>
      <TVButton label="+" compact accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={() => change(1)} style={styles.button} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, gap: 4 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  label: { color: colors.muted, fontSize: 16 }, value: { color: colors.text, fontSize: 24, fontVariant: ['tabular-nums'] },
  button: { paddingHorizontal: 10, minHeight: 44, paddingVertical: 6 },
});
