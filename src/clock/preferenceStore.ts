import { File, Paths } from 'expo-file-system';

import { createClockPreferences } from './preferences';

const file = () => new File(Paths.document, 'clock-preferences.json');

export const clockPreferences = createClockPreferences({
  read() { const saved = file(); return saved.exists ? saved.textSync() : null; },
  write(value) {
    const saved = file();
    if (!saved.exists) saved.create();
    saved.writeSync(value);
  },
});
