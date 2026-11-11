import { createClockReader } from '../clock/localClock.ts';
import type { ClockFormat, LocalClock } from '../clock/localClock.ts';
import type { City } from './cities.ts';

export type CityClock = { city: City; clock: LocalClock | null; differentDate: string | null };

// One frame shares one timestamp and device locale. Reuse Clock's formatter and
// hour-cycle behavior, with an explicit IANA timezone for each city.
export function createWorldClockReader(settings?: { locale: string; timeZone: string }) {
  const local = createClockReader(settings);
  const readers = new Map<string, ReturnType<typeof createClockReader>>();
  let locale: string;
  return (cities: readonly City[], now: number, format: ClockFormat): CityClock[] => {
    const device = settings ?? Intl.DateTimeFormat().resolvedOptions();
    if (locale !== device.locale) { locale = device.locale; readers.clear(); }
    const localDate = local(now, format).calendarDate;
    return cities.map((city) => {
      try {
        let read = readers.get(city.timeZone);
        if (!read) { read = createClockReader({ locale, timeZone: city.timeZone }); readers.set(city.timeZone, read); }
        const clock = read(now, format);
        return { city, clock, differentDate: clock.calendarDate === localDate ? null : clock.calendarDate };
      } catch { return { city, clock: null, differentDate: null }; }
    });
  };
}
