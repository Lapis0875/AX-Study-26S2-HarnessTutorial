import { validateInput } from './bookmarks.js';

export const STORAGE_KEY = 'ax-study:l03:bookmarks:v1';
export const INITIAL_ITEM = Object.freeze({
  id: 'sample-001',
  url: 'https://example.com/read-later/article-1',
  title: '주말에 읽을 글',
});

export function initialItems() {
  return [{ ...INITIAL_ITEM }];
}

export function decodeData(raw) {
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.items)) {
    throw new Error('지원하지 않는 저장 형식입니다.');
  }
  const ids = new Set();
  for (const item of data.items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
        typeof item.title !== 'string' || typeof item.url !== 'string') {
      throw new Error('저장된 항목의 형식이 올바르지 않습니다.');
    }
    const validated = validateInput(item);
    if (Object.keys(validated.errors).length || validated.title !== item.title ||
        validated.url !== item.url) {
      throw new Error('저장된 제목 또는 주소의 형식이 올바르지 않습니다.');
    }
    ids.add(item.id);
  }
  return data.items;
}

export function writeItems(storage, items) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items }));
    return { status: 'ready', items };
  } catch {
    return { status: 'error', message: '저장하지 못했습니다. 기존 자료와 입력값을 유지했습니다. 브라우저의 저장 설정을 확인하거나 강사에게 문의해 주세요.' };
  }
}

export function readItems(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'error', message: '저장 공간을 읽지 못했습니다. 추가를 중단했습니다. 브라우저 설정을 확인하거나 강사에게 문의해 주세요.' };
  }
  if (raw === null) return writeItems(storage, initialItems());
  try {
    return { status: 'ready', items: decodeData(raw) };
  } catch {
    return { status: 'error', message: '저장 자료가 손상되었거나 지원하지 않는 형식입니다. 원본을 보존하고 추가를 중단했습니다. 강사에게 문의하거나 확인 후 초기 예제로 되돌려 주세요.' };
  }
}

export function resetItems(storage) {
  return writeItems(storage, initialItems());
}
