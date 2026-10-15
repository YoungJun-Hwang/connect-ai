# TD KOREA 홈페이지 브라우저 미리보기

메인키워드: **소상공인 사업장 경영진단**

POS·렌탈제품·인터넷 장비를 강조한 매장 이미지를 적용한 반응형 홈페이지입니다.

## 다운로드해서 열기

[index.html 다운로드](https://github.com/YoungJun-Hwang/connect-ai/raw/refs/heads/codex/browser-preview-download/preview-download/td-korea/index.html)

다운로드한 HTML을 Chrome 또는 Edge에서 열면 됩니다. 사진과 스타일, 메뉴 동작이 HTML 안에 포함되어 별도 설치가 필요하지 않습니다. Establish Retrosans·SUIT 웹폰트는 인터넷 연결 시 불러오며, 연결이 없으면 기기의 한국어 기본 글꼴로 표시합니다.

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


## 색상·글꼴 개정 · Establish Retrosans

이전 네이비·블루 테마를 웜 아이보리·차콜·올리브로 변경했습니다. 메인 화면은 밝은 바탕의 제목과 오른쪽 POS 사진을 나란히 배치하고, 모바일에서는 제목 아래에 사진을 배치합니다. 사진 파일은 유지하고 CSS로 채도를 낮춰 바탕색과 어울리게 했습니다.

- 주요 제목·브랜드·섹션 번호: **Establish Retrosans(스스로넷 설립체)**, 원래의 단일 굵기 400. 인위적인 볼드 합성 없이 사용합니다.
- 본문·메뉴·버튼·진단 입력 항목: **SUIT Variable**. 긴 한국어 문장과 입력 항목의 가독성을 위해 사용합니다.
- 웜 아이보리 배경: #F6F4EE / 본문 바탕: #FCFBF8
- 차콜 본문·푸터: #272A24 / 주요 버튼 올리브: #555F43
- 보조 본문: #66685F / 밝은 올리브 면: #ECEEE3
- 소량의 테라코타 포인트: #8C604A / 구분선: #D9D8CF
- 네이비 배경과 블루 버튼, 제목 위 사진 오버레이를 교체하고 카드 그림자를 제거했습니다.
- 홈페이지, 내장 V10, 독립 V10 화면에 같은 글꼴과 색상을 적용했습니다.
- POS 이미지 원본, 무료진단 진입 링크 9개, V10 입력·작업 요소 ID 344개와 JavaScript 코드는 유지했습니다.
- 본문·보조 글씨·버튼·라벨·푸터의 주요 색상 대비는 4.5:1 이상입니다.
- 390px·700px·850px·1100px 기준의 반응형 스타일과 메인 제목의 여백·줄간격을 조정했습니다.
- JavaScript 문법, 메인 화면 마크업, 입력·작업 요소 ID, 내장·독립 V10 일치를 확인했습니다.
- 실행 환경에 브라우저 도구가 없어 실제 폰트 표시·반응형 화면·리포트 인쇄·터치 조작은 직접 검증하지 못했습니다.

### 웹폰트 출처와 이용 방식

설립체 제작자 공식 페이지:
https://www.ssro.net/media/media_view.jsp?bcate=fontdown&no=520735

눈누 제공 서체 정보:
https://noonnu.cc/font_page/776

설립체 웹폰트 원본:
https://github.com/projectnoonnu/noonfonts_2112/blob/c2d7413f4e1cf5b77277a9f7f52fa22acd1e4c32/establishRetrosansOTF.woff

SUIT 공식 저장소:
https://github.com/sun-typeface/SUIT

폰트는 파일을 복제·수정해 저장하지 않고, 고정된 버전의 CDN 주소로 불러옵니다. 설립체의 지적재산권은 스스로넷과 해당 제작자에게 있습니다. 폰트 자체의 유료 판매·수정·재배포를 하지 않습니다. SUIT는 SIL OFL을 따릅니다.

최초 표시 성능을 위해 설립체를 미리 불러오며, 두 서체 모두 font-display: swap을 사용합니다. 인터넷 연결이 없거나 CDN을 불러올 수 없으면 기기의 한국어 기본 글꼴로 표시됩니다. 사진·진단 화면은 계속 HTML에 포함됩니다.
