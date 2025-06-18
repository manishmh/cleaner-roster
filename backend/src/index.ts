import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { Env, Variables } from "./bindings";
import { registerRoutes } from "./routes";
import { CacheService } from "./services/cache";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      // Get frontend URL from environment
      const frontendUrl = c.env.FRONTEND_URL || "http://localhost:3000";
      
      // Allow requests from frontend in development and production
      const allowedOrigins = [
        frontendUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cleaner-roster-frontend.manishmh982.workers.dev" // Production frontend domain
      ];
      
      // Allow requests without origin (like Postman, curl, etc.)
      if (!origin) return origin;
      
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true, // Essential for cookies
    allowHeaders: [
      "Content-Type", 
      "Authorization", 
      "Cookie",
      "Set-Cookie",
      "X-Requested-With"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
  })
);

// Cache middleware to add cache service to context
app.use("*", async (c, next) => {
  // Add cache service to variables for easy access
  c.set("cache", new CacheService(c.env.CACHE));
  await next();
});

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Cleaner Rooster Backend API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    features: {
      database: "D1",
      cache: "KV",
      orm: "Drizzle",
      framework: "Hono",
    },
  });
});

// Health check endpoint with cache test
app.get("/health", async (c) => {
  try {
    // Test cache connectivity
    const cache = new CacheService(c.env.CACHE);
    const testKey = "health_check";
    const testValue = { timestamp: Date.now() };
    
    await cache.set(testKey, testValue, 60);
    const retrieved = await cache.get(testKey);
    
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Date.now(),
      services: {
        cache: retrieved ? "healthy" : "unhealthy",
        database: "healthy", // Could add DB health check here
      },
    });
  } catch (error) {
    return c.json({
      status: "degraded",
      timestamp: new Date().toISOString(),
      error: "Cache connectivity issue",
    }, 503);
  }
});

// Register all API routes
registerRoutes(app);

// Global error handler
app.onError((err, c) => {
  console.error("Global error handler:", err);
  
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          message: err.message,
          status: err.status,
          details: err.cause,
        },
      },
      err.status
    );
  }

  return c.json(
    {
      success: false,
      error: {
        message: "Internal Server Error",
        status: 500,
      },
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        message: "Not Found",
        status: 404,
        path: c.req.path,
      },
    },
    404
  );
});

export default app; 