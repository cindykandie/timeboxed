import { localDocument } from '../storage/document';
import { createWorldClocksStore } from './store';

export const worldClocksStore = createWorldClocksStore(localDocument('world-clocks.json'));
