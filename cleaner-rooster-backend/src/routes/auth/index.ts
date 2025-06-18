import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env, Variables } from "../../bindings";
import { forgotPasswordRouter } from "./forgot-password";
import { loginRouter } from "./login";
import { registerRouter } from "./register";

const authRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Mount auth sub-routes
authRouter.route("/login", loginRouter);
authRouter.route("/register", registerRouter);
authRouter.route("/forgot-password", forgotPasswordRouter);

// GET /auth/me - Get current user info (requires authentication)
authRouter.get("/me", async (c) => {
  try {
    const { getCookie } = await import("hono/cookie");
    const { eq } = await import("drizzle-orm");
    const { createDrizzleClient } = await import("../../db");
    const { users } = await import("../../db/schema");
    const { JWTService } = await import("../../utils/jwt");

    // Get access token from cookie
    const accessToken = getCookie(c, "accessToken");
    
    if (!accessToken) {
      throw new HTTPException(401, {
        message: "Access token not found",
      });
    }

    // Verify the token
    const jwtService = new JWTService(
      c.env.JWT_SECRET,
      c.env.JWT_REFRESH_SECRET
    );

    const payload = await jwtService.verifyAccessToken(accessToken);
    
    // Get user from database
    const db = createDrizzleClient(c.env);
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new HTTPException(404, {
        message: "User not found",
      });
    }

    const user = userResult[0];
    const { password: _, ...userWithoutPassword } = user;

    return c.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error("Get current user error:", error);
    
    // Handle JWT errors
    if (error.message?.includes("Invalid") || error.message?.includes("token")) {
      throw new HTTPException(401, {
        message: "Invalid or expired token",
      });
    }

    throw new HTTPException(500, {
      message: "Failed to get user information",
    });
  }
});

// POST /auth/logout - Logout user (clear cookies)
authRouter.post("/logout", async (c) => {
  try {
    const { deleteCookie } = await import("hono/cookie");
    const { getCookieConfig } = await import("../../utils/jwt");

    const isProduction = c.env.ENVIRONMENT === "production";
    const cookieConfig = getCookieConfig(isProduction);

    // Clear both access and refresh tokens
    deleteCookie(c, "accessToken", {
      ...cookieConfig,
      maxAge: 0,
    });
    
    deleteCookie(c, "refreshToken", {
      ...cookieConfig,
      maxAge: 0,
    });

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new HTTPException(500, {
      message: "Failed to logout",
    });
  }
});

export { authRouter };
