import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Menu } from "./pages/Menu";
import { MyOrders } from "./pages/MyOrders";
import { KitchenQueue } from "./pages/KitchenQueue";
import { api } from "./api";
import { User, MenuItem, CartItem } from "./types";

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("menu");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("quickorder_user");
    const token = localStorage.getItem("quickorder_token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        api.getMe().then((fresh) => {
          setUser(fresh);
          localStorage.setItem("quickorder_user", JSON.stringify(fresh));
        }).catch(() => {
          handleLogout();
        });
      } catch {
        handleLogout();
      }
    }
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const items = await api.getMenu();
      setMenuItems(items);
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === "STAFF") {
      setActiveTab("queue");
    } else {
      setActiveTab("menu");
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCart([]);
    setActiveTab("menu");
  };

  const addToCart = (item: MenuItem, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + qty } : ci
        );
      }
      return [...prev, { item, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: newQty } : ci))
      );
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCartError(null);
    setOrderSubmitting(true);
    try {
      await api.placeOrder(
        cart.map((ci) => ({ menuItemId: ci.item.id, quantity: ci.quantity }))
      );
      setCart([]);
      setIsCartOpen(false);
      await loadMenu(); // Refresh stock counts
      setActiveTab("my-orders");
    } catch (err: any) {
      setCartError(err.message || "Failed to place order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const totalCartPrice = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const totalCartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={totalCartCount}
        openCart={() => setIsCartOpen(true)}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: "3rem" }}>
        {activeTab === "login" && <Login onLoginSuccess={handleLoginSuccess} />}
        {activeTab === "menu" && (
          <Menu
            items={menuItems}
            loading={menuLoading}
            user={user}
            onAddToCart={addToCart}
            onGoToLogin={() => setActiveTab("login")}
          />
        )}
        {activeTab === "my-orders" && <MyOrders />}
        {activeTab === "queue" && <KitchenQueue />}
      </main>

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 100
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#ffffff",
            height: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "-4px 0 12px rgba(0,0,0,0.1)"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>Your Cart</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {cartError && (
                <div style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "0.75rem",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  marginBottom: "1rem"
                }}>
                  {cartError}
                </div>
              )}

              {cart.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", marginTop: "3rem" }}>
                  Your cart is empty.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {cart.map((ci) => (
                    <div key={ci.item.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.6rem 0",
                      borderBottom: "1px solid #f1f5f9"
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>{ci.item.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>฿{ci.item.price.toFixed(2)} each</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          onClick={() => updateCartQty(ci.item.id, ci.quantity - 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}>{ci.quantity}</span>
                        <button
                          onClick={() => updateCartQty(ci.item.id, ci.quantity + 1)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            border: "1px solid #cbd5e1",
                            background: "#ffffff",
                            cursor: "pointer",
                            fontWeight: 700
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>
                  <span>Total Amount</span>
                  <span style={{ color: "#f97316" }}>฿{totalCartPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={orderSubmitting}
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    backgroundColor: "#f97316",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: "1rem",
                    fontWeight: 700,
                    cursor: orderSubmitting ? "not-allowed" : "pointer",
                    opacity: orderSubmitting ? 0.7 : 1
                  }}
                >
                  {orderSubmitting ? "Submitting Order..." : "Place Order & Pay"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        padding: "1.5rem",
        textAlign: "center",
        fontSize: "0.8rem",
        color: "#64748b"
      }}>
        CPE 334 Software Engineering — Deliverable 1 Release · Patiharn Liangkobkit (66070503489) & Tanakrit Sunthonwetchapong (67070503464)
      </footer>
    </div>
  );
};
