# Font settings

The later [Timer shortcuts update](timer-shortcuts.md) adds editable durations
and makes the Settings gear available everywhere. The font comparison captures
below retain their original Timer layout; current Timer screenshots are in that
update's report.

Satoshi is TimeBoxed's default font. Every screen has a small, transparent
Settings gear at the lower right. From the rail's Home item, press Down to focus
Settings, then Select. The existing six-item rail keeps its order and behaviour.
Settings uses the same shared screen structure, focus controls and dark palette.
Back returns to the screen that opened Settings; Home returns to the dashboard.

Choose Satoshi, Clash Display, Cabinet Grotesk or System with D-pad and Select.
The selected choice has the existing sage selected state, separate from the
remote focus outline. Changes apply immediately throughout the app, including
animated clock digits and focused navigation labels. System uses the platform's
native font. No utility layout, size, colour or timer/calculation logic changes.

## Persistence and startup

`typography/preferences.ts` implements a small validated external store, using
the same app-private document pattern as the Clock preference. The storage
adapter writes `appearance-preferences.json` containing `{ "version": 1,
"family": "satoshi" }`, or another supported family identifier. The setting
survives navigation, backgrounding and app restarts. Uninstalling or clearing app
data removes it. Missing data defaults to Satoshi. Invalid data or read failures
recover to Satoshi with feedback; choosing a font repairs the saved preference.
Save failures retain the session choice and show feedback, with retry supported.

`TypographyProvider` reads the saved preference before rendering the navigator
and loads all four original local variable TTFs with Expo's SDK 58 family API.
The existing Router splash is held until loading finishes. Switching families
does not reload fonts, remount navigation or reset an active Timer session.
If font loading fails, a remote-accessible System fallback keeps the app usable;
custom font choices are unavailable until a subsequent successful startup.

