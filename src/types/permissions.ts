import { AccessZone } from '../constants/zones';

/**
 * Individual permission object with CRUD operations
 */
export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  admin: boolean;
}

/**
 * Zone-based permissions mapping zones to permission numbers (bitfields)
 */
export type AccessZonePermission = Partial<Record<AccessZone, number>>;

/**
 * Accepts a single permission or an array (OR logic: any must pass)
 */
export type AccessZonePermissionInput = AccessZonePermission | AccessZonePermission[];

/**
 * Zone-based permissions mapping zones to permission objects
 */
export type ZonePermissions = Record<string, Permission>;

/**
 * Permission object that can be either boolean-based or bitfield-based
 */
export type PermissionInput = Permission | number;

/**
 * Access settings for items with global and user-specific permissions
 */
export interface ItemAccessSettings {
  global?: Permission | number;
  users?: Array<{
    uid: string;
    access: Permission | number;
  }>;
}

/**
 * Item with access settings
 */
export interface AccessControlledItem {
  uid?: string | { id: string; email?: string };
  userId?: string;
  settings?: {
    access?: ItemAccessSettings;
    permissions?: number;
  };
}