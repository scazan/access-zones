import { z } from 'zod';

/**
 * Zod schema for access role - focused on permission-related fields only
 */
export const AccessRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Zod schema for access roles on users junction table
 */
export const AccessRolesOnUsersSchema = z.object({
  userId: z.string(),
  accessRoleId: z.string(),
});

/**
 * Zod schema for access roles on pages junction table
 */
export const AccessRolesOnPagesSchema = z.object({
  pageId: z.string(),
  accessRoleId: z.string(),
});

/**
 * Zod schema for access roles on tickets junction table
 */
export const AccessRolesOnTicketsSchema = z.object({
  ticketId: z.string(),
  accessRoleId: z.string(),
});

/**
 * Type inference from schemas
 */
export type AccessRole = z.infer<typeof AccessRoleSchema>;
export type AccessRolesOnUsers = z.infer<typeof AccessRolesOnUsersSchema>;
export type AccessRolesOnPages = z.infer<typeof AccessRolesOnPagesSchema>;
export type AccessRolesOnTickets = z.infer<typeof AccessRolesOnTicketsSchema>;