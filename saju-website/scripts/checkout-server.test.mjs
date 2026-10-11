import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { createServer } from "../server/index.mjs";
import { products } from "../src/lib/catalog.ts";

// This fixture is deliberately confined to tests. No mock payment path is shipped.
function fixtureGateway(overrides = {}) {
  const transactions = new Map();
  const created = [];
  const gateway = {
    provider: "naver-pay",
    isConfigured: true,
    allowedCheckoutOrigins: ["https://checkout.example.test"],
    async createCheckout(order) {
      created.push(order);
      const paymentId = `transaction-${order.orderId}`;
      transactions.set(order.orderId, { ...order, paymentId, status: "pending" });
      return { paymentId, checkoutUrl: `https://checkout.example.test/pay/${paymentId}` };
    },
    async verifyPayment({ orderId }) {
      return transactions.get(orderId);
    },
    ...overrides,
  };
  return { gateway, transactions, created };
}

async function setup(t, gateway = null) {
  const directory = await mkdtemp(join(tmpdir(), "dalbit-paid-"));
  const databasePath = join(directory, "orders.sqlite");
  const staticDir = join(directory, "dist");
  await mkdir(staticDir);
  await writeFile(join(staticDir, "index.html"), "<!doctype html><title>test site</title>");
  const active = new Set();
  async function start(replacementGateway = gateway) {
    const server = createServer({ gateway: replacementGateway, databasePath, staticDir });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    active.add(server);
    const url = `http://127.0.0.1:${server.address().port}`;
    let cookie = "";
    const client = {
      server, url,
      get cookie() { return cookie; },
      set cookie(value) { cookie = value; },
      async request(path, { body, headers = {}, method = body ? "POST" : "GET" } = {}) {
        const response = await fetch(`${url}${path}`, {
          method,
          headers: { ...(cookie ? { Cookie: cookie } : {}),
            ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
          ...(body ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
        });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) cookie = setCookie.split(";", 1)[0];
        const payload = response.headers.get("content-type")?.includes("application/json")
          ? await response.json() : await response.text();
        return { status: response.status, headers: response.headers, body: payload };
      },
      async stop() {
        await new Promise((resolveStop, reject) => server.close((error) => error ? reject(error) : resolveStop()));
        active.delete(server);
      },
    };
    return client;
  }
  t.after(async () => {
    for (const server of active) await new Promise((resolveStop) => server.close(resolveStop));
    await rm(directory, { recursive: true, force: true });
  });
  return Object.assign(await start(), { start, databasePath, directory, staticDir });
}

const purchase = (overrides = {}) => ({
  productId: "life", name: "검증 고객",
  input: { birthDate: "2000-01-07", calendar: "solar", birthTime: "12:00", dayBoundary: "midnight" },
  ...overrides,
});

async function ordered(client, body = purchase()) {
  const response = await client.request("/api/orders", { body });
  assert.equal(response.status, 201);
  assert.equal(response.body.status, "pending");
  assert.equal("report" in response.body, false);
  return response.body;
}

test("missing merchant disables checkout and cannot issue orders or reports", async (t) => {
  const client = await setup(t);
  const state = await client.request("/api/payments/status");
  assert.deepEqual(state.body, { enabled: false, provider: null, currency: "KRW", reason: "merchant-not-configured" });
  const response = await client.request("/api/orders?paid=true", { body: purchase() });
  assert.equal(response.status, 503);
  assert.equal(response.body.error, "merchant-not-configured");
  assert.equal("report" in response.body, false);
  const database = new DatabaseSync(client.databasePath);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM orders").get().count, 0);
  database.close();
});

test("catalog selects canonical KRW prices for all ten products", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const ready = await client.request("/api/payments/status");
  assert.deepEqual(ready.body, { enabled: true, provider: "naver-pay", currency: "KRW", reason: "ready" });
  assert.equal(products.length, 10);
  for (const product of products) {
    const order = await ordered(client, purchase({ productId: product.id }));
    assert.equal(order.amount, product.priceKrw);
    assert.equal(order.currency, "KRW");
    assert.equal(fixture.created.at(-1).amount, product.priceKrw);
    assert.equal("name" in fixture.created.at(-1), false);
    assert.equal("input" in fixture.created.at(-1), false);
  }
});

test("unknown product, client price, impossible birthday and truthy boolean are rejected before PG call", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  for (const body of [
    purchase({ productId: "not-a-product" }), purchase({ amount: 1 }), purchase({ paid: true }),
    purchase({ input: { birthDate: "2000-02-30", calendar: "solar", unknownTime: true } }),
    purchase({ input: { birthDate: "2000-01-07", calendar: "solar", unknownTime: "true" } }),
    purchase({ name: "\n\u0000" }),
  ]) {
    const response = await client.request("/api/orders", { body });
    assert.equal(response.status, 400);
    assert.equal("report" in response.body, false);
  }
  assert.equal(fixture.created.length, 0);
});

