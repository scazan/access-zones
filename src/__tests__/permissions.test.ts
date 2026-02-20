import { checkPermission, assertAccess, assertDataAccess, getUserPermissions, transformItemAccessSchema, hasPermissions, userHasZonePermission, getUserZonePermissions } from '../core/permissions';
import { AccessControlException } from '../types/errors';
import { PERMISSION_MASKS } from '../constants/masks';
import { NormalizedRole, UserWithZonePermissions } from '../types/roles';

describe('Permission checking', () => {
  const mockRoles: NormalizedRole[] = [
    {
      id: 'role1',
      name: 'Editor',
      access: {
        content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
        admin: PERMISSION_MASKS.READ,
      },
    },
    {
      id: 'role2',
      name: 'Viewer',
      access: {
        content: PERMISSION_MASKS.READ,
        users: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      },
    },
  ];

  describe('checkPermission', () => {
    it('should return true when user has required permissions', () => {
      const needed = {
        content: PERMISSION_MASKS.READ,
        admin: PERMISSION_MASKS.READ,
      };
      
      const result = checkPermission(needed, mockRoles);
      expect(result).toBe(true);
    });

    it('should return false when user lacks required permissions', () => {
      const needed = {
        content: PERMISSION_MASKS.DELETE,
      };
      
      const result = checkPermission(needed, mockRoles);
      expect(result).toBe(false);
    });

    it('should handle combined permissions from multiple roles', () => {
      const needed = {
        content: PERMISSION_MASKS.CREATE,
        users: PERMISSION_MASKS.UPDATE,
      };
      
      const result = checkPermission(needed, mockRoles);
      expect(result).toBe(true);
    });

    it('should ignore zero permissions', () => {
      const needed = {
        content: PERMISSION_MASKS.READ,
        admin: 0,
      };
      
      const result = checkPermission(needed, mockRoles);
      expect(result).toBe(true);
    });

    it('should return true when no permissions needed', () => {
      const result = checkPermission({}, mockRoles);
      expect(result).toBe(true);
    });

    it('should return true for array when any item passes (OR logic)', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE }, // fails
        { content: PERMISSION_MASKS.READ },   // passes
      ];

      expect(checkPermission(needed, mockRoles)).toBe(true);
    });

    it('should return false for array when all items fail', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { admin: PERMISSION_MASKS.UPDATE },
      ];

      expect(checkPermission(needed, mockRoles)).toBe(false);
    });

    it('should handle array with single passing item same as non-array', () => {
      expect(checkPermission({ content: PERMISSION_MASKS.READ }, mockRoles)).toBe(true);
      expect(checkPermission([{ content: PERMISSION_MASKS.READ }], mockRoles)).toBe(true);
    });

    it('should handle array with single failing item same as non-array', () => {
      expect(checkPermission({ content: PERMISSION_MASKS.DELETE }, mockRoles)).toBe(false);
      expect(checkPermission([{ content: PERMISSION_MASKS.DELETE }], mockRoles)).toBe(false);
    });

    it('should return true for empty array (no permissions needed)', () => {
      expect(checkPermission([], mockRoles)).toBe(true);
    });

    it('should require all zones within a single array item (AND within OR)', () => {
      const needed = [
        // content:DELETE AND admin:UPDATE — both fail
        { content: PERMISSION_MASKS.DELETE, admin: PERMISSION_MASKS.UPDATE },
        // content:READ AND users:READ — both pass (from different roles)
        { content: PERMISSION_MASKS.READ, users: PERMISSION_MASKS.READ },
      ];

      expect(checkPermission(needed, mockRoles)).toBe(true);
    });

    it('should fail when no array item has all its zones satisfied', () => {
      const needed = [
        // content:CREATE passes but admin:UPDATE fails
        { content: PERMISSION_MASKS.CREATE, admin: PERMISSION_MASKS.UPDATE },
        // users:UPDATE passes but content:DELETE fails
        { users: PERMISSION_MASKS.UPDATE, content: PERMISSION_MASKS.DELETE },
      ];

      expect(checkPermission(needed, mockRoles)).toBe(false);
    });

    it('should pass when array contains an empty object item', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE }, // fails
        {},                                    // no permissions needed -> passes
      ];

      expect(checkPermission(needed, mockRoles)).toBe(true);
    });

    it('should pass when array item has only zero permissions', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE }, // fails
        { content: 0 },                       // zero stripped -> {} -> passes
      ];

      expect(checkPermission(needed, mockRoles)).toBe(true);
    });
  });

  describe('assertAccess', () => {
    it('should not throw when user has required permissions', () => {
      const needed = {
        content: PERMISSION_MASKS.READ,
      };
      
      expect(() => assertAccess(needed, mockRoles)).not.toThrow();
    });

    it('should throw AccessControlException when user lacks permissions', () => {
      const needed = {
        content: PERMISSION_MASKS.DELETE,
      };

      expect(() => assertAccess(needed, mockRoles)).toThrow(AccessControlException);
    });

    it('should not throw for array when any item passes', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { content: PERMISSION_MASKS.READ },
      ];

      expect(() => assertAccess(needed, mockRoles)).not.toThrow();
    });

    it('should throw for array when all items fail', () => {
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { admin: PERMISSION_MASKS.UPDATE },
      ];

      expect(() => assertAccess(needed, mockRoles)).toThrow(AccessControlException);
    });
  });

  describe('assertDataAccess', () => {
    const mockUser: UserWithZonePermissions = {
      id: 'user1',
      roles: mockRoles,
      access: {},
    };

    it('should return true for owned data', () => {
      const data = { userId: 'user1' };
      const needed = { content: PERMISSION_MASKS.DELETE };
      
      const result = assertDataAccess(data, needed, mockUser);
      expect(result).toBe(true);
    });

    it('should check permissions for non-owned data', () => {
      const data = { userId: 'other-user' };
      const needed = { content: PERMISSION_MASKS.READ };
      
      const result = assertDataAccess(data, needed, mockUser);
      expect(result).toBe(true);
    });

    it('should throw for insufficient permissions on non-owned data', () => {
      const data = { userId: 'other-user' };
      const needed = { content: PERMISSION_MASKS.DELETE };

      expect(() => assertDataAccess(data, needed, mockUser)).toThrow('Unauthorized');
    });

    it('should check permissions when data is undefined', () => {
      const needed = { content: PERMISSION_MASKS.READ };
      expect(assertDataAccess(undefined, needed, mockUser)).toBe(true);
    });

    it('should throw when data is undefined and permissions insufficient', () => {
      const needed = { content: PERMISSION_MASKS.DELETE };
      expect(() => assertDataAccess(undefined, needed, mockUser)).toThrow('Unauthorized');
    });

    it('should check permissions when data has no userId', () => {
      const needed = { content: PERMISSION_MASKS.READ };
      expect(assertDataAccess({}, needed, mockUser)).toBe(true);
    });

    it('should check array permissions for non-owned data (OR logic)', () => {
      const data = { userId: 'other-user' };
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { content: PERMISSION_MASKS.READ },
      ];

      expect(assertDataAccess(data, needed, mockUser)).toBe(true);
    });

    it('should throw for non-owned data when all array items fail', () => {
      const data = { userId: 'other-user' };
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { admin: PERMISSION_MASKS.UPDATE },
      ];

      expect(() => assertDataAccess(data, needed, mockUser)).toThrow('Unauthorized');
    });

    it('should bypass array permission checks for owned data', () => {
      const data = { userId: 'user1' };
      const needed = [
        { content: PERMISSION_MASKS.DELETE },
        { admin: PERMISSION_MASKS.DELETE },
      ];

      expect(assertDataAccess(data, needed, mockUser)).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    const mockUser = {
      id: 'user1',
      roles: mockRoles,
    };

    it('should return admin permissions for item owner', () => {
      const item = {
        uid: 'user1',
        settings: {
          access: {
            global: PERMISSION_MASKS.READ,
          },
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: true,
      });
    });

    it('should apply global restrictions', () => {
      const item = {
        uid: 'other-user',
        settings: {
          access: {
            global: PERMISSION_MASKS.READ,
          },
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: false,
        read: true,
        update: false,
        delete: false,
        admin: false,
      });
    });

    it('should use role permissions when no access settings', () => {
      const item = {};

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });

    it('should handle user-specific permissions', () => {
      const item = {
        settings: {
          access: {
            users: [
              {
                uid: 'user1',
                access: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
              },
            ],
          },
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: false,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });

    it('should return admin permissions for object-style uid owner', () => {
      const item = {
        uid: { id: 'user1', email: 'test@example.com' },
        settings: {
          access: {
            global: PERMISSION_MASKS.READ,
          },
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: true,
        admin: true,
      });
    });

    it('should handle user-specific permissions as Permission object', () => {
      const item = {
        settings: {
          access: {
            users: [
              {
                uid: 'user1',
                access: { create: false, read: true, update: true, delete: false, admin: false },
              },
            ],
          },
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: false,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });

    it('should return all-false for nonexistent zone', () => {
      const item = {};
      const result = getUserPermissions(mockUser, item, 'nonexistent');
      expect(result).toEqual({
        create: false,
        read: false,
        update: false,
        delete: false,
        admin: false,
      });
    });

    it('should use role permissions when access settings exist but have no global or users', () => {
      const item = {
        uid: 'other-user',
        settings: {
          access: {},
        },
      };

      const result = getUserPermissions(mockUser, item, 'content');
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });
  });

  describe('transformItemAccessSchema', () => {
    it('should transform global bitfield to Permission object', () => {
      const result = transformItemAccessSchema({
        global: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      });

      expect(result.global).toEqual({
        create: false,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });

    it('should transform user-level bitfields to Permission objects', () => {
      const result = transformItemAccessSchema({
        users: [
          { uid: 'user1', access: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ },
        ],
      });

      expect(result.users).toEqual([
        {
          uid: 'user1',
          access: {
            create: true,
            read: true,
            update: false,
            delete: false,
            admin: false,
          },
        },
      ]);
    });

    it('should transform both global and users', () => {
      const result = transformItemAccessSchema({
        global: PERMISSION_MASKS.READ,
        users: [
          { uid: 'user1', access: PERMISSION_MASKS.CREATE },
        ],
      });

      expect(result.global).toEqual({
        create: false,
        read: true,
        update: false,
        delete: false,
        admin: false,
      });
      expect(result.users![0].access).toEqual({
        create: true,
        read: false,
        update: false,
        delete: false,
        admin: false,
      });
    });

    it('should handle empty users array', () => {
      const result = transformItemAccessSchema({ users: [] });
      expect(result.users).toEqual([]);
    });

    it('should handle input with no global or users', () => {
      const result = transformItemAccessSchema({});
      expect(result.global).toBeUndefined();
      expect(result.users).toBeUndefined();
    });
  });

  describe('hasPermissions', () => {
    it('should return true when global read permission is set', () => {
      const item = {
        settings: {
          access: {
            global: PERMISSION_MASKS.READ,
          },
        },
      };

      expect(hasPermissions({ roles: mockRoles }, item)).toBe(true);
    });

    it('should return true for legacy permissions === 0 (full access)', () => {
      const item = { settings: { permissions: 0 } };
      expect(hasPermissions({ roles: mockRoles }, item)).toBe(true);
    });

    it('should return true for legacy permissions === 1 with read-only', () => {
      const item = { settings: { permissions: 1 } };
      expect(hasPermissions({ roles: mockRoles }, item, false)).toBe(true);
    });

    it('should return false for legacy permissions === 1 with write', () => {
      const item = { settings: { permissions: 1 } };
      expect(hasPermissions({ roles: mockRoles }, item, true)).toBe(false);
    });

    it('should return false when no global or legacy permissions exist', () => {
      const item = {};
      expect(hasPermissions({ roles: mockRoles }, item)).toBe(false);
    });
  });

  describe('userHasZonePermission', () => {
    it('should return true when user has the permission in zone', () => {
      expect(userHasZonePermission({ roles: mockRoles }, 'content', PERMISSION_MASKS.READ)).toBe(true);
    });

    it('should return false when user lacks the permission in zone', () => {
      expect(userHasZonePermission({ roles: mockRoles }, 'content', PERMISSION_MASKS.DELETE)).toBe(false);
    });

    it('should return false for nonexistent zone', () => {
      expect(userHasZonePermission({ roles: mockRoles }, 'nonexistent', PERMISSION_MASKS.READ)).toBe(false);
    });
  });

  describe('getUserZonePermissions', () => {
    it('should return permissions for an existing zone', () => {
      const result = getUserZonePermissions({ roles: mockRoles }, 'content');
      expect(result).toEqual({
        create: true,
        read: true,
        update: true,
        delete: false,
        admin: false,
      });
    });

    it('should return all-false for nonexistent zone', () => {
      const result = getUserZonePermissions({ roles: mockRoles }, 'nonexistent');
      expect(result).toEqual({
        create: false,
        read: false,
        update: false,
        delete: false,
        admin: false,
      });
    });
  });
});