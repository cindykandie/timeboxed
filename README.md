# TimeBoxed

App 01 of the public challenge **50 Apps. 50 Problems. One Developer.** TimeBoxed is an offline-first utility hub for Android TV and Google TV. **Make every minute count.** Amazon Fire TV support is planned and has not been validated yet.

The dashboard is an image-led display: a bundled image fills the screen and a discreet local clock with weekday/date sits at bottom left. There are no cards, header, badges or footer. A shared transparent navigation rail sits in the top-right safe area on every screen, in this exact order: **Timer**, **Clock**, **Calculator**, **Countdown**, **World Clocks**, **Home**.

The six line icons never disappear. Only the native focused item can show a label, immediately to its left; the previous label is removed before the new label fades in. Main-content focus means no navigation label. Up/Down moves through the rail, Left returns to utility controls, and Right from the content reaches the rail. Select opens the destination. Home and Android TV Back return to Dashboard from utility screens. When entered through the rail, the last opened utility receives dashboard focus. Back at Dashboard still returns to the TV launcher.

After **10 seconds** without interaction, every label disappears, the focused icon reduces from 36 dp to 30 dp and its visible focus outline reduces from 44 dp to 36 dp. Other icons remain 30 dp. A subtle outline identifies native focus even while compact. The 48 dp hit targets, six row positions, reserved label space and top-right anchor stay fixed, so the rail never jumps or collapses. Directional/Select remote input renews the full timeout even when native focus does not move. Only the newly focused item expands when interaction resumes. Reduced motion makes these transitions immediate.

`NavigationRail.tsx` is the single navigation implementation. `Screen.tsx` mounts it outside scrolling utility content; Dashboard and ambient Clock mount the same component over their layouts. Utility content reserves the rail's full label width to avoid overlap. A route-scoped activity controller owns at most one cancellable timeout, one TV input subscription, one app-state subscription and (on utilities) one Back subscription. Blur/unmount removes them; backgrounding pauses the timeout, and foreground return starts a fresh 10-second period. Timer and Clock timing remain independent.

All five utilities are implemented: Timer, Clock, Calculator, Countdown and World Clocks. Dashboard, Clock, ambient Clock and World Clocks share one saved 12/24-hour preference.

[Utility milestone implementation, changed files, validation and media](docs/utilities-delivery.md).

**Satoshi is the default font.** Open the lower-right Settings gear with D-pad
and Select. Central Settings contains **Appearance**, **Clock**, **Timer**,
**World Clocks**, **General** and **About**. Appearance offers **Satoshi**,
**Clash Display**, **Cabinet Grotesk** and **System**; the selected font applies
throughout the app and is saved locally. Back closes the current settings section
before returning to the screen that opened Settings; Home returns to Dashboard.
[Font settings, supplied weights, licensing and validation](docs/font-settings.md).

The bottom-right Settings gear is always visible on Dashboard, all five utilities,
Custom duration, ambient Clock and Settings itself. Down from the rail's Home
item reaches Settings; Up returns to Home. **Settings → Timer** edits
the three saved duration choices. Back cancels an unapplied editor draft and
returns through the settings panels before returning to the originating screen.
[Timer shortcuts and shared Settings implementation](docs/timer-shortcuts.md).

Clock supports **Automatic** device time and an app-local **Manual** source in
**Settings → Clock**. Manual mode saves a reference clock timestamp and advances
it from elapsed real time, including across backgrounding and restarts; it never
changes the television's system clock. The same source and 12/24-hour preference
feed Dashboard, Clock, ambient Clock and World Clocks. The Clock screen retains
its quick format selector and now uses an icon-only fullscreen control for ambient
mode. [Architecture, limits and validation](docs/central-settings.md).

The supplied font files are bundled locally; they are not redistributed as raw
files in the public source repository. See [assets/fonts](assets/fonts/README.md).

The release-candidate refinement removes promotional/helper copy and redundant
utility headings. Timer uses one row of three saved shortcuts plus Custom; Clock has a
compact **12h / 24h** selector and fullscreen icon. Countdown management is in
the detail screen's **•••** menu. World Clock entries reveal their timezone and
small trash action only when focused; Select opens a removal confirmation.
The six-icon navigation rail, saved data and utility engines are unchanged.
[UI refinement comparison and validation](docs/release-candidate-ui.md).
All six requested 1080p views are in the
[before/after gallery](artifacts/release-candidate/comparison.html). ESLint,
strict TypeScript, 48 unit tests and Android export passed. Every individual TV
regression check passed across the complete run and a corrected dashboard-file
rerun (19/19 in that rerun); the report records the earlier assertion/automation
failures rather than describing the original complete command as green.

**Artwork limitation:** no paintings or neutral artwork assets exist in this checkout. The existing local launcher banner is temporarily tinted to midnight so its enlarged logo no longer dominates the screen. This neutralized bundled image is only a placeholder, not a painting. No artwork was downloaded or generated. Add approved bundled paintings through the [artwork catalog](assets/artwork/README.md); final painting quality and contrast still need review once those assets exist.

`src/artwork/catalog.ts` registers local image sources and the active ID. `ArtworkBackground` uses centered `cover`, preserving proportions with no empty edges, and crossfades changed artwork IDs over 450 ms (immediate with reduced motion). Future selection/rotation can supply an artwork prop without rewriting the dashboard. No wallpaper settings or rotation UI is included. Development-only `/?artworkPreview=bright` and `/?artworkPreview=dark` reuse the image with a tint for contrast checks; production ignores those parameters.

## Calculator

Open Calculator from the shared rail. Use D-pad and Select on the five-row keypad;
**CE** is beside the display. The initial focus is **5**. AC clears the calculation, CE clears
only the entry, ⌫ deletes the last digit/operator, ± changes sign, and % divides
the current entry/result by 100. Standard multiplication/division precedence is
used, so `2 + 3 × 4 = 14`. Operators replace a pending operator; an incomplete
expression or division by zero shows a recoverable error. Digits begin a new
calculation after Equals; operators continue using the previous exact result.

The engine uses reduced BigInt fractions, not JavaScript eval or floating-point
intermediate values. It displays up to 12 significant digits and marks rounded
values with **≈**, while continuing calculations with the exact underlying value.
Entry length is capped at 18 digits; very large computed results use scientific
notation and bounded arithmetic. Percent is a literal division by 100, so
`200 + 10% = 200.1`. Backspace after a completed result clears it. Repeated Equals
leaves the result unchanged. Calculator state survives navigation in the current
process; a force-stop/restart clears it. No calculator history is persisted.

