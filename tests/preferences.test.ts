import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createClockPreferences, displayedTimestamp } from '../src/clock/preferences.ts';

test('missing preferences default to 24-hour; both formats survive a fresh store using persisted JSON', () => {
  const directory = mkdtempSync(join(tmpdir(), 'timeboxed-preferences-'));
  const path = join(directory, 'clock-preferences.json');
  let exists = false;
  const storage = {
    read: () => exists ? readFileSync(path, 'utf8') : null,
    write(value: string) { writeFileSync(path, value); exists = true; },
  };
  try {
    const store = createClockPreferences(storage);
    assert.deepEqual(store.getSnapshot(), { format: '24h', source: 'automatic', manual: null, error: null });
    store.setFormat('12h');
    assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), { version: 2, format: '12h', source: 'automatic', manual: null });
    const restarted = createClockPreferences(storage);
    assert.deepEqual(restarted.getSnapshot(), { format: '12h', source: 'automatic', manual: null, error: null });
    restarted.setFormat('24h');
    assert.deepEqual(createClockPreferences(storage).getSnapshot(), { format: '24h', source: 'automatic', manual: null, error: null });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('corrupt, unsupported and incomplete preferences recover to 24-hour without crashing', () => {
  for (const raw of ['{bad', 'null', 'false', '{}', '{"version":2,"format":"12h"}', '{"version":1,"format":"13h"}']) {
    const store = createClockPreferences({ read: () => raw, write: () => {} });
    assert.deepEqual(store.getSnapshot(), { format: '24h', source: 'automatic', manual: null, error: 'load' });
    store.setFormat('24h');
    assert.deepEqual(store.getSnapshot(), { format: '24h', source: 'automatic', manual: null, error: null });
  }
});

test('storage failures keep the clock usable and allow saving to be retried', () => {
  let fail = true;
  const store = createClockPreferences({
    read() { throw new Error('Unavailable'); },
    write() { if (fail) throw new Error('Full'); },
  });
  assert.equal(store.getSnapshot().error, 'load');
  store.setFormat('12h');
  assert.deepEqual(store.getSnapshot(), { format: '12h', source: 'automatic', manual: null, error: 'save' });
  fail = false;
  store.setFormat('12h');
  assert.deepEqual(store.getSnapshot(), { format: '12h', source: 'automatic', manual: null, error: null });
});

test('manual time persists, advances from elapsed wall time and returns to automatic mode', () => {
  let systemNow = Date.parse('2026-11-11T10:00:00Z');
  let saved = '';
  const storage = { read: () => saved || null, write(value: string) { saved = value; } };
  const store = createClockPreferences(storage, () => systemNow);
  store.setManualTime(Date.parse('2030-01-02T03:04:00Z'));
  assert.equal(store.getSnapshot().source, 'manual');
  systemNow += 65_000;
  assert.equal(displayedTimestamp(store.getSnapshot(), systemNow), Date.parse('2030-01-02T03:05:05Z'));
  const restarted = createClockPreferences(storage, () => systemNow);
  assert.equal(displayedTimestamp(restarted.getSnapshot(), systemNow), Date.parse('2030-01-02T03:05:05Z'));
  restarted.setSource('automatic');
  assert.equal(displayedTimestamp(restarted.getSnapshot(), systemNow), systemNow);
});

test('version-one format preferences migrate and damaged manual references recover safely', () => {
  const migrated = createClockPreferences({ read: () => '{"version":1,"format":"12h"}', write() {} });
  assert.deepEqual(migrated.getSnapshot(), { format: '12h', source: 'automatic', manual: null, error: null });
  for (const raw of [
    '{"version":2,"format":"24h","source":"manual","manual":null}',
    '{"version":2,"format":"24h","source":"manual","manual":{"clockTimestamp":1}}',
  ]) assert.equal(createClockPreferences({ read: () => raw, write() {} }).getSnapshot().error, 'load');
});

test('preference notifications skip unchanged choices and unsubscribe cleanly', () => {
  let notifications = 0;
  let writes = 0;
  const store = createClockPreferences({ read: () => null, write() { writes++; } });
  const unsubscribe = store.subscribe(() => { notifications++; });
  const initial = store.getSnapshot();
  store.setFormat('24h');
  assert.equal(store.getSnapshot(), initial);
  store.setFormat('12h'); store.setFormat('12h');
  assert.equal(notifications, 1);
  assert.equal(writes, 1);
  unsubscribe();
  store.setFormat('24h');
  assert.equal(notifications, 1);
});
