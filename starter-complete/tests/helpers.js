import { STORAGE_KEY, initialItems } from '../src/storage.js';

export const U1 = 'https://example.com/read-later/article-1';
export const U2 = 'https://example.com/read-later/video-2';

export function memoryStorage(items = initialItems()) {
  const values = new Map();
  if (items !== null) values.set(STORAGE_KEY, JSON.stringify({ version: 1, items }));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
