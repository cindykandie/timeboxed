import { router, useIsFocused } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DigitalClockDisplay } from '../components/DigitalClockDisplay';
import { ScreenNavigation } from '../components/ScreenNavigation';
import { colors, navigationTokens } from '../theme';

const exitAmbient = () => router.dismissTo('/clock');

export function AmbientClockScreen() {
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  return (
    <View style={styles.screen}>
      <Pressable testID="ambient-clock" accessibilityRole="button" accessibilityLabel="Exit ambient mode"
        accessibilityHint="Select returns to Clock. Home or Back returns to the dashboard."
        focusable hasTVPreferredFocus={Platform.isTV && focused} onPress={exitAmbient}
        style={[styles.content, { width: width * 0.88 - navigationTokens.railWidth - navigationTokens.contentGap, marginLeft: width * 0.06 }]}>
        <DigitalClockDisplay ambient />
      </Pressable>
      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <ScreenNavigation />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { alignItems: 'center' },
});
