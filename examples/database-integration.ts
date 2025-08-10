import {
  normalizeRole,
  checkPermission,
  PERMISSION_MASKS,
  RoleWithAccess,
  NormalizedRole
} from 'rbac-zones';

// Example: Database Integration

// Simulate database models (e.g., Prisma, TypeORM, etc.)
interface DatabaseRole {
  id: string;
  name: string;
  description: string;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: string;
    zone: {
      id: string;
      name: string;
      siteId: string;
    };
    permission: number;
  }>;
}

interface DatabaseUser {
  id: string;
  email: string;
  siteId: string;
  roles: Array<{
    roleId: string;
    role: DatabaseRole;
  }>;
}

// Transform database role to library format
function transformDatabaseRole(dbRole: DatabaseRole): RoleWithAccess {
  return {
    id: dbRole.id,
    name: dbRole.name,
    description: dbRole.description,
    siteId: dbRole.siteId,
    createdAt: dbRole.createdAt,
    updatedAt: dbRole.updatedAt,
    access: dbRole.permissions.map(perm => ({
      zone: perm.zone,
      permission: perm.permission
    }))
  };
}

// Transform database user to library format
function transformDatabaseUser(dbUser: DatabaseUser) {
  const normalizedRoles = dbUser.roles.map(userRole => {
    const roleWithAccess = transformDatabaseRole(userRole.role);
    return normalizeRole(roleWithAccess);
  });

  return {
    id: dbUser.id,
    siteId: dbUser.siteId,
    email: dbUser.email,
    roles: normalizedRoles
  };
}

// Example usage with mock database data
const mockDatabaseRole: DatabaseRole = {
  id: 'role-123',
  name: 'Content Manager',
  description: 'Can manage all content',
  siteId: 'site-456',
  createdAt: new Date(),
  updatedAt: new Date(),
  permissions: [
    {
      id: 'perm-1',
      zone: { id: 'zone-1', name: 'content', siteId: 'site-456' },
      permission: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
    },
    {
      id: 'perm-2', 
      zone: { id: 'zone-2', name: 'files', siteId: 'site-456' },
      permission: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
    }
  ]
};

const mockDatabaseUser: DatabaseUser = {
  id: 'user-789',
  email: 'user@example.com',
  siteId: 'site-456',
  roles: [
    {
      roleId: 'role-123',
      role: mockDatabaseRole
    }
  ]
};

// Transform and use
console.log('=== Database Integration Example ===');

const transformedUser = transformDatabaseUser(mockDatabaseUser);
console.log('Transformed user roles:', transformedUser.roles);

// Now use with permission checking
const canEditContent = checkPermission(
  { content: PERMISSION_MASKS.UPDATE },
  transformedUser.roles
);
console.log('Can edit content:', canEditContent);

// Example service class for database operations
class PermissionService {
  async getUserPermissions(userId: string) {
    // Simulate database query
    const dbUser = mockDatabaseUser; // In real app: await db.user.findUnique(...)
    return transformDatabaseUser(dbUser);
  }

  async checkUserPermission(userId: string, requiredPermissions: Record<string, number>) {
    const user = await this.getUserPermissions(userId);
    return checkPermission(requiredPermissions, user.roles);
  }

  async assertUserPermission(userId: string, requiredPermissions: Record<string, number>) {
    const user = await this.getUserPermissions(userId);
    return assertAccess(requiredPermissions, user.roles);
  }
}

// Usage
const permissionService = new PermissionService();

async function exampleUsage() {
  const hasPermission = await permissionService.checkUserPermission('user-789', {
    content: PERMISSION_MASKS.READ
  });
  
  console.log('User has read permission:', hasPermission);
}

// Note: This would be async in a real application
console.log('Service created successfully');
