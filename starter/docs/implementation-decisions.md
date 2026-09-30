# L03에서 채택한 결정

이 결정은 L03의 정책입니다. L02 원문의 당시 미정 사항을 소급 변경하지 않습니다.

| 항목 | 채택 내용 |
| --- | --- |
| 기술 | HTML·CSS·일반 JavaScript 모듈, Vite 8.3.1 |
| 검사 | Node 내장 test runner, 기본·목표 파일 명시 선택 |
| 저장 | localStorage, 수업 전용 키 `ax-study:l03:bookmarks:v1` |
| 스키마 | `{ version: 1, items: [{ id, url, title }] }` |
| ID | 추가 때 `crypto.randomUUID()`, 초기 항목 `sample-001` |
| 최초 실행 | 키가 없을 때만 U1 한 항목을 저장한 뒤 표시 |
| 빈 목록 | 정상적인 `items: []`는 그대로 유지 |
| 필수 입력 | 제목·주소 모두 필수, 양끝 공백 제거 |
| 주소 | `http://`·`https://` 절대 주소, URL 파서와 형식 검사. 내부 공백·역슬래시 거절 |
| 문자열 보존 | 파서의 변환 결과를 저장하지 않음. 대소문자·포트·슬래시·쿼리·fragment 보존 |
| 성공 | 배열 뒤에 한 항목 추가, 저장 성공 뒤 상태 갱신, `저장했습니다.` 표시, 두 입력 비움, 주소 초점 |
| 오류 | 저장 전 상태 보존, 입력 유지. 손상·미지원 자료는 원본 유지·추가 차단 |
| 스키마 검사 | 항목별 필수 필드·안전한 주소·고유 ID 확인. 같은 주소는 허용 |
| 초기화 | native confirm으로 영향 범위를 알린 뒤 수업 키만 U1 한 항목으로 기록 |
| 링크 | 제목·주소 표시, `target=_blank`, `rel=noopener noreferrer`, 제목은 textContent |
| 접속 | `http://127.0.0.1:5173`, strictPort, 로컬 호스트만 바인딩 |
| 범위 | 한 탭 실습. 다중 탭 편집·동기화 없음 |

## 코드 읽는 순서

`app.js`(이벤트) → `controller.js`(저장 성공 후 상태 확정) → `bookmarks.js`(검증·추가).
`storage.js`는 읽기·쓰기·초기화, `view.js`는 목록·개수·안내를 담당합니다.
각 오류 경로는 메모리 전용 저장으로 전환하지 않습니다. Storage getter의 예외도 읽기 실패로 처리합니다.

## 처리 결과와 검사 계약

`addBookmark(items, input, makeId?)`는 상태를 직접 바꾸지 않고 다음 배열과 결과를 반환합니다.
정상 결과는 `{ status: 'added', items, message }`, 입력 오류는 `invalid`와 필드별 `errors`입니다.
`createController(storage).add(input)`이 기록 성공 후에만 현재 상태를 교체합니다.
저장 실패는 `error`, 읽기 실패 상태의 추가는 `blocked`입니다.

목표 T03은 개선 후 `status: 'duplicate'`와 비어 있지 않은 사용자 안내를 요구합니다.
문구 전체를 검사에 고정하지 않으며 일반 성공 문구와 구분합니다. 실제 화면 안내는 브라우저에서도 확인합니다.
중복 차단 시 입력값·초점은 후속 작업의 결정 사항입니다.

## 실행 관련 선택

Node 최소 버전은 22.12.0, 의존성은 정확한 버전과 lockfile로 고정했습니다.
Vite 설정은 native loader를 사용하고 캐시는 node_modules 안에 둡니다.
`build.emptyOutDir: false`로 기존 산출물의 자동 삭제를 하지 않습니다. 배포는 새 디렉터리에서 빌드합니다.
브라우저 자동화는 학생 패키지와 분리된 강사 도구입니다.
