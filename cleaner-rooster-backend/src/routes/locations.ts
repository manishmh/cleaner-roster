import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { insertLocationSchema, locations, type Location, type NewLocation } from "../db/schema";

const locationsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createLocationSchema = z.object({
  unit: z.string().min(1, "Unit is required"),
  name: z.string().min(1, "Name is required"),
  accuracy: z.number().min(0).max(100).default(100),
  comment: z.string().optional(),
  address: z.string().optional(),
  // Google Maps specific fields
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
  formattedAddress: z.string().optional(),
});

const updateLocationSchema = createLocationSchema.partial();

// GET /api/locations - List all locations (with history limit)
locationsRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Get query parameters for filtering
    const search = c.req.query("search");
    const unit = c.req.query("unit");
    const historyOnly = c.req.query("history") === "true"; // New parameter for history
    
    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(like(locations.name, `%${search}%`));
    }
    if (unit) {
      conditions.push(like(locations.unit, `%${unit}%`));
    }
    
    // If requesting history, get only last 10 used locations
    if (historyOnly) {
      const historyLocations = await db
        .select()
        .from(locations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(locations.lastUsedAt))
        .limit(10);
      
      return c.json({
        success: true,
        data: historyLocations,
        count: historyLocations.length,
      });
    }
    
    // Execute query with or without conditions
    const allLocations = conditions.length > 0
      ? await db.select().from(locations).where(and(...conditions)).orderBy(desc(locations.createdAt))
      : await db.select().from(locations).orderBy(desc(locations.createdAt));

    return c.json({
      success: true,
      data: allLocations,
      count: allLocations.length,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw new HTTPException(500, { message: "Failed to fetch locations" });
  }
});

// GET /api/locations/:id - Get a single location
locationsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid location ID" });
    }

    const db = createDrizzleClient(c.env);
    
    const location = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (location.length === 0) {
      throw new HTTPException(404, { message: "Location not found" });
    }

    return c.json({
      success: true,
      data: location[0],
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching location:", error);
    throw new HTTPException(500, { message: "Failed to fetch location" });
  }
});

// POST /api/locations - Create a new location
locationsRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createLocationSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid location data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const locationData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if unit + name combination already exists
      const existingLocation = await db
        .select()
        .from(locations)
        .where(and(eq(locations.unit, locationData.unit), eq(locations.name, locationData.name)))
        .limit(1);

      if (existingLocation.length > 0) {
        throw new HTTPException(409, { message: "Location with this unit and name already exists" });
      }

      const newLocation = await db
        .insert(locations)
        .values({
          ...locationData,
          lastUsedAt: new Date(), // Set last used when created
        })
        .returning();

      return c.json(
        {
          success: true,
          data: newLocation[0],
          message: "Location created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating location:", error);
      throw new HTTPException(500, { message: "Failed to create location" });
    }
  }
);

// PUT /api/locations/:id - Update a location
locationsRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateLocationSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid location data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid location ID" });
      }

      const locationData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if location exists
      const existingLocation = await db
        .select()
        .from(locations)
        .where(eq(locations.id, id))
        .limit(1);

      if (existingLocation.length === 0) {
        throw new HTTPException(404, { message: "Location not found" });
      }

      const updatedLocation = await db
        .update(locations)
        .set({
          ...locationData,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedLocation[0],
        message: "Location updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating location:", error);
      throw new HTTPException(500, { message: "Failed to update location" });
    }
  }
);

// PUT /api/locations/:id/use - Mark location as used (update lastUsedAt)
locationsRouter.put("/:id/use", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid location ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if location exists
    const existingLocation = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (existingLocation.length === 0) {
      throw new HTTPException(404, { message: "Location not found" });
    }

    // Update lastUsedAt timestamp
    const updatedLocation = await db
      .update(locations)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning();

    return c.json({
      success: true,
      data: updatedLocation[0],
      message: "Location usage updated successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error updating location usage:", error);
    throw new HTTPException(500, { message: "Failed to update location usage" });
  }
});

// DELETE /api/locations/:id - Delete a location
locationsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid location ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if location exists
    const existingLocation = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (existingLocation.length === 0) {
      throw new HTTPException(404, { message: "Location not found" });
    }

    // Delete the location
    await db.delete(locations).where(eq(locations.id, id));

    return c.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting location:", error);
    throw new HTTPException(500, { message: "Failed to delete location" });
  }
});

export { locationsRouter };
 