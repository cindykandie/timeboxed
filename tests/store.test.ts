import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createTimerStore, watchTimer } from '../src/timer/store.ts';

function harness() {
  let now = 0;
  const callbacks = new Set<() => void>();
  const store = createTimerStore(() => now);
  const scheduler = { every(callback: () => void) { callbacks.add(callback); return () => { callbacks.delete(callback); }; } };
  return { store, scheduler, callbacks, advance(time: number) { now = time; } };
}

test('interval exists only while running; pause, reset, completion and cleanup dispose it', () => {
  const { store, scheduler, callbacks, advance } = harness();
  const dispose = watchTimer(store, scheduler);
  assert.equal(callbacks.size, 0);
  store.dispatch({ type: 'setDuration', durationMs: 5000 });
  store.dispatch({ type: 'start' });
  assert.equal(callbacks.size, 1);
  store.dispatch({ type: 'start' });
  assert.equal(callbacks.size, 1);
  store.dispatch({ type: 'pause' });
  assert.equal(callbacks.size, 0);
  store.dispatch({ type: 'resume' });
  assert.equal(callbacks.size, 1);
  store.dispatch({ type: 'reset' });
  assert.equal(callbacks.size, 0);
  store.dispatch({ type: 'start' });
  advance(5000);
  [...callbacks].forEach((callback) => callback());
  assert.equal(store.getSnapshot().status, 'completed');
  assert.equal(callbacks.size, 0);
  store.dispatch({ type: 'start' });
  dispose();
  dispose();
  assert.equal(callbacks.size, 0);
  store.dispatch({ type: 'reset' });
  store.dispatch({ type: 'start' });
  assert.equal(callbacks.size, 0, 'disposed subscription must not restart an interval');
});

test('screen blur/background cleanup preserves the deadline and reconciles on return', () => {
  const { store, scheduler, callbacks, advance } = harness();
  store.dispatch({ type: 'setDuration', durationMs: 60_000 });
  const leave = watchTimer(store, scheduler);
  store.dispatch({ type: 'start' });
  advance(1234);
  leave();
  assert.equal(callbacks.size, 0);
  assert.equal(store.getSnapshot().deadlineMs, 60_000);
  advance(45_500);
  const leaveAgain = watchTimer(store, scheduler);
  assert.equal(store.getSnapshot().remainingMs, 14_500);
  assert.equal(callbacks.size, 1);
  leaveAgain();
  advance(75_000);
  const finish = watchTimer(store, scheduler);
  assert.equal(store.getSnapshot().status, 'completed');
  assert.equal(store.getSnapshot().remainingMs, 0);
  assert.equal(callbacks.size, 0);
  finish();
});

test('a paused timer remains paused across navigation and backgrounding', () => {
  const { store, scheduler, advance } = harness();
  const leave = watchTimer(store, scheduler);
  store.dispatch({ type: 'start' });
  advance(2345);
  store.dispatch({ type: 'pause' });
  const paused = store.getSnapshot();
  leave();
  advance(9_000_000);
  const cleanup = watchTimer(store, scheduler);
  assert.equal(store.getSnapshot(), paused);
  cleanup();
});

test('sub-second updates do not notify unnecessarily and unsubscribe removes listeners', () => {
  const { store, advance } = harness();
  let notifications = 0;
  const unsubscribe = store.subscribe(() => { notifications++; });
  store.dispatch({ type: 'start' });
  advance(250);
  store.refresh();
  assert.equal(notifications, 1);
  advance(1100);
  store.refresh();
  assert.equal(notifications, 2);
  unsubscribe();
  store.dispatch({ type: 'pause' });
  assert.equal(notifications, 2);
});
