import assert from 'node:assert/strict';
import { test } from 'node:test';

import { localFields, remainingLabel, remainingParts, targetTimestamp } from '../src/countdown/model.ts';
import { createCountdownStore } from '../src/countdown/store.ts';
import { watchWallTime } from '../src/time/wallTime.ts';

test('Countdown uses timestamps for exact days/hours/minutes/seconds and keeps expired values at zero', () => {
  assert.deepEqual(remainingParts(93784000, 0), { days: 1, hours: 2, minutes: 3, seconds: 4, completed: false });
  assert.equal(remainingParts(1500, 501).seconds, 1);
  assert.equal(remainingLabel(0, 1000), 'Event started');
  assert.deepEqual(remainingParts(0, 1000), { days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
});

test('Countdown interprets local calendar fields, rejects invalid dates/times and DST gaps', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'Africa/Nairobi';
    const fields = { year: 2028, month: 2, day: 29, hour: 15, minute: 30 };
    const target = targetTimestamp(fields, 0);
    assert.equal(new Date(target).toISOString(), '2028-02-29T12:30:00.000Z');
    assert.deepEqual(localFields(target), fields);
    for (const patch of [{ year: 2027 }, { month: 13 }, { day: 30 }, { hour: 24 }, { minute: -1 }, { minute: 1.5 }]) {
      assert.throws(() => targetTimestamp({ ...fields, ...patch }, 0));
    }
    assert.throws(() => targetTimestamp(fields, target), /future/);
    process.env.TZ = 'America/New_York';
    assert.throws(() => targetTimestamp({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, 0), /does not exist/);
    const folded = targetTimestamp({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, 0);
    assert.equal(new Date(folded).toISOString(), '2026-11-01T05:30:00.000Z');
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test('Countdown creates multiple events, edits without replacing identity, persists restart and deletes', () => {
  let raw: string | null = null; let next = 0; let notifications = 0;
  const storage = { read: () => raw, write(value: string) { raw = value; } };
  const store = createCountdownStore(storage, () => 1000, () => `id-${next++}`);
  const unsubscribe = store.subscribe(() => notifications++);
  assert.equal(store.save(' Birthday ', 100000), true);
  assert.equal(store.save('Launch', 200000), true);
  assert.equal(store.save('Birthday edited', 300000, 'id-0'), true);
  assert.deepEqual(store.getSnapshot().events[0], { id: 'id-0', name: 'Birthday edited', targetAt: 300000, createdAt: 1000 });
  const restarted = createCountdownStore(storage, () => 400000);
  assert.equal(restarted.getSnapshot().events.length, 2, 'expired events survive restart');
  assert.equal(restarted.remove('id-0'), true);
  assert.deepEqual(createCountdownStore(storage).getSnapshot().events.map((item) => item.id), ['id-1']);
  assert.equal(notifications, 3); unsubscribe();
  assert.equal(store.save('', 100000), false); assert.equal(notifications, 3);
  assert.equal(store.save('Past', 0), false);
  assert.equal(store.save('Invalid', NaN), false);
  assert.equal(store.save('Missing', 10000, 'missing'), false);
});

test('Countdown validates corrupted storage, salvages valid records and reports disk failures without losing data', () => {
  for (const raw of ['{', '{}', '{"version":2,"events":[]}', '{"version":1,"events":null}']) {
    const store = createCountdownStore({ read: () => raw, write() {} });
    assert.equal(store.getSnapshot().events.length, 0); assert.ok(store.getSnapshot().error);
  }
  assert.equal(createCountdownStore({ read: () => null, write() {} }).getSnapshot().error, null);
  const event = { id: 'a', name: 'Valid', createdAt: 0, targetAt: 100000 };
  const raw = JSON.stringify({ version: 1, events: [event, event, { ...event, id: 'b', targetAt: 'tomorrow' }] });
  const store = createCountdownStore({ read: () => raw, write() { throw new Error('Disk full'); } }, () => 0);
  assert.equal(store.getSnapshot().events.length, 1); assert.ok(store.getSnapshot().error);
  assert.equal(store.remove('a'), false); assert.equal(store.getSnapshot().events.length, 1);
  assert.equal(store.save('Replacement', 200000, 'a'), false);
  assert.equal(store.getSnapshot().events[0].name, 'Valid'); assert.match(store.getSnapshot().error!, /save/);
});

test('wall time refreshes after suspension, owns at most one interval/listener, and cleans up', () => {
  let active = true; let now = 1000;
  const listeners = new Set<() => void>(); const intervals = new Set<() => void>(); const reads: number[] = [];
  const stop = watchWallTime({ isActive: () => active, subscribe(callback) { listeners.add(callback); return () => { listeners.delete(callback); }; } },
    (value) => reads.push(value), () => now,
    { every(callback) { intervals.add(callback); return () => { intervals.delete(callback); }; } });
  assert.deepEqual(reads, [1000]); assert.equal(intervals.size, 1); assert.equal(listeners.size, 1);
  listeners.forEach((change) => change()); assert.equal(intervals.size, 1);
  now += 93784000; intervals.forEach((tick) => tick()); assert.equal(reads.at(-1), now);
  active = false; listeners.forEach((change) => change()); assert.equal(intervals.size, 0);
  now += 86400000; active = true; listeners.forEach((change) => change());
  assert.equal(reads.at(-1), now); assert.equal(intervals.size, 1);
  stop(); stop(); assert.equal(intervals.size, 0); assert.equal(listeners.size, 0);
});
