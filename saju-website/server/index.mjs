import { createServer as createHttpServer } from "node:http";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../src/lib/catalog.ts";
import { calculateSaju, validateBirthInput } from "../src/lib/saju.ts";
import { createTopicGuide } from "../src/lib/topic-guide.ts";
import { OrderStore, PaymentStateConflict } from "./order-store.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COOKIE_NAME = "dalbit_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const MAX_JSON_BYTES = 32_768;
const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const STATUSES = new Set(["pending", "paid", "cancelled", "refunded", "failed"]);
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function json(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  if (request.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new HttpError(415, "json-required", "JSON 형식으로 요청해 주세요.");
  }
  if (Number(request.headers["content-length"]) > MAX_JSON_BYTES) {
    request.resume();
    throw new HttpError(413, "body-too-large", "입력한 내용이 너무 깁니다.");
  }
  const buffer = await new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    request.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_JSON_BYTES) {
        settled = true;
        reject(new HttpError(413, "body-too-large", "입력한 내용이 너무 깁니다."));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!settled) resolveBody(Buffer.concat(chunks));
    });
    request.on("error", () => reject(new HttpError(400, "invalid-request", "요청을 읽을 수 없습니다.")));
  });
  try {
    const value = JSON.parse(buffer.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw new HttpError(400, "invalid-json", "입력 내용을 확인해 주세요.");
  }
}

function validateOrder(body) {
  if (Object.keys(body).some((key) => !["productId", "name", "input"].includes(key))) {
    throw new HttpError(400, "unexpected-field", "상품과 생년월일만 전달해 주세요.");
  }
  const product = products.find((value) => value.id === body.productId);
  if (!product) throw new HttpError(400, "unknown-product", "판매 중인 상품을 선택해 주세요.");
  if (!Number.isSafeInteger(product.priceKrw) || product.priceKrw < 1) {
    throw new HttpError(503, "invalid-catalog", "상품 가격을 확인 중입니다.");
  }
  const name = typeof body.name === "string" ? body.name.normalize("NFC").trim() : "";
  if (!name || name.length > 40 || /\p{C}/u.test(name)) {
    throw new HttpError(400, "invalid-name", "이름을 1~40자로 입력해 주세요.");
  }
  const input = body.input;
  const allowed = ["birthDate", "calendar", "leapMonth", "birthTime", "unknownTime", "dayBoundary"];
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some((key) => !allowed.includes(key)) ||
      ["leapMonth", "unknownTime"].some((key) => input[key] !== undefined && typeof input[key] !== "boolean") ||
      (input.birthTime !== undefined && typeof input.birthTime !== "string")) {
    throw new HttpError(400, "invalid-input", "생년월일 입력 형식을 확인해 주세요.");
  }
  const problem = validateBirthInput(input);
  if (problem) throw new HttpError(400, "invalid-input", problem);
  const cleanInput = {
    birthDate: input.birthDate,
    calendar: input.calendar,
    leapMonth: input.calendar === "lunar" && input.leapMonth === true,
    unknownTime: input.unknownTime === true,
    dayBoundary: input.dayBoundary ?? "midnight",
    ...(input.unknownTime ? {} : { birthTime: input.birthTime }),
  };
  return { product, name, input: cleanInput };
}

function gatewayContract(gateway) {
  if (!gateway) return null;
  if (!["wix", "naver-pay"].includes(gateway.provider) || gateway.isConfigured !== true ||
      typeof gateway.createCheckout !== "function" || typeof gateway.verifyPayment !== "function" ||
      !Array.isArray(gateway.allowedCheckoutOrigins) || !gateway.allowedCheckoutOrigins.length) {
    throw new Error("A gateway needs a verified merchant configuration and HTTPS checkout origins.");
  }
  const origins = new Set(gateway.allowedCheckoutOrigins.map((value) => {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Checkout allowlist entries must be HTTPS origins.");
    }
    return url.origin;
  }));
  return { gateway, origins };
}

function checkedCheckout(value, origins) {
  if (!value || typeof value.paymentId !== "string" || !value.paymentId.trim() || value.paymentId.length > 256 ||
      /\p{C}/u.test(value.paymentId) || typeof value.checkoutUrl !== "string" || value.checkoutUrl.length > 4096) {
    throw new HttpError(502, "invalid-checkout", "결제 요청을 확인할 수 없습니다.");
  }
  let url;
  try { url = new URL(value.checkoutUrl); } catch { /* rejected below */ }
  if (!url || url.protocol !== "https:" || url.username || url.password || url.hash || !origins.has(url.origin)) {
    throw new HttpError(502, "invalid-checkout", "결제 주소를 확인할 수 없습니다.");
  }
  return { paymentId: value.paymentId, checkoutUrl: url.href };
}

