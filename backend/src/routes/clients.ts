import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import type { Env, Variables } from "../bindings";
import { createDrizzleClient } from "../db";
import { clients, insertClientSchema, type Client, type NewClient } from "../db/schema";

const clientsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Validation schemas
const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  company: z.string().optional(),
  abn: z.string().optional(),
  acn: z.string().optional(),
  clientInstruction: z.string().optional(),
  clientInfo: z.string().optional(),
  propertyInfo: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

// GET /api/clients - List all clients
clientsRouter.get("/", async (c) => {
  try {
    const db = createDrizzleClient(c.env);
    
    // Get query parameters for filtering
    const search = c.req.query("search");
    const company = c.req.query("company");
    
    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(like(clients.name, `%${search}%`));
    }
    if (company) {
      conditions.push(like(clients.company, `%${company}%`));
    }
    
    // Execute query with or without conditions
    const allClients = conditions.length > 0
      ? await db.select().from(clients).where(and(...conditions)).orderBy(desc(clients.createdAt))
      : await db.select().from(clients).orderBy(desc(clients.createdAt));

    return c.json({
      success: true,
      data: allClients,
      count: allClients.length,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw new HTTPException(500, { message: "Failed to fetch clients" });
  }
});

// GET /api/clients/:id - Get a single client
clientsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid client ID" });
    }

    const db = createDrizzleClient(c.env);
    
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);

    if (client.length === 0) {
      throw new HTTPException(404, { message: "Client not found" });
    }

    return c.json({
      success: true,
      data: client[0],
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error fetching client:", error);
    throw new HTTPException(500, { message: "Failed to fetch client" });
  }
});

// POST /api/clients - Create a new client
clientsRouter.post(
  "/",
  validator("json", (value, c) => {
    const parsed = createClientSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid client data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const clientData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if email already exists (if provided)
      if (clientData.email) {
        const existingClient = await db
          .select()
          .from(clients)
          .where(eq(clients.email, clientData.email))
          .limit(1);

        if (existingClient.length > 0) {
          throw new HTTPException(409, { message: "Client with this email already exists" });
        }
      }

      const newClient = await db
        .insert(clients)
        .values(clientData)
        .returning();

      return c.json(
        {
          success: true,
          data: newClient[0],
          message: "Client created successfully",
        },
        201
      );
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error creating client:", error);
      throw new HTTPException(500, { message: "Failed to create client" });
    }
  }
);

// PUT /api/clients/:id - Update a client
clientsRouter.put(
  "/:id",
  validator("json", (value, c) => {
    const parsed = updateClientSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: "Invalid client data",
        cause: parsed.error.issues,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        throw new HTTPException(400, { message: "Invalid client ID" });
      }

      const clientData = c.req.valid("json");
      const db = createDrizzleClient(c.env);

      // Check if client exists
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id))
        .limit(1);

      if (existingClient.length === 0) {
        throw new HTTPException(404, { message: "Client not found" });
      }

      // Check if email already exists (if being updated)
      if (clientData.email && clientData.email !== existingClient[0].email) {
        const emailExists = await db
          .select()
          .from(clients)
          .where(eq(clients.email, clientData.email))
          .limit(1);

        if (emailExists.length > 0) {
          throw new HTTPException(409, { message: "Client with this email already exists" });
        }
      }

      const updatedClient = await db
        .update(clients)
        .set({
          ...clientData,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, id))
        .returning();

      return c.json({
        success: true,
        data: updatedClient[0],
        message: "Client updated successfully",
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      console.error("Error updating client:", error);
      throw new HTTPException(500, { message: "Failed to update client" });
    }
  }
);

// DELETE /api/clients/:id - Delete a client
clientsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      throw new HTTPException(400, { message: "Invalid client ID" });
    }

    const db = createDrizzleClient(c.env);

    // Check if client exists
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);

    if (existingClient.length === 0) {
      throw new HTTPException(404, { message: "Client not found" });
    }

    // Delete the client
    await db.delete(clients).where(eq(clients.id, id));

    return c.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error("Error deleting client:", error);
    throw new HTTPException(500, { message: "Failed to delete client" });
  }
});

export { clientsRouter };
 