[Calculator development story, decisions and evidence](docs/stories/calculator.md).

## Event Countdown

Select **Countdown** in the shared rail, then **New countdown**. Select the event
name to use the included remote keyboard (A–Z, digits, Space, Delete and Clear;
up to 40 characters). D-pad moves between keys and date/time minus/plus controls;
Select activates them. Date entry is Gregorian year/month/day and time entry is
24-hour. Save validates the name, calendar date and future target. Invalid dates
and nonexistent daylight-saving times are rejected rather than silently moved.

The list supports multiple saved events with name, remaining time and target
date. Open an event for its larger display. Select **•••** for **Edit** or
**Delete**; deletion requires confirmation. Back closes a
keyboard/editor/detail/confirmation before returning from the list to Dashboard.
Home always returns to Dashboard. Unapplied edits are drafts.

Targets are interpreted in the **device's local timezone at save time**, then
stored as absolute timestamps. Changing timezone later changes the displayed
target date/time, not the instant of the event. During an autumn daylight-saving
overlap, JavaScript selects the earlier occurrence of the repeated local time.
Days mean elapsed 24-hour periods, not calendar-day boundaries. Remaining time
is calculated from `targetAt - Date.now()` once per second while visible, with an
immediate foreground refresh; it never decrements a stored seconds counter.
Expired events show **Event started**, never negative values, and remain saved.

`countdowns.json` uses the existing `expo-file-system` app-private document
approach, with versioned records containing ID, name, target and creation
timestamps. Saves survive navigation, backgrounding and normal restarts. Stored
data is validated; valid records can be recovered from partially damaged data.
Read/save failures show feedback, and failed writes keep the previous saved list.
Uninstalling or clearing app data removes events. No network or notifications
are involved. The included keyboard currently supports Latin capitals/digits;
this initial version has no recurring events or alarm/scheduling service.

[Countdown development story and evidence](docs/stories/countdown.md).

## World Clocks

Select **World Clocks** in the shared rail. Nairobi, London, New York and Tokyo
are selected initially. **Add city** opens a curated remote-friendly list; D-pad
and Select add a city, with no typing required. Focus a city to reveal its small
trash/Remove action and IANA timezone. Select opens a confirmation; **Cancel**
returns focus to that city, and confirmed removal returns focus to Add city.
Back cancels removal or closes the picker, then returns
from the main view to Dashboard. Home always returns to Dashboard.

The 14 supported cities are Nairobi, London, New York, Los Angeles, Toronto,
Dubai, Mumbai, Tokyo, Singapore, Sydney, Johannesburg, Lagos, Paris and Hong Kong.
Each entry shows the city, a quiet country label and live time. The IANA timezone
appears on focus. Its calendar date
appears when it differs from the device's local date. More than four cities may
require scrolling; focused controls scroll into view. All cities can be removed,
and an intentionally empty selection stays empty after restart.

City times reuse Clock's locale-aware `Intl.DateTimeFormat` reader with an
explicit IANA `timeZone`, never a fixed offset. Daylight-saving and date changes
follow the device runtime's timezone database. One current system timestamp
updates all visible clocks once per second; background/blur stop the interval,
and foreground return refreshes immediately. The picker and empty view do not
tick. Change 12/24-hour format on **Clock**; World Clocks uses that same saved
choice immediately. There is no independent format setting.

Selected city IDs are saved in versioned `world-clocks.json` using the existing
app-private FileSystem storage. Missing/unreadable/fully invalid data falls back
to the defaults with feedback; partially valid selections retain known cities
without duplicates. Failed writes retain the previous saved selection. City
choices survive normal app restarts; uninstalling/clearing app data removes them.
Unsupported timezone data shows **Time unavailable** for that city rather than
crashing the screen. This is a curated offline list, with no city search service
or network time synchronization.

[World Clocks development story and evidence](docs/stories/world-clocks.md).

## Digital Clock

Select **Clock** on the dashboard with the D-pad and Select. The standard Clock screen shows live time, the full weekday, the calendar date and a readable IANA timezone label. The always-visible Home rail item returns to the hub; Android TV Back also returns directly to the dashboard. Timer sessions continue to elapse independently while you use Clock.

**12h** includes the locale's AM/PM day period, including correct midnight and noon. **24h** displays midnight as `00:00:00`. The compact segmented control retains a sage selection indicator, separate from the cream remote-focus outline. The default is 24-hour. The format applies to Dashboard, Clock, ambient Clock and World Clocks immediately.

**Settings → Clock** switches between Automatic and Manual. Automatic continues
to read the device clock. Manual accepts local year, month, day, hour and minute,
then advances from a saved clock/system timestamp pair. Foreground return and
normal restart calculate elapsed wall time immediately instead of replaying missed
ticks. Manual mode is marked on Clock and Dashboard and remains in the detected
device timezone. Selecting Automatic returns every TimeBoxed clock to device time;
neither mode changes Android's clock or timezone.

The project previously had no persistent preferences. Milestone 5 adds only the SDK-compatible `expo-file-system` module (`~58.0.13`) for a tiny versioned JSON file, `clock-preferences.json`, in `Paths.document` (app-private persistent storage). The existing external-store pattern keeps the choice shared across routes. Reads/writes are synchronous and limited to this small setting, so there is no async hydration or write-order race. Preferences survive force-stop, process restart and app updates; clearing app data or uninstalling removes them. Missing preferences use 24-hour. Invalid or unreadable preferences fall back safely; visible feedback allows saving again. A write failure retains the selected format for the current process and shows that it could not be saved.

**Rebuild the development app after installing this milestone** (`npm run android -- --device emulator-5554`); an older native build does not contain FileSystem. Expo, React Native TV and all previously installed package versions are retained. No native TV plugin configuration was changed.

### Ambient mode

Select the fullscreen icon on Clock. It opens a full-screen clock with generous dark space, a dominant time display, a secondary date and a subtle timezone. The icon has the accessibility label **Enter ambient mode**. Settings controls are hidden; the same six-icon rail remains visible at top right.

- **Select** on the focused clock display exits to standard Clock and restores focus to **Enter ambient mode**.
- **D-pad Right** moves from the clock display into the rail. Up/Down chooses a utility or Home; **Select** on Home returns to the dashboard. Left returns to the clock display.
- **Back** returns directly to the dashboard, including when ambient was opened directly through its route. Home/Back restore the Clock dashboard icon when entered from there. Navigation never requires hover or a hidden control.
- Ambient does not change the saved time format. It is a route, not a persistent startup preference.

