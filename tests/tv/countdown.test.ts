import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

import { adb, appId, assertRail, byId, expectFocus, focusControl, keys, launchUtility, screenshot, snapshot } from './driver.ts';

const remaining = () => {
  const text = byId(snapshot(), 'countdown-remaining')?.text ?? '';
  const values = text.match(/\d+/g)?.map(Number);
  assert.ok(values?.length === 4, text);
  return values[0] * 86400 + values[1] * 3600 + values[2] * 60 + values[3];
};
function openActions() {
  focusControl('Countdown actions'); keys('DPAD_CENTER'); expectFocus('Edit countdown');
  assert.ok(byId(snapshot(), 'countdown-actions'));
}
test('Countdown remote creation, editing, multiple events, restart/foreground accuracy and confirmed deletion', { timeout: 600_000 }, async () => {
  let initial = await launchUtility(3, 'countdown-list'); expectFocus('New countdown');
  assert.ok(!initial.some((node) => node.text === 'Your next moment starts here.')); screenshot('countdown-empty'); keys('DPAD_CENTER');
  expectFocus('Edit event name'); keys('DPAD_CENTER'); expectFocus('A');
  keys(...Array(6).fill('DPAD_DOWN')); expectFocus('Clear'); keys('DPAD_CENTER'); expectFocus('A');
  keys('DPAD_CENTER', 'DPAD_RIGHT', 'DPAD_CENTER', ...Array(6).fill('DPAD_DOWN'));
  focusControl('Done');
  expectFocus('Done'); keys('DPAD_CENTER'); expectFocus('Edit event name');
  focusControl('Save countdown'); keys('DPAD_CENTER'); expectFocus('New countdown');
  initial = snapshot(); assert.ok(initial.some((node) => node.text?.includes('AB')));
  assert.ok(!initial.some((node) => ['Edit countdown', 'Delete countdown'].includes(node['content-desc'])));
  screenshot('countdown-list');
  focusControl('Open AB'); keys('DPAD_CENTER'); expectFocus('All countdowns');
  assert.ok(!snapshot().some((node) => ['Edit countdown', 'Delete countdown'].includes(node['content-desc'])));
  const before = remaining(); assert.ok(before > 86000 && before <= 86400);
  await delay(2200); assert.ok(remaining() < before); screenshot('countdown'); assertRail(snapshot());
  const targetBefore = byId(snapshot(), 'countdown-target')?.text;
  openActions(); screenshot('countdown-actions'); keys('BACK'); expectFocus('Countdown actions');
  openActions(); keys('DPAD_CENTER'); expectFocus('Edit event name');
  focusControl('Increase minute'); keys('DPAD_CENTER'); focusControl('Save countdown'); keys('DPAD_CENTER');
  focusControl('Open AB'); keys('DPAD_CENTER'); expectFocus('All countdowns');
  assert.notEqual(byId(snapshot(), 'countdown-target')?.text, targetBefore, 'editing the minute changes the saved target');
  keys('BACK'); expectFocus('New countdown'); keys('DPAD_CENTER'); expectFocus('Edit event name');
  focusControl('Save countdown'); keys('DPAD_CENTER'); expectFocus('New countdown');
  let nodes = snapshot(); assert.ok(nodes.some((n) => n['content-desc'] === 'Open AB'));
  assert.ok(nodes.some((n) => n['content-desc'] === 'Open My event'));
  screenshot('countdown-list');
  await launchUtility(3, 'countdown-list'); focusControl('Open AB'); keys('DPAD_CENTER'); expectFocus('All countdowns');
  const backgroundBefore = remaining(); keys('HOME'); await delay(3000);
  adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`); await delay(1200);
  assert.ok(remaining() < backgroundBefore, 'foreground recomputes from wall time'); assertRail(snapshot());
  openActions(); focusControl('Delete countdown'); keys('DPAD_CENTER'); expectFocus('Keep countdown');
  keys('BACK'); expectFocus('Countdown actions'); openActions(); focusControl('Delete countdown'); keys('DPAD_CENTER');
  expectFocus('Keep countdown'); keys('DPAD_RIGHT', 'DPAD_CENTER'); expectFocus('New countdown');
  nodes = snapshot(); assert.ok(!nodes.some((n) => n['content-desc'] === 'Open AB'));
  focusControl('Open My event'); keys('DPAD_CENTER'); expectFocus('All countdowns');
  openActions(); focusControl('Delete countdown'); keys('DPAD_CENTER'); expectFocus('Keep countdown'); keys('DPAD_RIGHT', 'DPAD_CENTER');
  expectFocus('New countdown'); keys('BACK'); assert.ok(byId(expectFocus('Countdown'), 'dashboard-clock'));
});
