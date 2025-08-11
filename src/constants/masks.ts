/**
 * Permission bit masks for CRUD operations
 * Uses bitwise operations for efficient permission checking
 */
export const PERMISSION_MASKS = {
  CREATE: 0b1000, // 8
  READ: 0b0100,   // 4
  UPDATE: 0b0010, // 2
  DELETE: 0b0001, // 1
  ADMIN: 0b1111,  // 15 (all permissions)
} as const;

/**
 * Permission mask for common permission combinations
 */
export const permission = {
  CREATE: PERMISSION_MASKS.CREATE,
  READ: PERMISSION_MASKS.READ,
  UPDATE: PERMISSION_MASKS.UPDATE,
  DELETE: PERMISSION_MASKS.DELETE,
  ADMIN: PERMISSION_MASKS.ADMIN,
} as const;
