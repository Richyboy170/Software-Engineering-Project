import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { store } from "../src/store.js";

describe("Features F-02, F-03, F-05: Menu, Order Creation & Business Rules", () => {
  let customerToken: string;

  beforeEach(async () => {
    store.seedDefaultData();
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "customer@quickorder.local",
        password: "Password123!",
      });
    customerToken = loginRes.body.data.token;
  });

  describe("TEST-MENU-01 / AC-MENU-01: Menu Catalog", () => {
    it("returns active menu items with positive prices and stock levels", async () => {
      const res = await request(app).get("/api/menu");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const burger = res.body.data.find((i: { id: string }) => i.id === "menu_01");
      expect(burger).toBeDefined();
      expect(burger.name).toBe("Classic Cheeseburger");
      expect(burger.price).toBe(149);
      expect(burger.stock).toBe(20);
    });
  });

  describe("TEST-ORD-01 / AC-ORD-01: Order Placement & Atomic Stock Deduction", () => {
    it("places an order in PENDING status, calculates total, and decrements stock", async () => {
      const initialStock = store.getMenuItem("menu_01")!.stock;

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: "menu_01", quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("PENDING");
      // 149.00 * 2 = 298.00
      expect(res.body.data.totalPrice).toBe(298);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(2);

      // Verify stock in database was decremented
      const updatedStock = store.getMenuItem("menu_01")!.stock;
      expect(updatedStock).toBe(initialStock - 2);
    });
  });

  describe("TEST-ORD-02 / AC-ORD-02: BR-01 Minimum Order Content", () => {
    it("rejects order with empty items list", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_ITEMS");
    });

    it("rejects non-positive quantity (quantity <= 0)", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: "menu_01", quantity: 0 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_QUANTITY");
    });
  });

  describe("TEST-ORD-03 / AC-ORD-03: BR-02 Insufficient Stock Boundary", () => {
    it("rejects order when requested quantity exceeds available stock", async () => {
      // Truffle fries have stock = 2
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: "menu_03", quantity: 5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");

      // Verify stock was not changed
      expect(store.getMenuItem("menu_03")!.stock).toBe(2);
    });
  });

  describe("TEST-ORD-04 / AC-ORD-04: BR-03 Server-Authoritative Pricing", () => {
    it("ignores client-submitted prices and enforces database prices", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [
            {
              menuItemId: "menu_01",
              quantity: 2,
              price: 1.0, // Client attempts price tamper
              unitPrice: 1.0,
              totalPrice: 2.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      // Actual price is 149.00 * 2 = 298.00
      expect(res.body.data.totalPrice).toBe(298);
      expect(res.body.data.items[0].unitPrice).toBe(149);
    });
  });

  describe("TEST-ORD-05 / AC-ORD-05: BR-05 Order Cancellation & Stock Restoration", () => {
    it("allows cancellation when order is PENDING and restores item stock", async () => {
      // 1. Create order for 2 cheeseburgers (stock 20 -> 18)
      const createRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: "menu_01", quantity: 2 }],
        });
      const orderId = createRes.body.data.id;
      expect(store.getMenuItem("menu_01")!.stock).toBe(18);

      // 2. Cancel order
      const cancelRes = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe("CANCELLED");

      // 3. Stock restored to 20
      expect(store.getMenuItem("menu_01")!.stock).toBe(20);
    });
  });

  describe("TEST-ORD-06 / AC-ORD-06: Non-Pending Cancellation Rejection", () => {
    it("rejects cancellation once order transitions to PREPARING", async () => {
      // 1. Create order
      const createRes = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [{ menuItemId: "menu_01", quantity: 1 }],
        });
      const orderId = createRes.body.data.id;

      // 2. Advance to PREPARING
      store.updateOrderStatus(orderId, "PREPARING");

      // 3. Customer attempts cancellation
      const cancelRes = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.error.code).toBe("INVALID_TRANSITION");
      expect(store.getOrderById(orderId)!.status).toBe("PREPARING");
    });
  });
});
