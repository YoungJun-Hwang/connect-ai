import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export class PaymentStateConflict extends Error {}

/** Local durable storage; production deployments need a persistent private disk. */
export class OrderStore {
  constructor(databasePath) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
    }
    this.database = new DatabaseSync(databasePath);
    if (databasePath !== ":memory:") chmodSync(databasePath, 0o600);
    this.database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS sessions (
        hash TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        session_hash TEXT NOT NULL REFERENCES sessions(hash),
        product_id TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        currency TEXT NOT NULL CHECK (currency = 'KRW'),
        name TEXT NOT NULL,
        input_json TEXT NOT NULL,
        payment_id TEXT UNIQUE,
        checkout_url TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded', 'failed')),
        report_json TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS orders_by_session ON orders(session_hash);
    `);
  }

  session(hash, now) {
    return this.database.prepare("SELECT hash FROM sessions WHERE hash = ? AND expires_at > ?").get(hash, now);
  }

  addSession(hash, expiresAt) {
    this.database.prepare("INSERT INTO sessions (hash, expires_at) VALUES (?, ?)").run(hash, expiresAt);
  }

  addOrder(order) {
    this.database.prepare(`
      INSERT INTO orders (id, session_hash, product_id, amount, currency, name, input_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(order.id, order.sessionHash, order.productId, order.amount, order.currency, order.name,
      JSON.stringify(order.input), order.createdAt, order.createdAt);
  }

  orderForSession(id, sessionHash) {
    return this.database.prepare("SELECT * FROM orders WHERE id = ? AND session_hash = ?").get(id, sessionHash);
  }

  attachCheckout(id, paymentId, checkoutUrl, now) {
    // UNIQUE(payment_id) rejects a transaction already assigned to another order.
    this.database.prepare("UPDATE orders SET payment_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?")
      .run(paymentId, checkoutUrl, now, id);
  }

  updateStatus(id, status, report, now) {
    this.database.prepare("UPDATE orders SET status = ?, report_json = ?, updated_at = ? WHERE id = ?")
      .run(status, report ? JSON.stringify(report) : null, now, id);
  }

  applyVerification(id, status, buildReport, now) {
    // Re-read after the asynchronous PG call. The transaction also serializes
    // writers sharing the same SQLite database, so an older paid response
    // cannot overwrite a refund or temporarily reset it to pending.
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const order = this.database.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      if (!order) throw new Error("Order no longer exists.");
      const terminal = ["refunded", "cancelled", "failed"];
      if (terminal.includes(order.status) && !terminal.includes(status)) {
        throw new PaymentStateConflict("A terminal payment cannot become payable again.");
      }
      const report = status === "paid"
        ? order.report_json && order.status === "paid"
          ? JSON.parse(order.report_json) : buildReport(order)
        : null;
      this.updateStatus(id, status, report, now);
      this.database.exec("COMMIT");
      return { order: { ...order, status }, report };
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  close() {
    this.database.close();
  }
}