The existing reduced-motion provider applies to Clock digits, focus feedback and native route fades. With Reduce Motion enabled, the displayed time and focus still update immediately, without animated transitions.

### Accuracy and lifecycle

`createClockReader` formats a fresh `Date.now()` using built-in `Intl.DateTimeFormat`; the app never increments a clock counter. Locale and timezone come from `Intl.DateTimeFormat().resolvedOptions()` on the device, with `hourCycle: 'h12'` or `'h23'` according to the saved choice. Date and day-period formatting use the same locale/timezone as time. The timezone label is the detected IANA identifier, not an abbreviation or a fixed UTC offset. Formatters are cached by locale, timezone and time format, then rebuilt when those values change. Date, hour, midnight, daylight-saving and timezone changes are accounted for by the next wall-clock read.

Each focused clock display owns one app-state listener and at most one one-second interval. Backgrounding, route blur and unmount dispose the interval. Foreground return refreshes immediately from device time, even if callbacks were delayed or the date changed while away. Repeated active events do not start duplicate intervals. The lifecycle helper is unit-tested with injected activity and scheduler sources; the existing timer state machine and lifecycle hook are unchanged.

Known limits: device clock accuracy and device timezone settings determine what is shown; there is no network time synchronization or custom timezone selector. TV screensaver/power policy remains controlled by the device. Fire TV and a standalone release/offline build require separate device validation; the native development build and production JavaScript export are checked below.

Android TV screenshots at 1920 × 1080 are under `artifacts/adaptive-rail/`: [dashboard compact](artifacts/adaptive-rail/dashboard-compact.png), [dashboard focused](artifacts/adaptive-rail/dashboard-focused.png), [Timer compact](artifacts/adaptive-rail/timer-compact.png), [Timer focused](artifacts/adaptive-rail/timer-focused.png), [Clock compact](artifacts/adaptive-rail/clock-compact.png), [Clock focused](artifacts/adaptive-rail/clock-focused.png). The dashboard currently shows the neutral placeholder described above. Earlier screenshot folders retain their milestone's previous design for reference.

## Visual design and motion

Palette, per-utility accents, dashboard dimensions and motion timings live in `src/theme.ts`. Timer uses sage, Clock lavender, Calculator dusty blue, Countdown peach, and World Clocks buttercream. Navigation icons have transparent backgrounds on every screen. A dark under-stroke keeps the pastel line icons readable over bright images; labels and clock use restrained text shadows. Focus subtly enlarges one icon and its thin pastel outline, and reveals its label with a 160 ms opacity/short horizontal transition. There are no filled icon tiles, large borders or glow. Only one label component is mounted, preventing overlapping labels during focus changes. The icons reuse React Native primitives in `UtilityIcon.tsx`; no icon package was installed.

Existing utility buttons retain their reduced-motion-aware focus halo. Selected durations retain their sage indicator. Filled primary buttons use a cream outer focus ring with a small gap to keep focus distinct from the sage fill.

The clock uses lighter tabular digits, with subdued seconds. Only changed digits ease from 72% to full opacity over 180 ms; new values remain readable immediately. Dates, timezone labels and unchanged digits stay still. Expo Router uses a native fade between existing screens (Android controls the native transition duration; iOS uses the configured 220 ms).

One `MotionProvider` observes the device's Reduce Motion setting. With motion reduced, focus feedback and clock updates are immediate and screen transitions are disabled. Preference changes also apply while the app is open. Clock/focus animations use React Native's native opacity driver, do not block interactions, and stop on cleanup. No animation dependency was added. Timer state, clock scheduling, typed routes and native TV configuration are unchanged by the visual refinement.

## Timer features

- Four duration options: **10 min, 15 min, 45 min and Custom**. Edit the three shortcuts in **Settings → Timer shortcuts** using the remote-friendly hours/minutes/seconds controls. Changes survive app restarts; the first shortcut is the startup duration. Ready timers follow edits to their selected shortcut; running, paused and completed sessions retain their original duration and state.
- Custom duration: remote-friendly hours, minutes and seconds steppers, from **1 second to 23:59:59**. Select the plus/minus buttons to change each field; values wrap at their boundaries. Zero duration cannot be applied. Cancel leaves the timer unchanged.
- Compact icon controls: **play** starts, resumes or restarts; **pause** pauses; the **circular arrow** resets to the chosen duration. Full action names remain available to accessibility services, with visible remote focus indicators. Duration choices are disabled during a running or paused session; Reset makes them available again.
- A large countdown with tabular digits, a distinct sage completion state at `00:00`, and **Start again** for another session.
- Native D-pad navigation and Select input, preferred focus on initial screen entry and native focus restoration on return, and separate indicators for the chosen duration and remote focus.
- All app behavior is local and offline. There are no network requests, remote fonts, backend services, authentication or analytics.

## Timer lifecycle behavior

The timer records an absolute deadline using the device clock. Display refreshes calculate `deadline - Date.now()` and round up to the next second; they never subtract a fixed amount per interval. Delayed callbacks therefore do not accumulate countdown drift. Pause captures exact remaining milliseconds and Resume creates a new deadline that excludes paused time.

The timer session lives outside screen components, so using the persistent Home rail item or remote Back and reopening the timer preserves its state. Home and Back dismiss to the dashboard route, including when a utility was opened through a deep link. Custom Duration also has Home and direct-to-dashboard Back; both discard its unapplied draft. Its explicit Cancel still returns to Timer. UI refresh work runs only while the timer route is focused, the app is active and the timer is running. Pause, Reset, completion, route blur, backgrounding and unmount all stop their interval. Returning immediately reconciles the deadline, including showing completion if time expired while away. Completion is visual on the timer screen.

State is kept in memory for the current app process. A force-stop, OS process termination, development reload or device restart starts a fresh session; persistent timer recovery and background alarms are not implemented. Changing the device clock affects the absolute deadline.

## Version choices

| Package | Version | Decision |
| --- | --- | --- |
| Expo | 58.0.23 | Existing SDK retained |
| React Native | `npm:react-native-tvos@0.87.1-1` | Replaces the starter's phone runtime, 0.88.1; exact release of the documented SDK 58 TV line (`0.87-stable`) |
| TV configuration plugin | 0.1.7 | Supports Expo 52 and newer |
| React | 19.3.0 | Existing version retained; satisfies the TV runtime's `^19.2.3` peer |
| TypeScript | 6.0.3 | Existing version and strict checking retained |

