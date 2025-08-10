import { PERMISSION_MASKS } from '../constants/masks';
import { Permission, PermissionInput } from '../types/permissions';

/**
 * Convert a permission object to a bitfield number
 * @param permission Permission object with boolean values
 * @returns Bitfield number representing the permissions
 */
export function toBitField(permission: Permission): number {
  const maskArr: Array<keyof Permission> = ["create", "read", "update", "delete"];

  return maskArr.reduce((accumPermissions, key) => {
    const permissionMask = permission[key] ? PERMISSION_MASKS[key.toUpperCase() as keyof typeof PERMISSION_MASKS] : 0;
    return accumPermissions | permissionMask;
  }, 0);
}

/**
 * Convert a bitfield number to a permission object
 * @param bitField Bitfield number representing permissions
 * @returns Permission object with boolean values
 */
export function fromBitField(bitField: number): Permission {
  return {
    create: (PERMISSION_MASKS.CREATE & bitField) === PERMISSION_MASKS.CREATE,
    read: (PERMISSION_MASKS.READ & bitField) === PERMISSION_MASKS.READ,
    update: (PERMISSION_MASKS.UPDATE & bitField) === PERMISSION_MASKS.UPDATE,
    delete: (PERMISSION_MASKS.DELETE & bitField) === PERMISSION_MASKS.DELETE,
  };
}

/**
 * Convert role permissions object to bitfield format
 * @param permissions Object mapping zone names to permission objects
 * @returns Object mapping zone names to bitfield numbers
 */
export function roleToBitField(permissions: Record<string, Permission>): Record<string, number> {
  return Object.entries(permissions).reduce((accum, [name, permission]) => {
    accum[name] = toBitField(permission);
    return accum;
  }, {} as Record<string, number>);
}

/**
 * Normalize permission input to a consistent format
 * @param input Permission input (either Permission object or number)
 * @returns Permission object
 */
export function normalizePermission(input: PermissionInput): Permission {
  if (typeof input === 'number') {
    return fromBitField(input);
  }
  return input;
}

/**
 * Normalize permission input to bitfield format
 * @param input Permission input (either Permission object or number)
 * @returns Bitfield number
 */
export function normalizePermissionToBitField(input: PermissionInput): number {
  if (typeof input === 'number') {
    return input;
  }
  return toBitField(input);
}

/**
 * Check if a permission bitfield has a specific permission
 * @param bitField The permission bitfield to check
 * @param permission The permission mask to check for
 * @returns True if the permission is granted
 */
export function hasPermission(bitField: number, permission: number): boolean {
  return (bitField & permission) === permission;
}

/**
 * Combine multiple permission bitfields using OR operation
 * @param bitFields Array of permission bitfields
 * @returns Combined bitfield
 */
export function combinePermissions(...bitFields: number[]): number {
  return bitFields.reduce((combined, bitField) => combined | bitField, 0);
}