import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createClockReader, watchActiveClock, watchClock } from '../src/clock/localClock.ts';

test('clock displays local time, full date and the configured timezone', () => {
  const read = createClockReader({ locale: 'en-US', timeZone: 'Africa/Nairobi' });
  assert.deepEqual(read(Date.parse('2026-11-09T12:34:56Z')), {
    time: '15:34:56', digits: '15:34:56', dayPeriod: '', weekday: 'Monday', calendarDate: 'November 9, 2026',
    date: 'Monday, November 9, 2026', timeZone: 'Africa/Nairobi',
  });
});

test('clock updates the date at local midnight and follows timezone daylight saving rules', () => {
  const read = createClockReader({ locale: 'en-US', timeZone: 'Africa/Nairobi' });
  assert.equal(read(Date.parse('2026-11-09T20:59:59Z')).time, '23:59:59');
  assert.deepEqual(read(Date.parse('2026-11-09T21:00:00Z')), {
    time: '00:00:00', digits: '00:00:00', dayPeriod: '', weekday: 'Tuesday', calendarDate: 'November 10, 2026',
    date: 'Tuesday, November 10, 2026', timeZone: 'Africa/Nairobi',
  });
  const newYork = createClockReader({ locale: 'en-US', timeZone: 'America/New_York' });
  assert.equal(newYork(Date.parse('2026-03-08T06:59:59Z')).time, '01:59:59');
  assert.equal(newYork(Date.parse('2026-03-08T07:00:00Z')).time, '03:00:00');
});

test('clock rebuilds formatters when local timezone settings change', () => {
  const settings = { locale: 'en-US', timeZone: 'Africa/Nairobi' };
  const read = createClockReader(settings);
  const now = Date.parse('2026-11-09T12:34:56Z');
  assert.equal(read(now).time, '15:34:56');
  settings.timeZone = 'UTC';
  assert.equal(read(now).time, '12:34:56');
  assert.equal(read(now).timeZone, 'UTC');
});

test('12-hour midnight/noon include AM/PM, 24-hour midnight is 00, and switching formats rebuilds the cache', () => {
  const read = createClockReader({ locale: 'en-US', timeZone: 'UTC' });
  for (const [instant, digits, period, time24] of [
    ['2026-11-09T00:00:00Z', '12:00:00', 'AM', '00:00:00'],
    ['2026-11-09T12:00:00Z', '12:00:00', 'PM', '12:00:00'],
    ['2026-11-09T23:59:59Z', '11:59:59', 'PM', '23:59:59'],
  ]) {
    const now = Date.parse(instant);
    const value = read(now, '12h');
    assert.equal(value.digits, digits);
    assert.equal(value.dayPeriod, period);
    assert.match(value.time, new RegExp(`${period}$`));
    assert.equal(read(now, '24h').time, time24);
    assert.equal(read(now, '24h').dayPeriod, '');
  }
});

test('default clock reader uses the runtime device locale/timezone and a valid current time', () => {
  const now = Date.now();
  const clock = createClockReader()(now);
  const resolved = Intl.DateTimeFormat().resolvedOptions();
  assert.equal(clock.timeZone, resolved.timeZone);
  assert.equal(clock.weekday, new Intl.DateTimeFormat(resolved.locale, { weekday: 'long' }).format(now));
  assert.equal(clock.time, new Intl.DateTimeFormat(resolved.locale, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(now));
});

test('date and day period use the selected locale', () => {
  const now = Date.parse('2026-11-09T14:00:00Z');
  const value = createClockReader({ locale: 'de-DE', timeZone: 'Europe/Berlin' })(now);
  assert.equal(value.weekday, 'Montag');
  assert.equal(value.calendarDate, '9. November 2026');
  assert.equal(value.time, '15:00:00');
});

test('clock refreshes immediately, uses wall time after delays, and disposes its interval', () => {
  let now = Date.parse('2026-11-09T12:34:56Z');
  const reader = createClockReader({ locale: 'en-US', timeZone: 'Africa/Nairobi' });
  const values: string[] = [];
  const callbacks = new Set<() => void>();
  const scheduler = {
    every(callback: () => void) { callbacks.add(callback); return () => { callbacks.delete(callback); }; },
  };
  const read = () => reader(now);
  const update = (clock: { time: string }) => { values.push(clock.time); };
  const stop = watchClock(update, read, scheduler);
  assert.deepEqual(values, ['15:34:56']);
  assert.equal(callbacks.size, 1);
  now += 1000;
  callbacks.forEach((callback) => callback());
  assert.equal(values.at(-1), '15:34:57');
  now += 65_000;
  callbacks.forEach((callback) => callback());
  assert.equal(values.at(-1), '15:36:02');
  stop();
  assert.equal(callbacks.size, 0);
  now += 3_600_000;
  const stopAgain = watchClock(update, read, scheduler);
  assert.equal(values.at(-1), '16:36:02', 'returning from background/another screen refreshes immediately');
  stopAgain();
  assert.equal(callbacks.size, 0);
});

test('focused lifecycle refreshes on foreground, owns one interval/listener and cleans up idempotently', () => {
  let active = true;
  let now = Date.parse('2026-11-09T20:59:59Z');
  const listeners = new Set<() => void>();
  const callbacks = new Set<() => void>();
  const values: string[] = [];
  const read = createClockReader({ locale: 'en-US', timeZone: 'Africa/Nairobi' });
  const activity = {
    isActive: () => active,
    subscribe(callback: () => void) { listeners.add(callback); return () => { listeners.delete(callback); }; },
  };
  const scheduler = { every(callback: () => void) {
    callbacks.add(callback); return () => { callbacks.delete(callback); };
  } };
  const mount = () => watchActiveClock(activity, (clock) => values.push(`${clock.weekday} ${clock.time}`), () => read(now), scheduler);
  const dispose = mount();
  assert.deepEqual(values, ['Monday 23:59:59']);
  listeners.forEach((callback) => callback());
  listeners.forEach((callback) => callback());
  assert.equal(callbacks.size, 1, 'repeated active events must not duplicate intervals');
  assert.equal(listeners.size, 1);
  active = false;
  listeners.forEach((callback) => callback());
  assert.equal(callbacks.size, 0);
  now += 3_600_001;
  active = true;
  listeners.forEach((callback) => callback());
  assert.equal(values.at(-1), 'Tuesday 00:59:59', 'foreground refreshes immediately, including date rollover');
  assert.equal(callbacks.size, 1);
  dispose(); dispose();
  assert.equal(callbacks.size, 0);
  assert.equal(listeners.size, 0);
  const disposeAgain = mount();
  assert.equal(callbacks.size, 1);
  assert.equal(listeners.size, 1);
  disposeAgain();
  assert.equal(callbacks.size, 0);
  assert.equal(listeners.size, 0);
});

test('mounting a clock while backgrounded does no refresh work until active', () => {
  let active = false;
  let changed = () => {};
  let updates = 0;
  const callbacks = new Set<() => void>();
  const dispose = watchActiveClock({
    isActive: () => active,
    subscribe(callback) { changed = callback; return () => { changed = () => {}; }; },
  }, () => { updates++; }, createClockReader(), {
    every(callback) { callbacks.add(callback); return () => { callbacks.delete(callback); }; },
  });
  assert.equal(updates, 0);
  assert.equal(callbacks.size, 0);
  active = true;
  changed();
  assert.equal(updates, 1);
  assert.equal(callbacks.size, 1);
  dispose(); changed();
  assert.equal(callbacks.size, 0);
});
