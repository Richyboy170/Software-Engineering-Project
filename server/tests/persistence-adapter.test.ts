import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { InMemoryPersistenceAdapter } from "../src/persistence/in-memory.adapter.js";
import { store } from "../src/store.js";

class UnavailablePersistenceAdapter extends InMemoryPersistenceAdapter {
  async checkReady(): Promise<void> {
    throw new Error("Database is unavailable");
  }
}

describe("in-memory persistence adapter", () => {
  beforeEach(() => {
    store.seedDefaultData();
  });

  it("TEST-PERSIST-01 shares a login session between app instances using the same adapter", async () => {
    const persistence = new InMemoryPersistenceAdapter(store);
    const firstApp = createApp(persistence);
    const secondApp = createApp(persistence);

    const login = await request(firstApp)
      .post("/api/auth/login")
      .send({ email: "customer@quickorder.local", password: "Password123!" });

    expect(login.status).toBe(200);

    const me = await request(secondApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe("usr_cust_1");
    expect(me.body.data.email).toBe("customer@quickorder.local");
  });

  it("TEST-PERSIST-07 does not oversell when duplicate cart lines exceed available stock", async () => {
    const app = createApp(new InMemoryPersistenceAdapter(store));
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@quickorder.local", password: "Password123!" });

    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .send({
        items: [
          { menuItemId: "menu_03", quantity: 2 },
          { menuItemId: "menu_03", quantity: 1 },
        ],
      });

    expect(order.status).toBe(400);
    expect(order.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(store.getMenuItem("menu_03")?.stock).toBe(2);
  });

  it("TEST-PERSIST-08 does not allow staff to cancel through the status endpoint", async () => {
    const app = createApp(new InMemoryPersistenceAdapter(store));
    const [customerLogin, staffLogin] = await Promise.all([
      request(app)
        .post("/api/auth/login")
        .send({ email: "customer@quickorder.local", password: "Password123!" }),
      request(app)
        .post("/api/auth/login")
        .send({ email: "staff@quickorder.local", password: "Password123!" }),
    ]);

    const order = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerLogin.body.data.token}`)
      .send({ items: [{ menuItemId: "menu_01", quantity: 1 }] });

    const status = await request(app)
      .patch(`/api/orders/${order.body.data.id}/status`)
      .set("Authorization", `Bearer ${staffLogin.body.data.token}`)
      .send({ status: "CANCELLED" });

    expect(status.status).toBe(400);
    expect(status.body.error.code).toBe("INVALID_TRANSITION");
    expect(store.getOrderById(order.body.data.id)?.status).toBe("PENDING");
  });

  it("TEST-PERSIST-09 ties readiness to the selected adapter and keeps health as liveness", async () => {
    const unavailableApp = createApp(new UnavailablePersistenceAdapter(store));
    const unavailable = await request(unavailableApp).get("/api/ready");
    expect(unavailable.status).toBe(503);
    expect(unavailable.body).toEqual({ status: "not_ready", db: "disconnected" });

    const health = await request(unavailableApp).get("/api/health");
    expect(health.status).toBe(200);

    const availableApp = createApp(new InMemoryPersistenceAdapter(store));
    const available = await request(availableApp).get("/api/ready");
    expect(available.status).toBe(200);
  });
});