test("pending payment ignores browser success flags and never returns a personal report", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  const response = await client.request(`/api/orders/${order.orderId}?paid=true&status=paid&amount=1`);
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "pending");
  assert.equal("report" in response.body, false);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("only a verified paid transaction unlocks the server-calculated chart and seven-day guide", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  fixture.transactions.get(order.orderId).status = "paid";
  const response = await client.request(`/api/orders/${order.orderId}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "paid");
  assert.equal(response.body.report.result.pillars.find((pillar) => pillar.key === "day").chinese, "甲子");
  assert.equal(response.body.report.guide.productId, "life");
  assert.equal(response.body.report.guide.plan.length, 7);
  assert.equal(response.body.report.guide.questions.length, 3);
  assert.equal(response.body.report.name, "검증 고객");
});

test("another session and no-cookie browser cannot read a paid order", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const owner = await client.start();
  const outsider = await client.start();
  const order = await ordered(owner);
  fixture.transactions.get(order.orderId).status = "paid";
  assert.equal((await client.request(`/api/orders/${order.orderId}`)).status, 404);
  await ordered(outsider, purchase({ productId: "study" }));
  assert.notEqual(owner.cookie, outsider.cookie);
  const response = await outsider.request(`/api/orders/${order.orderId}`);
  assert.equal(response.status, 404);
  assert.equal("report" in response.body, false);
});

test("session cookies are HttpOnly and SameSite=Lax", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const response = await client.request("/api/orders", { body: purchase() });
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/);
  assert.match(response.headers.get("set-cookie"), /Max-Age=2592000/);
});

test("cancelled, refunded and failed transactions cannot release paid content", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  for (const status of ["cancelled", "refunded", "failed"]) {
    const order = await ordered(client);
    fixture.transactions.get(order.orderId).status = status;
    const response = await client.request(`/api/orders/${order.orderId}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.status, status);
    assert.equal("report" in response.body, false);
  }
});

test("a later refund removes a previously approved report and cannot be resurrected by stale paid state", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  const transaction = fixture.transactions.get(order.orderId);
  transaction.status = "paid";
  assert.ok((await client.request(`/api/orders/${order.orderId}`)).body.report);
  transaction.status = "refunded";
  const refunded = await client.request(`/api/orders/${order.orderId}`);
  assert.equal(refunded.body.status, "refunded");
  assert.equal("report" in refunded.body, false);
  transaction.status = "paid";
  const stale = await client.request(`/api/orders/${order.orderId}`);
  assert.equal(stale.status, 502);
  assert.equal("report" in stale.body, false);
});

test("terminal payment states cannot be reset to pending to bypass the paid guard", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  for (const terminal of ["refunded", "cancelled", "failed"]) {
    const order = await ordered(client);
    const transaction = fixture.transactions.get(order.orderId);
    transaction.status = terminal;
    assert.equal((await client.request(`/api/orders/${order.orderId}`)).body.status, terminal);
    transaction.status = "pending";
    assert.equal((await client.request(`/api/orders/${order.orderId}`)).status, 502);
    transaction.status = "paid";
    const paid = await client.request(`/api/orders/${order.orderId}`);
    assert.equal(paid.status, 502);
    assert.equal("report" in paid.body, false);
  }
});

test("a delayed paid verification cannot overwrite a refund verified concurrently", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  const entered = [];
  fixture.gateway.verifyPayment = (request) => new Promise((resolveVerification) => {
    entered.push({ request, resolveVerification });
  });
  const stalePaidPromise = client.request(`/api/orders/${order.orderId}`);
  while (entered.length < 1) await new Promise((resolveTurn) => setImmediate(resolveTurn));
  const refundPromise = client.request(`/api/orders/${order.orderId}`);
  while (entered.length < 2) await new Promise((resolveTurn) => setImmediate(resolveTurn));
  entered[1].resolveVerification({ ...fixture.transactions.get(order.orderId), status: "refunded" });
  const refund = await refundPromise;
  assert.equal(refund.body.status, "refunded");
  entered[0].resolveVerification({ ...fixture.transactions.get(order.orderId), status: "paid" });
  const stale = await stalePaidPromise;
  assert.equal(stale.status, 502);
  assert.equal("report" in stale.body, false);
  const database = new DatabaseSync(client.databasePath);
  const stored = database.prepare("SELECT status, report_json FROM orders WHERE id = ?").get(order.orderId);
  assert.equal(stored.status, "refunded");
  assert.equal(stored.report_json, null);
  database.close();
});

