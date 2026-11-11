import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createNavigationActivity } from '../src/navigation/activity.ts';
import { navigationTokens } from '../src/theme.ts';

function fixture() {
  let now = 0;
  const pending = new Map<number, { at: number; callback: () => void }>();
  let sequence = 0;
  const changes: boolean[] = [];
  const activity = createNavigationActivity((active) => changes.push(active), {
    after(delay, callback) {
      const id = ++sequence;
      pending.set(id, { at: now + delay, callback });
      return () => { pending.delete(id); };
    },
  });
  return { activity, changes, pending, advance(ms: number) {
    now += ms;
    for (const [id, task] of pending) if (task.at <= now) { pending.delete(id); task.callback(); }
  } };
}

test('rail becomes compact at 10 seconds, keeps one timeout, and remote activity renews the full idle period', () => {
  const f = fixture();
  assert.equal(navigationTokens.idleMs, 10_000);
  f.activity.interact();
  f.advance(9999);
  assert.deepEqual(f.changes, [true]);
  f.activity.interact();
  for (let index = 0; index < 100; index++) f.activity.interact();
  assert.equal(f.pending.size, 1);
  f.advance(9999);
  assert.deepEqual(f.changes, [true]);
  f.advance(1);
  assert.deepEqual(f.changes, [true, false]);
  assert.equal(f.pending.size, 0);
  f.activity.interact();
  assert.deepEqual(f.changes, [true, false, true]);
  assert.equal(f.pending.size, 1);
});

test('background pause and route disposal cancel rail work; stale callbacks cannot compact a new interaction', () => {
  const f = fixture();
  f.activity.interact();
  const stale = [...f.pending.values()][0].callback;
  f.activity.pause();
  assert.equal(f.pending.size, 0);
  f.activity.interact();
  stale();
  assert.deepEqual(f.changes, [true, false, true]);
  f.activity.dispose(); f.activity.dispose(); f.activity.interact(); f.activity.pause();
  f.advance(20_000);
  assert.equal(f.pending.size, 0);
  assert.deepEqual(f.changes, [true, false, true]);
});
