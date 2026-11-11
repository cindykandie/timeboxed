import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export function FocusableItem({ children, accessibilityLabel, accessibilityHint, onPress, accent,
  style, testID, preferredFocus = false, buttonRef }: {
  children: ReactNode | ((focused: boolean) => ReactNode); accessibilityLabel: string; accessibilityHint?: string;
  onPress: () => void; accent: string; style?: StyleProp<ViewStyle>; testID?: string; preferredFocus?: boolean; buttonRef?: Ref<View>;
}) {
  const [focused, setFocused] = useState(false);
  const screenFocused = useIsFocused();
  const active = focused && screenFocused;
  return <View testID={testID} style={[styles.item, style, { borderColor: active ? accent : 'transparent' }]}>
    {/* Keep passive text outside the focus target so clocks remain readable by
        accessibility services as well as separately inspectable native text. */}
    <Pressable ref={buttonRef} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint}
      focusable hasTVPreferredFocus={Platform.isTV && screenFocused && preferredFocus}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onPress} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none">{typeof children === 'function' ? children(active) : children}</View>
  </View>;
}
const styles = StyleSheet.create({ item: { borderWidth: 2, borderRadius: 12, padding: 12, backgroundColor: 'transparent' } });
