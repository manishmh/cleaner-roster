import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { insertStaffSchema, staff, type NewStaff, type Staff } from "../db/schema";

const staffRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  role: z.enum(["cleaner", "supervisor", "staff"]).default("cleaner"),
  access: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updateStaffSchema = createStaffSchema.partial();

// GET /api/staff - List all staff members
staffRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Get query parameters for filtering
    const role = c.req.query("role");
    const isActive = c.req.query("isActive");
    const search = c.req.query("search");
    
    // Build conditions
    const conditions = [];
    if (role) {
      conditions.push(eq(staff.role, role));
    }
    if (isActive !== undefined) {
      conditions.push(eq(staff.isActive, isActive === "true"));
    }
    if (search) {
      conditions.push(like(staff.name, `%${search}%`));
    }
    
    // Execute query with or without conditions
    const allStaff = conditions.length > 0
      ? await db.select().from(staff).where(and(...conditions)).orderBy(desc(staff.createdAt))
      : await db.select().from(staff).orderBy(desc(staff.createdAt));

    // Parse access JSON for each staff member
    const staffWithParsedAccess = allStaff.map(({ access, ...staffMember }) => ({
      ...staffMember,
      access: JSON.parse(access || "[]"),
    }));

    return c.json({
      success: true,
      data: staffWithParsedAccess,
      count: staffWithParsedAccess.length,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw new HTTPException(500, { message: "Failed to fetch staff" });
  }
});

// GET /api/staff/:id - Get a single staff member
staffRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid staff ID" });
    }

    const db = createDrizzleClient(c.env);
    
    const staffMember = await db
      .select()
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1);

    if (staffMember.length === 0) {
      throw new HTTPException(404, { message: "Staff member not found" });
    }

    // Parse access JSON
    const { access, ...staffData } = staffMember[0];
    const staffWithParsedAccess = {
      ...staffData,
      access: JSON.parse(access || "[]"),
    };

    return c.json({
      success: true,
      data: staffWithParsedAccess,
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching staff member:", error);
    throw new HTTPException(500, { message: "Failed to fetch staff member" });
  }
});

// POST /api/staff - Create a new staff member
staffRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createStaffSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid staff data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const staffData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if email already exists (if provided)
      if (staffData.email) {
        const existingStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.email, staffData.email))
          .limit(1);

        if (existingStaff.length > 0) {
          throw new HTTPException(409, { message: "Staff member with this email already exists" });
        }
      }

      const newStaff = await db
        .insert(staff)
        .values({
          ...staffData,
          access: JSON.stringify(staffData.access || []),
        })
        .returning();

      // Parse access JSON for response
      const { access, ...staffResponse } = newStaff[0];
      const responseData = {
        ...staffResponse,
        access: JSON.parse(access || "[]"),
      };

      return c.json(
        {
          success: true,
          data: responseData,
          message: "Staff member created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating staff member:", error);
      throw new HTTPException(500, { message: "Failed to create staff member" });
    }
  }
);

// PUT /api/staff/:id - Update a staff member
staffRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateStaffSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid staff data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid staff ID" });
      }

      const staffData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if staff member exists
      const existingStaff = await db
        .select()
        .from(staff)
        .where(eq(staff.id, id))
        .limit(1);

      if (existingStaff.length === 0) {
        throw new HTTPException(404, { message: "Staff member not found" });
      }

      // Check if email already exists (if being updated)
      if (staffData.email && staffData.email !== existingStaff[0].email) {
        const emailExists = await db
          .select()
          .from(staff)
          .where(eq(staff.email, staffData.email))
          .limit(1);

        if (emailExists.length > 0) {
          throw new HTTPException(409, { message: "Staff member with this email already exists" });
        }
      }

      // Prepare update data with JSON stringified access
      const updateData: any = {
        ...staffData,
        updatedAt: new Date(),
      };
      
      if (staffData.access !== undefined) {
        updateData.access = JSON.stringify(staffData.access);
      }

      const updatedStaff = await db
        .update(staff)
        .set(updateData)
        .where(eq(staff.id, id))
        .returning();

      // Parse access JSON for response
      const { access, ...staffResponse } = updatedStaff[0];
      const responseData = {
        ...staffResponse,
        access: JSON.parse(access || "[]"),
      };

      return c.json({
        success: true,
        data: responseData,
        message: "Staff member updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating staff member:", error);
      throw new HTTPException(500, { message: "Failed to update staff member" });
    }
  }
);

// DELETE /api/staff/:id - Delete a staff member (hard delete)
staffRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid staff ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if staff member exists
    const existingStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.id, id))
      .limit(1);

    if (existingStaff.length === 0) {
      throw new HTTPException(404, { message: "Staff member not found" });
    }

    // Hard delete the staff member
    await db.delete(staff).where(eq(staff.id, id));

    return c.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting staff member:", error);
    throw new HTTPException(500, { message: "Failed to delete staff member" });
  }
});

export { staffRouter };
 