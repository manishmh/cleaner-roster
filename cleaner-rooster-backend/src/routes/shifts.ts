import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import {
    clients,
    insertShiftSchema,
    locations,
    shiftClients,
    shiftInstructions,
    shiftLocations,
    shiftMessages,
    shifts,
    shiftStaff,
    shiftTeams,
    staff,
    teams,
    type NewShift,
    type Shift,
} from "../db/schema";

const shiftsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createShiftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time"),
  theme: z.enum(["Danger", "Warning", "Success", "Primary"]).default("Primary"),
  assignmentType: z.enum(["individual", "team"]).default("individual"),
  isPublished: z.boolean().default(false),
  includeLocation: z.boolean().default(false),
  shiftInstructions: z.string().optional(),
  staffIds: z.array(z.number()).default([]),
  clientIds: z.array(z.number()).default([]),
  teamIds: z.array(z.number()).default([]),
  locationIds: z.array(z.number()).default([]),
  supervisorIds: z.array(z.number()).default([]),
  teamMemberIds: z.array(z.number()).default([]),
});

const updateShiftSchema = createShiftSchema.partial().extend({
  jobStarted: z.boolean().optional(),
  jobPaused: z.boolean().optional(),
  jobStartedAt: z.string().datetime().optional(),
  jobEndedAt: z.string().datetime().optional(),
  scheduledInTime: z.string().datetime().optional(),
  scheduledOutTime: z.string().datetime().optional(),
  loggedInTime: z.string().datetime().optional(),
  loggedOutTime: z.string().datetime().optional(),
  pauseLog: z.string().optional(),
});

