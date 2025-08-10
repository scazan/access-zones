import { 
  normalizeRole, 
  normalizeRoles, 
  collapseRoles, 
  getGlobalPermissions,
  userHasRole,
  userHasAnyRole,
  userHasAllRoles,
  getUserZones,
  getUserZonesWithPermission
} from '../core/roles';
import { RoleWithAccess, UserWithRoles } from '../types/roles';
import { PERMISSION_MASKS } from '../constants/masks';

describe('Role management', () => {
  const mockRoleWithAccess: RoleWithAccess = {
    id: 'role1',
    name: 'Editor',
    description: 'Can edit content',
    siteId: 'site1',
    createdAt: new Date(),
    updatedAt: new Date(),
    access: [
      {
        zone: { id: 'zone1', name: 'content', siteId: 'site1' },
        permission: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      },
      {
        zone: { id: 'zone2', name: 'admin', siteId: 'site1' },
        permission: PERMISSION_MASKS.READ,
      },
    ],
  };

  const mockUser: UserWithRoles = {
    id: 'user1',
    siteId: 'site1',
    roles: [
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
    ],
  };

  describe('normalizeRole', () => {
    it('should convert role with access to normalized format', () => {
      const result = normalizeRole(mockRoleWithAccess);
      
      expect(result).toEqual({
        id: 'role1',
        name: 'Editor',
        access: {
          content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
          admin: PERMISSION_MASKS.READ,
        },
      });
    });
  });

  describe('normalizeRoles', () => {
    it('should convert multiple roles to normalized format', () => {
      const roles = [mockRoleWithAccess];
      const result = normalizeRoles(roles);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'role1',
        name: 'Editor',
        access: {
          content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
          admin: PERMISSION_MASKS.READ,
        },
      });
    });
  });

  describe('collapseRoles', () => {
    it('should combine permissions from multiple roles using OR operation', () => {
      const result = collapseRoles(mockUser.roles);
      
      expect(result).toEqual({
        content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
        admin: PERMISSION_MASKS.READ,
        users: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      });
    });

    it('should handle empty roles array', () => {
      const result = collapseRoles([]);
      expect(result).toEqual({});
    });
  });

  describe('getGlobalPermissions', () => {
    it('should convert collapsed roles to boolean permissions', () => {
      const result = getGlobalPermissions(mockUser);
      
      expect(result).toEqual({
        content: {
          create: true,
          read: true,
          update: true,
          delete: false,
        },
        admin: {
          create: false,
          read: true,
          update: false,
          delete: false,
        },
        users: {
          create: false,
          read: true,
          update: true,
          delete: false,
        },
      });
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has the role', () => {
      const result = userHasRole(mockUser, 'Editor');
      expect(result).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const result = userHasRole(mockUser, 'Admin');
      expect(result).toBe(false);
    });
  });

  describe('userHasAnyRole', () => {
    it('should return true when user has any of the roles', () => {
      const result = userHasAnyRole(mockUser, ['Admin', 'Editor']);
      expect(result).toBe(true);
    });

    it('should return false when user has none of the roles', () => {
      const result = userHasAnyRole(mockUser, ['Admin', 'SuperUser']);
      expect(result).toBe(false);
    });
  });

  describe('userHasAllRoles', () => {
    it('should return true when user has all of the roles', () => {
      const result = userHasAllRoles(mockUser, ['Editor', 'Viewer']);
      expect(result).toBe(true);
    });

    it('should return false when user is missing some roles', () => {
      const result = userHasAllRoles(mockUser, ['Editor', 'Admin']);
      expect(result).toBe(false);
    });
  });

  describe('getUserZones', () => {
    it('should return all zones user has permissions for', () => {
      const result = getUserZones(mockUser);
      expect(result.sort()).toEqual(['admin', 'content', 'users']);
    });
  });

  describe('getUserZonesWithPermission', () => {
    it('should return zones where user has specific permission', () => {
      const result = getUserZonesWithPermission(mockUser, 'create');
      expect(result).toEqual(['content']);
    });

    it('should return zones where user has read permission', () => {
      const result = getUserZonesWithPermission(mockUser, 'read');
      expect(result.sort()).toEqual(['admin', 'content', 'users']);
    });

    it('should return empty array when user has no zones with permission', () => {
      const result = getUserZonesWithPermission(mockUser, 'delete');
      expect(result).toEqual([]);
    });
  });
});