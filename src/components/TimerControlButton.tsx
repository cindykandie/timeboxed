import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { colors } from '../theme';
import { ActionIcon } from './ActionIcon';
import type { ActionIconName } from './ActionIcon';

type Props = {
  accessibilityLabel: string;
  icon: Extract<ActionIconName, 'play' | 'pause' | 'reset'>;
  onPress: () => void;
  preferredFocus?: boolean;
  primary?: boolean;
};

export function TimerControlButton({ accessibilityLabel, icon, onPress,
  preferredFocus = false, primary = false }: Props) {
  const [focused, setFocused] = useState(false);
  const screenIsFocused = useIsFocused();
  const activeFocus = focused && screenIsFocused;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      focusable
      hasTVPreferredFocus={Platform.isTV && screenIsFocused && preferredFocus}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [styles.control, activeFocus && styles.focused, pressed && styles.pressed]}
    >
      <ActionIcon name={icon} size={primary && activeFocus ? 32 : 28} color={primary ? colors.sage : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    width: 64,
    height: 64,
    padding: 0,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  focused: { borderColor: colors.sage },
  pressed: { opacity: 0.82 },
});
