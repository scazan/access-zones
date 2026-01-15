/**
 * Individual permission with CRUD operations
 */
export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

/**
 * Access zone permission (zone name to bitfield mapping)
 */
export type AccessZonePermission = Partial<Record<string, number>>;

/**
 * Zone permissions (zone name to permission object mapping)
 */
export type ZonePermissions = Record<string, Permission>;

/**
 * Item access settings
 */
export interface ItemAccessSettings {
  global?: Permission | number;
  users?: Array<{
    uid: string;
    access: Permission | number;
  }>;
}

/**
 * Access controlled item
 */
export interface AccessControlledItem {
  uid?: string | { id: string; email?: string };
  userId?: string;
  settings?: {
    access?: ItemAccessSettings;
    permissions?: number;
  };
}
