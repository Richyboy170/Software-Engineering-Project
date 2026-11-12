import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Order, OrderStatus } from "../types";

export const KitchenQueue: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load kitchen queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<OrderStatus, { bg: string; color: string; label: string }> = {
      PENDING: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
      PREPARING: { bg: "#e0e7ff", color: "#4338ca", label: "In Prep" },
      READY: { bg: "#dcfce7", color: "#15803d", label: "Ready" },
      COMPLETED: { bg: "#f1f5f9", color: "#475569", label: "Completed" },
      CANCELLED: { bg: "#fee2e2", color: "#b91c1c", label: "Cancelled" },
    };
    const c = config[status] || { bg: "#f1f5f9", color: "#475569", label: status };
    return (
      <span style={{
        padding: "3px 8px",
        borderRadius: 20,
        fontSize: "0.75rem",
        fontWeight: 700,
        backgroundColor: c.bg,
        color: c.color,
        textTransform: "uppercase"
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
            Kitchen Dispatch Queue (Staff Dashboard)
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Operational lifecycle management (F-06 / BR-06)
          </p>
        </div>
        <button
          onClick={fetchOrders}
          style={{
            padding: "0.45rem 0.9rem",
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          🔄 Refresh Queue
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          padding: "0.75rem 1rem",
          borderRadius: 8,
          fontSize: "0.875rem",
          marginBottom: "1.5rem"
        }}>
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading kitchen tickets...
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: "3rem 1.5rem",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155" }}>
            Kitchen queue is clear!
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            No incoming customer orders at the moment.
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem"
        }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                borderLeft: order.status === "PENDING" ? "4px solid #f59e0b" :
                           order.status === "PREPARING" ? "4px solid #6366f1" :
                           order.status === "READY" ? "4px solid #22c55e" : "4px solid #94a3b8"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                      #{order.orderNumber}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 8,
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem"
                }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        <span style={{ color: "#ea580c" }}>{item.quantity}x</span> {item.name}
                      </span>
                      <span style={{ color: "#64748b" }}>฿{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: "0.35rem",
                    paddingTop: "0.35rem",
                    borderTop: "1px dashed #cbd5e1",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: "0.95rem"
                  }}>
                    <span>Total</span>
                    <span>฿{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                    disabled={updatingId === order.id}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    ▶ Start Preparing
                  </button>
                )}

                {order.status === "PREPARING" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "READY")}
                    disabled={updatingId === order.id}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    ✔ Mark Ready
                  </button>
                )}

                {order.status === "READY" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                    disabled={updatingId === order.id}
                    style={{
                      flex: 1,
                      padding: "0.55rem",
                      backgroundColor: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    ✨ Fulfill & Complete
                  </button>
                )}

                {order.status === "COMPLETED" && (
                  <div style={{ width: "100%", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                    Order fulfilled & delivered
                  </div>
                )}

                {order.status === "CANCELLED" && (
                  <div style={{ width: "100%", textAlign: "center", fontSize: "0.8rem", color: "#b91c1c" }}>
                    Order cancelled by customer
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
