# 유료 주문 서버

현재 실제 PG는 연결되지 않았습니다. 기본 실행에서는 `/api/payments/status`가 `enabled: false`를 반환하며, 주문 생성은 HTTP 503으로 차단됩니다. 결제 완료를 흉내 내는 브라우저 버튼, 무료 개인 리포트 발급, 임의 승인 플래그는 없습니다.

Node.js 24에서 프로젝트 폴더를 기준으로 실행합니다. 패키지 설치와 홈페이지 빌드를 먼저 완료해야 합니다.

```bash
npm ci
npm run build
node --experimental-strip-types server/index.mjs
```

홈페이지와 API는 기본 `http://localhost:8787`의 같은 출처에서 제공됩니다. 정적 HTML만 올리는 호스팅에는 이 주문 서버가 실행되지 않습니다. Wix에 삽입하는 경우에는 서버를 포함한 배포가 필요합니다. iframe을 다른 사이트에 삽입하면 브라우저의 제3자 쿠키 제한으로 주문 세션이 유지되지 않을 수 있으므로, 처음에는 별도 탭의 결제 페이지를 권장합니다.

선택 설정은 `SAJU_PORT`, `SAJU_HOST`, `SAJU_DB_PATH`, `SAJU_PUBLIC_ORIGIN`입니다. 운영 HTTPS 주소를 `SAJU_PUBLIC_ORIGIN`에 지정하면 쿠키에 `Secure`가 적용됩니다. 프록시 뒤에서도 지정한 실제 주소로 Origin을 검증합니다. `SAJU_HOST`의 기본값은 로컬 접속용 `127.0.0.1`입니다.

## PG 어댑터 계약

Wix 또는 네이버페이의 공식 가맹점 심사, 한국 사업자 지원 여부, 지원 상품과 API 문서를 확인한 뒤 **서버 코드에서만** 어댑터를 작성하고 주입해야 합니다. 아래는 인터페이스 설명이며, 실제 PG 구현 또는 해당 PG의 지원 보장을 뜻하지 않습니다.

```js
import { createServer } from "./server/index.mjs";

const gateway = {
  provider: "naver-pay", // 또는 'wix'
  isConfigured: true, // 검증된 가맹점 설정이 있을 때만
  allowedCheckoutOrigins: ["https://공식-PG-결제창-호스트"],
  async createCheckout({ orderId, productId, amount, currency }) {
    // 서버가 공식 API로 주문을 만들고 PG의 식별자/결제창 주소를 확인합니다.
    // birthDate/name은 이 계약에 포함하지 않습니다.
    return { paymentId, checkoutUrl };
  },
  async verifyPayment({ orderId, paymentId, amount, currency }) {
    // 공식 서버 API 조회 또는 서명 검증된 이벤트+서버 조회로 승인 내역을 확인합니다.
    // 리다이렉트 주소, 클라이언트 응답, 'paid=true'는 승인 근거가 아닙니다.
    return {
      orderId, paymentId, amount, currency,
      status, // pending | paid | cancelled | refunded | failed
    };
  },
};

createServer({ gateway, publicOrigin: "https://실제-서비스-주소" }).listen(8787);
```

`verifyPayment` 반환값에는 PG가 승인한 실제 주문 식별자·거래 식별자·금액·통화를 넣어야 합니다. 요청 값을 그대로 복사해서 승인 내역처럼 반환하면 안 됩니다. PG가 제공하는 가맹점 식별자 검증, 승인·취소·환불 모델, 결제 생성의 멱등성, 필수 약관과 운영 로그는 실제 어댑터에서 공식 명세에 맞춰 구현해야 합니다. PG가 별도의 승인 호출을 요구한다면 `verifyPayment`에서 공식 절차와 멱등성을 함께 처리합니다.

단순 키 환경변수 추가만으로 결제가 활성화되지 않습니다. 개발용 승인 어댑터도 운영 서버에 포함하지 않았습니다. `scripts/checkout-server.test.mjs` 내부에만 네트워크 호출 없는 검증용 fixture가 있습니다.

## 주문과 리포트

- 상품 ID와 가격은 서버 카탈로그에서 결정합니다. 클라이언트가 보낸 금액은 허용하지 않습니다.
- 주문은 임의 UUID로 만들고, HttpOnly·SameSite=Lax 세션 쿠키의 소유자만 확인할 수 있습니다.
- 승인 내역의 주문 ID·거래 ID·금액·KRW 통화가 모두 일치할 때만 서버에서 사주와 7일 실천 가이드를 계산합니다.
- 매 조회 때 결제 상태를 다시 확인합니다. 미지급·취소·환불·실패에는 리포트를 보내지 않습니다. 다른 주문에서 사용한 거래 ID는 중복 저장할 수 없습니다.
- 응답에는 `Cache-Control: no-store`를 적용합니다. 생년월일과 결제 토큰을 로그에 출력하지 않습니다.

주문은 `data/orders.sqlite`에 저장됩니다. 개발용 단일 서버 저장소이며, 파일과 디렉터리는 접근 권한을 제한합니다. **개인정보는 암호화된 상태로 저장하지 않습니다.** 실제 운영 전에 영구 디스크·백업·접근 통제·보유 기간과 삭제 절차를 마련하고, 필요하면 관리형 데이터베이스와 암호화를 적용해야 합니다. 서버리스의 임시 파일시스템이나 여러 서버가 각기 다른 SQLite 파일을 쓰는 배포에는 그대로 사용할 수 없습니다. 세션은 30일간 유효하며, 브라우저 쿠키 삭제 또는 다른 기기로 이동할 경우 주문 복구 기능은 아직 없습니다.

이 코드는 웹사이트의 결제 경계를 구현한 단계입니다. 실제 Wix/네이버페이 승인, 정산, 자동 환불, 계정 기반 재다운로드는 가맹점 연동 후 별도로 검증해야 합니다.
