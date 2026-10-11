import { findProduct, products } from "./catalog";
import type { SajuInput, SajuResult } from "./saju";
import type { TopicGuide } from "./topic-guide";

export type PaymentStatus = {
  enabled: boolean;
  provider: "wix" | "naver-pay" | null;
  currency: "KRW";
  reason: "merchant-not-configured" | "ready";
};

export type PurchasedReport = {
  result: SajuResult;
  guide: TopicGuide;
  name: string;
  input: SajuInput;
  topic: string;
};

export type Order = {
  orderId: string;
  productId: string;
  amount: number;
  currency: "KRW";
  status: "pending" | "paid" | "cancelled" | "refunded" | "failed";
  report?: PurchasedReport;
};

export const pendingOrderKey = "dalbit-saju-pending-order-v1";
const unavailable: PaymentStatus = {
  enabled: false,
  provider: null,
  currency: "KRW",
  reason: "merchant-not-configured",
};

function apiBase() {
  const configured = import.meta.env.VITE_CHECKOUT_API_URL?.trim();
  if (!configured) return null;
  const url = new URL(configured, window.location.origin);
  if (
    url.origin !== window.location.origin ||
    !["http:", "https:"].includes(url.protocol)
  ) {
    throw new Error("구매 서비스의 연결 설정을 확인해주세요.");
  }
  return url.pathname.replace(/\/$/, "");
}

async function request(path: string, body?: unknown): Promise<unknown> {
  const base = apiBase();
  if (!base)
    throw new Error("아직 판매 준비 중이에요. 지금은 결제되지 않습니다.");
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const message =
      response.status === 503
        ? "아직 판매 준비 중이에요. 지금은 결제되지 않습니다."
        : response.status === 403 || response.status === 404
          ? "이 브라우저에서 확인할 수 있는 주문이 아니에요. 구매한 브라우저에서 다시 확인해주세요."
          : "주문을 확인하지 못했어요. 잠시 후 다시 시도해주세요.";
    throw new Error(message);
  }
  return response.json();
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("구매 정보 형식을 확인하지 못했어요.");
  }
  return value as Record<string, unknown>;
}

export async function getPaymentStatus(): Promise<PaymentStatus> {
  if (!apiBase()) return unavailable;
  const data = record(await request("/payments/status"));
  if (
    typeof data.enabled !== "boolean" ||
    data.currency !== "KRW" ||
    ![null, "wix", "naver-pay"].includes(data.provider as string | null) ||
    !["merchant-not-configured", "ready"].includes(data.reason as string) ||
    (data.enabled && (data.provider === null || data.reason !== "ready"))
  ) {
    throw new Error("결제 서비스 상태를 확인하지 못했어요.");
  }
  return data as PaymentStatus;
}

export async function createOrder(
  productId: string,
  name: string,
  input: SajuInput,
) {
  const data = record(await request("/orders", { productId, name, input }));
  if (
    typeof data.orderId !== "string" ||
    !/^[a-zA-Z0-9-]{10,100}$/.test(data.orderId) ||
    typeof data.checkoutUrl !== "string" ||
    data.productId !== productId ||
    data.currency !== "KRW" ||
    !Number.isSafeInteger(data.amount) ||
    Number(data.amount) <= 0
  ) {
    throw new Error("결제창을 준비하지 못했어요.");
  }
  if (data.amount !== findProduct(productId).priceKrw) {
    throw new Error(
      "상품 가격이 변경됐어요. 새로고침한 뒤 금액을 다시 확인해주세요.",
    );
  }
  const checkoutUrl = new URL(data.checkoutUrl);
  if (
    checkoutUrl.protocol !== "https:" ||
    checkoutUrl.username ||
    checkoutUrl.password
  ) {
    throw new Error("안전한 결제 주소를 확인하지 못했어요.");
  }
  return {
    orderId: data.orderId,
    checkoutUrl: checkoutUrl.href,
    amount: Number(data.amount),
  };
}

export async function getOrder(orderId: string): Promise<Order> {
  if (!/^[a-zA-Z0-9-]{10,100}$/.test(orderId))
    throw new Error("주문 번호를 확인해주세요.");
  const data = record(await request(`/orders/${encodeURIComponent(orderId)}`));
  if (
    data.orderId !== orderId ||
    !products.some((p) => p.id === data.productId) ||
    !Number.isSafeInteger(data.amount) ||
    Number(data.amount) <= 0 ||
    data.currency !== "KRW" ||
    !["pending", "paid", "cancelled", "refunded", "failed"].includes(
      data.status as string,
    )
  ) {
    throw new Error("주문과 결제 금액이 일치하는지 확인하지 못했어요.");
  }
  if (data.status === "paid") {
    const report = record(data.report);
    const guide = record(report.guide);
    const result = record(report.result);
    if (
      typeof report.name !== "string" ||
      !report.input ||
      report.topic !== findProduct(String(data.productId)).title ||
      guide.productId !== data.productId ||
      typeof guide.summary !== "string" ||
      !Array.isArray(guide.plan) ||
      guide.plan.length !== 7 ||
      !Array.isArray(guide.evidence) ||
      !Array.isArray(guide.questions) ||
      !Array.isArray(result.pillars)
    ) {
      throw new Error("구매한 리포트를 확인하지 못했어요. 다시 조회해주세요.");
    }
  } else if (data.report !== undefined) {
    throw new Error("결제가 확인되지 않은 결과는 제공하지 않아요.");
  }
  return data as Order;
}
