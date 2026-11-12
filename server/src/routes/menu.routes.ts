import { Router, Request, Response } from "express";
import { store } from "../store.js";

export const menuRouter = Router();

menuRouter.get("/", (_req: Request, res: Response) => {
  const items = store.getMenuItems();
  res.status(200).json({
    success: true,
    data: items,
  });
});

menuRouter.get("/:id", (req: Request, res: Response) => {
  const item = store.getMenuItem(req.params.id);
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
});
