import { navigationTokens } from '../theme.ts';

type Scheduler = { after: (delay: number, callback: () => void) => () => void };
const scheduler: Scheduler = {
  after(delay, callback) {
    const timer = setTimeout(callback, delay);
    return () => clearTimeout(timer);
  },
};

// Independent of the utility timers: one cancellable timeout per focused rail.
export function createNavigationActivity(change: (active: boolean) => void, clock: Scheduler = scheduler) {
  let cancel: (() => void) | undefined;
  let generation = 0;
  let disposed = false;
  let active: boolean | undefined;
  const clear = () => { generation++; cancel?.(); cancel = undefined; };
  const publish = (next: boolean) => { if (active !== next) { active = next; change(next); } };
  return {
    interact() {
      if (disposed) return;
      clear();
      publish(true);
      const current = generation;
      cancel = clock.after(navigationTokens.idleMs, () => {
        if (disposed || current !== generation) return;
        cancel = undefined;
        publish(false);
      });
    },
    pause() { if (!disposed) { clear(); publish(false); } },
    dispose() { if (!disposed) { disposed = true; clear(); } },
  };
}
