import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addBookmark, validateInput } from '../src/bookmarks.js';
import { createController } from '../src/controller.js';
import { decodeData, initialItems, readItems, resetItems, STORAGE_KEY } from '../src/storage.js';
import { memoryStorage, U1, U2 } from './helpers.js';

test('B01 빈 목록에 한 항목 추가, 입력 배열 보존', () => {
  const before = [];
  const result = addBookmark(before, { title: '주말에 읽을 글', url: U1 });
  assert.equal(result.status, 'added');
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].url, U1);
  assert.equal(result.items[0].title, '주말에 읽을 글');
  assert.ok(result.items[0].id);
  assert.deepEqual(before, []);
});

test('B02 새로운 주소는 뒤에 추가하고 기존 자료 보존', () => {
  const original = initialItems();
  const result = addBookmark(original, { title: '나중에 볼 영상', url: U2 });
  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items[0], original[0]);
  assert.equal(result.items[1].url, U2);
});

test('B04 서로 다른 새 주소는 별도 ID, 제출당 한 개', () => {
  let items = [];
  for (const url of [U1, U2, 'http://example.org/third']) {
    const oldLength = items.length;
    items = addBookmark(items, { url, title: url }).items;
    assert.equal(items.length, oldLength + 1);
  }
  assert.equal(new Set(items.map((item) => item.id)).size, 3);
});

test('B05 저장과 재로드에서 자료·ID·순서 보존', () => {
  const storage = memoryStorage();
  const controller = createController(storage);
  controller.add({ title: '영상', url: U2 });
  assert.deepEqual(readItems(storage), controller.getState());
});

test('P02 양끝 공백만 제거, 주소의 대소문자·슬래시·쿼리 보존', () => {
  const url = 'HTTPS://Example.com:443/Article/?utm_source=Class#Part';
  const result = addBookmark([], { title: '  제목  ', url: `  ${url}  ` });
  assert.equal(result.items[0].title, '제목');
  assert.equal(result.items[0].url, url);
});

for (const [name, input, field] of [
  ['제목 없음', { title: ' ', url: U1 }, 'title'],
  ['주소 없음', { title: '제목', url: '  ' }, 'url'],
  ...['/relative', '//example.com', 'example.com', 'https:example.com', 'https://',
    'javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/example', 'ftp://example.com',
    'https://exa mple.com', 'https://example.com/a\nb', 'https:\\example.com'].map((url) => [url, { title: '제목', url }, 'url']),
]) {
  test(`B06 입력 거절: ${name}`, () => {
    const storage = memoryStorage();
    const original = storage.getItem(STORAGE_KEY);
    const controller = createController(storage);
    const result = controller.add(input);
    assert.equal(result.status, 'invalid');
    assert.ok(result.errors[field]);
    assert.equal(storage.getItem(STORAGE_KEY), original);
    assert.deepEqual(controller.getState().items, initialItems());
  });
}

test('P03 http·https 절대 주소 허용', () => {
  for (const url of ['http://localhost:8080/', 'https://example.com/a%20b', 'https://예시.한국/자료']) {
    assert.deepEqual(validateInput({ title: '제목', url }).errors, {});
  }
});

test('B06 저장 실패는 기존 자료와 메모리 상태를 유지', () => {
  const storage = memoryStorage();
  const original = storage.getItem(STORAGE_KEY);
  const controller = createController(storage);
  storage.setItem = () => { throw new Error('quota'); };
  const result = controller.add({ title: '영상', url: U2 });
  assert.equal(result.status, 'error');
  assert.notEqual(result.message, '저장했습니다.');
  assert.equal(storage.getItem(STORAGE_KEY), original);
  assert.deepEqual(controller.getState().items, initialItems());
});

test('B08 초기화는 수업 키만 변경', () => {
  const storage = memoryStorage([]);
  storage.setItem('unrelated', 'keep');
  assert.deepEqual(resetItems(storage).items, initialItems());
  assert.equal(storage.getItem('unrelated'), 'keep');
});

test('B08 초기화 실패는 원본·현재 목록 유지', () => {
  const storage = memoryStorage([]);
  const controller = createController(storage);
  const raw = storage.getItem(STORAGE_KEY);
  storage.setItem = () => { throw new Error('denied'); };
  assert.equal(controller.reset().status, 'error');
  assert.deepEqual(controller.getState().items, []);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
});

test('B09 키가 없을 때만 초기 자료를 저장', () => {
  const storage = memoryStorage(null);
  assert.deepEqual(readItems(storage).items, initialItems());
  assert.deepEqual(decodeData(storage.getItem(STORAGE_KEY)), initialItems());
  assert.deepEqual(readItems(memoryStorage([])).items, []);
});

test('B09 최초 저장 실패는 정상 로드가 아님', () => {
  const storage = memoryStorage(null);
  storage.setItem = () => { throw new Error('quota'); };
  const controller = createController(storage);
  assert.equal(controller.getState().status, 'error');
  assert.equal(controller.add({ url: U2, title: '영상' }).status, 'blocked');
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

for (const raw of ['broken-json', 'null', '{"version":2,"items":[]}',
  '{"version":1,"items":{}}', '{"version":1,"items":[null]}',
  JSON.stringify({ version: 1, items: [{ ...initialItems()[0], url: 'javascript:alert(1)' }] }),
  JSON.stringify({ version: 1, items: [initialItems()[0], initialItems()[0]] }),
]) {
  test(`B11 손상 자료 보존·추가 차단: ${raw}`, () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    const controller = createController(storage);
    assert.equal(controller.getState().status, 'error');
    assert.equal(controller.add({ title: '영상', url: U2 }).status, 'blocked');
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  });
}

test('B11 읽기 실패를 키 없음으로 처리하지 않음', () => {
  let writes = 0;
  const storage = { getItem() { throw new Error('denied'); }, setItem() { writes += 1; } };
  assert.equal(readItems(storage).status, 'error');
  assert.equal(writes, 0);
});

test('B11 손상 자료는 명시적 초기화 성공 후 다시 추가 가능', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, '{broken');
  const controller = createController(storage);
  assert.equal(controller.reset().status, 'ready');
  assert.equal(controller.add({ title: '영상', url: U2 }).status, 'added');
});

test('B05 과거 저장 자료의 같은 주소 항목도 그대로 로드', () => {
  const items = [...initialItems(), { id: 'old-002', title: '다른 제목', url: U1 }];
  const storage = memoryStorage(items);
  const raw = storage.getItem(STORAGE_KEY);
  assert.deepEqual(readItems(storage).items, items);
  assert.equal(storage.getItem(STORAGE_KEY), raw);
});

test('초기 fixture와 앱의 초기 자료 일치', () => {
  const fixture = readFileSync(new URL('../fixtures/bookmarks.json', import.meta.url), 'utf8');
  assert.deepEqual(decodeData(fixture), initialItems());
});
