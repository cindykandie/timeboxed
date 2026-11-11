import assert from 'node:assert/strict';
import { test } from 'node:test';

import { selectArtwork } from '../src/artwork/selection.ts';

test('artwork selection uses registered local entries and falls back for unknown IDs', () => {
  const catalog = [{ id: 'first', source: 1 }, { id: 'second', source: 2 }];
  assert.equal(selectArtwork(catalog, 'second', 'first'), catalog[1]);
  for (const invalid of [undefined, null, '', 'https://example.com/image.jpg', ['second']]) {
    assert.equal(selectArtwork(catalog, invalid, 'first'), catalog[0]);
  }
});

test('artwork configuration fails clearly when its default entry is missing', () => {
  assert.throws(() => selectArtwork([], 'missing', 'missing'), /configured default/);
});
