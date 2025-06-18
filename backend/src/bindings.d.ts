import type { CacheService } from "./services/cache";

export interface Env {
  DB: D1Database;
  CACHE?: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET?: string;
  FRONTEND_URL: string;
}

export interface Variables {
  user?: {
    id: string;
    email: string;
  };
  cache?: CacheService;
} 