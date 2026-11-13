import { Router, Response } from "express";
import { z } from "zod";
import type { OrderStatus } from "../store.js";
import type { QuickOrderPersistence } from "../persistence/contracts.js";
import { asyncHandler } from "../http/async-handler.js";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth.middleware.js";

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int(),
    })
  ),
});

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

export function createOrderRouter(persistence: QuickOrderPersistence) {
  const router = Router();
  const auth = requireAuth(persistence);

  router.post(
    "/",
    auth,
    requireRole("CUSTOMER"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const parseResult = CreateOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ITEMS",
            message: "Order must contain an items array with valid menuItemId and integer quantity.",
          },
        });
        return;
      }

      const result = await persistence.createOrder(req.user!.id, parseResult.data.items);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.order,
      });
    })
  );

  router.get(
    "/my",
    auth,
    requireRole("CUSTOMER"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const orders = await persistence.getOrdersByCustomer(req.user!.id);
      res.status(200).json({
        success: true,
        data: orders,
      });
    })
  );

  router.get(
    "/",
    auth,
    requireRole("STAFF"),
    asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
      const orders = await persistence.getAllOrders();
      res.status(200).json({
        success: true,
        data: orders,
      });
    })
  );

  router.get(
    "/:id",
    auth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const order = await persistence.getOrderById(req.params.id);
      if (!order) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Order not found.",
          },
        });
        return;
      }

      if (req.user!.role === "CUSTOMER" && order.customerId !== req.user!.id) {
        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to view this order.",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    })
  );

  router.post(
    "/:id/cancel",
    auth,
    requireRole("CUSTOMER"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const result = await persistence.cancelOrder(req.params.id, req.user!.id);
      if (!result.success) {
        res.status(result.statusHttp).json({
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.order,
      });
    })
  );

  router.patch(
    "/:id/status",
    auth,
    requireRole("STAFF"),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const parseResult = UpdateStatusSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "A valid status enum is required.",
          },
        });
        return;
      }

      const result = await persistence.updateOrderStatus(
        req.params.id,
        parseResult.data.status as OrderStatus
      );
      if (!result.success) {
        const statusCode = result.code === "NOT_FOUND" ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: result.code,
            message: result.message,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.order,
      });
    })
  );

  return router;
}
