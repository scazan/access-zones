import { PERMISSION_MASKS } from '../constants/masks';
import { AccessControlException } from '../types/errors';

/**
 * Reserved property names that cannot be used as zone names
 * These are JavaScript built-in property names that could cause issues
 */
export const RESERVED_ZONE_NAMES = new Set([
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
]);

/**
 * Maximum allowed zone name length
 */
export const MAX_ZONE_NAME_LENGTH = 128;

/**
 * Validates that a zone name is safe and valid
 * @param zoneName The zone name to validate
 * @returns True if valid, false otherwise
 */
export function isValidZoneName(zoneName: string): boolean {
  // Must be a non-empty string
  if (typeof zoneName !== 'string' || zoneName.length === 0) {
    return false;
  }

  // Must not exceed maximum length
  if (zoneName.length > MAX_ZONE_NAME_LENGTH) {
    return false;
  }

  // Must not be a reserved property name
  if (RESERVED_ZONE_NAMES.has(zoneName)) {
    return false;
  }

  // Must not start or end with underscore (convention for internal properties)
  if (zoneName.startsWith('_') || zoneName.endsWith('_')) {
    return false;
  }

  return true;
}

/**
 * Validates a zone name and throws an exception if invalid
 * @param zoneName The zone name to validate
 * @param context Additional context for error messages
 * @throws {AccessControlException} If the zone name is invalid
 */
export function validateZoneName(zoneName: string, context = 'zone name'): void {
  if (!isValidZoneName(zoneName)) {
    let reason = '';

    if (typeof zoneName !== 'string') {
      reason = 'Must be a string.';
    } else if (zoneName.length === 0) {
      reason = 'Must not be empty.';
    } else if (zoneName.length > MAX_ZONE_NAME_LENGTH) {
      reason = `Must not exceed ${MAX_ZONE_NAME_LENGTH} characters.`;
    } else if (RESERVED_ZONE_NAMES.has(zoneName)) {
      reason = `'${zoneName}' is a reserved property name and cannot be used as a zone name.`;
    } else if (zoneName.startsWith('_') || zoneName.endsWith('_')) {
      reason = 'Must not start or end with underscore.';
    } else {
      reason = 'Invalid zone name.';
    }

    throw new AccessControlException({
      message: `Invalid ${context}: '${zoneName}'. ${reason}`,
      status: 'invalid_permission',
    });
  }
}

/**
 * Creates a null-prototype object safe from prototype pollution
 * Use this instead of {} for permission accumulation
 * @returns A new object with null prototype
 */
export function createSafeObject<T extends Record<string, unknown>>(): T {
  return Object.create(null) as T;
}

/**
 * Maximum valid permission bitfield value
 * Using 32 bits to allow for future expansion while maintaining security
 * This supports up to 32 different permission types
 */
export const MAX_VALID_PERMISSION = 0xFFFFFFFF; // 2^32 - 1 (4,294,967,295)

/**
 * Minimum valid permission bitfield value
 */
export const MIN_VALID_PERMISSION = 0;

/**
 * Maximum safe integer for bitfield operations
 * JavaScript can safely represent integers up to 2^53 - 1, but we limit to 32 bits
 * for practical permission management and to prevent potential overflow issues
 */
export const MAX_SAFE_BITFIELD = MAX_VALID_PERMISSION;

/**
 * Currently defined permission masks (for reference and validation)
 */
export const CURRENT_PERMISSION_MASKS = [
  PERMISSION_MASKS.CREATE,
  PERMISSION_MASKS.READ,
  PERMISSION_MASKS.UPDATE,
  PERMISSION_MASKS.DELETE,
  PERMISSION_MASKS.ADMIN,
] as const;

/**
 * Validates that a number is a valid permission bitfield
 * @param bitField The number to validate
 * @returns True if valid, false otherwise
 */
export function isValidBitField(bitField: number): boolean {
  // Must be a finite integer
  if (!Number.isInteger(bitField) || !Number.isFinite(bitField)) {
    return false;
  }

  // Must be within valid range (non-negative and within 32-bit limit)
  if (bitField < MIN_VALID_PERMISSION || bitField > MAX_VALID_PERMISSION) {
    return false;
  }

  // Additional safety check: ensure it's within JavaScript's safe integer range
  if (!Number.isSafeInteger(bitField)) {
    return false;
  }

  return true;
}

/**
 * Validates that a number represents a valid permission mask
 * @param permission The permission mask to validate
 * @returns True if it's a valid permission mask
 */