Expo Router and its required native dependencies use SDK 58-compatible versions resolved by `npx expo install`. React DOM is pinned to React's version to satisfy Router's transitive peers and keep resolution inside this project; there is no web target.

Compatibility references: [Expo SDK 58 table](https://docs.expo.dev/versions/v58.0.0/), [Expo TV setup](https://docs.expo.dev/guides/building-for-tv/), [TV plugin options](https://github.com/react-native-tvos/config-tv/tree/main/packages/config-tv), and [Router installation](https://docs.expo.dev/router/installation/).

Two deliberate package-manager settings:

- `.npmrc` uses `legacy-peer-deps=true`. npm treats the TV release's `-1` suffix as a prerelease and rejects it through Router's unused drawer/animation peers. This also avoids automatically installing unused animation dependencies. Validate required peers and SDK compatibility when changing packages.
- `expo.install.exclude` excludes only `react-native`. SDK 58's installed CLI compares it against the upstream 0.88 line even though Expo's SDK table specifies the TV 0.87 line. This prevents `expo install --fix` replacing the verified TV runtime. Check the TV compatibility table manually before changing this alias; all other packages remain checked.

## Local prerequisites

- Node **22.13+ on the 22 line**, **24.3+ on the 24 line**, or a newer supported LTS line. `.nvmrc` selects Node 24. The original shell's Node 20 is too old.
- Android Studio, its bundled JDK, Android SDK Platform 37, SDK Build-Tools, and Platform-Tools. Gradle may download additional matching SDK/NDK components during the first build; accept their licenses in Android Studio's SDK Manager if prompted.
- An Android TV / Google TV **x86_64** emulator for an Intel Mac. Expo's TV guide recommends an API 31+ TV image. Start it in Device Manager before running the app.
- npm; this project uses `package-lock.json`.

If you use nvm:

```sh
nvm install
nvm use
npm ci
```

On this Mac, Node 24 is also already available at `/usr/local/opt/node/bin/node`. To use it in a terminal without changing your global Node installation:

```sh
export PATH="/usr/local/opt/node/bin:$PATH"
node --version
npm ci
```

If Java or the SDK cannot be found, set these for your current terminal (adjust paths for your installation):

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
java -version
adb devices -l
```

Android Studio's bundled JDK on the setup machine is version 25. The generated Gradle wrapper is 9.4.1. React Native's Gradle plugin uses a Java 17 toolchain, which Gradle downloads automatically when absent. There is no need to install Xcode for Android TV development.

## Run on the Android TV emulator

```sh
# Generate Android from app.json and the TV plugin.
npm run prebuild:android

# Compile, install, launch, and start Metro.
npm run android -- --device emulator-5554
```

Replace `emulator-5554` with the serial from `adb devices -l`, or omit `--device` if only one emulator is connected. The first build needs internet access for native build dependencies and can take several minutes. Expo automatically builds its core native module from source for the TV fork when the precompiled libraries target the phone runtime.

**Expo Go does not support this TV setup.** `npm run android` creates a native debug build; it does not launch Expo Go. The debug app loads JavaScript from Metro. On subsequent sessions, start Metro with `npm start` and reopen the installed TimeBoxed app, or run `npm run android` again. If Metro cannot be reached over ADB:

```sh
adb -s emulator-5554 reverse tcp:8081 tcp:8081
adb -s emulator-5554 shell am start -a android.intent.action.VIEW \
  -d 'timeboxed://?__expo_url=http%3A%2F%2Flocalhost%3A8081' com.timeboxed.app
```

During validation, returning from a debug deep-link launch and reopening the activity sometimes logged Router errors about multiple linking/navigation containers. The welcome UI still rendered. A cold start through the TV launcher, followed by Back and launcher reopen, passed without these errors. If the debug-link cycle triggers this warning, keep Metro running and restart through the launcher:

```sh
adb -s emulator-5554 shell am force-stop com.timeboxed.app
adb -s emulator-5554 shell am start -a android.intent.action.MAIN \
  -c android.intent.category.LEANBACK_LAUNCHER -n com.timeboxed.app/.MainActivity
```

To verify the installed app independently of Metro, build a release variant with its JavaScript bundled:

```sh
npm run android:release -- --device emulator-5554
```

After installation, stop Metro and reopen TimeBoxed from the TV launcher. The dashboard, timer controls and custom duration screen should work without a network connection. Local release builds use the template's development signing setup; configure production signing before store distribution. For cloud builds/signing/submission, use EAS CLI through `npx eas-cli@latest`; an Expo account and EAS project configuration are separate manual setup steps.

## TV configuration and remote checks

`app.json` enables `@react-native-tvos/config-tv` with `isTV: true`, so no `EXPO_TV` environment variable is required. The plugin generates:

- `LEANBACK_LAUNCHER` on the main activity, alongside the standard launcher entry.
- Required Leanback support (`androidTVRequired: true`); touchscreen and faketouch are optional.
- A launcher banner and icon from `assets/`.
- Removal of the phone orientation restriction. The app config specifies landscape; the TV display determines the actual orientation.

Hardware-pointer hover on the pinned React Native TV 0.87 runtime requires native pointer dispatch. `plugins/with-pointer-events.cjs` enables that flag through Expo's MainApplication config mod; TV launcher, orientation and Leanback settings are retained. **Rebuild the Android development app after this change** (`npm run android -- --device emulator-5554`). The runtime marks this flag's class deprecated, but still uses it; revisit the opt-in when deliberately upgrading React Native. No package version was changed.

Use the emulator's virtual remote in Extended Controls. D-pad directions move between controls; Center / Select activates the focused control. The persistent top-right Home rail item and Android TV Back return directly to Dashboard from Timer, Clock, Custom Duration and ambient Clock. The shared rail remains outside scrolling content. Every icon stays visible, with at most one focus label before the idle timeout. Custom Cancel still returns to Timer; ambient Select on the focused clock display still returns to standard Clock. Dashboard restores focus to the utility that was opened. Back at Dashboard returns to the launcher. A running timer continues to elapse when its screen is hidden.

Manual smoke test:

1. Open TimeBoxed and navigate all six top-right icons using D-pad Up/Down. Confirm the focused name appears to the left, the previous name disappears, and icons do not move. Repeat with a mouse pointer. Select each placeholder utility and verify its route retains the same rail and Back returns to Dashboard. Select **Timer** and confirm Start has clear focus feedback. Open Clock to verify time/date/timezone and its saved format.
2. Move through every preset and select each one; confirm its countdown and sage selection indicator. Open Custom and verify every plus/minus control, zero-duration validation, Use duration and Cancel.
3. Start a timer, wait several seconds, Pause, wait again, and confirm its remaining time stays fixed. Resume and confirm countdown continues. Reset should restore the chosen duration and enable duration selection.
4. Set a short custom timer (for example 5 seconds) and verify `00:00`, the completion message and Start again.
5. While running, focus the Home rail item and press Select, wait, reopen Timer and confirm elapsed time was accounted for. Repeat using remote Back and with the timer paused; paused time must stay fixed.
6. While running, press the remote Home button, wait, and return to TimeBoxed. Verify the countdown catches up instead of resetting. Repeat with a short timer that expires while backgrounded.
7. Repeat using a release build with Metro stopped to verify standalone offline operation. Release offline startup and Fire TV execution still require separate validation.
8. Enable the device's Reduce Motion / Remove Animations setting. Check that clock updates, focus and route changes remain immediate and readable. Restore the setting and verify restrained motion returns.

The development Android application ID is `com.timeboxed.app`. Choose an identifier you own before publishing. Fire TV will need separate device, launcher, remote, and Amazon store validation; the current Leanback requirement should be reviewed for that target.

## Project structure

```text
assets/
  icon.png                   App / TV launcher icon
  tv-banner.png              320 × 180 TV launcher banner / temporary dashboard image
  artwork/README.md          Approved local artwork slot instructions
plugins/
  with-pointer-events.cjs    Reproducible Android hardware-pointer opt-in
scripts/
  generate-assets.swift      Optional macOS asset authoring tool
src/
  app/
    _layout.tsx              Headerless root Expo Router stack
    index.tsx                Main utility dashboard route
    timer.tsx                Main timer route
    custom.tsx               Custom duration route
    clock.tsx                Digital Clock route
    clock-ambient.tsx        Ambient Clock route with shared rail
    calculator.tsx           Calculator route
    countdown.tsx            Event Countdown route
    world-clocks.tsx         World Clocks route
  artwork/                   Local artwork catalog and selection
  calculator/                Exact arithmetic engine and in-process session store
  clock/                     Local formatting, refresh lifecycle and persisted format preference
  countdown/                 Event calendar validation, remaining time and persisted event store
  components/                Shared TV controls, artwork layers, icons, clock and countdown displays
  hooks/                     Clock, Timer and navigation lifecycle subscriptions
  navigation/                Typed destinations, focus memory and independent inactivity controller
  screens/                   Dashboard and all five utility screens, custom duration and ambient Clock
  storage/                   Small app-private document adapter
  time/                      Shared focused wall-time lifecycle for Countdown and World Clocks
  timer/                     Pure timer state machine and session store
  worldClocks/               Curated cities, IANA formatting and persisted selections
  theme.ts                   Shared palette, utility accents, layout and motion tokens
tests/                       Utility engines, persistence, timezone and lifecycle tests
  tv/                        Native dashboard and navigation regression tests
app.json                     Native configuration and TV plugin options
eslint.config.js             Expo lint configuration
tsconfig.json                Strict TypeScript configuration
```

`android/` and `ios/` are generated and ignored by Git. Keep native settings in app config and config plugins. After changing native configuration, rerun `npm run prebuild:android` and rebuild. This command recreates `android/`; do not put hand-maintained changes there.

Launcher artwork is committed and needs no generation step during setup. To redraw it on macOS, run `swift scripts/generate-assets.swift` from the repository root. Swift is only an optional asset authoring tool, not an app dependency.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run test:tv                 # Requires installed TV build, emulator and Metro
npx expo install --check
npm run doctor
npx expo export --platform android
```

The native manifest and launcher assets can be inspected after `npm run prebuild:android`. Actual remote focus and offline startup require the emulator smoke test above; a successful bundle export alone does not verify native execution.

`npm run test:tv` runs files serially against one emulator. It checks remote
Calculator arithmetic/session recovery, Countdown name/date entry and CRUD,
multiple saved events and restart recovery, World Clocks city management and
device-time comparisons, shared format choices, and the existing six-item rail,
Timer, Clock, ambient, lifecycle, reduced-motion and contrast regressions.
Current utility screenshots are written to `artifacts/utilities/`; shared-rail
captures remain in `artifacts/adaptive-rail/`. Start Metro and an installed TV
development build first. The default device is `emulator-5554`; set
`ANDROID_SERIAL` to choose another. Tests force-stop/relaunch the app and create
then delete demo countdowns/change city choices. Use a development emulator with
test data. They do not install/rebuild the native app. Feature tests can be run
separately with `node --experimental-strip-types --test tests/tv/calculator.test.ts`
(or `countdown.test.ts` / `worldClocks.test.ts`).

Build-in-public materials are separate stories: [Calculator](docs/stories/calculator.md),
[Countdown](docs/stories/countdown.md), [World Clocks](docs/stories/world-clocks.md).
Each links an actual 1080p screenshot, a native remote demo video, technical
decisions, repository code excerpts and issues encountered. Demo capture scripts
for Countdown/World Clocks live under `scripts/`; run them with Node's
`--experimental-strip-types`, ADB, the development TV build and Metro available.

The TV test compiles a small hierarchy-dump helper using the installed Android SDK/JDK, then pushes it to the emulator's temporary directory. This bypasses the stock dumper's one-second idle requirement on continuously updating clocks. Set `ANDROID_HOME` and `JAVA_HOME` as shown above on other setups; the harness also detects this Mac's SDK and Android Studio JDK. The helper lives under `tests/tv/`, outside the application and generated native projects, and adds no npm dependency.

Calculator, Countdown and World Clocks completion validation: **ESLint, strict
TypeScript, all 48 unit tests, all 22 TV results and Android Expo/Metro export
passed**, with zero failures/skips in the final combined TV run. The existing
1920 × 1080 Android TV API 36 x86_64 emulator verified remote keypad calculations,
Countdown creation/name entry/edit/delete/multiple/restart, World Clocks city
management/IANA comparisons/shared formats/restart, lifecycle recovery, Home/Back,
single-label/idle/reduced-motion navigation, and Timer state across all five
utilities. No dependency or native TV configuration change was required.
Earlier emulator/ADB interruptions are recorded separately; the uninterrupted
final run passed. Known limitations and all changed files/media are in the
[delivery report](docs/utilities-delivery.md). Fire TV and standalone release
offline startup were not tested in this milestone.

Expo Router typed routes are enabled in `app.json`. Start Metro once after a fresh checkout to generate `.expo/types/router.d.ts` before typechecking. `tsconfig.json` retains `strict: true` and uses React Native's documented `react-native-legacy-deep-imports` type resolution condition because Expo's ambient `ViewStyle`/`TextStyle` interface extensions conflict with the TV runtime's generated type aliases once `expo-env.d.ts` is generated. This changes TypeScript resolution only; native TV configuration and dependencies are unchanged. See [React Native's compatibility setting](https://reactnative.dev/docs/strict-typescript-api#opting-out).

Initial TV configuration validation completed on the Intel Mac and Android TV x86_64 emulator (before the functional timer screen):

- Lint, strict TypeScript checking, Expo dependency checking, and lockfile clean-install dry run passed.
- Expo Doctor passed all 20 checks.
- Android production JavaScript export and native debug APK build/install passed. The initial native build took about 20 minutes, including first-time toolchain downloads.
- Generated manifest checks passed for the TV launcher category, required Leanback, optional touchscreen/faketouch, banner/icon references, and removal of portrait orientation.
- Emulator UI checks confirmed both welcome strings, preferred focus, Select opening/closing About, focus retention after all four D-pad directions, and Back returning to the TV launcher.
- Upstream native dependencies emitted deprecation warnings; the native build completed successfully.
- The debug deep-link/reopen cycle produced linking/navigation-container errors; the clean TV launcher start/Back/reopen cycle passed without them. See the restart workaround above.
- Release-mode offline startup and Fire TV execution have not been tested. Use the release command and manual smoke test above for those follow-up checks.

Milestone 2 functional timer validation:

- All **11 automated tests** pass, along with lint and strict TypeScript checking.
- The Android production bundle exports successfully. Metro still emits the previously observed upstream React Native feature-flag export warning and uses its file-resolution fallback.
- Android TV emulator checks passed for initial Start focus, D-pad navigation through the preset row, preset selection, Start/Pause/Resume/Reset, paused time remaining fixed, background and route-return deadline recovery, rapid custom stepper input, zero-duration rejection and custom duration application.
- A three-second custom timer completed while the app was backgrounded; reopening showed `00:00`, the lime completion message and focused Start again control.
- The existing native TV build was used for these JavaScript changes. Native TV configuration and dependencies were unchanged. Standalone release/offline execution and Fire TV were not revalidated in this iteration.

Timer tests use Node's built-in test runner and TypeScript stripping, with no added testing dependency. Run them with Node 24 (or the supported Node 22 runtime with the script's stripping flag). The tests cover presets and duration boundaries, display rounding, late ticks, exact pause/resume timing, background expiry, invalid transitions, reset/restart, subscription cleanup and notification frequency. `npm run typecheck` checks the tests as well as app code.

