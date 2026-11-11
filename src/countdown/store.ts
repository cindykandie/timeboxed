import type { TextStorage } from '../storage/document.ts';
import { validEvent } from './model.ts';
import type { CountdownEvent } from './model.ts';

type State = { events: readonly CountdownEvent[]; error: string | null };
export function createCountdownStore(storage: TextStorage, now = Date.now,
  makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`) {
  let state: State = { events: [], error: null };
  const listeners = new Set<() => void>();
  try {
    const raw = storage.read();
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      if (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1
        || !('events' in saved) || !Array.isArray(saved.events)) throw new Error();
      const ids = new Set<string>();
      const events = saved.events.filter((item): item is CountdownEvent => {
        if (!validEvent(item) || ids.has(item.id)) return false;
        ids.add(item.id); return true;
      });
      state = { events, error: events.length === saved.events.length ? null : 'Some saved events could not be loaded.' };
    }
  } catch { state = { events: [], error: 'Saved countdowns could not be loaded.' }; }
  const publish = (next: State) => { state = next; listeners.forEach((listener) => listener()); };
  const commit = (events: readonly CountdownEvent[]) => {
    try { storage.write(JSON.stringify({ version: 1, events })); }
    catch { publish({ ...state, error: 'Could not save changes. Please try again.' }); return false; }
    publish({ events, error: null }); return true;
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    save(name: string, targetAt: number, id?: string) {
      const previous = id ? state.events.find((item) => item.id === id) : undefined;
      const event = { id: previous?.id ?? makeId(), name: name.trim(), targetAt, createdAt: previous?.createdAt ?? now() };
      if (!validEvent(event) || targetAt <= now() || (id !== undefined && !previous)) {
        publish({ ...state, error: 'Enter an event name and a future date and time.' }); return false;
      }
      return commit(previous ? state.events.map((item) => item.id === id ? event : item) : [...state.events, event]);
    },
    remove(id: string) { return commit(state.events.filter((item) => item.id !== id)); },
  };
}
