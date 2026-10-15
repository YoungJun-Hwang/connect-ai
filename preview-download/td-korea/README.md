# TD KOREA 홈페이지 브라우저 미리보기

메인키워드: **소상공인 사업장 경영진단**

POS·렌탈제품·인터넷 장비를 강조한 매장 이미지를 적용한 반응형 홈페이지입니다.

## 다운로드해서 열기

[index.html 다운로드](https://github.com/YoungJun-Hwang/connect-ai/raw/refs/heads/codex/browser-preview-download/preview-download/td-korea/index.html)

다운로드한 HTML을 Chrome 또는 Edge에서 열면 됩니다. 사진과 스타일, 메뉴 동작이 HTML 안에 포함되어 별도 설치가 필요하지 않습니다.

## 브라우저 미리보기

[HTML Preview로 열기](https://htmlpreview.github.io/?https://github.com/YoungJun-Hwang/connect-ai/blob/codex/browser-preview-download/preview-download/td-korea/index.html)

위 링크는 공개 GitHub 파일을 불러오는 외부 미리보기 서비스입니다. 접속이 되지 않으면 HTML을 다운로드해서 열어주세요. 이 링크를 영구 홈페이지 호스팅 주소로 사용하는 것은 권하지 않습니다.

## 포함된 내용

- POS 이미지가 적용된 메인 화면
- PC·태블릿·모바일 화면 배치와 모바일 메뉴
- 고정비 점검, 지원금·지원사업 확인, 서비스 상세 안내
- 리포트 예시, 운영 원칙, 준비자료, 자주 묻는 질문
- 무료진단 버튼에서 현재 매장진단 V10으로 바로 이동
- 진단 화면에서 홈페이지로 돌아가기
- 기본정보·고정비·직원·역량진단 입력과 결과 리포트

## 현재 운영 범위

상담 접수처와 회사정보는 확정 전입니다. V10의 입력내용·상담기록은 현재 브라우저에 저장되며 담당자에게 자동 전송되지 않습니다. 입력자료에 따른 진단·리포트 생성과 파일 백업을 이용할 수 있습니다. 실제 AI 분석·미수령 지원금 자동조회는 포함되지 않습니다. 지원사업 자동조회 API는 연결 전으로 표시하고 호출하지 않습니다.

기존 chatgpt.site 주소의 배포본과 아임웹 편집 화면은 이번 GitHub 변경으로 갱신되지 않습니다.

## 확인 범위

섹션 링크, 중복 ID, H1, 이미지 포함 여부, 부모·V10 JavaScript 문법을 확인했습니다. 진단 진입·홈페이지 복귀·재진입 시 iframe 유지 및 미연결 지원사업 API를 호출하지 않는 로직을 테스트했습니다. 원본 V10의 입력·작업 요소 344개 ID를 유지했습니다. 실제 브라우저 렌더링·리포트 인쇄 및 모바일 터치는 미검증입니다.


## 현재 매장진단 V10 연결 · 2026-10-16

홈페이지의 무료진단 버튼 → V10 기본정보 입력 → 고정비·주류·직원·지원사업·역량 점검 → 진단 리포트 순서로 이용합니다.

진단은 홈페이지 HTML에 포함되어 있어 새 홈페이지 HTML만 다운로드해도 작동합니다. 홈페이지로 돌아왔다가 다시 진단을 열면 화면을 다시 로드하지 않아 현재 입력을 유지합니다. 상담내용의 파일 백업은 V10 내부 버튼을 이용합니다.

[독립된 V10 진단 화면 미리보기](https://htmlpreview.github.io/?https://github.com/YoungJun-Hwang/connect-ai/blob/codex/browser-preview-download/preview-download/td-korea/diagnosis-v10.html)

[독립된 V10 HTML 다운로드](https://github.com/YoungJun-Hwang/connect-ai/raw/refs/heads/codex/browser-preview-download/preview-download/td-korea/diagnosis-v10.html)

최신 제공 파일 TD_KOREA_현재매장진단_V10.html을 기준으로 연결했습니다. 미리보기용으로 잘못된 manifest 경로를 제거하고, 연결되지 않은 지원사업 API는 연결 전으로 안내합니다. 입력폼·평가·리포트·백업 기능은 유지했습니다. 지원사업 조회·담당자 접수의 서버 연결은 별도 작업입니다.
