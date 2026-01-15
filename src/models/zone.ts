/**
 * Access zone entity
 * Note: This is exported as AccessZone from index.ts
 * Internally named AccessZoneModel to avoid conflict with AccessZone string type in constants
 */
export interface AccessZoneModel {
  id: string;
  name: string;
}

/**
 * Access role permission on access zone junction table
 */
export interface AccessRolePermissionOnAccessZone {
  accessRoleId: string;
  accessZoneId: string;
  permission: number;
}
