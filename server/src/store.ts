import bcrypt from "bcryptjs";
import crypto from "crypto";

export type UserRole = "CUSTOMER" | "STAFF";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryStore {
  public users: Map<string, User> = new Map();
  public sessions: Map<string, Session> = new Map();
  public menuItems: Map<string, MenuItem> = new Map();
  public orders: Map<string, Order> = new Map();
  private orderCounter = 100;

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData() {
    this.users.clear();
    this.sessions.clear();
    this.menuItems.clear();
    this.orders.clear();
    this.orderCounter = 100;

    const salt = bcrypt.genSaltSync(10);
    const defaultHash = bcrypt.hashSync("Password123!", salt);

    // Seed Users
    const customer1: User = {
      id: "usr_cust_1",
      email: "customer@quickorder.local",
      fullName: "Patiharn Liangkobkit",
      passwordHash: defaultHash,
      role: "CUSTOMER",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const customer2: User = {
      id: "usr_cust_2",
      email: "customer2@quickorder.local",
      fullName: "Customer Two",
      passwordHash: defaultHash,
      role: "CUSTOMER",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const staff1: User = {
      id: "usr_staff_1",
      email: "staff@quickorder.local",
      fullName: "Tanakrit Sunthonwetchapong",
      passwordHash: defaultHash,
      role: "STAFF",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(customer1.id, customer1);
    this.users.set(customer2.id, customer2);
    this.users.set(staff1.id, staff1);

    // Seed Menu Items
    const items: MenuItem[] = [
      {
        id: "menu_01",
        name: "Classic Cheeseburger",
        description: "Grilled beef patty with melted cheddar, crisp lettuce, and special sauce",
        category: "Mains",
        price: 149.0,
        stock: 20,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "menu_02",
        name: "Crispy Chicken Burger",
        description: "Golden fried chicken breast with spicy garlic mayo and pickled cabbage",
        category: "Mains",
        price: 139.0,
        stock: 15,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "menu_03",
        name: "Truffle Parmesan Fries",
        description: "Hand-cut potato fries drizzled with aromatic truffle oil and aged parmesan",
        category: "Sides",
        price: 89.0,
        stock: 2, // low stock for boundary test
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "menu_04",
        name: "Iced Caramel Macchiato",
        description: "Freshly pulled espresso with velvety milk and rich salted caramel syrup",
        category: "Beverages",
        price: 75.0,
        stock: 30,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "menu_05",
        name: "Ceremonial Matcha Latte",
        description: "Japanese Uji matcha whisked with fresh milk and mild cane syrup",
        category: "Beverages",
        price: 70.0,
        stock: 0, // out of stock
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const item of items) {
      this.menuItems.set(item.id, item);
    }
  }

  // Auth Operations
  public findUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public createSession(userId: string): Session {
    const token = crypto.randomBytes(32).toString("hex");
    const session: Session = {
      id: "sess_" + crypto.randomUUID().slice(0, 8),
      token,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.sessions.set(token, session);
    return session;
  }

  public getSession(token: string): { session: Session; user: User } | undefined {
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }
    const user = this.users.get(session.userId);
    if (!user) return undefined;
    return { session, user };
  }

  public deleteSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  // Menu Operations
  public getMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values()).map((item) => ({
      ...item,
      isAvailable: item.stock > 0,
    }));
  }

  public getMenuItem(id: string): MenuItem | undefined {
    return this.menuItems.get(id);
  }

  // Order Operations
  public createOrder(
    customerId: string,
    rawItems: { menuItemId: string; quantity: number }[]
  ): { success: true; order: Order } | { success: false; code: string; message: string } {
    // BR-01: Order must contain at least 1 line item with positive quantity
    if (!rawItems || rawItems.length === 0) {
      return {
        success: false,
        code: "INVALID_ITEMS",
        message: "Order must contain at least one item.",
      };
    }

    for (const item of rawItems) {
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return {
          success: false,
          code: "INVALID_QUANTITY",
          message: "Item quantity must be an integer greater than 0.",
        };
      }
    }

    // BR-02: Check stock availability inside atomic check
    for (const item of rawItems) {
      const menuItem = this.menuItems.get(item.menuItemId);
      if (!menuItem) {
        return {
          success: false,
          code: "ITEM_NOT_FOUND",
          message: `Menu item '${item.menuItemId}' does not exist.`,
        };
      }
      if (menuItem.stock < item.quantity) {
        return {
          success: false,
          code: "INSUFFICIENT_STOCK",
          message: `Requested quantity for '${menuItem.name}' (${item.quantity}) exceeds available stock (${menuItem.stock}).`,
        };
      }
    }

    // Atomic deduction and order item creation
    this.orderCounter++;
    const orderId = "ord_" + this.orderCounter;
    const orderNumber = "QO-" + this.orderCounter;
    const orderItems: OrderItem[] = [];
    let totalPrice = 0;

    for (const item of rawItems) {
      const menuItem = this.menuItems.get(item.menuItemId)!;
      menuItem.stock -= item.quantity;
      menuItem.isAvailable = menuItem.stock > 0;
      menuItem.updatedAt = new Date();

      // BR-03: Server-authoritative price calculation
      const unitPrice = menuItem.price;
      const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
      totalPrice += subtotal;

      orderItems.push({
        id: "item_" + crypto.randomUUID().slice(0, 8),
        orderId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    const order: Order = {
      id: orderId,
      orderNumber,
      customerId,
      status: "PENDING",
      totalPrice: Math.round(totalPrice * 100) / 100,
      items: orderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(orderId, order);
    return { success: true, order };
  }

  public getOrdersByCustomer(customerId: string): Order[] {
    const list: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.customerId === customerId) {
        list.push(order);
      }
    }
    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  // BR-05: Cancellation allowed only when PENDING
  public cancelOrder(
    orderId: string,
    customerId: string
  ): { success: true; order: Order } | { success: false; code: string; message: string; statusHttp: number } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, code: "NOT_FOUND", message: "Order not found.", statusHttp: 404 };
    }

    // BR-04: Ownership Isolation
    if (order.customerId !== customerId) {
      return { success: false, code: "FORBIDDEN", message: "Access denied.", statusHttp: 403 };
    }

    if (order.status !== "PENDING") {
      return {
        success: false,
        code: "INVALID_TRANSITION",
        message: `Order in '${order.status}' status cannot be cancelled. Only PENDING orders can be cancelled.`,
        statusHttp: 400,
      };
    }

    // Restore stock
    for (const item of order.items) {
      const menuItem = this.menuItems.get(item.menuItemId);
      if (menuItem) {
        menuItem.stock += item.quantity;
        menuItem.isAvailable = menuItem.stock > 0;
      }
    }

    order.status = "CANCELLED";
    order.updatedAt = new Date();
    return { success: true, order };
  }

  // BR-06: Status progression by Staff
  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus
  ): { success: true; order: Order } | { success: false; code: string; message: string } {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, code: "NOT_FOUND", message: "Order not found." };
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        code: "INVALID_TRANSITION",
        message: `Cannot transition order status from '${order.status}' to '${newStatus}'.`,
      };
    }

    order.status = newStatus;
    order.updatedAt = new Date();
    return { success: true, order };
  }
}

export const store = new InMemoryStore();
