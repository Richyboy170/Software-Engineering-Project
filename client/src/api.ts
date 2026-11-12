import { User, MenuItem, Order, OrderStatus } from "./types";

const API_BASE = "";

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("quickorder_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Login failed");
    }
    return json.data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Unauthorized");
    }
    return json.data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: getHeaders(),
      });
    } finally {
      localStorage.removeItem("quickorder_token");
      localStorage.removeItem("quickorder_user");
    }
  },

  async getMenu(): Promise<MenuItem[]> {
    const res = await fetch(`${API_BASE}/api/menu`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to load menu");
    }
    return json.data;
  },

  async placeOrder(items: { menuItemId: string; quantity: number }[]): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ items }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to place order");
    }
    return json.data;
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/api/orders/my`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to load orders");
    }
    return json.data;
  },

  async getAllOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to load queue");
    }
    return json.data;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
      method: "POST",
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to cancel order");
    }
    return json.data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Failed to update status");
    }
    return json.data;
  },
};
