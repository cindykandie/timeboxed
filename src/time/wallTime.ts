type Activity = { isActive: () => boolean; subscribe: (change: () => void) => () => void };
type Scheduler = { every: (callback: () => void) => () => void };
const scheduler: Scheduler = { every(callback) { const id = setInterval(callback, 1000); return () => clearInterval(id); } };

export function watchWallTime(activity: Activity, update: (now: number) => void,
  now: () => number = Date.now, clock: Scheduler = scheduler) {
  let stop: (() => void) | undefined;
  let disposed = false;
  const refresh = () => update(now());
  const sync = () => {
    if (disposed) return;
    if (activity.isActive()) { refresh(); stop ??= clock.every(refresh); }
    else { stop?.(); stop = undefined; }
  };
  const unsubscribe = activity.subscribe(sync);
  sync();
  return () => { if (disposed) return; disposed = true; unsubscribe(); stop?.(); stop = undefined; };
}
