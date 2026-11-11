import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createTimer, durationFromParts, formatCountdown, MAX_DURATION_MS, PRESET_MINUTES, remainingAt, timerReducer } from '../src/timer/timer.ts';

test('presets and custom boundary durations are valid; invalid durations are rejected', () => {
  for (const minutes of PRESET_MINUTES) assert.equal(createTimer(minutes * 60_000).remainingMs, minutes * 60_000);
  assert.equal(createTimer(1000).durationMs, 1000);
  assert.equal(createTimer(MAX_DURATION_MS).durationMs, MAX_DURATION_MS);
  assert.equal(durationFromParts(1, 2, 3), 3_723_000);
  for (const invalid of [0, -1000, NaN, Infinity, 999, 1000.5, MAX_DURATION_MS + 1]) {
    assert.throws(() => createTimer(invalid), RangeError);
  }
});

test('display rounds up, supports hours, and never displays negative time', () => {
  for (const [ms, text] of [[60_000, '01:00'], [59_999, '01:00'], [1001, '00:02'],
    [1, '00:01'], [0, '00:00'], [-1, '00:00'], [3_600_000, '01:00:00'],
    [MAX_DURATION_MS, '23:59:59']] as const) assert.equal(formatCountdown(ms), text);
});

test('late ticks use elapsed time rather than counting interval callbacks', () => {
  const running = timerReducer(createTimer(60_000), { type: 'start' }, 1000);
  assert.equal(running.deadlineMs, 61_000);
  assert.equal(remainingAt(running, 11_250), 49_750);
  const delayed = timerReducer(running, { type: 'tick' }, 55_500);
  assert.equal(delayed.remainingMs, 5500);
  const completed = timerReducer(delayed, { type: 'tick' }, 90_000);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.remainingMs, 0);
  assert.equal(completed.deadlineMs, null);
});

test('pause captures exact milliseconds; resume excludes paused time', () => {
  const running = timerReducer(createTimer(10_000), { type: 'start' }, 1000);
  const paused = timerReducer(running, { type: 'pause' }, 2750);
  assert.equal(paused.remainingMs, 8250);
  assert.equal(paused.status, 'paused');
  assert.equal(paused.deadlineMs, null);
  assert.equal(timerReducer(paused, { type: 'tick' }, 99_000), paused);
  const resumed = timerReducer(paused, { type: 'resume' }, 100_000);
  assert.equal(resumed.deadlineMs, 108_250);
  assert.equal(remainingAt(resumed, 101_000), 7250);
});

test('background expiry and a late Pause cannot revive a completed timer', () => {
  const running = timerReducer(createTimer(5000), { type: 'start' }, 0);
  const expired = timerReducer(running, { type: 'pause' }, 5000);
  assert.equal(expired.status, 'completed');
  assert.equal(timerReducer(expired, { type: 'resume' }, 6000), expired);
  const restarted = timerReducer(expired, { type: 'start' }, 7000);
  assert.equal(restarted.remainingMs, 5000);
  assert.equal(restarted.deadlineMs, 12_000);
});

test('reset stops the countdown and restores its duration in every state', () => {
  const idle = createTimer(30_000);
  const running = timerReducer(idle, { type: 'start' }, 0);
  const paused = timerReducer(running, { type: 'pause' }, 1234);
  const completed = timerReducer(running, { type: 'tick' }, 30_000);
  for (const state of [idle, running, paused, completed]) {
    assert.deepEqual(timerReducer(state, { type: 'reset' }, 90_000), idle);
  }
});

test('invalid transitions cannot extend the deadline or overwrite a session', () => {
  const idle = createTimer();
  assert.equal(timerReducer(idle, { type: 'pause' }, 100), idle);
  assert.equal(timerReducer(idle, { type: 'resume' }, 100), idle);
  const running = timerReducer(idle, { type: 'start' }, 0);
  assert.equal(timerReducer(running, { type: 'start' }, 100), running);
  assert.equal(timerReducer(running, { type: 'resume' }, 100), running);
  assert.equal(timerReducer(running, { type: 'setDuration', durationMs: 1000 }, 100), running);
  const paused = timerReducer(running, { type: 'pause' }, 100);
  assert.equal(timerReducer(paused, { type: 'start' }, 200), paused);
  assert.equal(timerReducer(paused, { type: 'pause' }, 200), paused);
  assert.equal(timerReducer(paused, { type: 'setDuration', durationMs: 1000 }, 200), paused);
  assert.deepEqual(timerReducer(idle, { type: 'setDuration', durationMs: 1000 }, 200), createTimer(1000));
});
