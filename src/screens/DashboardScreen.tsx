import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDashboardArtwork } from '../artwork/catalog';
import { ArtworkBackground } from '../components/ArtworkBackground';
import { ScreenNavigation } from '../components/ScreenNavigation';
import { DashboardClock } from '../components/DashboardClock';
import { artDashboardTokens, colors } from '../theme';

export function DashboardScreen() {
  const { artworkPreview } = useLocalSearchParams<{ artworkPreview?: string }>();
  const artwork = getDashboardArtwork(artworkPreview);
  return (
    <View testID="art-dashboard" style={styles.screen}>
      <ArtworkBackground artwork={artwork} />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <ScreenNavigation />
        <View style={styles.clock}>
          <DashboardClock />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  overlay: { flex: 1 },
  clock: { position: 'absolute', left: artDashboardTokens.safeMargin,
    bottom: artDashboardTokens.safeMargin, maxWidth: '60%' },
});
