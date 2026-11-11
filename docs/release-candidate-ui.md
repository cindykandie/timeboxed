# Release candidate: quieter utility screens

This refinement preserves the dark pastel design, large displays and existing
six-icon adaptive rail. It changes presentation and contextual management;
calculation, timing, preference and persistence engines remain untouched.

## What changed

| Screen | Removed or reduced | Retained / made clearer |
| --- | --- | --- |
| Timer | Brand heading, status slogans, promotional sentences, section heading and D-pad/reset instructions | Large countdown; Start/Pause/Resume, Reset; all seven selected-state presets plus Custom in a balanced 4 × 2 grid; quiet Paused/Complete status only when relevant |
| Custom duration | Decorative heading, remote instructions and normal range sentence | Short functional title, labelled hours/minutes/seconds, Apply/Cancel and genuine zero/locked validation |
| Clock | Clock heading, normal saved-preference paragraph and redundant timezone prefix | Live time, weekday, full date, local IANA timezone; compact selected 12h/24h segment; labelled Ambient icon action; storage error feedback |
| Calculator | Redundant title and separate header space | Larger result beside CE; smaller expression; all twenty keypad keys and exact arithmetic unchanged |
| Countdown empty | Explanatory empty-state sentence | Centred title and New countdown action |
| Countdown list/detail | Filled list buttons, duplicate unit legend and permanently visible Edit/Delete controls | Name, remaining time, target date; clear row focus/open cue; detail header with All countdowns and compact ••• Actions |
| World Clocks | Four permanent Remove buttons, always-visible IANA identifiers and prominent country labels | Larger times, clear city names, quieter countries and date differences; one focused city reveals its small trash/Remove action and timezone |

## Remote and accessibility behavior

Countdown rows still open details with Select. In detail, Left/Right moves
between All countdowns and the ••• button; Select on ••• opens labelled
Edit/Delete/Cancel actions. Back closes the action menu and restores focus to
•••. Delete retains its confirmation with Keep countdown preferred. Editor,
keyboard, persistence and foreground recovery retain their existing behavior.

World Clock entries are transparent focus targets. Idle entries have no remove
label/icon or timezone identifier. Focus reveals that entry's trash icon, small
Remove label and IANA zone in reserved space, preventing a layout shift. Select
opens a confirmation with Cancel preferred. Cancel/Back restores the same city;
confirmed removal restores Add city. No city is removed on the first Select.
Passive clock/date text remains outside the focus overlay and readable to
accessibility services. All focus targets retain meaningful accessibility labels.

The shared rail implementation, ten-second activity controller and routes are
unchanged. `ActionIcon` follows the existing native line-drawing approach;
`FocusableItem` adds transparent, fixed-size focus targets for passive content.
Existing TVButton gains optional quiet/icon presentation; default behavior is
retained. No animation dependency or new motion was added. Existing reduced-motion
handling remains in shared focus controls and root navigation.

## Capture comparison

[Open the local side-by-side comparison gallery](../artifacts/release-candidate/comparison.html).

Existing captures were copied before editing to `artifacts/release-candidate/before/`.
The baseline had Timer copy crowding/clipping the lower edge, a Clock title and
saved-format paragraph, a Calculator title, large Countdown Edit/Delete actions
and permanently visible World Clocks Remove buttons/timezone identifiers.

| View | Before | New 1920 × 1080 capture |
| --- | --- | --- |
| Timer | [Before](../artifacts/release-candidate/before/timer.png) | [Timer](../artifacts/release-candidate/timer-compact.png) |
| Clock | [Before](../artifacts/release-candidate/before/clock.png) | [Clock](../artifacts/release-candidate/clock-compact.png) |
| Calculator | [Before](../artifacts/release-candidate/before/calculator.png) | [Calculator](../artifacts/release-candidate/calculator.png) |
| Countdown empty | No previous empty-state capture | [Empty](../artifacts/release-candidate/countdown-empty.png) |
| Countdown saved list | No previous list capture | [Saved events](../artifacts/release-candidate/countdown-list.png) |
| Countdown detail | [Before](../artifacts/release-candidate/before/countdown.png) | [Detail](../artifacts/release-candidate/countdown.png) |
| World Clocks | [Before](../artifacts/release-candidate/before/world-clocks.png) | [Idle](../artifacts/release-candidate/world-clocks.png), [focused city](../artifacts/release-candidate/world-clocks-focused.png) |

All six requested views, plus detail/actions/focused variants, were captured from
the Android TV emulator with ADB at 1920 × 1080 and visually reviewed. They are
not mockups. Timer's lower instructions/clipping are gone and the eight duration
controls form two equal rows. Clock retains its full date and timezone with a
much smaller control group. Calculator's result has more emphasis. Countdown has
an intentional empty state and clean name/time/date rows, and its detail actions
are contextual. World Clocks has no permanent remove buttons or timezone text
on idle entries. No utility content overlaps the reserved rail area.

