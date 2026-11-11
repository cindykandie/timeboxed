import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { TypographyContext } from './context';
import { localFonts } from './fonts';
import { typographyPreferences } from './preferenceStore';

void SplashScreen.preventAutoHideAsync();

export function TypographyProvider({ children }: PropsWithChildren) {
  const [ready, fontError] = useFonts(localFonts);
  const saved = useSyncExternalStore(typographyPreferences.subscribe, typographyPreferences.getSnapshot, typographyPreferences.getSnapshot);
  const [fallback, setFallback] = useState(false);
  const family = fallback && !ready ? 'system' : saved.family;
  const value = useMemo(() => ({ family, setFamily: typographyPreferences.setFamily, ready, error: saved.error }), [family, ready, saved.error]);
  useEffect(() => { if (ready || fontError) void SplashScreen.hideAsync(); }, [ready, fontError]);
  if (!ready && !fallback) return <View style={styles.loading}>
    {fontError && <><Text style={styles.error}>Local fonts could not be loaded.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Continue with system font" hasTVPreferredFocus
        style={({ focused }) => [styles.fallback, focused && styles.focused]}
        onPress={() => setFallback(true)}><Text style={styles.error}>Continue with system font</Text></Pressable></>}
  </View>;
  return <TypographyContext value={value}>
    <View testID={ready ? 'typography-ready' : 'typography-unavailable'} style={styles.root}>
      {children}
      <View testID={`typography-family-${family}`} pointerEvents="none" style={styles.marker} />
    </View>
  </TypographyContext>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 24 },
  error: { color: colors.text, fontSize: 20 },
  fallback: { borderWidth: 2, borderColor: 'transparent', borderRadius: 12, padding: 16 },
  focused: { borderColor: colors.sage },
  marker: { position: 'absolute', width: 1, height: 1 },
});
