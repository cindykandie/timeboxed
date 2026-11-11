import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { Text } from '../typography/Text';
import { TVButton } from './TVButton';

type Props = { label: string; value: number; min: number; max: number; onChange: (value: number) => void; pad?: number };

export function ValueStepper({ label, value, min, max, onChange, pad = 2 }: Props) {
  const change = (amount: number) => onChange(value + amount > max ? min : value + amount < min ? max : value + amount);
  return <View style={styles.column}>
    <Text style={styles.label}>{label}</Text>
    <TVButton label="+" compact accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={() => change(1)} style={styles.button} />
    <Text accessibilityLabel={`${value} ${label.toLowerCase()}`} style={styles.value}>{String(value).padStart(pad, '0')}</Text>
    <TVButton label="−" compact accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={() => change(-1)} style={styles.button} />
  </View>;
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', gap: 5, minWidth: 96 },
  label: { color: colors.muted, fontSize: 14 },
  button: { minWidth: 82, minHeight: 44 },
  value: { color: colors.text, fontSize: 30, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