Milestone 3 dashboard validation:

- Lint, strict TypeScript checking, all **15 clock/timer unit tests**, and the Android production bundle export pass.
- All **six native regression checks** pass on the Android TV x86_64 emulator: dashboard content, clock updates, D-pad/Select on all five cards, timer opening with seven presets, Dashboard-button return with running session recovery, and remote Back with paused session preservation and Reset.
- The dashboard was visually checked at 1920 × 1080 for readable typography, the white focus ring, and visibility of the complete card grid and footer.
- The existing React Native feature-flag export warning remains during bundling; Metro's file-resolution fallback succeeds. Node also reports the existing module-type warning for TypeScript test files. The native test helper uses Android's bundled legacy UIAutomator runner, which prints a deprecation notice; no testing library or native app dependency was added.
- The timer state machine, shared session store, timer lifecycle hook, dependency versions and native TV plugin configuration were preserved. Only Expo Router's typed-route experiment was added to app configuration. A TypeScript resolution compatibility setting fixes the Expo/TV-runtime declaration conflict described above.
- Validation used the installed development build. Standalone release/offline startup and Fire TV execution were not revalidated in this milestone.

Dark pastel visual refinement validation:

- Lint, strict TypeScript, all **15 clock/timer unit tests**, all **seven native TV regression checks**, and Android production bundling pass.
- The additional native check sends a burst of directional key events while focus feedback transitions, then confirms the expected native focus target. Existing checks still cover all five cards, the live clock, seven presets, Select, both return paths, running-session recovery, paused-session preservation and Reset.
- Dashboard and timer controls were reviewed on the 1920 × 1080 Android TV emulator. Existing upstream Metro and Node warnings remain non-blocking. Native dependencies, TV configuration, strict typed navigation and timer session logic were preserved.
- A reduced-motion smoke check passed with Android's transition animation scale set to zero: the dashboard clock remained accessible and directional input focused the Clock card. The emulator's original animation setting was restored afterward.

