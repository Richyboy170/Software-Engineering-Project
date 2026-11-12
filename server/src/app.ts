import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { authRouter } from "./routes/auth.routes.js";
import { menuRouter } from "./routes/menu.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { prisma } from "./db.js";

export const app = express();

app.use(cors());
app.use(express.json());

// System health probes (Required by Lab 5 GCP & Deliverable 1)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "QuickOrder API" });
});

app.get("/api/ready", async (_req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      await prisma.$queryRaw`SELECT 1`;
    }
    res.status(200).json({ status: "ready", db: "connected" });
  } catch {
    res.status(503).json({ status: "not_ready", db: "disconnected" });
  }
});

// Category endpoint for compatibility with starter kit smoke tests
app.get("/api/categories", (_req, res) => {
  res.status(200).json({
    success: true,
    data: ["Mains", "Sides", "Beverages"],
  });
});

// Domain Routes
app.use("/api/auth", authRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", orderRouter);

// Serve client static build in production container
const possibleDistPaths = [
  path.resolve(process.cwd(), "../client/dist"),
  path.resolve(process.cwd(), "./client/dist"),
  path.resolve(process.cwd(), "public"),
];

for (const clientDist of possibleDistPaths) {
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(clientDist, "index.html"));
    });
    break;
  }
}

// 404 Catch-All for unmatched API routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "API endpoint does not exist.",
    },
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected internal server error occurred.",
      },
    });
  }
);
