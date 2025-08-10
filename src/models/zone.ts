import { z } from 'zod';

/**
 * Zod schema for access zone
 */
export const AccessZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Zod schema for access role permission on access zone junction table
 */
export const AccessRolePermissionOnAccessZoneSchema = z.object({
  accessRoleId: z.string(),
  accessZoneId: z.string(),
  permission: z.number(),
});

/**
 * Type inference from schemas
 */
export type AccessZone = z.infer<typeof AccessZoneSchema>;
export type AccessRolePermissionOnAccessZone = z.infer<typeof AccessRolePermissionOnAccessZoneSchema>;