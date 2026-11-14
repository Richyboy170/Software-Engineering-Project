import type {
  MenuItem,
  Order,
  OrderStatus,
  Session,
  User,
} from "../store.js";

export type OrderLineInput = { menuItemId: string; quantity: number };

export type CreateOrderResult =
  | { success: true; order: Order }
  | { success: false; code: string; message: string };

export type CancelOrderResult =
  | { success: true; order: Order }
  | { success: false; code: string; message: string; statusHttp: number };

export type UpdateOrderStatusResult =
  | { success: true; order: Order }
  | { success: false; code: string; message: string };

export interface QuickOrderPersistence {
  findUserByEmail(email: string): Promise<User | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  createSession(userId: string): Promise<Session>;
  getSession(token: string): Promise<{ session: Session; user: User } | undefined>;
  deleteSession(token: string): Promise<boolean>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createOrder(customerId: string, items: OrderLineInput[]): Promise<CreateOrderResult>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  cancelOrder(orderId: string, customerId: string): Promise<CancelOrderResult>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<UpdateOrderStatusResult>;
  checkReady(): Promise<void>;
}
