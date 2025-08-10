import { toBitField, fromBitField, roleToBitField, hasPermission, combinePermissions } from '../core/bitfield';
import { PERMISSION_MASKS } from '../constants/masks';

describe('Bitfield utilities', () => {
  describe('toBitField', () => {
    it('should convert permission object to bitfield', () => {
      const permission = {
        create: true,
        read: true,
        update: false,
        delete: false,
      };
      
      const result = toBitField(permission);
      expect(result).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ);
    });

    it('should handle all permissions', () => {
      const permission = {
        create: true,
        read: true,
        update: true,
        delete: true,
      };
      
      const result = toBitField(permission);
      expect(result).toBe(PERMISSION_MASKS.ADMIN);
    });

    it('should handle no permissions', () => {
      const permission = {
        create: false,
        read: false,
        update: false,
        delete: false,
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
      });
    });

    it('should handle admin permissions', () => {
      const result = fromBitField(PERMISSION_MASKS.ADMIN);
      
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
      });
    });

    it('should handle no permissions', () => {
      const result = fromBitField(0);
      
      expect(result).toEqual({
        create: false,
        read: false,
        update: false,
        delete: false,
      });
    });
  });

  describe('roleToBitField', () => {
    it('should convert role permissions to bitfield format', () => {
      const permissions = {
        content: { create: true, read: true, update: false, delete: false },
        admin: { create: false, read: true, update: true, delete: false },
      };
      
      const result = roleToBitField(permissions);
      
      expect(result).toEqual({
        content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ,
        admin: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      });
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
  });
});