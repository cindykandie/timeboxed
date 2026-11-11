export const PRESET_MINUTES = [10, 15, 45] as const;
export const MAX_DURATION_MS = (24 * 60 * 60 - 1) * 1000;

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TimerState = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  deadlineMs: number | null;
};
export type TimerAction =
  | { type: 'start' | 'pause' | 'resume' | 'reset' | 'tick' }
  | { type: 'setDuration'; durationMs: number };

export function createTimer(durationMs = 25 * 60_000): TimerState {
  if (!Number.isInteger(durationMs) || durationMs < 1000 || durationMs > MAX_DURATION_MS) {
    throw new RangeError('Choose a duration from 1 second to 23:59:59.');
  }
  return { status: 'idle', durationMs, remainingMs: durationMs, deadlineMs: null };
}

export function remainingAt(state: TimerState, now: number): number {
  return state.status === 'running' && state.deadlineMs !== null
    ? Math.min(state.durationMs, Math.max(0, state.deadlineMs - now))
    : state.remainingMs;
}

export function timerReducer(state: TimerState, action: TimerAction, now: number): TimerState {
  if (action.type === 'reset') return createTimer(state.durationMs);
  if (action.type === 'setDuration') {
    // A running or paused session must be explicitly reset before changing it.
    return state.status === 'running' || state.status === 'paused' ? state : createTimer(action.durationMs);
  }
  const remainingMs = remainingAt(state, now);
  // A late Pause/Start event must never revive an expired deadline.
  if (state.status === 'running' && remainingMs === 0) {
    return { ...state, status: 'completed', remainingMs: 0, deadlineMs: null };
  }
  switch (action.type) {
    case 'start':
      return state.status === 'idle' || state.status === 'completed'
        ? { ...state, status: 'running', remainingMs: state.durationMs, deadlineMs: now + state.durationMs }
        : state;
    case 'pause':
      return state.status === 'running'
        ? { ...state, status: 'paused', remainingMs, deadlineMs: null }
        : state;
    case 'resume':
      return state.status === 'paused'
        ? { ...state, status: 'running', deadlineMs: now + state.remainingMs }
        : state;
    case 'tick':
      // Refresh from the deadline, never by subtracting an interval. Notify the UI
      // only when its displayed second changes; Pause still uses exact milliseconds.
      return state.status === 'running' && Math.ceil(remainingMs / 1000) !== Math.ceil(state.remainingMs / 1000)
        ? { ...state, remainingMs }
        : state;
  }
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mmss}` : mmss;
}

export function durationFromParts(hours: number, minutes: number, seconds: number): number {
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