// GET /api/shifts - List all shifts with relationships
shiftsRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Parse query parameters
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!) : undefined;
    const offset = c.req.query("offset") ? parseInt(c.req.query("offset")!) : 0;
    const includeRelations = c.req.query("includeRelations") === "true";
    
    // Build complete query based on conditions to avoid type issues
    let allShifts;
    
    if (startDate && endDate) {
      const baseQuery = db
        .select()
        .from(shifts)
        .where(and(
          gte(shifts.startTime, new Date(startDate)),
          lte(shifts.startTime, new Date(endDate + 'T23:59:59.999Z'))
        ))
        .orderBy(desc(shifts.startTime));
      
      if (limit && offset > 0) {
        allShifts = await baseQuery.limit(limit).offset(offset);
      } else if (limit) {
        allShifts = await baseQuery.limit(limit);
      } else if (offset > 0) {
        allShifts = await baseQuery.offset(offset);
      } else {
        allShifts = await baseQuery;
      }
    } else if (startDate) {
      const baseQuery = db
        .select()
        .from(shifts)
        .where(gte(shifts.startTime, new Date(startDate)))
        .orderBy(desc(shifts.startTime));
      
      if (limit && offset > 0) {
        allShifts = await baseQuery.limit(limit).offset(offset);
      } else if (limit) {
        allShifts = await baseQuery.limit(limit);
      } else if (offset > 0) {
        allShifts = await baseQuery.offset(offset);
      } else {
        allShifts = await baseQuery;
      }
    } else if (endDate) {
      const baseQuery = db
        .select()
        .from(shifts)
        .where(lte(shifts.startTime, new Date(endDate + 'T23:59:59.999Z')))
        .orderBy(desc(shifts.startTime));
      
      if (limit && offset > 0) {
        allShifts = await baseQuery.limit(limit).offset(offset);
      } else if (limit) {
        allShifts = await baseQuery.limit(limit);
      } else if (offset > 0) {
        allShifts = await baseQuery.offset(offset);
      } else {
        allShifts = await baseQuery;
      }
    } else {
      const baseQuery = db
        .select()
        .from(shifts)
        .orderBy(desc(shifts.startTime));
      
      if (limit && offset > 0) {
        allShifts = await baseQuery.limit(limit).offset(offset);
      } else if (limit) {
        allShifts = await baseQuery.limit(limit);
      } else if (offset > 0) {
        allShifts = await baseQuery.offset(offset);
      } else {
        allShifts = await baseQuery;
      }
    }

    // If relations are not needed, return basic shift data
    if (!includeRelations) {
      return c.json({
        success: true,
        data: allShifts,
        count: allShifts.length,
      });
    }

    // Get related data for each shift
    const shiftsWithRelations = await Promise.all(
      allShifts.map(async (shift) => {
        const [
          shiftStaffData,
          shiftClientsData,
          shiftTeamsData,
          shiftLocationsData,
          shiftInstructionsData,
          shiftMessagesData,
        ] = await Promise.all([
          // Get staff assigned to this shift
          db
            .select({
              id: staff.id,
              name: staff.name,
              email: staff.email,
              role: staff.role,
              roleInShift: shiftStaff.roleInShift,
            })
            .from(shiftStaff)
            .innerJoin(staff, eq(shiftStaff.staffId, staff.id))
            .where(eq(shiftStaff.shiftId, shift.id)),
          
          // Get clients for this shift
          db
            .select({
              id: clients.id,
              name: clients.name,
              email: clients.email,
              company: clients.company,
            })
            .from(shiftClients)
            .innerJoin(clients, eq(shiftClients.clientId, clients.id))
            .where(eq(shiftClients.shiftId, shift.id)),
          
          // Get teams for this shift
          db
            .select({
              id: teams.id,
              name: teams.name,
              description: teams.description,
            })
            .from(shiftTeams)
            .innerJoin(teams, eq(shiftTeams.teamId, teams.id))
            .where(eq(shiftTeams.shiftId, shift.id)),
          
          // Get locations for this shift
          db
            .select({
              id: locations.id,
              unit: locations.unit,
              name: locations.name,
              accuracy: locations.accuracy,
              comment: locations.comment,
              address: locations.address,
              formattedAddress: locations.formattedAddress,
            })
            .from(shiftLocations)
            .innerJoin(locations, eq(shiftLocations.locationId, locations.id))
            .where(eq(shiftLocations.shiftId, shift.id)),
          
          // Get instructions for this shift
          db
            .select()
            .from(shiftInstructions)
            .where(eq(shiftInstructions.shiftId, shift.id)),
          
          // Get messages for this shift
          db
            .select()
            .from(shiftMessages)
            .where(eq(shiftMessages.shiftId, shift.id))
            .orderBy(desc(shiftMessages.createdAt)),
        ]);

        return {
          ...shift,
          staff: shiftStaffData,
          clients: shiftClientsData,
          teams: shiftTeamsData,
          locations: shiftLocationsData,
          instructions: shiftInstructionsData,
          messages: shiftMessagesData,
        };
      })
    );

    return c.json({
      success: true,
      data: shiftsWithRelations,
      count: shiftsWithRelations.length,
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    throw new HTTPException(500, { message: "Failed to fetch shifts" });
  }
});

// GET /api/shifts/:id - Get a single shift with all relationships
shiftsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const db = createDrizzleClient(c.env);
    
    // Get the shift
    const shiftResult = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (shiftResult.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    const shift = shiftResult[0];

    // Get all related data
    const [
      shiftStaffData,
      shiftClientsData,
      shiftTeamsData,
      shiftLocationsData,
      shiftInstructionsData,
      shiftMessagesData,
    ] = await Promise.all([
      db
        .select({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          roleInShift: shiftStaff.roleInShift,
        })
        .from(shiftStaff)
        .innerJoin(staff, eq(shiftStaff.staffId, staff.id))
        .where(eq(shiftStaff.shiftId, shift.id)),
      
      db
        .select()
        .from(shiftClients)
        .innerJoin(clients, eq(shiftClients.clientId, clients.id))
        .where(eq(shiftClients.shiftId, shift.id)),
      
      db
        .select()
        .from(shiftTeams)
        .innerJoin(teams, eq(shiftTeams.teamId, teams.id))
        .where(eq(shiftTeams.shiftId, shift.id)),
      
      db
        .select({
          id: locations.id,
          unit: locations.unit,
          name: locations.name,
          accuracy: locations.accuracy,
          comment: locations.comment,
          address: locations.address,
          formattedAddress: locations.formattedAddress,
        })
        .from(shiftLocations)
        .innerJoin(locations, eq(shiftLocations.locationId, locations.id))
        .where(eq(shiftLocations.shiftId, shift.id)),
      
      db
        .select()
        .from(shiftInstructions)
        .where(eq(shiftInstructions.shiftId, shift.id)),
      
      db
        .select()
        .from(shiftMessages)
        .where(eq(shiftMessages.shiftId, shift.id))
        .orderBy(desc(shiftMessages.createdAt)),
    ]);

    const shiftWithRelations = {
      ...shift,
      staff: shiftStaffData,
      clients: shiftClientsData,
      teams: shiftTeamsData,
      locations: shiftLocationsData,
      instructions: shiftInstructionsData,
      messages: shiftMessagesData,
    };

    return c.json({
      success: true,
      data: shiftWithRelations,
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching shift:", error);
    throw new HTTPException(500, { message: "Failed to fetch shift" });
  }
});

