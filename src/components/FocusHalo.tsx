import { Animated, StyleSheet } from 'react-native';

// Only the opacity animates. Focus geometry and the native focus target never
// move, and the outline on the control responds immediately to remote input.
export function FocusHalo({ progress, accent, radius }: {
  progress: Animated.Value;
  accent: string;
  radius: number;
}) {
  return (
    <Animated.View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, {
        opacity: progress, borderRadius: radius,
        backgroundColor: `${accent}0A`,
        boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 18, spreadDistance: 1, color: `${accent}24` }],
      }]} />
  );
}
