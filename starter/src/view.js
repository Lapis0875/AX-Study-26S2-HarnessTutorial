export function createView(root = document) {
  const list = root.querySelector('#bookmarks');
  const count = root.querySelector('#count');
  const empty = root.querySelector('#empty');
  const notice = root.querySelector('#notice');
  const form = root.querySelector('#bookmark-form');

  function render(state) {
    list.replaceChildren();
    form.querySelector('button').disabled = state.status !== 'ready';
    if (state.status !== 'ready') {
      count.textContent = '확인 불가';
      empty.textContent = '저장 자료를 불러올 수 없습니다.';
      empty.hidden = false;
      return;
    }
    count.textContent = `${state.items.length}개`;
    empty.textContent = '아직 저장한 즐겨찾기가 없습니다. 첫 주소를 추가해 보세요.';
    empty.hidden = state.items.length !== 0;
    state.items.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'bookmark-row';
      row.dataset.id = item.id;
      const number = document.createElement('span');
      number.className = 'row-number';
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const title = document.createElement('span');
      title.className = 'bookmark-title';
      title.textContent = item.title;
      const url = document.createElement('span');
      url.className = 'bookmark-url';
      url.textContent = item.url;
      const hint = document.createElement('span');
      hint.className = 'open-hint';
      hint.textContent = '새 탭으로 열기 ↗';
      link.append(title, url, hint);
      row.append(number, link);
      list.append(row);
    });
  }

  function showNotice(message, kind = '') {
    notice.textContent = message;
    notice.dataset.kind = kind;
  }

  function showErrors(errors = {}) {
    for (const name of ['url', 'title']) {
      const input = form.elements.namedItem(name);
      root.querySelector(`#${name}-error`).textContent = errors[name] ?? '';
      input.setAttribute('aria-invalid', String(Boolean(errors[name])));
    }
  }
  return { render, showNotice, showErrors, form };
}