Milestone 5 Digital Clock validation:

- `npm run lint` and `npm run typecheck` pass with TypeScript strict mode enabled.
- `npm test` passes all **24 unit tests**. Coverage includes device-default time/zone detection, locale-aware weekday/date formatting, 12-hour midnight/noon AM/PM, 24-hour formatting, format switching, midnight/date rollover, daylight-saving transitions, timezone changes, delayed callbacks, immediate foreground refresh, single-interval ownership, listener cleanup, preference persistence/reload, malformed preferences, storage failures and retry. All existing timer tests still pass.
- `npm run test:tv` passes **15 native TV checks** (16 results including the enclosing test). The existing dashboard/timer regressions run alongside Clock card integration, comparison against the emulator's timezone/date, 12/24-hour selection, ambient visibility/ticking, Select/Back exits with focus restoration, background return against device wall time, saved-format recovery after force-stop, dashboard format consistency and reduced-motion remote controls. A separate running-timer → Clock → ambient → Timer flow verifies that the same session deadline is preserved. The emulator's animation setting is restored after the reduced-motion check.
- The native Android development build completed, installed and ran on the **1920 × 1080 Android TV x86_64 emulator**, including the added FileSystem module. `npx expo export --platform android` also completed successfully.
- Native restoration correctly returns focus to the Clock dashboard card after leaving Clock; ambient exits restore the Ambient mode control. Initial test expectations were corrected to follow that existing native behavior. The final run passes with no blocking app bugs found.
- Existing upstream Metro feature-flag resolution warnings, Node module-type warnings and Gradle deprecation warnings remain non-blocking. Expo/React Native TV versions, native TV configuration and timer logic were preserved. Fire TV and release-mode offline startup were not validated in this milestone.

