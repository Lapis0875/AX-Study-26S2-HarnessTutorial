import test from 'node:test';
import assert from 'node:assert/strict';
import { addBookmark } from '../src/bookmarks.js';
import { createController } from '../src/controller.js';
import { initialItems, readItems, STORAGE_KEY } from '../src/storage.js';
import { memoryStorage, U1, U2 } from './helpers.js';

test('양끝 공백이 있는 같은 주소도 제목과 관계없이 중복을 차단한다', () => {
  const items = initialItems();
  const before = structuredClone(items);
  const result = addBookmark(items, { title: '  새 제목  ', url: `  ${U1}\n` });
  assert.equal(result.status, 'duplicate');
  assert.deepEqual(result.items, before);
  assert.deepEqual(items, before);
});

test('중복 제출은 ID를 생성하거나 저장 공간에 기록하지 않는다', () => {
  const storage = memoryStorage();
  const raw = storage.getItem(STORAGE_KEY);
  let writes = 0;
  let ids = 0;
  storage.setItem = () => { writes += 1; };
  const controller = createController(storage, () => { ids += 1; return 'unexpected-id'; });
  const result = controller.add({ title: '다시 읽을 글', url: U1 });
  assert.equal(result.status, 'duplicate');
  assert.equal(writes, 0);
  assert.equal(ids, 0);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  assert.deepEqual(controller.getState().items, initialItems());
});

test('기존 중복의 ID·제목·순서를 보존하고 세 번째 중복만 차단한다', () => {
  const items = [...initialItems(), { id: 'old-002', title: '과거의 다른 제목', url: U1 }];
  const storage = memoryStorage(items);
  const raw = storage.getItem(STORAGE_KEY);
  const controller = createController(storage);
  const result = controller.add({ title: '세 번째 제목', url: U1 });
  assert.equal(result.status, 'duplicate');
  assert.deepEqual(controller.getState().items, items);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  assert.deepEqual(createController(storage).getState().items, items);
});

test('과거 중복을 유지한 목록에도 새로운 URL을 추가할 수 있다', () => {
  const items = [...initialItems(), { id: 'old-002', title: '과거 제목', url: U1 }];
  const storage = memoryStorage(items);
  const controller = createController(storage);
  const result = controller.add({ title: '나중에 볼 영상', url: U2 });
  assert.equal(result.status, 'added');
  assert.deepEqual(readItems(storage).items.slice(0, 2), items);
  assert.equal(readItems(storage).items[2].url, U2);
});

for (const url of [
  'http://example.com/read-later/article-1',
  'HTTPS://example.com/read-later/article-1',
  'https://EXAMPLE.com/read-later/article-1',
  'https://example.com:443/read-later/article-1',
  'https://example.com/read-later/article-1/',
  'https://example.com/read-later/Article-1',
  'https://example.com/read-later/article-1?utm_source=Class',
  'https://example.com/read-later/article-1#Part',
]) {
  test(`URL 문자열을 정규화하지 않고 다른 주소로 추가한다: ${url}`, () => {
    const result = addBookmark(initialItems(), { title: '주말에 읽을 글', url });
    assert.equal(result.status, 'added');
    assert.equal(result.items.length, 2);
    assert.equal(result.items[1].url, url);
    assert.deepEqual(result.items[0], initialItems()[0]);
  });
}

test('같은 주소라도 필수 제목 검증은 생략하지 않는다', () => {
  const controller = createController(memoryStorage());
  const result = controller.add({ title: '  ', url: U1 });
  assert.equal(result.status, 'invalid');
  assert.ok(result.errors.title);
  assert.deepEqual(controller.getState().items, initialItems());
});

test('새 주소 저장 후 재로드한 컨트롤러도 같은 주소를 차단한다', () => {
  const storage = memoryStorage();
  createController(storage).add({ title: '영상', url: U2 });
  const raw = storage.getItem(STORAGE_KEY);
  const controller = createController(storage);
  const result = controller.add({ title: '다른 영상 제목', url: U2 });
  assert.equal(result.status, 'duplicate');
  assert.equal(storage.getItem(STORAGE_KEY), raw);
  assert.equal(controller.getState().items[1].title, '영상');
});
