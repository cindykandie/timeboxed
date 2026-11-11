# Calculator, Countdown and World Clocks delivery

TimeBoxed App 01 — **Make every minute count.**

## Implementation

The work followed three sequential phases. Calculator was implemented and
validated before Countdown; Countdown's full native gate passed before World
Clocks implementation began. Existing Timer/Clock engines, theme tokens,
preferences, typed routes and Android TV configuration were retained.

- **Calculator:** exact rational arithmetic, standard operator precedence,
  decimals, percent, sign, AC/CE, backspace, bounded large numbers, recoverable
  errors and continuation with the exact previous result. The remote keypad
  starts on 5. Its session survives navigation within the running process.
- **Countdown:** multiple named events, remote keyboard/date/time entry, list,
  large detail, editing and confirmed deletion. Remaining time comes from saved
  timestamps and fresh system time; expired events stay visible at zero.
- **World Clocks:** fourteen curated IANA cities, four defaults including Nairobi,
  add/remove picker, country/timezone labels and calendar dates when different
  from the device local date. All clocks use one timestamp and the shared format.

No packages were added or upgraded. The installed `expo-file-system` module is
reused for small versioned app-private documents. Calculator remains in memory;
`countdowns.json` saves IDs/names/target/creation timestamps, and
`world-clocks.json` saves known city IDs. Both stores validate loaded data,
recover safely from corruption and report failed writes without committing a
different in-memory saved list. Clearing app data or uninstalling removes files.

Countdown entry is a Gregorian date and 24-hour time in the device's local
timezone at save time. It rejects invalid dates and spring DST gaps. Autumn
overlaps use JavaScript's earlier occurrence. Saved instants do not shift when
the device timezone changes. Countdown days are elapsed 24-hour periods.

World Clocks reuses `createClockReader` with explicit IANA zones and the same
`useClockPreferences` hook as Dashboard/Clock. Built-in Intl handles locale,
midnight and daylight-saving changes. Timezone data comes from the device runtime.
One focused one-second wall-time subscription serves all entries; background,
blur and unmount clean it up. Foreground refreshes immediately. Empty views and
editors/pickers do not tick.

All screens use the existing shared six-item adaptive rail. Main controls have
preferred focus; only one rail label can appear. Subview Back returns to the
Countdown list/editor/detail or closes the city picker; main-view Back and Home
return to Dashboard. Dashboard focus remembers the utility. Removing a city
explicitly restores focus to Add city. Reduced-motion behavior is inherited from
the existing shared controls and root transitions; no new decorative motion.

## Files for this milestone

Created:

- `src/calculator/engine.ts`, `src/calculator/store.ts`
- `src/screens/CalculatorScreen.tsx`, `src/screens/CountdownScreen.tsx`,
  `src/screens/WorldClocksScreen.tsx`
- `src/countdown/model.ts`, `src/countdown/store.ts`,
  `src/countdown/persistentStore.ts`
- `src/worldClocks/cities.ts`, `src/worldClocks/format.ts`,
  `src/worldClocks/store.ts`, `src/worldClocks/persistentStore.ts`
- `src/storage/document.ts`, `src/time/wallTime.ts`, `src/hooks/useWallTime.ts`
- `src/components/NumberField.tsx`, `src/components/RemoteNameEditor.tsx`
- `tests/calculator.test.ts`, `tests/countdown.test.ts`,
  `tests/worldClocks.test.ts`
- `tests/tv/driver.ts`, `tests/tv/calculator.test.ts`,
  `tests/tv/countdown.test.ts`, `tests/tv/worldClocks.test.ts`
- `scripts/capture-countdown-demo.ts`, `scripts/capture-world-clocks-demo.ts`
- Three stories under `docs/stories/`, this report and utility evidence under
  `artifacts/utilities/`.

Modified:

- `src/app/calculator.tsx`, `src/app/countdown.tsx`,
  `src/app/world-clocks.tsx` now export real utility screens.
- `src/components/Screen.tsx`, `src/components/NavigationRail.tsx`,
  `src/hooks/useNavigationActivity.ts`: optional subview Back behavior using the
  same rail/listeners, with default behavior preserved.
