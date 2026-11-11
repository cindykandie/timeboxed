import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

import { assertRail, byId, expectFocus, focusControl, keys, launchUtility, screenshot, snapshot } from './driver.ts';

function remaining() {
  const label = snapshot().find((node) => /^(?:\d{2}:)?\d{2}:\d{2} remaining$/.test(node['content-desc']))?.['content-desc'];
  assert.ok(label);
  return label.split(' ')[0].split(':').map(Number).reduce((total, value) => total * 60 + value, 0);
}
test('Timer icon controls retain accessible names, remote actions, navigation state and completion', { timeout: 420_000 }, async () => {
  await launchUtility(0, 'utility-content'); let nodes = expectFocus('Start');
  assert.ok(byId(nodes, 'action-icon-play') && byId(nodes, 'action-icon-reset'));
  assert.ok(!nodes.some((node) => ['Start', 'Pause', 'Resume', 'Reset', 'Start again'].includes(node.text)));
  for (const minutes of [10, 15, 45]) {
    assert.equal(nodes.find((node) => node['content-desc'] === `${minutes} minutes`)?.focusable, 'true');
  }
  assertRail(nodes); screenshot('timer-play');
  keys('DPAD_CENTER'); nodes = expectFocus('Pause'); assert.ok(byId(nodes, 'action-icon-pause')); screenshot('timer-pause');
  keys('DPAD_CENTER'); nodes = expectFocus('Resume'); assert.ok(byId(nodes, 'action-icon-play'));
  const paused = remaining(); screenshot('timer-resume');
  keys('BACK'); expectFocus('Timer'); keys('DPAD_CENTER'); expectFocus('Resume'); assert.equal(remaining(), paused);
  keys('DPAD_CENTER'); nodes = expectFocus('Pause'); assert.ok(byId(nodes, 'action-icon-pause'));
  keys('DPAD_RIGHT'); expectFocus('Reset'); keys('DPAD_CENTER'); assert.equal(remaining(), 10 * 60);
  focusControl('10 minutes'); keys('DPAD_CENTER'); focusControl('Custom'); keys('DPAD_CENTER'); expectFocus('Cancel');
  focusControl('Decrease minutes'); keys(...Array<string>(10).fill('DPAD_CENTER'));
  focusControl('Increase seconds'); keys(...Array<string>(20).fill('DPAD_CENTER'));
  focusControl('Use duration'); keys('DPAD_CENTER'); expectFocus('Custom'); focusControl('Start'); assert.equal(remaining(), 20);
  keys('DPAD_CENTER'); expectFocus('Pause'); await delay(21_000);
  nodes = expectFocus('Start again'); assert.ok(byId(nodes, 'action-icon-play')); assert.equal(remaining(), 0);
  assert.ok(nodes.some((node) => node.text === 'Complete')); screenshot('timer-complete');
  keys('DPAD_CENTER'); nodes = expectFocus('Pause'); assert.ok(byId(nodes, 'action-icon-pause')); assert.ok(remaining() > 0);
  keys('DPAD_RIGHT', 'DPAD_CENTER'); focusControl('10 minutes'); keys('DPAD_CENTER'); focusControl('Start');
  assert.equal(remaining(), 10 * 60); screenshot('timer-play'); keys('BACK'); expectFocus('Timer');
});
