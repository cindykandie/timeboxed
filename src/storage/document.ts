import { File, Paths } from 'expo-file-system';

export type TextStorage = { read: () => string | null; write: (value: string) => void };

// The same small, synchronous app-private document approach as Clock preferences.
export function localDocument(name: string): TextStorage {
  const file = () => new File(Paths.document, name);
  return {
    read() { const saved = file(); return saved.exists ? saved.textSync() : null; },
    write(value) { const saved = file(); if (!saved.exists) saved.create(); saved.writeSync(value); },
  };
}
