import { localDocument } from '../storage/document';
import { createCountdownStore } from './store';

export const countdownStore = createCountdownStore(localDocument('countdowns.json'));
