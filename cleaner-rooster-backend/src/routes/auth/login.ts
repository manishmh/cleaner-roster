import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../../bindings";
import { createDrizzleClient } from "../../db";
import { users } from "../../db/schema";
import { JWTService, getCookieConfig } from "../../utils/jwt";
import { PasswordService } from "../../utils/password";

const loginRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Login validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /auth/login - Authenticate user
loginRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = loginSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid login credentials",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { email, password } = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (userResult.length === 0) {
        throw new HTTPException(401, {
          message: "Invalid email or password",
        });
      }

      const user = userResult[0];

      // Verify password
      const isPasswordValid = await PasswordService.verifyPassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new HTTPException(401, {
          message: "Invalid email or password",
        });
      }

      // Generate JWT tokens
      const jwtService = new JWTService(
        c.env.JWT_SECRET,
        c.env.JWT_REFRESH_SECRET
      );
      const { accessToken, refreshToken } = await jwtService.generateTokenPair(
        user.id,
        user.email
      );

      // Set cookies
      const isProduction = c.env.ENVIRONMENT === "production";
      const cookieConfig = getCookieConfig(isProduction);

      console.log("Setting cookies with config:", {
        isProduction,
        cookieConfig,
        origin: c.req.header("Origin"),
        userAgent: c.req.header("User-Agent")
      });

      setCookie(c, "accessToken", accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60, // 15 minutes
      });

      setCookie(c, "refreshToken", refreshToken, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      console.log("Cookies set successfully");

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;

      return c.json({
        success: true,
        message: "Login successful",
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
          },
        },
      });
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error("Login error:", error);
      throw new HTTPException(500, {
        message: "Failed to authenticate user",
      });
    }
  }
);

// POST /auth/logout - Logout user
loginRouter.post("/logout", async (c) => {
  try {
    const isProduction = c.env.ENVIRONMENT === "production";
    const cookieConfig = getCookieConfig(isProduction);

    // Clear authentication cookies
    deleteCookie(c, "accessToken", {
      ...cookieConfig,
    });

    deleteCookie(c, "refreshToken", {
      ...cookieConfig,
    });

    return c.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    throw new HTTPException(500, {
      message: "Failed to logout",
    });
  }
});

// POST /auth/refresh - Refresh access token using refresh token
loginRouter.post("/refresh", async (c) => {
  try {
    const refreshToken = c.req.header("Authorization")?.replace("Bearer ", "") ||
                        getCookie(c, "refreshToken");

    if (!refreshToken) {
      throw new HTTPException(401, {
        message: "Refresh token not provided",
      });
    }

    // Verify refresh token
    const jwtService = new JWTService(
      c.env.JWT_SECRET,
      c.env.JWT_REFRESH_SECRET
    );

    const payload = await jwtService.verifyRefreshToken(refreshToken);

    // Generate new access token
    const newAccessToken = await jwtService.generateAccessToken(
      payload.userId,
      payload.email
    );

    // Set new access token cookie
    const isProduction = c.env.ENVIRONMENT === "production";
    const cookieConfig = getCookieConfig(isProduction);

    setCookie(c, "accessToken", newAccessToken, {
      ...cookieConfig,
      maxAge: 15 * 60, // 15 minutes
    });

    return c.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error("Token refresh error:", error);
    throw new HTTPException(401, {
      message: "Invalid refresh token",
    });
  }
});

export { loginRouter };
