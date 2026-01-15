import { NormalizedRole, RoleWithAccess, UserWithRoles, UserWithZonePermissions } from '../types/roles';
import { ZonePermissions } from '../types/permissions';
import { fromBitField } from './bitfield';
import { validateBitField, validateZoneName, createSafeObject } from './validation';

/**
 * Transform a role with access to a normalized role format
 * @param role Role with access permissions
 * @returns Normalized role
 * @throws {AccessControlException} If any permission value or zone name is invalid
 */
export function normalizeRole(role: RoleWithAccess): NormalizedRole {
  const access = createSafeObject<Record<string, number>>();

  for (const roleAccess of role.access) {
    const zoneName = roleAccess.zone.name;
    validateZoneName(zoneName, `zone name in role '${role.name}'`);
    validateBitField(roleAccess.permission, `permission for zone '${zoneName}'`);
    access[zoneName] = roleAccess.permission;
  }

  return {
    id: role.id,
    name: role.name,
    access,
  };
}

/**
 * Transform multiple roles with access to normalized format
 * @param roles Array of roles with access
 * @returns Array of normalized roles
 */
export function normalizeRoles(roles: Array<RoleWithAccess>): Array<NormalizedRole> {
  return roles.map(normalizeRole);
}

/**
 * Collapse multiple roles into a single permission set
 * Uses OR operation to combine permissions - if any role grants access, access is granted
 * @param roles Array of normalized roles
 * @returns Combined permissions object (null-prototype object safe from prototype pollution)
 * @throws {AccessControlException} If any permission value or zone name is invalid
 */
export function collapseRoles(roles: Array<NormalizedRole>): Record<string, number> {
  const result = createSafeObject<Record<string, number>>();

  for (const role of roles) {
    for (const [zoneName, permission] of Object.entries(role.access)) {
      validateZoneName(zoneName, `zone name in role '${role.name}'`);
      validateBitField(permission, `permission value for zone '${zoneName}' in role '${role.name}'`);
      result[zoneName] = (result[zoneName] || 0) | permission;
    }
  }

  return result;
}

/**
 * Get global permissions for a user by collapsing all their roles
 * @param user User with roles
 * @returns Zone permissions with boolean values (null-prototype object)
 */
export function getGlobalPermissions(user: UserWithRoles): ZonePermissions {
  const collapsedRoles = collapseRoles(user.roles);
  const result = createSafeObject<ZonePermissions>();

  for (const [zoneName, bitField] of Object.entries(collapsedRoles)) {
    result[zoneName] = fromBitField(bitField);
  }

  return result;
}

/**
 * Transform a user with roles to include computed zone permissions
 * @param user User with roles
 * @returns User with zone permissions
 */
export function addZonePermissionsToUser(user: UserWithRoles): UserWithZonePermissions {
  const globalPermissions = getGlobalPermissions(user);
  
  return {
    ...user,
    access: globalPermissions,
  };
}

/**
 * Check if a user has a specific role by name
 * @param user User with roles
 * @param roleName Name of the role to check for
 * @returns True if user has the role
 */
export function userHasRole(user: UserWithRoles, roleName: string): boolean {
  return user.roles.some(role => role.name === roleName);
}

/**
 * Check if a user has any of the specified roles
 * @param user User with roles
 * @param roleNames Array of role names to check for
 * @returns True if user has any of the roles
 */
export function userHasAnyRole(user: UserWithRoles, roleNames: string[]): boolean {
  return roleNames.some(roleName => userHasRole(user, roleName));
}

/**
 * Check if a user has all of the specified roles
 * @param user User with roles
 * @param roleNames Array of role names to check for
 * @returns True if user has all of the roles
 */
export function userHasAllRoles(user: UserWithRoles, roleNames: string[]): boolean {
  return roleNames.every(roleName => userHasRole(user, roleName));
}

/**
 * Get all zone names that a user has any permissions for
 * @param user User with roles
 * @returns Array of zone names
 */
export function getUserZones(user: UserWithRoles): string[] {
  const permissions = getGlobalPermissions(user);
  return Object.keys(permissions);
}

/**
 * Get all zone names that a user has specific permission for
 * @param user User with roles
 * @param permissionType Type of permission to check ('create', 'read', 'update', 'delete')
 * @returns Array of zone names
 */
export function getUserZonesWithPermission(
  user: UserWithRoles, 
  permissionType: 'create' | 'read' | 'update' | 'delete'
): string[] {
  const permissions = getGlobalPermissions(user);
  return Object.entries(permissions)
    .filter(([, permission]) => permission[permissionType])
    .map(([zoneName]) => zoneName);
}