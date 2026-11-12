import React from "react";
import { User } from "../types";

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  openCart: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  onLogout,
}) => {
  return (
    <header style={{
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 1.25rem",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
             onClick={() => setActiveTab(user?.role === "STAFF" ? "queue" : "menu")}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: "#f97316",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.2rem"
          }}>
            Q
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#0f172a" }}>QuickOrder</div>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>CPE 334 Sprint 1</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {user ? (
            <>
              {user.role === "CUSTOMER" && (
                <>
                  <button
                    onClick={() => setActiveTab("menu")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      backgroundColor: activeTab === "menu" ? "#fff7ed" : "transparent",
                      color: activeTab === "menu" ? "#f97316" : "#475569"
                    }}
                  >
                    Menu Catalog
                  </button>
                  <button
                    onClick={() => setActiveTab("my-orders")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      backgroundColor: activeTab === "my-orders" ? "#fff7ed" : "transparent",
                      color: activeTab === "my-orders" ? "#f97316" : "#475569"
                    }}
                  >
                    My Orders
                  </button>
                  <button
                    onClick={openCart}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "1px solid #f97316",
                      backgroundColor: "#f97316",
                      color: "#ffffff",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem"
                    }}
                  >
                    Cart {cartCount > 0 && <span style={{
                      backgroundColor: "#ffffff",
                      color: "#f97316",
                      borderRadius: "50%",
                      padding: "2px 7px",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>{cartCount}</span>}
                  </button>
                </>
              )}

              {user.role === "STAFF" && (
                <>
                  <button
                    onClick={() => setActiveTab("queue")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      backgroundColor: activeTab === "queue" ? "#fff7ed" : "transparent",
                      color: activeTab === "queue" ? "#f97316" : "#475569"
                    }}
                  >
                    Kitchen Queue
                  </button>
                  <button
                    onClick={() => setActiveTab("menu")}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      backgroundColor: activeTab === "menu" ? "#fff7ed" : "transparent",
                      color: activeTab === "menu" ? "#f97316" : "#475569"
                    }}
                  >
                    Menu Preview
                  </button>
                </>
              )}

              {/* User badge & Logout */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginLeft: "1rem",
                borderLeft: "1px solid #e2e8f0",
                paddingLeft: "1rem"
              }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{user.fullName}</div>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    backgroundColor: user.role === "STAFF" ? "#ede9fe" : "#dbeafe",
                    color: user.role === "STAFF" ? "#6d28d9" : "#1d4ed8",
                    padding: "2px 6px",
                    borderRadius: 4
                  }}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  style={{
                    padding: "0.4rem 0.8rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    backgroundColor: "#ffffff",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setActiveTab("login")}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 6,
                backgroundColor: "#f97316",
                color: "#ffffff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
