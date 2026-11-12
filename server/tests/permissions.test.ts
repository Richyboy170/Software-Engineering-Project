import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { store } from "../src/store.js";

describe("Features F-04, F-06: Role Permissions & Access Isolation", () => {
  let customer1Token: string;
  let customer2Token: string;
  let staffToken: string;

  beforeEach(async () => {
    store.seedDefaultData();

    // Customer 1
    const c1Res = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@quickorder.local", password: "Password123!" });
    customer1Token = c1Res.body.data.token;

    // Customer 2
    const c2Res = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer2@quickorder.local", password: "Password123!" });
    customer2Token = c2Res.body.data.token;

    // Staff
    const sRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "staff@quickorder.local", password: "Password123!" });
    staffToken = sRes.body.data.token;
  });

  describe("TEST-SEC-01 / AC-SEC-01: BR-04 Customer Data Isolation", () => {
    it("rejects Customer 2 when attempting to view Customer 1's order with 403 Forbidden", async () => {
      // 1. Customer 1 places an order
      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ items: [{ menuItemId: "menu_01", quantity: 1 }] });
      const orderId = orderRes.body.data.id;

      // 2. Customer 1 can view own order
      const ownRes = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${customer1Token}`);
      expect(ownRes.status).toBe(200);

      // 3. Customer 2 attempts to view Customer 1's order -> 403 Forbidden
      const unauthorizedRes = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${customer2Token}`);

      expect(unauthorizedRes.status).toBe(403);
      expect(unauthorizedRes.body.success).toBe(false);
      expect(unauthorizedRes.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("TEST-SEC-02 / AC-SEC-02: BR-06 & NFR-02 Customer Forbidden on Staff Endpoints", () => {
    it("rejects Customer attempting to view all kitchen queue orders with 403", async () => {
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${customer1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects Customer attempting to update order status with 403", async () => {
      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ items: [{ menuItemId: "menu_01", quantity: 1 }] });
      const orderId = orderRes.body.data.id;

      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ status: "PREPARING" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("TEST-SEC-03 / AC-SEC-03: NFR-01 Unauthenticated Protection", () => {
    it("rejects unauthenticated requests to protected endpoints with 401", async () => {
      const res = await request(app).post("/api/orders").send({ items: [] });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("TEST-STAFF-01 & TEST-STAFF-02 / AC-STAFF-01 & AC-STAFF-03: Staff Operations", () => {
    it("allows Staff to view all orders and advance status", async () => {
      // 1. Customer creates order
      const orderRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customer1Token}`)
        .send({ items: [{ menuItemId: "menu_01", quantity: 1 }] });
      const orderId = orderRes.body.data.id;

      // 2. Staff views global queue
      const queueRes = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(queueRes.status).toBe(200);
      expect(queueRes.body.data.length).toBeGreaterThan(0);

      // 3. Staff advances status to PREPARING
      const prepRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "PREPARING" });
      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.status).toBe("PREPARING");

      // 4. Staff advances status to READY
      const readyRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "READY" });
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.status).toBe("READY");

      // 5. Staff advances status to COMPLETED
      const completeRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "COMPLETED" });
      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.status).toBe("COMPLETED");
    });
  });
});
