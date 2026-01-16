/**
 * Permission bit masks for CRUD operations
 * Uses bitwise operations for efficient permission checking
 */
export const PERMISSION_MASKS = {
  ADMIN: 0b10000,  // 16 (admin permission)
  CREATE: 0b01000, // 8
  READ: 0b00100,   // 4
  UPDATE: 0b00010, // 2
  DELETE: 0b00001, // 1
} as const;

/**
 * Permission mask for common permission combinations
 */
export const permission = {
  ADMIN: PERMISSION_MASKS.ADMIN,
  CREATE: PERMISSION_MASKS.CREATE,
  READ: PERMISSION_MASKS.READ,
  UPDATE: PERMISSION_MASKS.UPDATE,
  DELETE: PERMISSION_MASKS.DELETE,
} as const;
