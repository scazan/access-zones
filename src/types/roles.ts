/**
 * Basic role interface - database agnostic
 * Note: Only id and name are required for RBAC functionality.
 * Additional fields like description, createdAt, updatedAt can be included in your database models.
 */
export interface BaseRole {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Access zone interface - database agnostic
 * Note: Only id and name are required for RBAC functionality.
 * Additional fields can be included in your database models.
 */
export interface BaseAccessZone {
  id: string;
  name: string;
}

/**
 * Role-zone permission mapping
 */
export interface RoleZoneAccess {
  zone: BaseAccessZone;
  permission: number;
}

/**
 * Role with access permissions
 */
export interface RoleWithAccess extends BaseRole {
  access: Array<RoleZoneAccess>;
}

/**
 * Normalized role for internal processing
 */
export interface NormalizedRole {
  id: string;
  name: string;
  access: Record<string, number>;
}

/**
 * User interface - database agnostic
 * Note: Only id is required for RBAC functionality.
 * Additional fields like email, createdAt, etc. can be included in your database models.
 */
export interface BaseUser {
  id: string;
  email?: string;
}

/**
 * User with roles attached
 */
export interface UserWithRoles extends BaseUser {
  roles: Array<NormalizedRole>;
}

/**
 * User with computed zone permissions
 */
export interface UserWithZonePermissions extends UserWithRoles {
  access: Record<string, {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }>;
}

/**
 * Access role - minimal fields required for RBAC
 */
export interface AccessRole {
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