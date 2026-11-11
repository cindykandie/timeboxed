import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Text } from '../typography/Text';

import { colors, dashboardTokens, utilityAccents } from '../theme';
import type { UtilityAccent } from '../theme';
import { UtilityIcon } from './UtilityIcon';

type Props = {
  title: string;
  accent: UtilityAccent;
  available?: boolean;
  preferredFocus?: boolean;
  onPress: () => void;
};

export function UtilityCard({ title, accent, available = false, preferredFocus = false, onPress }: Props) {
  const [focused, setFocused] = useState(false);
  const screenIsFocused = useIsFocused();
  const activeFocus = focused && screenIsFocused;
  const tint = utilityAccents[accent];
  return (
    <Pressable testID={`utility-tile-${accent}`} accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={available ? `Open ${title}` : 'Not implemented yet'}
      focusable hasTVPreferredFocus={Platform.isTV && screenIsFocused && preferredFocus}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onPress}
      style={({ pressed }) => [styles.card, activeFocus && styles.focused,
        activeFocus && { borderColor: tint }, pressed && styles.pressed]}>
      <UtilityIcon name={accent} color={tint} />
      <Text style={[styles.title, activeFocus && { color: tint }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '30%', minWidth: 220, minHeight: dashboardTokens.cardHeight,
    padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: dashboardTokens.cardRadius,
    borderWidth: dashboardTokens.focusWidth, borderColor: 'transparent', backgroundColor: colors.surface },
  title: { color: colors.text, fontSize: dashboardTokens.titleSize, fontWeight: '500', textAlign: 'center' },
  focused: { backgroundColor: colors.surfaceSecondary },
  pressed: { opacity: 0.85 },
});