Milestone 5 file map:

- Created routes/screens: `src/app/clock.tsx`, `src/app/clock-ambient.tsx`, `src/screens/ClockScreen.tsx`, `src/screens/AmbientClockScreen.tsx`.
- Created shared displays/preferences: `src/components/ClockTime.tsx`, `src/components/DigitalClockDisplay.tsx`, `src/clock/preferences.ts`, `src/clock/preferenceStore.ts`, `src/hooks/useClockPreferences.ts`.
- Created tests/artifacts: `tests/preferences.test.ts` and the five emulator screenshots under `artifacts/milestone-5/`.
- Updated existing clock/dashboard code: `src/clock/localClock.ts`, `src/hooks/useLocalClock.ts`, `src/components/ClockDigit.tsx`, `src/components/DashboardClock.tsx`, `src/components/UtilityCard.tsx`, `src/screens/DashboardScreen.tsx`, `src/theme.ts`.
- Updated integration/docs: `tests/clock.test.ts`, `tests/tv/dashboard.test.ts`, `package.json`, `package-lock.json`, `README.md`. The only new dependency is SDK-compatible Expo FileSystem for local preference storage.

Icon-led dashboard refinement validation:

- Restored the structured three-over-two grid with stopwatch, clock, calculator, hourglass and globe line icons, short labels and a compact brand header. The dashboard clock, date/timezone, section heading, availability badges, decorative accent strokes and footer copy are removed. Clock and ambient routes retain their time/date/timezone experience and saved format.
- Icons use existing React Native views; no icon library, SVG renderer, font, package upgrade or native TV configuration change was needed. Tile focus uses an immediate pastel outline/label and charcoal surface shift, with no glow or scaling. Unimplemented tiles retain a brief system notice on Select.
- Lint, strict TypeScript, all **24 existing unit tests**, all **15 native TV regression checks** (16 results including the enclosing test), and Android Expo/Metro production bundling pass.
- Native checks verify all five icons and focusable tiles, centered icon geometry, three-over-two arrangement and 1080p bounds, absence of removed dashboard copy/clock, rapid D-pad navigation and Select. Timer sessions, all seven presets, Clock updates/formats/persistence, ambient controls, reduced motion and background recovery continue to pass. The removed dashboard-ticking assertion now checks the live time inside Clock.
- [New 1920 × 1080 dashboard screenshot](artifacts/icon-dashboard/dashboard.png) was captured from the Android TV emulator. Existing non-blocking Metro and Node warnings remain; Fire TV and standalone release/offline startup were not revalidated.
- Files changed for this refinement: new `src/components/UtilityIcon.tsx`; updated `src/components/UtilityCard.tsx`, `src/screens/DashboardScreen.tsx`, dashboard dimensions in `src/theme.ts`, `tests/tv/dashboard.test.ts`, `README.md` and screenshots under `artifacts/icon-dashboard/`. Timer/Clock logic, preferences, routes, typed navigation, dependencies and TV configuration are preserved.

Ambient art-first dashboard redesign:

- Replaced the tile grid with full-bleed local imagery, transparent top-right icons, focus/hover-only labels and a bottom-left shared-format live clock. Existing utility routes, Timer state and Clock preferences remain in place.
- No paintings were available. The existing launcher banner is explicitly temporary; its resolution and branding prevent final artwork review. The catalog and prop-driven crossfade support future approved bundled paintings without a new dashboard layout. Bright/dark development fixtures test contrast extremes, not painting quality.
- New files: `src/artwork/catalog.ts`, `src/artwork/selection.ts`, `src/components/ArtworkBackground.tsx`, `src/components/ArtworkUtilityControl.tsx`, `plugins/with-pointer-events.cjs`, `tests/artwork.test.ts`, `assets/artwork/README.md`.
- Updated files: `src/screens/DashboardScreen.tsx`, `src/components/DashboardClock.tsx`, `src/components/UtilityIcon.tsx`, `src/components/ClockTime.tsx`, `src/components/ClockDigit.tsx`, `src/theme.ts`, `app.json`, `tests/tv/dashboard.test.ts`, `tests/tv/TimeBoxedHierarchyDump.java`, this README and screenshots under `artifacts/art-dashboard/`.
- Validation performed: `npm run lint`, `npm run typecheck`, all **26 unit tests**, and `npx expo export --platform android` passed. The Android development build was regenerated/rebuilt and used for the emulator checks.
- On the 1920 × 1080 Android TV emulator, the main **15 native checks** passed. The emulator then stopped with graphics-buffer errors, causing an ADB timeout/disconnect in the remaining two checks. After a cold restart, both interrupted checks passed with `node --experimental-strip-types --test --test-name-pattern='running timer survives|image contrast previews' tests/tv/dashboard.test.ts`. Thus all **17 native checks** passed across these runs; the original uninterrupted suite did not finish successfully.
- Checks cover focus/hover labels and stable icon geometry, Select, all seven Timer presets, running/paused state preservation, Clock formats/persistence, ambient exits, foreground time recovery and reduced motion. Bright/dark development image fixtures were visually reviewed; actual painting contrast remains unverified until artwork is supplied. Device animation settings were restored. A separate remote Back check returned the dashboard to the TV launcher, and the launcher entry reopened TimeBoxed.
- Screenshots: [dashboard with temporary banner](artifacts/art-dashboard/dashboard.png), [bright contrast fixture](artifacts/art-dashboard/contrast-bright.png), [dark contrast fixture](artifacts/art-dashboard/contrast-dark.png), [Clock](artifacts/art-dashboard/clock.png), [ambient](artifacts/art-dashboard/ambient.png). All are 1920 × 1080. Fire TV, final painting assets and standalone release/offline startup were not validated in this redesign.
- Android native pointer dispatch is enabled through a config plugin so real mouse hover works on this runtime. Native TV plugin settings and package versions are retained. The generated manifest still has Leanback launcher/requirement, optional touchscreen/faketouch and no portrait restriction. Native dependency/flag deprecation warnings and existing Metro export-resolution/Node module warnings remain non-blocking.

