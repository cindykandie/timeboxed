# World Clocks: one instant, many local times

TimeBoxed App 01 — **Make every minute count.**

World Clocks starts with Nairobi, London, New York and Tokyo. Four clocks fit on
the TV together. The curated picker adds any of the fourteen supported cities
using D-pad and Select. Remove controls return focus to Add city, including when
the last entry is removed. The same six-icon rail stays visible throughout.

## Decisions and code

Reuse Clock's existing formatter and 12/24-hour preference; there is no second
format setting. Give each formatter an IANA timezone and one shared wall-clock
timestamp, so comparing cities never depends on hand-maintained UTC offsets.

```ts
read = createClockReader({ locale, timeZone: city.timeZone });
const clock = read(now, format);
```

Compare locale-formatted calendar dates with the device local date before
showing a date below a city. Timezone identifiers remain visible in a secondary
style. Date formatting and daylight-saving rules come from built-in Intl.
Formatters are cached by timezone and rebuilt when locale/format changes.

```ts
differentDate: clock.calendarDate === localDate ? null : clock.calendarDate
```

One focused wall-clock subscription updates all entries, with an immediate
foreground read. No per-city intervals, countdown counters, remote APIs or new
dependencies are involved. Picker/empty views do not tick. Shared focus/route
motion retains the existing reduced-motion handling; city digits update directly.

The pure selection store persists known city IDs to a versioned app-private
document. Missing/corrupt data uses defaults, partial data is filtered/deduplicated,
and an intentionally empty list remains empty. Failed writes do not commit a
different in-memory selection. An unsupported timezone is isolated to that city.
The explicit timezone uses the runtime's IANA rules as specified by
[ECMA-402](https://tc39.es/ecma402/#sec-intl.datetimeformat-constructor).

## Problems addressed

Fixed offsets are wrong when London, New York or Sydney changes daylight-saving
time. Tests span both northern and southern transitions and dates across midnight.
A deleted TV focus target can leave navigation awkward; selection changes
explicitly request focus on the existing Add control. All selected cities can be
re-added through the curated picker without typing.

## Evidence

- Pure tests: `tests/worldClocks.test.ts` (four-city accuracy, midnight/date
  differences, US/UK/Australian DST, preference reuse, invalid zones, persisted
  selections, corruption, failed writes and shared lifecycle).
- Native tests: `tests/tv/worldClocks.test.ts`.
- Screenshot: [World Clocks](../../artifacts/utilities/world-clocks.png).
- Demo: [Remote city selection](../../artifacts/utilities/world-clocks-demo.mp4).

ESLint, strict TypeScript, all 48 unit tests and Android Expo/Metro export passed.
The dedicated native acceptance passed real D-pad add/remove, city-time/date
comparisons, saved selection after restart, foreground recovery, shared 12/24-hour
format changes through Clock, and Home/Back focus restoration. The final combined
suite passed all 22 TV results, with no failures/skips. The screenshot is
1920 × 1080; the native demo is 50 seconds at 1280 × 720. Artifact links refer to
the running application, not mockups. See the [delivery report](../utilities-delivery.md).
