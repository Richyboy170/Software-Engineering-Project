import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { store } from "../src/store.js";
import { resetLoginRateLimitForTests } from "../src/routes/auth.routes.js";

describe("Feature F-01: Authentication & Health Checks", () => {
  beforeEach(() => {
    store.seedDefaultData();
    resetLoginRateLimitForTests();
  });

  describe("TEST-F11-03: Security response headers", () => {
    it("returns 200 with status ok and service name", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok", service: "QuickOrder API" });
      expect(res.headers["x-request-id"]).toBeDefined();
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-frame-options"]).toBe("DENY");
      expect(res.headers["referrer-policy"]).toBe("no-referrer");
    });
  });

  describe("TEST-AUTH-01 / AC-AUTH-01: Valid user login", () => {
    it("returns 200, valid session token, and user profile with CUSTOMER role", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer@quickorder.local",
          password: "Password123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe("string");
      expect(res.body.data.user.email).toBe("customer@quickorder.local");
      expect(res.body.data.user.role).toBe("CUSTOMER");
    });
  });

  describe("TEST-AUTH-02 / AC-AUTH-02: Invalid login credentials", () => {
    it("returns 401 when password is wrong", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer@quickorder.local",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 when email does not exist", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@quickorder.local",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("blocks repeated failed login attempts with 429", async () => {
      for (let attempt = 0; attempt < 5; attempt++) {
        await request(app)
          .post("/api/auth/login")
          .send({
            email: "customer@quickorder.local",
            password: "WrongPassword!",
          });
      }

      const blocked = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer@quickorder.local",
          password: "WrongPassword!",
        });

      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe("TOO_MANY_ATTEMPTS");
      expect(blocked.headers["retry-after"]).toBeDefined();
    });

    it("TEST-F11-02: clears the failed-login counter after successful login", async () => {
      const login = (password: string) =>
        request(app)
          .post("/api/auth/login")
          .send({ email: "customer@quickorder.local", password });

      for (let attempt = 0; attempt < 4; attempt++) {
        expect((await login("WrongPassword!")).status).toBe(401);
      }

      expect((await login("Password123!")).status).toBe(200);

      for (let attempt = 0; attempt < 5; attempt++) {
        expect((await login("WrongPassword!")).status).toBe(401);
      }

      expect((await login("WrongPassword!")).status).toBe(429);
    });
  });

  describe("TEST-AUTH-03 / AC-AUTH-03: Retrieve profile via /api/auth/me", () => {
    it("returns 200 and authenticated user details", async () => {
      // 1. Login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer@quickorder.local",
          password: "Password123!",
        });
      const token = loginRes.body.data.token;

      // 2. Fetch /api/auth/me
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe("customer@quickorder.local");
      expect(meRes.body.data.role).toBe("CUSTOMER");
    });
  });

  describe("TEST-AUTH-04 / AC-AUTH-04: Logout invalidation", () => {
    it("destroys session and rejects subsequent authenticated calls", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "customer@quickorder.local",
          password: "Password123!",
        });
      const token = loginRes.body.data.token;

      // Logout
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);

      // Attempt /api/auth/me with revoked token
      const checkRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(checkRes.status).toBe(401);
      expect(checkRes.body.error.code).toBe("INVALID_SESSION");
    });
  });
});
