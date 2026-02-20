import { toBitField, fromBitField, roleToBitField, hasPermission, combinePermissions, normalizePermissionToBitField, normalizePermission } from '../core/bitfield';
import { PERMISSION_MASKS } from '../constants/masks';

describe('Bitfield utilities', () => {
  describe('toBitField', () => {
    it('should convert permission object to bitfield', () => {
      const permission = {
        create: true,
        read: true,
        update: false,
        delete: false,
        admin: false,
      };

      const result = toBitField(permission);
      expect(result).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ);
    });

    it('should handle all CRUD permissions', () => {
      const permission = {
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: false,
      };

      const result = toBitField(permission);
      expect(result).toBe(
        PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
        PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE
      );
    });

    it('should handle all permissions including admin', () => {
      const permission = {
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: true,
      };

      const result = toBitField(permission);
      expect(result).toBe(
        PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
        PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE | PERMISSION_MASKS.ADMIN
      );
    });

    it('should handle no permissions', () => {
      const permission = {
        create: false,
        read: false,
        update: false,
        delete: false,
        admin: false,
      };

      const result = toBitField(permission);
      expect(result).toBe(0);
    });
  });

  describe('fromBitField', () => {
    it('should convert bitfield to permission object', () => {
      const bitField = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ;
      const result = fromBitField(bitField);

      expect(result).toEqual({
        create: true,
        read: true,
        update: false,
        delete: false,
        admin: false,
      });
    });

    it('should handle all CRUD permissions', () => {
      const allCrud = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
                      PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE;
      const result = fromBitField(allCrud);

      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: false,
      });
    });

    it('should handle all permissions including admin', () => {
      const allPerms = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
                       PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE | PERMISSION_MASKS.ADMIN;
      const result = fromBitField(allPerms);

      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: true,
      });
    });

    it('should handle no permissions', () => {
      const result = fromBitField(0);

      expect(result).toEqual({
        create: false,
        read: false,
        update: false,
        delete: false,
        admin: false,
      });
    });
  });

  describe('roleToBitField', () => {
    it('should convert role permissions to bitfield format', () => {
      const permissions = {
        content: { create: true, read: true, update: false, delete: false, admin: false },
        admin: { create: false, read: true, update: true, delete: false, admin: false },
      };

      const result = roleToBitField(permissions);

      expect(result).toEqual({
        content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ,
        admin: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      });
    });

    it('should return empty object for empty input', () => {
      const result = roleToBitField({});
      expect(result).toEqual({});
    });

    it('should return null-prototype object', () => {
      const result = roleToBitField({});
      expect(Object.getPrototypeOf(result)).toBe(null);
    });
  });

  describe('hasPermission', () => {
    it('should check if bitfield has specific permission', () => {
      const bitField = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ;

      expect(hasPermission(bitField, PERMISSION_MASKS.CREATE)).toBe(true);
      expect(hasPermission(bitField, PERMISSION_MASKS.READ)).toBe(true);
      expect(hasPermission(bitField, PERMISSION_MASKS.UPDATE)).toBe(false);
      expect(hasPermission(bitField, PERMISSION_MASKS.DELETE)).toBe(false);
    });

    it('should require all bits when checking a combined mask', () => {
      const bitField = PERMISSION_MASKS.READ; // only READ
      const combinedMask = PERMISSION_MASKS.READ | PERMISSION_MASKS.CREATE;

      // User has READ but not CREATE, so combined check should fail
      expect(hasPermission(bitField, combinedMask)).toBe(false);

      // User with both should pass
      const fullBitField = PERMISSION_MASKS.READ | PERMISSION_MASKS.CREATE;
      expect(hasPermission(fullBitField, combinedMask)).toBe(true);
    });
  });

  describe('combinePermissions', () => {
    it('should combine multiple bitfields', () => {
      const bitField1 = PERMISSION_MASKS.CREATE;
      const bitField2 = PERMISSION_MASKS.READ;
      const bitField3 = PERMISSION_MASKS.UPDATE;
      
      const result = combinePermissions(bitField1, bitField2, bitField3);
      
      expect(result).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE);
    });

    it('should handle empty array', () => {
      const result = combinePermissions();
      expect(result).toBe(0);
    });

    it('should throw on invalid bitfields', () => {
      expect(() => combinePermissions(-1)).toThrow();
      expect(() => combinePermissions(0x100000000)).toThrow(); // 2^32
      expect(() => combinePermissions(PERMISSION_MASKS.CREATE, Number.MAX_SAFE_INTEGER)).toThrow();
    });
  });

  describe('normalizePermission', () => {
    it('should convert number input to Permission object', () => {
      const result = normalizePermission(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ);
      expect(result).toEqual({
        create: true,
        read: true,
        update: false,
        delete: false,
        admin: false,
      });
    });

    it('should pass through Permission object unchanged', () => {
      const input = { create: true, read: false, update: false, delete: false, admin: false };
      const result = normalizePermission(input);
      expect(result).toBe(input); // same reference
    });
  });

  describe('normalizePermissionToBitField', () => {
    it('should pass through valid number input', () => {
      const input = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ;
      expect(normalizePermissionToBitField(input)).toBe(input);
    });

    it('should convert Permission object to bitfield', () => {
      const input = { create: true, read: true, update: false, delete: false, admin: false };
      expect(normalizePermissionToBitField(input)).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ);
    });
  });

  describe('Security validation', () => {
    it('should reject negative bitfields in hasPermission', () => {
      expect(() => hasPermission(-1, PERMISSION_MASKS.READ)).toThrow();
      expect(() => hasPermission(PERMISSION_MASKS.READ, -1)).toThrow();
    });

    it('should reject oversized bitfields in hasPermission', () => {
      expect(() => hasPermission(0x100000000, PERMISSION_MASKS.READ)).toThrow(); // 2^32
      expect(() => hasPermission(PERMISSION_MASKS.READ, 0x100000000)).toThrow(); // 2^32
    });

    it('should reject non-integer bitfields in hasPermission', () => {
      expect(() => hasPermission(1.5, PERMISSION_MASKS.READ)).toThrow();
      expect(() => hasPermission(PERMISSION_MASKS.READ, 3.14)).toThrow();
    });

    it('should reject invalid bitfields in fromBitField', () => {
      expect(() => fromBitField(-1)).toThrow();
      expect(() => fromBitField(0x100000000)).toThrow(); // 2^32
      expect(() => fromBitField(Number.MAX_SAFE_INTEGER)).toThrow();
      expect(() => fromBitField(1.5)).toThrow();
    });

    it('should reject invalid bitfields in normalizePermissionToBitField', () => {
      expect(() => normalizePermissionToBitField(-1)).toThrow();
      expect(() => normalizePermissionToBitField(0x100000000)).toThrow(); // 2^32
      expect(() => normalizePermissionToBitField(Number.MAX_SAFE_INTEGER)).toThrow();
    });

    it('should handle special number values', () => {
      expect(() => hasPermission(NaN, PERMISSION_MASKS.READ)).toThrow();
      expect(() => hasPermission(Infinity, PERMISSION_MASKS.READ)).toThrow();
      expect(() => hasPermission(-Infinity, PERMISSION_MASKS.READ)).toThrow();
    });
  });

  describe('Future extensibility', () => {
    it('should allow future permission bits', () => {
      const futurePermission1 = 16; // 0b10000 - bit 4
      const futurePermission2 = 32; // 0b100000 - bit 5
      
      expect(() => hasPermission(futurePermission1, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(futurePermission1)).not.toThrow();
      expect(() => combinePermissions(futurePermission1, futurePermission2)).not.toThrow();
      
      // Test that future permissions work with existing ones
      const combined = combinePermissions(PERMISSION_MASKS.READ, futurePermission1);
      expect(combined).toBe(PERMISSION_MASKS.READ | futurePermission1);
      
      expect(hasPermission(combined, PERMISSION_MASKS.READ)).toBe(true);
      expect(hasPermission(combined, futurePermission1)).toBe(true);
      expect(hasPermission(combined, futurePermission2)).toBe(false);
    });

    it('should handle large valid permission combinations', () => {
      const largeCombination = 0x0FFFFFFF; // 28 bits set (within 32-bit limit)
      
      expect(() => hasPermission(largeCombination, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(largeCombination)).not.toThrow();
      
      const result = fromBitField(largeCombination);
      expect(result.create).toBe(true);
      expect(result.read).toBe(true);
      expect(result.update).toBe(true);
      expect(result.delete).toBe(true);
    });

    it('should work with maximum valid 32-bit value', () => {
      const maxValid = 0xFFFFFFFF; // 32-bit maximum
      
      expect(() => hasPermission(maxValid, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(maxValid)).not.toThrow();
      
      const result = fromBitField(maxValid);
      expect(result.create).toBe(true);
      expect(result.read).toBe(true);
      expect(result.update).toBe(true);
      expect(result.delete).toBe(true);
    });
  });
});