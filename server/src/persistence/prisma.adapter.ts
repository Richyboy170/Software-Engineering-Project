import { randomBytes } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  MenuItem as DbMenuItem,
  Session as DbSession,
  User as DbUser,
} from "@prisma/client";
import type {
  CancelOrderResult,
  CreateOrderResult,
  QuickOrderPersistence,
  UpdateOrderStatusResult,
} from "./contracts.js";
import type {
  MenuItem,
  OrderStatus,
  Session,
  User,
} from "../store.js";

const sessionLifetimeMs = 24 * 60 * 60 * 1000;
type DbOrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

class InsufficientStockError extends Error {
  constructor(
    readonly itemName: string,
    readonly quantity: number,
    readonly availableStock: number
  ) {
    super(`Requested quantity for '${itemName}' (${quantity}) exceeds available stock (${availableStock}).`);
  }
}

function mapUser(user: DbUser): User {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapSession(session: DbSession): Session {
  return {
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}

function mapMenuItem(item: DbMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price.toNumber(),
    stock: item.stock,
    isAvailable: item.stock > 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapOrder(order: DbOrderWithItems) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    status: order.status,
    totalPrice: order.totalPrice.toNumber(),
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      subtotal: item.subtotal.toNumber(),
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export class PrismaPersistence implements QuickOrderPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    return user ? mapUser(user) : undefined;
  }

  async findUserById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : undefined;
  }

  async createSession(userId: string): Promise<Session> {
    const session = await this.prisma.session.create({
      data: {
        token: randomBytes(32).toString("hex"),
        userId,
        expiresAt: new Date(Date.now() + sessionLifetimeMs),
      },
    });
    return mapSession(session);
  }

  async getSession(token: string): Promise<{ session: Session; user: User } | undefined> {
    const session = await this.prisma.session.findFirst({
      where: { token, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    if (!session) return undefined;
    return { session: mapSession(session), user: mapUser(session.user) };
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await this.prisma.session.deleteMany({ where: { token } });
    return result.count > 0;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    const items = await this.prisma.menuItem.findMany({ orderBy: { createdAt: "asc" } });
    return items.map(mapMenuItem);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    return item ? mapMenuItem(item) : undefined;
  }

  async createOrder(
    customerId: string,
    items: { menuItemId: string; quantity: number }[]
  ): Promise<CreateOrderResult> {
    if (!items || items.length === 0) {
      return { success: false, code: "INVALID_ITEMS", message: "Order must contain at least one item." };
    }

    const quantities = new Map<string, number>();
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return {
          success: false,
          code: "INVALID_QUANTITY",
          message: "Item quantity must be an integer greater than 0.",
        };
      }
      quantities.set(item.menuItemId, (quantities.get(item.menuItemId) ?? 0) + item.quantity);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const menuItems = await tx.menuItem.findMany({
          where: { id: { in: [...quantities.keys()] } },
        });
        const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

        for (const menuItemId of quantities.keys()) {
          if (!menuItemsById.has(menuItemId)) {
            return {
              success: false as const,
              code: "ITEM_NOT_FOUND",
              message: `Menu item '${menuItemId}' does not exist.`,
            };
          }
        }

        for (const [menuItemId, quantity] of quantities) {
          const menuItem = menuItemsById.get(menuItemId)!;
          if (menuItem.stock < quantity) {
            return {
              success: false as const,
              code: "INSUFFICIENT_STOCK",
              message: new InsufficientStockError(menuItem.name, quantity, menuItem.stock).message,
            };
          }
        }

        for (const [menuItemId, quantity] of quantities) {
          const reservation = await tx.menuItem.updateMany({
            where: { id: menuItemId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (reservation.count !== 1) {
            const menuItem = menuItemsById.get(menuItemId)!;
            throw new InsufficientStockError(menuItem.name, quantity, menuItem.stock);
          }
        }

        let totalPrice = new Prisma.Decimal(0);
        const orderItems = items.map((item) => {
          const menuItem = menuItemsById.get(item.menuItemId)!;
          const subtotal = menuItem.price.mul(item.quantity);
          totalPrice = totalPrice.add(subtotal);
          return {
            menuItemId: menuItem.id,
            name: menuItem.name,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            subtotal,
          };
        });

        const order = await tx.order.create({
          data: {
            orderNumber: `QO-${randomBytes(12).toString("hex").toUpperCase()}`,
            customerId,
            totalPrice,
            items: { create: orderItems },
          },
          include: { items: true },
        });

        return { success: true as const, order: mapOrder(order) };
      });
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        return { success: false, code: "INSUFFICIENT_STOCK", message: error.message };
      }
      throw error;
    }
  }

  async getOrdersByCustomer(_customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId: _customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async getOrderById(_id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: _id },
      include: { items: true },
    });
    return order ? mapOrder(order) : undefined;
  }

  async cancelOrder(orderId: string, customerId: string): Promise<CancelOrderResult> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) {
        return { success: false as const, code: "NOT_FOUND", message: "Order not found.", statusHttp: 404 };
      }
      if (order.customerId !== customerId) {
        return { success: false as const, code: "FORBIDDEN", message: "Access denied.", statusHttp: 403 };
      }
      if (order.status !== "PENDING") {
        return {
          success: false as const,
          code: "INVALID_TRANSITION",
          message: `Order in '${order.status}' status cannot be cancelled. Only PENDING orders can be cancelled.`,
          statusHttp: 400,
        };
      }

      const changed = await tx.order.updateMany({
        where: { id: orderId, customerId, status: "PENDING" },
        data: { status: "CANCELLED", updatedAt: new Date() },
      });
      if (changed.count !== 1) {
        const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
        if (!current) {
          return { success: false as const, code: "NOT_FOUND", message: "Order not found.", statusHttp: 404 };
        }
        return {
          success: false as const,
          code: "INVALID_TRANSITION",
          message: `Order in '${current.status}' status cannot be cancelled. Only PENDING orders can be cancelled.`,
          statusHttp: 400,
        };
      }

      const restored = new Map<string, number>();
      for (const item of order.items) {
        restored.set(item.menuItemId, (restored.get(item.menuItemId) ?? 0) + item.quantity);
      }
      for (const [menuItemId, quantity] of restored) {
        await tx.menuItem.update({
          where: { id: menuItemId },
          data: { stock: { increment: quantity }, isAvailable: true },
        });
      }

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
      });
      return { success: true as const, order: mapOrder(updatedOrder) };
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<UpdateOrderStatusResult> {
    const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
      PENDING: "PREPARING",
      PREPARING: "READY",
      READY: "COMPLETED",
    };

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return { success: false as const, code: "NOT_FOUND", message: "Order not found." };
      }
      if (nextStatus[order.status] !== status) {
        return {
          success: false as const,
          code: "INVALID_TRANSITION",
          message: `Cannot transition order status from '${order.status}' to '${status}'.`,
        };
      }

      const changed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status, updatedAt: new Date() },
      });
      if (changed.count !== 1) {
        const current = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
        if (!current) {
          return { success: false as const, code: "NOT_FOUND", message: "Order not found." };
        }
        return {
          success: false as const,
          code: "INVALID_TRANSITION",
          message: `Cannot transition order status from '${current.status}' to '${status}'.`,
        };
      }

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true },
      });
      return { success: true as const, order: mapOrder(updatedOrder) };
    });
  }

  async checkReady(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
