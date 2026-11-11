# Central Settings and manual Clock

TimeBoxed now exposes one central Settings route with six sections: Appearance,
Clock, Timer, World Clocks, General and About. The lower-right gear remains the
entry point on every route. Settings uses an expandable secondary navigation
panel immediately beside the persistent primary rail; selecting a category only
changes the spacious main content region. The primary rail never disappears.
Back closes an active editor first, then closes Settings and returns to the screen
that opened it. Selecting the Settings gear again also toggles the panel closed.

Settings does not copy preference state. Appearance uses the existing typography
store, Timer uses the existing shortcut store, World Clocks uses the existing
city store, and Clock uses the expanded clock preference store. Changes publish
immediately to every subscriber and remain offline in app-private versioned JSON.

## Clock source

Automatic reads the device wall clock on every refresh. Manual stores two values:
the chosen clock timestamp and the real system timestamp at which it was saved.
The displayed value is `chosen + (current system time - saved system time)`. It
therefore advances naturally, recovers immediately after backgrounding, and does
not depend on interval callback counts. It never changes Android's system clock.

Manual date/time is entered in the device's local timezone. Invalid calendar
dates and nonexistent local times are rejected. The shared 12/24-hour choice
controls Clock, ambient Clock, Dashboard and World Clocks. Manual mode is marked
quietly on Clock and Dashboard. Returning to Automatic immediately resumes the
actual device time. Version-one format-only preferences migrate to Automatic.

Clock retains its compact 12h/24h selector. Ambient entry is now an icon-only
fullscreen control with the accessibility label **Enter ambient mode**. Select
enters ambient mode; Select on the ambient clock returns to Clock, while Android
TV Back keeps the existing dashboard behavior.

## Settings scope

- Appearance: bundled font selection and the current single local artwork status.
- Clock: source, manual date/time, format and detected device timezone.
- Timer: the three shared shortcuts; the first remains the startup duration.
- World Clocks: the same selected-city store used by the utility screen.
- General: live system reduced-motion state and the current 10-second navigation idle value.
- About: name, tagline, description and version read from `app.json`.

There is no timezone override, artwork picker, sound/completion setting or manual
motion override yet. Only one placeholder artwork is bundled; reduced motion is
still governed by the TV accessibility setting. These omissions avoid controls
that would have no honest effect.

## Validation

- ESLint: passed.
- Strict TypeScript: passed.
- Unit tests: 60 passed, including manual persistence, elapsed-time advancement,
  Automatic recovery, version-one migration and corrupted reference recovery.
- Android Expo/Metro export: passed.
- Expandable-navigation Android TV validation: Appearance and Clock were opened
  with D-pad input and captured at 1920×1080 with the primary rail, secondary
  categories and content visible together. The focused automated run reached and
  captured Appearance, then the legacy UI Automator hierarchy helper failed while
  moving to Timer. Clock was subsequently opened and captured using direct native
  key events, but the complete native regression could not be reported as passing.
- Earlier full Android TV suite: attempted; 16 of 26 checks completed successfully
  before repeated ADB/UI Automator timeouts. That run exposed a real Timer-rail Up
  focus wrap to Settings, which was fixed by pinning the top rail item's Up target.
- Emulator: Android TV 1920×1080. No physical TV or Fire TV validation.

Screenshots are under [`artifacts/central-settings`](../artifacts/central-settings/).
