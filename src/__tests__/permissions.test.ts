import { checkPermission, assertAccess, assertDataAccess, getUserPermissions } from '../core/permissions';
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
  });
});