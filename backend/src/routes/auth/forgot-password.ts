import { and, eq, gt } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../../bindings";
import { createDrizzleClient } from "../../db";
import { passwordResetTokens, users } from "../../db/schema";
import { generateSecureToken } from "../../utils/jwt";
import { PasswordService } from "../../utils/password";

const forgotPasswordRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Request password reset schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /auth/forgot-password - Request password reset
forgotPasswordRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = forgotPasswordSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid request data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { email } = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if user exists
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (userResult.length === 0) {
        return c.json({
          success: true,
          message: "If the email exists, a password reset link has been sent",
        });
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Delete any existing reset tokens for this email
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.email, email.toLowerCase()));

      // Create new reset token
      await db.insert(passwordResetTokens).values({
        email: email.toLowerCase(),
        token: resetToken,
        expiresAt,
      });

      // In a real application, you would send an email here
      // For now, we'll just log the token (NEVER do this in production)
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset URL: ${c.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

      return c.json({
        success: true,
        message: "If the email exists, a password reset link has been sent",
        // Remove this in production - only for development
        ...(c.env.ENVIRONMENT === "development" && {
          debug: {
            token: resetToken,
            resetUrl: `${c.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
          },
        }),
      });
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error("Forgot password error:", error);
      throw new HTTPException(500, {
        message: "Failed to process password reset request",
      });
    }
  }
);

// POST /auth/forgot-password/reset - Reset password with token
forgotPasswordRouter.post(
  "/reset",
  validator("json", (value, c) => {
    const parsed = resetPasswordSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid reset data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const { token, password } = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Validate password strength
      const passwordValidation = PasswordService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new HTTPException(400, {
          message: "Password does not meet requirements",
          cause: passwordValidation.errors,
        });
      }

      // Find valid reset token
      const tokenResult = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (tokenResult.length === 0) {
        throw new HTTPException(400, {
          message: "Invalid or expired reset token",
        });
      }

      const resetTokenRecord = tokenResult[0];

      // Find user by email
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, resetTokenRecord.email))
        .limit(1);

      if (userResult.length === 0) {
        throw new HTTPException(404, {
          message: "User not found",
        });
      }

      const user = userResult[0];

      // Hash new password
      const hashedPassword = await PasswordService.hashPassword(password);

      // Update user password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Delete the used reset token
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetTokenRecord.id));

      return c.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error("Reset password error:", error);
      throw new HTTPException(500, {
        message: "Failed to reset password",
      });
    }
  }
);

// GET /auth/forgot-password/verify-reset-token - Verify if reset token is valid
forgotPasswordRouter.get("/verify-reset-token", async (c) => {
  try {
    const token = c.req.query("token");

    if (!token) {
      throw new HTTPException(400, {
        message: "Reset token is required",
      });
    }

    const db = createDrizzleClient(c.env);

    // Check if token exists and is not expired
    const tokenResult = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    const isValid = tokenResult.length > 0;

    return c.json({
      success: true,
      data: {
        valid: isValid,
        ...(isValid && {
          email: tokenResult[0].email,
        }),
      },
    });
  } catch (error: any) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error("Verify reset token error:", error);
    throw new HTTPException(500, {
      message: "Failed to verify reset token",
    });
  }
});

export { forgotPasswordRouter };
