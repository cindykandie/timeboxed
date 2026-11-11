import { localDocument } from '../storage/document';
import { createTypographyPreferences } from './preferences';

export const typographyPreferences = createTypographyPreferences(localDocument('appearance-preferences.json'));
