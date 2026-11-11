import { StyleSheet, Text as NativeText } from 'react-native';
import type { TextProps } from 'react-native';

import { useTypographyStyle } from './context';

// One font choice across the app. System preserves native typography; unsupported
// backspace stays native. Existing layout, accessibility and props are forwarded.
export function Text(props: TextProps) {
  const typography = useTypographyStyle();
  const fallback = props.children === '⌫';
  return <NativeText {...props} style={[props.style, typography && !fallback && {
    ...typography, fontWeight: StyleSheet.flatten(props.style)?.fontWeight ?? '400',
  }]} />;
}
