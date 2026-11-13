import { store as defaultStore } from "../store.js";
export class InMemoryPersistenceAdapter {
    store;
    constructor(store = defaultStore) {
        this.store = store;
    }
    async findUserByEmail(email) {
        return this.store.findUserByEmail(email);
    }
    async findUserById(id) {
        return this.store.findUserById(id);
    }
    async createSession(userId) {
        return this.store.createSession(userId);
    }
    async getSession(token) {
        return this.store.getSession(token);
    }
    async deleteSession(token) {
        return this.store.deleteSession(token);
    }
    async getMenuItems() {
        return this.store.getMenuItems();
    }
    async getMenuItem(id) {
        return this.store.getMenuItem(id);
    }
    async createOrder(customerId, items) {
        const requestedQuantity = new Map();
        for (const item of items) {
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                return this.store.createOrder(customerId, items);
            }
            requestedQuantity.set(item.menuItemId, (requestedQuantity.get(item.menuItemId) ?? 0) + item.quantity);
        }
        for (const [menuItemId, quantity] of requestedQuantity) {
            const menuItem = this.store.getMenuItem(menuItemId);
            if (!menuItem) {
                return this.store.createOrder(customerId, items);
            }
            if (menuItem.stock < quantity) {
                return {
                    success: false,
                    code: "INSUFFICIENT_STOCK",
                    message: `Requested quantity for '${menuItem.name}' (${quantity}) exceeds available stock (${menuItem.stock}).`,
                };
            }
        }
        return this.store.createOrder(customerId, items);
    }
    async getOrdersByCustomer(customerId) {
        return this.store.getOrdersByCustomer(customerId);
    }
    async getAllOrders() {
        return this.store.getAllOrders();
    }
    async getOrderById(id) {
        return this.store.getOrderById(id);
    }
    async cancelOrder(orderId, customerId) {
        return this.store.cancelOrder(orderId, customerId);
    }
    async updateOrderStatus(orderId, status) {
        if (status === "CANCELLED") {
            const order = this.store.getOrderById(orderId);
            if (!order) {
                return { success: false, code: "NOT_FOUND", message: "Order not found." };
            }
            return {
                success: false,
                code: "INVALID_TRANSITION",
                message: `Cannot transition order status from '${order.status}' to 'CANCELLED'.`,
            };
        }
        return this.store.updateOrderStatus(orderId, status);
    }
    async checkReady() { }
}
