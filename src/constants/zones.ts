/**
 * Default access zones for common application functionality
 * These can be customized or extended based on your application needs
 */
export const DEFAULT_ACCESS_ZONES = [
  "content",     // Content management (posts, articles, etc.)
  "users",       // User management
  "admin",       // Administrative functions
  "settings",    // Application settings
  "reports",     // Reporting and analytics
  "billing",     // Billing and payments
  "support",     // Customer support
  "api",         // API access
  "files",       // File management
  "notifications", // Notification management
] as const;

/**
 * Type representing a valid access zone
 */
export type AccessZone = (typeof DEFAULT_ACCESS_ZONES)[number];

/**
 * Legacy export for backward compatibility
 * @deprecated Use DEFAULT_ACCESS_ZONES instead
 */
export const ACCESS_ZONES = DEFAULT_ACCESS_ZONES;
