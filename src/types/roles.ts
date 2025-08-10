/**
 * Basic role interface - database agnostic
 */
export interface BaseRole {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Access zone interface - database agnostic
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