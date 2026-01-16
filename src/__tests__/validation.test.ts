import {
  isValidBitField,
  isValidPermissionMask,
  validateBitField,
  validatePermissionMask,
  safeBitField,
  describeBitField,
  validateAllowedPermissions,
  MAX_VALID_PERMISSION,
  MIN_VALID_PERMISSION,
} from '../core/validation';
import { PERMISSION_MASKS } from '../constants/masks';
import { AccessControlException } from '../types/errors';

describe('Bitfield Validation', () => {
  describe('isValidBitField', () => {
    it('should accept valid permission bitfields', () => {
      expect(isValidBitField(0)).toBe(true); // No permissions
      expect(isValidBitField(PERMISSION_MASKS.CREATE)).toBe(true);
      expect(isValidBitField(PERMISSION_MASKS.READ)).toBe(true);
      expect(isValidBitField(PERMISSION_MASKS.UPDATE)).toBe(true);
      expect(isValidBitField(PERMISSION_MASKS.DELETE)).toBe(true);
      expect(isValidBitField(PERMISSION_MASKS.ADMIN)).toBe(true);
      expect(isValidBitField(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidBitField(-1)).toBe(false);
      expect(isValidBitField(-100)).toBe(false);
    });

    it('should accept numbers up to 32-bit limit', () => {
      expect(isValidBitField(16)).toBe(true); // 0b10000 - valid future permission bit
      expect(isValidBitField(255)).toBe(true); // 0b11111111 - 8 bits
      expect(isValidBitField(65535)).toBe(true); // 0b1111111111111111 - 16 bits
      expect(isValidBitField(0xFFFFFFFF)).toBe(true); // 32-bit maximum
    });

    it('should reject numbers exceeding 32-bit limit', () => {
      expect(isValidBitField(0x100000000)).toBe(false); // 2^32
      expect(isValidBitField(Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isValidBitField(1.5)).toBe(false);
      expect(isValidBitField(3.14)).toBe(false);
      expect(isValidBitField(NaN)).toBe(false);
      expect(isValidBitField(Infinity)).toBe(false);
      expect(isValidBitField(-Infinity)).toBe(false);
    });

    it('should accept future permission bits', () => {
      expect(isValidBitField(0b10000)).toBe(true); // Bit 4 - future permission
      expect(isValidBitField(0b100000)).toBe(true); // Bit 5 - future permission
      expect(isValidBitField(32)).toBe(true); // 0b100000 - valid future bit
      expect(isValidBitField(1024)).toBe(true); // 0b10000000000 - bit 10
    });
  });

  describe('isValidPermissionMask', () => {
    it('should accept valid permission masks', () => {
      expect(isValidPermissionMask(0)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.CREATE)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.READ)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.UPDATE)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.DELETE)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.ADMIN)).toBe(true);
    });

    it('should accept valid combinations', () => {
      expect(isValidPermissionMask(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ)).toBe(true);
      expect(isValidPermissionMask(PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE)).toBe(true);
    });

    it('should reject invalid permission masks', () => {
      expect(isValidPermissionMask(-1)).toBe(false);
      expect(isValidPermissionMask(0x100000000)).toBe(false); // 2^32
      expect(isValidPermissionMask(Number.MAX_SAFE_INTEGER)).toBe(false);
    });
  });

  describe('validateBitField', () => {
    it('should not throw for valid bitfields', () => {
      expect(() => validateBitField(0)).not.toThrow();
      expect(() => validateBitField(PERMISSION_MASKS.CREATE)).not.toThrow();
      expect(() => validateBitField(PERMISSION_MASKS.ADMIN)).not.toThrow();
    });

    it('should throw AccessControlException for invalid bitfields', () => {
      expect(() => validateBitField(-1)).toThrow(AccessControlException);
      expect(() => validateBitField(0x100000000)).toThrow(AccessControlException); // 2^32
      expect(() => validateBitField(Number.MAX_SAFE_INTEGER)).toThrow(AccessControlException);
      expect(() => validateBitField(1.5)).toThrow(AccessControlException);
      expect(() => validateBitField(NaN)).toThrow(AccessControlException);
    });

    it('should include context in error messages', () => {
      expect(() => validateBitField(-1, 'test context')).toThrow(/test context/);
    });

    it('should provide detailed error messages', () => {
      expect(() => validateBitField(-1)).toThrow(/Must be non-negative/);
      expect(() => validateBitField(0x100000000)).toThrow(/Must not exceed.*32-bit limit/);
      expect(() => validateBitField(1.5)).toThrow(/Must be a finite integer/);
    });
  });

  describe('validatePermissionMask', () => {
    it('should not throw for valid permission masks', () => {
      expect(() => validatePermissionMask(0)).not.toThrow();
      expect(() => validatePermissionMask(PERMISSION_MASKS.CREATE)).not.toThrow();
      expect(() => validatePermissionMask(PERMISSION_MASKS.ADMIN)).not.toThrow();
    });

    it('should throw AccessControlException for invalid masks', () => {
      expect(() => validatePermissionMask(-1)).toThrow(AccessControlException);
      expect(() => validatePermissionMask(0x100000000)).toThrow(AccessControlException);
      expect(() => validatePermissionMask(Number.MAX_SAFE_INTEGER)).toThrow(AccessControlException);
    });
  });

  describe('safeBitField', () => {
    it('should return valid bitfields unchanged', () => {
      expect(safeBitField(0)).toBe(0);
      expect(safeBitField(PERMISSION_MASKS.CREATE)).toBe(PERMISSION_MASKS.CREATE);
      expect(safeBitField(PERMISSION_MASKS.ADMIN)).toBe(PERMISSION_MASKS.ADMIN);
    });

    it('should throw for non-number inputs', () => {
      expect(() => safeBitField('string')).toThrow(AccessControlException);
      expect(() => safeBitField(null)).toThrow(AccessControlException);
      expect(() => safeBitField(undefined)).toThrow(AccessControlException);
      expect(() => safeBitField({})).toThrow(AccessControlException);
      expect(() => safeBitField([])).toThrow(AccessControlException);
    });

    it('should throw for invalid number inputs', () => {
      expect(() => safeBitField(-1)).toThrow(AccessControlException);
      expect(() => safeBitField(0x100000000)).toThrow(AccessControlException);
      expect(() => safeBitField(1.5)).toThrow(AccessControlException);
    });

    it('should include context in error messages', () => {
      expect(() => safeBitField('invalid', 'test input')).toThrow(/test input/);
    });
  });

  describe('describeBitField', () => {
    it('should describe valid bitfields correctly', () => {
      expect(describeBitField(0)).toBe('No permissions');
      expect(describeBitField(PERMISSION_MASKS.ADMIN)).toBe('ADMIN');
      expect(describeBitField(PERMISSION_MASKS.CREATE)).toBe('CREATE');
      expect(describeBitField(PERMISSION_MASKS.READ)).toBe('READ');
      expect(describeBitField(PERMISSION_MASKS.UPDATE)).toBe('UPDATE');
      expect(describeBitField(PERMISSION_MASKS.DELETE)).toBe('DELETE');
      const allCrud = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
                      PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE;
      expect(describeBitField(allCrud)).toBe('CREATE | READ | UPDATE | DELETE');
    });

    it('should describe combinations correctly', () => {
      const readWrite = PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE;
      expect(describeBitField(readWrite)).toBe('READ | UPDATE');

      const createRead = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ;
      expect(describeBitField(createRead)).toBe('CREATE | READ');
    });

    it('should describe future permission bits', () => {
      expect(describeBitField(32)).toBe('CUSTOM(32)'); // Bit 5
      expect(describeBitField(64)).toBe('CUSTOM(64)'); // Bit 6
      expect(describeBitField(PERMISSION_MASKS.READ | 32)).toBe('READ | CUSTOM(32)');
    });

    it('should handle invalid bitfields', () => {
      expect(describeBitField(-1)).toBe('Invalid bitfield: -1');
      expect(describeBitField(0x100000000)).toBe('Invalid bitfield: 4294967296');
      expect(describeBitField(Number.MAX_SAFE_INTEGER)).toContain('Invalid bitfield:');
    });
  });

  describe('validateAllowedPermissions', () => {
    it('should not throw when bitfield is within allowed permissions', () => {
      const allowed = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ;
      
      expect(() => validateAllowedPermissions(0, allowed)).not.toThrow();
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.CREATE, allowed)).not.toThrow();
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.READ, allowed)).not.toThrow();
      expect(() => validateAllowedPermissions(allowed, allowed)).not.toThrow();
    });

    it('should throw when bitfield exceeds allowed permissions', () => {
      const allowed = PERMISSION_MASKS.READ; // Only READ allowed
      
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.CREATE, allowed))
        .toThrow(AccessControlException);
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.ADMIN, allowed))
        .toThrow(AccessControlException);
    });

    it('should provide detailed error messages with permission descriptions', () => {
      const allowed = PERMISSION_MASKS.READ;
      
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.CREATE, allowed))
        .toThrow(/Requested: CREATE.*Allowed: READ.*Disallowed: CREATE/);
    });

    it('should validate both bitfield and allowed permissions', () => {
      expect(() => validateAllowedPermissions(-1, PERMISSION_MASKS.READ))
        .toThrow(AccessControlException);
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.READ, -1))
        .toThrow(AccessControlException);
    });

    it('should include context in error messages', () => {
      const allowed = PERMISSION_MASKS.READ;
      expect(() => validateAllowedPermissions(PERMISSION_MASKS.CREATE, allowed, 'test operation'))
        .toThrow(/test operation/);
    });
  });

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(MIN_VALID_PERMISSION).toBe(0);
      expect(MAX_VALID_PERMISSION).toBe(0xFFFFFFFF); // 32-bit maximum
      expect(MAX_VALID_PERMISSION).toBe(4294967295);
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary values correctly', () => {
      expect(isValidBitField(MIN_VALID_PERMISSION)).toBe(true);
      expect(isValidBitField(MAX_VALID_PERMISSION)).toBe(true);
      expect(isValidBitField(MAX_VALID_PERMISSION + 1)).toBe(false); // 2^32
      expect(isValidBitField(MIN_VALID_PERMISSION - 1)).toBe(false); // -1
    });

    it('should handle special number values', () => {
      expect(isValidBitField(0)).toBe(true);
      expect(isValidBitField(-0)).toBe(true);
      expect(isValidBitField(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isValidBitField(Number.NEGATIVE_INFINITY)).toBe(false);
      expect(isValidBitField(Number.NaN)).toBe(false);
    });
  });
});