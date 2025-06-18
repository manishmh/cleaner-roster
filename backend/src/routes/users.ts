import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { insertUserSchema, staff, users, type NewUser, type User } from "../db/schema";
import { CACHE_KEYS, CACHE_TTL, CacheService } from "../services/cache";
import { PasswordService } from "../utils/password";

const usersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Helper function to create cache service
function createCacheService(env: Env): CacheService {
  return new CacheService(env.CACHE || undefined, CACHE_TTL.MEDIUM);
}





// GET /api/users/:id - Get a single user by ID (with caching)
usersRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid user ID" });
    }

    const cache = createCacheService(c.env);
    
    // Try to get from cache first
    const cachedUser = await cache.get<User>(
      CACHE_KEYS.USERS.BY_ID(id), 
      "users"
    );
    
    if (cachedUser) {
      // Ensure password is not included in cached response
      const { password: _, ...userWithoutPassword } = cachedUser as any;
      return c.json({
        success: true,
        data: userWithoutPassword,
        cached: true,
      });
    }

    // If not in cache, fetch from database
    const db = createDrizzleClient(c.env);
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (user.length === 0) {
      throw new HTTPException(404, { message: "User not found" });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user[0];

    // Cache the result (without password)
    await cache.set(
      CACHE_KEYS.USERS.BY_ID(id), 
      userWithoutPassword, 
      CACHE_TTL.LONG, 
      "users"
    );

    return c.json({
      success: true,
      data: userWithoutPassword,
      cached: false,
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching user:", error);
    throw new HTTPException(500, { message: "Failed to fetch user" });
  }
});

// PUT /api/users/:id - Update an existing user (invalidate cache)
usersRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = insertUserSchema.partial().safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { 
        message: "Invalid user data", 
        cause: parsed.error.issues 
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid user ID" });
      }

      const userData = c.req.valid("json");
      const db = createDrizzleClient(c.env);
      const cache = createCacheService(c.env);
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existingUser.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      }

      const updatedUser = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      // Invalidate cache after updating user
      await cache.invalidateUserCache(id);

      return c.json({
        success: true,
        data: updatedUser[0],
        message: "User updated successfully",
      });
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating user:", error);
      
      // Handle unique constraint violation (email already exists)
      if (error.message?.includes("UNIQUE constraint failed")) {
        throw new HTTPException(409, { message: "Email already exists" });
      }
      
      throw new HTTPException(500, { message: "Failed to update user" });
    }
  }
);

// PUT /api/users/:id/profile - Update user profile (specific fields only)
usersRouter.put(
  "/:id/profile",
  validator("json", (value, c) => {
    // Create a schema for profile updates (excluding password and sensitive fields)
    const profileUpdateSchema = insertUserSchema.pick({
      name: true,
      phone: true,
      bio: true,
      avatar: true,
      country: true,
      city: true,
      postalCode: true,
      taxId: true,
    }).partial();
    
    const parsed = profileUpdateSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { 
        message: "Invalid profile data", 
        cause: parsed.error.issues 
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid user ID" });
      }

      const profileData = c.req.valid("json");
      const db = createDrizzleClient(c.env);
      const cache = createCacheService(c.env);
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existingUser.length === 0) {
        throw new HTTPException(404, { message: "User not found" });
      }

      const updatedUser = await db
        .update(users)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser[0];

      // Invalidate cache after updating user
      await cache.invalidateUserCache(id);

      return c.json({
        success: true,
        data: userWithoutPassword,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating profile:", error);
      throw new HTTPException(500, { message: "Failed to update profile" });
    }
  }
);

// DELETE /api/users/:id - Delete a user (invalidate cache)
usersRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid user ID" });
    }

    const db = createDrizzleClient(c.env);
    const cache = createCacheService(c.env);
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (existingUser.length === 0) {
      throw new HTTPException(404, { message: "User not found" });
    }

    await db.delete(users).where(eq(users.id, id));

    // Invalidate cache after deleting user
    await cache.invalidateUserCache(id);

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting user:", error);
    throw new HTTPException(500, { message: "Failed to delete user" });
  }
});

// Cache management endpoints
usersRouter.post("/cache/clear", async (c) => {
  try {
    const cache = createCacheService(c.env);
    await cache.invalidateAllUsersCache();
    
    return c.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    throw new HTTPException(500, { message: "Failed to clear cache" });
  }
});



export { usersRouter };