`expo-font` **58.0.11**, already present through Expo, is now an explicit direct
dependency at the same version. No remote font package, font service, new
persistence dependency, Expo/React Native TV upgrade or native configuration
change was introduced. The matching references are the
[SDK 58 Font API](https://docs.expo.dev/versions/v58.0.0/sdk/font/) and
[Expo font guide](https://docs.expo.dev/develop/user-interface/fonts/).

The shared Text wrapper retains existing sizes/weights and requests regular 400
where no weight was specified, because the supplied variable fonts have bold
default instances. The calculator's backspace key explicitly uses native text;
U+232B is absent from all three supplied families. Existing tabular numeral
requests remain on numeric displays. Satoshi includes a `tnum` feature; Clash
Display and Cabinet Grotesk have proportional digits without that feature, so
their numeric widths can vary. No font files were altered to hide this difference.

## Supplied fonts

| Family | Static weights | Styles | Variable TTF range |
| --- | --- | --- | --- |
| Satoshi | Light 300, Regular 400, Medium 500, Bold 700, Black 900 | Upright and italic at all five weights | Upright and italic, `wght` 300–900 |
| Clash Display | Extralight 200, Light 300, Regular 400, Medium 500, Semibold 600, Bold 700 | Upright only | `wght` 200–700 |
| Cabinet Grotesk | Thin 100, Extralight 200, Light 300, Regular 400, Medium 500, Bold 700, Extrabold 800, Black 900 | Upright only | `wght` 100–900 |

Each original download contains static OTF, variable TTF and web
TTF/WOFF/WOFF2/EOT formats. Archives, files and accompanying documentation are
organized separately under `assets/fonts/`. The application uses the original
variable TTFs, including Satoshi italic; no conversions or subsetting occurred.
[The inventory](../assets/fonts/inventory.json) records SHA-256 hashes, names,
weight/style metadata, axes, numeral advances, OpenType features and glyph checks.
Run `python3 scripts/inspect-fonts.py` to regenerate it without extra packages.

All three supplied licences are **ITF Free Font License (FFL) v2.0,
17 August 2026**. The full original text is retained for
[Satoshi](../assets/fonts/satoshi/License/FFL.txt),
[Clash Display](../assets/fonts/clash-display/License/FFL.txt) and
[Cabinet Grotesk](../assets/fonts/cabinet-grotesk/License/FFL.txt).
It permits app embedding and restricts standalone redistribution and modification.
ZIPs and font binaries are ignored by Git; another developer must supply their
own Fontshare downloads to build the app. No raw font downloads are published
through the repository.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npx expo export --platform android
TV_SCREENSHOT_DIR=artifacts/font-settings node --experimental-strip-types --test tests/tv/fontSettings.test.ts
```

The focused TV regression checks remote access to Settings, all four selected
states, font application on Timer, saved System and Satoshi choices after
process restart, and a running Timer preserved while its font changes. It also
opens Clock, Calculator, Countdown and World Clocks with the shared rail intact.
The new unit cases cover default choice, all family round trips, malformed
preferences, subscription cleanup and read/write failure recovery.

The temporary audition route, fixed fixture data, preview switcher and disabled
sample actions were removed when Satoshi became the requested default. Earlier
captures under `artifacts/typography` are a partial historical audition, not a
completed three-family acceptance run. Current settings validation and captures
are under `artifacts/font-settings/`.

## Completed validation and captures

| Check | Actual result |
| --- | --- |
| ESLint | Passed |
| Strict TypeScript | Passed |
| Unit tests | 52 passed, 0 failed, including four new preference cases |
| Android Expo/Metro export | Passed, with all four original variable TTF assets |
| Standalone x86_64 Android release build | Passed; existing Expo and React Native TV versions retained |
| Focused native font Settings regression | 1 passed, 0 failed, 0 skipped on the 1920 × 1080 Android TV API 36 emulator |

The native regression ran against the standalone APK with
`TV_OFFLINE_FONTS=1`: airplane mode was verified enabled, and the Metro reverse
mapping was removed. It selected all four fonts with D-pad/Select, opened Timer
in each, verified saved System and Satoshi choices after process restarts,
changed a font while preserving a running Timer deadline, opened all five
utilities, and checked Down from Home to Settings and Up back to Home. The
original airplane setting and Metro mapping were restored afterward.
The existing development build was then reinstalled without clearing data; a
native smoke check confirmed Satoshi loaded, the saved choice was retained, and
Settings opened with the selected Satoshi control focused. Metro was left running.

[Native log](../artifacts/font-settings/tv.log),
[unit log](../artifacts/font-settings/unit.log),
[export log](../artifacts/font-settings/bundle.log),
[release build log](../artifacts/font-settings/release-build-online.log).
[Bundled-font verification](../artifacts/font-settings/bundled-fonts.json)
records the APK hash and verifies that all four embedded TTFs match their
original supplied SHA-256 hashes.

Earlier development-build automation reads timed out under native compilation
load. The completed build daemon was stopped to release memory, and the TV
emulator was rebooted without clearing data. The entire focused regression then
passed offline in the release APK. The earlier timeout log is retained as
`tv-before-offline.log`; it is not counted as a pass. The first offline Gradle
attempt lacked a cached TV release artifact; the unchanged dependency was
downloaded and checksum-verified, and the subsequent build passed. No native
configuration or dependency version was changed to work around these issues.

[Open the comparison gallery](../artifacts/font-settings/comparison.html).
These are real emulator screenshots at 1920 × 1080, using the same settings
content and the same 25:00 Timer layout:

| Choice | Settings | Timer |
| --- | --- | --- |
| Satoshi | [Capture](../artifacts/font-settings/settings-satoshi.png) | [Capture](../artifacts/font-settings/timer-satoshi.png) |
| Clash Display | [Capture](../artifacts/font-settings/settings-clash-display.png) | [Capture](../artifacts/font-settings/timer-clash-display.png) |
| Cabinet Grotesk | [Capture](../artifacts/font-settings/settings-cabinet-grotesk.png) | [Capture](../artifacts/font-settings/timer-cabinet-grotesk.png) |
| System | [Capture](../artifacts/font-settings/settings-system.png) | [Capture](../artifacts/font-settings/timer-system.png) |

Additional Satoshi captures: [Clock](../artifacts/font-settings/clock-satoshi.png),
[Calculator](../artifacts/font-settings/calculator-satoshi.png),
[Countdown](../artifacts/font-settings/countdown-satoshi.png),
[World Clocks](../artifacts/font-settings/world-clocks-satoshi.png),
[Dashboard](../artifacts/font-settings/dashboard-satoshi.png) and
[focused Settings entry](../artifacts/font-settings/dashboard-settings.png).

Satoshi's rounded colon, balanced labels and supported tabular numerals suit the
calm utility layout. Clash Display is wider and more geometric, with a square
colon. Cabinet Grotesk has more distinctive numeral shapes and smaller-looking
labels at the same point size. Both alternatives remain readable in the captured
layouts but retain proportional digits. Keeping one selected family throughout
the interface is preferable to mixing a second display family into individual
screens. No clipped text or unexpected wrapping was observed in these captures.

## Changed files and limitations

- New shared font model, local loader, provider, Text wrapper and validated
  preference store in `src/typography/`.
- New `SettingsScreen.tsx`, `/settings` route and dashboard `SettingsButton`;
  ActionIcon gains a native gear drawing.
- Root layout mounts the font provider. Existing text uses the shared wrapper;
  animated clock digits and rail labels receive the same font style. Utility
  layouts and font sizes/weights retain their existing values.
- New font preference unit tests and native Settings regression; font metadata
  inspection script, licences/inventory, `.gitignore`, README and this report.
- Timer/calculator/countdown/world-clock engines and stores, clock preferences,
  navigation activity logic, theme tokens and app.json remain unchanged.

The full pre-existing multi-utility TV suite was not rerun for this font change;
the focused native regression and all unit tests were run. Physical TV and Fire
TV testing were not performed. The complete original three-family audition
across every utility was superseded by the requested Satoshi default and
persistent Settings; the current comparison covers all four choices on Settings
and Timer, plus Satoshi on all five utilities.
