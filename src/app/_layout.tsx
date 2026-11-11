import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors, motion } from '../theme';
import { MotionProvider, useReducedMotion } from '../components/MotionProvider';
import { TypographyProvider } from '../typography/TypographyProvider';

export default function RootLayout() {
  return <TypographyProvider><MotionProvider><RootNavigator /></MotionProvider></TypographyProvider>;
}

function RootNavigator() {
  const reduced = useReducedMotion();
  return (
    <>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background },
        animation: reduced ? 'none' : 'fade', animationDuration: motion.screenDuration }} />
    </>
  );
}
