import test from 'node:test';
import assert from 'node:assert/strict';
import { createController } from '../src/controller.js';
import { initialItems, readItems } from '../src/storage.js';
import { memoryStorage, U1, U2 } from './helpers.js';

test('T01/R1 같은 주소의 새 항목이 저장되지 않는다', () => {
  const storage = memoryStorage();
  const controller = createController(storage);
  controller.add({ title: '다시 읽을 글', url: U1 });
  assert.equal(readItems(storage).items.length, 1, '같은 주소 추가 후 실제 저장 개수는 1이어야 합니다.');
  assert.equal(controller.getState().items.length, 1);
});

test('T02/R2 기존 제목·주소·ID를 보존한다', () => {
  const storage = memoryStorage();
  const controller = createController(storage);
  controller.add({ title: '다시 읽을 글', url: U1 });
  const original = initialItems()[0];
  assert.deepEqual(readItems(storage).items.find((item) => item.id === original.id), original);
});

test('T03/R3 중복 결과와 사용자 안내를 제공한다', () => {
  const controller = createController(memoryStorage());
  const result = controller.add({ title: '다시 읽을 글', url: U1 });
  assert.equal(result.status, 'duplicate', '같은 주소는 added가 아닌 duplicate 결과여야 합니다.');
  assert.ok(typeof result.message === 'string' && result.message.trim().length > 0);
  assert.notEqual(result.message, '저장했습니다.');
});

test('T04/R4 새로운 다른 주소는 계속 저장한다', () => {
  const storage = memoryStorage();
  const controller = createController(storage);
  const result = controller.add({ title: '나중에 볼 영상', url: U2 });
  assert.equal(result.status, 'added');
  const saved = readItems(storage).items;
  assert.equal(saved.length, 2);
  assert.deepEqual(saved[0], initialItems()[0]);
  assert.equal(saved[1].url, U2);
  assert.equal(saved[1].title, '나중에 볼 영상');
});
