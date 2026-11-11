# Timer icon controls

The Timer now uses compact play/pause and circular-arrow reset buttons. Play
also resumes a paused session or starts another completed session. Accessibility
labels still announce Start, Pause, Resume, Start again and Reset as appropriate.
Duration labels, selected presets and remote focus indicators remain intact.

Changed product files: `src/components/ActionIcon.tsx`,
`src/components/TVButton.tsx`, `src/screens/TimerScreen.tsx`. No dependencies,
timer logic, navigation, theme tokens or TV configuration changed.

Actual 1920 × 1080 Android TV emulator captures:

- [Before](before.png)
- [Play](timer-play.png)
- [Pause](timer-pause.png)
- [Resume](timer-resume.png)
- [Completed](timer-complete.png)

Validation logs: [unit tests](unit.log), [Android export](bundle.log),
[focused TV regression](tv.log). The focused regression uses real D-pad/Select
input to check action icons, accessible names, pause/resume/reset, navigation
with a paused session, custom duration, completion and restart.

Completed checks: ESLint, strict TypeScript, all 48 unit tests, Android
Expo/Metro export, and the focused native Timer regression (1 passed, 0 failed)
on the 1920 × 1080 Android TV API 36 emulator. The first native attempt expected
focus on Start after applying a custom duration; native focus correctly returned
to Custom. The corrected test explicitly navigates from Custom to Start, and the
entire focused test passed on rerun. The full multi-utility TV suite was not
rerun for this follow-up. No new dependencies were added.
