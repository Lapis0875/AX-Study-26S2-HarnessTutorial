export function validateInput(input) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  const errors = {};
  if (!title) errors.title = '제목을 입력해 주세요.';
  if (!url) {
    errors.url = '웹주소를 입력해 주세요.';
  } else {
    try {
      const parsed = new URL(url);
      if (!/^https?:\/\//i.test(url) || !parsed.hostname ||
          !['http:', 'https:'].includes(parsed.protocol) || /[\s\\]/u.test(url)) {
        errors.url = 'http:// 또는 https://로 시작하는 올바른 웹주소를 입력해 주세요.';
      }
    } catch {
      errors.url = 'http:// 또는 https://로 시작하는 올바른 웹주소를 입력해 주세요.';
    }
  }
  return { title, url, errors };
}

export function addBookmark(items, input, makeId = () => crypto.randomUUID()) {
  const { title, url, errors } = validateInput(input);
  if (Object.keys(errors).length) {
    return { status: 'invalid', items, errors, message: '입력 내용을 확인해 주세요.' };
  }
  const item = { id: makeId(), title, url };
  return { status: 'added', items: [...items, item], message: '저장했습니다.' };
}
