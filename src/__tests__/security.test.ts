import { hasPermission, fromBitField, combinePermissions } from '../core/bitfield';
import { collapseRoles, normalizeRole } from '../core/roles';
import { PERMISSION_MASKS } from '../constants/masks';
import { AccessControlException } from '../types/errors';

describe('Security Tests - Permission Escalation Prevention', () => {
  describe('Malicious bitfield attacks', () => {
    it('should prevent -1 bitfield attack (all bits set)', () => {
      // -1 in binary has all bits set, which could bypass permission checks
      expect(() => hasPermission(-1, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => fromBitField(-1)).toThrow(AccessControlException);
    });

    it('should prevent extremely large number attacks', () => {
      const maliciousBitfield = 0x100000000; // 2^32, exceeds 32-bit limit
      expect(() => hasPermission(maliciousBitfield, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => fromBitField(maliciousBitfield)).toThrow(AccessControlException);
      
      const maxSafeIntegerAttack = Number.MAX_SAFE_INTEGER;
      expect(() => hasPermission(maxSafeIntegerAttack, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => fromBitField(maxSafeIntegerAttack)).toThrow(AccessControlException);
    });

    it('should prevent floating point attacks', () => {
      expect(() => hasPermission(1.5, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => hasPermission(3.14159, PERMISSION_MASKS.CREATE)).toThrow(AccessControlException);
    });

    it('should prevent NaN and Infinity attacks', () => {
      expect(() => hasPermission(NaN, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => hasPermission(Infinity, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => hasPermission(-Infinity, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
    });

    it('should allow future permission bits but prevent overflow attacks', () => {
      // Future permission bits should be allowed (extensibility)
      expect(() => hasPermission(16, PERMISSION_MASKS.READ)).not.toThrow(); // 0b10000 - future bit
      expect(() => hasPermission(32, PERMISSION_MASKS.READ)).not.toThrow(); // 0b100000 - future bit
      expect(() => hasPermission(64, PERMISSION_MASKS.READ)).not.toThrow(); // 0b1000000 - future bit
      
      // But prevent actual overflow attacks
      expect(() => hasPermission(0x100000000, PERMISSION_MASKS.READ)).toThrow(AccessControlException); // 2^32
      expect(() => hasPermission(-1, PERMISSION_MASKS.READ)).toThrow(AccessControlException); // All bits set
    });
  });

  describe('Role manipulation attacks', () => {
    it('should prevent malicious role permissions in normalizeRole', () => {
      const maliciousRole = {
        id: 'malicious',
        name: 'Malicious Role',
        access: [
          {
            zone: { name: 'content' },
            permission: -1, // Malicious permission value
          },
        ],
      };

      expect(() => normalizeRole(maliciousRole)).toThrow(AccessControlException);
    });

    it('should prevent malicious permissions in collapseRoles', () => {
      const maliciousRoles = [
        {
          id: 'role1',
          name: 'Role 1',
          access: { content: 0x100000000 }, // Malicious permission value (2^32)
        },
      ];

      expect(() => collapseRoles(maliciousRoles)).toThrow(AccessControlException);
    });

    it('should prevent mixed valid/invalid permissions in collapseRoles', () => {
      const mixedRoles = [
        {
          id: 'role1',
          name: 'Valid Role',
          access: { content: PERMISSION_MASKS.READ },
        },
        {
          id: 'role2',
          name: 'Malicious Role',
          access: { content: -1 }, // Malicious permission value
        },
      ];

      expect(() => collapseRoles(mixedRoles)).toThrow(AccessControlException);
    });
  });

  describe('Combination attacks', () => {
    it('should prevent malicious values in combinePermissions', () => {
      expect(() => combinePermissions(PERMISSION_MASKS.READ, -1)).toThrow(AccessControlException);
      expect(() => combinePermissions(0x100000000, PERMISSION_MASKS.CREATE)).toThrow(AccessControlException);
      expect(() => combinePermissions(PERMISSION_MASKS.READ, 1.5)).toThrow(AccessControlException);
    });

    it('should prevent all malicious values in combinePermissions', () => {
      expect(() => combinePermissions(-1, 0x100000000, 1.5)).toThrow(AccessControlException);
    });
  });

  describe('Boundary condition attacks', () => {
    it('should allow maximum valid permission', () => {
      expect(() => hasPermission(PERMISSION_MASKS.ADMIN, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(PERMISSION_MASKS.ADMIN)).not.toThrow();
    });

    it('should allow reasonable expansion above current permissions', () => {
      const futurePermission = PERMISSION_MASKS.ADMIN + 1; // 16 - future permission bit
      expect(() => hasPermission(futurePermission, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(futurePermission)).not.toThrow();
      
      // But reject values that exceed 32-bit limit
      const justAboveMax = 0x100000000; // 2^32
      expect(() => hasPermission(justAboveMax, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => fromBitField(justAboveMax)).toThrow(AccessControlException);
    });

    it('should allow minimum valid permission', () => {
      expect(() => hasPermission(0, PERMISSION_MASKS.READ)).not.toThrow();
      expect(() => fromBitField(0)).not.toThrow();
    });

    it('should reject just below minimum valid permission', () => {
      expect(() => hasPermission(-1, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      expect(() => fromBitField(-1)).toThrow(AccessControlException);
    });
  });

  describe('Real-world attack scenarios', () => {
    it('should prevent privilege escalation via malformed role data', () => {
      // Simulate data that might come from a compromised database or API
      const suspiciousRoleData = {
        id: 'admin-bypass',
        name: 'Suspicious Role',
        access: [
          {
            zone: { name: 'admin' },
            permission: Number.MAX_SAFE_INTEGER, // Attempt to get all permissions
          },
        ],
      };

      expect(() => normalizeRole(suspiciousRoleData)).toThrow(AccessControlException);
    });

    it('should prevent bitwise manipulation attacks', () => {
      // Attacker tries to use bitwise NOT to flip all bits
      const flippedBits = ~0; // All bits set (equivalent to -1)
      expect(() => hasPermission(flippedBits, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
    });

    it('should prevent JavaScript number coercion attacks', () => {
      // These would normally coerce to numbers in JavaScript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => hasPermission(true as any, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => hasPermission('15' as any, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => hasPermission([] as any, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => hasPermission({} as any, PERMISSION_MASKS.READ)).toThrow(AccessControlException);
    });
  });

  describe('Error message security', () => {
    it('should not leak sensitive information in error messages', () => {
      try {
        hasPermission(-1, PERMISSION_MASKS.READ);
        expect.fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(AccessControlException);
        const message = (error as AccessControlException).message;
        
        // Should contain validation info but not expose internal system details
        expect(message).toContain('Invalid');
        expect(message).toContain('permission');
        
        // Should not contain sensitive system information
        expect(message).not.toContain('password');
        expect(message).not.toContain('secret');
        expect(message).not.toContain('token');
      }
    });

    it('should provide helpful but safe error context', () => {
      try {
        fromBitField(0x100000000); // 2^32 - exceeds 32-bit limit
        expect.fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(AccessControlException);
        const message = (error as AccessControlException).message;
        
        // Should help developers debug without exposing security details
        expect(message).toContain('bitfield conversion input');
        expect(message).toContain('32-bit limit');
      }
    });
  });
});