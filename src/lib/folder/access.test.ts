// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { supportsPersistentFolders } from './access';

describe('access layer', () => {
  it('reports persistent-folder support based on showDirectoryPicker presence', () => {
    // jsdom has no showDirectoryPicker by default → fallback (webkitdirectory) path.
    expect(supportsPersistentFolders()).toBe(false);
  });
});