Persistent navigation refinement:

- All five dashboard icons remain visible at a fixed size and position while idle, focused or hovered; only labels animate. No idle timer, opacity fade, collapse or scaling applies to the icon column.
- Added a shared `src/components/DashboardHome.tsx` with a recognizable house icon, transparent background and small sage focus outline. `Screen.tsx` mounts it outside scrolling content for Timer, Clock and Custom Duration; ambient mounts it beside its focusable clock display. Standard Clock/Timer text Dashboard buttons are replaced by Home. There are no permanent Home text labels or navigation bars.
- Home and route-focused Android TV Back return directly to the typed dashboard route, restoring the originating Timer/Clock dashboard focus. Ambient Back now goes to Dashboard; Select on its clock display still returns to standard Clock. Custom Back/Home discard the unapplied draft; explicit Cancel retains its Timer return behavior. The Back listener is removed on route blur/unmount.
- Files changed: added `src/components/DashboardHome.tsx`; updated `src/components/Screen.tsx`, `src/components/UtilityIcon.tsx`, `src/components/ArtworkUtilityControl.tsx`, `src/screens/TimerScreen.tsx`, `src/screens/ClockScreen.tsx`, `src/screens/AmbientClockScreen.tsx`, `src/theme.ts`, `tests/tv/dashboard.test.ts`, this README and emulator screenshots. No dependency, native configuration, route, preference-storage or Timer logic changes were required.
- Validation completed: ESLint, strict TypeScript, all **26 unit tests**, Android Expo/Metro production bundling, and the complete `npm run test:tv` suite passed. The TV run has **20 native checks / 21 passing results including the enclosing test**, with no failures or skipped checks, on the existing 1920 × 1080 Android TV emulator. It covers all five idle icons, fixed geometry, hover/focus labels, Timer/Clock/Home/Back focus restoration, ambient Home Up/Down/Select, Custom Home/Back without applying its draft, formats/persistence, lifecycle refresh, running/paused sessions, reduced motion and contrast fixtures. System animation settings were restored. A separate dashboard Back/launcher-reopen check also passed, confirming utility Back handlers do not trap the dashboard. Existing non-blocking Metro/Node warnings remain; Fire TV and standalone release/offline startup were not revalidated.
- Screenshots at 1920 × 1080: [idle dashboard](artifacts/art-dashboard/dashboard-idle.png), [Timer Home](artifacts/art-dashboard/timer-home.png), [Clock Home](artifacts/art-dashboard/clock.png), [ambient Home focused](artifacts/art-dashboard/ambient-home-focused.png), [Custom Home](artifacts/art-dashboard/custom-home.png).

Art-first interface and shared adaptive rail:

- One `NavigationRail` supplies Timer, Clock, Calculator, Countdown, World Clocks and Home on Dashboard, every utility, Custom Duration and ambient Clock. `Screen` reserves a content column to the left of the maximum label width; ambient uses the same reserved width. Existing main-content controls and Clock/Timer logic are retained.
- Native focus owns the only optional label. Old labels unmount immediately; the new label fades/reveals over 160 ms. Icons remain visible in every state. Compact/focused icon sizes are 30/36 dp; focus outlines are 36/44 dp; native hit areas remain 48 dp at fixed top-right coordinates. Reduced motion disables animation.
- Inactivity is exactly 10,000 ms after the last supported directional/Select remote input, rail focus or rail pointer entry/activation. Even a boundary key without a focus change wakes the focused item. One cancellable timeout is renewed; stale callbacks are ignored. Focused-route subscriptions are removed on blur/unmount. Background pauses the timeout; foreground starts a fresh period. This controller is independent of Timer and Clock scheduling.
- Three new lightweight destination routes expose the rail on future utilities. They do not implement calculator, countdown or world-clock functionality. Select on the current route avoids adding a duplicate screen; Home/Back dismiss to Dashboard. Direct utility-to-utility navigation uses typed Expo Router destinations, retaining the Timer store and saved Clock format.
- The existing bundled image catalog and cover/crossfade layer are reused. The launcher banner is tinted to neutral midnight to remove its oversized branding; no painting or new image asset was generated/downloaded. Final artwork and real painting contrast remain pending approved local assets. Bright/dark test fixtures remain development-only.
- Final validation completed: `npm run lint`, `npm run typecheck`, all **28 unit tests**, the full `npm run test:tv` suite (**18 native checks / 19 passing results including the enclosing test**, no failures/skips), and `npx expo export --platform android`. The 1920 × 1080 Android TV emulator verified six fixed focus targets on every route, single-label transfers, real 10-second idle/wake behavior, pointer focus, content/rail access, Home/Back restoration, Timer presets and running/paused sessions across direct utility switches, Clock dates/timezone/formats/persistence, ambient controls, foreground recovery and reduced motion. The device animation setting was restored to 1.0. Dashboard Back returned to the TV launcher and a normal launcher reopen succeeded.
- Captured and visually reviewed all six requested compact/focused Dashboard, Timer and Clock screenshots at 1920 × 1080, plus Custom, ambient and bright/dark image fixtures. No functional failures remain in the final run. Existing Metro feature-flag export-resolution and Node module-type warnings are non-blocking. Actual paintings, Fire TV and standalone release/offline startup remain unverified.
- New files: `src/components/NavigationRail.tsx`, `src/hooks/useNavigationActivity.ts`, `src/navigation/activity.ts`, `src/navigation/items.ts`, `src/screens/UpcomingUtilityScreen.tsx`, `src/app/calculator.tsx`, `src/app/countdown.tsx`, `src/app/world-clocks.tsx`, `tests/navigation.test.ts`.
- Updated files: `src/components/Screen.tsx`, `src/screens/DashboardScreen.tsx`, `src/screens/AmbientClockScreen.tsx`, `src/theme.ts`, `src/artwork/catalog.ts`, `tests/tv/dashboard.test.ts`, this README, `assets/artwork/README.md` and screenshots in `artifacts/adaptive-rail/`. Retired `DashboardHome.tsx` and `ArtworkUtilityControl.tsx` so there is one navigation implementation. No dependency/version/native TV configuration changes.

`npm audit` currently reports moderate transitive advisories, including Expo CLI's `glob` / `minimatch` chain. Do not use `npm audit fix --force`: its suggested Expo version change would replace the retained SDK. Recheck compatible patch releases before changing the dependency tree.
