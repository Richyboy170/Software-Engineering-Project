import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { store } from "../store.js";
import { requireAuth } from "../middleware/auth.middleware.js";
export const authRouter = Router();
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
authRouter.post("/login", (req, res) => {
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
    const user = store.findUserByEmail(email);
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
    const session = store.createSession(user.id);
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
});
authRouter.get("/me", requireAuth, (req, res) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        },
    });
});
authRouter.post("/logout", requireAuth, (req, res) => {
    if (req.sessionToken) {
        store.deleteSession(req.sessionToken);
    }
    res.status(200).json({
        success: true,
        data: {
            message: "Logged out successfully.",
        },
    });
});
