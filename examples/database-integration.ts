import {
  normalizeRole,
  checkPermission,
  PERMISSION_MASKS,
  RoleWithAccess,
  NormalizedRole
} from 'access-zones';

// Example: Database Integration
//
// This example shows how to integrate with a database while handling multi-tenancy.
// Important: Tenant isolation should be handled at the database query level, not in the RBAC library.
// The RBAC library focuses purely on role-based permissions within a tenant context.

// Simulate database models (e.g., Prisma, TypeORM, etc.)
// Note: Multi-tenancy is handled at the database query level, not in the RBAC library
interface DatabaseRole {
  id: string;
  name: string;
  description: string;
  tenantId: string; // Tenant isolation handled in database queries
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: string;
    zone: {
      id: string;
      name: string;
    };
    permission: number;
  }>;
}

interface DatabaseUser {
  id: string;
  email: string;
  tenantId: string; // Tenant isolation handled in database queries
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
    email: dbUser.email,
    roles: normalizedRoles
  };
}

// Example usage with mock database data
const mockDatabaseRole: DatabaseRole = {
  id: 'role-123',
  name: 'Content Manager',
  description: 'Can manage all content',
  tenantId: 'tenant-456', // Tenant isolation handled at query level
  createdAt: new Date(),
  updatedAt: new Date(),
  permissions: [
    {
      id: 'perm-1',
      zone: { id: 'zone-1', name: 'content' },
      permission: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
    },
    {
      id: 'perm-2', 
      zone: { id: 'zone-2', name: 'files' },
      permission: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
    }
  ]
};

const mockDatabaseUser: DatabaseUser = {
  id: 'user-789',
  email: 'user@example.com',
  tenantId: 'tenant-456', // Tenant isolation handled at query level
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
  // Proper tenant isolation: always filter by tenantId in database queries
  async getUserPermissions(userId: string, tenantId: string) {
    // Simulate database query with tenant isolation
    // In real app: await db.user.findUnique({ 
    //   where: { id: userId, tenantId }, 
    //   include: { roles: { include: { permissions: { include: { zone: true } } } } }
    // })
    const dbUser = mockDatabaseUser;
    return transformDatabaseUser(dbUser);
  }

  async checkUserPermission(userId: string, tenantId: string, requiredPermissions: Record<string, number>) {
    const user = await this.getUserPermissions(userId, tenantId);
    return checkPermission(requiredPermissions, user.roles);
  }

  async assertUserPermission(userId: string, tenantId: string, requiredPermissions: Record<string, number>) {
    const user = await this.getUserPermissions(userId, tenantId);
    return assertAccess(requiredPermissions, user.roles);
  }

  // Example: Get all users in a tenant with specific permission
  async getUsersWithPermission(tenantId: string, zone: string, permission: number) {
    // Database query would filter by tenantId first, then check permissions
    // This ensures complete tenant isolation at the data layer
    // In real app: complex query joining users, roles, permissions filtered by tenantId
    return []; // Placeholder
  }
}

// Usage
const permissionService = new PermissionService();

async function exampleUsage() {
  const tenantId = 'tenant-456';
  const hasPermission = await permissionService.checkUserPermission('user-789', tenantId, {
    content: PERMISSION_MASKS.READ
  });
  
  console.log('User has read permission:', hasPermission);
}

// Note: This would be async in a real application
console.log('Service created successfully');
