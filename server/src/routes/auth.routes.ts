import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { QuickOrderPersistence } from "../persistence/contracts.js";
import { asyncHandler } from "../http/async-handler.js";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware.js";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createAuthRouter(persistence: QuickOrderPersistence) {
  const router = Router();

  router.post(
    "/login",
    asyncHandler(async (req, res: Response) => {
      const parseResult = LoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Email and password are required in valid format.",
          },
        });
        return;
      }

      const { email, password } = parseResult.data;
      const user = await persistence.findUserByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
        return;
      }

      const session = await persistence.createSession(user.id);
      res.status(200).json({
        success: true,
        data: {
          token: session.token,
          expiresAt: session.expiresAt,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        },
      });
    })
  );

  router.get(
    "/me",
    requireAuth(persistence),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user!;
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    })
  );

  router.post(
    "/logout",
    requireAuth(persistence),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      if (req.sessionToken) {
        await persistence.deleteSession(req.sessionToken);
      }
      res.status(200).json({
        success: true,
        data: {
          message: "Logged out successfully.",
        },
      });
    })
  );

  return router;
}
