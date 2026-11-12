import { Router, Response } from "express";
import { z } from "zod";
import { store, OrderStatus } from "../store.js";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth.middleware.js";

export const orderRouter = Router();

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

// POST /api/orders - Customer places an order
orderRouter.post(
  "/",
  requireAuth,
  requireRole("CUSTOMER"),
  (req: AuthenticatedRequest, res: Response) => {
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

    const result = store.createOrder(req.user!.id, parseResult.data.items);
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
  }
);

// GET /api/orders/my - Customer queries own order history
orderRouter.get(
  "/my",
  requireAuth,
  requireRole("CUSTOMER"),
  (req: AuthenticatedRequest, res: Response) => {
    const orders = store.getOrdersByCustomer(req.user!.id);
    res.status(200).json({
      success: true,
      data: orders,
    });
  }
);

// GET /api/orders - Staff queries all orders in kitchen dispatch queue
orderRouter.get(
  "/",
  requireAuth,
  requireRole("STAFF"),
  (_req: AuthenticatedRequest, res: Response) => {
    const orders = store.getAllOrders();
    res.status(200).json({
      success: true,
      data: orders,
    });
  }
);

// GET /api/orders/:id - Single order details
orderRouter.get(
  "/:id",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const order = store.getOrderById(req.params.id);
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

    // BR-04: Data Isolation: Customer can only view own orders; Staff can view all
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
  }
);

// POST /api/orders/:id/cancel - Customer cancels own pending order
orderRouter.post(
  "/:id/cancel",
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const result = store.cancelOrder(req.params.id, req.user!.id);
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
  }
);

// PATCH /api/orders/:id/status - Staff updates order status
orderRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("STAFF"),
  (req: AuthenticatedRequest, res: Response) => {
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

    const result = store.updateOrderStatus(req.params.id, parseResult.data.status as OrderStatus);
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
  }
);
