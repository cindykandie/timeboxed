export type ClockFormat = '12h' | '24h';
export type LocalClock = {
  time: string;
  digits: string;
  dayPeriod: string;
  weekday: string;
  calendarDate: string;
  date: string;
  timeZone: string;
};
type ClockScheduler = { every: (callback: () => void) => () => void };

// Cache the formatters, but re-read device settings so changes made while the
// app is open (or backgrounded) appear without restarting TimeBoxed.
export function createClockReader(settings?: { locale: string; timeZone: string }) {
  let key: string;
  let time: Intl.DateTimeFormat;
  let date: Intl.DateTimeFormat;
  let weekday: Intl.DateTimeFormat;
  let calendarDate: Intl.DateTimeFormat;
  return (now = Date.now(), format: ClockFormat = '24h'): LocalClock => {
    const resolved = settings ?? Intl.DateTimeFormat().resolvedOptions();
    const nextKey = `${resolved.locale}/${resolved.timeZone}/${format}`;
    if (key !== nextKey) {
      key = nextKey;
      time = new Intl.DateTimeFormat(resolved.locale, {
        timeZone: resolved.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit',
        hourCycle: format === '12h' ? 'h12' : 'h23',
      });
      date = new Intl.DateTimeFormat(resolved.locale, {
        timeZone: resolved.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      weekday = new Intl.DateTimeFormat(resolved.locale, { timeZone: resolved.timeZone, weekday: 'long' });
      calendarDate = new Intl.DateTimeFormat(resolved.locale, {
        timeZone: resolved.timeZone, year: 'numeric', month: 'long', day: 'numeric',
      });
    }
    const parts = time.formatToParts(now);
    return {
      time: time.format(now),
      digits: parts.filter((part) => part.type !== 'dayPeriod').map((part) => part.value).join('').trim(),
      dayPeriod: parts.find((part) => part.type === 'dayPeriod')?.value ?? '',
      weekday: weekday.format(now), calendarDate: calendarDate.format(now),
      date: date.format(now), timeZone: resolved.timeZone,
    };
  };
}

export type ClockActivity = { isActive: () => boolean; subscribe: (change: () => void) => () => void };

// A focused screen owns exactly one app-state listener and at most one interval.
// Kept independent of React Native so lifecycle cleanup can be tested directly.
export function watchActiveClock(
  activity: ClockActivity,
  update: (clock: LocalClock) => void,
  read = createClockReader(),
  clock: ClockScheduler = scheduler,
) {
  let stop: (() => void) | undefined;
  let disposed = false;
  const sync = () => {
    if (disposed) return;
    if (activity.isActive()) stop ??= watchClock(update, read, clock);
    else { stop?.(); stop = undefined; }
  };
  const unsubscribe = activity.subscribe(sync);
  sync();
  return () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    stop?.();
    stop = undefined;
  };
}

const scheduler: ClockScheduler = {
  every(callback) {
    const id = setInterval(callback, 1000);
    return () => clearInterval(id);
  },
};

export function watchClock(
  update: (clock: LocalClock) => void,
  read = createClockReader(),
  clock: ClockScheduler = scheduler,
) {
  const refresh = () => update(read());
  refresh();
  return clock.every(refresh);
}
