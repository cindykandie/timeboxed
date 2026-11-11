import { createTimer, timerReducer } from './timer.ts';
import type { TimerAction } from './timer.ts';
import type { TimerPreferences } from './preferences.ts';

export function createTimerStore(now: () => number = Date.now, initialDurationMs?: number) {
  let state = createTimer(initialDurationMs);
  const listeners = new Set<() => void>();
  const dispatch = (action: TimerAction) => {
    const next = timerReducer(state, action, now());
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => state,
    dispatch,
    refresh: () => dispatch({ type: 'tick' }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export type TimerStore = ReturnType<typeof createTimerStore>;
export type TimerScheduler = { every: (callback: () => void) => () => void };

const scheduler: TimerScheduler = {
  every(callback) {
    const id = setInterval(callback, 250);
    return () => clearInterval(id);
  },
};

// The caller owns this subscription. Losing screen focus or backgrounding the
// app disposes it. The stored deadline keeps advancing without a live interval.
export function watchTimer(store: TimerStore, clock: TimerScheduler = scheduler): () => void {
  let stop: (() => void) | undefined;
  const sync = () => {
    if (store.getSnapshot().status === 'running') {
      stop ??= clock.every(store.refresh);
    } else {
      stop?.();
      stop = undefined;
    }
  };
  store.refresh();
  const unsubscribe = store.subscribe(sync);
  sync();
  return () => { unsubscribe(); stop?.(); stop = undefined; };
}

export function createTimerSession(preferences: TimerPreferences, now: () => number = Date.now) {
  let previous = preferences.getSnapshot().presets;
  const store = createTimerStore(now, previous[0]);
  const dispose = preferences.subscribe(() => {
    const next = preferences.getSnapshot().presets;
    const state = store.getSnapshot();
    const index = previous.indexOf(state.durationMs);
    // Reconfigure a ready shortcut, but never replace a running/paused deadline,
    // a completed session, or an independently chosen custom duration.
    if (state.status === 'idle' && index >= 0 && next[index] !== state.durationMs) {
      store.dispatch({ type: 'setDuration', durationMs: next[index] });
    }
    previous = next;
  });
  return { ...store, dispose };
}
