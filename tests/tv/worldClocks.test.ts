import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

import { defaultCities, getCity } from '../../src/worldClocks/cities.ts';
import { adb, appId, assertRail, byId, expectFocus, focusControl, focusRail, keys, launchUtility, screenshot, snapshot } from './driver.ts';
import type { Nodes } from './driver.ts';

const normalize = (value: string) => value.replace(/\s+/g, ' ').replace(/^0(?=\d:)/, '').trim();
function checkTimes(nodes: Nodes) {
  const epoch = Number(adb('shell', 'date', '+%s').trim()) * 1000;
  const zone = adb('shell', 'getprop', 'persist.sys.timezone').trim();
  const localDate = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'long', day: 'numeric' }).format(epoch);
  for (const id of defaultCities) {
    const city = getCity(id); const time = byId(nodes, `world-time-${id}`)?.text ?? '';
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: city.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: /[AP]M$/.test(time) ? 'h12' : 'h23' });
    assert.ok(Array.from({ length: 10 }, (_, index) => normalize(formatter.format(epoch - index * 1000))).includes(normalize(time)), `${city.name}: ${time}`);
    const date = new Intl.DateTimeFormat('en-US', { timeZone: city.timeZone, year: 'numeric', month: 'long', day: 'numeric' }).format(epoch);
    assert.equal(byId(nodes, `world-date-${id}`)?.text?.trim() ?? '', date === localDate ? '' : date);
  }
}
test('World Clocks remote add/remove, IANA times, shared formats, restart, foreground and Home/Back', { timeout: 480_000 }, async () => {
  let nodes = await launchUtility(4, 'world-clocks'); expectFocus('Add city'); checkTimes(nodes);
  assert.ok(!nodes.some((node) => node.text === 'Remove'));
  assert.equal(nodes.filter((node) => node['resource-id'].startsWith('world-zone-')).length, 0);
  const original12 = /[AP]M$/.test(byId(nodes, 'world-time-nairobi')!.text);
  const times = defaultCities.map((id) => byId(nodes, `world-time-${id}`)!.text);
  await delay(2200); nodes = snapshot();
  assert.ok(defaultCities.every((id, index) => byId(nodes, `world-time-${id}`)?.text !== times[index])); assertRail(nodes); screenshot('world-clocks');
  focusControl('Remove Nairobi'); nodes = snapshot(); assert.ok(byId(nodes, 'world-zone-nairobi')); screenshot('world-clocks-focused');
  keys('DPAD_RIGHT'); nodes = expectFocus('Remove London');
  assert.ok(byId(nodes, 'world-zone-london') && !byId(nodes, 'world-zone-nairobi'));
  assert.equal(nodes.filter((node) => node.text === 'Remove').length, 1);
  focusControl('Add city');
  keys('DPAD_CENTER'); expectFocus('Add Los Angeles'); keys('DPAD_CENTER'); expectFocus('Add city');
  focusControl('Remove Los Angeles'); assert.ok(byId(snapshot(), 'world-city-los-angeles'));
  await launchUtility(4, 'world-clocks'); focusControl('Remove Los Angeles'); keys('DPAD_CENTER'); expectFocus('Keep city');
  assert.ok(byId(snapshot(), 'world-remove-confirmation')); keys('BACK'); expectFocus('Remove Los Angeles');
  keys('DPAD_CENTER'); expectFocus('Keep city'); keys('DPAD_RIGHT', 'DPAD_CENTER'); expectFocus('Add city');
  nodes = snapshot(); checkTimes(nodes); assert.ok(!byId(nodes, 'world-city-los-angeles'));
  keys('DPAD_CENTER'); expectFocus('Add Los Angeles'); keys('BACK'); expectFocus('Add city');
  keys('HOME'); await delay(3000); adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`); await delay(1000);
  nodes = snapshot(); checkTimes(nodes); assertRail(nodes);
  for (const label of ['24-hour', '12-hour']) {
    focusRail('Clock'); keys('DPAD_CENTER'); expectFocus('Enter ambient mode'); focusControl(label); keys('DPAD_CENTER');
    focusRail('World Clocks'); keys('DPAD_CENTER'); expectFocus('Add city'); nodes = snapshot(); checkTimes(nodes);
    assert.equal(/[AP]M$/.test(byId(nodes, 'world-time-nairobi')!.text), label === '12-hour');
  }
  if (!original12) {
    focusRail('Clock'); keys('DPAD_CENTER'); expectFocus('Enter ambient mode'); focusControl('24-hour'); keys('DPAD_CENTER');
    focusRail('World Clocks'); keys('DPAD_CENTER'); expectFocus('Add city');
  }
  focusRail('Home'); keys('DPAD_CENTER'); assert.ok(byId(expectFocus('World Clocks'), 'dashboard-clock'));
  keys('DPAD_CENTER'); expectFocus('Add city'); keys('BACK'); assert.ok(byId(expectFocus('World Clocks'), 'dashboard-clock'));
});
