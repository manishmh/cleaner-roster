import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../bindings";
import * as schema from "./schema";

export function createDrizzleClient(env: Env) {
  return drizzle(env.DB, { schema });
}

export type DrizzleClient = ReturnType<typeof createDrizzleClient>;
export { schema };
