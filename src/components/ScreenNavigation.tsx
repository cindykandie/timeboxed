import { useState } from 'react';

import { NavigationRail } from './NavigationRail';
import { SettingsButton } from './SettingsButton';

// Keep both controls inside the active screen's native focus hierarchy. Explicit
// edges prevent a ScrollView's focus guide from intercepting Home <-> Settings.
export function ScreenNavigation({ onBack }: { onBack?: () => void }) {
  const [homeTarget, setHomeTarget] = useState<number>();
  const [settingsTarget, setSettingsTarget] = useState<number>();
  return <>
    <NavigationRail onBack={onBack} onHomeLayout={setHomeTarget} settingsTarget={settingsTarget} />
    <SettingsButton upTarget={homeTarget} onLayoutTarget={setSettingsTarget} />
  </>;
}
