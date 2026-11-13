import { Router } from "express";
import { asyncHandler } from "../http/async-handler.js";
export function createMenuRouter(persistence) {
    const router = Router();
    router.get("/", asyncHandler(async (_req, res) => {
        const items = await persistence.getMenuItems();
        res.status(200).json({
            success: true,
            data: items,
        });
    }));
    router.get("/:id", asyncHandler(async (req, res) => {
        const item = await persistence.getMenuItem(req.params.id);
        if (!item) {
            res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Menu item not found.",
                },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: item,
        });
    }));
    return router;
}