test("wrong approved amount, currency, order ID or transaction ID never unlocks the report", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  for (const change of [{ amount: 1 }, { currency: "USD" }, { orderId: "another-order" }, { paymentId: "another-payment" }]) {
    const order = await ordered(client);
    Object.assign(fixture.transactions.get(order.orderId), { status: "paid", ...change });
    const response = await client.request(`/api/orders/${order.orderId}`);
    assert.equal(response.status, 502);
    assert.equal(response.body.error, "payment-verification-failed");
    assert.equal("report" in response.body, false);
  }
});

test("an unavailable verification service cannot serve even a previously approved cached report", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  fixture.transactions.get(order.orderId).status = "paid";
  assert.ok((await client.request(`/api/orders/${order.orderId}`)).body.report);
  fixture.gateway.verifyPayment = async () => { throw new Error("secret upstream response"); };
  const response = await client.request(`/api/orders/${order.orderId}`);
  assert.equal(response.status, 502);
  assert.equal("report" in response.body, false);
  assert.doesNotMatch(JSON.stringify(response.body), /secret/);
});

test("checkout requires an allowlisted HTTPS origin and rejects spoofed or credential-bearing URLs", async (t) => {
  for (const checkoutUrl of ["http://checkout.example.test/pay", "https://attacker.example/pay",
    "https://checkout.example.test.attacker.example/pay", "https://user:pass@checkout.example.test/pay"]) {
    const fixture = fixtureGateway({ createCheckout: async () => ({ paymentId: "tx", checkoutUrl }) });
    const client = await setup(t, fixture.gateway);
    const response = await client.request("/api/orders", { body: purchase() });
    assert.equal(response.status, 502);
    assert.equal(response.body.error, "checkout-unavailable");
    assert.equal("checkoutUrl" in response.body, false);
  }
});

test("a payment transaction ID cannot be reused for another order", async (t) => {
  const fixture = fixtureGateway({ createCheckout: async () => ({
    paymentId: "single-provider-transaction", checkoutUrl: "https://checkout.example.test/pay",
  }) });
  const client = await setup(t, fixture.gateway);
  await ordered(client);
  const second = await client.request("/api/orders", { body: purchase() });
  assert.equal(second.status, 502);
  const database = new DatabaseSync(client.databasePath);
  const counts = database.prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status").all();
  assert.ok(counts.some((row) => row.status === "pending" && row.count === 1));
  assert.ok(counts.some((row) => row.status === "failed" && row.count === 1));
  database.close();
});

test("SQLite retains session ownership and the approved report across server restart", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const order = await ordered(client);
  fixture.transactions.get(order.orderId).status = "paid";
  const before = await client.request(`/api/orders/${order.orderId}`);
  const cookie = client.cookie;
  await client.stop();
  const restarted = await client.start();
  restarted.cookie = cookie;
  const after = await restarted.request(`/api/orders/${order.orderId}`);
  assert.equal(after.status, 200);
  assert.deepEqual(after.body, before.body);
});

test("cross-site mutations, unsupported methods, non-JSON and oversized bodies are rejected", async (t) => {
  const fixture = fixtureGateway();
  const client = await setup(t, fixture.gateway);
  const origin = await client.request("/api/orders", { body: purchase(), headers: { Origin: "https://attacker.example" } });
  assert.equal(origin.status, 403);
  const method = await client.request("/api/orders", { method: "GET" });
  assert.equal(method.status, 405);
  const text = await client.request("/api/orders", { body: purchase(), headers: { "Content-Type": "text/plain" } });
  assert.equal(text.status, 415);
  const oversized = await client.request("/api/orders", { body: JSON.stringify(purchase({ name: "x".repeat(40_000) })) });
  assert.equal(oversized.status, 413);
  assert.equal(fixture.created.length, 0);
});

test("static server serves the build and prevents encoded traversal and outside symlinks", async (t) => {
  const client = await setup(t);
  assert.match((await client.request("/")).body, /test site/);
  const traversal = await client.request("/..%2forders.sqlite");
  assert.equal(traversal.status, 403);
  const outside = join(client.directory, "outside.txt");
  await writeFile(outside, "private fixture content");
  await symlink(outside, join(client.staticDir, "leak.txt"));
  const leaked = await client.request("/leak.txt");
  assert.equal(leaked.status, 403);
  assert.doesNotMatch(JSON.stringify(leaked.body), /private fixture content/);
  assert.ok((await readFile(client.databasePath)).length > 0);
});
