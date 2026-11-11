import { localDocument } from '../storage/document';
import { createTimerPreferences } from './preferences';

export const timerPreferences = createTimerPreferences(localDocument('timer-preferences.json'));
