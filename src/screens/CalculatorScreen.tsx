import { useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';

import { calculatorDisplay } from '../calculator/engine';
import { calculatorStore } from '../calculator/store';
import { Screen } from '../components/Screen';
import { TVButton } from '../components/TVButton';
import { colors } from '../theme';

const keys = [['AC', '±', '%', '/'], ['7', '8', '9', '*'], ['4', '5', '6', '-'], ['1', '2', '3', '+'], ['0', '.', '⌫', '=']];
const labels: Record<string, string> = { AC: 'Clear all', CE: 'Clear entry', '±': 'Change sign', '%': 'Percent',
  '/': 'Divide', '*': 'Multiply', '-': 'Subtract', '+': 'Add', '⌫': 'Backspace', '=': 'Equals', '.': 'Decimal point' };
const glyphs: Record<string, string> = { '/': '÷', '*': '×', '-': '−' };
export function CalculatorScreen() {
  const state = useSyncExternalStore(calculatorStore.subscribe, calculatorStore.getSnapshot, calculatorStore.getSnapshot);
  const display = calculatorDisplay(state);
  return (
    <Screen compact>
      <View style={styles.header}>
        <TVButton label="CE" quiet compact accessibilityLabel="Clear entry" onPress={() => calculatorStore.press('CE')} />
        <View style={styles.display}>
          <Text testID="calculator-expression" style={styles.expression} numberOfLines={1} ellipsizeMode="head">{display.expression || ' '}</Text>
          <Text testID="calculator-result" accessibilityLabel={`Result ${display.value}`} accessibilityLiveRegion="polite"
            style={[styles.result, state.error !== null && styles.error]} numberOfLines={1} adjustsFontSizeToFit>{display.value}</Text>
        </View>
      </View>
      <View style={styles.keypad}>
        {keys.map((row, index) => <View key={index} style={styles.row}>
          {row.map((key) => <TVButton key={key} label={glyphs[key] ?? key} accessibilityLabel={labels[key] ?? key}
            compact preferredFocus={key === '5'} selected={key === '='} style={styles.key}
            onPress={() => calculatorStore.press(key)} />)}
        </View>)}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 16 }, display: { flex: 1 },
  expression: { color: colors.muted, fontSize: 17, minHeight: 24, textAlign: 'right' },
  result: { color: colors.text, fontSize: 64, lineHeight: 76, fontVariant: ['tabular-nums'], textAlign: 'right' },
  error: { color: colors.peach }, keypad: { gap: 8 }, row: { flexDirection: 'row', gap: 8 }, key: { flex: 1 },
});
