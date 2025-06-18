import type { Hono } from "hono";
import type { Env, Variables } from "../bindings";
import { authRouter } from "./auth";
import { cleanerRosterRouter } from "./cleanerRoster";
import { clientsRouter } from "./clients";
import { locationsRouter } from "./locations";
import { shiftsRouter } from "./shifts";
import { staffRouter } from "./staff";
import { teamsRouter } from "./teams";
import { usersRouter } from "./users";

/**
 * Register all API routes with the main app
 */
export function registerRoutes(app: Hono<{ Bindings: Env; Variables: Variables }>) {
  // Authentication routes
  app.route("/api/auth", authRouter);
  
  // Users API routes
  app.route("/api/users", usersRouter);
  
  // Calendar/Shift management routes
  app.route("/api/shifts", shiftsRouter);
  
  // Staff management routes
  app.route("/api/staff", staffRouter);
  
  // Cleaner roster management routes
  app.route("/api/cleaner-roster", cleanerRosterRouter);
  
  // Client management routes
  app.route("/api/clients", clientsRouter);
  
  // Location management routes
  app.route("/api/locations", locationsRouter);
  
  // Team management routes
  app.route("/api/teams", teamsRouter);
}
