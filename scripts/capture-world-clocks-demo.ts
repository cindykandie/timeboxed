import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import { adb, assertRail, expectFocus, focusControl, focusRail, keys, launchUtility, screenshot, serial, snapshot } from '../tests/tv/driver.ts';

// Reproduce with the existing TV development build and Metro. Los Angeles is
// added for the recording and removed again, preserving the default selection.
await launchUtility(4, 'world-clocks'); expectFocus('Add city');
const remote = '/sdcard/timeboxed-world-clocks-demo.mp4';
const recording = spawn('adb', ['-s', serial, 'shell', 'screenrecord', '--size', '1280x720',
  '--bit-rate', '2000000', '--time-limit', '50', remote]);
const finished = new Promise<void>((resolve, reject) => {
  recording.once('error', reject);
  recording.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`screenrecord exited ${code}`)));
});
await delay(1000); keys('DPAD_CENTER'); expectFocus('Add Los Angeles'); keys('DPAD_CENTER'); expectFocus('Add city');
focusControl('Remove Los Angeles'); keys('DPAD_CENTER'); expectFocus('Keep city');
keys('DPAD_RIGHT', 'DPAD_CENTER'); expectFocus('Add city');
const nodes = snapshot(); assertRail(nodes); assert.ok(nodes.some((node) => node['resource-id'] === 'world-time-nairobi'));
screenshot('world-clocks');
focusRail('World Clocks');
await finished; adb('pull', remote, 'artifacts/utilities/world-clocks-demo.mp4');
keys('BACK'); expectFocus('World Clocks');
