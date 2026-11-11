import { timerPreferences } from './preferenceStore';
import { createTimerSession } from './store';

// One session for the app process, independent of route/component lifetimes.
export const timerStore = createTimerSession(timerPreferences);
