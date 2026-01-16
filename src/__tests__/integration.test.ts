import {
  checkPermission,
  assertAccess,
  PERMISSION_MASKS,
  collapseRoles,
  getGlobalPermissions,
  normalizeRole,
  toBitField,
  fromBitField,
} from '../index';
import { RoleWithAccess, UserWithRoles } from '../types/roles';

describe('Integration tests', () => {
  // Mock data that resembles what would come from database
  const mockRoleWithAccess: RoleWithAccess = {
    id: 'role1',
    name: 'Content Manager',
    description: 'Can manage content',
    createdAt: new Date(),
    updatedAt: new Date(),
    access: [
      {
        zone: { id: 'zone1', name: 'content' },
        permission: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      },
      {
        zone: { id: 'zone2', name: 'users' },
        permission: PERMISSION_MASKS.READ,
      },
    ],
  };

  const mockUser: UserWithRoles = {
    id: 'user1',
    roles: [normalizeRole(mockRoleWithAccess)],
  };

  it('should handle complete workflow from database to permission checking', () => {
    // 1. Normalize role from database format
    const normalizedRole = normalizeRole(mockRoleWithAccess);
    expect(normalizedRole.access.content).toBe(14); // CREATE | READ | UPDATE

    // 2. Get global permissions for user
    const globalPermissions = getGlobalPermissions(mockUser);
    expect(globalPermissions.content).toEqual({
      create: true,
      read: true,
      update: true,
      delete: false,
      admin: false,
    });

    // 3. Check specific permissions
    const canCreateContent = checkPermission(
      { content: PERMISSION_MASKS.CREATE },
      mockUser.roles
    );
    expect(canCreateContent).toBe(true);

    const canDeleteContent = checkPermission(
      { content: PERMISSION_MASKS.DELETE },
      mockUser.roles
    );
    expect(canDeleteContent).toBe(false);

    // 4. Check multiple zone permissions
    const canReadContentAndUsers = checkPermission(
      { 
        content: PERMISSION_MASKS.READ,
        users: PERMISSION_MASKS.READ 
      },
      mockUser.roles
    );
    expect(canReadContentAndUsers).toBe(true);

    // 5. Assert access (should not throw)
    expect(() => {
      assertAccess({ content: PERMISSION_MASKS.UPDATE }, mockUser.roles);
    }).not.toThrow();

    // 6. Assert access (should throw)
    expect(() => {
      assertAccess({ admin: PERMISSION_MASKS.READ }, mockUser.roles);
    }).toThrow();
  });

  it('should handle bitfield conversions correctly', () => {
    const permission = {
      create: true,
      read: true,
      update: false,
      delete: false,
      admin: false,
    };

    // Convert to bitfield
    const bitField = toBitField(permission);
    expect(bitField).toBe(12); // 8 + 4

    // Convert back to permission object
    const restored = fromBitField(bitField);
    expect(restored).toEqual(permission);
  });

  it('should collapse multiple roles correctly', () => {
    const role1 = {
      id: 'role1',
      name: 'Editor',
      access: {
        content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ,
        admin: PERMISSION_MASKS.READ,
      },
    };

    const role2 = {
      id: 'role2',
      name: 'Viewer',
      access: {
        content: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
        users: PERMISSION_MASKS.READ,
      },
    };

    const collapsed = collapseRoles([role1, role2]);
    
    // Content should have CREATE | READ | UPDATE (from both roles)
    expect(collapsed.content).toBe(PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE);
    
    // Admin should have READ (from role1 only)
    expect(collapsed.admin).toBe(PERMISSION_MASKS.READ);
    
    // Users should have READ (from role2 only)
    expect(collapsed.users).toBe(PERMISSION_MASKS.READ);
  });

  it('should demonstrate backward compatibility', async () => {
    // Legacy imports should still work
    const { permission } = await import('../index');
    

    expect(permission.ADMIN).toBe(PERMISSION_MASKS.ADMIN);
  });
});
