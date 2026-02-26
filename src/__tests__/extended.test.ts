import { defineExtendedPermissions } from '../core/extended';
import { PERMISSION_MASKS } from '../constants/masks';

const decisionPermissions = defineExtendedPermissions({
  INVITE_MEMBERS: { label: 'Invite Members' },
  REVIEW: { label: 'Review' },
  SUBMIT_PROPOSALS: { label: 'Submit Proposals' },
  VOTE: { label: 'Vote' },
});

describe('defineExtendedPermissions', () => {
  describe('masks', () => {
    it('should auto-assign bits starting from bit 5', () => {
      expect(decisionPermissions.masks.INVITE_MEMBERS).toBe(1 << 5);   // 32
      expect(decisionPermissions.masks.REVIEW).toBe(1 << 6);           // 64
      expect(decisionPermissions.masks.SUBMIT_PROPOSALS).toBe(1 << 7); // 128
      expect(decisionPermissions.masks.VOTE).toBe(1 << 8);             // 256
    });

    it('should not overlap with base ACRUD bits', () => {
      const acrudBits =
        PERMISSION_MASKS.ADMIN | PERMISSION_MASKS.CREATE |
        PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE;

      for (const mask of Object.values(decisionPermissions.masks)) {
        expect(mask & acrudBits).toBe(0);
      }
    });
  });

  describe('extendedBitsMask', () => {
    it('should be the OR of all extended masks', () => {
      expect(decisionPermissions.extendedBitsMask).toBe(32 | 64 | 128 | 256); // 480
    });
  });

  describe('crudBitsMask', () => {
    it('should cover bits 0-3 (CRUD without admin)', () => {
      expect(decisionPermissions.crudBitsMask).toBe(
        PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
        PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE,
      );
      // Admin (bit 4, value 16) should NOT be included
      expect(decisionPermissions.crudBitsMask & PERMISSION_MASKS.ADMIN).toBe(0);
    });
  });

  describe('toBitField', () => {
    it('should convert all-false to 0', () => {
      const result = decisionPermissions.toBitField({
        admin: false, create: false, read: false, update: false, delete: false,
        inviteMembers: false, review: false, submitProposals: false, vote: false,
      });
      expect(result).toBe(0);
    });

    it('should handle only ACRUD bits', () => {
      const result = decisionPermissions.toBitField({
        admin: false, create: true, read: true, update: false, delete: false,
        inviteMembers: false, review: false, submitProposals: false, vote: false,
      });
      expect(result).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ);
    });

    it('should handle only extended bits', () => {
      const result = decisionPermissions.toBitField({
        admin: false, create: false, read: false, update: false, delete: false,
        inviteMembers: true, review: false, submitProposals: false, vote: true,
      });
      expect(result).toBe(32 | 256);
    });

    it('should handle mixed ACRUD + extended bits', () => {
      const result = decisionPermissions.toBitField({
        admin: true, create: false, read: true, update: false, delete: false,
        inviteMembers: false, review: true, submitProposals: false, vote: true,
      });
      expect(result).toBe(
        PERMISSION_MASKS.ADMIN | PERMISSION_MASKS.READ | 64 | 256,
      );
    });

    it('should produce correct combined value when all true', () => {
      const result = decisionPermissions.toBitField({
        admin: true, create: true, read: true, update: true, delete: true,
        inviteMembers: true, review: true, submitProposals: true, vote: true,
      });
      const expected =
        PERMISSION_MASKS.ADMIN | PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
        PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE |
        32 | 64 | 128 | 256;
      expect(result).toBe(expected);
    });
  });

  describe('fromBitField', () => {
    it('should convert 0 to all-false', () => {
      const result = decisionPermissions.fromBitField(0);
      expect(result).toEqual({
        admin: false, create: false, read: false, update: false, delete: false,
        inviteMembers: false, review: false, submitProposals: false, vote: false,
      });
    });

    it('should decode ACRUD bits correctly', () => {
      const result = decisionPermissions.fromBitField(
        PERMISSION_MASKS.CREATE | PERMISSION_MASKS.DELETE,
      );
      expect(result.create).toBe(true);
      expect(result.delete).toBe(true);
      expect(result.read).toBe(false);
      expect(result.inviteMembers).toBe(false);
    });

    it('should decode extended bits correctly', () => {
      const result = decisionPermissions.fromBitField(64 | 128);
      expect(result.review).toBe(true);
      expect(result.submitProposals).toBe(true);
      expect(result.vote).toBe(false);
      expect(result.read).toBe(false);
    });

    it('should throw on invalid bitfield', () => {
      expect(() => decisionPermissions.fromBitField(-1)).toThrow();
      expect(() => decisionPermissions.fromBitField(NaN)).toThrow();
    });
  });

  describe('toBitField / fromBitField round-trip', () => {
    it('should round-trip correctly', () => {
      const original = {
        admin: false, create: true, read: true, update: false, delete: false,
        inviteMembers: true, review: false, submitProposals: true, vote: false,
      } as const;

      const bitField = decisionPermissions.toBitField(original);
      const decoded = decisionPermissions.fromBitField(bitField);
      expect(decoded).toEqual(original);
    });

    it('should round-trip all-true', () => {
      const allTrue = {
        admin: true, create: true, read: true, update: true, delete: true,
        inviteMembers: true, review: true, submitProposals: true, vote: true,
      } as const;

      expect(decisionPermissions.fromBitField(decisionPermissions.toBitField(allTrue))).toEqual(allTrue);
    });
  });

  describe('labels', () => {
    it('should include base ACRUD labels', () => {
      expect(decisionPermissions.labels.admin).toBe('Admin');
      expect(decisionPermissions.labels.create).toBe('Create');
      expect(decisionPermissions.labels.read).toBe('Read');
      expect(decisionPermissions.labels.update).toBe('Update');
      expect(decisionPermissions.labels.delete).toBe('Delete');
    });

    it('should include extended labels with camelCase keys', () => {
      expect(decisionPermissions.labels.inviteMembers).toBe('Invite Members');
      expect(decisionPermissions.labels.review).toBe('Review');
      expect(decisionPermissions.labels.submitProposals).toBe('Submit Proposals');
      expect(decisionPermissions.labels.vote).toBe('Vote');
    });
  });

  describe('validation', () => {
    it('should throw when >27 extended permissions are defined', () => {
      const tooMany: Record<string, { label: string }> = {};
      for (let i = 0; i < 28; i++) {
        tooMany[`PERM_${i}`] = { label: `Perm ${i}` };
      }
      expect(() => defineExtendedPermissions(tooMany)).toThrow(/Too many extended permissions/);
    });

    it('should allow exactly 27 extended permissions', () => {
      const maxConfig: Record<string, { label: string }> = {};
      for (let i = 0; i < 27; i++) {
        maxConfig[`PERM_${i}`] = { label: `Perm ${i}` };
      }
      expect(() => defineExtendedPermissions(maxConfig)).not.toThrow();
    });
  });

  describe('single permission definition', () => {
    it('should work with a single extended permission', () => {
      const single = defineExtendedPermissions({
        SPECIAL: { label: 'Special' },
      });
      expect(single.masks.SPECIAL).toBe(32);
      expect(single.extendedBitsMask).toBe(32);
    });
  });
});
