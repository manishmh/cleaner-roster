import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./db.sqlite", // Local development
  },
  // For production D1 migrations, use: wrangler d1 migrations apply
}); 