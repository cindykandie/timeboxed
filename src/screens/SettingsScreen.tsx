import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import appConfig from '../../app.json';
import { ClockSettings } from '../components/ClockSettings';
import { Screen } from '../components/Screen';
import { TimerShortcutSettings } from '../components/TimerShortcutSettings';
import { TVButton } from '../components/TVButton';
import { WorldClockSettings } from '../components/WorldClockSettings';
import { useReducedMotion } from '../components/MotionProvider';
import { useFocusTransition } from '../hooks/useFocusTransition';
import { colors, navigationTokens } from '../theme';
import { Text } from '../typography/Text';
import { useTypography } from '../typography/context';
import { familyLabels, fontFamilies } from '../typography/model';

type Section = 'appearance' | 'clock' | 'timer' | 'world-clocks' | 'general' | 'about';
const categories: readonly { id: Section; label: string }[] = [
  { id: 'appearance', label: 'Appearance' }, { id: 'clock', label: 'Clock' },
  { id: 'timer', label: 'Timer' }, { id: 'world-clocks', label: 'World Clocks' },
  { id: 'general', label: 'General' }, { id: 'about', label: 'About' },
];

export function SettingsScreen() {
  const [section, setSection] = useState<Section>('appearance');
  const [editing, setEditing] = useState<number | null>(null);
  const [preferredIndex, setPreferredIndex] = useState(0);
  const panelProgress = useFocusTransition(true);
  const back = useCallback(() => {
    if (editing !== null) setEditing(null);
    else if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [editing]);
  return <Screen compact onBack={back}>
    <View testID="settings-shell" style={styles.shell}>
      <View testID="settings-content" style={styles.content}>
        {section === 'appearance' ? <AppearanceSettings />
        : section === 'clock' ? <ClockSettings />
          : section === 'timer' ? <View testID="timer-settings" style={styles.stack}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.sage }]}>Timer</Text>
            <Text style={styles.detail}>The first shortcut is the startup duration.</Text>
            <TimerShortcutSettings editing={editing} preferredIndex={preferredIndex}
              onEdit={(index) => { setEditing(index); if (index !== null) setPreferredIndex(index); }} />
          </View> : section === 'world-clocks' ? <WorldClockSettings />
            : section === 'general' ? <GeneralSettings /> : <About />}
      </View>
      <Animated.View testID="settings-secondary-navigation" style={[styles.secondary, {
        opacity: panelProgress,
        transform: [{ translateX: panelProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }]}>
        {categories.map((item, index) => <TVButton key={item.id} label={item.label} compact quiet
          selected={section === item.id} preferredFocus={index === 0}
          accessibilityLabel={`Settings category: ${item.label}`}
          style={styles.categoryButton} onPress={() => { setEditing(null); setSection(item.id); }} />)}
      </Animated.View>
    </View>
  </Screen>;
}

function AppearanceSettings() {
  const { family, setFamily, ready, error } = useTypography();
  return <View testID="font-settings" style={styles.stack}>
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.dustyBlue }]}>Appearance</Text>
    <Text style={styles.label}>Font</Text>
    <View style={styles.choices}>{fontFamilies.map((choice) => <TVButton key={choice} label={familyLabels[choice]}
      accessibilityLabel={`Font: ${familyLabels[choice]}`} selected={family === choice} preferredFocus={family === choice}
      disabled={!ready && choice !== 'system'} quiet onPress={() => setFamily(choice)} />)}</View>
    <Text style={styles.label}>Artwork</Text>
    <Text style={styles.detail}>Default artwork · one local image available</Text>
    {(!ready || error) && <Text accessibilityLiveRegion="polite" style={styles.message}>{!ready
      ? 'Local fonts are unavailable. System font is active.' : 'Font preference could not be saved.'}</Text>}
  </View>;
}

function GeneralSettings() {
  const reduced = useReducedMotion();
  return <View testID="general-settings" style={styles.stack}>
    <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.peach }]}>General</Text>
    <View><Text style={styles.label}>Reduced motion</Text><Text style={styles.detail}>{reduced ? 'On' : 'Off'} · follows TV setting</Text></View>
    <View><Text style={styles.label}>Navigation idle</Text><Text style={styles.detail}>{navigationTokens.idleMs / 1000} seconds</Text></View>
  </View>;
}

function About() {
  return <View testID="about-settings" style={styles.stack}>
    <Text accessibilityRole="header" style={styles.sectionTitle}>TimeBoxed</Text>
    <Text style={styles.tagline}>Make every minute count.</Text>
    <Text style={styles.detail}>Version {appConfig.expo.version}</Text>
    <Text style={styles.detail}>An offline-first utility hub for the television.</Text>
  </View>;
}

const styles = StyleSheet.create({
  shell: { width: '100%', maxWidth: 1240, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', gap: 40 },
  content: { flex: 1, minWidth: 0, maxWidth: 900 },
  secondary: { width: 244, paddingVertical: 14, paddingHorizontal: 12, gap: 4,
    borderRadius: 16, backgroundColor: colors.surface },
  categoryButton: { width: '100%', justifyContent: 'flex-start', minHeight: 50 },
  stack: { gap: 16 },
  sectionTitle: { color: colors.text, fontSize: 28, fontWeight: '500' },
  tagline: { color: colors.sage, fontSize: 22 }, label: { color: colors.text, fontSize: 18 },
  detail: { color: colors.muted, fontSize: 15 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  message: { color: colors.peach, fontSize: 15 },
});
