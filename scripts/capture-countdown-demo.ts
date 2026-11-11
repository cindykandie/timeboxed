import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import { adb, byId, expectFocus, focusControl, keys, launchUtility, screenshot, serial, snapshot } from '../tests/tv/driver.ts';

// Uses only real remote events. Run with the existing development TV build and
// Metro available; the demo event is deleted after recording.
const nodes = await launchUtility(3, 'countdown-list');
assert.ok(!nodes.some((node) => node['content-desc'] === 'Open AB'), 'Remove the previous AB demo before recording');
const remote = '/sdcard/timeboxed-countdown-demo.mp4';
const recording = spawn('adb', ['-s', serial, 'shell', 'screenrecord', '--size', '1280x720',
  '--bit-rate', '2000000', '--time-limit', '40', remote]);
const finished = new Promise<void>((resolve, reject) => {
  recording.once('error', reject);
  recording.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`screenrecord exited ${code}`)));
});
await delay(1000);
const down = (count: number) => Array<string>(count).fill('DPAD_DOWN');
const batches = [['DPAD_CENTER'], ['DPAD_CENTER'], down(6), ['DPAD_CENTER'],
  ['DPAD_CENTER', 'DPAD_RIGHT', 'DPAD_CENTER', ...down(6)], ['DPAD_RIGHT', 'DPAD_RIGHT', 'DPAD_RIGHT'],
  ['DPAD_CENTER'], [...down(3), 'DPAD_LEFT'], ['DPAD_CENTER']];
for (const batch of batches) { keys(...batch); await delay(600); }
expectFocus('New countdown'); focusControl('Open AB'); keys('DPAD_CENTER'); expectFocus('All countdowns');
assert.ok(byId(snapshot(), 'countdown-remaining')); screenshot('countdown');
await finished; adb('pull', remote, 'artifacts/utilities/countdown-demo.mp4');
focusControl('Countdown actions'); keys('DPAD_CENTER'); expectFocus('Edit countdown');
focusControl('Delete countdown'); keys('DPAD_CENTER'); expectFocus('Keep countdown');
keys('DPAD_RIGHT', 'DPAD_CENTER'); expectFocus('New countdown'); keys('BACK');
