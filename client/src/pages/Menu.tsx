import React, { useState } from "react";
import { MenuItem, User } from "../types";

interface MenuProps {
  items: MenuItem[];
  loading: boolean;
  user: User | null;
  onAddToCart: (item: MenuItem, qty: number) => void;
  onGoToLogin: () => void;
}

export const Menu: React.FC<MenuProps> = ({
  items,
  loading,
  user,
  onAddToCart,
  onGoToLogin,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((i) => i.category === selectedCategory);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.25rem", textAlign: "center" }}>
        <p style={{ color: "#64748b" }}>Loading fresh menu items...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.25rem" }}>
      {/* Hero Banner */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "1.75rem",
        marginBottom: "2rem",
        border: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
            Fresh Daily Menu
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
            Live stock validation & server-authoritative checkout
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: 20,
                border: "1px solid",
                borderColor: selectedCategory === cat ? "#f97316" : "#cbd5e1",
                backgroundColor: selectedCategory === cat ? "#f97316" : "#ffffff",
                color: selectedCategory === cat ? "#ffffff" : "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem"
      }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#ea580c",
                  backgroundColor: "#fff7ed",
                  padding: "2px 8px",
                  borderRadius: 4
                }}>
                  {item.category}
                </span>

                {item.stock > 0 ? (
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: item.stock <= 2 ? "#b45309" : "#15803d",
                    backgroundColor: item.stock <= 2 ? "#fef3c7" : "#dcfce7",
                    padding: "2px 8px",
                    borderRadius: 4
                  }}>
                    {item.stock} left
                  </span>
                ) : (
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#b91c1c",
                    backgroundColor: "#fee2e2",
                    padding: "2px 8px",
                    borderRadius: 4
                  }}>
                    Sold Out
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>
                {item.name}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
                {item.description}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                ฿{item.price.toFixed(2)}
              </div>

              {user ? (
                user.role === "CUSTOMER" ? (
                  <button
                    disabled={item.stock <= 0}
                    onClick={() => onAddToCart(item, 1)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: 6,
                      backgroundColor: item.stock > 0 ? "#f97316" : "#cbd5e1",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: item.stock > 0 ? "pointer" : "not-allowed"
                    }}
                  >
                    {item.stock > 0 ? "+ Add to Cart" : "Out of Stock"}
                  </button>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                    Staff Preview
                  </span>
                )
              ) : (
                <button
                  onClick={onGoToLogin}
                  style={{
                    padding: "0.5rem 0.85rem",
                    borderRadius: 6,
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  Sign in to Order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
