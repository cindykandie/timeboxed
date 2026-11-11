import { router, useIsFocused, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, navigationTokens } from '../theme';
import { Text } from '../typography/Text';
import { ActionIcon } from './ActionIcon';

export function SettingsButton({ upTarget, onLayoutTarget }: { upTarget?: number; onLayoutTarget?: (target: number) => void }) {
  const [focused, setFocused] = useState(false);
  const path = usePathname();
  const active = useIsFocused() && focused;
  return <View style={styles.position}>
    {active && <Text pointerEvents="none" accessible={false} style={styles.label}>Settings</Text>}
    <Pressable testID="settings-button" accessibilityRole="button" accessibilityLabel="Settings"
      nextFocusUp={upTarget}
      onLayout={onLayoutTarget ? (event) => {
        const native = event.nativeEvent;
        if ('target' in native && typeof native.target === 'number') onLayoutTarget(native.target);
      } : undefined}
      focusable onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => {
        if (path !== '/settings') router.push('/settings');
        else if (router.canGoBack()) router.back();
        else router.replace('/');
      }}
      style={[styles.button, active && styles.focused]}>
      <ActionIcon name="settings" size={30} color={active ? colors.sage : colors.muted} />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  position: { position: 'absolute', right: navigationTokens.safeMargin, bottom: navigationTokens.safeMargin },
  button: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  focused: { borderColor: colors.sage },
  label: { position: 'absolute', right: 60, width: 148, height: 48, lineHeight: 48, textAlign: 'right',
    color: colors.text, fontSize: 20, fontWeight: '500', textShadowColor: colors.artworkInk,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
});
