import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import type { Ref } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../typography/Text';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '../theme';
import { useFocusTransition } from '../hooks/useFocusTransition';
import { FocusHalo } from './FocusHalo';
import { ActionIcon } from './ActionIcon';
import type { ActionIconName } from './ActionIcon';

type Props = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  selected?: boolean;
  disabled?: boolean;
  primary?: boolean;
  preferredFocus?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  buttonRef?: Ref<View>;
  quiet?: boolean;
  icon?: ActionIconName;
  iconSize?: number;
};

export function TVButton({ label, onPress, accessibilityLabel, selected = false,
  disabled = false, primary = false, preferredFocus = false, compact = false, style, buttonRef, quiet = false, icon, iconSize = 24 }: Props) {
  const [focused, setFocused] = useState(false);
  const screenIsFocused = useIsFocused();
  const activeFocus = focused && screenIsFocused && !disabled;
  const progress = useFocusTransition(activeFocus);
  return (
    <Pressable
      ref={buttonRef}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      focusable={!disabled}
      disabled={disabled}
      hasTVPreferredFocus={Platform.isTV && screenIsFocused && preferredFocus && !disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={({ pressed }) => [styles.button, compact && styles.compact, quiet && styles.quiet,
        primary && styles.primary, selected && styles.selected, style,
        activeFocus && styles.focused, activeFocus && primary && styles.primaryFocused,
        pressed && styles.pressed, disabled && styles.disabled]}>
      <FocusHalo progress={progress} accent={colors.sage} radius={12} />
      {activeFocus && primary && <View pointerEvents="none" accessible={false} style={styles.primaryFocusRing} />}
      {icon && <ActionIcon name={icon} size={iconSize} color={primary ? colors.background : colors.text} />}
      {!!label && <Text style={[styles.label, primary && styles.primaryLabel, selected && !primary && styles.selectedLabel]}>
        {label}
      </Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  quiet: { backgroundColor: 'transparent' },
  compact: { paddingHorizontal: 14, minHeight: 52 },
  primary: { backgroundColor: colors.sage },
  selected: { borderColor: colors.sage, backgroundColor: colors.surfaceSecondary },
  focused: { borderColor: colors.text },
  primaryFocused: { borderColor: 'transparent' },
  primaryFocusRing: { position: 'absolute', top: -6, bottom: -6, left: -6, right: -6,
    borderRadius: 18, borderWidth: 2, borderColor: colors.text },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  label: { color: colors.text, fontSize: 20, fontWeight: '500', textAlign: 'center' },
  primaryLabel: { color: colors.background, fontWeight: '600' },
  selectedLabel: { color: colors.sage },
});
