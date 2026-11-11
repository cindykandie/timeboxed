# Countdown: save a moment, count from the wall clock

TimeBoxed App 01 — **Make every minute count.**

Unlike the duration Timer, Countdown saves named future instants. Its list,
large display, editor and delete confirmation all use the existing shared rail.
The on-screen keyboard and date/time steppers work with D-pad and Select, without
depending on a touch date picker or a TV's optional software keyboard.

## Decisions and code

Calendar fields are entered in device local time, then round-tripped to detect
invalid dates and daylight-saving gaps. Repeated autumn times use JavaScript's
earlier occurrence. The saved absolute timestamp does not move with timezone
changes. Calendar entry uses a Gregorian date and a 24-hour time.

```ts
const timestamp = new Date(year, month - 1, day, hour, minute).getTime();
const actual = localFields(timestamp);
```

Remaining time is derived each time, never decremented:

```ts
const total = Math.max(0, Math.ceil((targetAt - now) / 1000));
```

A focused display owns at most one one-second interval and one app-state
listener. Background/blur disposes them; foreground reads system time immediately.
Editor/keyboard/confirmation views do not need a ticking interval. Timer's
existing session store and clock lifecycle remain unchanged.

Persistence reuses the installed FileSystem module and app-private documents.
The pure store accepts an injected text-storage adapter for real restart,
corruption and write-failure tests. Records are validated before use. Failed
writes do not commit changes in memory or silently discard an event.

```ts
try { storage.write(JSON.stringify({ version: 1, events })); }
catch { publish({ ...state, error: 'Could not save changes. Please try again.' }); return false; }
```

## Problems addressed

JavaScript normally normalizes February 30 and spring daylight-saving gaps;
round-trip validation catches both. A decrementing counter drifts when a TV
suspends the app; storing an instant avoids that drift. Remote name entry needs
real focus targets, so the editor uses the existing TVButton rather than a
touch-only form. Back closes subviews predictably; Home remains available.

Native testing exposed a keyboard-test assumption: Android's spatial focus lands
on Clear when moving down from the B column, so the harness now navigates to Done
using native bounds. A 1080p screenshot also revealed an over-wide action row.
Shorter Edit/Delete labels and equal-width controls fixed the clipping; the
revised screenshot was inspected and the remote delete flow recorded again.

## Evidence

- Pure tests: `tests/countdown.test.ts` (remaining time, invalid/DST dates,
  create/edit/delete/multiple/restart/corruption, failed writes and lifecycle).
- Native tests: `tests/tv/countdown.test.ts`.
- Screenshot: [Countdown](../../artifacts/utilities/countdown.png).
- Demo: [Remote Countdown flow](../../artifacts/utilities/countdown-demo.mp4).

The dedicated native acceptance passed creation/name entry, editing, multiple
events, force-stop/restart persistence, foreground recovery and deletion with
confirmation. ESLint, strict TypeScript, all 40 unit tests and Android export
passed. The complete `npm run test:tv` run passed **21 results**, with no failures
or skips, including Calculator and all existing Dashboard/Timer/Clock regressions.
The run log is `artifacts/utilities/phase2-tv.log`.
The screenshot is 1920 × 1080; the actual remote demo is 40 seconds at 1280 × 720.
`scripts/capture-countdown-demo.ts` reproduces and cleans up the demo event.

The final combined run after World Clocks integration also passed all 48 unit
tests and all 22 TV results, with no failures/skips; see the
[delivery report](../utilities-delivery.md).
