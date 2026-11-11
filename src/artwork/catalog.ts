import type { ImageRequireSource } from 'react-native';

import { colors } from '../theme';
import { selectArtwork } from './selection';

export type Artwork = {
  id: string;
  source: ImageRequireSource;
  description: string;
  placeholder?: boolean;
  tintColor?: string;
};

// No painting exists in this checkout. This existing local image is explicitly
// temporary; add approved images with static require() entries in this catalog.
export const artworks: readonly Artwork[] = [{
  id: 'launcher-placeholder',
  source: require('../../assets/tv-banner.png'),
  description: 'Temporary existing launcher banner; a painting asset is still needed',
  placeholder: true,
  tintColor: colors.background,
}];

export const activeArtworkId = 'launcher-placeholder';

export function getDashboardArtwork(contrastPreview?: unknown): Artwork {
  const selected = selectArtwork(artworks, activeArtworkId, artworks[0]?.id ?? '');
  // Development-only contrast fixtures reuse the same bundled image. They are
  // not artwork, wallpapers, user settings or production gallery entries.
  if (__DEV__ && (contrastPreview === 'bright' || contrastPreview === 'dark')) {
    return { ...selected, id: `contrast-${contrastPreview}`,
      tintColor: contrastPreview === 'bright' ? colors.text : colors.background };
  }
  return selected;
}
