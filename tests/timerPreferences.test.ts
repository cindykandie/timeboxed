import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createTimerPreferences, defaultTimerPresets, timerPresetAccessibilityLabel, timerPresetLabel } from '../src/timer/preferences.ts';
import { createTimerSession } from '../src/timer/store.ts';
import { MAX_DURATION_MS } from '../src/timer/timer.ts';

function storage(initial: string | null = null) {
  let saved = initial;
  return { read: () => saved, write: (value: string) => { saved = value; } };
}
test('Timer shortcuts default to 10, 15 and 45 minutes and format arbitrary seconds/hours', () => {
  assert.deepEqual(createTimerPreferences(storage()).getSnapshot(), { presets: [600000, 900000, 2700000], error: null });
  assert.equal(timerPresetLabel(600000), '10 min');
  assert.equal(timerPresetLabel(75000), '1:15');
  assert.equal(timerPresetLabel(MAX_DURATION_MS), '23:59:59');
  assert.equal(timerPresetAccessibilityLabel(900000), '15 minutes');
  assert.equal(timerPresetAccessibilityLabel(75000), '1 minute 15 seconds');
});
test('all three shortcut slots persist through restart, including one-second and maximum durations', () => {
  const saved = storage(); const prefs = createTimerPreferences(saved);
  for (const [index, value] of [1000, 75000, MAX_DURATION_MS].entries()) assert.equal(prefs.setPreset(index, value), true);
  assert.deepEqual(createTimerPreferences(saved).getSnapshot(), { presets: [1000, 75000, MAX_DURATION_MS], error: null });
  for (const value of [0, -1, 1001, NaN, Infinity, MAX_DURATION_MS + 1000]) assert.equal(prefs.setPreset(0, value), false);
  for (const index of [-1, 3, 0.5]) assert.equal(prefs.setPreset(index, 60000), false);
  assert.equal(prefs.getSnapshot().presets[0], 1000);
});
test('damaged or incompatible shortcut data recovers and can be repaired', () => {
  for (const value of ['{', 'null', '{}', '{"version":2,"presets":[1000,2000,3000]}',
    '{"version":1,"presets":[0,2000,3000]}', '{"version":1,"presets":[1000,2000]}',
    '{"version":1,"presets":["1000",2000,3000]}']) {
    const saved = storage(value); const prefs = createTimerPreferences(saved);
    assert.deepEqual(prefs.getSnapshot(), { presets: defaultTimerPresets, error: 'load' });
    assert.ok(prefs.setPreset(0, 600000));
    assert.deepEqual(createTimerPreferences(saved).getSnapshot(), { presets: defaultTimerPresets, error: null });
  }
});
test('shortcut storage failures preserve the last saved values and allow retry and subscription cleanup', () => {
  let fail = true; let writes = 0; let notices = 0;
  const prefs = createTimerPreferences({ read() { throw new Error('Unavailable'); },
    write() { writes++; if (fail) throw new Error('Full'); } });
  const stop = prefs.subscribe(() => notices++);
  assert.equal(prefs.getSnapshot().error, 'load');
  assert.equal(prefs.setPreset(0, 120000), false);
  assert.deepEqual(prefs.getSnapshot(), { presets: defaultTimerPresets, error: 'save' });
  fail = false; assert.equal(prefs.setPreset(0, 120000), true);
  assert.equal(prefs.getSnapshot().presets[0], 120000);
  prefs.setPreset(0, 120000); assert.equal(writes, 2); assert.equal(notices, 2);
  stop(); prefs.setPreset(1, 1000); assert.equal(notices, 2);
});
test('saved first shortcut initializes a session; ready presets follow edits but custom durations do not', () => {
  const prefs = createTimerPreferences(storage('{"version":1,"presets":[1000,75000,90000]}'));
  const session = createTimerSession(prefs);
  assert.equal(session.getSnapshot().durationMs, 1000);
  prefs.setPreset(0, 5000); assert.equal(session.getSnapshot().durationMs, 5000);
  session.dispatch({ type: 'setDuration', durationMs: 75000 });
  prefs.setPreset(1, 120000); assert.equal(session.getSnapshot().durationMs, 120000);
  session.dispatch({ type: 'setDuration', durationMs: 17000 });
  prefs.setPreset(0, 60000); assert.equal(session.getSnapshot().durationMs, 17000);
  session.dispose(); session.dispatch({ type: 'setDuration', durationMs: 60000 });
  prefs.setPreset(0, 180000); assert.equal(session.getSnapshot().durationMs, 60000);
});
test('editing shortcut preferences preserves running, paused and completed sessions and their deadlines', () => {
  let now = 0; const prefs = createTimerPreferences(storage());
  const session = createTimerSession(prefs, () => now);
  session.dispatch({ type: 'start' }); const running = session.getSnapshot();
  prefs.setPreset(0, 60000); assert.equal(session.getSnapshot(), running);
  now = 2345; session.dispatch({ type: 'pause' }); const paused = session.getSnapshot();
  prefs.setPreset(1, 1000); assert.equal(session.getSnapshot(), paused);
  session.dispatch({ type: 'resume' }); now = 700000; session.refresh(); const complete = session.getSnapshot();
  assert.equal(complete.status, 'completed'); prefs.setPreset(2, 120000); assert.equal(session.getSnapshot(), complete);
  session.dispose();
});
