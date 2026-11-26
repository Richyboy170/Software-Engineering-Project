import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Order } from "../types";

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [receipt, setReceipt] = useState<{
    pickupCode: string;
    orderNumber: string;
    status: Order["status"];
    totalPrice: number;
    items: Order["items"];
    createdAt: string;
  } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to load orders", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReceipt = async (orderId: string) => {
    try {
      const data = await api.getReceipt(orderId);
      setReceipt(data);
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to load receipt", isError: true });
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    setActionMessage(null);
    try {
      await api.cancelOrder(orderId);
      setActionMessage({ text: `Order #${orderId} was cancelled successfully. Stock has been restored.`, isError: false });
      await fetchOrders();
    } catch (err: any) {
      setActionMessage({ text: err.message || "Failed to cancel order", isError: true });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const config: Record<Order["status"], { bg: string; color: string; label: string }> = {
      PENDING: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
      PREPARING: { bg: "#e0e7ff", color: "#4338ca", label: "In Kitchen" },
      READY: { bg: "#dcfce7", color: "#15803d", label: "Ready for Pickup" },
      COMPLETED: { bg: "#f1f5f9", color: "#475569", label: "Completed" },
      CANCELLED: { bg: "#fee2e2", color: "#b91c1c", label: "Cancelled" },
    };
    const c = config[status] || { bg: "#f1f5f9", color: "#475569", label: status };
    return (
      <span style={{
        padding: "3px 10px",
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
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>My Order History</h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Track active orders and review past receipts</p>
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
          🔄 Refresh
        </button>
      </div>

      {actionMessage && (
        <div style={{
          backgroundColor: actionMessage.isError ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${actionMessage.isError ? "#fecaca" : "#bbf7d0"}`,
          color: actionMessage.isError ? "#b91c1c" : "#15803d",
          padding: "0.75rem 1rem",
          borderRadius: 8,
          fontSize: "0.875rem",
          marginBottom: "1.5rem"
        }}>
          {actionMessage.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading your orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: "3rem 1.5rem",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#334155" }}>No orders placed yet</h3>
          <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Explore our menu and place your first delicious meal!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                padding: "1.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #f1f5f9"
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
                    Order #{order.orderNumber}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem", marginLeft: "0.75rem" }}>
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Items List */}
              <div style={{ padding: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {order.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ color: "#334155" }}>
                      <strong style={{ color: "#0f172a" }}>{item.quantity}x</strong> {item.name}
                    </span>
                    <span style={{ color: "#64748b" }}>฿{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "0.75rem",
                borderTop: "1px solid #f1f5f9"
              }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                  Total: ฿{order.totalPrice.toFixed(2)}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    onClick={() => handleReceipt(order.id)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: 6,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Receipt / Pickup
                  </button>
                  {order.status === "PENDING" ? (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      style={{
                        padding: "0.4rem 0.85rem",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fca5a5",
                        borderRadius: 6,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: cancellingId === order.id ? "not-allowed" : "pointer"
                      }}
                    >
                      {cancellingId === order.id ? "Cancelling..." : "Cancel Order (BR-05)"}
                    </button>
                  ) : order.status === "CANCELLED" ? (
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Order Voided</span>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                      Locked in kitchen ({order.status})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {receipt && (
        <div
          role="dialog"
          aria-label="Digital receipt"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
            padding: "1rem"
          }}
        >
          <div style={{
            width: "min(420px, 100%)",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1.5rem",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>QuickOrder Receipt</h2>
              <button onClick={() => setReceipt(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginTop: "1rem", textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "1rem" }}>
              <div style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700 }}>PICKUP CODE</div>
              <div style={{ color: "#0f172a", fontSize: "2rem", fontWeight: 800, letterSpacing: "0.18em" }}>
                {receipt.pickupCode}
              </div>
            </div>
            <p style={{ marginTop: "1rem", color: "#475569" }}>
              Order {receipt.orderNumber} · {receipt.status}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {receipt.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>฿{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span>Total</span><span>฿{receipt.totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => window.print()}
              style={{ marginTop: "1rem", width: "100%", padding: "0.65rem", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
