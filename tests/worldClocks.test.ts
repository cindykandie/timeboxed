import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createClockPreferences } from '../src/clock/preferences.ts';
import { watchWallTime } from '../src/time/wallTime.ts';
import { cities, defaultCities, getCity } from '../src/worldClocks/cities.ts';
import { createWorldClockReader } from '../src/worldClocks/format.ts';
import { createWorldClocksStore } from '../src/worldClocks/store.ts';

const read = createWorldClockReader({ locale: 'en-US', timeZone: 'Africa/Nairobi' });
const selected = defaultCities.map(getCity);
test('World Clocks has all 14 curated IANA cities and sensible defaults including Nairobi', () => {
  assert.equal(cities.length, 14); assert.equal(new Set(cities.map((city) => city.id)).size, 14);
  assert.deepEqual(defaultCities, ['nairobi', 'london', 'new-york', 'tokyo']);
  for (const city of cities) assert.doesNotThrow(() => new Intl.DateTimeFormat('en', { timeZone: city.timeZone }));
});

test('Nairobi, London, New York and Tokyo format one instant with their IANA rules', () => {
  const clocks = read(selected, Date.parse('2026-11-09T12:34:56Z'), '24h');
  assert.deepEqual(clocks.map((item) => item.clock?.time), ['15:34:56', '12:34:56', '07:34:56', '21:34:56']);
  assert.ok(clocks.every((item) => item.differentDate === null));
  assert.deepEqual(clocks.map((item) => item.clock?.timeZone), ['Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Tokyo']);
});

test('World Clocks displays date differences and follows midnight for each city', () => {
  const clocks = read(selected, Date.parse('2026-11-09T21:30:00Z'), '24h');
  assert.equal(clocks[0].clock?.calendarDate, 'November 10, 2026');
  assert.equal(clocks[1].differentDate, 'November 9, 2026');
  assert.equal(clocks[2].differentDate, 'November 9, 2026');
  assert.equal(clocks[3].differentDate, null);
  const midnight = read([getCity('tokyo')], Date.parse('2026-11-09T15:00:00Z'), '24h')[0];
  assert.equal(midnight.clock?.time, '00:00:00'); assert.equal(midnight.differentDate, 'November 10, 2026');
});

test('World Clocks follows northern and southern daylight-saving transitions without fixed offsets', () => {
  const cases = [
    ['new-york', '2026-03-08T06:59:59Z', '2026-03-08T07:00:00Z', '01:59:59', '03:00:00'],
    ['new-york', '2026-11-01T05:59:59Z', '2026-11-01T06:00:00Z', '01:59:59', '01:00:00'],
    ['london', '2026-03-29T00:59:59Z', '2026-03-29T01:00:00Z', '00:59:59', '02:00:00'],
    ['london', '2026-10-25T00:59:59Z', '2026-10-25T01:00:00Z', '01:59:59', '01:00:00'],
    ['sydney', '2026-10-03T15:59:59Z', '2026-10-03T16:00:00Z', '01:59:59', '03:00:00'],
  ] as const;
  for (const [id, before, after, expectedBefore, expectedAfter] of cases) {
    assert.equal(read([getCity(id)], Date.parse(before), '24h')[0].clock?.time, expectedBefore);
    assert.equal(read([getCity(id)], Date.parse(after), '24h')[0].clock?.time, expectedAfter);
  }
});

test('World Clocks shares Clock preference formatting and handles bad timezone identifiers per city', () => {
  const preferences = createClockPreferences({ read: () => null, write() {} });
  const now = Date.parse('2026-11-09T12:34:56Z');
  assert.equal(read(selected, now, preferences.getSnapshot().format)[0].clock?.time, '15:34:56');
  preferences.setFormat('12h');
  const clocks = read(selected, now, preferences.getSnapshot().format);
  assert.equal(clocks[0].clock?.digits, '03:34:56'); assert.equal(clocks[0].clock?.dayPeriod, 'PM');
  const invalid = { id: 'bad', name: 'Unknown', country: '', timeZone: 'Invalid/Nowhere' };
  const result = read([invalid, getCity('nairobi')], now, '24h');
  assert.equal(result[0].clock, null); assert.equal(result[1].clock?.time, '15:34:56');
});

test('selected cities add/remove without duplicates, persist restart and retain an intentionally empty selection', () => {
  let raw: string | null = null; let changes = 0;
  const storage = { read: () => raw, write(value: string) { raw = value; } };
  const store = createWorldClocksStore(storage); const unsubscribe = store.subscribe(() => changes++);
  assert.deepEqual(store.getSnapshot().selected, defaultCities);
  store.add('dubai'); store.add('dubai'); store.remove('london');
  assert.deepEqual(createWorldClocksStore(storage).getSnapshot().selected, ['nairobi', 'new-york', 'tokyo', 'dubai']);
  assert.equal(changes, 2); unsubscribe();
  for (const id of store.getSnapshot().selected) store.remove(id);
  assert.deepEqual(createWorldClocksStore(storage).getSnapshot().selected, []);
  assert.equal(changes, 2);
});

test('World Clocks recovers corrupt/missing selections and retains saved cities after failed writes', () => {
  for (const raw of ['{', '{}', '{"version":2,"cities":[]}', '{"version":1,"cities":["unknown"]}']) {
    const store = createWorldClocksStore({ read: () => raw, write() {} });
    assert.deepEqual(store.getSnapshot().selected, defaultCities); assert.ok(store.getSnapshot().error);
  }
  const partial = createWorldClocksStore({ read: () => '{"version":1,"cities":["nairobi","nairobi","unknown","tokyo"]}', write() { throw new Error(); } });
  assert.deepEqual(partial.getSnapshot().selected, ['nairobi', 'tokyo']); assert.ok(partial.getSnapshot().error);
  assert.equal(partial.add('london'), false); assert.equal(partial.remove('nairobi'), false);
  assert.deepEqual(partial.getSnapshot().selected, ['nairobi', 'tokyo']); assert.match(partial.getSnapshot().error!, /save/);
});

test('one wall-clock subscription updates multiple city clocks and foreground return reads fresh time', () => {
  let now = Date.parse('2026-11-09T12:34:56Z'); let active = false;
  let change: (() => void) | undefined; let tick: (() => void) | undefined; let latest: string[] = [];
  const stop = watchWallTime({ isActive: () => active, subscribe(callback) { change = callback; return () => { change = undefined; }; } },
    (value) => { latest = read(selected, value, '24h').map((item) => item.clock!.time); }, () => now,
    { every(callback) { assert.equal(tick, undefined); tick = callback; return () => { tick = undefined; }; } });
  assert.equal(tick, undefined); assert.deepEqual(latest, []);
  active = true; change!(); const before = latest;
  now += 1000; tick!(); assert.ok(latest.every((value, index) => value !== before[index]));
  change!(); active = false; change!(); assert.equal(tick, undefined);
  now += 86400000; active = true; change!();
  assert.equal(latest[0], '15:34:57'); stop(); assert.equal(tick, undefined); assert.equal(change, undefined);
});
