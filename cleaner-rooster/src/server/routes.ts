/**
 * An array of routes that are accessible to the public 
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes = [
  "/error-404",
  "/roster",
  "/api/send-roster-email",
  // Add any other public routes here (e.g. "/about", "/contact")
];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged-in users to DEFAULT_LOGIN_REDIRECT_URL
 * @type {string[]}
 */
export const authRoutes = [
  "/signin",
  "/signup", 
  "/forgot-password",
  "/reset-password",
];

/**
 * The prefix for api authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in 
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT_URL = "/";

/**
 * Protected routes that require authentication
 * By default, all routes are protected except those listed in publicRoutes and authRoutes
 * The root "/" route and all routes under /(admin) require authentication
 * @type {string[]}
 */
export const protectedRoutes = [
  "/", // Root route requires authentication
  // All routes under /(admin) are automatically protected via the admin layout
  // Add any other specific protected routes here
]; 