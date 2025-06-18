import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../../bindings";
import { createDrizzleClient } from "../../db";
import { users } from "../../db/schema";
import { JWTService, getCookieConfig } from "../../utils/jwt";
import { PasswordService } from "../../utils/password";

const registerRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Registration validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /auth/register - Register a new user
registerRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = registerSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid registration data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { name, email, password } = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Validate password strength
      const passwordValidation = PasswordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new HTTPException(400, {
          message: "Password does not meet requirements",
          cause: passwordValidation.errors,
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0) {
        throw new HTTPException(409, {
          message: "User with this email already exists",
        });
      }

      // Hash the password
      const hashedPassword = await PasswordService.hashPassword(password);

      // Create the user
      const newUser = await db
        .insert(users)
        .values({
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        })
        .returning();

      const user = newUser[0];

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

      setCookie(c, "accessToken", accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60, // 15 minutes
      });

      setCookie(c, "refreshToken", refreshToken, {
        ...cookieConfig,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;

      return c.json(
        {
          success: true,
          message: "User registered successfully",
          data: {
            user: userWithoutPassword,
            tokens: {
              accessToken,
              refreshToken,
            },
          },
        },
        201
      );
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error("Registration error:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      throw new HTTPException(500, {
        message: "Failed to register user",
        cause: c.env.ENVIRONMENT === "development" ? error.message : undefined,
      });
    }
  }
);

export { registerRouter };
