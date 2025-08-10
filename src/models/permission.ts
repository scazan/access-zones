import { z } from 'zod';

/**
 * Zod schema for individual permission
 */
export const PermissionSchema = z.object({
  create: z.boolean(),
  read: z.boolean(),
  update: z.boolean(),
  delete: z.boolean(),
});

/**
 * Zod schema for access zone permission (zone name to bitfield mapping)
 */
export const AccessZonePermissionSchema = z.object({}).catchall(z.number()).partial();

/**
 * Zod schema for zone permissions (zone name to permission object mapping)
 */
export const ZonePermissionsSchema = z.record(z.string(), PermissionSchema);

/**
 * Zod schema for item access settings
 */
export const ItemAccessSettingsSchema = z.object({
  global: z.union([PermissionSchema, z.number()]).optional(),
  users: z.array(z.object({
    uid: z.string(),
    access: z.union([PermissionSchema, z.number()]),
  })).optional(),
});

/**
 * Zod schema for access controlled item
 */
export const AccessControlledItemSchema = z.object({
  uid: z.union([
    z.string(),
    z.object({
      id: z.string(),
      email: z.string().optional(),
    })
  ]).optional(),
  userId: z.string().optional(),
  settings: z.object({
    access: ItemAccessSettingsSchema.optional(),
    permissions: z.number().optional(),
  }).optional(),
});

/**
 * Type inference from schemas
 */
export type Permission = z.infer<typeof PermissionSchema>;
export type AccessZonePermission = z.infer<typeof AccessZonePermissionSchema>;
export type ZonePermissions = z.infer<typeof ZonePermissionsSchema>;
export type ItemAccessSettings = z.infer<typeof ItemAccessSettingsSchema>;
export type AccessControlledItem = z.infer<typeof AccessControlledItemSchema>;