# Editable Timer shortcuts and shared Settings

The Timer shows exactly four duration options in one row: **10 min**, **15 min**,
**45 min** and **Custom**. Play/pause and reset remain icon controls. Custom
duration retains its existing functionality.

Open the bottom-right gear, choose **Timer shortcuts**, then choose slot 1, 2 or
3. Adjust hours, minutes and seconds with D-pad and Select, then Save. The range
is the existing Timer range: 1 second through 23:59:59. Zero cannot be saved.
Cancel or Back leaves the draft unapplied. The edited slot receives focus again
when returning to the shortcuts list. Shortcuts preserve their configured order;
the first slot supplies the startup duration.

## Persistence and session behaviour

`timer-preferences.json` in app-private document storage contains version 1 and
three durations in milliseconds. The existing `localDocument` adapter is reused;
no dependency or backend was added. Missing data defaults to 10/15/45 minutes.
Malformed data recovers to those defaults with Settings feedback. A failed save
retains the previous effective values, leaves the editor open and allows retry.

The app's single Timer session starts from the saved first shortcut. Editing a
shortcut currently selected by a ready timer updates that ready duration.
Running, paused and completed sessions remain untouched, including their
deadline, remaining time and original duration. A custom duration that does not
match an old shortcut remains unchanged. Reset continues to restore the current
session's original duration; select a new shortcut to adopt its edited value.

The existing reducer, background-aware timing and `watchTimer` lifecycle are
reused. `createTimerStore` accepts an initial duration, and the small session
coordinator listens for preference changes only to reconcile ready shortcuts.
It creates no intervals. `session.ts` owns the one app-process instance shared by
Timer and Custom duration, keeping native storage imports out of pure unit tests.

## Settings everywhere

`ScreenNavigation` combines the existing six-item `NavigationRail` with the same
`SettingsButton` on all screens. `Screen` mounts it for normal utilities, Custom
duration and Settings; Dashboard and ambient Clock mount it in their existing
safe-area overlays. The gear stays at the same bottom-right safe-area position,
outside scrolling content. There is one gear per screen.

Down from Home reaches Settings, and Up from Settings reaches Home. Explicit
native focus destinations prevent the content ScrollView's TV focus guide from
intercepting those two movements. The six rail items keep their order, routes,
single-focus labels and inactivity behaviour. Left still reaches main controls.

Selecting the gear while already in Settings does not push another route.
Android TV Back first cancels an editor, then leaves the shortcuts panel, then
returns to the screen that opened Settings. This also preserves an unapplied
Custom-duration draft when opening Settings and returning. Home still returns
to Dashboard. Font settings and their saved choice are preserved.

## Files

- New: `src/timer/preferences.ts`, `preferenceStore.ts`, `session.ts`;
  `src/components/TimerShortcutSettings.tsx`, `ScreenNavigation.tsx`;
  preference unit tests and the native Timer/Settings regression.
- Updated: Timer preset defaults, store initialization/session coordination,
  `useTimer`, Timer and Custom duration screens; Settings screen;
  Screen/Dashboard/ambient navigation mounts, SettingsButton, NavigationRail;
  existing native test expectations/helpers, README and documentation.
- No package upgrades, new dependencies, theme-token changes or Android TV
  configuration changes.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npx expo export --platform android
TV_SCREENSHOT_DIR=artifacts/timer-shortcuts node --experimental-strip-types --test tests/tv/timerPreferences.test.ts
TV_SCREENSHOT_DIR=artifacts/timer-shortcuts node --experimental-strip-types --test tests/tv/timerControls.test.ts
```

The preference unit tests cover defaults, second/hour formatting, every slot,
restart persistence, malformed data, invalid boundaries, read/write failures,
subscription cleanup and preserving active/paused/completed sessions.

The focused native regression checks the one-row layout, all duration choices,
editing and process-restart recovery, ready/running/paused session behaviour,
Custom draft recovery, gear bounds and Select/Back navigation across all screen
types. The existing icon-control regression checks play/pause/resume/reset,
Custom duration, completion and restart against the revised defaults.

The completed main regression is recorded in
[tv.log](../artifacts/timer-shortcuts/tv.log): **1 passed, 0 failed, 0 skipped**
on the 1920 × 1080 Android TV emulator. It verified the saved 11-minute startup
value and preserved running/paused sessions during further edits, then restored
the configured 10/15/45 defaults. Gear position and Back-to-origin behaviour
passed on normal utilities, Custom duration, Settings panels and ambient Clock.

Earlier attempts exposed ScrollView focus interception between Home and the
gear. Bidirectional native focus destinations fixed that issue. A test also sent
two Back events before the settings-panel transition rendered; the test now
waits for the intermediate panel before the second Back. The complete corrected
regression was rerun; earlier failed attempts are not counted as passes.

Current captures: [Timer](../artifacts/timer-shortcuts/timer.png),
[edited ready Timer](../artifacts/timer-shortcuts/timer-edited.png),
[shortcuts list](../artifacts/timer-shortcuts/shortcuts.png),
[editor](../artifacts/timer-shortcuts/shortcut-editor.png),
[Settings](../artifacts/timer-shortcuts/settings.png),
[Clock](../artifacts/timer-shortcuts/clock.png),
[Calculator](../artifacts/timer-shortcuts/calculator.png),
[Countdown](../artifacts/timer-shortcuts/countdown.png),
[World Clocks](../artifacts/timer-shortcuts/world-clocks.png),
[ambient Clock](../artifacts/timer-shortcuts/ambient.png) and
[Dashboard](../artifacts/timer-shortcuts/dashboard.png).

The captures are actual native emulator screenshots. The user's existing font
and clock-format selections were retained. No native APK rebuild or physical
TV/Fire TV validation was performed for this JavaScript-only update.

Final checks passed: ESLint, strict TypeScript, all **58 unit tests**, Android
Expo/Metro export, and the existing Timer-control native regression
([tv-controls.log](../artifacts/timer-shortcuts/tv-controls.log): **1 passed,
0 failed, 0 skipped**). Together the two executed native regressions cover the
new preference/navigation flow and the retained play/pause/resume/reset,
20-second custom completion and restart behaviour. The full multi-utility TV
suite was not rerun; its preset expectations/helpers were updated for the new
defaults and Settings focus target.
