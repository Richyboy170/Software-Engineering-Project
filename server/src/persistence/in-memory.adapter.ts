import type { QuickOrderPersistence } from "./contracts.js";
import type { OrderStatus } from "../store.js";
import { store as defaultStore } from "../store.js";

export class InMemoryPersistenceAdapter implements QuickOrderPersistence {
  constructor(private readonly store: typeof defaultStore = defaultStore) {}

  async findUserByEmail(email: string) {
    return this.store.findUserByEmail(email);
  }

  async findUserById(id: string) {
    return this.store.findUserById(id);
  }

  async createSession(userId: string) {
    return this.store.createSession(userId);
  }

  async getSession(token: string) {
    return this.store.getSession(token);
  }

  async deleteSession(token: string) {
    return this.store.deleteSession(token);
  }

  async getMenuItems() {
    return this.store.getMenuItems();
  }

  async getMenuItem(id: string) {
    return this.store.getMenuItem(id);
  }

  async createOrder(customerId: string, items: { menuItemId: string; quantity: number }[]) {
    const requestedQuantity = new Map<string, number>();
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return this.store.createOrder(customerId, items);
      }
      requestedQuantity.set(
        item.menuItemId,
        (requestedQuantity.get(item.menuItemId) ?? 0) + item.quantity
      );
    }

    for (const [menuItemId, quantity] of requestedQuantity) {
      const menuItem = this.store.getMenuItem(menuItemId);
      if (!menuItem) {
        return this.store.createOrder(customerId, items);
      }
      if (menuItem.stock < quantity) {
        return {
          success: false as const,
          code: "INSUFFICIENT_STOCK",
          message: `Requested quantity for '${menuItem.name}' (${quantity}) exceeds available stock (${menuItem.stock}).`,
        };
      }
    }

    return this.store.createOrder(customerId, items);
  }

  async getOrdersByCustomer(customerId: string) {
    return this.store.getOrdersByCustomer(customerId);
  }

  async getAllOrders() {
    return this.store.getAllOrders();
  }

  async getOrderById(id: string) {
    return this.store.getOrderById(id);
  }

  async cancelOrder(orderId: string, customerId: string) {
    return this.store.cancelOrder(orderId, customerId);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    if (status === "CANCELLED") {
      const order = this.store.getOrderById(orderId);
      if (!order) {
        return { success: false as const, code: "NOT_FOUND", message: "Order not found." };
      }
      return {
        success: false as const,
        code: "INVALID_TRANSITION",
        message: `Cannot transition order status from '${order.status}' to 'CANCELLED'.`,
      };
    }
    return this.store.updateOrderStatus(orderId, status);
  }

  async checkReady() {}
}
