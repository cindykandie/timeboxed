import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

import { adb, assertRail, byId, expectFocus, focusControl, focusRail, keys, launchUtility, screenshot, snapshot } from './driver.ts';
import { prepareHierarchyDump } from './hierarchy.ts';

async function startTimer() {
  if (process.env.TV_OFFLINE_FONTS !== '1') return launchUtility(0, 'utility-content');
  adb('shell', 'am', 'force-stop', 'com.timeboxed.app');
  adb('shell', 'am', 'start', '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LEANBACK_LAUNCHER', '-n', 'com.timeboxed.app/.MainActivity');
  for (let attempt = 0; attempt < 10; attempt++) {
    if (byId(snapshot(), 'dashboard-clock')) { keys('DPAD_CENTER'); return; }
    await delay(500);
  }
  throw new Error('Offline dashboard did not open');
}

function remaining() {
  const time = snapshot().find((node) => /^(?:\d{2}:)?\d{2}:\d{2} remaining$/.test(node['content-desc']))?.['content-desc'];
  assert.ok(time);
  return time.split(' ')[0].split(':').map(Number).reduce((sum, part) => sum * 60 + part, 0);
}
function openSettings() {
  focusRail('Home'); keys('DPAD_DOWN'); expectFocus('Settings'); keys('DPAD_CENTER');
  const nodes = snapshot(); assert.ok(byId(nodes, 'settings-shell'));
  assert.ok(byId(nodes, 'settings-secondary-navigation')); assert.ok(byId(nodes, 'font-settings'));
}
function closeSettingsToTimer() {
  keys('BACK'); expectFocus('Timer');
}
test('font Settings supports all families, persistent System choice and running Timer recovery using the TV remote', { timeout: 600_000 }, async (t) => {
  if (process.env.TV_OFFLINE_FONTS === '1') {
    prepareHierarchyDump((local, remote) => adb('push', local, remote));
    const airplane = adb('shell', 'settings', 'get', 'global', 'airplane_mode_on').trim();
    t.after(() => { adb('shell', 'cmd', 'connectivity', 'airplane-mode', airplane === '1' ? 'enable' : 'disable'); adb('reverse', 'tcp:8081', 'tcp:8081'); });
    adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable');
    assert.equal(adb('shell', 'settings', 'get', 'global', 'airplane_mode_on').trim(), '1');
    if (adb('reverse', '--list').includes('tcp:8081')) adb('reverse', '--remove', 'tcp:8081');
    assert.ok(!adb('reverse', '--list').includes('tcp:8081'));
  }
  await startTimer(); expectFocus('Start');
  keys('BACK'); expectFocus('Timer'); openSettings();
  for (const [id, name] of [['satoshi', 'Satoshi'], ['clash-display', 'Clash Display'], ['cabinet-grotesk', 'Cabinet Grotesk'], ['system', 'System']]) {
    focusControl(`Font: ${name}`); keys('DPAD_CENTER');
    const nodes = expectFocus(`Font: ${name}`);
    assert.ok(byId(nodes, `typography-family-${id}`));
    assert.equal(nodes.find((node) => node['content-desc'] === `Font: ${name}`)?.selected, 'true');
    assertRail(nodes); screenshot(`settings-${id}`);
    closeSettingsToTimer(); keys('DPAD_CENTER'); expectFocus('Start');
    assert.equal(remaining(), 600); screenshot(`timer-${id}`);
    keys('BACK'); expectFocus('Timer'); openSettings();
  }
  // A real process restart must preserve System, not silently restore Satoshi.
  await startTimer(); expectFocus('Start');
  assert.ok(byId(snapshot(), 'typography-family-system'));
  keys('DPAD_CENTER'); expectFocus('Pause'); const started = remaining();
  keys('BACK'); expectFocus('Timer'); openSettings();
  focusControl('Font: Satoshi'); keys('DPAD_CENTER'); expectFocus('Font: Satoshi');
  closeSettingsToTimer(); keys('DPAD_CENTER'); expectFocus('Pause');
  assert.ok(byId(snapshot(), 'typography-family-satoshi'));
  const restored = remaining(); assert.ok(restored < started && restored > started - 150, 'font switching preserves the active deadline');
  keys('DPAD_CENTER'); expectFocus('Resume'); keys('DPAD_RIGHT', 'DPAD_CENTER');
  focusRail('Clock'); keys('DPAD_CENTER'); expectFocus('Enter ambient mode');
  let nodes = snapshot(); assert.ok(byId(nodes, 'clock-time')); assert.ok(byId(nodes, 'clock-timezone'));
  screenshot('clock-satoshi');
  focusRail('Calculator'); keys('DPAD_CENTER'); expectFocus('5'); screenshot('calculator-satoshi');
  focusRail('Countdown'); keys('DPAD_CENTER'); expectFocus('New countdown'); screenshot('countdown-satoshi');
  focusRail('World Clocks'); keys('DPAD_CENTER'); expectFocus('Add city'); screenshot('world-clocks-satoshi');
  keys('BACK'); expectFocus('World Clocks');
  screenshot('dashboard-satoshi');
  await startTimer();
  nodes = snapshot(); assert.ok(byId(nodes, 'typography-family-satoshi')); assertRail(nodes);
  keys('BACK'); expectFocus('Timer');
  // Explicitly verify the new entry control is reached without altering rail order.
  focusRail('Home'); keys('DPAD_DOWN'); expectFocus('Settings'); screenshot('dashboard-settings');
  keys('DPAD_UP'); expectFocus('Home');
  assert.equal(adb('shell', 'wm', 'size').trim(), 'Physical size: 1920x1080');
});
