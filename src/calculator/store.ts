import { calculatorReducer, createCalculator } from './engine';

let state = createCalculator();
const listeners = new Set<() => void>();
export const calculatorStore = {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  press(key: string) {
    const next = calculatorReducer(state, key);
    if (next !== state) { state = next; listeners.forEach((listener) => listener()); }
  },
};