## Changed files and validation

- New: `src/components/ActionIcon.tsx`, `src/components/FocusableItem.tsx`.
- Updated: the five utility screens, related CustomDurationScreen,
  CountdownDisplay, DigitalClockDisplay and TVButton; relevant native TV tests
  and screenshot-output configuration; both existing demo scripts to follow the
  contextual flows; README and this report.
- Unchanged and checksum-verified: NavigationRail, navigation activity/hooks and
  items, theme tokens, all utility engines/stores, Clock preference/lifecycle
  modules, app.json, package.json and package-lock.json.
- Final static checks passed: ESLint, strict TypeScript, all **48 unit tests**
  and Android Expo/Metro production export.

### Final native results

All **21 individual native checks** (22 results including the enclosing group)
passed across the complete run and the corrected dashboard-file rerun:

| Run | Actual result |
| --- | --- |
| Complete serial TV run, `tv.log` / `tv-before-dashboard-rerun.log` | Calculator, Countdown and World Clocks feature cases passed. The run finished with 19 passing results and 3 failures: the mouse-hover check, the stale paused-slogan assertion, and their enclosing group. No cases were skipped or cancelled. |
| Entire dashboard regression file, `tv-dashboard-final.log` | **19 passed, 0 failed, 0 skipped**, including all 15 nested rail/Timer/Clock checks, Custom Duration, cross-utility Timer state and bright/dark contrast. |

The complete command before the final assertion corrections was not an
uninterrupted green run. The entire corrected dashboard file was rerun, rather
than counting its earlier failures as passes. Calculator/Countdown/World Clocks
feature files passed against the same unchanged product code in the complete run.

The 1920 × 1080 Android TV API 36 x86_64 emulator verified keypad arithmetic and
CE access; all seven preset selections and selected states, including 60 minutes;
running/paused Timer recovery; Clock dates/timezone, compact formats, ambient,
persistence and foreground refresh; Countdown creation/edit/delete/multiple/
restart and contextual-menu focus; World Clocks focus-only actions, confirmation,
cancel focus restoration, saved selection and shared formatting; and all six
persistent rail icons, one-label focus, ten-second idle/wake and reduced motion.
The existing system animation setting and original 12-hour format were restored.

No known functional regressions remain from these checks. Native release APK
startup, physical Android TV hardware and Fire TV were not tested in this UI
refinement. No native dependency/configuration change required a new APK build.

Final logs: [lint](../artifacts/release-candidate/lint.log),
[TypeScript](../artifacts/release-candidate/typecheck.log),
[48 units](../artifacts/release-candidate/unit.log),
[Android bundle](../artifacts/release-candidate/bundle.log),
[complete TV run](../artifacts/release-candidate/tv.log),
[corrected dashboard rerun](../artifacts/release-candidate/tv-dashboard-final.log).
Existing non-blocking Node module-type and Metro feature-flag resolution warnings
remain. All six requested PNG dimensions and all report/gallery links were checked;
protected source/configuration checksums matched their pre-refinement values.

The first World Clocks attempt passed contextual focus/transfer, confirmation,
Cancel focus restoration, confirmed removal and restart persistence, then the
emulator's foreground `am start` command timed out. That attempt is not counted
as passed. The same AVD was cold-restarted with its data preserved for the next
run; no app/native configuration or package version was changed.

Removing the Countdown empty sentence made its child list zero-height, so
Android correctly omitted that list node from the native accessibility dump.
The visible screen container now owns the mode locator, including when empty;
no filler text or invisible spacer was added to satisfy the test.

The first combined run's added CE check used the generic spatial-direction
heuristic, which did not reach the relocated control from the rightmost column.
After Countdown completed and cleaned up its events, that failed run was stopped.
A concrete left-column D-pad route reached CE and returned to Equals successfully
in the focused Calculator acceptance test; no calculator UI/engine change was
needed for that test correction. The full suite is rerun with the corrected path.

The expanded Timer test reached all seven presets, then exposed an old native
test-reader assumption: it accepted only MM:SS, while the 60-minute preset is
displayed as 01:00:00. The reader now accepts both existing display formats.
Dependent Timer cases in that interrupted run are not counted as passes; no Timer
engine or UI change was needed for the reader correction.

The completed preset-selection check also revealed a paused-state assertion
still expecting the removed TAKE A BREATH slogan. It now checks the actual
Paused state label. The unchanged rail's native hover check allows one bounded
real mouse leave/enter retry if the newly attached automation bridge misses its
first hover; it never replaces hover with D-pad focus. Final runs are recorded
below rather than counting these earlier failed assertions as passes.