// POST /api/shifts - Create a new shift
shiftsRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createShiftSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid shift data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const shiftData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Validate that all referenced IDs exist
      const validationPromises = [];

      // Check staff IDs
      if (shiftData.staffIds.length > 0) {
        validationPromises.push(
          db.select({ id: staff.id }).from(staff).where(
            shiftData.staffIds.length === 1 
              ? eq(staff.id, shiftData.staffIds[0])
              : inArray(staff.id, shiftData.staffIds)
          )
        );
      }

      // Check supervisor IDs
      if (shiftData.supervisorIds.length > 0) {
        validationPromises.push(
          db.select({ id: staff.id }).from(staff).where(
            shiftData.supervisorIds.length === 1 
              ? eq(staff.id, shiftData.supervisorIds[0])
              : inArray(staff.id, shiftData.supervisorIds)
          )
        );
      }

      // Check team member IDs
      if (shiftData.teamMemberIds.length > 0) {
        validationPromises.push(
          db.select({ id: staff.id }).from(staff).where(
            shiftData.teamMemberIds.length === 1 
              ? eq(staff.id, shiftData.teamMemberIds[0])
              : inArray(staff.id, shiftData.teamMemberIds)
          )
        );
      }

      // Check client IDs
      if (shiftData.clientIds.length > 0) {
        validationPromises.push(
          db.select({ id: clients.id }).from(clients).where(
            shiftData.clientIds.length === 1 
              ? eq(clients.id, shiftData.clientIds[0])
              : inArray(clients.id, shiftData.clientIds)
          )
        );
      }

      // Check team IDs
      if (shiftData.teamIds.length > 0) {
        validationPromises.push(
          db.select({ id: teams.id }).from(teams).where(
            shiftData.teamIds.length === 1 
              ? eq(teams.id, shiftData.teamIds[0])
              : inArray(teams.id, shiftData.teamIds)
          )
        );
      }

      // Check location IDs
      if (shiftData.locationIds.length > 0) {
        validationPromises.push(
          db.select({ id: locations.id }).from(locations).where(
            shiftData.locationIds.length === 1 
              ? eq(locations.id, shiftData.locationIds[0])
              : inArray(locations.id, shiftData.locationIds)
          )
        );
      }

      // Execute all validation queries
      if (validationPromises.length > 0) {
        const validationResults = await Promise.all(validationPromises);
        let resultIndex = 0;

        // Check staff IDs
        if (shiftData.staffIds.length > 0) {
          const foundStaff = validationResults[resultIndex++];
          const foundStaffIds = foundStaff.map(s => s.id);
          const missingStaffIds = shiftData.staffIds.filter(id => !foundStaffIds.includes(id));
          if (missingStaffIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid staff IDs: ${missingStaffIds.join(', ')}. These staff members do not exist.` 
            });
          }
        }

        // Check supervisor IDs
        if (shiftData.supervisorIds.length > 0) {
          const foundSupervisors = validationResults[resultIndex++];
          const foundSupervisorIds = foundSupervisors.map(s => s.id);
          const missingSupervisorIds = shiftData.supervisorIds.filter(id => !foundSupervisorIds.includes(id));
          if (missingSupervisorIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid supervisor IDs: ${missingSupervisorIds.join(', ')}. These supervisors do not exist.` 
            });
          }
        }

        // Check team member IDs
        if (shiftData.teamMemberIds.length > 0) {
          const foundTeamMembers = validationResults[resultIndex++];
          const foundTeamMemberIds = foundTeamMembers.map(s => s.id);
          const missingTeamMemberIds = shiftData.teamMemberIds.filter(id => !foundTeamMemberIds.includes(id));
          if (missingTeamMemberIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid team member IDs: ${missingTeamMemberIds.join(', ')}. These team members do not exist.` 
            });
          }
        }

        // Check client IDs
        if (shiftData.clientIds.length > 0) {
          const foundClients = validationResults[resultIndex++];
          const foundClientIds = foundClients.map(c => c.id);
          const missingClientIds = shiftData.clientIds.filter(id => !foundClientIds.includes(id));
          if (missingClientIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid client IDs: ${missingClientIds.join(', ')}. These clients do not exist.` 
            });
          }
        }

        // Check team IDs
        if (shiftData.teamIds.length > 0) {
          const foundTeams = validationResults[resultIndex++];
          const foundTeamIds = foundTeams.map(t => t.id);
          const missingTeamIds = shiftData.teamIds.filter(id => !foundTeamIds.includes(id));
          if (missingTeamIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid team IDs: ${missingTeamIds.join(', ')}. These teams do not exist.` 
            });
          }
        }

        // Check location IDs
        if (shiftData.locationIds.length > 0) {
          const foundLocations = validationResults[resultIndex++];
          const foundLocationIds = foundLocations.map(l => l.id);
          const missingLocationIds = shiftData.locationIds.filter(id => !foundLocationIds.includes(id));
          if (missingLocationIds.length > 0) {
            throw new HTTPException(400, { 
              message: `Invalid location IDs: ${missingLocationIds.join(', ')}. These locations do not exist.` 
            });
          }
        }
      }

      // Create the shift first
      const newShift = await db
        .insert(shifts)
        .values({
          title: shiftData.title,
          startTime: new Date(shiftData.startTime),
          endTime: new Date(shiftData.endTime),
          theme: shiftData.theme,
          assignmentType: shiftData.assignmentType,
          isPublished: shiftData.isPublished,
          includeLocation: shiftData.includeLocation,
          shiftInstructions: shiftData.shiftInstructions,
          createdBy: null, // Allow NULL until users are implemented
        })
        .returning();

      const shiftId = newShift[0].id;

      // Create relationships separately
      const promises = [];

      // Add staff assignments
      if (shiftData.staffIds.length > 0) {
        promises.push(
          db.insert(shiftStaff).values(
            shiftData.staffIds.map((staffId) => ({
              shiftId,
              staffId,
              roleInShift: "assigned",
            }))
          )
        );
      }

      // Add supervisor assignments
      if (shiftData.supervisorIds.length > 0) {
        promises.push(
          db.insert(shiftStaff).values(
            shiftData.supervisorIds.map((staffId) => ({
              shiftId,
              staffId,
              roleInShift: "supervisor",
            }))
          )
        );
      }

      // Add team member assignments
      if (shiftData.teamMemberIds.length > 0) {
        promises.push(
          db.insert(shiftStaff).values(
            shiftData.teamMemberIds.map((staffId) => ({
              shiftId,
              staffId,
              roleInShift: "team_member",
            }))
          )
        );
      }

      // Add client assignments
      if (shiftData.clientIds.length > 0) {
        promises.push(
          db.insert(shiftClients).values(
            shiftData.clientIds.map((clientId) => ({
              shiftId,
              clientId,
            }))
          )
        );
      }

      // Add team assignments
      if (shiftData.teamIds.length > 0) {
        promises.push(
          db.insert(shiftTeams).values(
            shiftData.teamIds.map((teamId) => ({
              shiftId,
              teamId,
            }))
          )
        );
      }

      // Add location assignments
      if (shiftData.locationIds.length > 0) {
        promises.push(
          db.insert(shiftLocations).values(
            shiftData.locationIds.map((locationId) => ({
              shiftId,
              locationId,
            }))
          )
        );
      }

      // Create initial instruction if shiftInstructions is provided
      if (shiftData.shiftInstructions && shiftData.shiftInstructions.trim()) {
        promises.push(
          db.insert(shiftInstructions).values({
            shiftId,
            instructionText: shiftData.shiftInstructions.trim(),
            instructionType: "text", // Default type for shift creation instructions
            createdBy: null, // Allow NULL until users are implemented
          })
        );
      }

      await Promise.all(promises);

      const result = newShift[0];

      return c.json(
        {
          success: true,
          data: result,
          message: "Shift created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating shift:", error);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      throw new HTTPException(500, { message: "Failed to create shift", cause: error instanceof Error ? error.message : String(error) });
    }
  }
);

// PUT /api/shifts/:id - Update a shift
shiftsRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateShiftSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid shift data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid shift ID" });
      }

      const shiftData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if shift exists
      const existingShift = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .limit(1);

      if (existingShift.length === 0) {
        throw new HTTPException(404, { message: "Shift not found" });
      }

      // Update the shift
      const updatedShift = await db
        .update(shifts)
        .set({
          ...shiftData,
          startTime: shiftData.startTime ? new Date(shiftData.startTime) : undefined,
          endTime: shiftData.endTime ? new Date(shiftData.endTime) : undefined,
          jobStartedAt: shiftData.jobStartedAt ? new Date(shiftData.jobStartedAt) : undefined,
          jobEndedAt: shiftData.jobEndedAt ? new Date(shiftData.jobEndedAt) : undefined,
          scheduledInTime: shiftData.scheduledInTime ? new Date(shiftData.scheduledInTime) : undefined,
          scheduledOutTime: shiftData.scheduledOutTime ? new Date(shiftData.scheduledOutTime) : undefined,
          loggedInTime: shiftData.loggedInTime ? new Date(shiftData.loggedInTime) : undefined,
          loggedOutTime: shiftData.loggedOutTime ? new Date(shiftData.loggedOutTime) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(shifts.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedShift[0],
        message: "Shift updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating shift:", error);
      throw new HTTPException(500, { message: "Failed to update shift" });
    }
  }
);

// DELETE /api/shifts/:id/teams/:teamId - Remove a team from a shift
shiftsRouter.delete("/:id/teams/:teamId", async (c) => {
  try {
    const shiftId = parseInt(c.req.param("id"));
    const teamId = parseInt(c.req.param("teamId"));
    
    if (isNaN(shiftId) || isNaN(teamId)) {
      throw new HTTPException(400, { message: "Invalid shift ID or team ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if shift exists
    const existingShift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId))
      .limit(1);

    if (existingShift.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    // Check if team is assigned to this shift
    const existingAssignment = await db
      .select()
      .from(shiftTeams)
      .where(and(eq(shiftTeams.shiftId, shiftId), eq(shiftTeams.teamId, teamId)))
      .limit(1);

    if (existingAssignment.length === 0) {
      throw new HTTPException(404, { message: "Team not assigned to this shift" });
    }

    // Remove the team assignment
    await db
      .delete(shiftTeams)
      .where(and(eq(shiftTeams.shiftId, shiftId), eq(shiftTeams.teamId, teamId)));

    return c.json({
      success: true,
      message: "Team removed from shift successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error removing team from shift:", error);
    throw new HTTPException(500, { message: "Failed to remove team from shift" });
  }
});

// POST /api/shifts/:id/cancel - Cancel a shift (assign to Cover staff)
shiftsRouter.post("/:id/cancel", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if shift exists
    const existingShift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (existingShift.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    // Find Cover staff member
    const coverStaff = await db
      .select()
      .from(staff)
      .where(eq(staff.name, "Cover"))
      .limit(1);

    if (coverStaff.length === 0) {
      throw new HTTPException(404, { 
        message: "Cover staff not found. Please create a Cover staff member first." 
      });
    }

    const coverStaffId = coverStaff[0].id;

    // Remove all current staff and team assignments
    await Promise.all([
      db.delete(shiftStaff).where(eq(shiftStaff.shiftId, id)),
      db.delete(shiftTeams).where(eq(shiftTeams.shiftId, id)),
    ]);

    // Assign shift to Cover staff
    await db.insert(shiftStaff).values({
      shiftId: id,
      staffId: coverStaffId,
      roleInShift: "assigned",
    });

    // Update shift theme to Danger (red) to indicate cancellation
    await db
      .update(shifts)
      .set({
        theme: "Danger",
        updatedAt: new Date(),
      })
      .where(eq(shifts.id, id));

    return c.json({
      success: true,
      message: "Shift cancelled and assigned to Cover staff successfully",
      data: {
        shiftId: id,
        coverStaffId: coverStaffId,
      },
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error cancelling shift:", error);
    throw new HTTPException(500, { message: "Failed to cancel shift" });
  }
});

// DELETE /api/shifts/:id - Delete a shift
shiftsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if shift exists
    const existingShift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (existingShift.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    // Delete the shift (cascade will handle relationships)
    await db.delete(shifts).where(eq(shifts.id, id));

    return c.json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting shift:", error);
    throw new HTTPException(500, { message: "Failed to delete shift" });
  }
});

// POST /api/shifts/:id/instructions - Add instruction to shift
shiftsRouter.post("/:id/instructions", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const { instructionText, instructionType = "text" } = await c.req.json();
    
    if (!instructionText) {
      throw new HTTPException(400, { message: "Instruction text is required" });
    }

    const db = createDrizzleClient(c.env);

    const newInstruction = await db
      .insert(shiftInstructions)
      .values({
        shiftId: id,
        instructionText,
        instructionType,
        createdBy: null, // Set to null to avoid foreign key constraint issues
      })
      .returning();

    return c.json({
      success: true,
      data: newInstruction[0],
      message: "Instruction added successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error adding instruction:", error);
    throw new HTTPException(500, { message: "Failed to add instruction" });
  }
});

// POST /api/shifts/:id/messages - Add message to shift
shiftsRouter.post("/:id/messages", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const { messageText, createdBy } = await c.req.json();
    
    if (!messageText) {
      throw new HTTPException(400, { message: "Message text is required" });
    }

    const db = createDrizzleClient(c.env);

    // Create message text with staff info embedded as JSON metadata
    const messageWithStaffInfo = {
      text: messageText,
      staffId: createdBy || null
    };

    const newMessage = await db
      .insert(shiftMessages)
      .values({
        shiftId: id,
        messageText: JSON.stringify(messageWithStaffInfo),
        createdBy: null, // Set to null to avoid foreign key constraint issues
      })
      .returning();

    return c.json({
      success: true,
      data: newMessage[0],
      message: "Message added successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error adding message:", error);
    throw new HTTPException(500, { message: "Failed to add message" });
  }
});

// PUT /api/shifts/:id/client - Update shift client assignment
shiftsRouter.put("/:id/client", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const { clientId } = await c.req.json();

    const db = createDrizzleClient(c.env);

    // Check if shift exists
    const existingShift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (existingShift.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    // Remove existing client assignments for this shift
    await db.delete(shiftClients).where(eq(shiftClients.shiftId, id));

    // If clientId is provided, add new client assignment
    if (clientId) {
      // Check if client exists
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      if (existingClient.length === 0) {
        throw new HTTPException(404, { message: "Client not found" });
      }

      await db.insert(shiftClients).values({
        shiftId: id,
        clientId: clientId,
      });
    }

    return c.json({
      success: true,
      message: "Shift client assignment updated successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error updating shift client assignment:", error);
    throw new HTTPException(500, { message: "Failed to update shift client assignment" });
  }
});

// PUT /api/shifts/:id/location - Update shift location
shiftsRouter.put("/:id/location", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid shift ID" });
    }

    const { locationId } = await c.req.json();
    
    if (!locationId) {
      throw new HTTPException(400, { message: "Location ID is required" });
    }

    const db = createDrizzleClient(c.env);

    // Check if shift exists
    const existingShift = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (existingShift.length === 0) {
      throw new HTTPException(404, { message: "Shift not found" });
    }

    // Check if location exists
    const existingLocation = await db
      .select()
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (existingLocation.length === 0) {
      throw new HTTPException(404, { message: "Location not found" });
    }

    // Remove existing location assignments for this shift
    await db.delete(shiftLocations).where(eq(shiftLocations.shiftId, id));

    // Add new location assignment
    await db.insert(shiftLocations).values({
      shiftId: id,
      locationId: locationId,
    });

    return c.json({
      success: true,
      message: "Shift location updated successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error updating shift location:", error);
    throw new HTTPException(500, { message: "Failed to update shift location" });
  }
});

export { shiftsRouter };
