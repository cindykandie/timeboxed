import type { TextStorage } from '../storage/document.ts';
import { defaultCities, isCityId } from './cities.ts';
import type { CityId } from './cities.ts';

type State = { selected: readonly CityId[]; error: string | null };
export function createWorldClocksStore(storage: TextStorage) {
  let state: State = { selected: [...defaultCities], error: null };
  const listeners = new Set<() => void>();
  try {
    const raw = storage.read();
    if (raw !== null) {
      const saved: unknown = JSON.parse(raw);
      if (!saved || typeof saved !== 'object' || !('version' in saved) || saved.version !== 1
        || !('cities' in saved) || !Array.isArray(saved.cities)) throw new Error();
      const selected = [...new Set(saved.cities.filter(isCityId))];
      if (saved.cities.length > 0 && selected.length === 0) throw new Error();
      state = { selected, error: selected.length === saved.cities.length ? null : 'Some saved cities could not be loaded.' };
    }
  } catch { state = { selected: [...defaultCities], error: 'Saved cities could not be loaded. Showing defaults.' }; }
  const publish = (next: State) => { state = next; listeners.forEach((listener) => listener()); };
  const commit = (selected: readonly CityId[]) => {
    try { storage.write(JSON.stringify({ version: 1, cities: selected })); }
    catch { publish({ ...state, error: 'Could not save cities. Please try again.' }); return false; }
    publish({ selected, error: null }); return true;
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    add(id: CityId) { if (!isCityId(id)) return false; return state.selected.includes(id) || commit([...state.selected, id]); },
    remove(id: CityId) { return commit(state.selected.filter((item) => item !== id)); },
  };
}
