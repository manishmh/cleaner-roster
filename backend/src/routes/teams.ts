import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { insertTeamSchema, teams, type NewTeam, type Team } from "../db/schema";

const teamsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateTeamSchema = createTeamSchema.partial();

// GET /api/teams - List all teams
teamsRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Get query parameters for filtering
    const search = c.req.query("search");
    const isActive = c.req.query("isActive");
    
    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(like(teams.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      conditions.push(eq(teams.isActive, isActive === "true"));
    }
    
    // Execute query with or without conditions
    const allTeams = conditions.length > 0
      ? await db.select().from(teams).where(and(...conditions)).orderBy(desc(teams.createdAt))
      : await db.select().from(teams).orderBy(desc(teams.createdAt));

    return c.json({
      success: true,
      data: allTeams,
      count: allTeams.length,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw new HTTPException(500, { message: "Failed to fetch teams" });
  }
});

// GET /api/teams/:id - Get a single team
teamsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid team ID" });
    }

    const db = createDrizzleClient(c.env);
    
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (team.length === 0) {
      throw new HTTPException(404, { message: "Team not found" });
    }

    return c.json({
      success: true,
      data: team[0],
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching team:", error);
    throw new HTTPException(500, { message: "Failed to fetch team" });
  }
});

// POST /api/teams - Create a new team
teamsRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createTeamSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid team data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const teamData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      const newTeam = await db
        .insert(teams)
        .values(teamData)
        .returning();

      return c.json(
        {
          success: true,
          data: newTeam[0],
          message: "Team created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating team:", error);
      throw new HTTPException(500, { message: "Failed to create team" });
    }
  }
);

// PUT /api/teams/:id - Update a team
teamsRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateTeamSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid team data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid team ID" });
      }

      const teamData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if team exists
      const existingTeam = await db
        .select()
        .from(teams)
        .where(eq(teams.id, id))
        .limit(1);

      if (existingTeam.length === 0) {
        throw new HTTPException(404, { message: "Team not found" });
      }

      const updatedTeam = await db
        .update(teams)
        .set({
          ...teamData,
          updatedAt: new Date(),
        })
        .where(eq(teams.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedTeam[0],
        message: "Team updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating team:", error);
      throw new HTTPException(500, { message: "Failed to update team" });
    }
  }
);

// DELETE /api/teams/:id - Delete a team
teamsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid team ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);

    if (existingTeam.length === 0) {
      throw new HTTPException(404, { message: "Team not found" });
    }

    // Soft delete by setting isActive to false
    await db
      .update(teams)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id));

    return c.json({
      success: true,
      message: "Team deactivated successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting team:", error);
    throw new HTTPException(500, { message: "Failed to delete team" });
  }
});

export { teamsRouter };
 