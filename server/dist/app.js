import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createMenuRouter } from "./routes/menu.routes.js";
import { createOrderRouter } from "./routes/order.routes.js";
import { createRuntimePersistence } from "./persistence/runtime.js";
import { asyncHandler } from "./http/async-handler.js";
export function createApp(persistence) {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.get("/api/health", (_req, res) => {
        res.status(200).json({ status: "ok", service: "QuickOrder API" });
    });
    app.get("/api/ready", asyncHandler(async (_req, res) => {
        try {
            await persistence.checkReady();
            res.status(200).json({ status: "ready", db: "connected" });
        }
        catch {
            res.status(503).json({ status: "not_ready", db: "disconnected" });
        }
    }));
    app.get("/api/categories", (_req, res) => {
        res.status(200).json({
            success: true,
            data: ["Mains", "Sides", "Beverages"],
        });
    });
    app.use("/api/auth", createAuthRouter(persistence));
    app.use("/api/menu", createMenuRouter(persistence));
    app.use("/api/orders", createOrderRouter(persistence));
    const possibleDistPaths = [
        path.resolve(process.cwd(), "../client/dist"),
        path.resolve(process.cwd(), "./client/dist"),
        path.resolve(process.cwd(), "public"),
    ];
    for (const clientDist of possibleDistPaths) {
        if (fs.existsSync(clientDist)) {
            app.use(express.static(clientDist));
            app.get("*", (req, res, next) => {
                if (req.path.startsWith("/api/"))
                    return next();
                res.sendFile(path.join(clientDist, "index.html"));
            });
            break;
        }
    }
    app.use("/api/*", (_req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: "ROUTE_NOT_FOUND",
                message: "API endpoint does not exist.",
            },
        });
    });
    app.use((err, _req, res, _next) => {
        console.error("Unhandled error:", err);
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "An unexpected internal server error occurred.",
            },
        });
    });
    return app;
}
export const app = createApp(createRuntimePersistence());
