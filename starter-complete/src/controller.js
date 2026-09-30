import { addBookmark } from './bookmarks.js';
import { readItems, writeItems, resetItems } from './storage.js';

export function createController(storage, makeId) {
  let state = readItems(storage);
  return {
    getState: () => state,
    add(input) {
      if (state.status !== 'ready') {
        return { status: 'blocked', message: '저장 자료를 읽을 수 없어 추가할 수 없습니다.' };
      }
      const next = addBookmark(state.items, input, makeId);
      if (next.status !== 'added') return next;
      const saved = writeItems(storage, next.items);
      if (saved.status !== 'ready') return saved;
      state = saved;
      return next;
    },
    reset() {
      const saved = resetItems(storage);
      if (saved.status === 'ready') state = saved;
      return saved;
    },
  };
}
