import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { cleanerRoster, type CleanerRoster, type NewCleanerRoster } from "../db/schema";

const cleanerRosterRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createCleanerRosterSchema = z.object({
  clientLink: z.string().min(1, "Client link is required"),
  bookingDate: z.string().min(1, "Booking date is required"),
  bookingTime: z.string().min(1, "Booking time is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  loggedTime: z.string().optional(),
  inTime: z.string().optional(),
  outTime: z.string().optional(),
  locationAddress: z.string().min(1, "Location address is required"),
  locationGoogleMapLink: z.string().optional(),
  startLocationAddress: z.string().optional(),
  startLocationGoogleMapLink: z.string().optional(),
  endLocationAddress: z.string().optional(),
  endLocationGoogleMapLink: z.string().optional(),
  shiftInstructions: z.string().optional(),
  supervisorQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(["OK", "YES_NO", "TEXT"]),
    answer: z.string().optional(),
  })).default([]),
  mobileMessage: z.object({
    text: z.string(),
    imageUrl: z.string().optional(),
  }).optional(),
  status: z.enum(["Pending", "In Progress", "Completed", "Cancelled"]).default("Pending"),
});

const updateCleanerRosterSchema = createCleanerRosterSchema.partial();

// GET /api/cleaner-roster - List all roster entries
cleanerRosterRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Get query parameters for filtering
    const status = c.req.query("status");
    const search = c.req.query("search");
    
    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(cleanerRoster.status, status));
    }
    if (search) {
      conditions.push(like(cleanerRoster.clientLink, `%${search}%`));
    }
    
    // Execute query with or without conditions
    const allRoster = conditions.length > 0
      ? await db.select().from(cleanerRoster).where(and(...conditions)).orderBy(desc(cleanerRoster.createdAt))
      : await db.select().from(cleanerRoster).orderBy(desc(cleanerRoster.createdAt));

    // Parse JSON fields for each roster entry
    const rosterWithParsedData = allRoster.map(({ supervisorQuestions, mobileMessage, ...rosterEntry }) => ({
      ...rosterEntry,
      supervisorQuestions: JSON.parse(supervisorQuestions || "[]"),
      mobileMessage: mobileMessage ? JSON.parse(mobileMessage) : undefined,
    }));

    return c.json({
      success: true,
      data: rosterWithParsedData,
      count: rosterWithParsedData.length,
    });
  } catch (error) {
    console.error("Error fetching cleaner roster:", error);
    throw new HTTPException(500, { message: "Failed to fetch cleaner roster" });
  }
});

// GET /api/cleaner-roster/:id - Get a single roster entry
cleanerRosterRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid roster ID" });
    }

    const db = createDrizzleClient(c.env);
    
    const rosterEntry = await db
      .select()
      .from(cleanerRoster)
      .where(eq(cleanerRoster.id, id))
      .limit(1);

    if (rosterEntry.length === 0) {
      throw new HTTPException(404, { message: "Roster entry not found" });
    }

    // Parse JSON fields
    const { supervisorQuestions, mobileMessage, ...rosterData } = rosterEntry[0];
    const rosterWithParsedData = {
      ...rosterData,
      supervisorQuestions: JSON.parse(supervisorQuestions || "[]"),
      mobileMessage: mobileMessage ? JSON.parse(mobileMessage) : undefined,
    };

    return c.json({
      success: true,
      data: rosterWithParsedData,
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching roster entry:", error);
    throw new HTTPException(500, { message: "Failed to fetch roster entry" });
  }
});

// POST /api/cleaner-roster - Create a new roster entry
cleanerRosterRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createCleanerRosterSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid roster data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const rosterData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      const newRoster = await db
        .insert(cleanerRoster)
        .values({
          ...rosterData,
          supervisorQuestions: JSON.stringify(rosterData.supervisorQuestions || []),
          mobileMessage: rosterData.mobileMessage ? JSON.stringify(rosterData.mobileMessage) : undefined,
        })
        .returning();

      // Parse JSON fields for response
      const { supervisorQuestions, mobileMessage, ...rosterResponse } = newRoster[0];
      const responseData = {
        ...rosterResponse,
        supervisorQuestions: JSON.parse(supervisorQuestions || "[]"),
        mobileMessage: mobileMessage ? JSON.parse(mobileMessage) : undefined,
      };

      return c.json(
        {
          success: true,
          data: responseData,
          message: "Roster entry created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating roster entry:", error);
      throw new HTTPException(500, { message: "Failed to create roster entry" });
    }
  }
);

// PUT /api/cleaner-roster/:id - Update a roster entry
cleanerRosterRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateCleanerRosterSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid roster data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid roster ID" });
      }

      const rosterData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if roster entry exists
      const existingRoster = await db
        .select()
        .from(cleanerRoster)
        .where(eq(cleanerRoster.id, id))
        .limit(1);

      if (existingRoster.length === 0) {
        throw new HTTPException(404, { message: "Roster entry not found" });
      }

      // Prepare update data with JSON stringified fields
      const updateData: any = {
        ...rosterData,
        updatedAt: new Date(),
      };
      
      if (rosterData.supervisorQuestions !== undefined) {
        updateData.supervisorQuestions = JSON.stringify(rosterData.supervisorQuestions);
      }
      
      if (rosterData.mobileMessage !== undefined) {
        updateData.mobileMessage = rosterData.mobileMessage ? JSON.stringify(rosterData.mobileMessage) : null;
      }

      const updatedRoster = await db
        .update(cleanerRoster)
        .set(updateData)
        .where(eq(cleanerRoster.id, id))
        .returning();

      // Parse JSON fields for response
      const { supervisorQuestions, mobileMessage, ...rosterResponse } = updatedRoster[0];
      const responseData = {
        ...rosterResponse,
        supervisorQuestions: JSON.parse(supervisorQuestions || "[]"),
        mobileMessage: mobileMessage ? JSON.parse(mobileMessage) : undefined,
      };

      return c.json({
        success: true,
        data: responseData,
        message: "Roster entry updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating roster entry:", error);
      throw new HTTPException(500, { message: "Failed to update roster entry" });
    }
  }
);

// DELETE /api/cleaner-roster/:id - Delete a roster entry (hard delete)
cleanerRosterRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid roster ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if roster entry exists
    const existingRoster = await db
      .select()
      .from(cleanerRoster)
      .where(eq(cleanerRoster.id, id))
      .limit(1);

    if (existingRoster.length === 0) {
      throw new HTTPException(404, { message: "Roster entry not found" });
    }

    // Hard delete the roster entry
    await db.delete(cleanerRoster).where(eq(cleanerRoster.id, id));

    return c.json({
      success: true,
      message: "Roster entry deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting roster entry:", error);
    throw new HTTPException(500, { message: "Failed to delete roster entry" });
  }
});

export { cleanerRosterRouter };
