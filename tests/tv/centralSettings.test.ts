import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assertRail, byId, expectFocus, focusControl, focusRail, keys, launchUtility, screenshot, snapshot } from './driver.ts';

function openSettings() {
  focusRail('Home'); keys('DPAD_DOWN'); expectFocus('Settings'); keys('DPAD_CENTER');
  const nodes = snapshot(); assert.ok(byId(nodes, 'settings-shell')); assert.ok(byId(nodes, 'settings-secondary-navigation'));
  assert.ok(byId(nodes, 'font-settings')); assertRail(nodes);
}
function openSection(name: string, marker: string) {
  focusControl(name); keys('DPAD_CENTER');
  const nodes = snapshot(); assert.ok(byId(nodes, marker)); assertRail(nodes);
}
function backToClock() {
  keys('BACK'); assert.ok(byId(snapshot(), 'clock-time'));
}

test('central Settings shares manual time, format, utility preferences and icon-only ambient control', { timeout: 600_000 }, async () => {
  await launchUtility(1, 'clock-time');
  expectFocus('Enter ambient mode');
  let nodes = snapshot();
  assert.ok(byId(nodes, 'action-icon-ambient'));
  assert.ok(!nodes.some((node) => node.text === 'Ambient'));
  screenshot('clock-automatic');

  openSettings(); screenshot('settings-appearance');
  openSection('Timer', 'timer-settings'); screenshot('settings-timer');
  openSection('Clock', 'clock-settings');
  focusControl('Automatic'); keys('DPAD_CENTER');
  screenshot('settings-clock-automatic');
  focusControl('Manual'); keys('DPAD_CENTER'); expectFocus('Manual');
  focusControl('Increase minute'); keys('DPAD_CENTER');
  focusControl('Save manual time'); keys('DPAD_CENTER');
  assert.equal(snapshot().find((node) => node['content-desc'] === 'Manual')?.selected, 'true');
  screenshot('settings-clock-manual');
  backToClock();
  nodes = snapshot(); assert.ok(byId(nodes, 'clock-manual')); screenshot('clock-manual');

  focusControl('12-hour'); keys('DPAD_CENTER');
  openSettings(); openSection('Clock', 'clock-settings');
  assert.equal(snapshot().find((node) => node['content-desc'] === '12-hour')?.selected, 'true');
  backToClock();
  focusControl('Enter ambient mode'); keys('DPAD_CENTER'); expectFocus('Exit ambient mode');
  assert.ok(byId(snapshot(), 'clock-manual')); screenshot('clock-ambient-manual');
  keys('DPAD_CENTER'); assert.ok(byId(snapshot(), 'clock-time'));

  openSettings(); openSection('Clock', 'clock-settings');
  focusControl('Automatic'); keys('DPAD_CENTER');
  backToClock();
  assert.ok(!byId(snapshot(), 'clock-manual'));
});
