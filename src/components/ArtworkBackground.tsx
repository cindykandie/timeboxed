import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { Artwork } from '../artwork/catalog';
import { motion } from '../theme';
import { useReducedMotion } from './MotionProvider';

function ArtworkLayer({ artwork, transition, onSettled }: {
  artwork: Artwork; transition: boolean; onSettled: () => void;
}) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(transition ? 0 : 1));
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (reduced) { animation.current?.stop(); opacity.setValue(1); }
    return () => animation.current?.stop();
  }, [opacity, reduced]);
  return (
    <Animated.Image source={artwork.source} resizeMode="cover" fadeDuration={0}
      accessible={false} style={[styles.image, { tintColor: artwork.tintColor, opacity: reduced || !transition ? 1 : opacity }]}
      onLoad={() => {
        if (!transition || reduced) { opacity.setValue(1); onSettled(); return; }
        animation.current = Animated.timing(opacity, {
          toValue: 1, duration: motion.artworkDuration, useNativeDriver: true, isInteraction: false,
        });
        animation.current.start(({ finished }) => { if (finished) onSettled(); });
      }} />
  );
}

export function ArtworkBackground({ artwork }: { artwork: Artwork }) {
  const [layers, setLayers] = useState<{ current: Artwork; previous: Artwork | null }>({ current: artwork, previous: null });
  if (layers.current.id !== artwork.id) {
    setLayers({ current: artwork, previous: layers.current });
  }
  return (
    <View testID="dashboard-artwork" pointerEvents="none" accessible={false}
      importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {layers.previous && <ArtworkLayer key={layers.previous.id} artwork={layers.previous} transition={false} onSettled={() => {}} />}
      <ArtworkLayer key={layers.current.id} artwork={layers.current} transition={!!layers.previous}
        onSettled={() => setLayers((current) => current.current.id === layers.current.id && current.previous
          ? { ...current, previous: null } : current)} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
});
