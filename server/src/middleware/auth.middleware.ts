import { Request, Response, NextFunction } from "express";
import type { QuickOrderPersistence } from "../persistence/contracts.js";
import { asyncHandler } from "../http/async-handler.js";
import { User, UserRole } from "../store.js";

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers["x-session-token"];
  if (typeof customHeader === "string") {
    return customHeader.trim();
  }
  return null;
}

export function requireAuth(persistence: QuickOrderPersistence) {
  return asyncHandler(async (req: AuthenticatedRequest, res, next) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please provide a valid session token.",
        },
      });
      return;
    }

    const sessionData = await persistence.getSession(token);
    if (!sessionData) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_SESSION",
          message: "Invalid or expired session token.",
        },
      });
      return;
    }

    req.user = sessionData.user;
    req.sessionToken = token;
    next();
  });
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}].`,
        },
      });
      return;
    }

    next();
  };
}
