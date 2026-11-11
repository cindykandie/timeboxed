import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fontFamilies } from '../src/typography/model.ts';
import { createTypographyPreferences } from '../src/typography/preferences.ts';

test('typography defaults to Satoshi without writing storage', () => {
  const store = createTypographyPreferences({ read: () => null, write: () => assert.fail('No write during startup') });
  assert.deepEqual(store.getSnapshot(), { family: 'satoshi', error: null });
});

test('every font, including System, persists and reloads with stable subscriptions', () => {
  let raw: string | null = null;
  const storage = { read: () => raw, write: (value: string) => { raw = value; } };
  const store = createTypographyPreferences(storage);
  let notifications = 0;
  const stop = store.subscribe(() => notifications++);
  for (const family of ['system', ...fontFamilies] as const) {
    store.setFamily(family);
    assert.equal(createTypographyPreferences(storage).getSnapshot().family, family);
    assert.equal(store.getSnapshot().family, family);
  }
  assert.equal(notifications, 5);
  store.setFamily('system'); assert.equal(notifications, 5);
  stop(); store.setFamily('satoshi'); assert.equal(notifications, 5);
});

test('corrupted or unsupported saved fonts recover to Satoshi and can be repaired', () => {
  for (const raw of ['{', 'null', '[]', '{}', '{"version":2,"family":"system"}',
    '{"version":1,"family":"remote-font"}', '{"version":1,"family":4}']) {
    let saved = raw;
    const store = createTypographyPreferences({ read: () => saved, write: (value) => { saved = value; } });
    assert.deepEqual(store.getSnapshot(), { family: 'satoshi', error: 'load' });
    store.setFamily('satoshi');
    assert.deepEqual(store.getSnapshot(), { family: 'satoshi', error: null });
    assert.deepEqual(JSON.parse(saved), { version: 1, family: 'satoshi' });
  }
});

test('font storage read/write failures remain usable and a failed save can be retried', () => {
  let fail = true;
  let saved: string | null = null;
  const store = createTypographyPreferences({
    read() { throw new Error('Unavailable'); },
    write(value) { if (fail) throw new Error('Full disk'); saved = value; },
  });
  assert.equal(store.getSnapshot().error, 'load');
  store.setFamily('cabinet-grotesk');
  assert.deepEqual(store.getSnapshot(), { family: 'cabinet-grotesk', error: 'save' });
  assert.equal(saved, null);
  fail = false; store.setFamily('cabinet-grotesk');
  assert.deepEqual(store.getSnapshot(), { family: 'cabinet-grotesk', error: null });
  assert.equal(createTypographyPreferences({ read: () => saved, write() {} }).getSnapshot().family, 'cabinet-grotesk');
});