- `src/components/TVButton.tsx`: optional native button ref for focus restoration.
- `tests/tv/dashboard.test.ts`: real destinations, native focus handling and
  Timer session verification across all five utilities.
- `package.json`: TV test files run serially against one emulator.
- `README.md`: feature, remote-control, persistence, timezone and testing docs.

Retired `src/screens/UpcomingUtilityScreen.tsx` and its temporary rail-preferred
focus option once no placeholder routes remained. Pre-existing workspace changes
from earlier milestones were preserved; no native/generated configuration was
edited for these three utilities.

## Validation record

| Phase | Checks actually completed |
| --- | --- |
| Calculator | ESLint, strict TypeScript, 35 unit tests, Android export; native remote arithmetic/session test; all existing native checks passed across the initial run and two independent reruns after a hierarchy timeout. |
| Countdown | ESLint, strict TypeScript, 40 unit tests, Android export; dedicated native create/edit/multiple/restart/foreground/delete acceptance; complete TV suite: 21 passing results, zero failures/skips. |
| World Clocks | ESLint, strict TypeScript, 48 unit tests, Android export; dedicated native city management, IANA time/date comparison, format sharing, restart/foreground and Home/Back acceptance. |
| Final combined run | ESLint, strict TypeScript, all **48 unit tests**, Android Expo/Metro export and the complete TV suite passed: **22 results**, zero failures, zero skips. See `artifacts/utilities/final-tv.log`. |

The final native run includes Calculator remote arithmetic and session recovery;
Countdown remote name/date entry, multiple events, edit/delete, restart and
foreground accuracy; World Clocks add/remove, IANA time/date comparisons, shared
format changes, restart and foreground recovery; and all existing shared rail,
Timer, Clock, ambient, reduced-motion and contrast regressions. The expanded
cross-utility case preserves the same Timer session through all five utilities.
The uninterrupted final run completed successfully in approximately 21.6 minutes.

The 1920 × 1080 Android TV API 36 x86_64 AVD was used with real ADB D-pad and
Select events. Earlier long runs encountered missing accessibility roots, ADB
timeouts and emulator renderer failures. The existing AVD was restarted with
runtime-only headless/software-rendering flags, retaining its data/configuration.
Those earlier failures are recorded, not counted as passes. A fresh launcher
baseline, a missing-root read retry without recovery input, spatial keyboard
navigation and serial test files make the native harness more reliable.

Logs: `phase1-tv.log` (interrupted/failing full run), `phase2-tv.log` (full pass),
`final-unit.log`, `final-bundle.log`, and `final-tv.log`. Existing Node module-type
and Metro private-feature-flag resolution warnings remain non-blocking. A fresh
APK build was unnecessary because no native dependency/configuration changed;
native validation used the installed development build and Metro.

## Captured evidence and limitations

| Utility | 1920 × 1080 screenshot | Actual remote demo |
| --- | --- | --- |
| Calculator | [Screenshot](../artifacts/utilities/calculator.png) | [8.5-second MP4](../artifacts/utilities/calculator-demo.mp4) |
| Countdown | [Screenshot](../artifacts/utilities/countdown.png) | [40-second MP4](../artifacts/utilities/countdown-demo.mp4) |
| World Clocks | [Screenshot](../artifacts/utilities/world-clocks.png) | [50-second MP4](../artifacts/utilities/world-clocks-demo.mp4) |

Videos are native screenrecord captures at 1280 × 720; PNG dimensions and MP4
containers/durations were inspected. Screenshots were visually reviewed.
All local story/report media links were checked and resolve. No known blocking
functional bugs remain from the completed checks.

Calculator percent is literal division by 100; entries are capped at 18 digits,
and rounded 12-significant-digit displays are marked ≈. Calculator history is
not persisted. Countdown's included keyboard supports Latin capitals/digits;
targets have minute precision and there are no alarms, recurring events or
notifications. World Clocks uses the curated list rather than arbitrary search.
Device clock/timezone data determines accuracy; there is no network sync.
Fire TV and standalone release/offline startup were not tested in this milestone.

Technical stories: [Calculator](stories/calculator.md),
[Countdown](stories/countdown.md), [World Clocks](stories/world-clocks.md).
The repository implementation and actual test logs are the source of truth.
