import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assertRail, byId, expectFocus, focusControl, focusRail, keys, launchUtility, screenshot, snapshot } from './driver.ts';

function remaining() {
  const value = snapshot().find((node) => /^(?:\d{2}:)?\d{2}:\d{2} remaining$/.test(node['content-desc']))?.['content-desc'];
  assert.ok(value);
  return value.split(' ')[0].split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
}
let gearBounds: string;
function settingsVisible() {
  const nodes = snapshot(); assertRail(nodes);
  const buttons = nodes.filter((node) => node['resource-id'] === 'settings-button');
  assert.equal(buttons.length, 1); assert.equal(buttons[0].focusable, 'true');
  gearBounds ??= buttons[0].bounds; assert.equal(buttons[0].bounds, gearBounds, 'Settings position must be shared');
  const rect = gearBounds.match(/\d+/g)!.map(Number);
  assert.ok(rect[0] > 1600 && rect[1] > 850 && rect[2] < 1880 && rect[3] < 1050);
  return nodes;
}
function openSettings() {
  focusRail('Home'); keys('DPAD_DOWN'); expectFocus('Settings'); keys('DPAD_CENTER');
  assert.ok(byId(settingsVisible(), 'settings-secondary-navigation'));
  focusControl('Timer'); keys('DPAD_CENTER'); assert.ok(byId(settingsVisible(), 'timer-settings'));
}
function editFirstShortcut(step: 'Increase minutes' | 'Decrease minutes', count = 1) {
  focusControl('Edit shortcut 1'); expectFocus('Edit shortcut 1');
  settingsVisible(); keys('DPAD_CENTER'); expectFocus('Cancel'); settingsVisible();
  focusControl(step); keys(...Array<string>(count).fill('DPAD_CENTER'));
  screenshot('shortcut-editor');
  focusControl('Save shortcut'); keys('DPAD_CENTER'); expectFocus('Edit shortcut 1');
  screenshot('shortcuts');
  keys('BACK'); // return to the original utility after the panel has closed
}
test('three editable Timer shortcuts persist, retain sessions, and share Settings on every screen', { timeout: 1_200_000 }, async () => {
  await launchUtility(0, 'utility-content'); expectFocus('Start');
  let nodes = settingsVisible();
  const options = ['10 minutes', '15 minutes', '45 minutes', 'Custom'].map((name) => nodes.find((node) => node['content-desc'] === name));
  assert.ok(options.every((node) => node?.focusable === 'true'));
  assert.equal(new Set(options.map((node) => node!.bounds.match(/\d+/g)![1])).size, 1, 'all four options share one row');
  for (const old of ['5 min', '25 min', '30 min', '60 min']) assert.ok(!nodes.some((node) => node.text === old));
  assert.equal(remaining(), 600); screenshot('timer');
  for (const minutes of [15, 45, 10]) { focusControl(`${minutes} minutes`); keys('DPAD_CENTER'); assert.equal(remaining(), minutes * 60); }
  openSettings(); editFirstShortcut('Increase minutes');
  assert.equal(remaining(), 660, 'ready shortcut follows its edited value');
  nodes = settingsVisible(); assert.ok(nodes.some((node) => node['content-desc'] === '11 minutes' && node.selected === 'true'));
  screenshot('timer-edited');
  await launchUtility(0, 'utility-content'); expectFocus('Start'); assert.equal(remaining(), 660, 'first saved shortcut is the startup duration');
  keys('DPAD_CENTER'); expectFocus('Pause'); const before = remaining();
  openSettings(); editFirstShortcut('Increase minutes');
  const after = remaining(); assert.ok(after < before && after > before - 180, 'editing preferences must retain the running session');
  assert.ok(snapshot().some((node) => node['content-desc'] === 'Pause'));
  focusControl('Pause'); keys('DPAD_CENTER'); expectFocus('Resume'); const paused = remaining();
  openSettings(); editFirstShortcut('Decrease minutes', 2);
  assert.equal(remaining(), paused, 'paused session survives preference edits');
  focusControl('Reset'); keys('DPAD_CENTER'); focusControl('10 minutes'); keys('DPAD_CENTER');
  focusControl('Start'); assert.equal(remaining(), 600); screenshot('timer');

  // Custom drafts remain intact while opening the global Settings screen.
  focusControl('Custom'); keys('DPAD_CENTER'); expectFocus('Cancel'); settingsVisible();
  focusControl('Increase minutes'); keys('DPAD_CENTER');
  openSettings(); keys('BACK');
  assert.ok(snapshot().some((node) => node['content-desc'] === '11 minutes'));
  settingsVisible(); focusControl('Cancel'); keys('DPAD_CENTER');
  assert.equal(remaining(), 600);

  for (const [title, marker] of [['Clock', 'clock-time'], ['Calculator', 'calculator-result'], ['Countdown', 'countdown-list'], ['World Clocks', 'world-clocks']]) {
    focusRail(title); keys('DPAD_CENTER'); assert.ok(byId(settingsVisible(), marker));
    screenshot(title.toLowerCase().replaceAll(' ', '-'));
    openSettings(); keys('BACK');
    assert.ok(byId(settingsVisible(), marker), 'Back returns to the utility that opened Settings');
  }
  focusRail('Clock'); keys('DPAD_CENTER'); focusControl('Enter ambient mode'); keys('DPAD_CENTER'); expectFocus('Exit ambient mode');
  settingsVisible(); screenshot('ambient');
  openSettings(); keys('BACK');
  assert.ok(byId(settingsVisible(), 'ambient-clock'));
  keys('BACK'); assert.ok(byId(settingsVisible(), 'dashboard-clock')); screenshot('dashboard');
  openSettings(); screenshot('settings');
  // Selecting the gear while already in Settings toggles the secondary panel closed.
  focusRail('Home'); keys('DPAD_DOWN', 'DPAD_CENTER'); assert.ok(byId(settingsVisible(), 'dashboard-clock'));
});