function checkedVerification(value, order) {
  if (!value || !STATUSES.has(value.status) || value.orderId !== order.id ||
      value.paymentId !== order.payment_id || value.amount !== order.amount || value.currency !== order.currency) {
    throw new HttpError(502, "payment-verification-failed", "결제 승인 정보를 확인할 수 없습니다.");
  }
  return value.status;
}

function publicOrder(order) {
  return { orderId: order.id, productId: order.product_id, amount: order.amount,
    currency: order.currency, status: order.status };
}

/** The only way to enable checkout is to inject a server-side, verified PG adapter. */
export function createServer({
  gateway = null,
  databasePath = resolve(PROJECT_ROOT, "data/orders.sqlite"),
  staticDir = resolve(PROJECT_ROOT, "dist"),
  publicOrigin = null,
  secureCookies = undefined,
} = {}) {
  const contract = gatewayContract(gateway);
  const configuredUrl = publicOrigin ? new URL(publicOrigin) : null;
  if (configuredUrl && (!["http:", "https:"].includes(configuredUrl.protocol) || configuredUrl.username || configuredUrl.password)) {
    throw new Error("publicOrigin must be an HTTP(S) service URL without credentials.");
  }
  const allowedOrigin = configuredUrl?.origin ?? null;
  secureCookies = configuredUrl?.protocol === "https:" || secureCookies === true;
  const store = new OrderStore(databasePath);
  const sessionHash = (value) => createHash("sha256").update(value).digest("hex");

  function session(request, response, create = false) {
    const token = request.headers.cookie?.split(";").map((item) => item.trim())
      .find((item) => item.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
    if (token && /^[A-Za-z0-9_-]{43}$/.test(token)) {
      const hash = sessionHash(token);
      if (store.session(hash, Date.now())) return hash;
    }
    if (!create) return null;
    const newToken = randomBytes(32).toString("base64url");
    const hash = sessionHash(newToken);
    store.addSession(hash, Date.now() + SESSION_SECONDS * 1000);
    response.setHeader("Set-Cookie", `${COOKIE_NAME}=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secureCookies ? "; Secure" : ""}`);
    return hash;
  }

  function checkOrigin(request) {
    const expected = allowedOrigin ?? `${secureCookies ? "https" : "http"}://${request.headers.host}`;
    if (request.headers["sec-fetch-site"] === "cross-site" ||
        (request.headers.origin && request.headers.origin !== expected)) {
      throw new HttpError(403, "origin-not-allowed", "이 사이트에서 결제를 진행해 주세요.");
    }
  }

  function requireGateway() {
    if (!contract) throw new HttpError(503, "merchant-not-configured", "결제 가맹점 연동을 준비 중입니다. 현재 주문과 결제는 진행되지 않습니다.");
    return contract.gateway;
  }

  async function serveStatic(request, response, url) {
    if (!["GET", "HEAD"].includes(request.method)) throw new HttpError(405, "method-not-allowed", "지원하지 않는 요청입니다.");
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { throw new HttpError(400, "invalid-path", "주소를 확인해 주세요."); }
    if (pathname.includes("\0") || pathname.includes("\\") || pathname.split("/").includes("..")) {
      throw new HttpError(403, "invalid-path", "주소를 확인해 주세요.");
    }
    const root = resolve(staticDir);
    let target = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!target.startsWith(`${root}${sep}`)) throw new HttpError(403, "invalid-path", "주소를 확인해 주세요.");
    let file;
    try {
      const canonicalRoot = await realpath(root);
      try {
        const info = await stat(target);
        if (!info.isFile()) throw new Error();
      } catch {
        if (extname(pathname)) throw new HttpError(404, "not-found", "파일을 찾을 수 없습니다.");
        target = resolve(root, "index.html");
      }
      const canonicalTarget = await realpath(target);
      if (!canonicalTarget.startsWith(`${canonicalRoot}${sep}`)) throw new HttpError(403, "invalid-path", "주소를 확인해 주세요.");
      file = await readFile(canonicalTarget);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, "site-not-built", "npm run build로 홈페이지를 먼저 빌드해 주세요.");
    }
    response.writeHead(200, {
      "Content-Type": MIME[extname(target)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "Cache-Control": extname(target) === ".html" ? "no-cache" : "public, max-age=3600",
    });
    response.end(request.method === "HEAD" ? undefined : file);
  }

  const server = createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (!url.pathname.startsWith("/api/")) return await serveStatic(request, response, url);
      checkOrigin(request);
      if (url.pathname === "/api/payments/status") {
        if (request.method !== "GET") throw new HttpError(405, "method-not-allowed", "지원하지 않는 요청입니다.");
        return json(response, 200, { enabled: !!contract, provider: contract?.gateway.provider ?? null,
          currency: "KRW", reason: contract ? "ready" : "merchant-not-configured" });
      }
      if (url.pathname === "/api/orders") {
        if (request.method !== "POST") throw new HttpError(405, "method-not-allowed", "지원하지 않는 요청입니다.");
        const adapter = requireGateway();
        const { product, name, input } = validateOrder(await readJson(request));
        const owner = session(request, response, true);
        const order = { id: randomUUID(), sessionHash: owner, productId: product.id,
          amount: product.priceKrw, currency: "KRW", name, input, createdAt: Date.now() };
        store.addOrder(order);
        let checkout;
        try {
          checkout = checkedCheckout(await adapter.createCheckout({ orderId: order.id,
            productId: order.productId, amount: order.amount, currency: order.currency }), contract.origins);
          store.attachCheckout(order.id, checkout.paymentId, checkout.checkoutUrl, Date.now());
        } catch {
          store.updateStatus(order.id, "failed", null, Date.now());
          throw new HttpError(502, "checkout-unavailable", "결제창을 준비하지 못했습니다. 결제 상태를 다시 확인해 주세요.");
        }
        return json(response, 201, { orderId: order.id, productId: order.productId, amount: order.amount,
          currency: order.currency, status: "pending", checkoutUrl: checkout.checkoutUrl });
      }
      const match = /^\/api\/orders\/([^/]+)$/.exec(url.pathname);
      if (match) {
        if (request.method !== "GET") throw new HttpError(405, "method-not-allowed", "지원하지 않는 요청입니다.");
        const owner = session(request, response);
        const order = owner && ORDER_ID.test(match[1]) ? store.orderForSession(match[1], owner) : null;
        if (!order) throw new HttpError(404, "order-not-found", "이 브라우저의 주문을 찾을 수 없습니다.");
        const adapter = requireGateway();
        if (!order.payment_id) return json(response, 200, publicOrder(order));
        let status;
        try {
          status = checkedVerification(await adapter.verifyPayment({ orderId: order.id,
            paymentId: order.payment_id, amount: order.amount, currency: order.currency }), order);
        } catch (error) {
          if (error instanceof HttpError) throw error;
          throw new HttpError(502, "payment-verification-unavailable", "결제 상태를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.");
        }
        let verified;
        try {
          verified = store.applyVerification(order.id, status, (current) => {
            const input = JSON.parse(current.input_json);
            const result = calculateSaju(input);
            const guide = createTopicGuide(result, current.product_id);
            return { result, guide, name: current.name, input, topic: guide.title };
          }, Date.now());
        } catch (error) {
          if (error instanceof PaymentStateConflict) {
            throw new HttpError(502, "payment-state-conflict", "결제 상태를 다시 확인해야 합니다.");
          }
          throw error;
        }
        return json(response, 200, { ...publicOrder(verified.order), ...(verified.report ? { report: verified.report } : {}) });
      }
      throw new HttpError(404, "not-found", "요청한 기능을 찾을 수 없습니다.");
    } catch (error) {
      // Never log birth data, checkout tokens, merchant secrets, or upstream error bodies.
      if (!response.headersSent) json(response, error instanceof HttpError ? error.status : 500,
        { error: error instanceof HttpError ? error.code : "internal-error",
          message: error instanceof HttpError ? error.message : "요청을 처리하지 못했습니다." });
      else response.end();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.maxHeadersCount = 64;
  server.on("close", () => store.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.SAJU_PORT ?? "8787");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SAJU_PORT must be a valid TCP port.");
  const server = createServer({
    databasePath: process.env.SAJU_DB_PATH ? resolve(process.env.SAJU_DB_PATH) : undefined,
    publicOrigin: process.env.SAJU_PUBLIC_ORIGIN || null,
  });
  server.listen(port, process.env.SAJU_HOST ?? "127.0.0.1", () => {
    console.log(`달빛사주 서버: http://localhost:${port} (결제 가맹점 미연결)`);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close());
}
