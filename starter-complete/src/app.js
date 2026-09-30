import './styles.css';
import { createController } from './controller.js';
import { createView } from './view.js';

const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};
const controller = createController(storage);
const view = createView();
view.render(controller.getState());
if (controller.getState().status !== 'ready') {
  view.showNotice(controller.getState().message, 'error');
}

view.form.addEventListener('submit', (event) => {
  event.preventDefault();
  view.showErrors();
  const result = controller.add({
    url: view.form.elements.url.value,
    title: view.form.elements.title.value,
  });
  const noticeKind = result.status === 'added' ? 'success' : result.status === 'duplicate' ? '' : 'error';
  view.showNotice(result.message, noticeKind);
  if (result.status === 'added') {
    view.render(controller.getState());
    view.form.reset();
    view.form.elements.url.focus();
  } else if (result.status === 'duplicate') {
    view.form.elements.url.focus();
  } else if (result.status === 'invalid') {
    view.showErrors(result.errors);
    view.form.elements[result.errors.url ? 'url' : 'title'].focus();
  }
});

document.querySelector('#reset').addEventListener('click', () => {
  const confirmed = window.confirm('수업용 즐겨찾기 데이터를 처음의 예시 한 개로 되돌립니다. 현재 실습에서 추가한 항목은 없어집니다. 다른 브라우저 자료는 변경하지 않습니다. 계속할까요?');
  if (!confirmed) return;
  const result = controller.reset();
  if (result.status === 'ready') {
    view.render(controller.getState());
    view.showErrors();
    view.form.reset();
    view.showNotice('초기 예제 한 개로 되돌렸습니다.', 'success');
    view.form.elements.url.focus();
  } else {
    view.showNotice(result.message, 'error');
  }
});
