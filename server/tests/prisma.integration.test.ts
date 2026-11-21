import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { InMemoryPersistenceAdapter } from "../src/persistence/in-memory.adapter.js";
import { PrismaPersistence } from "../src/persistence/prisma.adapter.js";
import { createRuntimePersistence } from "../src/persistence/runtime.js";

const databaseTests = describe.skipIf(!process.env.DATABASE_URL);

async function login(app: ReturnType<typeof createApp>, email: string) {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "Password123!" });
  expect(response.status).toBe(200);
  return response.body.data.token as string;
}

describe("persistence runtime selection", () => {
  it("uses the in-memory adapter for tests and Prisma for normal application runs", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "test";
      expect(createRuntimePersistence()).toBeInstanceOf(InMemoryPersistenceAdapter);

      process.env.NODE_ENV = "production";
      expect(createRuntimePersistence()).toBeInstanceOf(PrismaPersistence);
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }
  });
});

describe("Prisma persistence schema", () => {
  it("TEST-PERSIST-03 exposes an order-time menu item name snapshot", () => {
    const orderItem = Prisma.dmmf.datamodel.models.find((model) => model.name === "OrderItem");
    expect(orderItem?.fields.some((field) => field.name === "name")).toBe(true);
  });
});

databaseTests("Prisma PostgreSQL integration", () => {
  const prisma = new PrismaClient();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("TEST-PERSIST-02 loads the seeded users and menu fixtures after migration", async () => {
    const [customer, secondCustomer, staff, menuItems] = await Promise.all([
      prisma.user.findUnique({ where: { email: "customer@quickorder.local" } }),
      prisma.user.findUnique({ where: { email: "customer2@quickorder.local" } }),
      prisma.user.findUnique({ where: { email: "staff@quickorder.local" } }),
      prisma.menuItem.findMany({
        where: {
          name: {
            in: [
              "Classic Cheeseburger",
              "Crispy Chicken Burger",
              "Truffle Parmesan Fries",
              "Iced Caramel Macchiato",
              "Ceremonial Matcha Latte",
            ],
          },
        },
      }),
    ]);

    expect(customer?.role).toBe("CUSTOMER");
    expect(secondCustomer?.role).toBe("CUSTOMER");
    expect(staff?.role).toBe("STAFF");
    expect(menuItems).toHaveLength(5);
  });

  it("TEST-PERSIST-03 keeps the order-time item name and price after menu edits", async () => {
    const customer = await prisma.user.findUniqueOrThrow({
      where: { email: "customer@quickorder.local" },
    });
    const menuItem = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Classic Cheeseburger" },
    });
    const orderNumber = `QO-T-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const renamedItem = `Renamed ${menuItem.name}`;
    let orderId: string | undefined;

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          totalPrice: menuItem.price,
          items: {
            create: {
              menuItemId: menuItem.id,
              name: menuItem.name,
              quantity: 1,
              unitPrice: menuItem.price,
              subtotal: menuItem.price,
            },
          },
        },
        include: { items: true },
      });
      orderId = order.id;

      await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: { name: renamedItem, price: new Prisma.Decimal("0.01") },
      });

      const savedItem = await prisma.orderItem.findUniqueOrThrow({
        where: { id: order.items[0].id },
      });
      expect(savedItem.name).toBe(menuItem.name);
      expect(savedItem.unitPrice.toString()).toBe(menuItem.price.toString());
    } finally {
      await prisma.menuItem.update({
        where: { id: menuItem.id },
        data: { name: menuItem.name, price: menuItem.price },
      });
      if (orderId) {
        await prisma.order.delete({ where: { id: orderId } });
      }
    }
  });

  it("TEST-PERSIST-04 shares case-insensitive login sessions across Prisma apps and revokes them", async () => {
    const persistence = new PrismaPersistence(prisma);
    const firstApp = createApp(persistence);
    const secondApp = createApp(persistence);
    const login = await request(firstApp)
      .post("/api/auth/login")
      .send({ email: "CUSTOMER@QUICKORDER.LOCAL", password: "Password123!" });

    expect(login.status).toBe(200);

    const token = login.body.data.token as string;
    const me = await request(secondApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.id).toBe(login.body.data.user.id);

    const logout = await request(secondApp)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logout.status).toBe(200);

    const revoked = await request(firstApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(revoked.status).toBe(401);
    expect(revoked.body.error.code).toBe("INVALID_SESSION");

    const customer = await prisma.user.findUniqueOrThrow({
      where: { email: "customer@quickorder.local" },
    });
    const expiredSession = await persistence.createSession(customer.id);
    await prisma.session.update({
      where: { id: expiredSession.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const expired = await request(secondApp)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredSession.token}`);
    expect(expired.status).toBe(401);
  });

  it("TEST-PERSIST-05 reads numeric menu prices and derives availability from stock", async () => {
    const persistence = new PrismaPersistence(prisma);
    const app = createApp(persistence);
    const item = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Classic Cheeseburger" },
    });

    try {
      await prisma.menuItem.update({ where: { id: item.id }, data: { stock: 0 } });

      const response = await request(app).get("/api/menu");
      expect(response.status).toBe(200);
      const burger = response.body.data.find((entry: { id: string }) => entry.id === item.id);
      expect(typeof burger.price).toBe("number");
      expect(burger.price).toBe(item.price.toNumber());
      expect(burger.stock).toBe(0);
      expect(burger.isAvailable).toBe(false);
    } finally {
      await prisma.menuItem.update({ where: { id: item.id }, data: { stock: item.stock } });
    }
  });

  it("TEST-PERSIST-06 persists priced order snapshots and decrements stock once", async () => {
    const persistence = new PrismaPersistence(prisma);
    const firstApp = createApp(persistence);
    const secondApp = createApp(persistence);
    const token = await login(firstApp, "customer@quickorder.local");
    const menuItem = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Classic Cheeseburger" },
    });
    const originalStock = menuItem.stock;
    const testStock = Math.max(originalStock, 5);
    let orderId: string | undefined;

    try {
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: testStock } });
      const response = await request(firstApp)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ menuItemId: menuItem.id, quantity: 2 }] });

      expect(response.status).toBe(201);
      orderId = response.body.data.id;
      expect(typeof response.body.data.totalPrice).toBe("number");
      expect(response.body.data.totalPrice).toBe(menuItem.price.toNumber() * 2);
      expect(response.body.data.items[0].name).toBe(menuItem.name);
      expect(typeof response.body.data.items[0].unitPrice).toBe("number");
      expect(response.body.data.items[0].unitPrice).toBe(menuItem.price.toNumber());
      expect(typeof response.body.data.items[0].subtotal).toBe("number");
      expect(response.body.data.items[0].subtotal).toBe(menuItem.price.toNumber() * 2);

      const history = await request(secondApp)
        .get("/api/orders/my")
        .set("Authorization", `Bearer ${token}`);
      expect(history.status).toBe(200);
      expect(history.body.data.some((order: { id: string }) => order.id === orderId)).toBe(true);

      const persistedStock = await prisma.menuItem.findUniqueOrThrow({
        where: { id: menuItem.id },
      });
      expect(persistedStock.stock).toBe(testStock - 2);
    } finally {
      if (orderId) await prisma.order.delete({ where: { id: orderId } });
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: originalStock } });
    }
  });

  it("TEST-PERSIST-07 rejects insufficient and duplicate lines atomically and prevents races", async () => {
    const persistence = new PrismaPersistence(prisma);
    const app = createApp(persistence);
    const customerToken = await login(app, "customer@quickorder.local");
    const secondCustomerToken = await login(app, "customer2@quickorder.local");
    const menuItem = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Truffle Parmesan Fries" },
    });
    const originalStock = menuItem.stock;
    const createdOrderIds: string[] = [];

    try {
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: 3 } });
      const beforeRejectedOrders = await prisma.order.count();

      const insufficient = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ items: [{ menuItemId: menuItem.id, quantity: 4 }] });
      expect(insufficient.status).toBe(400);
      expect(insufficient.body.error.code).toBe("INSUFFICIENT_STOCK");

      const duplicateLines = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          items: [
            { menuItemId: menuItem.id, quantity: 2 },
            { menuItemId: menuItem.id, quantity: 2 },
          ],
        });
      expect(duplicateLines.status).toBe(400);
      expect(duplicateLines.body.error.code).toBe("INSUFFICIENT_STOCK");
      expect(
        (await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItem.id } })).stock
      ).toBe(3);
      expect(await prisma.order.count()).toBe(beforeRejectedOrders);

      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: 1 } });
      const beforeRaceOrders = await prisma.order.count();
      const race = await Promise.all([
        request(app)
          .post("/api/orders")
          .set("Authorization", `Bearer ${customerToken}`)
          .send({ items: [{ menuItemId: menuItem.id, quantity: 1 }] }),
        request(app)
          .post("/api/orders")
          .set("Authorization", `Bearer ${secondCustomerToken}`)
          .send({ items: [{ menuItemId: menuItem.id, quantity: 1 }] }),
      ]);
      const successes = race.filter((response) => response.status === 201);
      const failures = race.filter((response) => response.status !== 201);
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect(failures[0].body.error.code).toBe("INSUFFICIENT_STOCK");
      createdOrderIds.push(successes[0].body.data.id);
      expect(await prisma.order.count()).toBe(beforeRaceOrders + 1);
      expect(
        (await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItem.id } })).stock
      ).toBe(0);
    } finally {
      if (createdOrderIds.length) {
        await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
      }
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: originalStock } });
    }
  });

  it("TEST-PERSIST-08 enforces owner-only pending cancellation and staff progression", async () => {
    const persistence = new PrismaPersistence(prisma);
    const app = createApp(persistence);
    const customerToken = await login(app, "customer@quickorder.local");
    const secondCustomerToken = await login(app, "customer2@quickorder.local");
    const staffToken = await login(app, "staff@quickorder.local");
    const menuItem = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Classic Cheeseburger" },
    });
    const originalStock = menuItem.stock;
    const orderIds: string[] = [];

    try {
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: 8 } });

      const staff = await prisma.user.findUniqueOrThrow({
        where: { email: "staff@quickorder.local" },
      });
      const staffOwnedOrder = await prisma.order.create({
        data: {
          orderNumber: `TEST-${Date.now()}`,
          customerId: staff.id,
          totalPrice: menuItem.price,
          items: {
            create: {
              menuItemId: menuItem.id,
              name: menuItem.name,
              quantity: 1,
              unitPrice: menuItem.price,
              subtotal: menuItem.price,
            },
          },
        },
      });
      orderIds.push(staffOwnedOrder.id);

      const staffOwnedCancellation = await request(app)
        .post(`/api/orders/${staffOwnedOrder.id}/cancel`)
        .set("Authorization", `Bearer ${staffToken}`);
      expect(staffOwnedCancellation.status).toBe(403);
      expect(staffOwnedCancellation.body.error.code).toBe("FORBIDDEN");
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: staffOwnedOrder.id } })).status
      ).toBe("PENDING");
      expect(
        (await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItem.id } })).stock
      ).toBe(8);

      const created = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ items: [{ menuItemId: menuItem.id, quantity: 2 }] });
      expect(created.status).toBe(201);
      const cancelledOrderId = created.body.data.id as string;
      orderIds.push(cancelledOrderId);

      const crossCustomerRead = await request(app)
        .get(`/api/orders/${cancelledOrderId}`)
        .set("Authorization", `Bearer ${secondCustomerToken}`);
      expect(crossCustomerRead.status).toBe(403);

      const crossCustomerCancel = await request(app)
        .post(`/api/orders/${cancelledOrderId}/cancel`)
        .set("Authorization", `Bearer ${secondCustomerToken}`);
      expect(crossCustomerCancel.status).toBe(403);
      expect(
        (await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItem.id } })).stock
      ).toBe(6);

      const cancellation = await request(app)
        .post(`/api/orders/${cancelledOrderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(cancellation.status).toBe(200);
      expect(cancellation.body.data.status).toBe("CANCELLED");

      const repeatedCancellation = await request(app)
        .post(`/api/orders/${cancelledOrderId}/cancel`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(repeatedCancellation.status).toBe(400);
      expect(repeatedCancellation.body.error.code).toBe("INVALID_TRANSITION");
      expect(
        (await prisma.menuItem.findUniqueOrThrow({ where: { id: menuItem.id } })).stock
      ).toBe(8);

      const pending = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ items: [{ menuItemId: menuItem.id, quantity: 1 }] });
      expect(pending.status).toBe(201);
      const pendingOrderId = pending.body.data.id as string;
      orderIds.push(pendingOrderId);

      const customerStatus = await request(app)
        .patch(`/api/orders/${pendingOrderId}/status`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ status: "PREPARING" });
      expect(customerStatus.status).toBe(403);

      const staffCancellation = await request(app)
        .patch(`/api/orders/${pendingOrderId}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: "CANCELLED" });
      expect(staffCancellation.status).toBe(400);
      expect(staffCancellation.body.error.code).toBe("INVALID_TRANSITION");

      for (const status of ["PREPARING", "READY", "COMPLETED"] as const) {
        const advanced = await request(app)
          .patch(`/api/orders/${pendingOrderId}/status`)
          .set("Authorization", `Bearer ${staffToken}`)
          .send({ status });
        expect(advanced.status).toBe(200);
        expect(advanced.body.data.status).toBe(status);
      }

      const queue = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${staffToken}`);
      expect(queue.status).toBe(200);
      expect(queue.body.data.some((order: { id: string }) => order.id === pendingOrderId)).toBe(true);
    } finally {
      if (orderIds.length) {
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await prisma.menuItem.update({ where: { id: menuItem.id }, data: { stock: originalStock } });
    }
  });
});
