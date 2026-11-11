import { router, useFocusEffect, useIsFocused, usePathname } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useFocusTransition } from '../hooks/useFocusTransition';
import { useNavigationActivity } from '../hooks/useNavigationActivity';
import { getDashboardFocus, navigationItems, rememberUtility, utilityForPath } from '../navigation/items';
import type { NavigationId } from '../navigation/items';
import { colors, navigationTokens as layout, utilityAccents } from '../theme';
import { UtilityIcon } from './UtilityIcon';
import { useTypographyStyle } from '../typography/context';

const colorFor = (id: NavigationId) => id === 'home' ? colors.text : utilityAccents[id];

function RailIcon({ id, focused, expanded }: { id: NavigationId; focused: boolean; expanded: boolean }) {
  const progress = useFocusTransition(expanded);
  return (
    <View pointerEvents="none" style={styles.iconContainer}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.focusOutline, {
        borderColor: focused ? colorFor(id) : 'transparent',
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1],
          outputRange: [layout.compactContainerSize / layout.focusedContainerSize, 1] }) }],
      }]} />
      <Animated.View style={{ transform: [{ scale: progress.interpolate({ inputRange: [0, 1],
        outputRange: [layout.compactIconSize / layout.focusedIconSize, 1] }) }] }}>
        <UtilityIcon name={id} color={colorFor(id)} size={layout.focusedIconSize} strokeWidth={focused ? 3.8 : 3.2} contrast />
      </Animated.View>
    </View>
  );
}

function RailLabel({ id }: { id: NavigationId }) {
  const typography = useTypographyStyle();
  const progress = useFocusTransition(true);
  const index = navigationItems.findIndex((item) => item.id === id);
  return (
    <Animated.Text testID={`navigation-label-${id}`} pointerEvents="none" accessible={false} numberOfLines={1}
      style={[styles.label, typography, { top: index * layout.rowPitch, color: colorFor(id), opacity: progress,
        transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}>
      {navigationItems[index].title}
    </Animated.Text>
  );
}

export function NavigationRail({ onBack, onHomeLayout, settingsTarget }: { onBack?: () => void; onHomeLayout?: (target: number) => void; settingsTarget?: number }) {
  const path = usePathname();
  const dashboard = path === '/';
  const screenFocused = useIsFocused();
  const current = utilityForPath(path);
  const [focused, setFocused] = useState<NavigationId | null>(null);
  const [timerTarget, setTimerTarget] = useState<number>();
  const refs = useRef(new Map<NavigationId, View>());
  const { active, interact } = useNavigationActivity(dashboard, onBack);
  useFocusEffect(useCallback(() => {
    if (dashboard) {
      const initial = getDashboardFocus();
      setFocused(initial);
      refs.current.get(initial)?.requestTVFocus();
    }
  }, [dashboard]));
  const open = (item: typeof navigationItems[number]) => {
    interact();
    rememberUtility(item.id);
    if (item.route === path) return;
    if (item.id === 'home') router.dismissTo('/');
    else router.navigate(item.route);
  };
  const labelled = screenFocused && active ? focused : null;
  return (
    <View testID="navigation-rail" style={styles.rail}>
      {/* A single keyed label prevents overlapping old/new labels during fades. */}
      {labelled && <RailLabel key={labelled} id={labelled} />}
      {navigationItems.map((item, index) => (
        <Pressable key={item.id} ref={(node) => { if (node) refs.current.set(item.id, node); else refs.current.delete(item.id); }}
          testID={`navigation-button-${item.id}`} accessibilityRole="button" accessibilityLabel={item.title}
          nextFocusUp={item.id === 'timer' ? timerTarget : undefined}
          nextFocusDown={item.id === 'home' ? settingsTarget : undefined}
          onLayout={(item.id === 'home' && onHomeLayout) || item.id === 'timer' ? (event) => {
            const native = event.nativeEvent;
            if ('target' in native && typeof native.target === 'number') {
              if (item.id === 'timer') setTimerTarget(native.target);
              else onHomeLayout?.(native.target);
            }
          } : undefined}
          accessibilityHint={item.id === 'home' ? 'Return to the TimeBoxed dashboard' : `Open ${item.title}`}
          accessibilityState={{ selected: item.id === current }} focusable
          hasTVPreferredFocus={Platform.isTV && screenFocused && dashboard && item.id === getDashboardFocus()}
          onFocus={() => { setFocused(item.id); interact(); }}
          onBlur={() => setFocused((previous) => previous === item.id ? null : previous)}
          onPointerEnter={(event) => {
            if (event.nativeEvent.pointerType !== 'touch') { refs.current.get(item.id)?.requestTVFocus(); interact(); }
          }}
          onPress={() => open(item)}
          style={({ pressed }) => [styles.button, { top: index * layout.rowPitch }, pressed && styles.pressed]}>
          <RailIcon id={item.id} focused={screenFocused && focused === item.id} expanded={labelled === item.id} />
        </Pressable>
      ))}
      <View testID={labelled ? 'navigation-expanded' : 'navigation-compact'} pointerEvents="none" style={styles.marker} />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', top: layout.safeMargin, right: layout.safeMargin,
    width: layout.railWidth, height: layout.rowPitch * navigationItems.length },
  button: { position: 'absolute', right: 0, width: layout.controlSize, height: layout.controlSize,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  iconContainer: { width: layout.focusedContainerSize, height: layout.focusedContainerSize,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  focusOutline: { borderWidth: 1, borderRadius: 9 },
  label: { position: 'absolute', right: layout.controlSize + layout.labelGap, width: layout.labelWidth,
    height: layout.controlSize, lineHeight: layout.controlSize, textAlign: 'right', fontSize: layout.labelSize, fontWeight: '500',
    textShadowColor: colors.artworkInk, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  pressed: { opacity: 0.8 },
  marker: { width: 1, height: 1 },
});
