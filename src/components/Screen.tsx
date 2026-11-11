import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, navigationTokens } from '../theme';
import { ScreenNavigation } from './ScreenNavigation';

export function Screen({ children, compact = false, onBack }: PropsWithChildren<{ compact?: boolean; onBack?: () => void }>) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView testID="utility-content" style={{ marginRight: width * 0.06 + navigationTokens.railWidth + navigationTokens.contentGap }}
        contentContainerStyle={[styles.content, { paddingLeft: width * 0.06 }, compact && styles.compact]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <ScreenNavigation onBack={onBack} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingVertical: 28, justifyContent: 'center' },
  compact: { paddingBottom: 20 },
});