export function isValidPermissionMask(permission: number): boolean {
  // Permission masks follow the same rules as bitfields
  // They can be any valid combination of permission bits
  return isValidBitField(permission);
}

/**
 * Validates a bitfield and throws an exception if invalid
 * @param bitField The bitfield to validate
 * @param context Additional context for error messages
 * @throws {AccessControlException} If the bitfield is invalid
 */
export function validateBitField(bitField: number, context = 'permission bitfield'): void {
  if (!isValidBitField(bitField)) {
    let reason = '';
    
    if (!Number.isInteger(bitField) || !Number.isFinite(bitField)) {
      reason = 'Must be a finite integer.';
    } else if (bitField < MIN_VALID_PERMISSION) {
      reason = 'Must be non-negative.';
    } else if (bitField > MAX_VALID_PERMISSION) {
      reason = `Must not exceed ${MAX_VALID_PERMISSION} (32-bit limit).`;
    } else if (!Number.isSafeInteger(bitField)) {
      reason = 'Must be within JavaScript safe integer range.';
    } else {
      reason = 'Invalid bitfield value.';
    }
    
    throw new AccessControlException({
      message: `Invalid ${context}: ${bitField}. ${reason}`,
      status: 'invalid_permission',
    });
  }
}

/**
 * Validates a permission mask and throws an exception if invalid
 * @param permission The permission mask to validate
 * @param context Additional context for error messages
 * @throws {AccessControlException} If the permission mask is invalid
 */
export function validatePermissionMask(permission: number, context = 'permission mask'): void {
  if (!isValidPermissionMask(permission)) {
    throw new AccessControlException({
      message: `Invalid ${context}: ${permission}. Must be a valid permission mask or combination.`,
      status: 'invalid_permission',
    });
  }
}

/**
 * Safely validates and normalizes a bitfield input
 * @param input The input to validate and normalize
 * @param context Additional context for error messages
 * @returns The validated bitfield
 * @throws {AccessControlException} If the input is invalid
 */
export function safeBitField(input: unknown, context = 'bitfield input'): number {
  if (typeof input !== 'number') {
    throw new AccessControlException({
      message: `Invalid ${context}: expected number, got ${typeof input}`,
      status: 'invalid_permission',
    });
  }

  validateBitField(input, context);
  return input;
}

/**
 * Creates a human-readable description of a permission bitfield
 * @param bitField The bitfield to describe
 * @returns String description of the permissions
 */
export function describeBitField(bitField: number): string {
  if (!isValidBitField(bitField)) {
    return `Invalid bitfield: ${bitField}`;
  }

  if (bitField === 0) {
    return 'No permissions';
  }

  const permissions: string[] = [];

  // Check known permission bits
  if (bitField & PERMISSION_MASKS.ADMIN) permissions.push('ADMIN');
  if (bitField & PERMISSION_MASKS.CREATE) permissions.push('CREATE');
  if (bitField & PERMISSION_MASKS.READ) permissions.push('READ');
  if (bitField & PERMISSION_MASKS.UPDATE) permissions.push('UPDATE');
  if (bitField & PERMISSION_MASKS.DELETE) permissions.push('DELETE');

  // Check for unknown/future permission bits
  const knownBits = PERMISSION_MASKS.ADMIN | PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
                   PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE;
  const unknownBits = bitField & ~knownBits;
  
  if (unknownBits !== 0) {
    permissions.push(`CUSTOM(${unknownBits})`);
  }

  return permissions.join(' | ');
}

/**
 * Validates that a bitfield contains only the specified allowed permissions
 * @param bitField The bitfield to validate
 * @param allowedPermissions Bitfield of allowed permissions
 * @param context Additional context for error messages
 * @throws {AccessControlException} If the bitfield contains disallowed permissions
 */
export function validateAllowedPermissions(
  bitField: number,
  allowedPermissions: number,
  context = 'permission validation'
): void {
  validateBitField(bitField, `${context} bitfield`);
  validateBitField(allowedPermissions, `${context} allowed permissions`);

  const disallowedBits = bitField & ~allowedPermissions;
  if (disallowedBits !== 0) {
    throw new AccessControlException({
      message: `${context}: Bitfield contains disallowed permissions. ` +
               `Requested: ${describeBitField(bitField)}, ` +
               `Allowed: ${describeBitField(allowedPermissions)}, ` +
               `Disallowed: ${describeBitField(disallowedBits)}`,
      status: 'forbidden',
    });
  }
}