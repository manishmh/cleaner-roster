import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  bio: text("bio"),
  avatar: text("avatar"), // URL to avatar image
  // Address fields
  country: text("country"),
  city: text("city"),
  postalCode: text("postal_code"),
  taxId: text("tax_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// New tables for calendar/shift management

// Staff table
export const staff = sqliteTable("staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("cleaner"), // cleaner, supervisor, staff
  access: text("access").notNull().default("[]"), // JSON array of access permissions
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Clients table
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  company: text("company"),
  abn: text("abn"),
  acn: text("acn"),
  clientInstruction: text("client_instruction"),
  clientInfo: text("client_info"),
  propertyInfo: text("property_info"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Teams table
export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Locations table
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unit: text("unit").notNull(),
  name: text("name").notNull(),
  accuracy: integer("accuracy").notNull().default(100), // percentage
  comment: text("comment"),
  address: text("address"),
  // Google Maps specific fields
  latitude: real("latitude"), // For distance calculations
  longitude: real("longitude"), // For distance calculations
  placeId: text("place_id"), // Google Place ID for unique identification
  formattedAddress: text("formatted_address"), // Full formatted address from Google
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }), // Track usage for history
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Main shifts table
export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  theme: text("theme").notNull().default("Primary"), // Danger, Warning, Success, Primary
  assignmentType: text("assignment_type").notNull().default("individual"), // individual, team
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  includeLocation: integer("include_location", { mode: "boolean" }).notNull().default(false),
  shiftInstructions: text("shift_instructions"),
  jobStarted: integer("job_started", { mode: "boolean" }).notNull().default(false),
  jobStartedAt: integer("job_started_at", { mode: "timestamp" }),
  jobPaused: integer("job_paused", { mode: "boolean" }).notNull().default(false),
  jobEndedAt: integer("job_ended_at", { mode: "timestamp" }),
  // Scheduled times (for time tracking interface)
  scheduledInTime: integer("scheduled_in_time", { mode: "timestamp" }),
  scheduledOutTime: integer("scheduled_out_time", { mode: "timestamp" }),
  // Logged times (actual times when user starts/ends/pauses)
  loggedInTime: integer("logged_in_time", { mode: "timestamp" }),
  loggedOutTime: integer("logged_out_time", { mode: "timestamp" }),
  pauseLog: text("pause_log"), // JSON string to store pause/resume timestamps
  // Travel distance fields
  travelDistance: real("travel_distance"), // in kilometers
  travelDuration: integer("travel_duration"), // in minutes
  travelFromLocation: text("travel_from_location"), // address of previous location
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relationship tables

// Many-to-many: shifts and staff
export const shiftStaff = sqliteTable("shift_staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  roleInShift: text("role_in_shift").notNull().default("assigned"), // assigned, supervisor, team_member
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Many-to-many: shifts and clients
export const shiftClients = sqliteTable("shift_clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Many-to-many: shifts and teams
export const shiftTeams = sqliteTable("shift_teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Many-to-many: shifts and locations
export const shiftLocations = sqliteTable("shift_locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  locationId: integer("location_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Many-to-many: teams and staff (team members)
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // member, supervisor
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Shift instructions table
export const shiftInstructions = sqliteTable("shift_instructions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  instructionText: text("instruction_text").notNull(),
  instructionType: text("instruction_type").notNull().default("text"), // ok, yes/no, text
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Shift messages table
export const shiftMessages = sqliteTable("shift_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: "cascade" }),
  messageText: text("message_text").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// New cleaner_roster table
export const cleanerRoster = sqliteTable("cleaner_roster", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientLink: text("client_link").notNull(),
  bookingDate: text("booking_date").notNull(),
  bookingTime: text("booking_time").notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  loggedTime: text("logged_time"),
  inTime: text("in_time"),
  outTime: text("out_time"),
  locationAddress: text("location_address").notNull(),
  locationGoogleMapLink: text("location_google_map_link"),
  startLocationAddress: text("start_location_address"),
  startLocationGoogleMapLink: text("start_location_google_map_link"),
  endLocationAddress: text("end_location_address"),
  endLocationGoogleMapLink: text("end_location_google_map_link"),
  shiftInstructions: text("shift_instructions"),
  supervisorQuestions: text("supervisor_questions").notNull().default("[]"), // JSON array
  mobileMessage: text("mobile_message"), // JSON object
  status: text("status").notNull().default("Pending"), // Pending, In Progress, Completed, Cancelled
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertStaffSchema = createInsertSchema(staff);
export const selectStaffSchema = createSelectSchema(staff);

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertTeamSchema = createInsertSchema(teams);
export const selectTeamSchema = createSelectSchema(teams);

export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);

export const insertShiftSchema = createInsertSchema(shifts);
export const selectShiftSchema = createSelectSchema(shifts);

export const insertShiftStaffSchema = createInsertSchema(shiftStaff);
export const selectShiftStaffSchema = createSelectSchema(shiftStaff);

export const insertShiftClientSchema = createInsertSchema(shiftClients);
export const selectShiftClientSchema = createSelectSchema(shiftClients);

export const insertShiftTeamSchema = createInsertSchema(shiftTeams);
export const selectShiftTeamSchema = createSelectSchema(shiftTeams);

export const insertShiftLocationSchema = createInsertSchema(shiftLocations);
export const selectShiftLocationSchema = createSelectSchema(shiftLocations);

export const insertTeamMemberSchema = createInsertSchema(teamMembers);
export const selectTeamMemberSchema = createSelectSchema(teamMembers);

export const insertShiftInstructionSchema = createInsertSchema(shiftInstructions);
export const selectShiftInstructionSchema = createSelectSchema(shiftInstructions);

export const insertShiftMessageSchema = createInsertSchema(shiftMessages);
export const selectShiftMessageSchema = createSelectSchema(shiftMessages);

export const insertCleanerRosterSchema = createInsertSchema(cleanerRoster);
export const selectCleanerRosterSchema = createSelectSchema(cleanerRoster);

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert; 

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export type ShiftStaff = typeof shiftStaff.$inferSelect;
export type NewShiftStaff = typeof shiftStaff.$inferInsert;

export type ShiftClient = typeof shiftClients.$inferSelect;
export type NewShiftClient = typeof shiftClients.$inferInsert;

export type ShiftTeam = typeof shiftTeams.$inferSelect;
export type NewShiftTeam = typeof shiftTeams.$inferInsert;

export type ShiftLocation = typeof shiftLocations.$inferSelect;
export type NewShiftLocation = typeof shiftLocations.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type ShiftInstruction = typeof shiftInstructions.$inferSelect;
export type NewShiftInstruction = typeof shiftInstructions.$inferInsert;

export type ShiftMessage = typeof shiftMessages.$inferSelect;
export type NewShiftMessage = typeof shiftMessages.$inferInsert;

export type CleanerRoster = typeof cleanerRoster.$inferSelect;
export type NewCleanerRoster = typeof cleanerRoster.$inferInsert; 