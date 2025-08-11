import { AccessZonePermission, AccessControlledItem, ItemAccessSettings } from '../types/permissions';
import { NormalizedRole, UserWithZonePermissions } from '../types/roles';
import { AccessControlException } from '../types/errors';
import { PERMISSION_MASKS } from '../constants/masks';
import { collapseRoles } from './roles';
import { fromBitField, normalizePermissionToBitField, hasPermission } from './bitfield';

/**
 * Check if user has the required permissions across specified zones
 * @param needed Required permissions by zone
 * @param currentRoles User's current roles
 * @returns True if user has all required permissions
 */
export function checkPermission(
  needed: AccessZonePermission,
  currentRoles: Array<NormalizedRole>,
): boolean {
  // Create a copy to avoid mutating the original
  const neededCopy = { ...needed };
  
  // Remove zero permission situations so they don't count toward total
  Object.entries(neededCopy).forEach(([zoneName, permission]) => {
    if (permission === 0) {
      delete (neededCopy as Record<string, number>)[zoneName];
    }
  });

  // If no permissions needed, return true
  const numPermissionsNeeded = Object.entries(neededCopy).length;
  if (numPermissionsNeeded === 0) {
    return true;
  }

  const currentPermissions = collapseRoles(currentRoles);
  let accessCount = 0;

  // Check each required permission
  Object.entries(neededCopy).forEach(([section, neededAccessBits]) => {
    const userPermissions = currentPermissions[section] || 0;
    const hasAccess = (neededAccessBits! & userPermissions) === neededAccessBits!;
    accessCount += hasAccess ? 1 : 0;
  });

  return accessCount === numPermissionsNeeded;
}

/**
 * Assert that user has required permissions, throw error if not
 * @param needed Required permissions by zone
 * @param currentRoles User's current roles
 * @throws AccessControlException if permissions are insufficient
 */
export function assertAccess(
  needed: AccessZonePermission,
  currentRoles: Array<NormalizedRole>,
): void {
  if (!checkPermission(needed, currentRoles)) {
    throw new AccessControlException({
      message: "Not authenticated",
      status: "unauthorized",
    });
  }
}

/**
 * Check access to specific data item, considering ownership and permissions
 * @param data Data item to check access for
 * @param accessNeeded Required permissions
 * @param user User requesting access
 * @returns True if access is granted
 * @throws Error if access is denied
 */
export function assertDataAccess(
  data: Partial<{ userId: string }> | undefined,
  accessNeeded: AccessZonePermission,
  user: UserWithZonePermissions,
): boolean {
  // Allow access if user owns the data
  if (data?.userId === user.id) {
    return true;
  }

  // Check role-based permissions
  if (!checkPermission(accessNeeded, user.roles)) {
    throw new Error("Unauthorized");
  }

  return true;
}

/**
 * Get user permissions for a specific item considering item-level access settings
 * @param user User to check permissions for
 * @param item Item with access settings
 * @param zoneKey Zone to check permissions for
 * @returns Permission object for the zone
 */
export function getUserPermissions(
  user: { id: string; roles: Array<NormalizedRole> },
  item: AccessControlledItem,
  zoneKey: string,
) {
  const userId = user.id;

  if (item.settings?.access) {
    let { global } = item.settings.access;
    const { users } = item.settings.access;

    // Check if user is the owner
    if (item.uid) {
      const itemOwnerId = typeof item.uid === 'string' 
        ? item.uid 
        : typeof item.uid === 'object' && 'id' in item.uid 
          ? item.uid.id 
          : null;
      
      if (itemOwnerId === userId) {
        return fromBitField(PERMISSION_MASKS.ADMIN);
      }
    }

    // Check user-specific permissions
    const userLevelAccess = users?.find(
      (accessUser) => accessUser.uid === userId,
    );
    
    if (userLevelAccess) {
      if (typeof userLevelAccess.access === 'number') {
        return fromBitField(userLevelAccess.access);
      }
      return userLevelAccess.access;
    }

    // Get role-based permissions
    const userPermissions = collapseRoles(user.roles);
    const zonePermissions = userPermissions[zoneKey] || 0;

    // Apply global restrictions if they exist
    if (global !== undefined) {
      const globalBitField = normalizePermissionToBitField(global);
      return fromBitField(zonePermissions & globalBitField);
    }

    return fromBitField(zonePermissions);
  }

  // No access settings, use role permissions
  const userPermissions = collapseRoles(user.roles);
  return fromBitField(userPermissions[zoneKey] || 0);
}

/**
 * Transform item access schema from bitfield to boolean format
 * @param access Access settings with bitfield permissions
 * @returns Access settings with boolean permissions
 */
export function transformItemAccessSchema(access: ItemAccessSettings): ItemAccessSettings {
  const transformedAccess = { ...access };

  if (access.global !== undefined) {
    transformedAccess.global = fromBitField(normalizePermissionToBitField(access.global));
  }

  if (access.users && access.users.length > 0) {
    transformedAccess.users = access.users.map((userObj) => ({
      ...userObj,
      access: fromBitField(normalizePermissionToBitField(userObj.access)),
    }));
  }

  return transformedAccess;
}

/**
 * Check if user has permission to read or write an item (legacy function)
 * @param user User to check
 * @param item Item to check access for
 * @param write Whether write access is required
 * @returns True if user has required access
 */
export function hasPermissions(
  user: { roles: Array<NormalizedRole> },
  item: AccessControlledItem,
  write = false,
): boolean {
  const permissions = item.settings?.permissions;
  const globalPermissions = item.settings?.access?.global;

  // Check global read permission
  if (globalPermissions !== undefined) {
    const globalBitField = normalizePermissionToBitField(globalPermissions);
    if (hasPermission(globalBitField, PERMISSION_MASKS.READ)) {
      return true;
    }
  }

  // Legacy permission check
  if (permissions !== undefined) {
    return permissions === 0 || (permissions === 1 && !write);
  }

  return false;
}

/**
 * Check if a user has a specific permission in a zone
 * @param user User to check
 * @param zoneName Name of the zone
 * @param permission Permission mask to check
 * @returns True if user has the permission
 */
export function userHasZonePermission(
  user: { roles: Array<NormalizedRole> },
  zoneName: string,
  permission: number,
): boolean {
  const userPermissions = collapseRoles(user.roles);
  const zonePermissions = userPermissions[zoneName] || 0;
  return hasPermission(zonePermissions, permission);
}

/**
 * Get all permissions a user has in a specific zone
 * @param user User to check
 * @param zoneName Name of the zone
 * @returns Permission object for the zone
 */
export function getUserZonePermissions(
  user: { roles: Array<NormalizedRole> },
  zoneName: string,
) {
  const userPermissions = collapseRoles(user.roles);
  const zonePermissions = userPermissions[zoneName] || 0;
  return fromBitField(zonePermissions);
}