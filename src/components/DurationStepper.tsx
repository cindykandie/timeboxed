import type { Dispatch, SetStateAction } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { colors } from '../theme';
import { TVButton } from './TVButton';

type Props = { label: string; value: number; max: number; onChange: Dispatch<SetStateAction<number>> };

export function DurationStepper({ label, value, max, onChange }: Props) {
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <TVButton label="+" compact accessibilityLabel={`Increase ${label.toLowerCase()}`}
        onPress={() => onChange((current) => (current + 1) % (max + 1))} style={styles.button} />
      <Text accessibilityLabel={`${value} ${label.toLowerCase()}`} style={styles.value}>
        {String(value).padStart(2, '0')}
      </Text>
      <TVButton label="−" compact accessibilityLabel={`Decrease ${label.toLowerCase()}`}
        onPress={() => onChange((current) => (current + max) % (max + 1))} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { alignItems: 'center', gap: 6, minWidth: 120 },
  label: { color: colors.muted, fontSize: 16 },
  button: { minWidth: 104 },
  value: { color: colors.text, fontSize: 40, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
