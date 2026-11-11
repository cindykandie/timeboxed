import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertRail, byId, expectFocus, keys, launchUtility, screenshot, snapshot } from './driver.ts';

test('Calculator performs real remote keypad calculations and preserves its session across navigation', { timeout: 180_000 }, async () => {
  await launchUtility(2, 'calculator-result'); expectFocus('5');
  keys('DPAD_DOWN', 'DPAD_CENTER', 'DPAD_RIGHT', 'DPAD_RIGHT', 'DPAD_CENTER', 'DPAD_LEFT', 'DPAD_LEFT', 'DPAD_CENTER',
    'DPAD_DOWN', 'DPAD_RIGHT', 'DPAD_RIGHT', 'DPAD_CENTER');
  let nodes = expectFocus('Equals'); assert.equal(byId(nodes, 'calculator-result')?.text, '4'); assertRail(nodes);
  keys('DPAD_UP', 'DPAD_CENTER', 'DPAD_LEFT', 'DPAD_CENTER', 'DPAD_DOWN', 'DPAD_RIGHT', 'DPAD_CENTER');
  nodes = expectFocus('Equals'); assert.equal(byId(nodes, 'calculator-result')?.text, '7');
  screenshot('calculator');
  assert.ok(!nodes.some((node) => node.text === 'Calculator'));
  keys(...Array<string>(3).fill('DPAD_LEFT'), ...Array<string>(5).fill('DPAD_UP'));
  expectFocus('Clear entry');
  keys(...Array<string>(5).fill('DPAD_DOWN'), ...Array<string>(3).fill('DPAD_RIGHT'));
  expectFocus('Equals');
  keys('BACK'); assert.ok(byId(expectFocus('Calculator'), 'dashboard-clock')); keys('DPAD_CENTER');
  nodes = snapshot(); assert.equal(byId(nodes, 'calculator-result')?.text, '7'); assertRail(nodes);
  keys('BACK'); expectFocus('Calculator');
});
